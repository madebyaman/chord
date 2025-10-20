import { DEFAULT_TIMEOUT, DEFAULTS } from "../utils/constants";
import type {
  KeySequenceConfig,
  ListenerGroup,
  KeyManager,
  HandlerInfo,
} from "../types";
import { normalizeShortcut, normalizeEvent } from "../utils/key-normalization";

/**
 * Internal representation of a registered sequence handler
 */
interface SequenceHandler {
  /** Unique identifier for this handler */
  id: number;

  /** Normalized sequence of keys */
  sequence: string[];

  /** Human-readable description */
  description: string;

  /** Category for grouping */
  category: string;

  /** Handler function to execute when sequence completes */
  onComplete: () => void;

  /** Whether the sequence is currently enabled */
  enabled: boolean;

  /** Timeout in milliseconds before sequence resets */
  timeout: number;

  /** Component that registered this sequence */
  component: string;

  /** Timestamp when registered */
  registeredAt: number;

  /** Event type this handler listens for */
  eventType: "keydown" | "keyup" | "keypress";

  /** Listener key for quick group lookup */
  listenerKey: string;
}

/**
 * KeySequence manager - handles multi-key sequence shortcuts (e.g., "g h", "g t")
 * Implements the KeyManager interface for registration and cleanup
 */
export class KeySequence
  implements KeyManager<KeySequenceConfig, SequenceHandler>
{
  private handlers: Map<number, SequenceHandler> = new Map();

  /** Persistent listeners for window only. Key is eventType like keydown. It  is used so we can have one listener per eventType. */
  private listeners: Map<string, ListenerGroup> = new Map();

  /** Current sequence buffer (normalized keys) */
  private buffer: { key: string; time: number }[] = [];

  /** Timeout timer for resetting buffer */
  private timer: NodeJS.Timeout | null = null;

  /** Get or create listener group for window */
  private getOrCreateListenerGroup(
    eventType: "keydown" | "keyup" | "keypress",
  ): ListenerGroup {
    const listenerKey = eventType;
    let group = this.listeners.get(listenerKey);

    if (!group) {
      const boundHandler = this.createListenerHandler(eventType);

      window.addEventListener(eventType, boundHandler);

      group = {
        handlerIds: new Set(),
        boundHandler,
        eventType,
      };

      this.listeners.set(listenerKey, group);
    }

    return group;
  }

  /** Clear buffer and timer */
  private clearBuffer(): void {
    this.buffer = [];
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /** Get enabled handlers for a specific listener group */
  private getEnabledHandlers(listenerKey: string): SequenceHandler[] {
    const group = this.listeners.get(listenerKey);
    if (!group) return [];

    const handlers: SequenceHandler[] = [];
    for (const id of group.handlerIds) {
      const handler = this.handlers.get(id);
      if (handler && handler.enabled) {
        handlers.push(handler);
      }
    }
    return handlers;
  }

  /** Check if buffer matches a sequence */
  private matchesSequence(
    buffer: typeof this.buffer,
    handler: SequenceHandler,
  ): "full" | "partial" | "none" {
    const sequence = handler.sequence;
    if (buffer.length > sequence.length) return "none";

    for (let i = 0; i < buffer.length; i++) {
      if (buffer[i].key !== sequence[i]) return "none";
    }

    // compare timeout
    const timeout = handler.timeout;
    const timePairs: number[] = buffer.map((b) => b.time);
    const timeoutPairs = timePairs.map((t) => t - buffer[0].time);
    console.log("[SEQUENCE] time pairs", timePairs);
    console.log("[SEQUENCE] timeout pairs", timeoutPairs);
    const maxTimeout = Math.max(...timeoutPairs);
    if (maxTimeout > timeout) return "none";

    return buffer.length === sequence.length ? "full" : "partial";
  }

  /** Create bound handler for event listener */
  private createListenerHandler(
    eventType: "keydown" | "keyup" | "keypress",
  ): (e: Event) => void {
    return (event: Event) => {
      if (!(event instanceof KeyboardEvent)) return;

      const normalizedKey = normalizeEvent(event);
      const listenerKey = eventType;

      this.buffer.push({ key: normalizedKey, time: Date.now() });

      // Get all enabled handlers
      const enabledHandlers = this.getEnabledHandlers(listenerKey);

      if (enabledHandlers.length === 0) {
        this.clearBuffer();
        return;
      }

      // Check for matches
      const fullMatches: SequenceHandler[] = [];
      const partialMatches: SequenceHandler[] = [];

      for (const handler of enabledHandlers) {
        const match = this.matchesSequence(this.buffer, handler);
        if (match === "full") {
          fullMatches.push(handler);
        } else if (match === "partial") {
          partialMatches.push(handler);
        }
      }

      // Execute full matches
      if (fullMatches.length > 0) {
        console.log("[SEQUENCE]: full match");
        if (partialMatches.length > 0) {
          console.log("[SEQUENCE]: full and partial match");
          // we should wait for the partial match to complete
          const maxTimeout = Math.max(...partialMatches.map((h) => h.timeout));
          if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
          }

          // Set new timer (keep buffer for continuation)
          this.timer = setTimeout(() => {
            console.log(
              "[SEQUENCE]: timeout, clearing buffer and executing complete matches",
            );
            this.clearBuffer();
            console.log(
              "[SEQUENCE]: executing",
              fullMatches.map((h) => h.sequence.join(" ")),
            );
            for (const handler of fullMatches) {
              handler.onComplete();
            }
          }, maxTimeout);
          console.log("[SEQUENCE]: setting timeout of ", maxTimeout);
          return;
        }
        console.log(
          "[SEQUENCE]: executing",
          fullMatches.map((h) => h.sequence.join(" ")),
        );
        for (const handler of fullMatches) {
          handler.onComplete();
        }
        this.clearBuffer();
        return;
      }

      // If partial matches exist, wait for continuation
      if (partialMatches.length > 0) {
        // Use maximum timeout among all partial matches
        const maxTimeout = Math.max(...partialMatches.map((h) => h.timeout));

        console.log("[SEQUENCE]: partial match, waiting", maxTimeout, "ms");

        // Clear existing timer and start new one
        if (this.timer) {
          clearTimeout(this.timer);
          this.timer = null;
        }

        // Set new timer (keep buffer for continuation)
        this.timer = setTimeout(() => {
          console.log("[SEQUENCE]: timeout, clearing buffer");
          this.clearBuffer();
        }, maxTimeout);

        return;
      }

      // No matches - reset buffer
      console.log("[SEQUENCE]: no match, clearing buffer");
      this.clearBuffer();
    };
  }

  /**
   * Register a new key sequence handler
   * @param config Configuration for the key sequence
   * @param id Pre-generated ID from Core
   * @returns The registered handler
   */
  register(config: KeySequenceConfig, id: number): SequenceHandler {
    const eventType = DEFAULTS.EVENT_TYPE;
    const timeout = config.timeout ?? DEFAULT_TIMEOUT;

    // Normalize all keys in the sequence
    const normalizedSequence = config.sequence.map((key) =>
      normalizeShortcut(key),
    );

    const listenerKey = eventType;

    console.log(
      "[REGISTER]: registering sequence",
      config.sequence,
      "�",
      normalizedSequence,
    );

    const handler: SequenceHandler = {
      id,
      sequence: normalizedSequence,
      description: config.description,
      category: config.category || DEFAULTS.DEFAULT_CATEGORY,
      onComplete: config.onComplete,
      enabled: config.enabled ?? DEFAULTS.ENABLED,
      timeout,
      component: config.component ?? "Undefined",
      registeredAt: Date.now(),
      eventType,
      listenerKey,
    };

    this.handlers.set(id, handler);

    // Add to listener group
    const group = this.getOrCreateListenerGroup(eventType);
    group.handlerIds.add(id);

    return handler;
  }

  /**
   * Unregister a key sequence handler by ID
   * @param id Handler ID to remove
   */
  unregister(id: number): void {
    const handler = this.handlers.get(id);
    if (!handler) return;

    console.log("[UNREGISTER]: unregistering sequence", handler.sequence);

    // Remove from listener group
    const group = this.listeners.get(handler.listenerKey);

    if (group) {
      group.handlerIds.delete(id);

      // If no more handlers for this group, remove the event listener
      if (group.handlerIds.size === 0) {
        window.removeEventListener(handler.eventType, group.boundHandler);
        this.listeners.delete(handler.listenerKey);

        // Clear buffer and timer if no listeners remain
        if (this.listeners.size === 0) {
          this.clearBuffer();
        }
      }
    }

    this.handlers.delete(id);
  }

  /**
   * Get all registered handlers as simplified info objects
   * @returns Array of handler info (keySequence, description, category)
   */
  getAll(): HandlerInfo[] {
    return Array.from(this.handlers.values()).map((handler) => ({
      keySequence: handler.sequence,
      description: handler.description,
      category: handler.category,
    }));
  }
}

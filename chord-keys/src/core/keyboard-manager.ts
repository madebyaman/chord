import { DEFAULT_TIMEOUT, DEFAULTS } from "../utils/constants";
import type {
  KeyPressConfig,
  KeySequenceConfig,
  ListenerGroup,
} from "../types";
import { normalizeShortcut, normalizeEvent } from "../utils/key-normalization";

/**
 * Internal representation of a registered keyboard handler
 * Handles both single keys and sequences uniformly
 */
interface KeyboardHandler {
  /** Unique identifier for this handler */
  id: number;

  /** Normalized sequence of keys (array of 1+ keys) */
  sequence: string[];

  /** Human-readable description */
  description: string;

  /** Category for grouping */
  category: string;

  /** Handler function to execute when sequence completes */
  callback: () => void;

  /** Whether the handler is currently enabled */
  enabled: boolean;

  /** Timeout in milliseconds before sequence resets */
  timeout: number;

  /** Component that registered this handler */
  component: string;

  /** Timestamp when registered */
  registeredAt: number;

  /** Event type this handler listens for */
  eventType: "keydown" | "keyup" | "keypress";

  /** Listener key for quick group lookup */
  listenerKey: string;

  /** Whether to prevent default browser behavior (only for single-key, unambiguous cases) */
  preventDefault: boolean;
}

/**
 * KeyboardManager - unified manager for all keyboard shortcuts
 * Handles both single key presses and multi-key sequences
 * Implements the KeyManager interface for registration and cleanup
 */
export class KeyboardManager {
  public handlers: Map<number, KeyboardHandler> = new Map();

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
  private getEnabledHandlers(listenerKey: string): KeyboardHandler[] {
    const group = this.listeners.get(listenerKey);
    if (!group) return [];

    const handlers: KeyboardHandler[] = [];
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
    handler: KeyboardHandler,
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
      const fullMatches: KeyboardHandler[] = [];
      const partialMatches: KeyboardHandler[] = [];

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
        if (partialMatches.length > 0) {
          // Ambiguous case: "g" matches but "g h" might also match
          // We need to wait before executing to see if the sequence continues
          // Note: preventDefault cannot be applied here since we need to wait
          const maxTimeout = Math.max(...partialMatches.map((h) => h.timeout));
          if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
          }

          // Set new timer (keep buffer for continuation)
          this.timer = setTimeout(() => {
            this.clearBuffer();
            for (const handler of fullMatches) {
              handler.callback();
            }
          }, maxTimeout);
          return;
        }

        // Unambiguous case: can preventDefault if requested
        const shouldPreventDefault = fullMatches.some((h) => h.preventDefault);
        if (shouldPreventDefault) {
          event.preventDefault();
        }

        for (const handler of fullMatches) {
          handler.callback();
        }
        this.clearBuffer();
        return;
      }

      // If partial matches exist, wait for continuation
      if (partialMatches.length > 0) {
        // Use maximum timeout among all partial matches
        const maxTimeout = Math.max(...partialMatches.map((h) => h.timeout));

        // Clear existing timer and start new one
        if (this.timer) {
          clearTimeout(this.timer);
          this.timer = null;
        }

        // Set new timer (keep buffer for continuation)
        this.timer = setTimeout(() => {
          this.clearBuffer();
        }, maxTimeout);

        return;
      }

      // No matches - reset buffer
      this.clearBuffer();
    };
  }

  /**
   * Register a new keyboard handler (single key or sequence)
   * @param config Configuration for the key press or sequence
   * @param id Pre-generated ID from Core
   * @returns The registered handler
   */
  register(
    config: KeyPressConfig | KeySequenceConfig,
    id: number,
  ): KeyboardHandler {
    // Determine if this is a keypress or sequence config
    const isKeyPress = "key" in config;

    // Convert to unified format
    const sequence = isKeyPress
      ? [normalizeShortcut(config.key)]
      : config.sequence.map((key) => normalizeShortcut(key));

    const callback = isKeyPress ? config.onPress : config.onComplete;
    const eventType = config.eventType ?? DEFAULTS.EVENT_TYPE;

    // For single keys, timeout is only used when waiting for longer sequences
    // For sequences, use the specified timeout or default
    const timeout = isKeyPress
      ? DEFAULT_TIMEOUT
      : (config.timeout ?? DEFAULT_TIMEOUT);

    const preventDefault = isKeyPress
      ? (config.preventDefault ?? false)
      : false;

    const listenerKey = eventType;

    const handler: KeyboardHandler = {
      id,
      sequence,
      description: config.description,
      category: config.category || DEFAULTS.DEFAULT_CATEGORY,
      callback,
      enabled: config.enabled ?? DEFAULTS.ENABLED,
      timeout,
      preventDefault,
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
   * Unregister a keyboard handler by ID
   * @param id Handler ID to remove
   */
  unregister(id: number): void {
    const handler = this.handlers.get(id);
    if (!handler) return;

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
}

import { DEFAULT_TIMEOUT, DEFAULTS } from "../utils/constants";
import type {
  EventType,
  KeyPressConfig,
  KeySequenceConfig,
  ListenerGroup,
} from "../types";
import { normalizeShortcut, normalizeEvent } from "../utils/key-normalization";
import { KeyNode, KeyTrie } from "./trie";
import { invariant } from "../utils/invariant";

/**
 * Internal representation of a registered keyboard handler
 * Handles both single keys and sequences uniformly
 */
interface KeyboardHandler {
  id: number;

  /** Normalized sequence of keys (array of 1+ keys) */
  sequence: string[];
  description: string;
  category: string;
  callback: () => void;
  enabled: boolean;
  timeout: number;
  component: string;
  registeredAt: number;
  eventType: "keydown" | "keyup" | "keypress";
  listenerKey: string;
  preventDefault: boolean;
}

/**
 * KeyboardManager - unified manager for all keyboard shortcuts
 * Handles both single key presses and multi-key sequences
 * Implements the KeyManager interface for registration and cleanup
 */
export class KeyboardManager {
  public handlers: Map<number, KeyboardHandler> = new Map();

  /** Persistent listeners for document only. Key is eventType like keydown. It  is used so we can have one listener per eventType. */
  private listeners: Map<string, ListenerGroup> = new Map();

  /** Trie for efficient key sequence matching */
  private trie: KeyTrie = new KeyTrie();

  /** Current position in the trie (replaces buffer) */
  private currentNode: KeyNode | null = null;

  /** Array of timestamps for each keystroke in the sequence */
  private timestamps: number[] = [];

  /** Timeout timer for resetting state */
  private timer: NodeJS.Timeout | null = null;

  /** Get or create listener group for document */
  private getOrCreateListenerGroup(
    eventType: "keydown" | "keyup" | "keypress",
  ): ListenerGroup {
    const listenerKey = eventType;
    let group = this.listeners.get(listenerKey);

    if (!group) {
      const boundHandler = this.createListenerHandler(eventType);

      document.addEventListener(eventType, boundHandler);

      group = {
        handlerIds: new Set(),
        boundHandler,
        eventType,
      };

      this.listeners.set(listenerKey, group);
    }

    return group;
  }

  private clearState(): void {
    this.currentNode = null;
    this.timestamps = [];
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private hasTimeElapsedForHandler(handler: KeyboardHandler): boolean {
    if (this.timestamps.length === 0) return false;

    // Build timeoutPairs: [0, diff1, diff2, ...]
    const timeoutPairs: number[] = [0];
    for (let i = 1; i < this.timestamps.length; i++) {
      timeoutPairs.push(this.timestamps[i] - this.timestamps[i - 1]);
    }


    // Find the longest interval between any two consecutive keys
    const maxInterval = Math.max(...timeoutPairs);
    return maxInterval > handler.timeout;
  }

  private runHandler(event: KeyboardEvent,  normalizedKey: string, eventType: EventType): void {
    const isAtRootNode = !this.currentNode

    if (this.currentNode) this.currentNode = this.trie.searchWithEvent(event, this.currentNode)
    else this.currentNode = this.trie.searchWithEvent(event)


    // If no match found, reset state.
    if (!this.currentNode) {
      this.clearState();
      return;
    }

    const handlerId = this.trie.getHandlerIds(this.currentNode, eventType);
    const hasChildren = this.currentNode.child.size > 0


    // 4 cases
    if (handlerId) {
      const handler = this.handlers.get(handlerId)
      invariant(handler, 'No handler found')
      this.timestamps.push(Date.now())
      const hasTimeElapsed = this.hasTimeElapsedForHandler(handler)
      // If time has elapsed, start fresh
      if (hasTimeElapsed) {
        // start fresh
        this.clearState()
        if (!isAtRootNode) return this.runHandler(event, normalizedKey, eventType)
        else return;
      }
      if (hasChildren) {
        // wait for next keys
        // If no key pressed, then execute the handler + reset state
        // Else, setTimeout for executing
        this.timer = setTimeout(() => {
          this.clearState()
          handler?.callback()
        }, handler?.timeout)
      } else {
        // simply execute
        const shouldPreventDefault = handler.preventDefault
        if (shouldPreventDefault) {
          event.preventDefault();
        }
        handler?.callback()
        this.clearState()
      }
    } else if (hasChildren) {
      // wait for next keys
      this.timestamps.push(Date.now());
      return;
    } else {
      // reset the state. start fresh from this key
      this.clearState()
      if (!isAtRootNode) return this.runHandler(event, normalizedKey, eventType)
      else return
    }
  }

  private isTypingInInput(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null
    if (!target) return false

    const tag = target.tagName
    const editable = target.getAttribute('contenteditable')

    return (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      editable === '' ||
      editable === 'true'
    )
  }


  private createListenerHandler(
    eventType: "keydown" | "keyup" | "keypress",
  ): (e: Event) => void {
    return (event: Event) => {
      if (!(event instanceof KeyboardEvent)) return;
      if (this.isTypingInInput(event)) return;
      const normalizedKey = normalizeEvent(event);
      return this.runHandler(event, normalizedKey, eventType)
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

    // Insert into trie for efficient lookup
    this.trie.insert(sequence, id, eventType);

    return handler;
  }

  /**
   * Unregister a keyboard handler by ID
   * @param id Handler ID to remove
   */
  unregister(id: number): void {
    const handler = this.handlers.get(id);
    if (!handler) return;

    // Remove from trie
    this.trie.remove(handler.sequence, handler.eventType);

    // Remove from listener group
    const group = this.listeners.get(handler.listenerKey);

    if (group) {
      group.handlerIds.delete(id);

      // If no more handlers for this group, remove the event listener
      if (group.handlerIds.size === 0) {
        document.removeEventListener(handler.eventType, group.boundHandler);
        this.listeners.delete(handler.listenerKey);

        // Clear state and timer if no listeners remain
        if (this.listeners.size === 0) {
          this.clearState();
        }
      }
    }

    this.handlers.delete(id);
  }
}

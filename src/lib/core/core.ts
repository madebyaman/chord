import { DEFAULTS } from "../utils/constants";
import type { KeyPressConfig, ShortcutHandler, ListenerGroup } from "../types";
import { normalizeShortcut, normalizeEvent } from "../utils/key-normalization";

export class ChordCore {
  /** Map of handler ID to handler object (single source of truth) */
  private handlers: Map<number, ShortcutHandler> = new Map();

  /** Listener groups for document and window (never garbage collected) */
  private persistentListeners: Map<string, ListenerGroup> = new Map();
  /** Listener groups for other DOM elements (can be garbage collected) */
  private elementListeners: WeakMap<EventTarget, Map<string, ListenerGroup>> = new WeakMap();

  /** Counter for generating unique IDs */
  private idCounter = 0;

  /** Map of handler ID to abort handler function for cleanup */
  private abortHandlers: Map<number, () => void> = new Map();

  /** Callbacks to notify when registry changes */
  private subscribers = new Set();

  private generateId() {
    return ++this.idCounter;
  }

  /**
   * Get all handler IDs for a given normalized key (computed on-demand)
   * This replaces the keyToHandlerIds map for conflict detection
   */
  private getHandlersByKey(normalizedKey: string): number[] {
    const ids: number[] = [];
    for (const [id, handler] of this.handlers.entries()) {
      if (handler.key === normalizedKey) {
        ids.push(id);
      }
    }
    return ids;
  }

  /**
   * Generate a stable key for grouping listeners by target type, eventType, capture, and passive
   */
  private getListenerKey(
    target: EventTarget,
    eventType: string,
    capture: boolean,
    passive: boolean,
  ): string {
    const targetType = target === document ? "doc" : target === window ? "win" : "el";
    return `${targetType}:${eventType}:${capture}:${passive}`;
  }

  /**
   * Get the listener map for a given target (persistent vs element)
   */
  private getTargetListenerMap(target: EventTarget): Map<string, ListenerGroup> {
    // Document and window use persistent listeners (never GC'd)
    if (target === document || target === window) {
      return this.persistentListeners;
    }

    // For other elements, use WeakMap for automatic cleanup
    let targetMap = this.elementListeners.get(target);
    if (!targetMap) {
      targetMap = new Map();
      this.elementListeners.set(target, targetMap);
    }
    return targetMap;
  }

  /**
   * Get or create a listener group for a given target, eventType, and options
   */
  private getOrCreateListenerGroup(
    target: EventTarget,
    eventType: string,
    capture: boolean,
    passive: boolean,
  ): ListenerGroup {
    const targetMap = this.getTargetListenerMap(target);
    const listenerKey = this.getListenerKey(target, eventType, capture, passive);

    let group = targetMap.get(listenerKey);

    if (!group) {
      // Create new listener group
      const boundHandler = this.createListenerHandler(target, eventType, capture, passive);

      target.addEventListener(eventType, boundHandler, {
        capture,
        passive,
      });

      group = {
        handlerIds: new Set(),
        boundHandler,
        eventType,
        capture,
        passive,
      };

      targetMap.set(listenerKey, group);
    }

    return group;
  }

  registerHandler(config: KeyPressConfig) {
    if (config.enabled === false) return;

    // Extract event configuration with defaults
    const eventType = config.eventType ?? DEFAULTS.EVENT_TYPE;
    const eventTarget = config.target ?? document;
    const capture = config.eventOptions?.capture ?? DEFAULTS.CAPTURE;
    const passive = config.eventOptions?.passive ?? DEFAULTS.PASSIVE;
    const once = config.eventOptions?.once ?? DEFAULTS.ONCE;
    const signal = config.eventOptions?.signal;

    const normalizedKey = normalizeShortcut(config.key);
    const listenerKey = this.getListenerKey(eventTarget, eventType, capture, passive);

    console.log("[REGISTER]: registering", config.key, "→", normalizedKey);

    const id = this.generateId();

    const handler: ShortcutHandler = {
      id,
      key: normalizedKey,
      description: config.description,
      category: config.category || DEFAULTS.DEFAULT_CATEGORY,
      onPress: config.onPress,
      enabled: config.enabled ?? DEFAULTS.ENABLED,
      preventDefault: config.preventDefault ?? DEFAULTS.PREVENT_DEFAULT,
      registeredAt: Date.now(),
      component: config.component ?? "Undefined",
      eventType,
      target: eventTarget,
      once,
      capture,
      passive,
      signal,
      listenerKey,
    };

    this.handlers.set(id, handler);

    // Handle signal for abort
    if (signal) {
      if (signal.aborted) {
        this.unregisterHandler(id);
        return id;
      }
      // Create and store abort handler for cleanup
      const abortHandler = () => {
        this.unregisterHandler(id);
      };
      this.abortHandlers.set(id, abortHandler);
      signal.addEventListener("abort", abortHandler, { once: true });
    }

    // Get or create listener group
    const group = this.getOrCreateListenerGroup(eventTarget, eventType, capture, passive);
    group.handlerIds.add(id);

    // Check for conflicts (computed on-demand from handlers)
    const existingIds = this.getHandlersByKey(normalizedKey);

    // Log conflict warning in development (excluding the handler we just added)
    if (process.env.NODE_ENV === "development" && existingIds.length > 1) {
      this.warnConflict(normalizedKey, handler);
    }

    // Notify listeners
    this.notifySubscribers();

    return id;
  }

  unregisterHandler(id: number | undefined) {
    if (!id) return;
    const handler = this.handlers.get(id);
    if (!handler) return;

    console.log("[UNREGISTER]: unregistering", handler.key);

    // Clean up abort listener if one exists
    const abortHandler = this.abortHandlers.get(id);
    if (abortHandler && handler.signal) {
      handler.signal.removeEventListener("abort", abortHandler);
      this.abortHandlers.delete(id);
    }

    // Remove from listener group using stored listenerKey
    const targetMap = this.getTargetListenerMap(handler.target);
    const group = targetMap.get(handler.listenerKey);

    if (group) {
      group.handlerIds.delete(id);

      // If no handlers left in this group, remove the listener entirely
      if (group.handlerIds.size === 0) {
        handler.target.removeEventListener(handler.eventType, group.boundHandler, {
          capture: group.capture,
        });
        targetMap.delete(handler.listenerKey);

        // Clean up empty map for element listeners
        if (handler.target !== document && handler.target !== window) {
          if (targetMap.size === 0) {
            this.elementListeners.delete(handler.target);
          }
        }
      }
    }

    // Remove from handlers map (single source of truth)
    this.handlers.delete(id);

    this.notifySubscribers();
  }

  /**
   * Create a listener handler for a specific target, event type, and listener options
   * This handler will be bound to the event listener
   */
  private createListenerHandler(
    target: EventTarget,
    eventType: string,
    capture: boolean,
    passive: boolean,
  ): (e: Event) => void {
    return (event: Event) => {
      if (!(event instanceof KeyboardEvent)) return;

      const normalizedKey = normalizeEvent(event);

      // Get the listener group for this target and event type
      const targetMap = this.getTargetListenerMap(target);
      const listenerKey = this.getListenerKey(target, eventType, capture, passive);
      const group = targetMap.get(listenerKey);

      if (!group) return;

      // Only process handlers from this specific listener group
      const matchingHandlers: ShortcutHandler[] = [];
      const ids = Array.from(group.handlerIds);
      for (const id of ids) {
        const handler = this.handlers.get(id);
        if (handler && handler.enabled && handler.key === normalizedKey) {
          matchingHandlers.push(handler);
        }
      }

      // Execute all matching handlers
      for (const handler of matchingHandlers) {
        if (handler.preventDefault === true) {
          event.preventDefault();
        }

        handler.onPress();

        // Handle 'once' option - auto-unregister after execution
        if (handler.once) {
          this.unregisterHandler(handler.id);
        }
      }
    };
  }

  /**
   * Get all registered handlers
   */
  getHandlers(): ShortcutHandler[] {
    return Array.from(this.handlers.values());
  }

  /**
   * Get all conflicts (keys with multiple handlers)
   */
  getConflicts() {
    const keyMap = new Map<string, ShortcutHandler[]>();

    // Group handlers by normalized key
    for (const handler of this.handlers.values()) {
      const existing = keyMap.get(handler.key) || [];
      existing.push(handler);
      keyMap.set(handler.key, existing);
    }

    // Filter to only conflicts (2+ handlers)
    const conflicts = [];
    for (const [key, handlers] of keyMap.entries()) {
      if (handlers.length > 1) {
        conflicts.push({ key, handlers });
      }
    }

    return conflicts;
  }

  /**
   * Subscribe to registry changes
   */
  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify subscribers of changes
   */
  private notifySubscribers() {
    for (const callback of this.subscribers) {
      (callback as () => void)();
    }
  }

  /**
   * Warn about conflicts in development mode
   */
  private warnConflict(keyString: string, newHandler: ShortcutHandler): void {
    const existingIds = this.getHandlersByKey(keyString);
    const existingHandlers = existingIds
      .map((id) => this.handlers.get(id))
      .filter((h): h is ShortcutHandler => h !== undefined && h.id !== newHandler.id);

    console.warn(
      `[Chord] Shortcut conflict detected for "${keyString}":\n` +
        `  Existing handler${existingHandlers.length > 1 ? "s" : ""}:\n` +
        existingHandlers
          .map((h) => `    - ${h.description}${h.component ? ` (${h.component})` : ""}`)
          .join("\n") +
        `\n  New handler:\n` +
        `    - ${newHandler.description}${newHandler.component ? ` (${newHandler.component})` : ""}\n` +
        `  Only the first registered handler will be executed.`,
    );
  }
}

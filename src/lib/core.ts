import { DEFAULTS } from "./constants";
import type { KeyPressConfig, ShortcutHandler } from "./types";
import { normalizeShortcut, normalizeEvent } from "./key-normalization";

export class ChordCore {
  handlers: Map<string, ShortcutHandler> = new Map();
  subscribers = new Set();

  constructor() {
    this.addListeners();
  }

  registerHandler(config: KeyPressConfig) {
    // Normalize the key on registration for cross-platform compatibility
    const normalizedKey = normalizeShortcut(config.key);

    console.log("[REGISTER]: registering", config.key, "→", normalizedKey);

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const handler: ShortcutHandler = {
      id,
      key: normalizedKey, // Store normalized key
      description: config.description,
      category: config.category || DEFAULTS.DEFAULT_CATEGORY,
      onPress: config.onPress,
      enabled: config.enabled ?? DEFAULTS.ENABLED,
      preventDefault: config.preventDefault ?? DEFAULTS.PREVENT_DEFAULT,
      registeredAt: Date.now(),
    };

    this.handlers.set(id, handler);
    this.notifySubscribers();

    return id;
  }

  unregisterHandler(id: string) {
    const handler = this.handlers.get(id);
    if (handler) {
      console.log("[UNREGISTER]: unregistering", handler.key);
    }
    this.handlers.delete(id);
    this.notifySubscribers();
  }

  addListeners() {
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  /**
   * Find all handlers that match a normalized key
   * Returns array to support conflict detection
   */
  private getHandlersByKey(normalizedKey: string): ShortcutHandler[] {
    return Array.from(this.handlers.values()).filter(
      (handler) => handler.key === normalizedKey && handler.enabled
    );
  }

  private handleKeyDown(event: KeyboardEvent) {
    // Normalize the keyboard event to match registered shortcuts
    const normalizedKey = normalizeEvent(event);

    // Find all matching handlers (can be multiple if conflicts exist)
    const handlers = this.getHandlersByKey(normalizedKey);

    if (handlers.length === 0) {
      return; // No handler registered for this key
    }

    // Warn about conflicts in development
    if (handlers.length > 1 && process.env.NODE_ENV !== "production") {
      console.warn(
        `[CONFLICT]: Multiple handlers registered for "${normalizedKey}":`,
        handlers.map((h) => h.description)
      );
    }

    // Execute all handlers (conflict resolution can be added later)
    for (const handler of handlers) {
      if (handler.preventDefault) {
        event.preventDefault();
      }
      handler.onPress();
    }
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
}

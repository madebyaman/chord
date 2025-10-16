import { DEFAULTS } from "../utils/constants";
import type { KeyPressConfig, ShortcutHandler } from "../types";
import { normalizeShortcut, normalizeEvent } from "../utils/key-normalization";

export class ChordCore {
  /** Map of handler ID to handler object */
  private handlers: Map<number, ShortcutHandler> = new Map();
  /** Map of normalized key string to array of handler IDs */
  private keyToHandlerIds: Map<string, number[]> = new Map();

  /** Counter for generating unique IDs */
  private idCounter = 0;

  /** Callbacks to notify when registry changes */
  private subscribers = new Set();

  constructor() {
    this.addListeners();
  }

  private generateId() {
    return ++this.idCounter;
  }

  registerHandler(config: KeyPressConfig) {
    if (config.enabled === false) return;
    const normalizedKey = normalizeShortcut(config.key);
    console.log("[REGISTER]: registering", config.key, "→", normalizedKey);

    const id = this.generateId();

    const handler: ShortcutHandler = {
      id,
      key: normalizedKey, // Store normalized key
      description: config.description,
      category: config.category || DEFAULTS.DEFAULT_CATEGORY,
      onPress: config.onPress,
      enabled: config.enabled ?? DEFAULTS.ENABLED,
      preventDefault: config.preventDefault ?? DEFAULTS.PREVENT_DEFAULT,
      registeredAt: Date.now(),
      component: config.component ?? "Undefined",
    };

    this.handlers.set(id, handler);

    // Update key mapping
    const existingIds = this.keyToHandlerIds.get(normalizedKey) || [];
    this.keyToHandlerIds.set(normalizedKey, [...existingIds, id]);

    // Log conflict warning in development
    if (process.env.NODE_ENV === "development" && existingIds.length > 0) {
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
    this.handlers.delete(id);

    // Remove from key mapping
    const keyString = handler.key;
    const ids = this.keyToHandlerIds.get(keyString);
    if (ids) {
      const filtered = ids.filter((hId) => hId !== id);
      if (filtered.length === 0) {
        this.keyToHandlerIds.delete(keyString);
      } else {
        this.keyToHandlerIds.set(keyString, filtered);
      }
    }

    this.notifySubscribers();
  }

  addListeners() {
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  /**
   * Get first handler for a specific key combination
   */
  private getHandlerForKey(normalizedKey: string) {
    const ids = this.keyToHandlerIds.get(normalizedKey) || [];

    const handlers = ids
      .map((id) => this.handlers.get(id))
      .filter((h): h is ShortcutHandler => h !== undefined && h.enabled);
    return handlers.length > 0 ? handlers[0] : undefined;
  }

  private handleKeyDown(event: KeyboardEvent) {
    // Normalize the keyboard event to match registered shortcuts
    const normalizedKey = normalizeEvent(event);

    // Find all matching handlers (can be multiple if conflicts exist)
    const handler = this.getHandlerForKey(normalizedKey);
    if (!handler) return;

    if (handler.preventDefault) {
      event.preventDefault();
    }
    handler.onPress();
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
    const existingIds = this.keyToHandlerIds.get(keyString) || [];
    const existingHandlers = existingIds
      .map((id) => this.handlers.get(id))
      .filter((h): h is ShortcutHandler => h !== undefined);

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

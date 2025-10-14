import { DEFAULTS } from "./constants";
import type { KeyPressConfig, ShortcutHandler } from "./types";

export class ChordCore {
  handlers: Map<string, ShortcutHandler> = new Map();
  subscribers = new Set();

  constructor() {
    this.addListeners();
  }

  /**
   * Takes a keypress config options object and returns a memoized version that stays consistent across multiple calls.
   * @param config KeyPressConfig
   */
  getOptions(config: KeyPressConfig) {}

  registerHandler(config: KeyPressConfig) {
    console.log("[REGISTER]: registering", config.key);
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const normalizedKey = normalizeKeyString(config.key);
    const handler: ShortcutHandler = {
      id,
      key: normalizedKey,
      description: config.description,
      category: config.category || DEFAULTS.DEFAULT_CATEGORY,
      onPress: config.onPress,
      enabled: config.enabled ?? DEFAULTS.ENABLED,
      preventDefault: config.preventDefault ?? DEFAULTS.PREVENT_DEFAULT,
      registeredAt: Date.now(),
    };

    this.handlers.set(id, handler);

    return id;
  }

  unregisterHandler(id: string) {
    const handler = this.handlers.get(id);
    if (handler) {
      console.log("[UNREGISTER]: unregistering", handler.key);
    }
    this.handlers.delete(id);
  }

  addListeners() {
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
    document.addEventListener("keyup", this.handleKeyUp.bind(this));
  }

  private getHandlerByKey(key: string): ShortcutHandler | undefined {
    const normalizedKey = normalizeKeyString(key);
    return Array.from(this.handlers.values()).find((handler) => handler.key === normalizedKey);
  }

  private handleKeyDown(event: KeyboardEvent) {
    const key = event.key;
    const handler = this.getHandlerByKey(key);
    if (handler) {
      handler.onPress();
    }
  }

  private handleKeyUp(event: KeyboardEvent) {
    const key = event.key;
    const handler = this.handlers.get(key);
    if (handler) {
      handler.onPress();
    }
  }

  subscribe(callback): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
}

/**
 * Normalizes a keyboard event to a key string for cross-platform compatibility
 */
function normalizeKeyEvent(event: KeyboardEvent): string {
  const parts: string[] = [];

  // Add modifiers in consistent order
  if (event.metaKey) parts.push("meta");
  if (event.ctrlKey) parts.push("ctrl");
  if (event.altKey) parts.push("alt");
  if (event.shiftKey) parts.push("shift");

  // Add the main key (lowercase for consistency)
  parts.push(event.key.toLowerCase());

  return parts.join("+");
}

/**
 * Normalizes a key string from config (e.g., "cmd+k" -> "meta+k")
 */
function normalizeKeyString(keyString: string): string {
  const parts = keyString
    .toLowerCase()
    .split("+")
    .map((p) => p.trim());

  // Replace cmd/command with meta
  const normalized = parts.map((part) => {
    if (part === "cmd" || part === "command") return "meta";
    return part;
  });

  // Sort modifiers consistently
  const modifiers = normalized.filter((p) => ["meta", "ctrl", "alt", "shift"].includes(p)).sort();
  const key = normalized.find((p) => !["meta", "ctrl", "alt", "shift"].includes(p)) || "";

  return [...modifiers, key].join("+");
}

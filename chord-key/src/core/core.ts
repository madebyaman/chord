import type { KeyPressConfig, KeySequenceConfig, HandlerInfo, ShortcutConflict } from "../types";
import { KeyboardManager } from "./keyboard-manager";
import { normalizeShortcut } from "../utils/key-normalization";
import { DEFAULTS } from "../utils/constants";

/**
 * ChordCore - Central orchestrator for keyboard shortcut management
 * Routes all keyboard shortcuts to the unified KeyboardManager
 */
export class ChordCore {
  private idCounter = 0;
  private keyboardManager = new KeyboardManager();
  private subscribers = new Set<() => void>();

  private generateId(): number {
    return ++this.idCounter;
  }

  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    this.notify(); // Notify immediately to tell latest updates
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notify(): void {
    this.subscribers.forEach((callback) => callback());
  }

  private getHandlersBySequence(sequence: string[]): HandlerInfo[] {
    return Array.from(this.keyboardManager.handlers.values())
      .map((handler) => ({
        keySequence: handler.sequence,
        description: handler.description,
        category: handler.category,
        component: handler.component,
      }))
      .filter(
        (handler) =>
          handler.keySequence.length === sequence.length &&
          handler.keySequence.every((key, i) => key === sequence[i]),
      );
  }

  /**
   * Register a keyboard shortcut handler
   * Routes to unified KeyboardManager
   * @param config Configuration for the handler
   * @param previousId Optional ID of existing handler to check for updates
   */
  registerHandler(
    config: KeyPressConfig | KeySequenceConfig,
    previousId?: number | null | undefined,
  ): number | undefined {
    if (config.enabled === false) return;

    // Check if updating existing handler
    if (previousId) {
      const existingHandler = this.keyboardManager.handlers.get(previousId);
      if (existingHandler && this.isSameConfig(existingHandler, config)) {
        // Same config values, no re-registration needed
        return previousId;
      }
      // Config changed, unregister old handler
      this.unregisterHandler(previousId);
    }

    const id = this.generateId();
    const handler = this.keyboardManager.register(config, id);

    // Check for conflicts and warn in development
    const existingHandlers = this.getHandlersBySequence(handler.sequence);
    const isDev = typeof (globalThis as any).process !== 'undefined' &&
      ((globalThis as any).process.env.NODE_ENV === "development" ||
       (globalThis as any).process.env.NODE_ENV === "test");
    if (isDev && existingHandlers.length > 1) {
      this.warnConflict(handler.sequence.join(" "), existingHandlers);
    }

    this.notify();
    return id;
  }

  /**
   * Compare config values (excluding callback) with existing handler
   */
  private isSameConfig(
    handler: ReturnType<(typeof this.keyboardManager)["register"]>,
    config: KeyPressConfig | KeySequenceConfig,
  ): boolean {
    const isKeyPress = "key" in config;

    // Compare sequences
    const configSequence = isKeyPress
      ? [normalizeShortcut(config.key)]
      : config.sequence.map((key) => normalizeShortcut(key));

    if (
      handler.sequence.length !== configSequence.length ||
      !handler.sequence.every((key, i) => key === configSequence[i])
    ) {
      return false;
    }

    // Compare other properties
    if (handler.description !== config.description) return false;
    if (handler.category !== (config.category || DEFAULTS.DEFAULT_CATEGORY)) return false;
    if (handler.enabled !== (config.enabled ?? DEFAULTS.ENABLED)) return false;
    if (handler.component !== (config.component ?? "Undefined")) return false;
    if (handler.eventType !== (config.eventType ?? DEFAULTS.EVENT_TYPE)) return false;

    // Compare preventDefault (only for KeyPress)
    if (isKeyPress) {
      if (handler.preventDefault !== (config.preventDefault ?? false)) return false;
    }

    // Compare timeout (only for KeySequence)
    if (!isKeyPress && "timeout" in config) {
      const DEFAULT_TIMEOUT = 1000;
      if (handler.timeout !== (config.timeout ?? DEFAULT_TIMEOUT)) return false;
    }

    return true;
  }

  /**
   * Unregister a handler by ID
   */
  unregisterHandler(id: number | undefined) {
    if (!id) return;
    this.keyboardManager.unregister(id);
    this.notify();
  }

  /**
   * Get all registered handlers
   */
  get handlers(): HandlerInfo[] {
    return Array.from(this.keyboardManager.handlers.values()).map((handler) => ({
      keySequence: handler.sequence,
      description: handler.description,
      category: handler.category,
      component: handler.component,
    }));
  }

  /**
   * Get all conflicts (sequences with multiple handlers)
   */
  getConflicts(): ShortcutConflict[] {
    const sequenceMap = new Map<string, HandlerInfo[]>();

    const allHandlers = this.handlers;

    for (const handler of allHandlers) {
      // Use keySequence joined with comma as the key
      const sequenceKey = handler.keySequence.join(",");

      const existing = sequenceMap.get(sequenceKey) || [];
      existing.push(handler);
      sequenceMap.set(sequenceKey, existing);
    }

    const conflicts: ShortcutConflict[] = [];
    for (const [key, handlers] of sequenceMap.entries()) {
      if (handlers.length > 1) {
        conflicts.push({ key, handlers });
      }
    }

    return conflicts;
  }

  private warnConflict(keyString: string, handlers: HandlerInfo[]): void {
    console.warn(
      `[Chord] Shortcut conflict detected for "${keyString}":\n` +
        `  ${handlers.length} handlers registered:\n` +
        handlers.map((h) => `    - ${h.description} (${h.category}) [${h.component}]`).join("\n") +
        `\n  Only the first registered handler will be executed.`,
    );
  }
}

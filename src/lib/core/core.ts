import type { KeyPressConfig, HandlerInfo, ShortcutConflict } from "../types";
import { KeyPress } from "./key-press";

/**
 * ChordCore - Central orchestrator for keyboard shortcut management
 * Delegates to specialized managers (KeyPress, KeySequence) based on config type
 */
export class ChordCore {
  /** Unified ID counter for all handler types */
  private idCounter = 0;

  /** KeyPress manager instance */
  private keyPressManager = new KeyPress();

  /** Generate unique ID for handlers */
  private generateId(): number {
    return ++this.idCounter;
  }

  /** Get handlers for a given key (for conflict detection) */
  private getHandlersByKey(normalizedKey: string): HandlerInfo[] {
    const allHandlers = this.keyPressManager.getAll();
    return allHandlers.filter((handler) => handler.key === normalizedKey);
  }

  /**
   * Register a keyboard shortcut handler
   * Routes to appropriate manager based on config.type
   */
  registerHandler(config: KeyPressConfig) {
    if (config.enabled === false) return;

    // Check type and route to appropriate manager
    if (config.type === "keypress") {
      const id = this.generateId();
      const handler = this.keyPressManager.register(config, id);

      // Check for conflicts and warn in development
      const existingHandlers = this.getHandlersByKey(handler.key);
      console.log("NODE_ENV", process.env.NODE_ENV);
      console.log("existing handlers", existingHandlers.length);
      if (
        (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") &&
        existingHandlers.length > 1
      ) {
        console.log("warning");
        this.warnConflict(handler.key, existingHandlers);
      }

      return id;
    } else if (config.type === "sequence") {
      throw new Error("[Chord] KeySequence not yet implemented");
    } else {
      throw new Error(`[Chord] Unknown handler type: ${(config as any).type}`);
    }
  }

  /**
   * Unregister a handler by ID
   */
  unregisterHandler(id: number | undefined) {
    if (!id) return;

    // For now, only KeyPress exists, so delegate to it
    // In the future, we'll need to track which manager owns which ID
    this.keyPressManager.unregister(id);
  }

  /**
   * Get all registered handlers
   */
  getHandlers(): HandlerInfo[] {
    // Return handlers from all managers
    // For now, only KeyPress exists
    return this.keyPressManager.getAll();
  }

  /**
   * Get all conflicts (keys with multiple handlers)
   */
  getConflicts(): ShortcutConflict[] {
    const keyMap = new Map<string, HandlerInfo[]>();

    // Collect handlers from all managers
    const allHandlers = this.getHandlers();

    for (const handler of allHandlers) {
      // Handle both key and keySequence fields
      const handlerKey = handler.key || (handler.keySequence ? handler.keySequence.join(",") : "");
      if (!handlerKey) continue;

      const existing = keyMap.get(handlerKey) || [];
      existing.push(handler);
      keyMap.set(handlerKey, existing);
    }

    const conflicts: ShortcutConflict[] = [];
    for (const [key, handlers] of keyMap.entries()) {
      if (handlers.length > 1) {
        conflicts.push({ key, handlers });
      }
    }

    return conflicts;
  }

  /**
   * Warn about conflicts in development mode
   */
  private warnConflict(keyString: string, handlers: HandlerInfo[]): void {
    console.warn(
      `[Chord] Shortcut conflict detected for "${keyString}":\n` +
        `  ${handlers.length} handlers registered:\n` +
        handlers.map((h) => `    - ${h.description} (${h.category})`).join("\n") +
        `\n  Only the first registered handler will be executed.`,
    );
  }
}

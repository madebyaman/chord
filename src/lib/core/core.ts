import type {
  KeyPressConfig,
  KeySequenceConfig,
  HandlerInfo,
  ShortcutConflict,
} from "../types";
import { KeyPress } from "./key-press";
import { KeySequence } from "./key-sequence";

/**
 * ChordCore - Central orchestrator for keyboard shortcut management
 * Delegates to specialized managers (KeyPress, KeySequence) based on config type
 */
export class ChordCore {
  /** Unified ID counter for all handler types */
  private idCounter = 0;

  /** KeyPress manager instance */
  private keyPressManager = new KeyPress();

  /** KeySequence manager instance */
  private keySequenceManager = new KeySequence();

  /** Track which manager owns which ID */
  private handlerTypes = new Map<number, "keypress" | "sequence">();

  /** Generate unique ID for handlers */
  private generateId(): number {
    return ++this.idCounter;
  }

  /** Get handlers for a given key (for conflict detection) */
  private getHandlersByKey(normalizedKey: string): HandlerInfo[] {
    const allHandlers = this.keyPressManager.getAll();
    return allHandlers.filter((handler) => handler.key === normalizedKey);
  }

  /** Get handlers for a given sequence (for conflict detection) */
  private getHandlersBySequence(sequence: string[]): HandlerInfo[] {
    const allHandlers = this.keySequenceManager.getAll();
    const sequenceKey = sequence.join(",");
    return allHandlers.filter(
      (handler) =>
        handler.keySequence && handler.keySequence.join(",") === sequenceKey,
    );
  }

  /**
   * Register a keyboard shortcut handler
   * Routes to appropriate manager based on type parameter
   */
  registerHandler(type: "keypress", config: KeyPressConfig): number | undefined;
  registerHandler(
    type: "sequence",
    config: KeySequenceConfig,
  ): number | undefined;
  registerHandler(
    type: "keypress" | "sequence",
    config: KeyPressConfig | KeySequenceConfig,
  ): number | undefined {
    if (config.enabled === false) return;

    // Check type and route to appropriate manager
    if (type === "keypress") {
      const id = this.generateId();
      const handler = this.keyPressManager.register(
        config as KeyPressConfig,
        id,
      );

      // Track handler type
      this.handlerTypes.set(id, "keypress");

      // Check for conflicts and warn in development
      const existingHandlers = this.getHandlersByKey(handler.key);
      console.log("NODE_ENV", process.env.NODE_ENV);
      console.log("existing handlers", existingHandlers.length);
      if (
        (process.env.NODE_ENV === "development" ||
          process.env.NODE_ENV === "test") &&
        existingHandlers.length > 1
      ) {
        console.log("warning");
        this.warnConflict(handler.key, existingHandlers);
      }

      return id;
    } else if (type === "sequence") {
      const id = this.generateId();
      const handler = this.keySequenceManager.register(
        config as KeySequenceConfig,
        id,
      );

      // Track handler type
      this.handlerTypes.set(id, "sequence");

      // Check for conflicts and warn in development
      const sequenceKey = handler.sequence.join(",");
      const existingHandlers = this.getHandlersBySequence(handler.sequence);
      if (
        (process.env.NODE_ENV === "development" ||
          process.env.NODE_ENV === "test") &&
        existingHandlers.length > 1
      ) {
        this.warnConflict(sequenceKey, existingHandlers);
      }

      return id;
    } else {
      throw new Error(`[Chord] Unknown handler type: ${type}`);
    }
  }

  /**
   * Unregister a handler by ID
   */
  unregisterHandler(id: number | undefined) {
    if (!id) return;

    // Route to the correct manager based on handler type
    const handlerType = this.handlerTypes.get(id);
    if (!handlerType) return;

    if (handlerType === "keypress") {
      this.keyPressManager.unregister(id);
    } else if (handlerType === "sequence") {
      this.keySequenceManager.unregister(id);
    }

    // Clean up tracking
    this.handlerTypes.delete(id);
  }

  /**
   * Get all registered handlers
   */
  getHandlers(): HandlerInfo[] {
    // Return handlers from all managers
    return [
      ...this.keyPressManager.getAll(),
      ...this.keySequenceManager.getAll(),
    ];
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
      const handlerKey =
        handler.key ||
        (handler.keySequence ? handler.keySequence.join(",") : "");
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
        handlers
          .map((h) => `    - ${h.description} (${h.category})`)
          .join("\n") +
        `\n  Only the first registered handler will be executed.`,
    );
  }
}

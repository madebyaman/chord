import type {
  KeyPressConfig,
  KeySequenceConfig,
  HandlerInfo,
  ShortcutConflict,
} from "../types";
import { KeyboardManager } from "./keyboard-manager";

/**
 * ChordCore - Central orchestrator for keyboard shortcut management
 * Routes all keyboard shortcuts to the unified KeyboardManager
 */
export class ChordCore {
  /** Unified ID counter for all handler types */
  private idCounter = 0;

  /** Unified keyboard manager for both key presses and sequences */
  private keyboardManager = new KeyboardManager();

  /** Subscribers that get notified when handlers change */
  private subscribers = new Set<() => void>();

  /** Generate unique ID for handlers */
  private generateId(): number {
    return ++this.idCounter;
  }

  /** Subscribe to handler changes. Returns unsubscribe function */
  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    this.notify(); // Notify immediately to tell latest updates
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /** Notify all subscribers of handler changes */
  private notify(): void {
    console.log("notifying subscriber");
    this.subscribers.forEach((callback) => callback());
  }

  /** Get handlers for a given sequence (for conflict detection) */
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
   */
  registerHandler(
    config: KeyPressConfig | KeySequenceConfig,
  ): number | undefined {
    if (config.enabled === false) return;

    const id = this.generateId();
    const handler = this.keyboardManager.register(config, id);

    // Check for conflicts and warn in development
    const existingHandlers = this.getHandlersBySequence(handler.sequence);
    if (
      (process.env.NODE_ENV === "development" ||
        process.env.NODE_ENV === "test") &&
      existingHandlers.length > 1
    ) {
      this.warnConflict(handler.sequence.join(" "), existingHandlers);
    }

    this.notify();
    return id;
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
    return Array.from(this.keyboardManager.handlers.values()).map(
      (handler) => ({
        keySequence: handler.sequence,
        description: handler.description,
        category: handler.category,
        component: handler.component,
      }),
    );
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

  /**
   * Warn about conflicts in development mode
   */
  private warnConflict(keyString: string, handlers: HandlerInfo[]): void {
    console.warn(
      `[Chord] Shortcut conflict detected for "${keyString}":\n` +
        `  ${handlers.length} handlers registered:\n` +
        handlers
          .map((h) => `    - ${h.description} (${h.category}) [${h.component}]`)
          .join("\n") +
        `\n  Only the first registered handler will be executed.`,
    );
  }
}

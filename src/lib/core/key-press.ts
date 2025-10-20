import { DEFAULTS } from "../utils/constants";
import type {
  KeyPressConfig,
  ShortcutHandler,
  ListenerGroup,
  KeyManager,
  HandlerInfo,
} from "../types";
import { normalizeShortcut, normalizeEvent } from "../utils/key-normalization";

/**
 * KeyPress manager - handles single key press shortcuts
 * Implements the KeyManager interface for registration and cleanup
 */
export class KeyPress implements KeyManager<KeyPressConfig, ShortcutHandler> {
  private handlers: Map<number, ShortcutHandler> = new Map();

  /** Persistent listeners for document/window */
  private persistentListeners: Map<string, ListenerGroup> = new Map();

  /** WeakMap for element listeners (auto cleanup) */
  private elementListeners: WeakMap<EventTarget, Map<string, ListenerGroup>> =
    new WeakMap();

  /** AbortSignal cleanup handlers */
  private abortHandlers: Map<number, () => void> = new Map();

  /** Generate listener key for grouping by target, eventType, and options */
  private getListenerKey(
    target: EventTarget,
    eventType: string,
    capture: boolean,
    passive: boolean,
  ): string {
    const targetType =
      target === document ? "doc" : target === window ? "win" : "el";
    return `${targetType}:${eventType}:${capture}:${passive}`;
  }

  /** Get listener map for target (persistent for document/window, WeakMap for elements) */
  private getTargetListenerMap(
    target: EventTarget,
  ): Map<string, ListenerGroup> | undefined {
    if (target === document || target === window) {
      return this.persistentListeners;
    }
    let targetMap = this.elementListeners.get(target);
    if (!targetMap) {
      targetMap = new Map();
      this.elementListeners.set(target, targetMap);
    }
    return targetMap;
  }

  /** Get or create listener group for target and event config */
  private getOrCreateListenerGroup(
    target: EventTarget,
    eventType: string,
    capture: boolean,
    passive: boolean,
  ): ListenerGroup {
    const targetMap = this.getTargetListenerMap(target);
    const listenerKey = this.getListenerKey(
      target,
      eventType,
      capture,
      passive,
    );

    let group = targetMap.get(listenerKey);

    if (!group) {
      const boundHandler = this.createListenerHandler(
        target,
        eventType,
        capture,
        passive,
      );

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

  /** Create bound handler for event listener */
  private createListenerHandler(
    target: EventTarget,
    eventType: string,
    capture: boolean,
    passive: boolean,
  ): (e: Event) => void {
    return (event: Event) => {
      if (!(event instanceof KeyboardEvent)) return;

      const normalizedKey = normalizeEvent(event);

      const targetMap = this.getTargetListenerMap(target);
      const listenerKey = this.getListenerKey(
        target,
        eventType,
        capture,
        passive,
      );
      const group = targetMap.get(listenerKey);

      if (!group) return;

      const matchingHandlers: ShortcutHandler[] = [];
      const ids = Array.from(group.handlerIds);
      for (const id of ids) {
        const handler = this.handlers.get(id);
        if (handler && handler.enabled && handler.key === normalizedKey) {
          matchingHandlers.push(handler);
        }
      }

      for (const handler of matchingHandlers) {
        if (handler.preventDefault === true) {
          event.preventDefault();
        }

        handler.onPress();

        if (handler.once) {
          this.unregister(handler.id);
        }
      }
    };
  }

  /**
   * Register a new key press handler
   * @param config Configuration for the key press
   * @param id Pre-generated ID from Core
   * @returns The registered handler
   */
  register(config: KeyPressConfig, id: number): ShortcutHandler {
    const eventType = config.eventType ?? DEFAULTS.EVENT_TYPE;
    const eventTarget = config.target ?? document;
    const capture = config.eventOptions?.capture ?? DEFAULTS.CAPTURE;
    const passive = config.eventOptions?.passive ?? DEFAULTS.PASSIVE;
    const once = config.eventOptions?.once ?? DEFAULTS.ONCE;
    const signal = config.eventOptions?.signal;

    const normalizedKey = normalizeShortcut(config.key);
    const listenerKey = this.getListenerKey(
      eventTarget,
      eventType,
      capture,
      passive,
    );

    console.log("[REGISTER]: registering", config.key, "�", normalizedKey);

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

    // Handle AbortSignal
    if (signal) {
      if (signal.aborted) {
        this.unregister(id);
        return handler;
      }
      const abortHandler = () => {
        this.unregister(id);
      };
      this.abortHandlers.set(id, abortHandler);
      signal.addEventListener("abort", abortHandler, { once: true });
    }

    // Add to listener group
    const group = this.getOrCreateListenerGroup(
      eventTarget,
      eventType,
      capture,
      passive,
    );
    group.handlerIds.add(id);

    return handler;
  }

  /**
   * Unregister a key press handler by ID
   * @param id Handler ID to remove
   */
  unregister(id: number): void {
    const handler = this.handlers.get(id);
    if (!handler) return;

    console.log("[UNREGISTER]: unregistering", handler.key);

    // Clean up abort handler
    const abortHandler = this.abortHandlers.get(id);
    if (abortHandler && handler.signal) {
      handler.signal.removeEventListener("abort", abortHandler);
      this.abortHandlers.delete(id);
    }

    // Remove from listener group
    const targetMap = this.getTargetListenerMap(handler.target);
    const group = targetMap.get(handler.listenerKey);

    if (group) {
      group.handlerIds.delete(id);

      // If no more handlers for this group, remove the event listener
      if (group.handlerIds.size === 0) {
        handler.target.removeEventListener(
          handler.eventType,
          group.boundHandler,
          {
            capture: group.capture,
          },
        );
        targetMap.delete(handler.listenerKey);

        // Clean up element listener map if empty
        if (handler.target !== document && handler.target !== window) {
          if (targetMap.size === 0) {
            this.elementListeners.delete(handler.target);
          }
        }
      }
    }

    this.handlers.delete(id);
  }

  /**
   * Get all registered handlers as simplified info objects
   * @returns Array of handler info (key, description, category)
   */
  getAll(): HandlerInfo[] {
    return Array.from(this.handlers.values()).map((handler) => ({
      key: handler.key,
      description: handler.description,
      category: handler.category,
    }));
  }
}

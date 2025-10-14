import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import type {
  KeyPressConfig,
  KeyPressProviderProps,
  KeyPressContextValue,
  ShortcutHandler,
  ShortcutConflict,
} from "../types";
import { DEFAULTS } from "../constants";

// Create context
const KeyPressContext = createContext<KeyPressContextValue | null>(null);

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

/**
 * Provider component that manages keyboard shortcuts globally
 */
export function KeyPressProvider({
  children,
  helpKey = DEFAULTS.HELP_KEY,
  theme = DEFAULTS.THEME,
}: KeyPressProviderProps) {
  // Registry of all handlers
  const [handlers, setHandlers] = useState<Map<string, ShortcutHandler>>(new Map());
  const handlersRef = useRef(handlers);

  // Help modal state
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // Keep ref in sync
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  /**
   * Register a new shortcut handler
   */
  const register = useCallback((config: KeyPressConfig): string => {
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

    setHandlers((prev) => {
      const next = new Map(prev);
      next.set(id, handler);
      return next;
    });

    // Check for conflicts in development
    if (process.env.NODE_ENV === "development") {
      setTimeout(() => {
        const conflicts = getConflictsForKey(normalizedKey, handlersRef.current);
        if (conflicts.length > 1) {
          console.warn(
            `[Chord] Shortcut conflict detected for "${config.key}":\n`,
            conflicts.map((h) => `  - ${h.description} (${h.component || "unknown"})`).join("\n"),
          );
        }
      }, 0);
    }

    return id;
  }, []);

  /**
   * Unregister a shortcut handler
   */
  const unregister = useCallback((id: string) => {
    setHandlers((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  /**
   * Get all registered handlers
   */
  const getHandlers = useCallback((): ShortcutHandler[] => {
    return Array.from(handlers.values());
  }, [handlers]);

  /**
   * Get conflicts for a specific key
   */
  const getConflictsForKey = (
    key: string,
    handlerMap: Map<string, ShortcutHandler>,
  ): ShortcutHandler[] => {
    return Array.from(handlerMap.values()).filter((h) => h.key === key && h.enabled);
  };

  /**
   * Get all conflicts
   */
  const getConflicts = useCallback((): ShortcutConflict[] => {
    const conflictMap = new Map<string, ShortcutHandler[]>();

    handlers.forEach((handler) => {
      if (!handler.enabled) return;

      if (!conflictMap.has(handler.key)) {
        conflictMap.set(handler.key, []);
      }
      conflictMap.get(handler.key)!.push(handler);
    });

    // Only return keys with actual conflicts (more than one handler)
    return Array.from(conflictMap.entries())
      .filter(([_, handlers]) => handlers.length > 1)
      .map(([key, handlers]) => ({ key, handlers }));
  }, [handlers]);

  /**
   * Handle keyboard events
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore events from input fields unless explicitly allowed
      const target = event.target as HTMLElement;
      const isInputField =
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable;

      const normalizedKey = normalizeKeyEvent(event);

      // Check for help key
      if (event.key === helpKey && !event.metaKey && !event.ctrlKey && !event.altKey) {
        if (!isInputField) {
          setHelpModalOpen((prev) => !prev);
          event.preventDefault();
          return;
        }
      }

      // Find matching handlers
      const matchingHandlers = Array.from(handlersRef.current.values()).filter(
        (h) => h.key === normalizedKey && h.enabled,
      );

      if (matchingHandlers.length > 0) {
        // Don't trigger shortcuts in input fields by default
        if (isInputField) return;

        // Execute all matching handlers
        matchingHandlers.forEach((handler) => {
          if (handler.preventDefault) {
            event.preventDefault();
          }
          handler.onPress();
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [helpKey]);

  const value: KeyPressContextValue = {
    register,
    unregister,
    getHandlers,
    getConflicts,
    helpModalOpen,
    openHelpModal: () => setHelpModalOpen(true),
    closeHelpModal: () => setHelpModalOpen(false),
  };

  return (
    <KeyPressContext.Provider value={value}>
      {children}
      {/* TODO: Add HelpModal component here when implemented */}
    </KeyPressContext.Provider>
  );
}

/**
 * Hook to access the KeyPress context
 */
export function useKeyPressContext(): KeyPressContextValue {
  const context = useContext(KeyPressContext);
  if (!context) {
    throw new Error("useKeyPressContext must be used within a KeyPressProvider");
  }
  return context;
}

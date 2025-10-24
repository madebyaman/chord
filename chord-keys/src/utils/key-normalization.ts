import type { NormalizedKey, NormalizedKeyString, Platform } from "../types";

/**
 * Get the current platform using modern APIs
 * Falls back to user agent parsing if navigator.userAgentData is unavailable
 */
export function getPlatform(): Platform {
  if (typeof window === "undefined") {
    return "linux"; // SSR fallback
  }

  // Try modern API first (Chromium-based browsers)
  if ("userAgentData" in navigator) {
    const platform = (navigator as any).userAgentData?.platform?.toLowerCase();
    if (platform) {
      if (platform.includes("mac")) return "darwin";
      if (platform.includes("win")) return "win32";
      return "linux";
    }
  }

  // Fallback to user agent string parsing
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes("mac")) {
    return "darwin";
  }

  if (userAgent.includes("win")) {
    return "win32";
  }

  // Check for Linux, Android, etc.
  if (userAgent.includes("linux") || userAgent.includes("android")) {
    return "linux";
  }

  return "linux"; // Default fallback
}

/**
 * Check if the current platform is macOS
 */
export function isMac(): boolean {
  return getPlatform() === "darwin";
}

/**
 * Special key name mappings
 */
const SPECIAL_KEY_MAP: Record<string, string> = {
  // Escape variations
  esc: "escape",
  escape: "escape",

  // Enter variations
  return: "enter",
  enter: "enter",

  // Space variations
  " ": "space",
  space: "space",
  spacebar: "space",

  // Arrow keys
  up: "arrowup",
  arrowup: "arrowup",
  down: "arrowdown",
  arrowdown: "arrowdown",
  left: "arrowleft",
  arrowleft: "arrowleft",
  right: "arrowright",
  arrowright: "arrowright",

  // Delete/Backspace
  delete: "delete",
  del: "delete",
  backspace: "backspace",

  // Tab
  tab: "tab",

  // Other common keys
  home: "home",
  end: "end",
  pageup: "pageup",
  pagedown: "pagedown",
  insert: "insert",
};

/**
 * Normalize a key name (e.g., "Escape" -> "escape", " " -> "space")
 */
export function normalizeKeyName(key: string): string {
  const lower = key.toLowerCase();
  return SPECIAL_KEY_MAP[lower] || lower;
}

/**
 * Serialize a NormalizedKey object to a string
 * Maintains consistent order: ctrl, alt, shift, meta, key
 */
export function serializeNormalizedKey(parts: NormalizedKey): string {
  const modifiers: string[] = [];

  // Consistent order
  if (parts.ctrl) modifiers.push("ctrl");
  if (parts.alt) modifiers.push("alt");
  if (parts.shift) modifiers.push("shift");
  if (parts.meta) modifiers.push("meta");

  return [...modifiers, parts.key].join("+");
}

/**
 * Parse a shortcut string into parts
 */
export function parseShortcut(shortcut: string): string[] {
  return shortcut
    .toLowerCase()
    .trim()
    .split("+")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/**
 * Validate shortcut parts for conflicts
 * Throws error if invalid combinations are detected
 */
export function validateShortcut(parts: string[]): void {
  const hasMod = parts.includes("mod");
  const hasCtrl = parts.includes("ctrl") || parts.includes("control") || parts.includes("ctrl");
  const hasMeta = parts.includes("meta") || parts.includes("cmd") || parts.includes("command");

  if (hasMod && hasCtrl) {
    throw new Error(
      `Invalid shortcut: Cannot use 'mod' with 'ctrl' (resolves to 'ctrl+ctrl' on Windows/Linux)`,
    );
  }

  if (hasMod && hasMeta) {
    throw new Error(
      `Invalid shortcut: Cannot use 'mod' with 'meta'/'cmd' (resolves to 'meta+meta' on macOS)`,
    );
  }

  // Find the actual key (non-modifier)
  const modifiers = ["mod", "ctrl", "control", "meta", "cmd", "command", "alt", "option", "shift"];
  const keys = parts.filter((part) => !modifiers.includes(part));

  if (keys.length === 0) {
    throw new Error(`Invalid shortcut: No key specified (only modifiers)`);
  }

  if (keys.length > 1) {
    throw new Error(`Invalid shortcut: Multiple keys specified (${keys.join(", ")})`);
  }
}

/**
 * Normalize a shortcut string (e.g., from useKeyPress)
 * Converts platform-agnostic shortcuts to platform-specific normalized strings
 *
 * @param shortcut - The shortcut string (e.g., "mod+s", "ctrl+shift+k")
 * @param platform - The target platform (defaults to current platform)
 * @returns Normalized key string (e.g., "meta+s", "ctrl+shift+k")
 *
 * @example
 * normalizeShortcut("mod+s", "darwin") // "meta+s"
 * normalizeShortcut("mod+s", "win32") // "ctrl+s"
 * normalizeShortcut("cmd+k", "darwin") // "meta+k"
 * normalizeShortcut("shift+mod+k", "darwin") // "shift+meta+k" (sorted)
 */
export function normalizeShortcut(
  shortcut: string,
  platform: Platform = getPlatform(),
): NormalizedKeyString {
  const parts = parseShortcut(shortcut);

  // Validate before processing
  validateShortcut(parts);

  // Build normalized representation
  const normalized: NormalizedKey = {
    key: "",
    meta: false,
    ctrl: false,
    shift: false,
    alt: false,
  };

  for (const part of parts) {
    switch (part) {
      // Mod resolution (platform-dependent)
      case "mod":
        if (platform === "darwin") {
          normalized.meta = true;
        } else {
          normalized.ctrl = true;
        }
        break;

      // Meta aliases
      case "meta":
      case "cmd":
      case "command":
        if (platform !== "darwin" && ["cmd", "command"].includes(part)) normalized.ctrl = true;
        else normalized.meta = true;
        break;

      // Ctrl aliases
      case "ctrl":
      case "control":
        normalized.ctrl = true;
        break;

      case "shift":
        normalized.shift = true;
        break;

      // Alt aliases
      case "alt":
      case "option":
        normalized.alt = true;
        break;

      // Everything else is the key
      default:
        if (!normalized.key) {
          normalized.key = normalizeKeyName(part);
        }
        break;
    }
  }

  // Check for duplicate modifiers after resolution
  const activeModifiers = [
    normalized.ctrl && "ctrl",
    normalized.alt && "alt",
    normalized.shift && "shift",
    normalized.meta && "meta",
  ].filter(Boolean);

  const uniqueModifiers = [...new Set(activeModifiers)];
  if (activeModifiers.length !== uniqueModifiers.length) {
    throw new Error(`Invalid shortcut '${shortcut}': Duplicate modifiers detected`);
  }

  return serializeNormalizedKey(normalized);
}

/**
 * Normalize a keyboard event to a comparable string
 *
 * @param event - The keyboard event
 * @returns Normalized key string (e.g., "ctrl+shift+k", "meta+s")
 *
 * @example
 * // User presses cmd+s on Mac
 * normalizeEvent({ key: 's', metaKey: true }) // "meta+s"
 *
 * // User presses ctrl+shift+k on Windows
 * normalizeEvent({ key: 'k', ctrlKey: true, shiftKey: true }) // "ctrl+shift+k"
 */
export function normalizeEvent(event: KeyboardEvent): NormalizedKeyString {
  const normalized: NormalizedKey = {
    key: normalizeKeyName(event.key),
    meta: event.metaKey,
    ctrl: event.ctrlKey,
    shift: event.shiftKey,
    alt: event.altKey,
  };

  return serializeNormalizedKey(normalized);
}

/**
 * Check if two shortcuts are equivalent after normalization
 *
 * @param shortcut1 - First shortcut string
 * @param shortcut2 - Second shortcut string
 * @param platform - The target platform (defaults to current platform)
 * @returns Whether the shortcuts are equivalent
 *
 * @example
 * areShortcutsEqual("mod+s", "cmd+s", "darwin") // true
 * areShortcutsEqual("mod+s", "ctrl+s", "win32") // true
 * areShortcutsEqual("shift+mod+k", "mod+shift+k") // true (order doesn't matter)
 */
export function areShortcutsEqual(
  shortcut1: string,
  shortcut2: string,
  platform?: Platform,
): boolean {
  return normalizeShortcut(shortcut1, platform) === normalizeShortcut(shortcut2, platform);
}

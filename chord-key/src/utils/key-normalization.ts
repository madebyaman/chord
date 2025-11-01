import type { NormalizedKey, NormalizedKeyString  } from "../types";
import { macosSymbolKeys, macosUppercaseKeys } from "./mac-symbols";

/**
 * Get the current platform using modern APIs
 * Falls back to user agent parsing if navigator.userAgentData is unavailable
 */
export function isMac(): boolean {
  if (typeof window === "undefined") {
    return false; // SSR fallback
  }

  const matchApplePlatform = /Mac|iPod|iPhone|iPad/i;

  // Try modern API first (Chromium-based browsers)
  if ("userAgentData" in window.navigator) {
    const userAgentData = (window.navigator as any).userAgentData;
    if (userAgentData?.platform) {
      const platform = userAgentData.platform.toLowerCase();
      if (matchApplePlatform.test(platform)) return true;
      return false;
    }
  }

  // Fallback to user agent string parsing
  const userAgent = navigator.userAgent;

  if (matchApplePlatform.test(userAgent)) {
    return true;
  }

  return false
}

/**
 * Special key name mappings for keys that can't be stored in string format
 */
const SPECIAL_KEY_MAP: Record<string, string> = {
  " ": "Space",
  "+":"Plus"
};

/**
 * Normalize a keyboard event's key value to account for platform-specific behavior. Converts mac
 *
 * @param event - The keyboard event containing the key to normalize
 * @returns The normalized key name ready for shortcut string format
 *
 * @example
 * // Mac + Alt + 2 produces '™', but we need 'TM'
 * normalizeKeyName({ key: '™', altKey: true }) // 'TM'
 *
 * // Mac + Cmd + Shift + k produces 'k', but we need 'K'
 * normalizeKeyName({ key: 'k', metaKey: true, shiftKey: true }) // 'K'
 *
 * // '+' symbol can't be stored, so convert to 'Plus'
 * normalizeKeyName({ key: '+' }) // 'Plus'
 */
function normalizeKeyName(event: KeyboardEvent): string {
  const key = event.key
  if (modifierKeyNames.includes(key)) return key
  // When `Alt` is pressed Mac outputs symbols so convert back to valid key
  const altNormalizedKey =
    event.altKey && isMac() ? macosSymbolKeys[key] ?? key : key

  // MacOS outputs lowercase characters when `Command+Shift` is held, so we map them back to uppercase if we can
  const shiftNormalizedKey =
    event.shiftKey && isMac()
      ? macosUppercaseKeys[altNormalizedKey] ?? altNormalizedKey
      : altNormalizedKey

  // Some symbols can't be used because of hotkey string format, so we replace them with 'synthetic' named keys
  const syntheticKey = SPECIAL_KEY_MAP[shiftNormalizedKey] ?? shiftNormalizedKey
  return syntheticKey
}

export const modifierKeyNames: string[] = ['Control', 'Alt', 'Meta', 'Shift'] as const

/**
 * Serialize a NormalizedKey object to a string
 * Maintains consistent order: ctrl, alt,  meta, shift,  key
 */
function serializeNormalizedKey(parts: NormalizedKey): string {
  const keyString: string[] = [];

  // Consistent order
  if (parts.ctrl) keyString.push(modifierKeyNames[0]);
  if (parts.alt) keyString.push(modifierKeyNames[1]);
  if (parts.meta) keyString.push(modifierKeyNames[2]);
  if (parts.shift) keyString.push(modifierKeyNames[3]);
  if (parts.key) keyString.push(parts.key)

  return keyString.join('+')

}

/**
 * Parse a shortcut string into parts
 */
export function parseShortcut(shortcut: string): string[] {
  return shortcut
    .trim()
    .split("+")
    .map((part) => part.trim())
    .map(part => {
      // convert modifier to lowercase
      if (modifiers.includes(part.toLowerCase())) return part.toLowerCase()
      else return part
    })
    .filter((part) => part.length > 0);
}

const modifiers = ["mod", "ctrl", "control", "meta", "cmd", "command", "alt", "option", "shift"];

/**
 * Validate shortcut parts for conflicts and warn about potential issues.
 * Invalid combinations will be silently normalized (using only the first modifier),
 * but we warn the developer to help catch configuration errors early.
 */
export function validateShortcut(parts: string[]): void {
  const hasMod = parts.includes("mod");
  const hasCtrl = parts.includes("ctrl") || parts.includes("control") || parts.includes("ctrl");
  const hasMeta = parts.includes("meta") || parts.includes("cmd") || parts.includes("command");

  if (hasMod && hasCtrl) {
    console.warn(
      `[Chord] Shortcut warning: Cannot use 'mod' with 'ctrl' together. The 'mod' will be used (resolves to 'ctrl' on Windows/Linux and 'meta' on macOS). Please remove 'ctrl' from: ${parts.join("+")}`,
    );
  }

  if (hasMod && hasMeta) {
    console.warn(
      `[Chord] Shortcut warning: Cannot use 'mod' with 'meta'/'cmd' together. The 'mod' will be used (resolves to 'meta' on macOS and 'ctrl' on Windows/Linux). Please remove 'meta'/'cmd' from: ${parts.join("+")}`,
    );
  }

  // Find the actual key (non-modifier)
  const keys = parts.filter((part) => !modifiers.includes(part));

  if (keys.length === 0) {
    console.warn(`[Chord] Shortcut warning: No key specified, only modifiers in: ${parts.join("+")}`);
  }

  if (keys.length > 1) {
    console.warn(`[Chord] Shortcut warning: Multiple keys specified (${keys.join(", ")}). Only the first will be used in: ${parts.join("+")}`);
  }
}

/**
 * Normalize a shortcut string (e.g., from useKeyPress or useKeySequence)
 * Converts platform-agnostic shortcuts to platform-specific normalized strings
 *
 * @param shortcut - The shortcut string (e.g., "meta+s", "ctrl+shift+k")
 * @param isMac - If target platform is mac or darwin
 * @returns Normalized key string (e.g., "meta+s", "ctrl+shift+k")
 *
 * @example
 * normalizeShortcut("mod+s", true) // "Meta+s"
 * normalizeShortcut("meta+s", false) // "ctrl+s"
 * normalizeShortcut("cmd+k", true) // "meta+k"
 * normalizeShortcut("shift+mod+k",true) // "shift+meta+k" (sorted)
 */
export function normalizeShortcut(
  shortcut: string,
  isPlatformMac: boolean = isMac(),
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
      // Mod will resolve to meta in mac. Otherwise ctrl
      case "mod":
      case "cmd":
      case "command":
        if (isPlatformMac) {
          normalized.meta = true;
        } else {
          normalized.ctrl = true;
        }
        break;

      // Meta aliases
      case "meta":
        normalized.meta = true;
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
          normalized.key = part;
        }
        break;
    }
  }

  return serializeNormalizedKey(normalized);
}

/**
 * Normalize a keyboard event to a comparable string
 *
 * @param event - The keyboard event
 * @returns Normalized key string (e.g., "ctrl+shift+k", "ctrl+S")
 *
 * @example
 * // User presses cmd+s on Mac
 * normalizeEvent({ key: 's', metaKey: true }) // "meta+s"
 *
 * // User presses ctrl+shift+k
 * normalizeEvent({ key: 'k', ctrlKey: true, shiftKey: true }) // "ctrl+K"
 *
 * // User presses ? (which requires shift on US keyboards)
 * normalizeEvent({ key: '?', shiftKey: true }) // "?"
 *
 * // User presses ctrl+?
 * normalizeEvent({ key: '?', shiftKey: false, ctrlKey: true }) // "ctrl+?"
 *
 * // User presses +
 * normalizeEvent({ key: '+'  }) // "Plus"
 */
export function normalizeEvent(event: KeyboardEvent): NormalizedKeyString {
  const normalizedKeyName = normalizeKeyName(event);

  const normalized: NormalizedKey = {
    key: normalizedKeyName,
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
  isMac: boolean
): boolean {
  return normalizeShortcut(shortcut1, isMac) === normalizeShortcut(shortcut2, isMac);
}

/**
 * Checks the user key press with a registered shortcut string.
 * If user pressed Shift to produce the key (like `?` or `A`) but the registered
 * shortcut didn't include Shift, we ignore the Shift key when comparing.
 *
 * Example:
 *  - user presses Shift + / → event.key = '?'
 *  - shortcut is '?'
 *  ✅ should match, even though Shift was pressed
 */
 export function compareEventWithShortcut(event: KeyboardEvent, shortcut: string): boolean {
   const normalizedKeyName = normalizeKeyName(event);

   const normalized: NormalizedKey = {
     key: normalizedKeyName,
     meta: event.metaKey,
     ctrl: event.ctrlKey,
     shift: event.shiftKey,
     alt: event.altKey,
   };

   const serialized = serializeNormalizedKey(normalized);
   const hasShiftInShortcut = shortcut.includes(modifierKeyNames[3]);

   // If shortcut already includes Shift or user didn't press it — compare normally
   if (hasShiftInShortcut || !normalized.shift) {
     return serialized === shortcut;
   }

   // Otherwise, shortcut doesn’t have Shift but user pressed it
   // → Try comparing again but ignoring the shift key
   const withoutShift: NormalizedKey = { ...normalized, shift: false };
   const serializedWithoutShift = serializeNormalizedKey(withoutShift);

   return serializedWithoutShift === shortcut;
 }

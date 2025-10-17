/**
 * Default configuration values
 */
export const DEFAULTS = {
  /** Default help key */
  HELP_KEY: '?',

  /** Default theme */
  THEME: 'light' as const,

  /** Whether to prevent default by default */
  PREVENT_DEFAULT: true,

  /** Whether shortcuts are enabled by default */
  ENABLED: true,

  /** Default category name */
  DEFAULT_CATEGORY: 'General',

  /** Default event type for keyboard listeners */
  EVENT_TYPE: 'keydown' as const,

  /** Default capture phase setting */
  CAPTURE: false,

  /** Default passive listener setting */
  PASSIVE: false,

  /** Default once setting */
  ONCE: false,
} as const;

/**
 * Key codes that need special handling
 */
export const SPECIAL_KEYS = {
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  SPACE: ' ',
  TAB: 'Tab',
  BACKSPACE: 'Backspace',
  DELETE: 'Delete',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
} as const;

/**
 * Modifier key mappings
 */
export const MODIFIERS = {
  META: 'meta',
  CTRL: 'ctrl',
  SHIFT: 'shift',
  ALT: 'alt',
  CMD: 'cmd',      // Alias for meta on Mac
  COMMAND: 'command', // Alternative alias
} as const;

/**
 * Platform detection
 */
export const IS_MAC = typeof window !== 'undefined'
  ? /Mac|iPhone|iPad|iPod/.test(navigator.platform)
  : false;

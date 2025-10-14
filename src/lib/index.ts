// Main exports
export { KeyPressProvider } from './context/KeyPressProvider';
export { useKeyPress } from './hooks/useKeyPress';

// Type exports
export type {
  KeyPressConfig,
  ShortcutHandler,
  ShortcutConflict,
  NormalizedKey,
  KeyPressProviderProps,
  KeyPressContextValue,
} from './types';

// Constants (optional, for advanced usage)
export { DEFAULTS, SPECIAL_KEYS, MODIFIERS, IS_MAC } from './constants';

// Main exports
export { useKeyPress } from "./hooks/use-keypress";
export { useKeySequence } from "./hooks/use-keysequence";
export { useGroupedHandlers } from "./hooks/use-handlers";
// export { useKeySequence } from "./hooks/use-key-sequence";
export { KeyPressDialog } from "./components/KeyPressDialog";
export { KeyPressProvider } from "./context/provider";

// Type exports
export type {
  KeyPressConfig,
  KeySequenceConfig,
  ShortcutConflict,
  NormalizedKey,
  KeyPressProviderProps,
  KeyPressContextValue,
  Platform,
} from "./types";

// Constants (optional, for advanced usage)
export { DEFAULTS, SPECIAL_KEYS, MODIFIERS, IS_MAC } from "./utils/constants";

/**
 * Configuration for a keyboard shortcut handler
 */
export interface KeyPressConfig {
  /** Key combination (e.g., "cmd+k", "ctrl+shift+s") */
  key: string;

  /** Human-readable description shown in help modal */
  description: string;

  /** Handler function to execute when key is pressed */
  onPress: () => void;

  /** Optional category for grouping in help modal */
  category?: string;

  /** Whether the shortcut is currently enabled */
  enabled?: boolean;

  /** Whether to prevent default browser behavior */
  preventDefault?: boolean;
}

/**
 * Internal representation of a registered shortcut handler
 */
export interface ShortcutHandler
  extends Required<Omit<KeyPressConfig, "enabled" | "preventDefault">> {
  /** Unique identifier for this handler */
  id: string;

  /** Component that registered this handler (for debugging) */
  component?: string;

  /** Whether the shortcut is currently enabled */
  enabled: boolean;

  /** Whether to prevent default browser behavior */
  preventDefault: boolean;

  /** Timestamp when registered */
  registeredAt: number;
}

/**
 * Represents a conflict between multiple handlers
 */
export interface ShortcutConflict {
  /** The key combination that has conflicts */
  key: string;

  /** All handlers registered for this key */
  handlers: ShortcutHandler[];
}

/**
 * Normalized key representation for cross-platform compatibility
 */
export interface NormalizedKey {
  /** The main key (e.g., "k", "Enter", "ArrowUp") */
  key: string;

  /** Whether the modifier keys are pressed */
  meta: boolean; // cmd on Mac, windows key on Windows
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
}

/**
 * Configuration options for KeyPressProvider
 */
export interface KeyPressProviderProps {
  /** Children components */
  children: React.ReactNode;

  /** Key to open help modal (default: "?") */
  helpKey?: string;

  /** Theme for help modal (default: "light") */
  theme?: "light" | "dark";
}

/**
 * Context value provided by KeyPressProvider
 */
export interface KeyPressContextValue {
  /** Register a new shortcut handler */
  register: (config: KeyPressConfig) => string;

  /** Unregister a shortcut handler by ID */
  unregister: (id: string) => void;

  /** Get all registered handlers */
  getHandlers: () => ShortcutHandler[];

  /** Get all conflicts */
  getConflicts: () => ShortcutConflict[];

  /** Whether help modal is open */
  helpModalOpen: boolean;

  /** Open the help modal */
  openHelpModal: () => void;

  /** Close the help modal */
  closeHelpModal: () => void;
}

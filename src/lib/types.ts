/**
 * Keyboard event types
 */
export enum KeyEventType {
  KeyDown = "keydown",
  KeyUp = "keyup",
  KeyPress = "keypress",
}

/**
 * Configuration for a keyboard shortcut handler
 */
export interface KeyPressConfig {
  /** Type identifier for the Core router */
  type: "keypress";

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

  /** Component that registered this handler (for debugging) */
  component?: string;

  /** Event type to listen for (default: "keydown") */
  eventType?: KeyEventType | "keydown" | "keyup" | "keypress";

  /** Custom event target (default: document) */
  target?: EventTarget;

  /** Event listener options (capture, passive, once, signal) */
  eventOptions?: AddEventListenerOptions;
}

/**
 * Configuration for a key sequence handler
 */
export interface KeySequenceConfig {
  /** Type identifier for the Core router */
  type: "sequence";

  /** Array of keys in sequence (e.g., ["g", "h"] or ["mod+k", "mod+b"]) */
  sequence: string[];

  /** Human-readable description shown in help modal */
  description: string;

  /** Handler function to execute when sequence completes */
  onComplete: () => void;

  /** Optional category for grouping in help modal */
  category?: string;

  /** Whether the sequence is currently enabled */
  enabled?: boolean;

  /** Timeout in milliseconds before sequence resets (default: 1000) */
  timeout?: number;

  /** Component that registered this sequence (for debugging) */
  component?: string;
}

/**
 * Internal representation of a registered shortcut handler
 */
export interface ShortcutHandler
  extends Required<Omit<KeyPressConfig, "enabled" | "preventDefault" | "eventOptions">> {
  /** Unique identifier for this handler */
  id: number;

  /** Whether the shortcut is currently enabled */
  enabled: boolean;

  /** Whether to prevent default browser behavior */
  preventDefault: boolean;

  /** Timestamp when registered */
  registeredAt: number;

  /** Event type this handler listens for */
  eventType: string;

  /** Target element this handler listens on */
  target: EventTarget;

  /** Whether this handler should only execute once */
  once: boolean;

  /** Whether this handler uses capture phase */
  capture: boolean;

  /** Whether this handler is passive */
  passive: boolean;

  /** AbortSignal for programmatic unregistration */
  signal?: AbortSignal;

  /** Listener key for quick group lookup (e.g., "doc:keydown:false:false") */
  listenerKey: string;
}

/**
 * Listener group manages a single event listener shared by multiple handlers
 */
export interface ListenerGroup {
  /** Set of handler IDs using this listener */
  handlerIds: Set<number>;

  /** The bound handler function attached to the target */
  boundHandler: (e: Event) => void;

  /** Event type (keydown, keyup, keypress) */
  eventType: string;

  /** Whether this listener uses capture phase */
  capture: boolean;

  /** Whether this listener is passive */
  passive: boolean;
}

/**
 * Represents a conflict between multiple handlers
 */
export interface ShortcutConflict {
  /** The key combination that has conflicts */
  key: string;

  /** All handlers registered for this key */
  handlers: HandlerInfo[];
}

/**
 * Platform types for key normalization
 */
export type Platform = "darwin" | "win32" | "linux";

/**
 * Normalized key representation for cross-platform compatibility
 * Used internally for manipulation before serialization
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
 * Final normalized key string format for comparison and storage
 * Example: "ctrl+shift+k", "meta+s", "escape"
 */
export type NormalizedKeyString = string;

/**
 * Configuration options for KeyPressProvider
 */
export interface KeyPressProviderProps {
  /** Children components */
  children: React.ReactNode;

  /** Conflict resolution strategy (default: "warn") */
  conflictResolution?: "warn" | "firstWins" | "lastWins" | "scopePriority" | "error";
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

export interface KeyPressDialogProps {
  /** Key to open help modal (default: "?") */
  helpKey?: string;

  /** Theme for help modal (default: "light") */
  theme?: "light" | "dark";

  /** Whether to show conflicts in console and help modal (default: true in dev) */
  showConflicts?: boolean;
}

/**
 * Simplified handler info returned by getAll()
 * Used for displaying shortcuts and detecting conflicts
 */
export interface HandlerInfo {
  /** The key combination or sequence */
  key?: string;
  keySequence?: string[];
  /** Human-readable description */
  description: string;
  /** Category for grouping */
  category: string;
}

/**
 * Generic interface for keyboard shortcut managers
 * Implemented by KeyPress and KeySequence classes
 */
export interface KeyManager<TConfig, THandler> {
  /** Register a handler with a pre-generated ID from Core */
  register(config: TConfig, id: number): THandler;

  /** Unregister a handler by ID */
  unregister(id: number): void;

  /** Get all registered handlers as simplified info objects */
  getAll(): HandlerInfo[];
}

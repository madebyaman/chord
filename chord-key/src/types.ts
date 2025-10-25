/**
 * Base keyboard handler configuration
 */
interface BaseKeyConfig {
  /** Human-readable description (for help UI or docs) */
  description: string;

  /** Optional category for grouping in help modal */
  category?: string;

  /** Whether this handler is currently active */
  enabled?: boolean;

  /** Component that registered this handler (for debugging) */
  component?: string;
}

/**
 * Configuration for a single key or combination
 *
 * @property preventDefault - Prevents default browser behavior.
 *   NOTE: Only works when there are no longer sequences starting with this key.
 *   Example: preventDefault on "g" won't work if ["g", "h"] is also registered,
 *   because the system must wait to see if "h" follows.
 */
export interface KeyPressConfig extends BaseKeyConfig {
  /** Key combination (e.g. "ctrl+k", "cmd+shift+s") */
  key: string;

  /** Handler when key is pressed */
  onPress: () => void;

  /** Event type (default: keydown) */
  eventType?: "keydown" | "keyup" | "keypress";

  /** Whether to prevent default browser behavior (only works when `key` doesn't match a key sequence key.) */
  preventDefault?: boolean;
}

/**
 * Configuration for a key sequence (e.g. g,h or g,h,e)
 */
export interface KeySequenceConfig extends BaseKeyConfig {
  /** Sequence of keys (e.g. ["g", "h"]) */
  sequence: string[];

  /** Handler when full sequence completes */
  onComplete: () => void;

  /** Timeout between keys before reset (default: 1000ms) */
  timeout?: number;

  /** Event type (default: keydown) */
  eventType?: "keydown" | "keyup" | "keypress";
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
  eventType: "keydown" | "keyup" | "keypress";
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
}

export interface ShortcutsDialogProps {
  /** Key to open help modal (default: "?") */
  helpKey?: string;
}

/**
 * Simplified handler info returned by getAll()
 * Used for displaying shortcuts and detecting conflicts
 */
export interface HandlerInfo {
  /** The key combination or sequence */
  keySequence: string[];
  /** Human-readable description */
  description: string;
  /** Category for grouping */
  category: string;
  component: string;
}

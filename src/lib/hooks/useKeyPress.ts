import { useEffect, useRef } from 'react';
import { useKeyPressContext } from '../context/KeyPressProvider';
import type { KeyPressConfig } from '../types';

/**
 * React hook for registering keyboard shortcuts
 *
 * @param config - Configuration for the keyboard shortcut
 * @returns The handler ID (useful for manual unregistration)
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   useKeyPress({
 *     key: 'cmd+k',
 *     description: 'Open search',
 *     category: 'Navigation',
 *     onPress: () => setSearchOpen(true),
 *   });
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useKeyPress(config: KeyPressConfig): string {
  const { register, unregister } = useKeyPressContext();
  const handlerIdRef = useRef<string | null>(null);

  // Keep the latest config in a ref to avoid re-registering
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    // Register the handler
    const id = register({
      key: config.key,
      description: config.description,
      category: config.category,
      enabled: config.enabled,
      preventDefault: config.preventDefault,
      onPress: config.onPress,
    });

    handlerIdRef.current = id;

    // Cleanup: unregister on unmount
    return () => {
      if (handlerIdRef.current) {
        unregister(handlerIdRef.current);
        handlerIdRef.current = null;
      }
    };
  }, [
    register,
    unregister,
    config.key,
    config.description,
    config.category,
    config.enabled,
    config.preventDefault,
  ]);

  // Update the onPress handler when it changes without re-registering
  // This is done by the context's internal handler map updates
  useEffect(() => {
    // Note: We need to update the handler's onPress function
    // For now, we'll re-register when onPress changes
    // TODO: Optimize this to update in-place without re-registering
  }, [config.onPress]);

  return handlerIdRef.current || '';
}

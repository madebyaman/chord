import { useEffect, useRef } from "react";
import type { KeyPressConfig } from "../types";
import { useKeyPressContext } from "../context/provider";

export function useKeyPress(config: KeyPressConfig) {
  const { instance } = useKeyPressContext();

  // Keep callback reference up to date without causing re-registration
  const callbackRef = useRef(config.onPress);
  callbackRef.current = config.onPress;

  const idRef = useRef<number | undefined>(null);

  // Register/update when config changes
  useEffect(() => {
    idRef.current = instance.registerHandler(
      {
        ...config,
        onPress: () => callbackRef.current(),
      },
      idRef.current,
    );
  }, [instance, config]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (idRef.current) {
        instance.unregisterHandler(idRef.current);
      }
    };
  }, [instance]);
}

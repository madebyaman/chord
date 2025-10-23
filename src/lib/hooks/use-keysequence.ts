import { useEffect, useRef } from "react";
import type { KeySequenceConfig } from "../types";
import { useKeyPressContext } from "../context/provider";

export function useKeySequence(config: KeySequenceConfig) {
  const { instance } = useKeyPressContext();

  // Keep callback reference up to date without causing re-registration
  const callbackRef = useRef(config.onComplete);
  callbackRef.current = config.onComplete;

  const idRef = useRef<number>();

  // Register/update when config changes
  useEffect(() => {
    idRef.current = instance.registerHandler(
      {
        ...config,
        onComplete: () => callbackRef.current(),
      },
      idRef.current
    );
  }, [instance, config]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (idRef.current !== undefined) {
        instance.unregisterHandler(idRef.current);
      }
    };
  }, [instance]);
}

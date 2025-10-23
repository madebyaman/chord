import { useEffect } from "react";
import type { KeySequenceConfig } from "../types";
import { useKeyPressContext } from "../context/provider";

export function useKeySequence(config: KeySequenceConfig) {
  const { instance } = useKeyPressContext();

  useEffect(() => {
    const id = instance.registerHandler(config);
    return () => instance.unregisterHandler(id);
  }, [instance, config]);
}

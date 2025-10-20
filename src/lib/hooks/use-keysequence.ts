import { useEffect } from "react";
import type { KeySequenceConfig } from "../types";
import { useKeyPressContext } from "../context/provider";

export function useKeySequence(config: KeySequenceConfig) {
  const context = useKeyPressContext();

  useEffect(() => {
    const id = context.registerHandler('sequence', config);
    return () => context.unregisterHandler(id);
  }, [context, config]);
}

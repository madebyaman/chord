import { useEffect } from "react";
import type { KeyPressConfig } from "./types";
import { useKeyPressContext } from "./provider";

export function useKeyPress(config: KeyPressConfig) {
  const context = useKeyPressContext();

  useEffect(() => {
    const id = context.registerHandler(config);
    return () => context.unregisterHandler(id);
  }, [config, context]);
}

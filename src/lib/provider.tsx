import { ChordCore } from "./core";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { KeyPressProviderProps } from "./types";

const ChordContext = createContext<ChordCore | null>(null);

const KeyPressProvider = ({ children, ...props }: KeyPressProviderProps) => {
  // This state hook is only used to trigger re-renders
  const [, setEmptyState] = useState({});
  const rerender = useCallback(() => setEmptyState({}), []);
  const [instance] = useState(() => new ChordCore());

  // Effect to register subscriber
  useEffect(() => {
    const unsubscribe = instance.subscribe(() => rerender());
    return unsubscribe;
  }, [instance, rerender]);

  return <ChordContext.Provider value={instance}>{children}</ChordContext.Provider>;
};

export function useKeyPressContext() {
  const context = useContext(ChordContext);
  if (!context) {
    throw new Error("useKeyPressContext must be used within a KeyPressProvider");
  }
  return context;
}

export default KeyPressProvider;

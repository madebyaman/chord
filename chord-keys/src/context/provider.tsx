import { ChordCore } from "../core/core";
import { createContext, useContext, useState } from "react";
import type { KeyPressProviderProps } from "../types";

interface ChordContextValue {
  instance: ChordCore;
}

const ChordContext = createContext<ChordContextValue | null>(null);

const KeyPressProvider = ({ children }: KeyPressProviderProps) => {
  const [instance] = useState(() => new ChordCore());

  return (
    <ChordContext.Provider value={{ instance }}>
      {children}
    </ChordContext.Provider>
  );
};

export function useKeyPressContext() {
  const context = useContext(ChordContext);
  if (!context) {
    throw new Error(
      "useKeyPressContext must be used within a KeyPressProvider",
    );
  }
  return context;
}

export { KeyPressProvider };

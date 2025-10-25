"use client";

import { KeyPressProvider } from "chord-key";

export function Providers({ children }: { children: React.ReactNode }) {
  return <KeyPressProvider>{children}</KeyPressProvider>;
}

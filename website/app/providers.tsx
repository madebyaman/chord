"use client";

import { KeyPressProvider } from "chord-keys";

export function Providers({ children }: { children: React.ReactNode }) {
  return <KeyPressProvider>{children}</KeyPressProvider>;
}

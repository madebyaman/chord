"use client";
import { useState, useEffect } from "react";

/**
 * Hook to detect and track system theme preference
 * @returns Current system theme ("light" | "dark")
 */
export function useSystemTheme() {
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(() =>
    (typeof window !== 'undefined' && window?.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light"
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) =>
      setSystemTheme(e.matches ? "dark" : "light");

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  return systemTheme;
}

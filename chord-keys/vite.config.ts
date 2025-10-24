/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "ChordKeys",
      formats: ["es", "umd"],
      fileName: (format) => `chord-keys.${format === "es" ? "js" : "umd.cjs"}`,
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "jsxRuntime",
        },
      },
    },
  },
  test: {
    browser: {
      enabled: true,
      instances: [
        {
          browser: "firefox",
        },
      ],
    },
  },
});

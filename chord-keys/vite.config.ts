/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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

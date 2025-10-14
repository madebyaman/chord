import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import KeyPressProvider from "./lib/provider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <KeyPressProvider>
      <App />
    </KeyPressProvider>
  </StrictMode>,
);

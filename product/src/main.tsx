import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

async function bootstrap() {
  const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
  if (env?.VITE_API_MODE === "msw") {
    const { worker } = await import("./mocks/browser");
    await worker.start({ onUnhandledRequest: "bypass" });
  }
  const root = document.getElementById("root");
  if (!root) throw new Error("Missing #root element");
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();

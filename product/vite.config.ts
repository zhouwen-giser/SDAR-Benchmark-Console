import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 4173,
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    strictPort: true,
  },
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 1500,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.tsx"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: true,
  },
});

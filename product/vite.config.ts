import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const benchmarkApiUpstream =
    process.env.VITE_BENCHMARK_API_UPSTREAM || env.VITE_BENCHMARK_API_UPSTREAM || "http://127.0.0.1:18090";
  const telemetryQueryUpstream =
    process.env.VITE_TELEMETRY_QUERY_UPSTREAM || env.VITE_TELEMETRY_QUERY_UPSTREAM || "http://127.0.0.1:18080";
  return {
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
      proxy: {
        "/benchmark-api": {
          target: benchmarkApiUpstream,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/benchmark-api/, ""),
        },
        "/telemetry-api": {
          target: telemetryQueryUpstream,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/telemetry-api/, ""),
        },
      },
    },
    preview: {
      host: "0.0.0.0",
      port: 4173,
      strictPort: true,
      proxy: {
        "/benchmark-api": {
          target: benchmarkApiUpstream,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/benchmark-api/, ""),
        },
        "/telemetry-api": {
          target: telemetryQueryUpstream,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/telemetry-api/, ""),
        },
      },
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
  };
});

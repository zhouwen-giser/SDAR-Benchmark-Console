import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173",
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? "/usr/bin/google-chrome" },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    viewport: { width: 1920, height: 1080 },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1920, height: 1080 } },
    },
  ],
  webServer: {
    command: `VITE_API_MODE=http VITE_BENCHMARK_API_BASE_URL=/benchmark-api VITE_BENCHMARK_API_UPSTREAM=${process.env.VITE_BENCHMARK_API_UPSTREAM ?? "http://127.0.0.1:18090"} VITE_TELEMETRY_QUERY_BASE_URL=/telemetry-api pnpm build && pnpm preview`,
    url: "http://127.0.0.1:4173/overview",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});

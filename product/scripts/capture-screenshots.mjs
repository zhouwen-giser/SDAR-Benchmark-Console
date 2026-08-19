import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import process from "node:process";

const baseUrl = "http://127.0.0.1:4173";
const server = spawn("pnpm", ["preview"], { stdio: "inherit", shell: true });

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/overview`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Preview server did not become ready");
}

const targets = [
  ["overview-blocked-1920x1080.png", "/overview?scenario=blocked&dataState=loaded", 1920, 1080],
  ["overview-ready-1920x1080.png", "/overview?scenario=ready&dataState=loaded", 1920, 1080],
  ["overview-invalid-1920x1080.png", "/overview?scenario=invalid&dataState=loaded", 1920, 1080],
  ["overview-stale-1920x1080.png", "/overview?scenario=blocked&dataState=stale", 1920, 1080],
  ["overview-partial-1920x1080.png", "/overview?scenario=blocked&dataState=partial", 1920, 1080],
  ["overview-1600x900.png", "/overview?scenario=blocked&dataState=loaded", 1600, 900],
  ["overview-1440x900.png", "/overview?scenario=blocked&dataState=loaded", 1440, 900],
  ["runs-1920x1080.png", "/runs", 1920, 1080],
  ["run-detail-1920x1080.png", "/runs/R-20260815-004", 1920, 1080],
  ["compare-1920x1080.png", "/compare/CMP-20260815-004?changeType=REGRESSED_AND_NEW_GATE", 1920, 1080],
  ["evaluation-1920x1080.png", "/evaluations/eval-mcp17", 1920, 1080],
  ["evidence-1920x1080.png", "/evidence-bundles/bundle-cand-mcp17?tab=diff", 1920, 1080],
  ["cases-1920x1080.png", "/cases?gate=HG4", 1920, 1080],
  ["case-detail-1920x1080.png", "/cases/MCP-RESTART-017", 1920, 1080],
  ["evaluations-1920x1080.png", "/evaluations", 1920, 1080],
  ["evidence-bundles-1920x1080.png", "/evidence-bundles", 1920, 1080],
  ["analytics-1920x1080.png", "/analytics", 1920, 1080],
  ["reports-1920x1080.png", "/reports", 1920, 1080],
  ["alerts-1920x1080.png", "/alerts", 1920, 1080],
  ["settings-1920x1080.png", "/settings", 1920, 1080],
  ["candidate-detail-1920x1080.png", "/candidates/cand-142-def456", 1920, 1080],
  ["dataset-detail-1920x1080.png", "/datasets/release-v0.1", 1920, 1080],
  ["profile-detail-1920x1080.png", "/profiles/sdar-v2-review-2.1", 1920, 1080],
];

try {
  await mkdir("screenshots", { recursive: true });
  await waitForServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  for (const [filename, path, width, height] of targets) {
    await page.setViewportSize({ width, height });
    await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
    await page.screenshot({ path: `screenshots/${filename}`, fullPage: true });
  }
  await browser.close();
} finally {
  server.kill("SIGTERM");
}

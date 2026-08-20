import { expect, test, type Page } from "@playwright/test";

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    main: document.querySelector<HTMLElement>(".app-main")?.scrollWidth ?? 0,
    mainWidth: document.querySelector<HTMLElement>(".app-main")?.clientWidth ?? 0,
  }));
  expect(overflow.document).toBeLessThanOrEqual(2);
  expect(overflow.main - overflow.mainWidth).toBeLessThanOrEqual(2);
}

test("Vite same-origin proxy exposes the formal live API without mock fallback", async ({ page, request }) => {
  for (const path of ["/v1/context/options", "/v1/benchmark-runs", "/v1/case-results", "/v1/evaluations", "/v1/evidence-bundles", "/v1/reports", "/v1/system/contracts", "/v1/system/projections"]) {
    const response = await request.get(`/benchmark-api${path}`);
    expect(response.status(), path).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/json");
  }

  await page.goto("/overview?scenario=ready&dataState=loaded");
  await expect(page.getByRole("heading", { name: "SDAR 基准质量指挥中心" })).toBeVisible();
  await expect(page.getByText("无法加载当前数据快照")).toBeVisible();
  await expect(page.getByLabel("业务场景")).toHaveCount(0);
  await expect(page.getByLabel("数据状态")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("演示数据适配器");
});

test("degraded backend stays truthful and preserves the healthy control-plane modules", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "设置与系统" })).toBeVisible();
  await expect(page.getByText("PARTIAL").first()).toBeVisible();
  await expect(page.getByText("版本化合同", { exact: true })).toBeVisible();
  await expect(page.getByText("ready", { exact: true }).first()).toBeVisible();
  await expect(page.locator(".mock-corner-badge")).toHaveCount(0);
});

test("analytics failures are isolated per official module", async ({ page }) => {
  await page.goto("/analytics");
  await expect(page.getByRole("heading", { name: "指标分析工作区" })).toBeVisible();
  await expect(page.getByText("UNAVAILABLE").first()).toBeVisible();
  await expect(page.locator(".app-main")).not.toContainText("页面渲染失败");
});

test("proxy outage has no mock fallback and recovers after the route is restored", async ({ page }) => {
  await page.route("**/benchmark-api/v1/context/options", (route) => route.abort("connectionfailed"));
  await page.goto("/runs");
  const failed = await page.evaluate(async () => {
    try { await fetch("/benchmark-api/v1/context/options"); return false; } catch { return true; }
  });
  expect(failed).toBe(true);
  await expect(page.locator("body")).not.toContainText("演示数据适配器");

  await page.unroute("**/benchmark-api/v1/context/options");
  const recovered = await page.evaluate(async () => {
    const response = await fetch("/benchmark-api/v1/context/options");
    return { status: response.status, contentType: response.headers.get("content-type") };
  });
  expect(recovered.status).toBe(200);
  expect(recovered.contentType).toContain("application/json");
});

test("deep-route refresh and supported desktop viewports do not overflow", async ({ page }) => {
  for (const viewport of [{ width: 1920, height: 1080 }, { width: 1600, height: 900 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/settings");
    await page.reload();
    await expect(page.getByRole("heading", { name: "设置与系统" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});

import { expect, test, type Page } from "@playwright/test";

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const main = document.querySelector<HTMLElement>(".app-main");
    return {
      document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      main: main ? main.scrollWidth - main.clientWidth : 0,
    };
  });
  expect(overflow.document).toBeLessThanOrEqual(2);
  expect(overflow.main).toBeLessThanOrEqual(2);
}

test("blocked Overview fits 1920×1080 and exposes provenance", async ({ page }) => {
  await page.goto("/overview?scenario=blocked&dataState=loaded");
  await expect(page.getByRole("heading", { name: "SDAR 基准质量指挥中心" })).toBeVisible();
  await expect(page.getByRole("button", { name: "发布门槛：已阻塞" })).toContainText("已阻塞");
  await expect(page.getByText("演示数据").first()).toBeVisible();
  const dimensions = await page.evaluate(() => {
    const main = document.querySelector<HTMLElement>(".app-main");
    return main ? { scrollHeight: main.scrollHeight, clientHeight: main.clientHeight } : null;
  });
  expect(dimensions).not.toBeNull();
  expect(dimensions!.scrollHeight).toBeLessThanOrEqual(dimensions!.clientHeight + 2);
  await expectNoHorizontalOverflow(page);
});

test("HG4 conclusion reaches missing Receipt Evidence in three drill-downs", async ({ page }) => {
  await page.goto("/overview?scenario=blocked&dataState=loaded");
  await page.getByRole("button", { name: /新增 2 个 HG4 失败/ }).click();
  await expect(page).toHaveURL(/\/cases\?.*gate=HG4/);
  await page.getByRole("button", { name: "打开 MCP-RESTART-017 Evaluation" }).click();
  await expect(page).toHaveURL(/\/evaluations\/eval-mcp17/);
  await page.getByRole("button", { name: /HG4.*Action exists but Receipt is missing/ }).click();
  await expect(page).toHaveURL(/\/evidence-bundles\/bundle-cand-mcp17.*tab=diff/);
  await expect(page.getByText("Candidate 缺少 durable Receipt")).toBeVisible();
  await expect(page.getByText("receipt-R1").first()).toBeVisible();
});

test("Compare filters new gate failures and opens Evidence Diff", async ({ page }) => {
  await page.goto("/compare/CMP-20260815-004?changeType=ALL");
  await page.getByRole("button", { name: "NEW GATE FAILURE (2)" }).click();
  await expect(page.getByText("MCP-RESTART-017").first()).toBeVisible();
  await page.getByRole("button", { name: "Diff" }).first().click();
  await expect(page).toHaveURL(/tab=diff/);
  await expect(page.getByText("Candidate 缺少 durable Receipt")).toBeVisible();
});

test("stale and invalid states keep score semantics explicit", async ({ page }) => {
  await page.goto("/overview?scenario=blocked&dataState=stale");
  await expect(page.getByText("数据快照已过期")).toBeVisible();
  await page.goto("/overview?scenario=invalid&dataState=loaded");
  await expect(page.getByRole("button", { name: "发布门槛：不可判定" })).toContainText("不可判定");
  const quality = page.getByRole("button", { name: /质量得分/ });
  await expect(quality).toContainText("—");
});

test("extended workspaces complete their session-local workflows", async ({ page }) => {
  await page.goto("/reports");
  await page.getByRole("button", { name: /新建发布评审草稿/ }).click();
  await expect(page.getByText(/Report Preview · DRAFT-001/)).toBeVisible();

  await page.goto("/alerts");
  await page.getByRole("button", { name: "查看 ALT-HG4-017" }).click();
  await page.getByRole("button", { name: "Acknowledge" }).click();
  await expect(page.getByText("acknowledged", { exact: true }).last()).toBeVisible();
  await page.getByRole("button", { name: "Resolve" }).click();
  await expect(page.getByText("resolved", { exact: true }).last()).toBeVisible();

  await page.goto("/overview?scenario=ready&dataState=loaded");
  await page.getByRole("button", { name: "候选版本 ↗" }).click();
  await expect(page).toHaveURL(/\/candidates\/cand-142-def456/);
  await expect(page.getByRole("heading", { name: "Candidate Detail" })).toBeVisible();
});

test("all 18 primary routes render at 1600×900 without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  const routes = [
    "/overview?scenario=blocked&dataState=loaded",
    "/runs",
    "/runs/R-20260815-004",
    "/compare/CMP-20260815-004?changeType=REGRESSED_AND_NEW_GATE",
    "/cases?gate=HG4",
    "/cases/MCP-RESTART-017",
    "/evaluations",
    "/evaluations/eval-mcp17",
    "/evidence-bundles",
    "/evidence-bundles/bundle-cand-mcp17?tab=diff",
    "/analytics",
    "/reports",
    "/alerts",
    "/settings",
    "/candidates/cand-142-def456",
    "/baselines/cand-141-abc123",
    "/datasets/release-v0.1",
    "/profiles/sdar-v2-review-2.1",
  ];

  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator(".app-main")).not.toContainText("页面渲染失败");
    await expect(page.locator(".app-main")).not.toContainText("页面未找到");
    await expectNoHorizontalOverflow(page);
  }
});

test("1440×900 Overview has no horizontal page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/overview?scenario=blocked&dataState=loaded");
  await expectNoHorizontalOverflow(page);
});

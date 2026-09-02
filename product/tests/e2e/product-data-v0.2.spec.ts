import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const api = "/benchmark-api/v1";

let parentRunId = "";
let childRunId = "";

async function waitForTerminal(request: APIRequestContext, runId: string) {
  await expect.poll(async () => {
    const response = await request.get(`${api}/benchmark-runs/${encodeURIComponent(runId)}`);
    if (!response.ok()) return `http-${response.status()}`;
    const body = await response.json() as { status?: string };
    return body.status ?? "missing";
  }, { timeout: 180_000, intervals: [500, 1_000, 2_000] }).toMatch(/^(completed|completed_with_substitutions|failed|cancelled)$/u);
}

function currentRunId(page: Page) {
  const match = new URL(page.url()).pathname.match(/^\/runs\/(run_[a-z0-9]+)$/u);
  if (!match) throw new Error(`Expected dynamic Run URL, received ${page.url()}`);
  return match[1]!;
}

test.describe.serial("Product Data API v0.2 live HTTP workflow", () => {
  test.setTimeout(240_000);

  test("discovers the catalog and creates a custom ordered three-case run", async ({ page, request }) => {
    const presets = await request.get(`${api}/benchmark-run-presets`);
    expect(presets.status()).toBe(200);
    const presetBody = await presets.json() as { operationId: string; data: unknown[] };
    expect(presetBody.operationId).toBe("listBenchmarkRunPresets");
    expect(presetBody.data.length).toBeGreaterThanOrEqual(3);

    await page.goto("/runs/new");
    await expect(page.getByRole("heading", { name: "新建 Benchmark Run" })).toBeVisible();
    await expect(page.getByText("UGV Diagnostic Regression").first()).toBeVisible();
    const caseCheckboxes = page.locator(".run-catalog-case-grid input[type=checkbox]");
    await expect(caseCheckboxes).toHaveCount(12);
    for (const caseId of ["UGV-CORE-001", "UGV-CORE-002", "UGV-CORE-003", "UGV-MCP-001", "UGV-MCP-002", "UGV-MCP-003", "UGV-XCHAIN-001", "UGV-XCHAIN-002", "UGV-XCHAIN-003"]) {
      await page.getByRole("checkbox", { name: `${caseId} · ${caseId}` }).uncheck();
    }
    const repeat = page.getByRole("spinbutton", { name: "Repeat count" });
    await repeat.fill("1");
    await page.getByRole("button", { name: "UGV-NODE-001 down" }).click();
    await expect(page.locator(".run-catalog-configurator .ant-table-wrapper tbody tr").first()).toContainText("UGV-NODE-002");

    await page.getByRole("button", { name: /执行预检/u }).click();
    await expect(page.getByText("ready_with_substitutions", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: /创建 Benchmark Run/u }).click();
    await expect(page).toHaveURL(/\/runs\/run_[a-z0-9]+/u);
    parentRunId = currentRunId(page);
    await waitForTerminal(request, parentRunId);
    await page.reload();
    await expect(page.getByRole("heading", { name: `Benchmark Run ${parentRunId}` })).toBeVisible();
    await expect(page.getByText("Product Diagnostic Summary")).toBeVisible();
    await expect(page.locator(".run-detail-page")).toContainText("NOT FORMAL QUALIFICATION");

    const summary = await (await request.get(`${api}/benchmark-runs/${parentRunId}/diagnostic-summary`)).json() as { data: { caseCount: number; repetitionCount: number; formalEligible: boolean; score: null; releaseGate: string } };
    expect(summary.data).toMatchObject({ caseCount: 3, repetitionCount: 3, formalEligible: false, score: null, releaseGate: "unavailable" });
  });

  test("reruns one selected case as an immutable child and opens verified artifact content", async ({ page, request }) => {
    expect(parentRunId).not.toBe("");
    await page.goto(`/runs/${parentRunId}`);
    await expect(page.getByText("Rerun selected Cases")).toBeVisible();
    const rerunCheckboxes = page.locator(".rerun-case-grid input[type=checkbox]");
    await expect(rerunCheckboxes).toHaveCount(3);
    await page.getByRole("checkbox", { name: "UGV-NODE-001", exact: true }).click();
    await page.getByRole("checkbox", { name: "UGV-NODE-003", exact: true }).click();
    await page.getByRole("button", { name: "创建子 Run" }).click();
    await expect(page).toHaveURL(/\/runs\/run_[a-z0-9]+.*parentRunId=/u);
    childRunId = currentRunId(page);
    expect(childRunId).not.toBe(parentRunId);
    await waitForTerminal(request, childRunId);
    await page.reload();
    await expect(page.getByText("Parent / Child Run lineage")).toBeVisible();
    await expect(page.getByRole("button", { name: parentRunId })).toBeVisible();

    const parent = await (await request.get(`${api}/benchmark-runs/${parentRunId}/diagnostic-summary`)).json() as { data: { caseCount: number; repetitionCount: number } };
    const child = await (await request.get(`${api}/benchmark-runs/${childRunId}/diagnostic-summary`)).json() as { data: { caseCount: number; repetitionCount: number } };
    expect(parent.data).toMatchObject({ caseCount: 3, repetitionCount: 3 });
    expect(child.data).toMatchObject({ caseCount: 1, repetitionCount: 1 });

    const repetitions = await (await request.get(`${api}/benchmark-runs/${childRunId}/repetitions`)).json() as { data: Array<{ repetitionId: string }> };
    const repetitionId = repetitions.data[0]?.repetitionId;
    expect(repetitionId).toBeTruthy();
    const artifacts = await (await request.get(`${api}/benchmark-runs/${childRunId}/repetitions/${repetitionId}/artifacts`)).json() as { data: Array<{ artifactRef: { artifactId?: string } }> };
    const artifactId = artifacts.data.find((item) => item.artifactRef.artifactId)?.artifactRef.artifactId;
    expect(artifactId).toBeTruthy();
    await page.goto(`/runs/${childRunId}/repetitions/${repetitionId}/artifacts/${artifactId}`);
    await expect(page.getByRole("heading", { name: `Artifact ${artifactId}` })).toBeVisible();
    await expect(page.getByText("verified", { exact: true })).toBeVisible();
    await expect(page.getByText("Immutable relation metadata")).toBeVisible();
  });

  test("renders typed analytics and complete data coverage without formal scores", async ({ page, request }) => {
    await page.goto("/analytics");
    await expect(page.getByRole("heading", { name: "指标分析工作区" })).toBeVisible();
    await expect(page.getByText("Diagnostic Outcome Distribution")).toBeVisible();
    await expect(page.locator(".app-main")).not.toContainText("页面渲染失败");

    await page.goto("/data-completeness");
    await expect(page.getByRole("heading", { name: "数据完整性" })).toBeVisible();
    await expect(page.getByText("complete", { exact: true }).first()).toBeVisible();
    await expect(page.locator(".app-main")).not.toContainText(/\{\s*"/u);

    const scoreResponse = await request.get(`${api}/analytics/score-distribution`);
    expect(scoreResponse.status()).toBe(200);
    const score = await scoreResponse.json() as { data: Array<{ observationCount: number; p10: null; p25: null; median: null; p75: null; p90: null; availability: string; reasonCodes: string[] }> };
    expect(score.data[0]).toMatchObject({ observationCount: 0, p10: null, p25: null, median: null, p75: null, p90: null });
    expect(score.data[0]?.reasonCodes).toContain("NO_FORMAL_SCORES");
  });
});

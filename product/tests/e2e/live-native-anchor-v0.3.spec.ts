import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const api = "/benchmark-api/v1";
const anchorCases = ["UGV-NODE-001", "UGV-CORE-001", "UGV-MCP-003", "UGV-XCHAIN-003"];

function runIdFromPage(page: Page) {
  const match = new URL(page.url()).pathname.match(/^\/runs\/(run_[a-z0-9]+)$/u);
  if (!match) throw new Error(`Expected a Run detail URL, received ${page.url()}`);
  return match[1]!;
}

async function waitForTerminal(request: APIRequestContext, runId: string) {
  await expect.poll(async () => {
    const response = await request.get(`${api}/benchmark-runs/${encodeURIComponent(runId)}`);
    if (!response.ok()) return `http-${response.status()}`;
    const body = await response.json() as { status?: string };
    return body.status ?? "missing";
  }, { timeout: 900_000, intervals: [1_000, 2_000, 5_000] }).toMatch(/^(completed|completed_with_substitutions|failed|cancelled)$/u);
}

test("Console creates and verifies the four-case live-native anchor", async ({ page, request }, testInfo) => {
  test.skip(process.env.LIVE_NATIVE_CREATE !== "1", "Set LIVE_NATIVE_CREATE=1 only after four-party native preflight is eligible.");
  test.setTimeout(960_000);

  const rerunParent = process.env.LIVE_NATIVE_RERUN_PARENT;
  let runId: string;
  if (rerunParent) {
    await page.goto(`/runs/${rerunParent}`);
    await expect(page.getByText("Rerun selected Cases")).toBeVisible();
    await expect(page.locator(".rerun-case-grid input[type=checkbox]")).toHaveCount(4);
    await page.getByRole("radio", { name: "live", exact: true }).click();
    await page.getByRole("button", { name: "创建子 Run" }).click();
    await expect(page).toHaveURL(/\/runs\/run_[a-z0-9]+.*parentRunId=/u, { timeout: 30_000 });
    runId = runIdFromPage(page);
  } else {
    await page.goto("/runs/new");
    await expect(page.getByRole("heading", { name: "新建 Benchmark Run" })).toBeVisible();
    await expect(page.getByText("UGV Diagnostic Regression").first()).toBeVisible();
    await page.getByText("Development · simulated", { exact: true }).click();
    await page.getByText("Development · live native", { exact: true }).click();

    for (const caseId of [
      "UGV-NODE-002", "UGV-NODE-003",
      "UGV-CORE-002", "UGV-CORE-003",
      "UGV-MCP-001", "UGV-MCP-002",
      "UGV-XCHAIN-001", "UGV-XCHAIN-002",
    ]) {
      await page.getByRole("checkbox", { name: `${caseId} · ${caseId}` }).click();
    }
    await page.getByRole("spinbutton", { name: "Repeat count" }).fill("1");

    await expect(page.getByRole("row", { name: /Target.*live_native/u })).toBeVisible();
    await expect(page.getByRole("row", { name: /Native requirement.*require_native/u }).last()).toBeVisible();
    await expect(page.getByRole("row", { name: /Telemetry.*require_full/u })).toBeVisible();
    await expect(page.getByRole("row", { name: /Development substitutions.*禁止/u })).toBeVisible();

    await page.getByRole("button", { name: /执行预检/u }).click();
    await expect(page.getByText("ready", { exact: true })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("ready_with_substitutions", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /创建 Benchmark Run/u })).toBeEnabled();
    await page.getByRole("button", { name: /创建 Benchmark Run/u }).click();
    await expect(page).toHaveURL(/\/runs\/run_[a-z0-9]+/u, { timeout: 30_000 });
    runId = runIdFromPage(page);
  }
  testInfo.annotations.push({ type: "live-native-run-id", description: runId });

  await waitForTerminal(request, runId);
  const authority = await (await request.get(`${api}/benchmark-runs/${runId}`)).json() as {
    status: string;
    totalCaseCount: number;
    completedCaseCount: number;
    formalEligible: boolean;
    qualityScore: null;
    releaseGate: string;
  };
  expect(authority).toMatchObject({
    status: "completed",
    totalCaseCount: 4,
    completedCaseCount: 4,
    formalEligible: false,
    qualityScore: null,
    releaseGate: "unavailable",
  });

  const summary = await (await request.get(`${api}/benchmark-runs/${runId}/diagnostic-summary`)).json() as {
    data: { caseCount: number; repetitionCount: number; terminalRepetitionCount: number; substitutionCount: number; formalEligible: boolean; score: null; releaseGate: string };
  };
  expect(summary.data).toMatchObject({
    caseCount: 4,
    repetitionCount: 4,
    terminalRepetitionCount: 4,
    substitutionCount: 0,
    formalEligible: false,
    score: null,
    releaseGate: "unavailable",
  });

  const plan = await (await request.get(`${api}/benchmark-runs/${runId}/execution-plan`)).json() as {
    data: { caseOrder: string[]; repeatCount: number; executionTarget: string; nativeRequirement: string; telemetryPolicy: string; observationTimePolicy: string; reconciliationPolicy: string; streamingEnabled: boolean };
  };
  expect(plan.data).toMatchObject({
    caseOrder: anchorCases,
    repeatCount: 1,
    executionTarget: "live_native",
    nativeRequirement: "require_native",
    telemetryPolicy: "require_full",
    observationTimePolicy: "require_source_observed_at",
    reconciliationPolicy: "automatic",
    streamingEnabled: true,
  });

  const coverage = await (await request.get(`${api}/benchmark-runs/${runId}/native-coverage`)).json() as {
    data: { overall: string; substitutedLayerCount: number; unavailableLayerCount: number; layers: Array<{ status: string }> };
  };
  expect(coverage.data.overall).toBe("native");
  expect(coverage.data.substitutedLayerCount).toBe(0);
  expect(coverage.data.unavailableLayerCount).toBe(0);
  expect(coverage.data.layers.every((layer) => ["native", "native_test_fault", "not_required"].includes(layer.status))).toBe(true);

  const repetitions = await (await request.get(`${api}/benchmark-runs/${runId}/repetitions`)).json() as {
    data: Array<{ repetitionId: string; caseId: string }>;
  };
  expect(repetitions.data.map((item) => item.caseId)).toEqual(anchorCases);
  for (const repetition of repetitions.data) {
    const [identity, telemetry, closure] = await Promise.all([
      request.get(`${api}/benchmark-runs/${runId}/repetitions/${repetition.repetitionId}/identity-closure`),
      request.get(`${api}/benchmark-runs/${runId}/repetitions/${repetition.repetitionId}/telemetry`),
      request.get(`${api}/benchmark-runs/${runId}/repetitions/${repetition.repetitionId}/provider-closure`),
    ]);
    expect(identity.status(), `${repetition.caseId} identity`).toBe(200);
    expect(telemetry.status(), `${repetition.caseId} telemetry`).toBe(200);
    expect(closure.status(), `${repetition.caseId} provider closure`).toBe(200);
    expect((await identity.json() as { data: { overallStatus: string } }).data.overallStatus, repetition.caseId).toBe("ready");
    expect((await telemetry.json() as { data: { overallStatus: string } }).data.overallStatus, repetition.caseId).toBe("ready");
    expect((await closure.json() as { data: { status: string } }).data.status, repetition.caseId).toBe("ready");
  }

  await page.reload();
  await expect(page.getByRole("heading", { name: `Benchmark Run ${runId}` })).toBeVisible();
  await expect(page.getByText("Live Run Monitor", { exact: true })).toBeVisible();
  await expect(page.getByText("COMPLETED WITH SUBSTITUTIONS", { exact: true })).toHaveCount(0);
  await expect(page.locator(".mock-corner-badge")).toHaveCount(0);
});

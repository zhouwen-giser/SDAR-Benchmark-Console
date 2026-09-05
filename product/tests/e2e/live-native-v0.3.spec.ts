import { expect, test, type Page } from "@playwright/test";

const api = "/benchmark-api/v1";

async function expectNoFixtureFallback(page: Page) {
  await expect(page.locator(".mock-corner-badge")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(/演示数据适配器|development_fixture/u);
  await expect(page.locator(".app-main")).not.toContainText(/页面渲染失败|Unexpected Application Error/u);
}

test.describe("Live-native Operations Console v0.3", () => {
  test("keeps the existing real-chain Run case matrix on its actual HTTP provenance", async ({ page, request }) => {
    const runId = process.env.LIVE_NATIVE_READ_ONLY_RUN_ID;
    test.skip(!runId, "Requires an existing completed Run; this test never creates one.");
    const response = await request.get(`${api}/benchmark-runs/${encodeURIComponent(runId!)}`);
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({
      runId,
      status: "completed",
      totalCaseCount: 2,
      completedCaseCount: 2,
      substitutionCount: 0,
      formalEligible: false,
      qualityScore: null,
      releaseGate: "unavailable",
    });
    const mutations: string[] = [];
    page.on("request", (event) => {
      if (event.url().includes("/benchmark-api/") && !["GET", "HEAD"].includes(event.method())) {
        mutations.push(`${event.method()} ${event.url()}`);
      }
    });
    await page.goto(`/runs/${encodeURIComponent(runId!)}`);
    await expect(page.getByRole("heading", { name: `Benchmark Run ${runId}` })).toBeVisible();
    const matrix = page.locator(".section-card").filter({ has: page.getByText("用例矩阵", { exact: true }) });
    await expect(matrix.getByText("HTTP", { exact: true })).toBeVisible();
    await expect(matrix.getByText("MOCK", { exact: true })).toHaveCount(0);
    await expectNoFixtureFallback(page);
    expect(mutations).toEqual([]);
  });

  test("selects the complete require-native policy from Run Create v3", async ({ page }) => {
    await page.goto("/runs/new");
    await expect(page.getByRole("heading", { name: "新建 Benchmark Run" })).toBeVisible();
    await expect(page.getByText("UGV Diagnostic Regression").first()).toBeVisible();
    await page.getByText("Development · simulated", { exact: true }).click();
    await page.getByText("Development · live native", { exact: true }).click();
    await expect(page.getByRole("row", { name: /Target.*live_native/u })).toBeVisible();
    await expect(page.getByRole("row", { name: /Native requirement.*require_native/u }).last()).toBeVisible();
    await expect(page.getByRole("row", { name: /Telemetry.*require_full/u })).toBeVisible();
    await expect(page.getByRole("row", { name: /Observation time.*require_source_observed_at/u })).toBeVisible();
    await expect(page.getByRole("row", { name: /Reconciliation.*automatic/u })).toBeVisible();
    await expect(page.getByRole("row", { name: /Development substitutions.*禁止/u })).toBeVisible();
    await expect(page.getByText("External environment boundary", { exact: true })).toBeVisible();
    await expect(page.getByText(/只有 Server preflight/u)).toBeVisible();
    await expectNoFixtureFallback(page);
  });

  test("renders PostgreSQL-backed topology, environment, and resource authority", async ({ page }) => {
    await page.goto("/system/topology");
    await expect(page.getByRole("heading", { name: "System Topology" })).toBeVisible();
    await expect(page.getByText("15", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("UGV Simulator", { exact: true })).toBeVisible();
    await expect(page.getByText("COMPONENT_PROBE_COVERAGE_INCOMPLETE", { exact: true }).first()).toBeVisible();
    await expectNoFixtureFallback(page);

    await page.goto("/environments");
    await expect(page.getByRole("heading", { name: "Environments" })).toBeVisible();
    await expect(page.getByText("ugv-simulator-dev", { exact: true })).toBeVisible();
    await expect(page.getByText("simulator-gnss-stale/v1", { exact: true })).toBeVisible();
    await expectNoFixtureFallback(page);

    await page.goto("/environments/ugv-simulator-dev");
    await expect(page.getByRole("heading", { name: "Environment · ugv-simulator-dev" })).toBeVisible();
    await expect(page.getByText("External source and deployment are read-only", { exact: true })).toBeVisible();
    await expect(page.getByText("REMOTE_DEPLOYMENT_IDENTITY_UNRESOLVED", { exact: true })).toBeVisible();

    await page.goto("/resources");
    await expect(page.getByRole("heading", { name: "Resources" })).toBeVisible();
    await expect(page.getByText("vehicle:ugv1", { exact: true })).toBeVisible();
    await expectNoFixtureFallback(page);

    await page.goto("/resources/vehicle%3Augv1");
    await expect(page.getByRole("heading", { name: "Resource · vehicle:ugv1" })).toBeVisible();
    await expect(page.getByText("LIVE_RESOURCE_OBSERVATION_NOT_CAPTURED", { exact: true })).toBeVisible();
  });

  test("keeps partial or unavailable authority modules explicit and non-blocking", async ({ page }) => {
    for (const route of ["/telemetry", "/reconciliation", "/analytics/native"]) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      await expectNoFixtureFallback(page);
    }

    await page.goto("/telemetry");
    await expect(page.getByText("provider-current-authority", { exact: true })).toBeVisible();
    await expect(page.getByText("TELEMETRY_SOURCE_COVERAGE_PARTIAL", { exact: true })).toBeVisible();
    await page.goto("/reconciliation");
    await expect(page.getByText("no_new_physical_side_effect", { exact: false }).first()).toBeVisible();
  });

  test("uses only the Console same-origin API boundary and receives a typed SSE snapshot", async ({ page, request }) => {
    const observedUrls = new Set<string>();
    page.on("request", (requestEvent) => observedUrls.add(requestEvent.url()));

    await page.goto("/system/topology");
    await expect(page.getByRole("heading", { name: "System Topology" })).toBeVisible();
    await page.goto("/environments");
    await expect(page.getByText("ugv-simulator-dev", { exact: true })).toBeVisible();
    await page.goto("/resources");
    await expect(page.getByText("vehicle:ugv1", { exact: true })).toBeVisible();

    for (const url of observedUrls) {
      const parsed = new URL(url);
      expect(parsed.origin, url).toBe("http://127.0.0.1:4173");
      expect(url, "Console must not call Runtime, SMPP, Telemetry, or Simulator directly").not.toMatch(/192\.168\.2\.63|:10998|:19100|:18081|:8443/u);
    }

    const runsResponse = await request.get(`${api}/benchmark-runs`);
    expect(runsResponse.status()).toBe(200);
    const runs = await runsResponse.json() as { data: Array<{ runId: string }> };
    const runId = runs.data.find((run) => run.runId.startsWith("run_"))?.runId;
    expect(runId).toBeTruthy();

    const snapshot = await page.evaluate(async (selectedRunId) => {
      const controller = new AbortController();
      const response = await fetch(`/benchmark-api/v1/benchmark-runs/${encodeURIComponent(selectedRunId)}/stream`, {
        headers: { Accept: "text/event-stream", "Last-Event-ID": "0" },
        signal: controller.signal,
      });
      const reader = response.body?.getReader();
      const chunk = await reader?.read();
      controller.abort();
      return {
        status: response.status,
        contentType: response.headers.get("content-type"),
        text: chunk?.value ? new TextDecoder().decode(chunk.value) : "",
      };
    }, runId!);
    expect(snapshot.status).toBe(200);
    expect(snapshot.contentType).toContain("text/event-stream");
    expect(snapshot.text).toContain("event: snapshot");
    expect(snapshot.text).toContain(`\"runId\":\"${runId}\"`);
    expect(snapshot.text).not.toContain('"data":null');
  });

  test("renders the live run monitor and creates a side-effect-free reconcile job", async ({ page, request }) => {
    const runsResponse = await request.get(`${api}/benchmark-runs`);
    expect(runsResponse.status()).toBe(200);
    const runs = await runsResponse.json() as { data: Array<{ runId: string; status: string }> };
    const runId = runs.data.find((run) => run.runId.startsWith("run_") && /^(completed|completed_with_substitutions)$/u.test(run.status))?.runId;
    expect(runId).toBeTruthy();

    await page.goto(`/runs/${runId}`);
    await expect(page.getByRole("heading", { name: `Benchmark Run ${runId}` })).toBeVisible();
    await expect(page.getByText("Live Run Monitor", { exact: true })).toBeVisible();
    await expect(page.getByText("SSE delivery", { exact: true })).toBeVisible();
    await expect(page.getByText("Provider Closure v2", { exact: true })).toBeVisible();
    await expectNoFixtureFallback(page);

    await page.getByRole("button", { name: "Side-effect-free reconcile" }).click();
    await expect(page).toHaveURL(/\/reconciliation\?.*jobId=/u);
    const jobId = new URL(page.url()).searchParams.get("jobId");
    expect(jobId).toBeTruthy();
    await expect(page.getByRole("heading", { name: "Reconciliation Center" })).toBeVisible();
    await expect(page.getByText(jobId!, { exact: true }).first()).toBeVisible();
    await expect(page.getByText("no_new_physical_side_effect", { exact: false }).first()).toBeVisible();

    await expect.poll(async () => {
      const response = await request.get(`${api}/reconciliation-jobs/${encodeURIComponent(jobId!)}`);
      if (!response.ok()) return `http-${response.status()}`;
      const body = await response.json() as { data: { state: string } };
      return body.data.state;
    }, { timeout: 30_000, intervals: [250, 500, 1_000] }).toMatch(/^(completed|completed_partial)$/u);
    const jobResponse = await request.get(`${api}/reconciliation-jobs/${encodeURIComponent(jobId!)}`);
    const job = await jobResponse.json() as { data: { sideEffectPolicy: string; result: { physicalSideEffectCount?: number } | null } };
    expect(job.data.sideEffectPolicy).toBe("no_new_physical_side_effect");
    expect(job.data.result?.physicalSideEffectCount).toBe(0);
  });
});

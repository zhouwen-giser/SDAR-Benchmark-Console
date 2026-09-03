import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { LiveOperationalConsoleApi } from "./api";

const base = "http://127.0.0.1:18094";
const server = setupServer();
const api = new LiveOperationalConsoleApi(base);

const meta = {
  schemaVersion: "sdar-benchmark.resource-metadata/v1",
  generatedAt: "2026-09-03T05:00:00Z",
  authority: "composite",
  dataClass: "unavailable",
  availability: "unavailable",
  formalEligible: false,
  revision: null,
  watermark: null,
  projectionLagMs: null,
  sourceRefs: [],
  reasonCodes: ["TEST_CONTRACT_ADAPTER"],
  unavailableFields: [],
  warnings: [],
};

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("v0.3 operational API adapter", () => {
  it("binds all 46 JSON operations to Benchmark Server without alternate-source fallback", async () => {
    const observed: string[] = [];
    server.use(http.all(`${base}/*`, ({ request }) => {
      observed.push(`${request.method} ${new URL(request.url).pathname}`);
      return HttpResponse.json({ data: {}, meta });
    }));

    const run = "run/one";
    const repetition = "rep/one";
    const calls = [
      api.getSystemTopology(), api.listSystemComponents(), api.getSystemComponent("component/one"), api.probeSystemComponent("component/one"), api.getSystemCompatibility(),
      api.listEnvironments(), api.getEnvironment("environment/one"), api.probeEnvironment("environment/one"), api.listEnvironmentResources("environment/one"), api.listEnvironmentFaultProfiles("environment/one"), api.listEnvironmentLeases("environment/one"),
      api.listResources(), api.getResource("resource/one"), api.getResourceCapabilities("resource/one"), api.getLatestResourceObservations("resource/one"), api.listResourceMissions("resource/one"), api.listResourceBenchmarkHistory("resource/one"),
      api.getRunExecutionPlan(run), api.getRunNativeCoverage(run), api.getRunIdentityClosure(run), api.getRunTelemetryStatus(run), api.getRunEnvironment(run), api.getRunResourceBindings(run),
      api.reconcileRun(run, { schemaVersion: "sdar-benchmark.reconcile-request/v1", scopes: ["telemetry"], reason: "test", idempotencyKey: "test-reconcile" }),
      api.getRepetitionTrajectory(run, repetition), api.getRepetitionIdentityClosure(run, repetition), api.getRepetitionTelemetry(run, repetition), api.getRepetitionProviderClosure(run, repetition), api.getRepetitionPhysicalObservations(run, repetition), api.getRepetitionRawTraceLinks(run, repetition),
      api.listReconciliationJobs(), api.getReconciliationJob("job/one"), api.listReconciliationJobEvents("job/one"), api.cancelReconciliationJob("job/one"),
      api.listTelemetrySources(), api.getTelemetrySource("source/one"), api.getTelemetryWatermarks("source/one"), api.getTelemetryDrift("source/one"),
      api.getAttentionTimeline("attention/one"), api.getAttentionEvidence("attention/one"),
      api.getNativeAnalytics("native-coverage"), api.getNativeAnalytics("telemetry-lag"), api.getNativeAnalytics("reconciliation"), api.getNativeAnalytics("identity-closure"), api.getNativeAnalytics("environment-reliability"), api.getNativeAnalytics("physical-verification"),
    ];
    await Promise.all(calls);

    expect(observed).toHaveLength(46);
    expect(observed).toContain("POST /v1/system/components/component%2Fone/probe");
    expect(observed).toContain("GET /v1/benchmark-runs/run%2Fone/repetitions/rep%2Fone/provider-closure");
    expect(observed).toContain("POST /v1/benchmark-runs/run%2Fone/reconcile");
    expect(observed).toContain("GET /v1/analytics/physical-verification");
  });

  it("surfaces malformed unavailable null data instead of falling back to fixtures", async () => {
    server.use(http.get(`${base}/v1/system/topology`, () => HttpResponse.json({ data: null, meta })));
    await expect(api.getSystemTopology()).rejects.toThrow("unavailable: TEST_CONTRACT_ADAPTER");
  });
});

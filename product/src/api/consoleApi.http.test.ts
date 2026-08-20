import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { BenchmarkApiHttpError } from "./benchmarkApiTransport";
import { HttpConsoleApi, HybridConsoleApi, hybridSourceAware } from "./consoleApi";

const base = "http://127.0.0.1:18090";
const server = setupServer();
const api = new HttpConsoleApi(base);

const envelope = <T>(operationId: string, data: T, status: "available" | "partial" | "unavailable" = "available") => ({
  operationId,
  data,
  availability: { status, reasonCodes: status === "available" ? [] : ["PROJECTION_PENDING"], unavailableFields: status === "available" ? [] : ["qualityScore"] },
  warnings: status === "available" ? [] : ["Projection is not ready"],
  page: { nextCursor: null },
  watermark: null,
  projectionLagMs: null,
  contracts: ["sdar-benchmark/0.1"],
  generatedAt: "2026-08-20T00:00:00Z",
});

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("LiveHttpConsoleApi contract adapter", () => {
  it("preserves envelope partial/null semantics instead of manufacturing score zero", async () => {
    server.use(http.get(`${base}/v1/benchmark-runs`, () => HttpResponse.json(envelope("getBenchmarkRuns", [{ runId: "run-1", status: "completed", datasetVersionRef: "dataset-v1", candidateSnapshotId: "candidate-v1", totalCaseCount: null, completedCaseCount: null, notReadyCaseCount: null }], "partial"))));
    const result = await api.listRuns();
    expect(result.meta.availability).toBe("partial");
    expect(result.meta.reasonCodes).toEqual(["PROJECTION_PENDING"]);
    expect(result.data[0].qualityScore).toBeNull();
    expect(result.data[0].cases).toBeNull();
  });

  it("does not send mock-only scenario/dataState parameters to Overview", async () => {
    let requested = "";
    server.use(http.get(`${base}/v1/dashboard/overview`, ({ request }) => {
      requested = request.url;
      return HttpResponse.json({
        snapshot: { snapshotId: `sha256:${"a".repeat(64)}`, watermark: null, projectionLagMs: null, dataStatus: "partial", moduleErrors: [{ module: "telemetryTrust", code: "PROJECTION_PENDING", message: "pending" }] },
        context: { candidateId: null, candidateSnapshotId: null, baselineId: null, datasetVersion: null, datasetVersionRef: null, profileVersionId: null, profileVersion: null, runId: null, comparisonId: null, filters: { track: null, riskLevel: null, period: "7d" } },
        releaseGate: null, kpis: null, analysisConclusions: [], attentionItems: [], qualityTrend: [], regressionWaterfall: null, trackRiskMatrix: [], metricHeatmap: [], evidenceReadinessFunnel: null,
        sourceAwareEvidenceFunnel: { canonical: { count: 1 }, domain: { status: "partial" }, provider: { status: "not_required" } }, qualityStabilityPoints: [], regressionContributors: [], scoreDistribution: null,
        anomalyTimeline: [], operationalSummary: { data: [], availability: { status: "unavailable", reasonCodes: ["NO_DATA"], unavailableFields: ["data"] } }, systemStatus: [], telemetryTrust: null, recentRuns: [], contracts: ["sdar-benchmark/0.1"], generatedAt: "2026-08-20T00:00:00Z",
      });
    }));
    const result = await api.getOverview({ scenario: "ready", dataState: "loaded", candidateId: "candidate-v1", period: "7d" });
    expect(requested).not.toContain("scenario=");
    expect(requested).not.toContain("dataState=");
    expect(result.meta.availability).toBe("partial");
    expect(result.data.sourceAwareEvidenceFunnel.provider).toEqual({ status: "not_required" });
    expect(result.data.kpis.qualityScore).toBeNull();
  });

  it("keeps Canonical/Domain/Provider provenance immutable refs", async () => {
    const source = (sourceType: string) => ({ sourceType, contractId: `${sourceType}.contract`, contractVersion: "1", contractHash: `sha256:${"b".repeat(64)}`, sourceIdentity: sourceType, sourceIdentityHash: `sha256:${"c".repeat(64)}`, sourceRevision: "1", sourceWatermark: "2026-08-20T00:00:00Z", sourceContentHash: `sha256:${"d".repeat(64)}`, artifactUri: `artifact://${sourceType}`, artifactHash: `sha256:${"e".repeat(64)}`, artifactSizeBytes: 10, artifactMediaType: "application/json" });
    server.use(http.get(`${base}/v1/evaluations/eval-1/telemetry-provenance`, () => HttpResponse.json(envelope("getEvaluationsByEvaluationIdTelemetryProvenance", { evaluationId: "eval-1", origin: "benchmark", inputSnapshotId: `evaluation-input-${"f".repeat(64)}`, inputSnapshotContentHash: `sha256:${"a".repeat(64)}`, overallReadiness: "degraded", formalInputEligible: false, effectiveWatermark: "2026-08-20T00:00:00Z", sources: [source("canonical"), source("domain"), source("provider")] }, "partial"))));
    const result = await api.getTelemetryProvenance("eval-1");
    expect(result.data.sources.map((item) => item.sourceType)).toEqual(["canonical", "domain", "provider"]);
    expect(result.data.sources[2].artifactUri).toBe("artifact://provider");
    expect(result.data.formalInputEligible).toBe(false);
  });

  it("HTTP failure rejects and never falls back to Mock", async () => {
    server.use(http.get(`${base}/v1/evaluations`, () => HttpResponse.json({ error: { code: "BACKEND_UNAVAILABLE", retryable: true } }, { status: 503 })));
    await expect(api.listEvaluations()).rejects.toMatchObject({ status: 503, code: "BACKEND_UNAVAILABLE" } satisfies Partial<BenchmarkApiHttpError>);
  });

  it.each([[400, "INVALID_REQUEST"], [404, "NOT_FOUND"], [409, "CONFLICT"]] as const)("preserves formal %s errors", async (status, code) => {
    server.use(http.get(`${base}/v1/evaluations`, () => HttpResponse.json({ error: { code, retryable: false } }, { status })));
    await expect(api.listEvaluations()).rejects.toMatchObject({ status, code });
  });

  it("labels every Hybrid fallback resource with an explicit source", async () => {
    const hybrid = hybridSourceAware(new HybridConsoleApi());
    const result = await hybrid.getOverview({ scenario: "blocked", dataState: "loaded" });
    expect(result.meta.mode).toBe("hybrid");
    expect(result.meta.mocked).toBe(true);
    expect(result.meta.warnings).toContain("HYBRID source: deterministic Mock adapter.");
  });
});

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
  it("uses the Server preset request unchanged for Development preflight", async () => {
    const requestTemplate = {
      datasetVersionRef: "sdar-ugv-agent-diagnostic/0.1",
      candidate: { snapshotRef: "candidate-1", specification: { baseUrl: "http://192.168.2.63:10990" } },
      environment: { adapter: "external_integration", ref: "simulator-63", config: {} },
      executionPolicy: {
        runClass: "development",
        target: "simulated",
        executionProfile: "ugv-diagnostic-development/0.1",
        allowDevelopmentSubstitutions: true,
        fallbackToSimulation: true,
        permit: { schemaVersion: "sdar-benchmark.development-execution-permit/v1", enabled: true, environmentRef: "simulator-63", target: "simulated", maxConcurrentRuns: 1, maxNavigateCommandsPerRun: 3, allowedFaultProfiles: [] },
      },
      contractReleaseRef: "development-contract-release",
    };
    let received: unknown;
    server.use(
      http.get(`${base}/v1/benchmark-run-presets/ugv-diagnostic-development`, () => HttpResponse.json({
        schemaVersion: "sdar-benchmark.development-run-preset/v1",
        presetId: "ugv-four-case-development/0.1",
        label: "UGV Development",
        availability: "available",
        reasonCodes: [],
        requestTemplate,
        generatedAt: "2026-09-02T15:00:00Z",
      })),
      http.post(`${base}/v1/benchmark-run-preflights`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({
          schemaVersion: "sdar-benchmark.development-run-preflight/v1",
          preflightId: "preflight-1",
          status: "ready_with_substitutions",
          canCreateRun: true,
          canExecuteRun: true,
          formalEligible: false,
          checks: [],
          substitutions: [],
          warnings: ["development only"],
          generatedAt: "2026-09-02T15:00:01Z",
        });
      }),
    );
    const preset = await api.getUgvDiagnosticDevelopmentPreset();
    const preflight = await api.preflightBenchmarkRun(preset.data.requestTemplate!);
    expect(received).toEqual(requestTemplate);
    expect(preflight.data.status).toBe("ready_with_substitutions");
    expect(preflight.meta.availability).toBe("partial");
  });

  it("binds Run Authority, cancellation, and all seven diagnostic query operations", async () => {
    const calls: string[] = [];
    const runStatus = {
      runId: "run-dev-1", status: "running", cancellationRequested: false,
      datasetVersionRef: "dataset-1", candidateSnapshotId: "candidate-1", contractReleaseId: "contract-1",
      totalCaseCount: 4, completedCaseCount: 1, passedCaseCount: 1, failedCaseCount: 0, notReadyCaseCount: 0,
      failureClass: null, failureCode: null, createdAt: "2026-09-02T15:00:00Z", startedAt: "2026-09-02T15:00:01Z", completedAt: null, updatedAt: "2026-09-02T15:00:02Z",
    };
    const artifact = {
      relationId: "relation-1", runId: "run-dev-1", repetitionId: "rep-1", subjectKind: "repetition",
      artifactKind: "execution-trace", artifactIdentity: "artifact-1", artifactRevision: 1,
      artifactSchemaVersion: "v1", artifactRef: { uri: "artifact://trace", hash: `sha256:${"a".repeat(64)}` },
      summary: {}, relationHash: `sha256:${"b".repeat(64)}`, createdAt: "2026-09-02T15:00:02Z",
    };
    const mark = (name: string, body: Record<string, unknown>) => {
      calls.push(name);
      return HttpResponse.json(body);
    };
    server.use(
      http.post(`${base}/v1/benchmark-runs`, () => mark("create", runStatus)),
      http.get(`${base}/v1/benchmark-runs/run-dev-1`, () => mark("authority", runStatus)),
      http.post(`${base}/v1/benchmark-runs/run-dev-1/cancel`, () => mark("cancel", { ...runStatus, cancellationRequested: true, status: "cancelling" })),
      http.get(`${base}/v1/benchmark-runs/run-dev-1/qualification`, () => mark("qualification", envelope("getDiagnosticRunQualification", { runId: "run-dev-1", formalizationStatus: "diagnostic", overallScore: null, releaseGate: "unavailable", artifact, qualification: {} }))),
      http.get(`${base}/v1/benchmark-runs/run-dev-1/external-capabilities`, () => mark("capabilities", envelope("listDiagnosticExternalCapabilities", [artifact]))),
      http.get(`${base}/v1/benchmark-runs/run-dev-1/repetitions`, () => mark("run-repetitions", envelope("listBenchmarkRunRepetitions", [{ repetitionId: "rep-1", caseExecutionId: "case-exec-1", caseId: "UGV-NODE-001", state: "completed" }]))),
      http.get(`${base}/v1/benchmark-runs/run-dev-1/events`, () => mark("run-events", envelope("listBenchmarkRunEvents", [{ scope: "run", revision: 1, eventKind: "run.created", eventHash: `sha256:${"c".repeat(64)}`, createdAt: "2026-09-02T15:00:00Z" }]))),
      http.get(`${base}/v1/benchmark-runs/run-dev-1/repetitions/rep-1`, () => mark("repetition", envelope("getDiagnosticRepetition", { runId: "run-dev-1", repetitionId: "rep-1", caseExecutionId: "case-exec-1", benchmarkCaseVersionId: "UGV-NODE-001/0.1", repeatIndex: 0, state: "completed", candidateTaskId: null, contextId: null, episodeId: null, environmentSnapshotId: null, terminalState: "completed", authorityRevision: 2, failureClass: null, failureCode: null, createdAt: "2026-09-02T15:00:00Z", submittedAt: null, terminalAt: "2026-09-02T15:00:02Z", completedAt: "2026-09-02T15:00:02Z", updatedAt: "2026-09-02T15:00:02Z" }))),
      http.get(`${base}/v1/benchmark-runs/run-dev-1/repetitions/rep-1/artifacts`, () => mark("artifacts", envelope("listDiagnosticRepetitionArtifacts", [artifact]))),
      http.get(`${base}/v1/benchmark-runs/run-dev-1/repetitions/rep-1/execution-trace`, () => mark("trace", envelope("getDiagnosticExecutionTrace", artifact))),
      http.get(`${base}/v1/benchmark-runs/run-dev-1/repetitions/rep-1/physical-verification`, () => mark("physical", envelope("getDiagnosticPhysicalVerification", artifact))),
      http.get(`${base}/v1/benchmark-runs/run-dev-1/repetitions/rep-1/fault-attribution`, () => mark("fault", envelope("getDiagnosticFaultAttribution", artifact))),
    );
    const request = {} as Parameters<typeof api.createBenchmarkRun>[0];
    await api.createBenchmarkRun(request);
    await api.getBenchmarkRunAuthorityStatus("run-dev-1");
    const cancelled = await api.cancelBenchmarkRun("run-dev-1", "test");
    await Promise.all([
      api.getDiagnosticRunQualification("run-dev-1"),
      api.listDiagnosticExternalCapabilities("run-dev-1"),
      api.listBenchmarkRunRepetitions("run-dev-1"),
      api.listBenchmarkRunEvents("run-dev-1"),
      api.getDiagnosticRepetition("run-dev-1", "rep-1"),
      api.listDiagnosticRepetitionArtifacts("run-dev-1", "rep-1"),
      api.getDiagnosticExecutionTrace("run-dev-1", "rep-1"),
      api.getDiagnosticPhysicalVerification("run-dev-1", "rep-1"),
      api.getDiagnosticFaultAttribution("run-dev-1", "rep-1"),
    ]);
    expect(cancelled.data).toMatchObject({ status: "cancelling", cancellationRequested: true });
    expect(calls).toEqual(expect.arrayContaining(["create", "authority", "cancel", "qualification", "capabilities", "run-repetitions", "run-events", "repetition", "artifacts", "trace", "physical", "fault"]));
  });

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

  it("never falls back to Mock when Development preflight returns 503", async () => {
    server.use(http.post(`${base}/v1/benchmark-run-preflights`, () => HttpResponse.json({
      error: { code: "BACKEND_UNAVAILABLE", retryable: true },
    }, { status: 503 })));
    await expect(api.preflightBenchmarkRun({} as Parameters<typeof api.preflightBenchmarkRun>[0]))
      .rejects.toMatchObject({ status: 503, code: "BACKEND_UNAVAILABLE" });
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

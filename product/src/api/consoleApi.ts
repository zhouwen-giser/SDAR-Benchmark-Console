import { capabilityMeta } from "./capability-map";
import { LiveHttpConsoleApi } from "./httpConsoleApi";
import type { TransportRequestOptions } from "./benchmarkApiTransport";
import {
  buildOverview,
  buildRunDashboard,
  caseResults,
  comparisonDetail,
  runSummaries,
} from "../mocks/mockData";
import {
  alertRecords,
  buildCaseDetail,
  buildEvaluationDetail,
  buildEvidenceDetail,
  evaluationSummaries,
  evidenceBundleSummaries,
  getResourceDetail,
  reportRecords,
  systemWorkspace,
} from "../mocks/extendedData";
import type {
  AlertRecord,
  AnalyticsModuleView,
  ApiResource,
  CaseDetail,
  CaseResult,
  ComparisonDetail,
  ContextOptionsView,
  EvaluationDetail,
  EvaluationDimensionView,
  EvaluationEvidenceGradeView,
  EvaluationFatalView,
  EvaluationFindingView,
  EvaluationHardGateView,
  EvaluationHeaderView,
  EvaluationInputMaterialView,
  EvaluationInputSnapshotView,
  EvaluationMetricView,
  EvaluationReadinessView,
  EvaluationSummary,
  EvidenceDetail,
  EvidenceDiffView,
  EvidenceGraphView,
  EvidenceRecordView,
  EvidenceBundleSummary,
  OverviewSnapshot,
  ReportRecord,
  ReportContentView,
  ReportDownloadView,
  ResourceDetail,
  ResourceKind,
  RunDashboard,
  RunSummary,
  Scenario,
  SystemWorkspace,
  TelemetryProvenanceView,
  UiDataState,
} from "../types";

export interface OverviewInput {
  scenario: Scenario;
  dataState: UiDataState;
  candidateId?: string;
  baselineId?: string;
  datasetVersion?: string;
  profileVersionId?: string;
  runId?: string;
  track?: string;
  risk?: string;
  period?: string;
}

export interface CaseQuery {
  track?: string;
  risk?: string;
  gate?: string;
  change?: string;
  search?: string;
}

export interface EvaluationQuery {
  track?: string;
  risk?: string;
  readiness?: string;
  verdict?: string;
  search?: string;
}

export interface EvidenceQuery {
  status?: string;
  family?: string;
  search?: string;
}

export interface ConsoleApi {
  getContextOptions(options?: TransportRequestOptions): Promise<ApiResource<ContextOptionsView>>;
  getOverview(input: OverviewInput, options?: TransportRequestOptions): Promise<ApiResource<OverviewSnapshot>>;
  listRuns(options?: TransportRequestOptions): Promise<ApiResource<RunSummary[]>>;
  getRun(runId: string, options?: TransportRequestOptions): Promise<ApiResource<RunDashboard>>;
  listCases(query?: CaseQuery): Promise<ApiResource<CaseResult[]>>;
  getCase(caseId: string): Promise<ApiResource<CaseDetail>>;
  getComparison(comparisonId: string): Promise<ApiResource<ComparisonDetail>>;
  listEvaluations(query?: EvaluationQuery): Promise<ApiResource<EvaluationSummary[]>>;
  getEvaluation(evaluationId: string): Promise<ApiResource<EvaluationDetail>>;
  getEvaluationHeader(evaluationId: string, options?: TransportRequestOptions): Promise<ApiResource<EvaluationHeaderView>>;
  getEvaluationReadiness(evaluationId: string, options?: TransportRequestOptions): Promise<ApiResource<EvaluationReadinessView>>;
  getEvaluationEvidenceGrades(evaluationId: string, options?: TransportRequestOptions): Promise<ApiResource<EvaluationEvidenceGradeView[]>>;
  getEvaluationFatals(evaluationId: string, options?: TransportRequestOptions): Promise<ApiResource<EvaluationFatalView[]>>;
  getEvaluationHardGates(evaluationId: string, options?: TransportRequestOptions): Promise<ApiResource<EvaluationHardGateView[]>>;
  getEvaluationMetrics(evaluationId: string, options?: TransportRequestOptions): Promise<ApiResource<EvaluationMetricView[]>>;
  getEvaluationDimensions(evaluationId: string, options?: TransportRequestOptions): Promise<ApiResource<EvaluationDimensionView[]>>;
  getEvaluationFindings(evaluationId: string, options?: TransportRequestOptions): Promise<ApiResource<EvaluationFindingView[]>>;
  getEvaluationEvidenceLinks(evaluationId: string, options?: TransportRequestOptions): Promise<ApiResource<Record<string, unknown>>>;
  getTelemetryProvenance(evaluationId: string, options?: TransportRequestOptions): Promise<ApiResource<TelemetryProvenanceView>>;
  listInputSnapshots(episodeId: string, options?: TransportRequestOptions): Promise<ApiResource<EvaluationInputSnapshotView[]>>;
  getLatestInputSnapshot(episodeId: string, identity: { profileVersionId: string; requirementSetId: string; requirementSetVersion: number }, options?: TransportRequestOptions): Promise<ApiResource<EvaluationInputSnapshotView>>;
  getInputSnapshot(snapshotId: string, options?: TransportRequestOptions): Promise<ApiResource<EvaluationInputSnapshotView>>;
  getInputMaterial(snapshotId: string, source: "domain" | "provider", options?: TransportRequestOptions): Promise<ApiResource<EvaluationInputMaterialView | null>>;
  reconcileInputSnapshot(episodeId: string, profileVersionId: string, options?: TransportRequestOptions): Promise<ApiResource<Record<string, unknown>>>;
  listEvidenceBundles(query?: EvidenceQuery): Promise<ApiResource<EvidenceBundleSummary[]>>;
  getEvidence(bundleId: string): Promise<ApiResource<EvidenceDetail>>;
  getEvidenceRecords(bundleId: string, options?: TransportRequestOptions): Promise<ApiResource<EvidenceRecordView[]>>;
  getEvidenceTimeline(bundleId: string, options?: TransportRequestOptions): Promise<ApiResource<EvidenceRecordView[]>>;
  getEvidenceGraph(bundleId: string, options?: TransportRequestOptions): Promise<ApiResource<EvidenceGraphView>>;
  getEvidenceDiff(bundleId: string, otherBundleId: string, mode?: string, options?: TransportRequestOptions): Promise<ApiResource<EvidenceDiffView>>;
  getEvidenceUsage(bundleId: string, options?: TransportRequestOptions): Promise<ApiResource<Record<string, unknown>>>;
  getAnalytics(input: OverviewInput): Promise<ApiResource<OverviewSnapshot>>;
  getAnalyticsModule(key: string, input: OverviewInput, options?: TransportRequestOptions): Promise<ApiResource<AnalyticsModuleView>>;
  listReports(): Promise<ApiResource<ReportRecord[]>>;
  createReport(input: { reportType: "snapshot" | "run" | "comparison" | "evaluation"; sourceId: string; format: "json" | "markdown" | "html" }, options?: TransportRequestOptions): Promise<ApiResource<ReportRecord>>;
  getReportContent(reportId: string, options?: TransportRequestOptions): Promise<ApiResource<ReportContentView>>;
  getReportDownload(reportId: string, options?: TransportRequestOptions): Promise<ApiResource<ReportDownloadView>>;
  listAlerts(): Promise<ApiResource<AlertRecord[]>>;
  getAttention(attentionId: string, options?: TransportRequestOptions): Promise<ApiResource<AlertRecord>>;
  updateAttention(attentionId: string, state: "open" | "acknowledged" | "resolved" | "ignored", options?: TransportRequestOptions): Promise<ApiResource<AlertRecord>>;
  getSystemWorkspace(): Promise<ApiResource<SystemWorkspace>>;
  getResource(kind: ResourceKind, id: string): Promise<ApiResource<ResourceDetail>>;
}

function sleep(ms = 90) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class MockConsoleApi {
  async getOverview(input: OverviewInput): Promise<ApiResource<OverviewSnapshot>> {
    await sleep();
    if (input.dataState === "error") {
      throw new Error("Overview Snapshot 请求失败（演示状态）");
    }
    const data = buildOverview(input.scenario, input.dataState);
    return {
      data,
      meta: capabilityMeta("overview", {
        mocked: true,
        watermark: data.snapshot.watermark,
        projectionLagMs: data.snapshot.projectionLagMs,
      }),
    };
  }

  async listRuns(): Promise<ApiResource<RunSummary[]>> {
    await sleep();
    return {
      data: clone(runSummaries),
      meta: capabilityMeta("runs", {
        mocked: true,
        watermark: "2026-08-15T20:31:42Z",
        projectionLagMs: 3200,
      }),
    };
  }

  async getRun(runId: string): Promise<ApiResource<RunDashboard>> {
    await sleep();
    const data = buildRunDashboard(runId);
    return {
      data,
      meta: capabilityMeta("runDashboard", {
        mocked: true,
        watermark: data.snapshot.watermark,
        projectionLagMs: data.snapshot.projectionLagMs,
      }),
    };
  }

  async listCases(query: CaseQuery = {}): Promise<ApiResource<CaseResult[]>> {
    await sleep(40);
    const search = query.search?.toLowerCase();
    const data = caseResults.filter((item) => {
      if (query.track && query.track !== "all" && item.track !== query.track.toLowerCase()) return false;
      if (query.risk && query.risk !== "all" && item.risk !== query.risk.toLowerCase()) return false;
      if (query.gate && !item.gates.includes(query.gate)) return false;
      if (query.change && !item.change.toLowerCase().includes(query.change.toLowerCase())) return false;
      if (search && !`${item.caseId} ${item.title}`.toLowerCase().includes(search)) return false;
      return true;
    });
    return {
      data: clone(data),
      meta: capabilityMeta("caseResults", {
        mocked: true,
        watermark: "2026-08-15T20:31:42Z",
        projectionLagMs: 3200,
      }),
    };
  }

  async getCase(caseId: string): Promise<ApiResource<CaseDetail>> {
    await sleep(55);
    return {
      data: buildCaseDetail(caseId),
      meta: capabilityMeta("caseDetail", {
        mocked: true,
        watermark: "2026-08-15T20:31:42Z",
        projectionLagMs: 3200,
      }),
    };
  }

  async getComparison(_comparisonId: string): Promise<ApiResource<ComparisonDetail>> {
    await sleep();
    return {
      data: clone(comparisonDetail),
      meta: capabilityMeta("comparison", {
        mocked: true,
        watermark: "2026-08-15T20:31:42Z",
        projectionLagMs: 3200,
      }),
    };
  }

  async listEvaluations(query: EvaluationQuery = {}): Promise<ApiResource<EvaluationSummary[]>> {
    await sleep(55);
    const search = query.search?.toLowerCase();
    const data = evaluationSummaries.filter((item) => {
      if (query.track && query.track !== "all" && item.track !== query.track) return false;
      if (query.risk && query.risk !== "all" && item.risk !== query.risk) return false;
      if (query.readiness && query.readiness !== "all" && item.readiness !== query.readiness) return false;
      if (query.verdict && query.verdict !== "all" && item.verdict !== query.verdict) return false;
      if (search && !`${item.evaluationId} ${item.caseId}`.toLowerCase().includes(search)) return false;
      return true;
    });
    return {
      data: clone(data),
      meta: capabilityMeta("evaluations", {
        mocked: true,
        watermark: "2026-08-15T20:31:42Z",
        projectionLagMs: 3200,
      }),
    };
  }

  async getEvaluation(_evaluationId: string): Promise<ApiResource<EvaluationDetail>> {
    await sleep();
    const data = buildEvaluationDetail(_evaluationId);
    return {
      data,
      meta: capabilityMeta("evaluation", {
        mocked: true,
        watermark: "2026-08-15T20:31:42Z",
        projectionLagMs: 3200,
      }),
    };
  }

  async getEvidence(_bundleId: string): Promise<ApiResource<EvidenceDetail>> {
    await sleep();
    const data = buildEvidenceDetail(_bundleId);
    return {
      data,
      meta: capabilityMeta("evidenceBundle", {
        mocked: true,
        watermark: "2026-08-15T20:31:42Z",
        projectionLagMs: 3200,
      }),
    };
  }

  async listEvidenceBundles(query: EvidenceQuery = {}): Promise<ApiResource<EvidenceBundleSummary[]>> {
    await sleep(55);
    const search = query.search?.toLowerCase();
    const data = evidenceBundleSummaries.filter((item) => {
      if (query.status && query.status !== "all" && item.status !== query.status) return false;
      if (query.family === "missing" && item.missingFamilies.length === 0) return false;
      if (query.family === "complete" && item.missingFamilies.length > 0) return false;
      if (search && !`${item.bundleId} ${item.caseId} ${item.episodeId}`.toLowerCase().includes(search)) return false;
      return true;
    });
    return {
      data: clone(data),
      meta: capabilityMeta("evidenceBundles", {
        mocked: true,
        watermark: "2026-08-15T20:31:42Z",
        projectionLagMs: 3200,
      }),
    };
  }

  async getAnalytics(input: OverviewInput): Promise<ApiResource<OverviewSnapshot>> {
    await sleep(70);
    const data = buildOverview(input.scenario, input.dataState);
    return {
      data,
      meta: capabilityMeta("analytics", {
        mocked: true,
        watermark: data.snapshot.watermark,
        projectionLagMs: data.snapshot.projectionLagMs,
      }),
    };
  }

  async listReports(): Promise<ApiResource<ReportRecord[]>> {
    await sleep(45);
    return { data: clone(reportRecords), meta: capabilityMeta("reports", { mocked: true }) };
  }

  async listAlerts(): Promise<ApiResource<AlertRecord[]>> {
    await sleep(45);
    return { data: clone(alertRecords), meta: capabilityMeta("alerts", { mocked: true }) };
  }

  async getSystemWorkspace(): Promise<ApiResource<SystemWorkspace>> {
    await sleep(45);
    return {
      data: clone(systemWorkspace),
      meta: capabilityMeta("systemWorkspace", {
        mocked: true,
        watermark: "2026-08-15T20:31:42Z",
        projectionLagMs: 3200,
      }),
    };
  }

  async getResource(kind: ResourceKind, id: string): Promise<ApiResource<ResourceDetail>> {
    await sleep(45);
    const key = kind === "candidate" ? "candidateDetail" : kind === "baseline" ? "baselineDetail" : kind === "dataset" ? "datasetDetail" : "profileDetail";
    return { data: getResourceDetail(kind, id), meta: capabilityMeta(key, { mocked: true }) };
  }
}

function readViteEnv(name: string): string | undefined {
  const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
  return env?.[name];
}

export function currentApiMode(): "mock" | "msw" | "http" | "hybrid" {
  const value = readViteEnv("VITE_API_MODE");
  return value === "msw" || value === "http" || value === "hybrid" ? value : "mock";
}

class PrototypeHttpConsoleApi {
  constructor(private readonly baseUrl = readViteEnv("VITE_BENCHMARK_API_BASE_URL") ?? "http://127.0.0.1:18090") {}

  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return (await response.json()) as T;
  }

  async getOverview(input: OverviewInput): Promise<ApiResource<OverviewSnapshot>> {
    const query = new URLSearchParams({
      candidateId: input.candidateId ?? "cand-142-def456",
      datasetVersion: input.datasetVersion ?? "release-v0.1",
      profileVersionId: input.profileVersionId ?? "sdar-v2-review-2.1",
      track: input.track ?? "all",
      riskLevel: input.risk ?? "all",
      period: input.period ?? "7d",
    });
    if (input.baselineId) query.set("baselineId", input.baselineId);
    if (input.runId) query.set("runId", input.runId);
    const data = await this.request<OverviewSnapshot>(`/v1/dashboard/overview?${query}`);
    return {
      data,
      meta: capabilityMeta("overview", {
        mocked: false,
        watermark: data.snapshot.watermark,
        projectionLagMs: data.snapshot.projectionLagMs,
      }),
    };
  }

  async listRuns(): Promise<ApiResource<RunSummary[]>> {
    const envelope = await this.request<{ data: RunSummary[]; watermark?: string; projectionLagMs?: number }>(
      "/v1/benchmark-runs",
    );
    return {
      data: envelope.data,
      meta: capabilityMeta("runs", {
        mocked: false,
        watermark: envelope.watermark,
        projectionLagMs: envelope.projectionLagMs,
      }),
    };
  }

  async getRun(runId: string): Promise<ApiResource<RunDashboard>> {
    const envelope = await this.request<{ snapshot: RunDashboard["snapshot"]; data: Omit<RunDashboard, "snapshot"> }>(
      `/v1/benchmark-runs/${encodeURIComponent(runId)}/dashboard`,
    );
    const data = { ...envelope.data, snapshot: envelope.snapshot } as RunDashboard;
    return {
      data,
      meta: capabilityMeta("runDashboard", {
        mocked: false,
        watermark: data.snapshot.watermark,
        projectionLagMs: data.snapshot.projectionLagMs,
      }),
    };
  }

  async listCases(query: CaseQuery = {}): Promise<ApiResource<CaseResult[]>> {
    const search = new URLSearchParams();
    if (query.track) search.set("track", query.track);
    if (query.risk) search.set("riskLevel", query.risk);
    if (query.gate) search.set("gateId", query.gate);
    if (query.change) search.set("changeType", query.change);
    if (query.search) search.set("search", query.search);
    const envelope = await this.request<{ data: CaseResult[]; watermark?: string; projectionLagMs?: number }>(
      `/v1/case-results?${search}`,
    );
    return {
      data: envelope.data,
      meta: capabilityMeta("caseResults", {
        mocked: false,
        watermark: envelope.watermark,
        projectionLagMs: envelope.projectionLagMs,
      }),
    };
  }

  async getCase(caseId: string): Promise<ApiResource<CaseDetail>> {
    const data = await this.request<CaseDetail>(`/v1/benchmark-cases/${encodeURIComponent(caseId)}`);
    return { data, meta: capabilityMeta("caseDetail", { mocked: false }) };
  }

  async getComparison(comparisonId: string): Promise<ApiResource<ComparisonDetail>> {
    const data = await this.request<ComparisonDetail>(`/v1/comparisons/${encodeURIComponent(comparisonId)}/dashboard`);
    return { data, meta: capabilityMeta("comparison", { mocked: false }) };
  }

  async listEvaluations(query: EvaluationQuery = {}): Promise<ApiResource<EvaluationSummary[]>> {
    const search = new URLSearchParams();
    if (query.track) search.set("track", query.track);
    if (query.risk) search.set("riskLevel", query.risk);
    if (query.readiness) search.set("readiness", query.readiness);
    if (query.verdict) search.set("verdict", query.verdict);
    if (query.search) search.set("search", query.search);
    const envelope = await this.request<{ data: EvaluationSummary[]; watermark?: string; projectionLagMs?: number }>(`/v1/evaluations?${search}`);
    return { data: envelope.data, meta: capabilityMeta("evaluations", { mocked: false, watermark: envelope.watermark, projectionLagMs: envelope.projectionLagMs }) };
  }

  async getEvaluation(evaluationId: string): Promise<ApiResource<EvaluationDetail>> {
    const data = await this.request<EvaluationDetail>(`/v1/evaluations/${encodeURIComponent(evaluationId)}`);
    return { data, meta: capabilityMeta("evaluation", { mocked: false }) };
  }

  async getEvidence(bundleId: string): Promise<ApiResource<EvidenceDetail>> {
    const data = await this.request<EvidenceDetail>(`/v1/evidence-bundles/${encodeURIComponent(bundleId)}`);
    return { data, meta: capabilityMeta("evidenceBundle", { mocked: false }) };
  }

  async listEvidenceBundles(query: EvidenceQuery = {}): Promise<ApiResource<EvidenceBundleSummary[]>> {
    const search = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => value && search.set(key, value));
    const envelope = await this.request<{ data: EvidenceBundleSummary[]; watermark?: string; projectionLagMs?: number }>(`/v1/evidence-bundles?${search}`);
    return { data: envelope.data, meta: capabilityMeta("evidenceBundles", { mocked: false, watermark: envelope.watermark, projectionLagMs: envelope.projectionLagMs }) };
  }

  async getAnalytics(input: OverviewInput): Promise<ApiResource<OverviewSnapshot>> {
    const query = new URLSearchParams({
      track: input.track ?? "all",
      riskLevel: input.risk ?? "all",
      period: input.period ?? "7d",
    });
    if (input.candidateId) query.set("candidateId", input.candidateId);
    if (input.baselineId) query.set("baselineId", input.baselineId);
    if (input.datasetVersion) query.set("datasetVersion", input.datasetVersion);
    if (input.profileVersionId) query.set("profileVersionId", input.profileVersionId);
    if (input.runId) query.set("runId", input.runId);
    const data = await this.request<OverviewSnapshot>(`/v1/dashboard/overview?${query}`);
    return {
      data,
      meta: capabilityMeta("analytics", {
        mocked: false,
        watermark: data.snapshot.watermark,
        projectionLagMs: data.snapshot.projectionLagMs,
      }),
    };
  }

  async listReports(): Promise<ApiResource<ReportRecord[]>> {
    const envelope = await this.request<{ data: ReportRecord[] }>("/v1/reports");
    return { data: envelope.data, meta: capabilityMeta("reports", { mocked: false }) };
  }

  async listAlerts(): Promise<ApiResource<AlertRecord[]>> {
    const envelope = await this.request<{ data: AlertRecord[] }>("/v1/attention-items");
    return { data: envelope.data, meta: capabilityMeta("alerts", { mocked: false }) };
  }

  async getSystemWorkspace(): Promise<ApiResource<SystemWorkspace>> {
    const data = await this.request<SystemWorkspace>("/v1/system/status");
    return { data, meta: capabilityMeta("systemWorkspace", { mocked: false }) };
  }

  async getResource(kind: ResourceKind, id: string): Promise<ApiResource<ResourceDetail>> {
    const plural = kind === "candidate" ? "candidates" : kind === "baseline" ? "baselines" : kind === "dataset" ? "datasets" : "evaluation-profiles";
    const key = kind === "candidate" ? "candidateDetail" : kind === "baseline" ? "baselineDetail" : kind === "dataset" ? "datasetDetail" : "profileDetail";
    const data = await this.request<ResourceDetail>(`/v1/${plural}/${encodeURIComponent(id)}`);
    return { data, meta: capabilityMeta(key, { mocked: false }) };
  }
}

export class HybridConsoleApi extends MockConsoleApi {
  private readonly http = new LiveHttpConsoleApi();

  override async getRun(runId: string): Promise<ApiResource<RunDashboard>> {
    try {
      return await this.http.getRun(runId);
    } catch {
      return super.getRun(runId);
    }
  }
}

export function hybridSourceAware(api: HybridConsoleApi): ConsoleApi {
  return new Proxy(api, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== "function") return value;
      return async (...args: unknown[]) => {
        const resource = await value.apply(target, args) as ApiResource<unknown>;
        if (resource?.meta) {
          resource.meta.mode = "hybrid";
          resource.meta.warnings = [...resource.meta.warnings, resource.meta.mocked ? "HYBRID source: deterministic Mock adapter." : "HYBRID source: live Benchmark HTTP API."];
        }
        return resource;
      };
    },
  }) as unknown as ConsoleApi;
}

export function createConsoleApi(): ConsoleApi {
  const mode = currentApiMode();
  if (mode === "http" || mode === "msw") return new LiveHttpConsoleApi(mode === "msw" ? "" : undefined);
  if (mode === "hybrid") return hybridSourceAware(new HybridConsoleApi());
  return new MockConsoleApi() as unknown as ConsoleApi;
}

export const consoleApi = createConsoleApi();
export { LiveHttpConsoleApi as HttpConsoleApi };

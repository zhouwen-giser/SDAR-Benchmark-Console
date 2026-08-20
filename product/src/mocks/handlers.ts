import { http, HttpResponse } from "msw";
import {
  buildOverview,
  buildRunDashboard,
  caseResults,
  comparisonDetail,
  runSummaries,
} from "./mockData";
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
} from "./extendedData";
import type { ResourceKind, Scenario, UiDataState } from "../types";

const watermark = "2026-08-15T20:31:42Z";
const projectionLagMs = 3200;

function collection<T>(data: T[]) {
  return {
    data: structuredClone(data),
    page: { nextCursor: null },
    watermark,
    projectionLagMs,
    contracts: ["sdar-benchmark-server@0.1.0"],
    generatedAt: watermark,
  };
}

function param(url: URL, primary: string, fallback?: string) {
  return url.searchParams.get(primary) ?? (fallback ? url.searchParams.get(fallback) : null);
}

export const handlers = [
  http.get("*/v1/dashboard/overview", ({ request }) => {
    const url = new URL(request.url);
    const scenario = (url.searchParams.get("scenario") ?? "blocked") as Scenario;
    const dataState = (url.searchParams.get("dataState") ?? "loaded") as UiDataState;
    return HttpResponse.json(buildOverview(scenario, dataState));
  }),

  http.get("*/v1/analytics/:module", ({ params }) => HttpResponse.json({ ...collection([]), operationId: `mock-${String(params.module)}`, availability: { status: "partial", reasonCodes: ["MSW_FIXTURE"], unavailableFields: [] }, warnings: ["MSW fixture"] })),

  http.get("*/v1/benchmark-runs", () => HttpResponse.json(collection(runSummaries))),

  http.get("*/v1/benchmark-runs/:runId/dashboard", ({ params }) => {
    const dashboard = buildRunDashboard(String(params.runId));
    const { snapshot, ...data } = dashboard;
    return HttpResponse.json({ snapshot, data });
  }),

  http.get("*/v1/case-results", ({ request }) => {
    const url = new URL(request.url);
    const track = param(url, "track");
    const risk = param(url, "riskLevel", "risk");
    const gate = param(url, "gateId", "gate");
    const change = param(url, "changeType", "change");
    const search = param(url, "search")?.toLowerCase();
    const data = caseResults.filter((item) => {
      if (track && track !== "all" && item.track !== track.toLowerCase()) return false;
      if (risk && risk !== "all" && item.risk !== risk.toLowerCase()) return false;
      if (gate && !item.gates.includes(gate)) return false;
      if (change && !item.change.toLowerCase().includes(change.toLowerCase())) return false;
      return !search || `${item.caseId} ${item.title}`.toLowerCase().includes(search);
    });
    return HttpResponse.json(collection(data));
  }),

  http.get("*/v1/benchmark-cases/:caseId", ({ params }) =>
    HttpResponse.json(buildCaseDetail(String(params.caseId))),
  ),

  http.get("*/v1/comparisons/:comparisonId", ({ params }) =>
    HttpResponse.json({ ...structuredClone(comparisonDetail), comparisonId: String(params.comparisonId) }),
  ),

  http.get("*/v1/evaluations", ({ request }) => {
    const url = new URL(request.url);
    const track = param(url, "track");
    const risk = param(url, "riskLevel", "risk");
    const readiness = param(url, "readiness");
    const verdict = param(url, "verdict");
    const search = param(url, "search")?.toLowerCase();
    const data = evaluationSummaries.filter((item) => {
      if (track && track !== "all" && item.track !== track) return false;
      if (risk && risk !== "all" && item.risk !== risk) return false;
      if (readiness && readiness !== "all" && item.readiness !== readiness) return false;
      if (verdict && verdict !== "all" && item.verdict !== verdict) return false;
      return !search || `${item.evaluationId} ${item.caseId}`.toLowerCase().includes(search);
    });
    return HttpResponse.json(collection(data));
  }),

  http.get("*/v1/evaluations/:evaluationId", ({ params }) =>
    HttpResponse.json(buildEvaluationDetail(String(params.evaluationId))),
  ),

  http.get("*/v1/evidence-bundles", ({ request }) => {
    const url = new URL(request.url);
    const status = param(url, "status");
    const family = param(url, "family");
    const search = param(url, "search")?.toLowerCase();
    const data = evidenceBundleSummaries.filter((item) => {
      if (status && status !== "all" && item.status !== status) return false;
      if (family === "missing" && item.missingFamilies.length === 0) return false;
      if (family === "complete" && item.missingFamilies.length > 0) return false;
      return !search || `${item.bundleId} ${item.caseId} ${item.episodeId}`.toLowerCase().includes(search);
    });
    return HttpResponse.json(collection(data));
  }),

  http.get("*/v1/evidence-bundles/:bundleId", ({ params }) =>
    HttpResponse.json(buildEvidenceDetail(String(params.bundleId))),
  ),

  http.get("*/v1/reports", () => HttpResponse.json(collection(reportRecords))),
  http.get("*/v1/attention-items", () => HttpResponse.json({ ...collection(alertRecords), operationId: "getAttentionItems", availability: { status: "available", reasonCodes: [], unavailableFields: [] }, warnings: [] })),
  http.get("*/v1/system/status", () => HttpResponse.json({ ...collection([]), operationId: "getSystemStatus", data: { postgres: {}, clickhouse: {}, contracts: {}, operations: {}, trust: {} }, availability: { status: "available", reasonCodes: [], unavailableFields: [] }, warnings: [] })),
  http.get("*/v1/system/contracts", () => HttpResponse.json({ ...collection([]), operationId: "getSystemContracts", data: { releases: systemWorkspace.contracts, frozenEvaluationProfile: {}, telemetryHandoffs: {}, executableRuleBodiesAvailable: false }, availability: { status: "partial", reasonCodes: ["RULE_BODIES_UNAVAILABLE"], unavailableFields: ["executableRuleBodiesAvailable"] }, warnings: [] })),
  http.get("*/v1/system/projections", () => HttpResponse.json({ ...collection([]), operationId: "getSystemProjections", data: { checkpoints: systemWorkspace.projections, outbox: [], sourceWatermarks: [] }, availability: { status: "available", reasonCodes: [], unavailableFields: [] }, warnings: [] })),

  ...(["candidate", "baseline", "dataset", "profile"] as const).map((kind) => {
    const plural = kind === "candidate" ? "candidates" : kind === "baseline" ? "baselines" : kind === "dataset" ? "datasets" : "evaluation-profiles";
    return http.get(`*/v1/${plural}/:resourceId`, ({ params }) =>
      HttpResponse.json(getResourceDetail(kind satisfies ResourceKind, String(params.resourceId))),
    );
  }),
];

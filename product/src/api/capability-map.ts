import type { ApiCapabilityStatus, CapabilityMeta } from "../types";

export interface CapabilityDefinition {
  endpoint: string;
  status: ApiCapabilityStatus;
  sourceOfTruth: string;
  availabilityReason?: string;
}

export const apiCapabilityMap = {
  overview: {
    endpoint: "GET /v1/dashboard/overview",
    status: "new",
    sourceOfTruth: "ClickHouse analytics + PostgreSQL context + deterministic analysis",
    availabilityReason: "统一 Overview Snapshot endpoint 尚未由 Server 实现。",
  },
  caseResults: {
    endpoint: "GET /v1/case-results",
    status: "new",
    sourceOfTruth: "ClickHouse case/comparison/evaluation views",
    availabilityReason: "跨页面 Case Explorer endpoint 尚未实现。",
  },
  caseDetail: {
    endpoint: "GET /v1/cases/{caseId}",
    status: "new",
    sourceOfTruth: "Versioned Dataset Case contract",
    availabilityReason: "Case authority detail endpoint 尚未实现；当前由确定性 Mock Adapter 提供。",
  },
  runs: {
    endpoint: "GET /v1/benchmark-runs",
    status: "new",
    sourceOfTruth: "PostgreSQL authority + ClickHouse projection",
    availabilityReason: "当前 Server 只有 POST collection 和按 runId 查询。",
  },
  runAuthority: {
    endpoint: "GET /v1/benchmark-runs/{runId}",
    status: "existing",
    sourceOfTruth: "PostgreSQL authority",
  },
  runDashboard: {
    endpoint: "GET /v1/benchmark-runs/{runId}/dashboard",
    status: "new",
    sourceOfTruth: "ClickHouse analytics + PostgreSQL authority metadata",
    availabilityReason: "一致水位的 Run Dashboard endpoint 尚未实现。",
  },
  runCases: {
    endpoint: "GET /v1/benchmark-runs/{runId}/cases",
    status: "extend",
    sourceOfTruth: "ClickHouse projection",
    availabilityReason: "路由存在，但缺少 Track/Risk/Change/Evaluation/Bundle 强类型字段。",
  },
  comparison: {
    endpoint: "GET /v1/comparisons/{comparisonId}",
    status: "extend",
    sourceOfTruth: "ClickHouse projection",
    availabilityReason: "当前返回 generic rows/result_json，需要 typed dashboard view。",
  },
  comparisonCases: {
    endpoint: "GET /v1/comparisons/{comparisonId}/cases",
    status: "extend",
    sourceOfTruth: "ClickHouse projection",
    availabilityReason: "需要补齐 changeType、metric、gate 与 Evidence refs。",
  },
  evaluation: {
    endpoint: "GET /v1/evaluations/{evaluationId}",
    status: "extend",
    sourceOfTruth: "ClickHouse projection + PostgreSQL authority metadata",
    availabilityReason: "当前 result_json 为 opaque，需要 typed readiness/F/HG/M/dimension view。",
  },
  evaluations: {
    endpoint: "GET /v1/evaluations",
    status: "new",
    sourceOfTruth: "ClickHouse typed evaluation projection",
    availabilityReason: "Evaluation collection endpoint 尚未实现。",
  },
  evaluationMetrics: {
    endpoint: "GET /v1/evaluations/{evaluationId}/metrics",
    status: "new",
    sourceOfTruth: "ClickHouse metric results",
    availabilityReason: "M1–M15 typed subresource 尚未实现。",
  },
  evidenceBundle: {
    endpoint: "GET /v1/evidence-bundles/{bundleId}",
    status: "new",
    sourceOfTruth: "PostgreSQL authority + immutable Artifact",
    availabilityReason: "Evidence Bundle view API 尚未实现。",
  },
  evidenceBundles: {
    endpoint: "GET /v1/evidence-bundles",
    status: "new",
    sourceOfTruth: "PostgreSQL bundle catalog + immutable Artifact metadata",
    availabilityReason: "Evidence Bundle collection endpoint 尚未实现。",
  },
  evidenceTimeline: {
    endpoint: "GET /v1/evidence-bundles/{bundleId}/timeline",
    status: "new",
    sourceOfTruth: "Immutable Artifact bundle + catalog",
    availabilityReason: "Semantic timeline endpoint 尚未实现。",
  },
  evidenceDiff: {
    endpoint: "GET /v1/evidence-bundles/{bundleId}/diff",
    status: "new",
    sourceOfTruth: "Two immutable Artifact bundles",
    availabilityReason: "Baseline/Candidate Evidence structural diff 尚未实现。",
  },
  scoreDistribution: {
    endpoint: "GET /v1/analytics/score-distribution",
    status: "blocked_data",
    sourceOfTruth: "ClickHouse formal scores",
    availabilityReason: "P50/P90 正式算法尚未冻结；当前仅展示明确标注的 Mock UI 示例。",
  },
  operational: {
    endpoint: "GET /v1/analytics/operational",
    status: "blocked_data",
    sourceOfTruth: "ClickHouse operational samples",
    availabilityReason: "若干自动 Producer 尚未接入；响应必须允许 partial/null。",
  },
  analytics: {
    endpoint: "GET /v1/analytics/workspace",
    status: "new",
    sourceOfTruth: "ClickHouse watermarked analytic views",
    availabilityReason: "深度分析聚合 endpoint 尚未实现；复用 Snapshot Contract 的确定性 Mock。",
  },
  reports: {
    endpoint: "GET /v1/reports",
    status: "new",
    sourceOfTruth: "Report service (planned)",
    availabilityReason: "报告持久化与导出服务尚未实现；草稿仅保存在本次浏览会话。",
  },
  alerts: {
    endpoint: "GET /v1/alerts",
    status: "new",
    sourceOfTruth: "Alert lifecycle service (planned)",
    availabilityReason: "告警生命周期 API 尚未实现；确认与解决操作仅作用于本次浏览会话。",
  },
  systemWorkspace: {
    endpoint: "GET /v1/system/workspace",
    status: "new",
    sourceOfTruth: "Static contracts + service health projections",
    availabilityReason: "统一系统信息 endpoint 尚未实现。",
  },
  candidateDetail: {
    endpoint: "GET /v1/candidates/{candidateId}",
    status: "new",
    sourceOfTruth: "Candidate registry",
    availabilityReason: "Candidate registry API 尚未实现。",
  },
  baselineDetail: {
    endpoint: "GET /v1/baselines/{baselineId}",
    status: "new",
    sourceOfTruth: "Candidate registry + release designation",
    availabilityReason: "Baseline detail API 尚未实现。",
  },
  datasetDetail: {
    endpoint: "GET /v1/datasets/{datasetVersion}",
    status: "new",
    sourceOfTruth: "Versioned Dataset manifest",
    availabilityReason: "Dataset registry API 尚未实现。",
  },
  profileDetail: {
    endpoint: "GET /v1/profiles/{profileVersionId}",
    status: "new",
    sourceOfTruth: "Versioned evaluation profile",
    availabilityReason: "Profile registry API 尚未实现。",
  },
  telemetryTrace: {
    endpoint: "Telemetry /v1/evidence/trace",
    status: "external",
    sourceOfTruth: "Telemetry Platform ClickHouse Query API",
    availabilityReason: "Raw canonical trace 明确由 Telemetry Query API 负责。",
  },
} satisfies Record<string, CapabilityDefinition>;

export type CapabilityKey = keyof typeof apiCapabilityMap;

export function capabilityMeta(
  key: CapabilityKey,
  options: {
    mocked: boolean;
    watermark?: string | null;
    projectionLagMs?: number | null;
  },
): CapabilityMeta {
  const definition = apiCapabilityMap[key];
  return {
    key,
    ...definition,
    mocked: options.mocked,
    watermark: options.watermark ?? null,
    projectionLagMs: options.projectionLagMs ?? null,
  };
}

export const capabilityStatusLabel: Record<ApiCapabilityStatus, string> = {
  existing: "EXISTING",
  extend: "EXTEND",
  new: "NEW",
  blocked_data: "BLOCKED DATA",
  external: "EXTERNAL",
};

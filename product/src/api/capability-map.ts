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
    sourceOfTruth: "ClickHouse 分析结果、PostgreSQL 上下文与确定性分析",
    availabilityReason: "统一总览数据快照接口尚未由服务端实现。",
  },
  caseResults: {
    endpoint: "GET /v1/case-results",
    status: "new",
    sourceOfTruth: "ClickHouse 用例、对比与评价视图",
    availabilityReason: "跨页面用例浏览接口尚未实现。",
  },
  caseDetail: {
    endpoint: "GET /v1/cases/{caseId}",
    status: "new",
    sourceOfTruth: "版本化数据集用例合同",
    availabilityReason: "用例权威详情接口尚未实现；当前由确定性演示数据适配器提供。",
  },
  runs: {
    endpoint: "GET /v1/benchmark-runs",
    status: "new",
    sourceOfTruth: "PostgreSQL 权威记录与 ClickHouse 数据投影",
    availabilityReason: "当前服务端仅支持创建集合和按运行编号查询。",
  },
  runAuthority: {
    endpoint: "GET /v1/benchmark-runs/{runId}",
    status: "existing",
    sourceOfTruth: "PostgreSQL 权威记录",
  },
  runDashboard: {
    endpoint: "GET /v1/benchmark-runs/{runId}/dashboard",
    status: "new",
    sourceOfTruth: "ClickHouse 分析结果与 PostgreSQL 权威元数据",
    availabilityReason: "具备一致数据水位的运行看板接口尚未实现。",
  },
  runCases: {
    endpoint: "GET /v1/benchmark-runs/{runId}/cases",
    status: "extend",
    sourceOfTruth: "ClickHouse 数据投影",
    availabilityReason: "路由已存在，但缺少分轨、风险、变化、评价和证据包等结构化字段。",
  },
  comparison: {
    endpoint: "GET /v1/comparisons/{comparisonId}",
    status: "extend",
    sourceOfTruth: "ClickHouse 数据投影",
    availabilityReason: "当前返回通用行与结果 JSON，需要结构化看板视图。",
  },
  comparisonCases: {
    endpoint: "GET /v1/comparisons/{comparisonId}/cases",
    status: "extend",
    sourceOfTruth: "ClickHouse 数据投影",
    availabilityReason: "需要补齐变化类型、指标、硬门槛和证据引用字段。",
  },
  evaluation: {
    endpoint: "GET /v1/evaluations/{evaluationId}",
    status: "extend",
    sourceOfTruth: "ClickHouse 数据投影与 PostgreSQL 权威元数据",
    availabilityReason: "当前结果 JSON 不透明，需要就绪度、致命项、硬门槛、指标和维度的结构化视图。",
  },
  evaluations: {
    endpoint: "GET /v1/evaluations",
    status: "new",
    sourceOfTruth: "ClickHouse 结构化评价投影",
    availabilityReason: "评价结果集合接口尚未实现。",
  },
  evaluationMetrics: {
    endpoint: "GET /v1/evaluations/{evaluationId}/metrics",
    status: "new",
    sourceOfTruth: "ClickHouse 指标结果",
    availabilityReason: "M1–M15 结构化子资源尚未实现。",
  },
  evidenceBundle: {
    endpoint: "GET /v1/evidence-bundles/{bundleId}",
    status: "new",
    sourceOfTruth: "PostgreSQL 权威记录与不可变制品",
    availabilityReason: "证据包查看接口尚未实现。",
  },
  evidenceBundles: {
    endpoint: "GET /v1/evidence-bundles",
    status: "new",
    sourceOfTruth: "PostgreSQL 证据包目录与不可变制品元数据",
    availabilityReason: "证据包集合接口尚未实现。",
  },
  evidenceTimeline: {
    endpoint: "GET /v1/evidence-bundles/{bundleId}/timeline",
    status: "new",
    sourceOfTruth: "不可变证据制品与目录",
    availabilityReason: "语义时间线接口尚未实现。",
  },
  evidenceDiff: {
    endpoint: "GET /v1/evidence-bundles/{bundleId}/diff",
    status: "new",
    sourceOfTruth: "两份不可变证据制品",
    availabilityReason: "基准版本与候选版本的证据结构差异接口尚未实现。",
  },
  scoreDistribution: {
    endpoint: "GET /v1/analytics/score-distribution",
    status: "blocked_data",
    sourceOfTruth: "ClickHouse 正式评价得分",
    availabilityReason: "P50/P90 正式算法尚未冻结；当前仅展示明确标注的界面演示数据。",
  },
  operational: {
    endpoint: "GET /v1/analytics/operational",
    status: "blocked_data",
    sourceOfTruth: "ClickHouse 运行指标样本",
    availabilityReason: "若干自动数据生产器尚未接入；响应必须允许不完整数据或空值。",
  },
  analytics: {
    endpoint: "GET /v1/analytics/workspace",
    status: "new",
    sourceOfTruth: "带数据水位的 ClickHouse 分析视图",
    availabilityReason: "深度分析聚合接口尚未实现；当前复用数据快照合同的确定性演示数据。",
  },
  reports: {
    endpoint: "GET /v1/reports",
    status: "new",
    sourceOfTruth: "规划中的报告服务",
    availabilityReason: "报告持久化与导出服务尚未实现；草稿仅保存在本次浏览会话。",
  },
  alerts: {
    endpoint: "GET /v1/alerts",
    status: "new",
    sourceOfTruth: "规划中的告警生命周期服务",
    availabilityReason: "告警生命周期接口尚未实现；确认与解决操作仅作用于本次浏览会话。",
  },
  systemWorkspace: {
    endpoint: "GET /v1/system/workspace",
    status: "new",
    sourceOfTruth: "静态合同与服务健康状态投影",
    availabilityReason: "统一系统信息接口尚未实现。",
  },
  candidateDetail: {
    endpoint: "GET /v1/candidates/{candidateId}",
    status: "new",
    sourceOfTruth: "候选版本登记库",
    availabilityReason: "候选版本登记接口尚未实现。",
  },
  baselineDetail: {
    endpoint: "GET /v1/baselines/{baselineId}",
    status: "new",
    sourceOfTruth: "候选版本登记库与发布基准标记",
    availabilityReason: "基准版本详情接口尚未实现。",
  },
  datasetDetail: {
    endpoint: "GET /v1/datasets/{datasetVersion}",
    status: "new",
    sourceOfTruth: "版本化数据集清单",
    availabilityReason: "数据集登记接口尚未实现。",
  },
  profileDetail: {
    endpoint: "GET /v1/profiles/{profileVersionId}",
    status: "new",
    sourceOfTruth: "版本化评价配置",
    availabilityReason: "评价配置登记接口尚未实现。",
  },
  telemetryTrace: {
    endpoint: "Telemetry /v1/evidence/trace",
    status: "external",
    sourceOfTruth: "遥测平台 ClickHouse 查询接口",
    availabilityReason: "原始规范追踪数据明确由遥测查询接口负责。",
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
  existing: "接口已存在",
  extend: "接口待扩展",
  new: "接口待新增",
  blocked_data: "数据待就绪",
  external: "外部接口",
};

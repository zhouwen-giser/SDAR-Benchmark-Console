import { useQueries } from "@tanstack/react-query";
import { Button, Empty, Select, Tag } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { capabilityMeta } from "../api/capability-map";
import { consoleApi } from "../api/consoleApi";
import { ApiStatusTag, PageHeader, SectionCard } from "../components/common";
import { TypedAnalyticsModule } from "../components/TypedAnalyticsModule";
import { useAnalysisContext } from "../hooks/useAnalysisContext";

const modules = [
  ["candidates", "候选版本"], ["tracks", "分轨"], ["scenario-families", "场景族"], ["risks", "风险"],
  ["skills", "Skills"], ["providers", "Providers"], ["quality-trend", "质量趋势"], ["change-summary", "变化摘要"],
  ["track-risk-matrix", "分轨 × 风险"], ["metrics", "M1–M15 指标"], ["dimensions", "五维能力"],
  ["readiness-funnel", "证据就绪漏斗"], ["stability", "稳定性"], ["regression-contributors", "回归贡献"],
  ["score-distribution", "得分分布"], ["operational", "运行信号"], ["gates", "硬门槛"], ["fatals", "致命规则"],
] as const;

export function AnalyticsPage() {
  const { filters, setFilters } = useAnalysisContext();
  const queries = useQueries({
    queries: modules.map(([key]) => ({
      queryKey: ["analytics-module", key, filters.candidateId, filters.datasetVersion, filters.profileVersionId, filters.runId, filters.track, filters.risk, filters.period],
      queryFn: ({ signal }: { signal: AbortSignal }) => consoleApi.getAnalyticsModule(key, filters, { signal }),
      retry: false,
    })),
  });
  const metas = queries.flatMap((query) => query.data ? [query.data.meta] : []);
  const unavailable = queries.filter((query) => query.isError || query.data?.meta.availability === "unavailable").length;
  const partial = queries.filter((query) => query.data?.meta.availability === "partial").length;
  const pageMeta = capabilityMeta("analytics", {
    mocked: metas.some((meta) => meta.mocked),
    mode: metas[0]?.mode ?? "http",
    availability: unavailable === modules.length ? "unavailable" : unavailable > 0 || partial > 0 ? "partial" : "available",
    reasonCodes: [...new Set(metas.flatMap((meta) => meta.reasonCodes))],
    unavailableFields: [...new Set(metas.flatMap((meta) => meta.unavailableFields))],
    warnings: [...new Set(metas.flatMap((meta) => meta.warnings))],
    watermark: metas.map((meta) => meta.watermark).find(Boolean) ?? null,
    projectionLagMs: metas.map((meta) => meta.projectionLagMs).find((value) => value != null) ?? null,
    contracts: [...new Set(metas.flatMap((meta) => meta.contracts))],
  });

  return (
    <div className="standard-page analytics-page">
      <PageHeader
        title="指标分析工作区"
        subtitle="18 个正式 Analytics capability 独立加载；任一 BLOCKED_DATA/503 不会终止其他模块。"
        meta={pageMeta}
        actions={<><Tag color={unavailable ? "gold" : "green"}>UNAVAILABLE {unavailable} · PARTIAL {partial}</Tag><Select value={filters.period} options={[{ value: "7d", label: "最近 7 天" }, { value: "14d", label: "最近 14 天" }, { value: "30d", label: "最近 30 天" }]} onChange={(period) => setFilters({ period })} /><Button icon={<ReloadOutlined />} onClick={() => queries.forEach((query) => void query.refetch())}>刷新</Button></>}
      />
      <div className="analytics-context-strip">
        <span>候选版本 <b>{filters.candidateId}</b></span><span>评测运行 <b>{filters.runId}</b></span><span>数据集 <b>{filters.datasetVersion}</b></span>
      </div>
      <div className="analytics-grid">
        {modules.map(([key, title], index) => {
          const query = queries[index];
          const resource = query.data;
          const rows = resource?.data.rows ?? [];
          return (
            <SectionCard key={key} title={title} extra={resource && <ApiStatusTag compact meta={resource.meta} />} className={key === "metrics" || key === "quality-trend" ? "analytics-span-6" : "analytics-span-4"}>
              {query.isLoading ? <div className="page-loading">正在加载 {key}…</div> : query.isError ? <div className="unavailable-card"><span>UNAVAILABLE · {query.error instanceof Error ? query.error.message : "请求失败"}</span></div> : rows.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`${resource?.meta.availability ?? "unavailable"} · ${resource?.meta.reasonCodes.join("、") || "无数据"}`} /> : <TypedAnalyticsModule moduleKey={key} rows={rows} />}
            </SectionCard>
          );
        })}
      </div>
    </div>
  );
}

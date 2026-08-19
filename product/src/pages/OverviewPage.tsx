import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Divider,
  Drawer,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from "antd";
import {
  ArrowRightOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  DatabaseOutlined,
  ExclamationCircleFilled,
  FilterFilled,
  ReloadOutlined,
  WarningFilled,
} from "@ant-design/icons";
import { consoleApi } from "../api/consoleApi";
import { capabilityMeta } from "../api/capability-map";
import { ApiStatusTag, DataStatePanel, SectionCard, SnapshotAlert } from "../components/common";
import {
  ContributorsChart,
  EvidenceFunnelChart,
  MetricHeatmap,
  QualityStabilityChart,
  QualityTrendChart,
  RegressionWaterfallChart,
  ScoreDistributionChart,
  TrackRiskHeatmap,
} from "../components/charts";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import type { AnalysisConclusion, CaseResult, OverviewSnapshot } from "../types";
import { displayValue, metricName, signedDelta } from "../utils/format";

const scenarioOptions = [
  { label: "BLOCKED", value: "blocked" },
  { label: "READY", value: "ready" },
  { label: "INVALID", value: "invalid" },
];

const dataStateOptions = [
  { label: "LOADED", value: "loaded" },
  { label: "LOADING", value: "loading" },
  { label: "EMPTY", value: "empty" },
  { label: "ERROR", value: "error" },
  { label: "STALE", value: "stale" },
  { label: "PARTIAL", value: "partial" },
];

function ContextBar({ data, onRefresh }: { data: OverviewSnapshot; onRefresh: () => void }) {
  const { filters, setFilters, navigateWithContext } = useAnalysisContext();
  const context = data.context;
  const localFilters = [
    filters.track !== "all" && `Track=${filters.track.toUpperCase()}`,
    filters.risk !== "all" && `Risk=${filters.risk}`,
  ].filter(Boolean) as string[];

  return (
    <header className="overview-context">
      <div className="overview-heading">
        <h1>SDAR Benchmark Quality Command Center</h1>
        <div className="context-selectors" aria-label="全局分析上下文">
          <div className="context-selector-field">
            <button type="button" className="context-resource-link" onClick={() => navigateWithContext(`/candidates/${filters.candidateId}`)}>Candidate ↗</button>
            <Select
              aria-label="Candidate"
              size="small"
              value={filters.candidateId}
              options={[{ value: context.candidate.id, label: `SDAR ${context.candidate.runtimeVersion} (${context.candidate.commit})` }]}
              onChange={(candidateId) => setFilters({ candidateId }, { clearLocal: true })}
            />
          </div>
          <div className="context-selector-field">
            <button type="button" className="context-resource-link" onClick={() => navigateWithContext(`/baselines/${filters.baselineId}`)}>Baseline ↗</button>
            <Select
              aria-label="Baseline"
              size="small"
              value={filters.baselineId}
              options={[{ value: context.baseline.id, label: `SDAR ${context.baseline.runtimeVersion} (${context.baseline.commit})` }]}
              onChange={(baselineId) => setFilters({ baselineId }, { clearLocal: true })}
            />
          </div>
          <div className="context-selector-field">
            <button type="button" className="context-resource-link" onClick={() => navigateWithContext(`/datasets/${filters.datasetVersion}`)}>Dataset ↗</button>
            <Select
              aria-label="Dataset"
              size="small"
              value={filters.datasetVersion}
              options={[{ value: context.dataset.id, label: context.dataset.id }]}
              onChange={(datasetVersion) => setFilters({ datasetVersion }, { clearLocal: true })}
            />
          </div>
          <div className="context-selector-field">
            <button type="button" className="context-resource-link" onClick={() => navigateWithContext(`/profiles/${filters.profileVersionId}`)}>Profile ↗</button>
            <Select
              aria-label="Profile"
              size="small"
              value={filters.profileVersionId}
              options={[{ value: context.profile.id, label: context.profile.id }]}
              onChange={(profileVersionId) => setFilters({ profileVersionId }, { clearLocal: true })}
            />
          </div>
          <div className="context-selector-field">
            <button type="button" className="context-resource-link" onClick={() => navigateWithContext(`/runs/${filters.runId}`)}>Run ↗</button>
            <Select
              aria-label="Run"
              size="small"
              value={filters.runId}
              options={[{ value: context.run.id, label: context.run.id }]}
              onChange={(runId) => setFilters({ runId }, { clearLocal: true })}
            />
          </div>
          <span className="context-watermark">Watermark <b>{data.snapshot.watermark.slice(11, 19)}</b></span>
          <span className="context-watermark">Lag <b>{(data.snapshot.projectionLagMs / 1000).toFixed(1)}s</b></span>
        </div>
      </div>
      <div className="context-actions">
        <Space size={6} wrap>
          <Tooltip title="高保真 Mock 业务场景">
            <Select
              aria-label="业务场景"
              size="small"
              className="scenario-select"
              value={filters.scenario}
              options={scenarioOptions}
              onChange={(scenario) => setFilters({ scenario }, { clearLocal: true })}
            />
          </Tooltip>
          <Tooltip title="数据生命周期演示状态">
            <Select
              aria-label="数据状态"
              size="small"
              value={filters.dataState}
              options={dataStateOptions}
              onChange={(dataState) => setFilters({ dataState })}
            />
          </Tooltip>
          <Select
            aria-label="Track 筛选"
            size="small"
            value={filters.track}
            options={["all", "core", "skill", "mcp", "node", "cross"].map((value) => ({
              value,
              label: value === "all" ? "Track 全部" : value.toUpperCase(),
            }))}
            onChange={(track) => setFilters({ track })}
          />
          <Select
            aria-label="Risk Level 筛选"
            size="small"
            value={filters.risk}
            options={["all", "critical", "high", "medium", "low"].map((value) => ({
              value,
              label: value === "all" ? "Risk 全部" : value,
            }))}
            onChange={(risk) => setFilters({ risk })}
          />
          <Select
            aria-label="时间范围"
            size="small"
            value={filters.period}
            options={[
              { value: "7d", label: "最近 7 天" },
              { value: "14d", label: "最近 14 天" },
              { value: "30d", label: "最近 30 天" },
            ]}
            onChange={(period) => setFilters({ period })}
          />
          <Button size="small" icon={<ReloadOutlined />} aria-label="刷新 Snapshot" onClick={onRefresh} />
        </Space>
        {localFilters.length > 0 && (
          <div className="filter-chip-row">
            <FilterFilled />
            {localFilters.map((item) => <Tag key={item} closable onClose={() => setFilters(item.startsWith("Track") ? { track: "all" } : { risk: "all" })}>{item}</Tag>)}
            <Button type="link" size="small" onClick={() => setFilters({ track: "all", risk: "all" })}>Clear all</Button>
          </div>
        )}
      </div>
    </header>
  );
}

function GateIcon({ status }: { status: string }) {
  if (status === "ready") return <CheckCircleFilled />;
  if (status === "invalid") return <ExclamationCircleFilled />;
  return <CloseCircleFilled />;
}

function ReleaseGateCard({ data, onOpen }: { data: OverviewSnapshot; onOpen: () => void }) {
  const status = data.releaseGate.status;
  return (
    <SectionCard
      className={`release-gate release-${status}`}
      onClick={onOpen}
      ariaLabel={`Release Gate ${status}`}
    >
      <div className="release-gate-content">
        <div>
          <span className="release-label">RELEASE GATE</span>
          <strong>{status.toUpperCase()}</strong>
          <p>阻塞原因 ({data.releaseGate.blockingReasons.length})</p>
          {data.releaseGate.blockingReasons.slice(0, 2).map((reason) => <small key={reason}>• {reason}</small>)}
        </div>
        <GateIcon status={status} />
      </div>
    </SectionCard>
  );
}

function KpiStrip({ data, openCases, openQuality, goCompare }: {
  data: OverviewSnapshot;
  openCases: (filters: { gate?: string; change?: string; readiness?: string }) => void;
  openQuality: () => void;
  goCompare: () => void;
}) {
  const kpis = [
    { label: "Quality Score", value: data.kpis.qualityScore, delta: data.kpis.qualityDelta, baseline: 83.2, onClick: openQuality },
    { label: "Pass Rate", value: data.kpis.passRate, suffix: "%", delta: data.kpis.passDelta, baseline: "87.1%", onClick: openQuality },
    { label: "Proven Fatal", value: data.kpis.provenFatal, baseline: 0, tone: "fatal", onClick: () => openCases({ change: "fatal" }) },
    { label: "Required HG Failure", value: data.kpis.requiredHgFailures, baseline: 0, tone: "danger", onClick: () => openCases({ gate: "HG4" }) },
    { label: "Not Ready", value: data.kpis.notReady, baseline: 1, tone: "not-ready", onClick: () => openCases({ readiness: "not_ready" }) },
    { label: "Regression Cases", value: data.kpis.regressions, baseline: 5, tone: "danger", onClick: goCompare },
  ];
  return (
    <SectionCard className="kpi-card-shell">
      <div className="kpi-strip">
        {kpis.map((item) => (
          <button key={item.label} className={`kpi-cell tone-${item.tone ?? "default"}`} onClick={item.onClick}>
            <span>{item.label}</span>
            <strong>{displayValue(item.value, item.suffix)}</strong>
            {item.delta !== undefined && <em className={(item.delta ?? 0) >= 0 ? "delta-positive" : "delta-negative"}>{signedDelta(item.delta, item.suffix)}</em>}
            <small>vs Baseline {displayValue(item.baseline)}</small>
          </button>
        ))}
      </div>
    </SectionCard>
  );
}

function CoverageCard({ data }: { data: OverviewSnapshot }) {
  return (
    <SectionCard className="coverage-card">
      <div className="coverage-grid">
        <div><span>Formal Eval Rate</span><strong>{displayValue(data.kpis.formalEvaluationRate, "%")}</strong><small>vs Baseline 72%</small></div>
        <div><span>Critical-risk Pass</span><strong>{displayValue(data.kpis.criticalRiskPassRate, "%")}</strong><small>vs Baseline 92%</small></div>
      </div>
    </SectionCard>
  );
}

function priorityForConclusion(item: AnalysisConclusion, index: number) {
  if (item.severity === "positive") return "P2";
  return index < 2 ? "P0" : "P1";
}

function OverviewDrawers({ data }: { data: OverviewSnapshot }) {
  const { searchParams, setQueryParams, navigateWithContext } = useAnalysisContext();
  const drawer = searchParams.get("drawer");
  const gate = searchParams.get("gate") ?? undefined;
  const change = searchParams.get("change") ?? undefined;
  const readiness = searchParams.get("readiness") ?? undefined;
  const metric = searchParams.get("metric") ?? "M11";
  const track = searchParams.get("metricTrack") ?? "MCP";
  const casesQuery = useQuery({
    queryKey: ["case-drawer", gate, change, readiness, data.snapshot.snapshotId],
    queryFn: () => consoleApi.listCases({ gate, change }),
    enabled: drawer === "cases" || drawer === "release",
  });
  const cases = casesQuery.data?.data ?? [];
  const close = () => setQueryParams(
    { drawer: null, gate: null, change: null, readiness: null, metric: null, metricTrack: null },
    { replace: true },
  );
  const metricRows = data.metricHeatmap.filter((item) => item.metric === metric);

  const columns = [
    { title: "Case", dataIndex: "caseId", key: "caseId", render: (value: string, row: CaseResult) => <button className="link-button" onClick={() => navigateWithContext(`/evaluations/${row.evaluationId}`)}>{value}</button> },
    { title: "Risk", dataIndex: "risk", key: "risk", render: (value: string) => <Tag color={value === "critical" ? "red" : "orange"}>{value}</Tag> },
    { title: "Gate", dataIndex: "gates", key: "gates", render: (value: string[]) => value.map((item) => <Tag color="red" key={item}>{item}</Tag>) },
    { title: "Score", dataIndex: "score", key: "score", render: (value: number | null) => displayValue(value) },
    { title: "Change", dataIndex: "change", key: "change" },
  ];

  return (
    <>
      <Drawer
        title="Release Gate 阻塞详情"
        width={520}
        open={drawer === "release"}
        onClose={close}
        extra={<ApiStatusTag compact meta={capabilityMeta("runCases", { mocked: true, watermark: data.snapshot.watermark, projectionLagMs: data.snapshot.projectionLagMs })} />}
      >
        <div className={`drawer-gate-state release-${data.releaseGate.status}`}><GateIcon status={data.releaseGate.status} /><strong>{data.releaseGate.status.toUpperCase()}</strong></div>
        <Divider orientation="left">Blocking reasons</Divider>
        {data.releaseGate.blockingReasons.map((reason) => <p key={reason}><WarningFilled className="text-danger" /> {reason}</p>)}
        <Divider orientation="left">可验证对象</Divider>
        <Table<CaseResult> size="small" rowKey="caseId" loading={casesQuery.isLoading} columns={columns} dataSource={cases.slice(0, 2)} pagination={false} />
        <Button type="primary" block className="drawer-primary-action" disabled={!cases[0]} onClick={() => cases[0] && navigateWithContext(`/evaluations/${cases[0].evaluationId}`)}>
          查看首个阻塞 Case Evaluation
        </Button>
      </Drawer>
      <Drawer
        title={gate ? `${gate} 失败 Case` : readiness ? "Not Ready Case" : "Case Explorer"}
        width={720}
        open={drawer === "cases"}
        onClose={close}
        extra={<ApiStatusTag compact meta={capabilityMeta("caseResults", { mocked: true, watermark: data.snapshot.watermark, projectionLagMs: data.snapshot.projectionLagMs })} />}
      >
        <p className="drawer-intro">当前筛选：{gate ?? change ?? readiness ?? "all"}。点击 Case 可继续进入 typed Evaluation。</p>
        <Table<CaseResult> rowKey="caseId" loading={casesQuery.isLoading} columns={columns} dataSource={cases} pagination={false} />
      </Drawer>
      <Drawer
        title={`${track} × ${metric} Metric 详情`}
        width={720}
        open={drawer === "metric"}
        onClose={close}
        extra={<ApiStatusTag compact meta={capabilityMeta("evaluationMetrics", { mocked: true, watermark: data.snapshot.watermark, projectionLagMs: data.snapshot.projectionLagMs })} />}
      >
        <p className="drawer-intro">该聚合来自显式 mock-derived M1–M15 数据；Server typed metric endpoint 仍为 NEW。</p>
        {metricRows.map((item) => (
          <SectionCard key={`${item.track}-${item.metric}`} title={`${item.track} · ${item.metric}`}>
            <div className="metric-detail-row">
              <Progress type="circle" percent={item.score} size={92} />
              <dl><dt>Formal</dt><dd>{item.formalCount}</dd><dt>Diagnostic</dt><dd>{item.diagnosticCount}</dd><dt>Baseline Δ</dt><dd className={item.delta < 0 ? "text-danger" : "text-positive"}>{signedDelta(item.delta)}</dd></dl>
            </div>
          </SectionCard>
        ))}
        <Button type="primary" onClick={() => navigateWithContext("/evaluations/eval-mcp17")}>查看 MCP-RESTART-017 Evaluation</Button>
      </Drawer>
      <Drawer
        title="Quality 构成与五维"
        width={720}
        open={drawer === "quality"}
        onClose={close}
      >
        <p className="drawer-intro">Quality Score 只聚合 formal、eligible Case；Not Ready 不进入分母。Release Gate 是独立判断。</p>
        <div className="quality-dimension-list">
          {["Goal & State", "Planning", "Decision & Safety", "Execution & Evidence", "Closure"].map((label, index) => <div key={label}><span>{label}</span><Progress percent={[88, 79, 72, 61, 66][index]} size="small" /></div>)}
        </div>
      </Drawer>
    </>
  );
}

export function OverviewPage() {
  const { filters, setFilters, setQueryParams, navigateWithContext } = useAnalysisContext();
  const query = useQuery({
    queryKey: ["overview", filters],
    queryFn: () => consoleApi.getOverview(filters),
    retry: false,
  });

  const data = query.data?.data;
  const meta = query.data?.meta;
  const effectiveState = filters.dataState;

  const openCases = (next: { gate?: string; change?: string; readiness?: string }) => {
    setQueryParams({ drawer: "cases", gate: next.gate, change: next.change, readiness: next.readiness });
  };

  const handleConclusion = (item: AnalysisConclusion) => {
    if (item.title.includes("HG4")) {
      navigateWithContext("/cases", { gate: "HG4", change: "NEW_GATE_FAILURE" });
      return;
    }
    if (item.category === "release_blocker") {
      navigateWithContext("/compare/CMP-20260815-004", { track: item.drillDown.filters.track, metric: item.drillDown.filters.metric });
      return;
    }
    if (item.category === "evidence_quality") {
      navigateWithContext("/cases", { readiness: "not_ready", missing: item.drillDown.filters.missing });
      return;
    }
    navigateWithContext("/analytics", item.drillDown.filters);
  };

  if (!data || !meta) {
    const fallback = filters.dataState === "error" ? "error" : "loading";
    return (
      <div className="overview-page">
        <div className="overview-loading-header"><h1>SDAR Benchmark Quality Command Center</h1></div>
        <DataStatePanel state={fallback} onRetry={() => setFilters({ dataState: "loaded" })}><span /></DataStatePanel>
      </div>
    );
  }

  const scoreMeta = capabilityMeta("scoreDistribution", { mocked: true, watermark: data.snapshot.watermark, projectionLagMs: data.snapshot.projectionLagMs });
  const operationalMeta = capabilityMeta("operational", { mocked: true, watermark: data.snapshot.watermark, projectionLagMs: data.snapshot.projectionLagMs });

  return (
    <div className="overview-page">
      <ContextBar data={data} onRefresh={() => query.refetch()} />
      <SnapshotAlert status={data.snapshot.dataStatus} watermark={data.snapshot.watermark} lagMs={data.snapshot.projectionLagMs} moduleErrors={data.snapshot.moduleErrors} />
      <DataStatePanel state={effectiveState} onRetry={() => setFilters({ dataState: "loaded" })}>
        <div className="overview-grid overview-summary">
          <ReleaseGateCard data={data} onOpen={() => {
            setQueryParams({ drawer: "release" });
          }} />
          <KpiStrip
            data={data}
            openCases={openCases}
            openQuality={() => {
              setQueryParams({ drawer: "quality" });
            }}
            goCompare={() => navigateWithContext("/compare/CMP-20260815-004", { changeType: "REGRESSED" })}
          />
          <CoverageCard data={data} />
        </div>

        <div className="overview-grid overview-insight">
          <SectionCard title="关键分析结论 (Top 4)" className="card-conclusions">
            <div className="dense-list conclusions-list">
              {data.analysisConclusions.slice(0, 4).map((item, index) => (
                <button key={item.id} onClick={() => handleConclusion(item)}>
                  <Tag color={priorityForConclusion(item, index) === "P0" ? "red" : priorityForConclusion(item, index) === "P1" ? "gold" : "green"}>{priorityForConclusion(item, index)}</Tag>
                  <span><b>{item.title}</b><small>{item.summary}</small></span>
                  <ArrowRightOutlined />
                </button>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="重点关注队列" className="card-attention">
            <div className="dense-list attention-list">
              {data.attentionItems.slice(0, 5).map((item) => (
                <button key={item.title} onClick={() => item.title.includes("HG4") ? navigateWithContext("/cases", { gate: "HG4" }) : openCases({ change: item.title.includes("Not Ready") ? "not_ready" : undefined })}>
                  <Tag color={item.priority === "P0" ? "red" : item.priority === "P1" ? "gold" : "green"}>{item.priority}</Tag>
                  <span>{item.title}</span>
                  <b>{item.count ?? item.value ?? item.delta ?? ""}</b>
                </button>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="质量趋势 (vs Baseline)" className="card-trend"><QualityTrendChart data={data.qualityTrend} onPoint={(label) => label === "current" && setFilters({ candidateId: data.context.candidate.id }, { clearLocal: true })} /></SectionCard>
          <SectionCard title="回归变化瀑布 (得分变化)" className="card-waterfall">
            {data.regressionWaterfall ? <RegressionWaterfallChart data={data.regressionWaterfall} onBar={(change) => navigateWithContext("/compare/CMP-20260815-004", { changeType: change.toUpperCase().replace(" ", "_") })} /> : <div className="unavailable-card"><DatabaseOutlined /><span>INVALID · 暂无可比较正式结果</span></div>}
          </SectionCard>
          <SectionCard title="Track × Risk 热力图" className="card-track-risk"><TrackRiskHeatmap data={data.trackRiskMatrix} onCell={(track, risk) => setFilters({ track, risk })} /></SectionCard>
        </div>

        <div className="overview-grid overview-diagnosis">
          <SectionCard title="M1–M15 指标热力图" className="card-metric"><MetricHeatmap data={data.metricHeatmap} onCell={(metric, track) => {
            setQueryParams({ drawer: "metric", metric, metricTrack: track });
          }} /></SectionCard>
          <SectionCard title="Evidence 就绪漏斗" className="card-funnel"><EvidenceFunnelChart data={data.evidenceReadinessFunnel} /></SectionCard>
          <SectionCard title="质量 × 稳定性散点图" className="card-stability"><QualityStabilityChart data={data.qualityStabilityPoints} onPoint={(caseId) => navigateWithContext("/cases", { search: caseId })} /></SectionCard>
          <SectionCard title="回归贡献分析" className="card-contributors"><ContributorsChart data={data.regressionContributors} onSlice={(contributor) => navigateWithContext("/compare/CMP-20260815-004", { contributor })} /></SectionCard>
        </div>

        <div className="overview-grid overview-operations">
          <SectionCard title="最近异常 / 事件时间线" className="card-anomalies">
            <div className="event-list">{data.anomalyTimeline.slice(0, 5).map((item) => <button key={`${item.at}-${item.title}`} onClick={() => item.target.type === "case" ? navigateWithContext("/cases", { search: item.target.id }) : item.target.type === "evaluation" ? navigateWithContext(`/evaluations/${item.target.id}`) : navigateWithContext("/settings")}><time>{item.at.slice(11, 16)}</time><i className={`event-${item.severity}`} /><span>{item.title}</span><Tag color={item.severity === "critical" ? "red" : "gold"}>{item.severity === "critical" ? "P0" : "P1"}</Tag></button>)}</div>
          </SectionCard>
          <SectionCard title="Operational 摘要（不影响质量分）" extra={<ApiStatusTag compact meta={operationalMeta} />} className="card-operational">
            <div className="operational-table"><div>KPI</div><div>Current</div><div>Baseline</div><div>Change</div>{data.operationalSummary.slice(0, 5).flatMap((item) => [<div key={`${item.metric}-a`}>{metricName(item.metric)}</div>, <div key={`${item.metric}-b`}>{displayValue(item.current, item.unit)}</div>, <div key={`${item.metric}-c`}>{displayValue(item.baseline, item.unit)}</div>, <div key={`${item.metric}-d`} className={(item.changePercent ?? 0) > 0 ? "delta-negative" : "delta-positive"}>{signedDelta(item.changePercent, "%")}</div>])}</div>
            <small className="operational-note">* Operational KPIs do not affect Quality Score</small>
          </SectionCard>
          <SectionCard title="Score 分布" extra={<ApiStatusTag compact meta={scoreMeta} />} className="card-score-distribution">{data.scoreDistribution ? <ScoreDistributionChart data={data.scoreDistribution} /> : <div className="unavailable-card"><DatabaseOutlined /><span>BLOCKED DATA · 正式算法/数据不可用</span></div>}</SectionCard>
          <SectionCard title="系统状态" className="card-system"><div className="system-list">{data.systemStatus.slice(0, 8).map((item) => <div key={item.component}><i className={item.status === "healthy" ? "status-dot-good" : "status-dot-warn"} /><span>{item.component}</span><b className={item.status === "healthy" ? "text-positive" : "text-warning"}>{item.detail ?? item.status}</b></div>)}</div></SectionCard>
          <SectionCard title="最近 Run" className="card-recent-runs"><div className="recent-run-list">{data.recentRuns.slice(0, 4).map((run) => <button key={run.runId} onClick={() => navigateWithContext(`/runs/${run.runId}`)}><span>{run.runId.replace("R-202608", "…")}</span><span>{run.candidate}</span><b>{run.status}</b></button>)}</div></SectionCard>
        </div>
      </DataStatePanel>
      <OverviewDrawers data={data} />
      <div className="overview-source-status"><ApiStatusTag compact meta={meta} /></div>
    </div>
  );
}

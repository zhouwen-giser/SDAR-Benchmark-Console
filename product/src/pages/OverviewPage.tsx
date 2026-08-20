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
import { consoleApi, currentApiMode } from "../api/consoleApi";
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
import type { AnalysisConclusion, CaseResult, ContextOptionsView, OverviewSnapshot } from "../types";
import {
  changeName,
  displayValue,
  metricName,
  metricValue,
  overviewText,
  releaseStatusName,
  riskName,
  signedDelta,
  statusName,
  systemComponentName,
  trackName,
} from "../utils/format";

const scenarioOptions = [
  { label: "已阻塞", value: "blocked" },
  { label: "可发布", value: "ready" },
  { label: "不可判定", value: "invalid" },
];

const dataStateOptions = [
  { label: "数据已就绪", value: "loaded" },
  { label: "数据加载中", value: "loading" },
  { label: "暂无数据", value: "empty" },
  { label: "加载失败", value: "error" },
  { label: "数据已过期", value: "stale" },
  { label: "数据不完整", value: "partial" },
];

function ContextBar({ data, options, onRefresh }: { data: OverviewSnapshot; options?: ContextOptionsView; onRefresh: () => void }) {
  const { filters, setFilters, navigateWithContext } = useAnalysisContext();
  const context = data.context;
  const localFilters = [
    filters.track !== "all" && { key: "track", label: `分轨：${trackName(filters.track)}` },
    filters.risk !== "all" && { key: "risk", label: `风险：${riskName(filters.risk)}` },
  ].filter(Boolean) as Array<{ key: "track" | "risk"; label: string }>;

  return (
    <header className="overview-context">
      <div className="overview-heading">
        <h1>SDAR 基准质量指挥中心</h1>
        <div className="context-selectors" aria-label="全局分析上下文">
          <div className="context-selector-field">
            <button type="button" className="context-resource-link" onClick={() => navigateWithContext(`/candidates/${filters.candidateId}`)}>候选版本 ↗</button>
            <Select
              aria-label="候选版本"
              size="small"
              value={filters.candidateId}
              options={(options?.candidates ?? [{ id: context.candidate.id, label: `SDAR ${context.candidate.runtimeVersion} (${context.candidate.commit})` }]).map((item) => ({ value: item.id, label: item.label }))}
              onChange={(candidateId) => setFilters({ candidateId }, { clearLocal: true })}
            />
          </div>
          <div className="context-selector-field">
            <button type="button" className="context-resource-link" onClick={() => navigateWithContext(`/baselines/${filters.baselineId}`)}>基准版本 ↗</button>
            <Select
              aria-label="基准版本"
              size="small"
              value={filters.baselineId}
              options={(options?.baselines ?? [{ id: context.baseline.id, label: context.baseline.id }]).map((item) => ({ value: item.id, label: item.label }))}
              onChange={(baselineId) => setFilters({ baselineId }, { clearLocal: true })}
            />
          </div>
          <div className="context-selector-field">
            <button type="button" className="context-resource-link" onClick={() => navigateWithContext(`/datasets/${filters.datasetVersion}`)}>数据集 ↗</button>
            <Select
              aria-label="数据集"
              size="small"
              value={filters.datasetVersion}
              options={(options?.datasets ?? [{ id: context.dataset.id, label: context.dataset.id }]).map((item) => ({ value: item.id, label: item.label }))}
              onChange={(datasetVersion) => setFilters({ datasetVersion }, { clearLocal: true })}
            />
          </div>
          <div className="context-selector-field">
            <button type="button" className="context-resource-link" onClick={() => navigateWithContext(`/profiles/${filters.profileVersionId}`)}>评价配置 ↗</button>
            <Select
              aria-label="评价配置"
              size="small"
              value={filters.profileVersionId}
              options={(options?.profiles ?? [{ id: context.profile.id, label: context.profile.id }]).map((item) => ({ value: item.id, label: item.label }))}
              onChange={(profileVersionId) => setFilters({ profileVersionId }, { clearLocal: true })}
            />
          </div>
          <div className="context-selector-field">
            <button type="button" className="context-resource-link" onClick={() => navigateWithContext(`/runs/${filters.runId}`)}>评测运行 ↗</button>
            <Select
              aria-label="评测运行"
              size="small"
              value={filters.runId}
              options={(options?.runs ?? [{ id: context.run.id, label: context.run.id }]).map((item) => ({ value: item.id, label: item.label }))}
              onChange={(runId) => setFilters({ runId }, { clearLocal: true })}
            />
          </div>
          <span className="context-watermark">数据水位 <b>{data.snapshot.watermark?.slice(11, 19) ?? "—"}</b></span>
          <span className="context-watermark">投影延迟 <b>{data.snapshot.projectionLagMs == null ? "—" : `${(data.snapshot.projectionLagMs / 1000).toFixed(1)} 秒`}</b></span>
        </div>
      </div>
      <div className="context-actions">
        <Space size={6} wrap>
          {currentApiMode() !== "http" && <Tooltip title="高保真演示数据场景">
            <Select
              aria-label="业务场景"
              size="small"
              className="scenario-select"
              value={filters.scenario}
              options={scenarioOptions}
              onChange={(scenario) => setFilters({ scenario }, { clearLocal: true })}
            />
          </Tooltip>}
          {currentApiMode() !== "http" && <Tooltip title="数据生命周期演示状态">
            <Select
              aria-label="数据状态"
              size="small"
              value={filters.dataState}
              options={dataStateOptions}
              onChange={(dataState) => setFilters({ dataState })}
            />
          </Tooltip>}
          <Select
            aria-label="分轨筛选"
            size="small"
            value={filters.track}
            options={["all", "core", "skill", "mcp", "node", "cross"].map((value) => ({
              value,
              label: trackName(value),
            }))}
            onChange={(track) => setFilters({ track })}
          />
          <Select
            aria-label="风险等级筛选"
            size="small"
            value={filters.risk}
            options={["all", "critical", "high", "medium", "low"].map((value) => ({
              value,
              label: riskName(value),
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
          <Button size="small" icon={<ReloadOutlined />} aria-label="刷新数据快照" onClick={onRefresh} />
        </Space>
        {localFilters.length > 0 && (
          <div className="filter-chip-row">
            <FilterFilled />
            {localFilters.map((item) => <Tag key={item.key} closable onClose={() => setFilters(item.key === "track" ? { track: "all" } : { risk: "all" })}>{item.label}</Tag>)}
            <Button type="link" size="small" onClick={() => setFilters({ track: "all", risk: "all" })}>清除全部</Button>
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
      ariaLabel={`发布门槛：${releaseStatusName(status)}`}
    >
      <div className="release-gate-content">
        <div>
          <span className="release-label">发布门槛</span>
          <strong>{releaseStatusName(status)}</strong>
          <p>阻塞原因 ({data.releaseGate.blockingReasons.length})</p>
          {data.releaseGate.blockingReasons.slice(0, 2).map((reason) => <small key={reason}>• {overviewText(reason)}</small>)}
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
    { label: "质量得分", value: data.kpis.qualityScore, delta: data.kpis.qualityDelta, baseline: 83.2, onClick: openQuality },
    { label: "用例通过率", value: data.kpis.passRate, suffix: "%", delta: data.kpis.passDelta, baseline: "87.1%", onClick: openQuality },
    { label: "已确认致命问题", value: data.kpis.provenFatal, baseline: 0, tone: "fatal", onClick: () => openCases({ change: "fatal" }) },
    { label: "必需硬门槛失败", value: data.kpis.requiredHgFailures, baseline: 0, tone: "danger", onClick: () => openCases({ gate: "HG4" }) },
    { label: "未就绪用例", value: data.kpis.notReady, baseline: 1, tone: "not-ready", onClick: () => openCases({ readiness: "not_ready" }) },
    { label: "回归用例", value: data.kpis.regressions, baseline: 5, tone: "danger", onClick: goCompare },
  ];
  return (
    <SectionCard className="kpi-card-shell">
      <div className="kpi-strip">
        {kpis.map((item) => (
          <button key={item.label} className={`kpi-cell tone-${item.tone ?? "default"}`} onClick={item.onClick}>
            <span>{item.label}</span>
            <strong>{displayValue(item.value, item.suffix)}</strong>
            {item.delta !== undefined && <em className={(item.delta ?? 0) >= 0 ? "delta-positive" : "delta-negative"}>{signedDelta(item.delta, item.suffix)}</em>}
            <small>基准值 {displayValue(item.baseline)}</small>
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
        <div><span>正式评价覆盖率</span><strong>{displayValue(data.kpis.formalEvaluationRate, "%")}</strong><small>基准值 72%</small></div>
        <div><span>极高风险用例通过率</span><strong>{displayValue(data.kpis.criticalRiskPassRate, "%")}</strong><small>基准值 92%</small></div>
      </div>
    </SectionCard>
  );
}

function priorityForConclusion(item: AnalysisConclusion, index: number) {
  if (item.severity === "positive") return "P2";
  return index < 2 ? "P0" : "P1";
}

function localizedCompactValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string" && /^-?\d+(?:\.\d+)?s$/.test(value)) return `${value.slice(0, -1)} 秒`;
  return String(value);
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
  const activeFilter = gate ? `${gate} 失败` : readiness ? changeName(readiness) : change ? changeName(change) : "全部用例";

  const columns = [
    { title: "用例编号", dataIndex: "caseId", key: "caseId", render: (value: string, row: CaseResult) => <button className="link-button" onClick={() => navigateWithContext(`/evaluations/${row.evaluationId}`)}>{value}</button> },
    { title: "风险等级", dataIndex: "risk", key: "risk", render: (value: string) => <Tag color={value === "critical" ? "red" : "orange"}>{riskName(value)}</Tag> },
    { title: "硬门槛", dataIndex: "gates", key: "gates", render: (value: string[]) => value.map((item) => <Tag color="red" key={item}>{item}</Tag>) },
    { title: "得分", dataIndex: "score", key: "score", render: (value: number | null) => displayValue(value) },
    { title: "变化类型", dataIndex: "change", key: "change", render: (value: string) => changeName(value) },
  ];

  return (
    <>
      <Drawer
        title="发布门槛阻塞详情"
        width={520}
        open={drawer === "release"}
        onClose={close}
        extra={<ApiStatusTag compact meta={capabilityMeta("runCases", { mocked: currentApiMode() !== "http", mode: currentApiMode(), watermark: data.snapshot.watermark, projectionLagMs: data.snapshot.projectionLagMs })} />}
      >
        <div className={`drawer-gate-state release-${data.releaseGate.status}`}><GateIcon status={data.releaseGate.status} /><strong>{releaseStatusName(data.releaseGate.status)}</strong></div>
        <Divider orientation="left">阻塞原因</Divider>
        {data.releaseGate.blockingReasons.map((reason) => <p key={reason}><WarningFilled className="text-danger" /> {overviewText(reason)}</p>)}
        <Divider orientation="left">可验证对象</Divider>
        <Table<CaseResult> size="small" rowKey="caseId" loading={casesQuery.isLoading} columns={columns} dataSource={cases.slice(0, 2)} pagination={false} />
        <Button type="primary" block className="drawer-primary-action" disabled={!cases[0]} onClick={() => cases[0] && navigateWithContext(`/evaluations/${cases[0].evaluationId}`)}>
          查看首个阻塞用例的评价结果
        </Button>
      </Drawer>
      <Drawer
        title={gate ? `${gate} 失败用例` : readiness ? "未就绪用例" : "用例浏览器"}
        width={720}
        open={drawer === "cases"}
        onClose={close}
        extra={<ApiStatusTag compact meta={capabilityMeta("caseResults", { mocked: currentApiMode() !== "http", mode: currentApiMode(), watermark: data.snapshot.watermark, projectionLagMs: data.snapshot.projectionLagMs })} />}
      >
        <p className="drawer-intro">当前筛选：{activeFilter}。点击用例编号可进入结构化评价结果。</p>
        <Table<CaseResult> rowKey="caseId" loading={casesQuery.isLoading} columns={columns} dataSource={cases} pagination={false} />
      </Drawer>
      <Drawer
        title={`${trackName(track)} × ${metric} 指标详情`}
        width={720}
        open={drawer === "metric"}
        onClose={close}
        extra={<ApiStatusTag compact meta={capabilityMeta("evaluationMetrics", { mocked: currentApiMode() !== "http", mode: currentApiMode(), watermark: data.snapshot.watermark, projectionLagMs: data.snapshot.projectionLagMs })} />}
      >
        <p className="drawer-intro">该聚合来自当前 Snapshot；null 表示对应正式输入或投影尚不可用。</p>
        {metricRows.map((item) => (
          <SectionCard key={`${item.track}-${item.metric}`} title={`${trackName(item.track)} · ${item.metric}`}>
            <div className="metric-detail-row">
              <Progress type="circle" percent={item.score ?? undefined} size={92} />
              <dl><dt>正式评价次数</dt><dd>{item.formalCount}</dd><dt>诊断评价次数</dt><dd>{item.diagnosticCount}</dd><dt>较基准变化</dt><dd className={(item.delta ?? 0) < 0 ? "text-danger" : "text-positive"}>{item.delta == null ? "—" : signedDelta(item.delta)}</dd></dl>
            </div>
          </SectionCard>
        ))}
        <Button type="primary" onClick={() => navigateWithContext("/evaluations/eval-mcp17")}>查看 MCP-RESTART-017 的评价结果</Button>
      </Drawer>
      <Drawer
        title="质量得分构成与五个维度"
        width={720}
        open={drawer === "quality"}
        onClose={close}
      >
        <p className="drawer-intro">质量得分只聚合符合正式评价条件的用例；未就绪用例不进入分母。发布门槛采用独立判断。</p>
        <div className="quality-dimension-list">
          {["目标与状态", "规划能力", "决策与安全", "执行与证据", "闭环能力"].map((label, index) => <div key={label}><span>{label}</span><Progress percent={[88, 79, 72, 61, 66][index]} size="small" /></div>)}
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
  const contextQuery = useQuery({
    queryKey: ["context-options"],
    queryFn: ({ signal }) => consoleApi.getContextOptions({ signal }),
    enabled: currentApiMode() === "http",
    staleTime: 300_000,
  });

  const data = query.data?.data;
  const meta = query.data?.meta;
  const effectiveState = currentApiMode() === "http"
    ? query.isError ? "error" : data?.snapshot.dataStatus === "empty" ? "empty" : data?.snapshot.dataStatus === "stale" ? "stale" : data?.snapshot.dataStatus === "partial" ? "partial" : "loaded"
    : filters.dataState;

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
    const fallback = query.isError || filters.dataState === "error" ? "error" : "loading";
    return (
      <div className="overview-page">
        <div className="overview-loading-header"><h1>SDAR 基准质量指挥中心</h1></div>
        <DataStatePanel state={fallback} onRetry={() => { if (currentApiMode() === "http") void query.refetch(); else setFilters({ dataState: "loaded" }); }}><span /></DataStatePanel>
      </div>
    );
  }

  const scoreMeta = capabilityMeta("scoreDistribution", { mocked: meta.mocked, mode: meta.mode, availability: data.scoreDistribution ? "available" : "partial", reasonCodes: data.scoreDistribution ? [] : ["SCORE_DISTRIBUTION_UNAVAILABLE"], watermark: data.snapshot.watermark, projectionLagMs: data.snapshot.projectionLagMs, contracts: meta.contracts });
  const operationalMeta = capabilityMeta("operational", { mocked: meta.mocked, mode: meta.mode, availability: data.operationalSummary.length ? "available" : "partial", reasonCodes: data.operationalSummary.length ? [] : ["OPERATIONAL_SAMPLES_UNAVAILABLE"], watermark: data.snapshot.watermark, projectionLagMs: data.snapshot.projectionLagMs, contracts: meta.contracts });

  return (
    <div className="overview-page">
      <ContextBar data={data} options={contextQuery.data?.data} onRefresh={() => { void query.refetch(); void contextQuery.refetch(); }} />
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
          <SectionCard title="关键分析结论（前 4 项）" className="card-conclusions">
            <div className="dense-list conclusions-list">
              {data.analysisConclusions.slice(0, 4).map((item, index) => (
                <button key={item.id} onClick={() => handleConclusion(item)}>
                  <Tag color={priorityForConclusion(item, index) === "P0" ? "red" : priorityForConclusion(item, index) === "P1" ? "gold" : "green"}>{priorityForConclusion(item, index)}</Tag>
                  <span><b>{overviewText(item.title)}</b><small>{overviewText(item.summary)}</small></span>
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
                  <span>{overviewText(item.title)}</span>
                  <b>{localizedCompactValue(item.count ?? item.value ?? item.delta)}</b>
                </button>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="质量趋势（对比基准）" className="card-trend"><QualityTrendChart data={data.qualityTrend} onPoint={(label) => label === "current" && setFilters({ candidateId: data.context.candidate.id }, { clearLocal: true })} /></SectionCard>
          <SectionCard title="回归变化瀑布（得分变化）" className="card-waterfall">
            {data.regressionWaterfall ? <RegressionWaterfallChart data={data.regressionWaterfall} onBar={(change) => navigateWithContext("/compare/CMP-20260815-004", { changeType: change })} /> : <div className="unavailable-card"><DatabaseOutlined /><span>不可判定 · 暂无可比较的正式结果</span></div>}
          </SectionCard>
          <SectionCard title="分轨 × 风险等级热力图" className="card-track-risk"><TrackRiskHeatmap data={data.trackRiskMatrix} onCell={(track, risk) => setFilters({ track, risk })} /></SectionCard>
        </div>

        <div className="overview-grid overview-diagnosis">
          <SectionCard title="Canonical Evidence" className="card-source-canonical"><pre>{JSON.stringify(data.sourceAwareEvidenceFunnel?.canonical ?? {}, null, 2)}</pre></SectionCard>
          <SectionCard title="Domain Projection" className="card-source-domain"><pre>{JSON.stringify(data.sourceAwareEvidenceFunnel?.domain ?? {}, null, 2)}</pre></SectionCard>
          <SectionCard title="MCP Provider Telemetry" className="card-source-provider"><pre>{JSON.stringify(data.sourceAwareEvidenceFunnel?.provider ?? {}, null, 2)}</pre></SectionCard>
          <SectionCard title="Telemetry Trust" className="card-telemetry-trust">
            {data.telemetryTrust ? <div className="system-list"><div><span>状态</span><b>{data.telemetryTrust.status}</b></div><div><span>水位</span><b>{data.telemetryTrust.watermark ?? "—"}</b></div><div><span>原因码</span><b>{data.telemetryTrust.reasonCodes.join("、") || "—"}</b></div></div> : <div className="unavailable-card"><DatabaseOutlined /><span>UNAVAILABLE · telemetryTrust 未返回</span></div>}
          </SectionCard>
          <SectionCard title="指标 M1–M15 热力图" className="card-metric"><MetricHeatmap data={data.metricHeatmap} onCell={(metric, track) => {
            setQueryParams({ drawer: "metric", metric, metricTrack: track });
          }} /></SectionCard>
          <SectionCard title="证据就绪漏斗" className="card-funnel"><EvidenceFunnelChart data={data.evidenceReadinessFunnel} /></SectionCard>
          <SectionCard title="质量 × 稳定性散点图" className="card-stability"><QualityStabilityChart data={data.qualityStabilityPoints} onPoint={(caseId) => navigateWithContext("/cases", { search: caseId })} /></SectionCard>
          <SectionCard title="回归贡献分析" className="card-contributors"><ContributorsChart data={data.regressionContributors} onSlice={(contributor) => navigateWithContext("/compare/CMP-20260815-004", { contributor })} /></SectionCard>
        </div>

        <div className="overview-grid overview-operations">
          <SectionCard title="最近异常 / 事件时间线" className="card-anomalies">
            <div className="event-list">{data.anomalyTimeline.slice(0, 5).map((item) => <button key={`${item.at}-${item.title}`} onClick={() => item.target.type === "case" ? navigateWithContext("/cases", { search: item.target.id }) : item.target.type === "evaluation" ? navigateWithContext(`/evaluations/${item.target.id}`) : navigateWithContext("/settings")}><time>{item.at.slice(11, 16)}</time><i className={`event-${item.severity}`} /><span>{overviewText(item.title)}</span><Tag color={item.severity === "critical" ? "red" : "gold"}>{item.severity === "critical" ? "P0" : "P1"}</Tag></button>)}</div>
          </SectionCard>
          <SectionCard title="运行指标摘要（不影响质量得分）" extra={<ApiStatusTag compact meta={operationalMeta} />} className="card-operational">
            <div className="operational-table"><div>指标</div><div>当前值</div><div>基准值</div><div>变化</div>{data.operationalSummary.slice(0, 5).flatMap((item) => [<div key={`${item.metric}-a`}>{metricName(item.metric)}</div>, <div key={`${item.metric}-b`}>{metricValue(item.current, item.unit)}</div>, <div key={`${item.metric}-c`}>{metricValue(item.baseline, item.unit)}</div>, <div key={`${item.metric}-d`} className={(item.changePercent ?? 0) > 0 ? "delta-negative" : "delta-positive"}>{signedDelta(item.changePercent, "%")}</div>])}</div>
            <small className="operational-note">* 运行指标仅用于诊断，不计入质量得分</small>
          </SectionCard>
          <SectionCard title="得分分布" extra={<ApiStatusTag compact meta={scoreMeta} />} className="card-score-distribution">{data.scoreDistribution ? <ScoreDistributionChart data={data.scoreDistribution} /> : <div className="unavailable-card"><DatabaseOutlined /><span>数据待就绪 · 正式算法或数据不可用</span></div>}</SectionCard>
          <SectionCard title="系统状态" className="card-system"><div className="system-list">{data.systemStatus.slice(0, 8).map((item) => <div key={item.component}><i className={item.status === "healthy" ? "status-dot-good" : "status-dot-warn"} /><span>{systemComponentName(item.component)}</span><b className={item.status === "healthy" ? "text-positive" : "text-warning"}>{item.detail ? localizedCompactValue(item.detail) : statusName(item.status)}</b></div>)}</div></SectionCard>
          <SectionCard title="最近评测运行" className="card-recent-runs"><div className="recent-run-list">{data.recentRuns.slice(0, 4).map((run) => <button key={run.runId} onClick={() => navigateWithContext(`/runs/${run.runId}`)}><span>{run.runId.replace("R-202608", "…")}</span><span>{run.candidate}</span><b>{statusName(run.status)}</b></button>)}</div></SectionCard>
        </div>
      </DataStatePanel>
      <OverviewDrawers data={data} />
      <div className="overview-source-status"><ApiStatusTag compact meta={meta} /></div>
    </div>
  );
}

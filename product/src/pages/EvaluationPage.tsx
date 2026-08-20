import { useQuery } from "@tanstack/react-query";
import { Button, Descriptions, Progress, Table, Tag, Timeline } from "antd";
import { ArrowRightOutlined, CheckCircleFilled, CloseCircleFilled, LinkOutlined, WarningFilled } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { consoleApi } from "../api/consoleApi";
import { capabilityMeta } from "../api/capability-map";
import { ApiStatusTag, PageHeader, SectionCard } from "../components/common";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import type { EvaluationDetail } from "../types";
import { dimensionName, displayValue, evidenceLevelName, readinessName, scoreStatusName, severityName, sourceName, verdictName } from "../utils/format";

const metricGroups = [
  { label: "目标与状态", ids: ["M1", "M2", "M3", "M4"] },
  { label: "规划能力", ids: ["M5", "M6", "M7"] },
  { label: "决策与安全", ids: ["M8", "M9", "M10"] },
  { label: "执行与证据", ids: ["M11", "M12", "M13"] },
  { label: "闭环能力", ids: ["M14", "M15"] },
];

function gateTag(result: string) {
  if (result === "pass") return <Tag color="green" icon={<CheckCircleFilled />}>通过</Tag>;
  if (result === "fail") return <Tag color="red" icon={<CloseCircleFilled />}>失败</Tag>;
  return <Tag color="gold" icon={<WarningFilled />}>证据不足</Tag>;
}

export function EvaluationPage() {
  const { evaluationId = "eval-mcp17" } = useParams();
  const { navigateWithContext } = useAnalysisContext();
  const query = useQuery({ queryKey: ["evaluation", evaluationId], queryFn: () => consoleApi.getEvaluation(evaluationId) });
  if (!query.data) return <div className="standard-page"><SectionCard><div className="page-loading">正在加载结构化评价结果…</div></SectionCard></div>;
  const data = query.data.data;
  const metricMeta = capabilityMeta("evaluationMetrics", { mocked: true, watermark: query.data.meta.watermark, projectionLagMs: query.data.meta.projectionLagMs });
  const evidenceMeta = capabilityMeta("evidenceDiff", { mocked: true, watermark: query.data.meta.watermark, projectionLagMs: query.data.meta.projectionLagMs });
  const metricColumns = [
    { title: "指标", dataIndex: "id", key: "id" },
    { title: "原始得分", dataIndex: "raw", key: "raw", render: (value: number | null) => <Tag color={value === 0 ? "red" : value === 1 ? "gold" : "green"}>{displayValue(value)}/2</Tag> },
    { title: "权重", dataIndex: "weight", key: "weight" },
    { title: "证据等级", dataIndex: "evidenceLevel", key: "evidenceLevel", render: (value: string) => <Tag color="blue">{evidenceLevelName(value)}</Tag> },
    { title: "结果属性", dataIndex: "status", key: "status", render: (value: string) => <Tag color={value === "formal" ? "green" : "purple"}>{scoreStatusName(value)}</Tag> },
    { title: "评价摘要", dataIndex: "summary", key: "summary" },
  ];

  return (
    <div className="standard-page evaluation-page">
      <PageHeader
        title={`评价结果 ${data.evaluationId}`}
        subtitle={`${data.caseId} · ${sourceName(data.origin)} · ${data.profile} · 执行过程 ${data.episodeId}`}
        meta={query.data.meta}
        actions={<Button type="primary" icon={<LinkOutlined />} onClick={() => navigateWithContext(`/evidence-bundles/${data.bundleId}`)}>打开证据包</Button>}
      />
      <div className="evaluation-hero">
        <SectionCard className={`evaluation-verdict verdict-${data.level.toLowerCase()}`}><span>评价结论</span><strong>{verdictName(data.level)}</strong><small>{data.passed ? "已通过" : "已阻塞"}</small></SectionCard>
        <SectionCard className="evaluation-score"><span>质量得分</span><strong>{displayValue(data.qualityScore)}</strong><Tag color={data.scoreStatus === "formal" ? "green" : "purple"}>{scoreStatusName(data.scoreStatus)}</Tag></SectionCard>
        <SectionCard className="evaluation-summary-card">
          <Descriptions size="small" column={4} items={[
            { key: "origin", label: "评价来源", children: sourceName(data.origin) },
            { key: "source", label: "来源证据就绪度", children: <Tag color="green">{readinessName(data.readiness.source)}</Tag> },
            { key: "evaluation", label: "评价就绪度", children: <Tag color="green">{readinessName(data.readiness.evaluation)}</Tag> },
            { key: "bundle", label: "证据包", children: <button className="link-button" onClick={() => navigateWithContext(`/evidence-bundles/${data.bundleId}`)}>{data.bundleId}</button> },
            { key: "profile", label: "评价配置 / 规则", children: data.profile },
            { key: "missing", label: "缺失项", children: data.readiness.missing.length ? data.readiness.missing.join("、") : "无" },
            { key: "conflicts", label: "冲突项", children: data.readiness.conflicts.length ? data.readiness.conflicts.join("、") : "无" },
            { key: "level", label: "评分状态", children: scoreStatusName(data.scoreStatus) },
          ]} />
        </SectionCard>
      </div>
      <div className="evaluation-grid">
        <SectionCard title="就绪状态" className="evaluation-span-4">
          <Timeline items={[
            { color: "green", children: <><b>来源证据完整</b><p>证据清单已封存，证据包完整</p></> },
            { color: "green", children: <><b>评价已就绪</b><p>评价开始时没有缺失或冲突的证据族</p></> },
            { color: "blue", children: <><b>结构化结果已投影</b><p>当前视图具有明确的数据水位</p></> },
          ]} />
        </SectionCard>
        <SectionCard title="致命规则 F1–F7" className="evaluation-span-4">
          <div className="fatal-grid">{data.fatals.map((item) => <div key={item.id}><b>{item.id}</b><Tag color={item.matched ? "red" : "green"}>{item.matched ? "已命中" : "未命中"}</Tag><span>{evidenceLevelName(item.evidenceLevel)}</span></div>)}</div>
        </SectionCard>
        <SectionCard title="硬门槛 HG1–HG7" className="evaluation-span-4">
          <div className="gate-list">{data.gates.map((item) => <button key={item.id} className={item.result === "fail" ? "gate-failed" : ""} onClick={() => item.id === "HG4" ? navigateWithContext(`/evidence-bundles/${data.bundleId}`, { tab: "diff", focus: "receipt-R1" }) : undefined}><b>{item.id}</b><span>{item.reason ?? "必需条件已满足"}</span>{gateTag(item.result)}{item.id === "HG4" && <ArrowRightOutlined />}</button>)}</div>
        </SectionCard>
        <SectionCard title="M1–M15 指标结果" extra={<ApiStatusTag compact meta={metricMeta} />} className="evaluation-span-12 table-card">
          <div className="metric-group-strip">{metricGroups.map((group) => <div key={group.label}><b>{group.label}</b><span>{group.ids.join(" · ")}</span></div>)}</div>
          <Table<EvaluationDetail["metrics"][number]> rowKey="id" columns={metricColumns} dataSource={data.metrics} pagination={false} size="small" rowClassName={(row) => row.raw === 0 ? "critical-table-row" : ""} />
        </SectionCard>
        <SectionCard title="五维能力" className="evaluation-span-6">
          <div className="dimension-progress-list">{data.dimensions.map((item) => <div key={item.id}><span>{item.id} · {dimensionName(item.label)}</span><Progress percent={item.score} strokeColor={item.score < 50 ? "#ef4444" : item.score < 75 ? "#f5b942" : "#28c76f"} /></div>)}</div>
        </SectionCard>
        <SectionCard title="已验证发现" extra={<ApiStatusTag compact meta={evidenceMeta} />} className="evaluation-span-6">
          <div className="finding-list">{data.findings.map((item) => <article key={item.title}><Tag color="red">{severityName(item.severity)}风险</Tag><div><h3>{item.title}</h3><p>{item.summary}</p><small>证据引用：{item.evidenceRefs.join("、")}</small><b>建议：{item.recommendedAction}</b></div><Button type="link" onClick={() => navigateWithContext(`/evidence-bundles/${data.bundleId}`, { tab: "diff" })}>查看证据差异 <ArrowRightOutlined /></Button></article>)}</div>
        </SectionCard>
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Button, Descriptions, Progress, Table, Tag } from "antd";
import { ArrowRightOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { consoleApi } from "../api/consoleApi";
import { capabilityMeta } from "../api/capability-map";
import { ApiStatusTag, PageHeader, SectionCard } from "../components/common";
import { SummaryBars } from "../components/charts";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import type { CaseResult } from "../types";
import { dimensionName, displayValue, failureTypeName, releaseStatusName, riskName, statusName, trackName, verdictName } from "../utils/format";

export function RunDetailPage() {
  const { runId = "R-20260815-004" } = useParams();
  const { navigateWithContext } = useAnalysisContext();
  const query = useQuery({ queryKey: ["run", runId], queryFn: () => consoleApi.getRun(runId) });
  if (!query.data) return <div className="standard-page"><SectionCard><div className="page-loading">正在加载评测运行看板…</div></SectionCard></div>;
  const { data, meta } = query.data;
  const run = data.run;
  const caseMeta = capabilityMeta("runCases", { mocked: true, watermark: data.snapshot.watermark, projectionLagMs: data.snapshot.projectionLagMs });
  const columns = [
    { title: "用例编号", dataIndex: "caseId", key: "caseId", render: (value: string, row: CaseResult) => <button className="link-button" onClick={() => navigateWithContext(`/cases/${row.caseId}`)}>{value}</button> },
    { title: "分轨", dataIndex: "track", key: "track", render: (value: string) => trackName(value) },
    { title: "风险", dataIndex: "risk", key: "risk", render: (value: string) => <Tag color={value === "critical" ? "red" : value === "high" ? "orange" : "blue"}>{riskName(value)}</Tag> },
    { title: "重复次数", dataIndex: "repetitions", key: "repetitions" },
    { title: "结论", dataIndex: "verdict", key: "verdict", render: (value: string) => <Tag color={value === "HG" ? "red" : value === "A" ? "green" : "gold"}>{verdictName(value)}</Tag> },
    { title: "平均得分", dataIndex: "score", key: "score", render: (value: number | null) => displayValue(value) },
    { title: "稳定性", dataIndex: "stability", key: "stability", render: (value: number | null) => value == null ? "—" : <Progress percent={value} size="small" strokeColor={value < 70 ? "#ef4444" : "#28c76f"} /> },
    { title: "较基准变化", dataIndex: "baselineDelta", key: "baselineDelta", render: (value: number | null) => <span className={(value ?? 0) < 0 ? "text-danger" : "text-positive"}>{displayValue(value)}</span> },
    { title: "失败类型", dataIndex: "failureType", key: "failureType", render: (value: string) => failureTypeName(value) },
    { title: "评价结果", key: "evaluation", render: (_: unknown, row: CaseResult) => <Button type="link" onClick={() => navigateWithContext(`/evaluations/${row.evaluationId}`)}>打开 <ArrowRightOutlined /></Button> },
  ];

  return (
    <div className="standard-page run-detail-page">
      <PageHeader
        title={`评测运行 ${run.runId}`}
        subtitle={`${run.candidate} · ${run.dataset} · ${run.profile} · 数据快照 ${data.snapshot.snapshotId}`}
        meta={meta}
        actions={<Button type="primary" onClick={() => navigateWithContext("/compare/CMP-20260815-004")}>与基准版本比较</Button>}
      />
      <div className="run-summary-grid">
        <SectionCard className={`run-gate-card gate-${run.releaseGate}`}>
          <SafetyCertificateOutlined />
          <div><span>发布门槛</span><strong>{releaseStatusName(run.releaseGate)}</strong><small>{run.hg} 个硬门槛失败 · {run.nr} 个未就绪</small></div>
        </SectionCard>
        {[
          ["质量得分", run.qualityScore], ["通过率", `${run.passRate}%`], ["致命问题", run.fatal], ["必需硬门槛失败", run.hg], ["未就绪", run.nr], ["用例覆盖", `${run.completed}/${run.cases}`],
        ].map(([label, value]) => <SectionCard key={String(label)} className="run-stat-card"><span>{label}</span><strong>{displayValue(value)}</strong></SectionCard>)}
      </div>
      <div className="detail-grid">
        <SectionCard title="运行权威信息与上下文" className="detail-span-4">
          <Descriptions column={2} size="small" items={[
            { key: "status", label: "权威状态", children: <Tag color="green">{statusName(run.status)}</Tag> },
            { key: "dataset", label: "数据集", children: run.dataset },
            { key: "profile", label: "评价配置", children: run.profile },
            { key: "watermark", label: "数据水位", children: data.snapshot.watermark },
            { key: "lag", label: "投影延迟", children: `${(data.snapshot.projectionLagMs / 1000).toFixed(1)} 秒` },
            { key: "source", label: "数据来源", children: "PostgreSQL 权威数据 + ClickHouse 数据投影" },
          ]} />
        </SectionCard>
        <SectionCard title="分轨摘要" className="detail-span-4"><SummaryBars data={data.trackSummary.map((item) => ({ ...item, label: trackName(item.label) }))} /></SectionCard>
        <SectionCard title="风险摘要" className="detail-span-4"><SummaryBars data={data.riskSummary.map((item) => ({ ...item, label: riskName(item.label.toLowerCase()) }))} /></SectionCard>
        <SectionCard title="五维摘要" className="detail-span-4"><SummaryBars data={data.dimensions.map((item) => ({ label: dimensionName(item.label), value: item.score }))} /></SectionCard>
        <SectionCard title="重复执行稳定性" className="detail-span-4"><div className="stability-summary"><Progress type="dashboard" percent={80} strokeColor="#3b82f6" /><div><b>5 组中有 4 组稳定</b><span>MCP 重启恢复 33%</span><span>技能区域巡检 67%</span></div></div></SectionCard>
        <SectionCard title="证据就绪度" className="detail-span-4"><div className="mini-funnel-list">{[["测试用例",80],["执行过程",80],["证据清单",79],["证据包",76],["评价已就绪",72],["正式评价",68]].map(([label,value]) => <div key={String(label)}><span>{label}</span><Progress percent={Number(value)/80*100} size="small" format={() => String(value)} /></div>)}</div></SectionCard>
        <SectionCard title="用例矩阵" extra={<ApiStatusTag compact meta={caseMeta} />} className="detail-span-12 table-card">
          <Table<CaseResult> rowKey="caseId" columns={columns} dataSource={data.cases} pagination={false} scroll={{ x: 1200 }} />
        </SectionCard>
      </div>
    </div>
  );
}

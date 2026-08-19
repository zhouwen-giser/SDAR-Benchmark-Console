import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Descriptions, Table, Tag, Timeline } from "antd";
import { ArrowRightOutlined, FileTextOutlined, LinkOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { consoleApi } from "../api/consoleApi";
import { PageHeader, SectionCard } from "../components/common";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import type { CaseExecution } from "../types";
import { displayValue } from "../utils/format";

function ContractList({ items }: { items: string[] }) {
  return <ol className="contract-list">{items.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></li>)}</ol>;
}

export function CaseDetailPage() {
  const { caseId = "MCP-RESTART-017" } = useParams();
  const { navigateWithContext } = useAnalysisContext();
  const query = useQuery({ queryKey: ["case-detail", caseId], queryFn: () => consoleApi.getCase(caseId) });

  if (!query.data) {
    return <div className="standard-page"><SectionCard><div className="page-loading">正在加载 Case Contract…</div></SectionCard></div>;
  }

  const { data, meta } = query.data;
  const columns = [
    { title: "Rep", dataIndex: "repetition", key: "repetition", width: 64 },
    { title: "Episode", dataIndex: "episodeId", key: "episodeId", width: 190 },
    { title: "Status", dataIndex: "status", key: "status", width: 100, render: (value: string) => <Tag color={value === "completed" ? "green" : value === "failed" ? "red" : "gold"}>{value}</Tag> },
    { title: "Verdict", dataIndex: "verdict", key: "verdict", width: 86, render: (value: string) => <Tag color={value === "HG" ? "red" : value === "A" ? "green" : "gold"}>{value}</Tag> },
    { title: "Score", dataIndex: "score", key: "score", width: 78, render: (value: number | null) => displayValue(value) },
    { title: "Duration", dataIndex: "durationMs", key: "durationMs", width: 110, render: (value: number | null) => value == null ? "—" : `${(value / 1000).toFixed(1)}s` },
    { title: "Evaluation", dataIndex: "evaluationId", key: "evaluationId", render: (value: string | undefined) => value ? <button className="link-button" onClick={() => navigateWithContext(`/evaluations/${value}`)}>{value}</button> : "—" },
    { title: "Evidence", dataIndex: "bundleId", key: "bundleId", render: (value: string | undefined) => value ? <Button type="link" icon={<LinkOutlined />} onClick={() => navigateWithContext(`/evidence-bundles/${value}`)}>Bundle</Button> : "—" },
  ];

  return (
    <div className="standard-page case-detail-page">
      <PageHeader
        title={`Case ${data.caseId}`}
        subtitle={`${data.track.toUpperCase()} · ${data.risk.toUpperCase()} · Dataset Case Contract rev ${data.sourceRevision}`}
        meta={meta}
        actions={<><Button onClick={() => navigateWithContext("/cases")}>返回 Case Explorer</Button><Button type="primary" icon={<ArrowRightOutlined />} onClick={() => navigateWithContext(`/evaluations/${data.executions[0]?.evaluationId ?? "eval-mcp17"}`)}>查看 Evaluation</Button></>}
      />

      <Alert type="info" showIcon message="只读版本化 Case Contract" description="此页面用于审阅输入、预期结果、证据要求与执行绑定；不在 Benchmark Console 中提供在线编辑。" />

      <div className="case-identity-grid">
        <SectionCard className="case-identity-card">
          <FileTextOutlined />
          <div><span>CASE STATUS</span><strong>{data.status.toUpperCase()}</strong><small>{data.owner}</small></div>
        </SectionCard>
        <SectionCard className="case-summary-card">
          <h2>{data.title}</h2>
          <p>{data.description}</p>
          <div>{data.tags.map((tag) => <Tag color={tag === "release-blocker" ? "red" : "blue"} key={tag}>{tag}</Tag>)}</div>
        </SectionCard>
        <SectionCard className="case-key-card"><span>TRACK</span><strong>{data.track.toUpperCase()}</strong><small>evaluation taxonomy</small></SectionCard>
        <SectionCard className="case-key-card"><span>RISK</span><strong className={data.risk === "critical" ? "text-danger" : ""}>{data.risk.toUpperCase()}</strong><small>release impact</small></SectionCard>
      </div>

      <div className="workspace-grid">
        <SectionCard title="Preconditions" className="workspace-span-4"><ContractList items={data.preconditions} /></SectionCard>
        <SectionCard title="Actions" className="workspace-span-4"><ContractList items={data.actions} /></SectionCard>
        <SectionCard title="Expected Outcomes" className="workspace-span-4"><ContractList items={data.expectedOutcomes} /></SectionCard>

        <SectionCard title="Evaluation & Evidence Contract" className="workspace-span-5">
          <Descriptions column={1} bordered size="small" items={[
            { key: "gates", label: "Required Gates", children: data.requiredGates.length ? data.requiredGates.map((item) => <Tag color="red" key={item}>{item}</Tag>) : "None" },
            { key: "evidence", label: "Required Evidence", children: data.requiredEvidenceFamilies.map((item) => <Tag color="blue" key={item}>{item}</Tag>) },
            { key: "reps", label: "Repetition Policy", children: `${data.executions.length} deterministic repetitions` },
            { key: "formal", label: "Formalization", children: "All required families resolved before scoring" },
          ]} />
        </SectionCard>
        <SectionCard title="Revision History" className="workspace-span-7">
          <Timeline items={data.history.map((item) => ({ color: "#3b82f6", label: item.at.slice(0, 10), children: <div><b>rev {item.revision} · {item.summary}</b><p>{item.author}</p></div> }))} />
        </SectionCard>
        <SectionCard title="Bound Executions" className="workspace-span-12 table-card">
          <Table<CaseExecution> rowKey="repetition" columns={columns} dataSource={data.executions} pagination={false} scroll={{ x: 980 }} />
        </SectionCard>
      </div>
    </div>
  );
}

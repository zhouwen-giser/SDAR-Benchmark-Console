import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Descriptions, Table, Tag, Timeline } from "antd";
import { ArrowRightOutlined, FileTextOutlined, LinkOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { consoleApi } from "../api/consoleApi";
import { PageHeader, SectionCard } from "../components/common";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import type { CaseExecution } from "../types";
import { actorName, evidenceFamilyName, riskName, statusName, trackName, verdictName, displayValue } from "../utils/format";

function ContractList({ items }: { items: string[] }) {
  return <ol className="contract-list">{items.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></li>)}</ol>;
}

export function CaseDetailPage() {
  const { caseId = "MCP-RESTART-017" } = useParams();
  const { navigateWithContext } = useAnalysisContext();
  const query = useQuery({ queryKey: ["case-detail", caseId], queryFn: () => consoleApi.getCase(caseId) });

  if (!query.data) {
    return <div className="standard-page"><SectionCard><div className="page-loading">正在加载用例合同…</div></SectionCard></div>;
  }

  const { data, meta } = query.data;
  const columns = [
    { title: "重复序号", dataIndex: "repetition", key: "repetition", width: 88 },
    { title: "执行过程编号", dataIndex: "episodeId", key: "episodeId", width: 190 },
    { title: "状态", dataIndex: "status", key: "status", width: 100, render: (value: string) => <Tag color={value === "completed" ? "green" : value === "failed" ? "red" : "gold"}>{statusName(value)}</Tag> },
    { title: "结论", dataIndex: "verdict", key: "verdict", width: 150, render: (value: string) => <Tag color={value === "HG" ? "red" : value === "A" ? "green" : "gold"}>{verdictName(value)}</Tag> },
    { title: "得分", dataIndex: "score", key: "score", width: 78, render: (value: number | null) => displayValue(value) },
    { title: "耗时", dataIndex: "durationMs", key: "durationMs", width: 110, render: (value: number | null) => value == null ? "—" : `${(value / 1000).toFixed(1)} 秒` },
    { title: "评价结果", dataIndex: "evaluationId", key: "evaluationId", render: (value: string | undefined) => value ? <button className="link-button" onClick={() => navigateWithContext(`/evaluations/${value}`)}>{value}</button> : "—" },
    { title: "证据记录", dataIndex: "bundleId", key: "bundleId", render: (value: string | undefined) => value ? <Button type="link" icon={<LinkOutlined />} onClick={() => navigateWithContext(`/evidence-bundles/${value}`)}>查看证据包</Button> : "—" },
  ];

  return (
    <div className="standard-page case-detail-page">
      <PageHeader
        title={`测试用例 ${data.caseId}`}
        subtitle={`${trackName(data.track)}分轨 · ${riskName(data.risk)}风险 · 数据集用例合同第 ${data.sourceRevision} 版`}
        meta={meta}
        actions={<><Button onClick={() => navigateWithContext("/cases")}>返回用例浏览器</Button><Button type="primary" icon={<ArrowRightOutlined />} onClick={() => navigateWithContext(`/evaluations/${data.executions[0]?.evaluationId ?? "eval-mcp17"}`)}>查看评价结果</Button></>}
      />

      <Alert type="info" showIcon message="只读版本化用例合同" description="此页面用于审阅输入、预期结果、证据要求与执行绑定；基准质量控制台不提供在线编辑。" />

      <div className="case-identity-grid">
        <SectionCard className="case-identity-card">
          <FileTextOutlined />
          <div><span>用例状态</span><strong>{statusName(data.status)}</strong><small>{actorName(data.owner)}</small></div>
        </SectionCard>
        <SectionCard className="case-summary-card">
          <h2>{data.title}</h2>
          <p>{data.description}</p>
          <div>{data.tags.map((tag) => <Tag color={tag === "release-blocker" ? "red" : "blue"} key={tag}>{tag}</Tag>)}</div>
        </SectionCard>
        <SectionCard className="case-key-card"><span>所属分轨</span><strong>{trackName(data.track)}</strong><small>评价分类体系</small></SectionCard>
        <SectionCard className="case-key-card"><span>风险等级</span><strong className={data.risk === "critical" ? "text-danger" : ""}>{riskName(data.risk)}</strong><small>发布影响级别</small></SectionCard>
      </div>

      <div className="workspace-grid">
        <SectionCard title="前置条件" className="workspace-span-4"><ContractList items={data.preconditions} /></SectionCard>
        <SectionCard title="执行动作" className="workspace-span-4"><ContractList items={data.actions} /></SectionCard>
        <SectionCard title="预期结果" className="workspace-span-4"><ContractList items={data.expectedOutcomes} /></SectionCard>

        <SectionCard title="评价与证据合同" className="workspace-span-5">
          <Descriptions column={1} bordered size="small" items={[
            { key: "gates", label: "必需硬门槛", children: data.requiredGates.length ? data.requiredGates.map((item) => <Tag color="red" key={item}>{item}</Tag>) : "无" },
            { key: "evidence", label: "必需证据", children: data.requiredEvidenceFamilies.map((item) => <Tag color="blue" key={item}>{evidenceFamilyName(item)}</Tag>) },
            { key: "reps", label: "重复执行策略", children: `${data.executions.length} 次确定性重复执行` },
            { key: "formal", label: "正式化条件", children: "所有必需证据族解析完成后才能评分" },
          ]} />
        </SectionCard>
        <SectionCard title="修订历史" className="workspace-span-7">
          <Timeline items={data.history.map((item) => ({ color: "#3b82f6", label: item.at.slice(0, 10), children: <div><b>第 {item.revision} 版 · {item.summary}</b><p>{actorName(item.author)}</p></div> }))} />
        </SectionCard>
        <SectionCard title="绑定执行记录" className="workspace-span-12 table-card">
          <Table<CaseExecution> rowKey="repetition" columns={columns} dataSource={data.executions} pagination={false} scroll={{ x: 980 }} />
        </SectionCard>
      </div>
    </div>
  );
}

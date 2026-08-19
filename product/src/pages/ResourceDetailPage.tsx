import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Descriptions, Tag, Timeline } from "antd";
import { ArrowRightOutlined, DatabaseOutlined, FileTextOutlined, LinkOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { consoleApi } from "../api/consoleApi";
import { PageHeader, SectionCard } from "../components/common";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import type { ResourceKind } from "../types";

const kindMeta: Record<ResourceKind, { title: string; noun: string; icon: typeof DatabaseOutlined }> = {
  candidate: { title: "Candidate Detail", noun: "Candidate", icon: SafetyCertificateOutlined },
  baseline: { title: "Baseline Detail", noun: "Baseline", icon: SafetyCertificateOutlined },
  dataset: { title: "Dataset Detail", noun: "Dataset", icon: DatabaseOutlined },
  profile: { title: "Evaluation Profile Detail", noun: "Profile", icon: FileTextOutlined },
};

export function ResourceDetailPage({ kind }: { kind: ResourceKind }) {
  const params = useParams();
  const id = params.candidateId ?? params.baselineId ?? params.datasetVersion ?? params.profileVersionId ?? "unknown";
  const { navigateWithContext } = useAnalysisContext();
  const query = useQuery({ queryKey: ["resource", kind, id], queryFn: () => consoleApi.getResource(kind, id) });

  if (!query.data) return <div className="standard-page"><SectionCard><div className="page-loading">正在加载 {kindMeta[kind].noun}…</div></SectionCard></div>;
  const { data, meta } = query.data;
  const Icon = kindMeta[kind].icon;
  const blocked = data.status.includes("blocked") || data.status.includes("draft");

  return (
    <div className="standard-page resource-detail-page">
      <PageHeader title={kindMeta[kind].title} subtitle={`${data.id} · read-only registry projection`} meta={meta} actions={<Button onClick={() => navigateWithContext("/overview")}>返回 Overview</Button>} />
      <div className="resource-hero">
        <SectionCard className={`resource-icon-card ${blocked ? "resource-blocked" : ""}`}><Icon /><span>{kindMeta[kind].noun.toUpperCase()}</span><Tag color={blocked ? "gold" : "green"}>{data.status}</Tag></SectionCard>
        <SectionCard className="resource-title-card"><h2>{data.title}</h2><p>{data.description}</p><small>资源详情保持只读，管理与发布动作属于外部 Registry / CI 流程。</small></SectionCard>
      </div>
      {blocked && <Alert type="warning" showIcon message={data.status === "release-blocked" ? "Candidate 当前未满足发布条件" : "该资源仍处于 Draft 状态"} description={data.status === "release-blocked" ? "请沿关联 Run、Comparison 与阻塞 Case 查看证据链。" : "控制台不会把 Draft Ruleset 描述为正式算法。"} />}
      <div className="workspace-grid">
        <SectionCard title="Identity & Contract" className="workspace-span-7">
          <Descriptions column={2} bordered size="small" items={[
            { key: "id", label: `${kindMeta[kind].noun} ID`, children: data.id },
            { key: "status", label: "Status", children: <Tag color={blocked ? "gold" : "green"}>{data.status}</Tag> },
            ...data.properties.map((item, index) => ({ key: `property-${index}`, label: item.label, children: item.value })),
          ]} />
        </SectionCard>
        <SectionCard title="Related Resources" className="workspace-span-5">
          <div className="resource-relation-list">{data.relations.map((item) => <button key={`${item.label}-${item.id}`} onClick={() => navigateWithContext(item.path)}><LinkOutlined /><span><small>{item.label}</small><b>{item.id}</b></span><ArrowRightOutlined /></button>)}</div>
        </SectionCard>
        <SectionCard title="Registry History" className="workspace-span-12">
          <Timeline items={data.history.map((item) => ({ color: "#3b82f6", label: item.at.replace("T", " ").slice(0, 16), children: <div><b>{item.event}</b><p>{item.actor}</p></div> }))} />
        </SectionCard>
      </div>
    </div>
  );
}

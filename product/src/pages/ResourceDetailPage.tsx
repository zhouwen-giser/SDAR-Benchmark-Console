import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Descriptions, Tag, Timeline } from "antd";
import { ArrowRightOutlined, DatabaseOutlined, FileTextOutlined, LinkOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { consoleApi } from "../api/consoleApi";
import { PageHeader, SectionCard } from "../components/common";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import type { ResourceKind } from "../types";
import { actorName, resourceStatusName } from "../utils/format";

const kindMeta: Record<ResourceKind, { title: string; noun: string; icon: typeof DatabaseOutlined }> = {
  candidate: { title: "候选版本详情", noun: "候选版本", icon: SafetyCertificateOutlined },
  baseline: { title: "基准版本详情", noun: "基准版本", icon: SafetyCertificateOutlined },
  dataset: { title: "数据集详情", noun: "数据集", icon: DatabaseOutlined },
  profile: { title: "评价配置详情", noun: "评价配置", icon: FileTextOutlined },
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
      <PageHeader title={kindMeta[kind].title} subtitle={`${data.id} · 只读注册表投影视图`} meta={meta} actions={<Button onClick={() => navigateWithContext("/overview")}>返回总览</Button>} />
      <div className="resource-hero">
        <SectionCard className={`resource-icon-card ${blocked ? "resource-blocked" : ""}`}><Icon /><span>{kindMeta[kind].noun}</span><Tag color={blocked ? "gold" : "green"}>{resourceStatusName(data.status)}</Tag></SectionCard>
        <SectionCard className="resource-title-card"><h2>{data.title}</h2><p>{data.description}</p><small>资源详情保持只读，管理与发布动作属于外部注册表和持续集成流程。</small></SectionCard>
      </div>
      {blocked && <Alert type="warning" showIcon message={data.status === "release-blocked" ? "候选版本当前未满足发布条件" : "该资源仍处于草稿状态"} description={data.status === "release-blocked" ? "请沿关联评测运行、版本比较与阻塞用例查看证据链。" : "控制台不会把草稿规则集描述为正式算法。"} />}
      <div className="workspace-grid">
        <SectionCard title="身份信息与合同" className="workspace-span-7">
          <Descriptions column={2} bordered size="small" items={[
            { key: "id", label: `${kindMeta[kind].noun}编号`, children: data.id },
            { key: "status", label: "状态", children: <Tag color={blocked ? "gold" : "green"}>{resourceStatusName(data.status)}</Tag> },
            ...data.properties.map((item, index) => ({ key: `property-${index}`, label: item.label, children: item.value })),
          ]} />
        </SectionCard>
        <SectionCard title="关联资源" className="workspace-span-5">
          <div className="resource-relation-list">{data.relations.map((item) => <button key={`${item.label}-${item.id}`} onClick={() => navigateWithContext(item.path)}><LinkOutlined /><span><small>{item.label}</small><b>{item.id}</b></span><ArrowRightOutlined /></button>)}</div>
        </SectionCard>
        <SectionCard title="注册历史" className="workspace-span-12">
          <Timeline items={data.history.map((item) => ({ color: "#3b82f6", label: item.at.replace("T", " ").slice(0, 16), children: <div><b>{item.event}</b><p>{actorName(item.actor)}</p></div> }))} />
        </SectionCard>
      </div>
    </div>
  );
}

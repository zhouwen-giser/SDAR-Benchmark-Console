import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Descriptions, Empty, Modal, Tabs, Tag, message } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { consoleApi } from "../api/consoleApi";
import { ApiStatusTag, PageHeader, SectionCard } from "../components/common";
import { useAnalysisContext } from "../hooks/useAnalysisContext";

export function EvaluationInputSnapshotPage() {
  const { snapshotId = "unavailable" } = useParams();
  const { searchParams, setQueryParams } = useAnalysisContext();
  const active = searchParams.get("source") ?? "overview";
  const queryClient = useQueryClient();
  const [messageApi, holder] = message.useMessage();
  const snapshot = useQuery({ queryKey: ["evaluation-input-snapshot", snapshotId], queryFn: ({ signal }) => consoleApi.getInputSnapshot(snapshotId, { signal }), staleTime: Infinity });
  const domain = useQuery({ queryKey: ["evaluation-input-material", snapshotId, "domain"], queryFn: ({ signal }) => consoleApi.getInputMaterial(snapshotId, "domain", { signal }), enabled: active === "domain", staleTime: Infinity });
  const provider = useQuery({ queryKey: ["evaluation-input-material", snapshotId, "provider"], queryFn: ({ signal }) => consoleApi.getInputMaterial(snapshotId, "provider", { signal }), enabled: active === "provider", staleTime: Infinity });
  const reconcile = useMutation({
    mutationFn: () => {
      if (!snapshot.data) throw new Error("Snapshot 尚未加载");
      return consoleApi.reconcileInputSnapshot(snapshot.data.data.episodeId, snapshot.data.data.profileVersionId);
    },
    onSuccess: async () => { messageApi.success("已提交真实 reconcile 命令"); await queryClient.invalidateQueries({ queryKey: ["evaluation-input-snapshot", snapshotId] }); },
    onError: (error) => messageApi.error(error instanceof Error ? error.message : "Reconcile 失败"),
  });

  if (!snapshot.data) return <div className="standard-page"><SectionCard><div className="page-loading">正在加载不可变评价输入快照…</div></SectionCard></div>;
  const data = snapshot.data.data;
  const renderMaterial = (resource: typeof domain | typeof provider) => {
    if (resource.isLoading) return <div className="page-loading">正在加载不可变 Material…</div>;
    if (resource.isError) return <Alert type="error" showIcon message="Material unavailable" description={resource.error instanceof Error ? resource.error.message : "请求失败"} />;
    if (!resource.data?.data) return <Empty description={`${resource.data?.meta.availability ?? "unavailable"} · ${resource.data?.meta.reasonCodes.join("、") || "该源不是本次评价的必需输入或尚未就绪"}`} />;
    return <><ApiStatusTag meta={resource.data.meta} /><Alert type="info" showIcon message="Immutable evaluation input material" description={`Authority: ${resource.data.data.authority}`} /><pre className="evaluation-material-json">{JSON.stringify(resource.data.data.material, null, 2)}</pre></>;
  };
  const telemetryBase = ((import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_TELEMETRY_QUERY_BASE_URL ?? "/telemetry-api").replace(/\/$/u, "");
  const rawTraceUrl = `${telemetryBase}/v1/evidence/trace?episodeId=${encodeURIComponent(data.episodeId)}&snapshotId=${encodeURIComponent(data.snapshotId)}`;

  return (
    <div className="standard-page evaluation-input-page">
      {holder}
      <PageHeader title="Evaluation Input Snapshot" subtitle={`${data.snapshotId} · immutable`} meta={snapshot.data.meta} actions={<Button danger icon={<ReloadOutlined />} loading={reconcile.isPending} onClick={() => Modal.confirm({ title: "确认 Reconcile", content: "将通过 Benchmark API 重新检查晚到 Domain/Provider 遥测；不会直接写事实表。", okText: "提交 Reconcile", cancelText: "取消", onOk: () => reconcile.mutateAsync() })}>Reconcile</Button>} />
      <SectionCard>
        <Descriptions bordered column={2} items={[
          { key: "hash", label: "Snapshot ID / Hash", children: <><code>{data.snapshotId}</code><br /><code>{data.contentHash}</code></> },
          { key: "ready", label: "Overall Readiness", children: <Tag color={data.overallReadiness === "ready" ? "green" : "gold"}>{data.overallReadiness}</Tag> },
          { key: "eligible", label: "Formal Input Eligible", children: <Tag color={data.formalInputEligible ? "green" : "red"}>{String(data.formalInputEligible)}</Tag> },
          { key: "watermark", label: "Effective Watermark", children: data.effectiveWatermark },
          { key: "artifact", label: "Artifact", children: <><code>{data.artifactUri}</code><br /><code>{data.artifactHash}</code></> },
          { key: "reasons", label: "Reason Codes", children: data.overallReasonCodes.join("、") || "—" },
        ]} />
      </SectionCard>
      <div className="source-reference-grid">{data.sources.map((source) => <SectionCard key={source.sourceType} title={source.sourceType === "canonical" ? "Canonical Evidence" : source.sourceType === "domain" ? "Domain Projection" : "MCP Provider Telemetry"}><p>Watermark: {source.watermark ?? "—"}</p><code>{source.artifactUri ?? "—"}</code><br /><code>{source.artifactHash ?? "—"}</code></SectionCard>)}</div>
      <Tabs activeKey={active} onChange={(source) => setQueryParams({ source })} items={[
        { key: "overview", label: "快照元数据", children: <SectionCard><pre>{JSON.stringify(data, null, 2)}</pre></SectionCard> },
        { key: "domain", label: "Domain Material", children: <SectionCard>{renderMaterial(domain)}</SectionCard> },
        { key: "provider", label: "Provider Material", children: <SectionCard>{renderMaterial(provider)}</SectionCard> },
        { key: "diagnostic", label: "原始 Trace（诊断）", children: <SectionCard><Alert type="warning" showIcon message="Diagnostic live source — not immutable Benchmark authority" /><Button href={rawTraceUrl} target="_blank">打开 Telemetry 原始 Trace</Button></SectionCard> },
      ]} />
    </div>
  );
}

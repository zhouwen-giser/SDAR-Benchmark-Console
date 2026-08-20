import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Descriptions, Empty, Input, Table, Tabs, Tag } from "antd";
import { ApiOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { consoleApi } from "../api/consoleApi";
import { ApiStatusTag, PageHeader, SectionCard } from "../components/common";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import type { EvidenceRecordView } from "../types";
import { evidenceFamilyName, statusName } from "../utils/format";

export function EvidencePage() {
  const { bundleId = "unavailable" } = useParams();
  const { searchParams, setQueryParams } = useAnalysisContext();
  const tab = searchParams.get("tab") ?? "timeline";
  const otherBundleId = searchParams.get("otherBundleId") ?? "";
  const mode = searchParams.get("mode") ?? "cross_run_structural";
  const bundle = useQuery({ queryKey: ["evidence-bundle", bundleId], queryFn: () => consoleApi.getEvidence(bundleId), staleTime: Infinity });
  const records = useQuery({ queryKey: ["evidence-records", bundleId], queryFn: ({ signal }) => consoleApi.getEvidenceRecords(bundleId, { signal }), enabled: tab === "records", staleTime: Infinity });
  const timeline = useQuery({ queryKey: ["evidence-timeline", bundleId], queryFn: ({ signal }) => consoleApi.getEvidenceTimeline(bundleId, { signal }), enabled: tab === "timeline", staleTime: Infinity });
  const graph = useQuery({ queryKey: ["evidence-graph", bundleId], queryFn: ({ signal }) => consoleApi.getEvidenceGraph(bundleId, { signal }), enabled: tab === "graph", staleTime: Infinity });
  const diff = useQuery({ queryKey: ["evidence-diff", bundleId, otherBundleId, mode], queryFn: ({ signal }) => consoleApi.getEvidenceDiff(bundleId, otherBundleId, mode, { signal }), enabled: tab === "diff" && Boolean(otherBundleId), staleTime: Infinity });
  const usage = useQuery({ queryKey: ["evidence-usage", bundleId], queryFn: ({ signal }) => consoleApi.getEvidenceUsage(bundleId, { signal }), enabled: tab === "usage", staleTime: Infinity });
  if (!bundle.data) return <div className="standard-page"><SectionCard><div className="page-loading">正在加载不可变证据包…</div></SectionCard></div>;
  const data = bundle.data.data;
  const telemetryBase = ((import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_TELEMETRY_QUERY_BASE_URL ?? "/telemetry-api").replace(/\/$/u, "");
  const traceUrl = `${telemetryBase}/v1/evidence/trace?episodeId=${encodeURIComponent(data.episodeId)}&bundleId=${encodeURIComponent(data.bundleId)}`;
  const columns = [
    { title: "Sequence", dataIndex: "evidenceSequence", key: "sequence", width: 100 }, { title: "时间", dataIndex: "occurredAt", key: "time", width: 190 },
    { title: "证据族", dataIndex: "recordFamily", key: "family", render: (value: string) => evidenceFamilyName(value) }, { title: "类型", dataIndex: "recordType", key: "type" },
    { title: "来源", dataIndex: "sourceSystem", key: "source" }, { title: "Record ID", dataIndex: "recordId", key: "id", render: (value: string) => <code>{value}</code> },
    { title: "Payload Hash", dataIndex: "payloadHash", key: "hash", render: (value: string) => <code>{value}</code> },
  ];
  const renderRows = (resource: typeof records | typeof timeline) => resource.isLoading ? <div className="page-loading">正在加载不可变记录…</div> : resource.isError ? <Alert type="error" showIcon message="Evidence subresource unavailable" /> : <><ApiStatusTag compact meta={resource.data!.meta} /><Table<EvidenceRecordView> rowKey="recordId" columns={columns} dataSource={resource.data?.data ?? []} pagination={false} scroll={{ x: 1300 }} /></>;

  return (
    <div className="standard-page evidence-page">
      <PageHeader title={`证据包 ${data.bundleId}`} subtitle={`${data.episodeId} · 清单第 ${data.manifestRevision} 版 · 不可变 Benchmark authority`} meta={bundle.data.meta} actions={<Button icon={<ApiOutlined />} href={traceUrl} target="_blank">原始 Trace（诊断）</Button>} />
      <Alert type="info" showIcon message="Diagnostic live source — not immutable Benchmark authority" description="原始活动 Trace 仅通过 Telemetry Query API 外链访问，不复制进 Benchmark Server。" />
      <div className="bundle-header-grid">
        <SectionCard className="bundle-identity"><span>证据包状态</span><strong>{statusName(data.status)}</strong><small>清单第 {data.manifestRevision} 版</small></SectionCard>
        <SectionCard className="bundle-description"><Descriptions size="small" column={5} items={[
          { key: "records", label: "记录数量", children: data.recordCount }, { key: "sequence", label: "序列范围", children: data.sequenceRange.join("–") || "—" },
          { key: "required", label: "必需证据族", children: data.requiredFamilies.map(evidenceFamilyName).join("、") || "—" }, { key: "missing", label: "缺失证据族", children: data.missingFamilies.length ? data.missingFamilies.map(evidenceFamilyName).join("、") : <Tag color="green">无</Tag> },
          { key: "hash", label: "证据包哈希", children: <code>{data.bundleHash}</code> },
        ]} /></SectionCard>
      </div>
      <Tabs activeKey={tab} onChange={(key) => setQueryParams({ tab: key })} items={[
        { key: "timeline", label: "时间线", children: <SectionCard className="table-card">{renderRows(timeline)}</SectionCard> },
        { key: "records", label: "记录", children: <SectionCard className="table-card">{renderRows(records)}</SectionCard> },
        { key: "graph", label: "关系图", children: <SectionCard>{graph.isLoading ? <div className="page-loading">正在加载 Graph…</div> : graph.data ? <><ApiStatusTag compact meta={graph.data.meta} /><pre>{JSON.stringify(graph.data.data, null, 2)}</pre></> : <Empty description="Graph unavailable" />}</SectionCard> },
        { key: "usage", label: "使用关系", children: <SectionCard>{usage.isLoading ? <div className="page-loading">正在加载使用关系…</div> : usage.data ? <><ApiStatusTag compact meta={usage.data.meta} /><pre>{JSON.stringify(usage.data.data, null, 2)}</pre></> : <Alert type="error" showIcon message="Evidence usage unavailable" />}</SectionCard> },
        { key: "diff", label: "证据差异", children: <SectionCard title="Immutable Evidence Diff"><div className="case-filter-bar"><Input value={otherBundleId} placeholder="otherBundleId（必填）" onChange={(event) => setQueryParams({ otherBundleId: event.target.value || null })} /><Tag>{mode}</Tag></div>{!otherBundleId ? <Empty description="输入另一份 Bundle ID 后才请求正式 diff；不使用 Fixture ID。" /> : diff.isLoading ? <div className="page-loading">正在加载 Diff…</div> : diff.data ? <><ApiStatusTag compact meta={diff.data.meta} /><pre>{JSON.stringify(diff.data.data, null, 2)}</pre></> : <Alert type="error" showIcon message="Diff unavailable" />}</SectionCard> },
        { key: "raw", label: "Bundle 元数据", children: <SectionCard><pre>{JSON.stringify(data, null, 2)}</pre></SectionCard> },
      ]} />
    </div>
  );
}

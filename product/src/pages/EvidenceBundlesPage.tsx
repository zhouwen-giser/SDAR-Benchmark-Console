import { useQuery } from "@tanstack/react-query";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { Button, Input, Select, Space, Tag } from "antd";
import { DiffOutlined, EyeOutlined, FilterOutlined, ReloadOutlined } from "@ant-design/icons";
import { consoleApi } from "../api/consoleApi";
import { PageHeader, SectionCard } from "../components/common";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import type { EvidenceBundleSummary } from "../types";
import { compactTime } from "../utils/format";

export function EvidenceBundlesPage() {
  const { searchParams, navigateWithContext } = useAnalysisContext();
  const status = searchParams.get("bundleStatus") ?? "all";
  const family = searchParams.get("family") ?? "all";
  const search = searchParams.get("search") ?? undefined;
  const query = useQuery({
    queryKey: ["evidence-bundles", status, family, search],
    queryFn: () => consoleApi.listEvidenceBundles({ status, family, search }),
  });
  const data = query.data?.data ?? [];
  const setQuery = (patch: Record<string, string | undefined>) => navigateWithContext("/evidence-bundles", patch);
  const complete = data.filter((item) => item.status === "complete").length;
  const incomplete = data.filter((item) => item.missingFamilies.length > 0).length;
  const records = data.reduce((sum, item) => sum + item.recordCount, 0);

  const columns: ProColumns<EvidenceBundleSummary>[] = [
    { title: "Bundle ID", dataIndex: "bundleId", fixed: "left", width: 205, copyable: true, render: (_, row) => <button className="link-button" onClick={() => navigateWithContext(`/evidence-bundles/${row.bundleId}`)}>{row.bundleId}</button> },
    { title: "Case", dataIndex: "caseId", width: 180, render: (_, row) => <button className="link-button" onClick={() => navigateWithContext(`/cases/${row.caseId}`)}>{row.caseId}</button> },
    { title: "Episode", dataIndex: "episodeId", width: 165 },
    { title: "Status", dataIndex: "status", width: 100, render: (_, row) => <Tag color={row.status === "complete" ? "green" : row.status === "partial" ? "gold" : "default"}>{row.status}</Tag> },
    { title: "Manifest", dataIndex: "manifestRevision", width: 90, render: (_, row) => `rev ${row.manifestRevision}` },
    { title: "Records", dataIndex: "recordCount", width: 85 },
    { title: "Missing Families", dataIndex: "missingFamilies", width: 245, render: (_, row) => row.missingFamilies.length ? row.missingFamilies.map((item) => <Tag color="gold" key={item}>{item}</Tag>) : <Tag color="green">None</Tag> },
    { title: "Evaluation", dataIndex: "evaluationId", width: 145, render: (_, row) => row.evaluationId ? <button className="link-button" onClick={() => navigateWithContext(`/evaluations/${row.evaluationId}`)}>{row.evaluationId}</button> : "—" },
    { title: "Hash", dataIndex: "bundleHash", width: 150, render: (_, row) => <code>{row.bundleHash}</code> },
    { title: "Created", dataIndex: "createdAt", width: 145, render: (_, row) => compactTime(row.createdAt) },
    { title: "", valueType: "option", fixed: "right", width: 104, render: (_, row) => <Space size={2}><Button type="text" icon={<EyeOutlined />} aria-label={`打开 ${row.bundleId}`} onClick={() => navigateWithContext(`/evidence-bundles/${row.bundleId}`)} /><Button type="text" icon={<DiffOutlined />} aria-label={`比较 ${row.bundleId}`} onClick={() => navigateWithContext(`/evidence-bundles/${row.bundleId}`, { tab: "diff" })} /></Space> },
  ];

  return (
    <div className="standard-page evidence-bundles-page">
      <PageHeader title="Evidence Bundle Browser" subtitle="浏览 immutable Bundle catalog、Manifest 完整性与 Evaluation 绑定；Raw trace 保持 Telemetry 外部边界。" meta={query.data?.meta} actions={<Button icon={<ReloadOutlined />} onClick={() => query.refetch()}>刷新</Button>} />
      <div className="collection-stat-grid">
        <SectionCard><span>BUNDLES</span><strong>{data.length}</strong><small>current query</small></SectionCard>
        <SectionCard><span>COMPLETE</span><strong>{complete}</strong><small>sealed manifests</small></SectionCard>
        <SectionCard className={incomplete ? "collection-stat-warning" : ""}><span>MISSING FAMILY</span><strong>{incomplete}</strong><small>requires inspection</small></SectionCard>
        <SectionCard><span>INDEXED RECORDS</span><strong>{records}</strong><small>bounded metadata</small></SectionCard>
      </div>
      <SectionCard className="table-card collection-card">
        <div className="case-filter-bar collection-filter-bar">
          <FilterOutlined />
          <Input.Search defaultValue={search} placeholder="Bundle / Case / Episode" allowClear onSearch={(value) => setQuery({ search: value || undefined })} />
          <Select value={status} options={[{ value: "all", label: "全部状态" }, { value: "complete", label: "Complete" }, { value: "partial", label: "Partial" }, { value: "pending", label: "Pending" }]} onChange={(value) => setQuery({ bundleStatus: value })} />
          <Select value={family} options={[{ value: "all", label: "全部 Evidence" }, { value: "complete", label: "No missing family" }, { value: "missing", label: "Has missing family" }]} onChange={(value) => setQuery({ family: value })} />
          <Button onClick={() => navigateWithContext("/evidence-bundles", { search: undefined, bundleStatus: "all", family: "all" })}>清除</Button>
        </div>
        {(search || status !== "all" || family !== "all") && <Space className="active-filter-summary"><span>当前过滤：</span>{search && <Tag>Search={search}</Tag>}{status !== "all" && <Tag color="blue">Status={status}</Tag>}{family !== "all" && <Tag color="gold">Evidence={family}</Tag>}</Space>}
        <ProTable<EvidenceBundleSummary> rowKey="bundleId" columns={columns} dataSource={data} loading={query.isLoading} search={false} options={false} toolBarRender={false} scroll={{ x: 1580 }} pagination={{ pageSize: 12, showSizeChanger: false }} rowClassName={(row) => row.missingFamilies.length ? "warning-table-row" : ""} />
      </SectionCard>
    </div>
  );
}

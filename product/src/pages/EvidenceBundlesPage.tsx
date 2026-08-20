import { useQuery } from "@tanstack/react-query";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { Button, Input, Select, Space, Tag } from "antd";
import { DiffOutlined, EyeOutlined, FilterOutlined, ReloadOutlined } from "@ant-design/icons";
import { consoleApi } from "../api/consoleApi";
import { PageHeader, SectionCard } from "../components/common";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import type { EvidenceBundleSummary } from "../types";
import { compactTime, evidenceFamilyName, readinessName } from "../utils/format";

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
    { title: "证据包编号", dataIndex: "bundleId", fixed: "left", width: 205, copyable: true, render: (_, row) => <button className="link-button" onClick={() => navigateWithContext(`/evidence-bundles/${row.bundleId}`)}>{row.bundleId}</button> },
    { title: "测试用例", dataIndex: "caseId", width: 180, render: (_, row) => <button className="link-button" onClick={() => navigateWithContext(`/cases/${row.caseId}`)}>{row.caseId}</button> },
    { title: "执行过程", dataIndex: "episodeId", width: 165 },
    { title: "状态", dataIndex: "status", width: 100, render: (_, row) => <Tag color={row.status === "complete" ? "green" : row.status === "partial" ? "gold" : "default"}>{readinessName(row.status)}</Tag> },
    { title: "证据清单", dataIndex: "manifestRevision", width: 100, render: (_, row) => `第 ${row.manifestRevision} 版` },
    { title: "记录数", dataIndex: "recordCount", width: 85 },
    { title: "缺失证据族", dataIndex: "missingFamilies", width: 280, render: (_, row) => row.missingFamilies.length ? row.missingFamilies.map((item) => <Tag color="gold" key={item}>{evidenceFamilyName(item)}</Tag>) : <Tag color="green">无</Tag> },
    { title: "评价结果", dataIndex: "evaluationId", width: 145, render: (_, row) => row.evaluationId ? <button className="link-button" onClick={() => navigateWithContext(`/evaluations/${row.evaluationId}`)}>{row.evaluationId}</button> : "—" },
    { title: "内容哈希", dataIndex: "bundleHash", width: 150, render: (_, row) => row.bundleHash === "pending" ? "待生成" : <code>{row.bundleHash}</code> },
    { title: "创建时间", dataIndex: "createdAt", width: 145, render: (_, row) => compactTime(row.createdAt) },
    { title: "", valueType: "option", fixed: "right", width: 104, render: (_, row) => <Space size={2}><Button type="text" icon={<EyeOutlined />} aria-label={`打开 ${row.bundleId}`} onClick={() => navigateWithContext(`/evidence-bundles/${row.bundleId}`)} /><Button type="text" icon={<DiffOutlined />} aria-label={`比较 ${row.bundleId}`} onClick={() => navigateWithContext(`/evidence-bundles/${row.bundleId}`, { tab: "diff" })} /></Space> },
  ];

  return (
    <div className="standard-page evidence-bundles-page">
      <PageHeader title="证据包浏览器" subtitle="浏览不可变证据包目录、证据清单完整性与评价绑定；原始追踪记录仍由外部遥测服务提供。" meta={query.data?.meta} actions={<Button icon={<ReloadOutlined />} onClick={() => query.refetch()}>刷新</Button>} />
      <div className="collection-stat-grid">
        <SectionCard><span>证据包总数</span><strong>{data.length}</strong><small>当前查询结果</small></SectionCard>
        <SectionCard><span>完整证据包</span><strong>{complete}</strong><small>证据清单已封存</small></SectionCard>
        <SectionCard className={incomplete ? "collection-stat-warning" : ""}><span>存在证据缺失</span><strong>{incomplete}</strong><small>需要检查</small></SectionCard>
        <SectionCard><span>已索引记录</span><strong>{records}</strong><small>范围受限的元数据</small></SectionCard>
      </div>
      <SectionCard className="table-card collection-card">
        <div className="case-filter-bar collection-filter-bar">
          <FilterOutlined />
          <Input.Search defaultValue={search} placeholder="证据包 / 用例 / 执行过程" allowClear onSearch={(value) => setQuery({ search: value || undefined })} />
          <Select value={status} options={[{ value: "all", label: "全部状态" }, { value: "complete", label: readinessName("complete") }, { value: "partial", label: readinessName("partial") }, { value: "pending", label: readinessName("pending") }]} onChange={(value) => setQuery({ bundleStatus: value })} />
          <Select value={family} options={[{ value: "all", label: "全部证据情况" }, { value: "complete", label: "无缺失证据族" }, { value: "missing", label: "存在缺失证据族" }]} onChange={(value) => setQuery({ family: value })} />
          <Button onClick={() => navigateWithContext("/evidence-bundles", { search: undefined, bundleStatus: "all", family: "all" })}>清除</Button>
        </div>
        {(search || status !== "all" || family !== "all") && <Space className="active-filter-summary"><span>当前筛选：</span>{search && <Tag>搜索：{search}</Tag>}{status !== "all" && <Tag color="blue">状态：{readinessName(status)}</Tag>}{family !== "all" && <Tag color="gold">证据情况：{family === "missing" ? "存在缺失" : "无缺失"}</Tag>}</Space>}
        <ProTable<EvidenceBundleSummary> rowKey="bundleId" columns={columns} dataSource={data} loading={query.isLoading} search={false} options={false} toolBarRender={false} scroll={{ x: 1580 }} pagination={{ pageSize: 12, showSizeChanger: false }} rowClassName={(row) => row.missingFamilies.length ? "warning-table-row" : ""} />
      </SectionCard>
    </div>
  );
}

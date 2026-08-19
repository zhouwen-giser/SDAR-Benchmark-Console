import { useQuery } from "@tanstack/react-query";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { Button, Input, Select, Space, Tag } from "antd";
import { EyeOutlined, FilterOutlined } from "@ant-design/icons";
import { consoleApi } from "../api/consoleApi";
import { PageHeader, SectionCard } from "../components/common";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import type { CaseResult } from "../types";
import { displayValue, signedDelta } from "../utils/format";

export function CasesPage() {
  const { searchParams, navigateWithContext } = useAnalysisContext();
  const gate = searchParams.get("gate") ?? undefined;
  const change = searchParams.get("change") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const track = searchParams.get("track") ?? "all";
  const risk = searchParams.get("risk") ?? "all";
  const query = useQuery({
    queryKey: ["cases", gate, change, search, track, risk],
    queryFn: () => consoleApi.listCases({ gate, change, search, track, risk }),
  });
  const setQuery = (patch: Record<string, string | undefined>) => navigateWithContext("/cases", patch);
  const columns: ProColumns<CaseResult>[] = [
    { title: "Case ID", dataIndex: "caseId", fixed: "left", width: 175, copyable: true, render: (_, row) => <button className="link-button" onClick={() => navigateWithContext(`/cases/${row.caseId}`)}>{row.caseId}</button> },
    { title: "Case", dataIndex: "title", width: 300, ellipsis: true },
    { title: "Track", dataIndex: "track", width: 85 },
    { title: "Risk", dataIndex: "risk", width: 95, render: (_, row) => <Tag color={row.risk === "critical" ? "red" : row.risk === "high" ? "orange" : "blue"}>{row.risk}</Tag> },
    { title: "Reps", dataIndex: "repetitions", width: 65 },
    { title: "Verdict", dataIndex: "verdict", width: 85, render: (_, row) => <Tag color={row.verdict === "HG" ? "red" : row.verdict === "A" ? "green" : "gold"}>{row.verdict}</Tag> },
    { title: "Score", dataIndex: "score", width: 75, render: (_, row) => displayValue(row.score) },
    { title: "Stability", dataIndex: "stability", width: 95, render: (_, row) => displayValue(row.stability, "%") },
    { title: "Baseline Δ", dataIndex: "baselineDelta", width: 100, render: (_, row) => <span className={(row.baselineDelta ?? 0) < 0 ? "text-danger" : "text-positive"}>{row.baselineDelta == null ? "—" : signedDelta(row.baselineDelta)}</span> },
    { title: "Change", dataIndex: "change", width: 165, render: (_, row) => <Tag color={row.change === "NEW_GATE_FAILURE" ? "red" : row.change === "REGRESSED" ? "volcano" : row.change === "RECOVERED" ? "green" : "blue"}>{row.change}</Tag> },
    { title: "Gates", dataIndex: "gates", width: 120, render: (_, row) => row.gates.map((item) => <Tag color="red" key={item}>{item}</Tag>) },
    { title: "Missing Evidence", dataIndex: "missingEvidence", width: 170, render: (_, row) => row.missingEvidence.length ? row.missingEvidence.map((item) => <Tag color="gold" key={item}>{item}</Tag>) : "—" },
    {
      title: "",
      valueType: "option",
      fixed: "right",
      width: 126,
      render: (_, row) => (
        <Space size={0}>
          <Button type="text" icon={<EyeOutlined />} aria-label={`打开 ${row.caseId} Case Detail`} onClick={() => navigateWithContext(`/cases/${row.caseId}`)} />
          <Button type="link" size="small" aria-label={`打开 ${row.caseId} Evaluation`} onClick={() => navigateWithContext(`/evaluations/${row.evaluationId}`)}>Eval</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="standard-page cases-page">
      <PageHeader
        title="Case Explorer"
        subtitle="版本化 Case Contract 的只读 Explorer；可下钻到 Case Detail、Evaluation 与 Evidence。"
        meta={query.data?.meta}
      />
      <SectionCard className="table-card">
        <div className="case-filter-bar">
          <FilterOutlined />
          <Input.Search defaultValue={search} placeholder="Case ID / 标题" allowClear onSearch={(value) => setQuery({ search: value || undefined })} />
          <Select value={track} options={["all", "core", "skill", "mcp", "node", "cross"].map((value) => ({ value, label: value === "all" ? "全部 Track" : value.toUpperCase() }))} onChange={(value) => setQuery({ track: value })} />
          <Select value={risk} options={["all", "critical", "high", "medium", "low"].map((value) => ({ value, label: value === "all" ? "全部 Risk" : value }))} onChange={(value) => setQuery({ risk: value })} />
          <Select allowClear placeholder="Gate" value={gate} options={["HG1", "HG2", "HG3", "HG4", "HG5", "HG6", "HG7"].map((value) => ({ value, label: value }))} onChange={(value) => setQuery({ gate: value })} />
          <Select allowClear placeholder="Change" value={change} options={["NEW_GATE_FAILURE", "REGRESSED", "RECOVERED", "IMPROVED"].map((value) => ({ value, label: value }))} onChange={(value) => setQuery({ change: value })} />
          <Button onClick={() => navigateWithContext("/cases", { gate: undefined, change: undefined, search: undefined, track: "all", risk: "all" })}>清除</Button>
        </div>
        {(gate || change || search) && <Space className="active-filter-summary"><span>当前过滤：</span>{gate && <Tag color="red">Gate={gate}</Tag>}{change && <Tag color="volcano">Change={change}</Tag>}{search && <Tag>Search={search}</Tag>}</Space>}
        <ProTable<CaseResult>
          rowKey="caseId"
          columns={columns}
          dataSource={query.data?.data ?? []}
          loading={query.isLoading}
          search={false}
          options={false}
          toolBarRender={false}
          scroll={{ x: 1600 }}
          pagination={{ pageSize: 12, showSizeChanger: false }}
          rowClassName={(row) => row.change === "NEW_GATE_FAILURE" ? "critical-table-row" : ""}
        />
      </SectionCard>
    </div>
  );
}

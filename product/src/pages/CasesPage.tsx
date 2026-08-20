import { useQuery } from "@tanstack/react-query";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { Button, Input, Select, Space, Tag } from "antd";
import { EyeOutlined, FilterOutlined } from "@ant-design/icons";
import { consoleApi } from "../api/consoleApi";
import { PageHeader, SectionCard } from "../components/common";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import type { CaseResult } from "../types";
import { changeName, displayValue, evidenceFamilyName, failureTypeName, riskName, signedDelta, trackName, verdictName } from "../utils/format";

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
    { title: "用例编号", dataIndex: "caseId", fixed: "left", width: 175, copyable: true, render: (_, row) => <button className="link-button" onClick={() => navigateWithContext(`/cases/${row.caseId}`)}>{row.caseId}</button> },
    { title: "测试用例", dataIndex: "title", width: 300, ellipsis: true },
    { title: "分轨", dataIndex: "track", width: 105, render: (_, row) => trackName(row.track) },
    { title: "风险", dataIndex: "risk", width: 95, render: (_, row) => <Tag color={row.risk === "critical" ? "red" : row.risk === "high" ? "orange" : "blue"}>{riskName(row.risk)}</Tag> },
    { title: "重复次数", dataIndex: "repetitions", width: 90 },
    { title: "结论", dataIndex: "verdict", width: 150, render: (_, row) => <Tag color={row.verdict === "HG" ? "red" : row.verdict === "A" ? "green" : "gold"}>{verdictName(row.verdict)}</Tag> },
    { title: "得分", dataIndex: "score", width: 75, render: (_, row) => displayValue(row.score) },
    { title: "稳定性", dataIndex: "stability", width: 95, render: (_, row) => displayValue(row.stability, "%") },
    { title: "较基准变化", dataIndex: "baselineDelta", width: 110, render: (_, row) => <span className={(row.baselineDelta ?? 0) < 0 ? "text-danger" : "text-positive"}>{row.baselineDelta == null ? "—" : signedDelta(row.baselineDelta)}</span> },
    { title: "变化类型", dataIndex: "change", width: 165, render: (_, row) => <Tag color={row.change === "NEW_GATE_FAILURE" ? "red" : row.change === "REGRESSED" ? "volcano" : row.change === "RECOVERED" ? "green" : "blue"}>{changeName(row.change)}</Tag> },
    { title: "失败门槛", dataIndex: "gates", width: 120, render: (_, row) => row.gates.map((item) => <Tag color="red" key={item}>{item}</Tag>) },
    { title: "缺失证据", dataIndex: "missingEvidence", width: 220, render: (_, row) => row.missingEvidence.length ? row.missingEvidence.map((item) => <Tag color="gold" key={item}>{evidenceFamilyName(item)}</Tag>) : "—" },
    { title: "失败类型", dataIndex: "failureType", width: 150, render: (_, row) => failureTypeName(row.failureType) },
    {
      title: "",
      valueType: "option",
      fixed: "right",
      width: 126,
      render: (_, row) => (
        <Space size={0}>
          <Button type="text" icon={<EyeOutlined />} aria-label={`打开 ${row.caseId} 用例详情`} onClick={() => navigateWithContext(`/cases/${row.caseId}`)} />
          <Button type="link" size="small" aria-label={`打开 ${row.caseId} 评价结果`} onClick={() => navigateWithContext(`/evaluations/${row.evaluationId}`)}>评价</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="standard-page cases-page">
      <PageHeader
        title="测试用例浏览器"
        subtitle="只读浏览版本化用例合同，并可下钻到用例详情、评价结果与证据记录。"
        meta={query.data?.meta}
      />
      <SectionCard className="table-card">
        <div className="case-filter-bar">
          <FilterOutlined />
          <Input.Search defaultValue={search} placeholder="用例编号 / 标题" allowClear onSearch={(value) => setQuery({ search: value || undefined })} />
          <Select value={track} options={["all", "core", "skill", "mcp", "node", "cross"].map((value) => ({ value, label: trackName(value) }))} onChange={(value) => setQuery({ track: value })} />
          <Select value={risk} options={["all", "critical", "high", "medium", "low"].map((value) => ({ value, label: riskName(value) }))} onChange={(value) => setQuery({ risk: value })} />
          <Select allowClear placeholder="硬门槛" value={gate} options={["HG1", "HG2", "HG3", "HG4", "HG5", "HG6", "HG7"].map((value) => ({ value, label: value }))} onChange={(value) => setQuery({ gate: value })} />
          <Select allowClear placeholder="变化类型" value={change} options={["NEW_GATE_FAILURE", "REGRESSED", "RECOVERED", "IMPROVED"].map((value) => ({ value, label: changeName(value) }))} onChange={(value) => setQuery({ change: value })} />
          <Button onClick={() => navigateWithContext("/cases", { gate: undefined, change: undefined, search: undefined, track: "all", risk: "all" })}>清除</Button>
        </div>
        {(gate || change || search) && <Space className="active-filter-summary"><span>当前筛选：</span>{gate && <Tag color="red">硬门槛：{gate}</Tag>}{change && <Tag color="volcano">变化：{changeName(change)}</Tag>}{search && <Tag>搜索：{search}</Tag>}</Space>}
        <ProTable<CaseResult>
          rowKey="caseId"
          columns={columns}
          dataSource={query.data?.data ?? []}
          loading={query.isLoading}
          search={false}
          options={false}
          toolBarRender={false}
          scroll={{ x: 1780 }}
          pagination={{ pageSize: 12, showSizeChanger: false }}
          rowClassName={(row) => row.change === "NEW_GATE_FAILURE" ? "critical-table-row" : ""}
        />
      </SectionCard>
    </div>
  );
}

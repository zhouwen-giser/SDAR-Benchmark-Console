import { useQuery } from "@tanstack/react-query";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { Button, Progress, Select, Space, Tag } from "antd";
import { EyeOutlined, ReloadOutlined } from "@ant-design/icons";
import { consoleApi } from "../api/consoleApi";
import { PageHeader, SectionCard } from "../components/common";
import { useAnalysisContext } from "../hooks/useAnalysisContext";
import type { RunSummary } from "../types";
import { compactTime, displayValue } from "../utils/format";

const gateColor: Record<string, string> = { blocked: "red", ready: "green", warning: "gold", invalid: "default" };

export function RunsPage() {
  const { navigateWithContext } = useAnalysisContext();
  const query = useQuery({ queryKey: ["runs"], queryFn: () => consoleApi.listRuns() });
  const columns: ProColumns<RunSummary>[] = [
    { title: "Run ID", dataIndex: "runId", fixed: "left", width: 165, copyable: true },
    { title: "Candidate", dataIndex: "candidate", width: 190 },
    { title: "Dataset", dataIndex: "dataset", width: 130 },
    { title: "Profile", dataIndex: "profile", width: 180, ellipsis: true },
    {
      title: "Cases / Completed",
      key: "progress",
      width: 160,
      render: (_, row) => <div className="run-progress"><Progress percent={Math.round((row.completed / row.cases) * 100)} size="small" showInfo={false} /><span>{row.completed}/{row.cases}</span></div>,
    },
    { title: "Pass Rate", dataIndex: "passRate", width: 100, render: (_, row) => displayValue(row.passRate, "%") },
    { title: "Quality", dataIndex: "qualityScore", width: 90, render: (_, row) => displayValue(row.qualityScore) },
    { title: "Fatal", dataIndex: "fatal", width: 72, render: (_, row) => <span className={(row.fatal ?? 0) > 0 ? "text-danger" : ""}>{displayValue(row.fatal)}</span> },
    { title: "HG", dataIndex: "hg", width: 66, render: (_, row) => <span className={(row.hg ?? 0) > 0 ? "text-danger" : ""}>{displayValue(row.hg)}</span> },
    { title: "NR", dataIndex: "nr", width: 66, render: (_, row) => displayValue(row.nr) },
    { title: "Release Gate", dataIndex: "releaseGate", width: 118, render: (_, row) => <Tag color={gateColor[row.releaseGate]}>{row.releaseGate.toUpperCase()}</Tag> },
    { title: "Authority", dataIndex: "status", width: 105, render: (_, row) => <Tag color="green">{row.status}</Tag> },
    { title: "Completed", dataIndex: "completedAt", width: 140, render: (_, row) => compactTime(row.completedAt) },
    { title: "", valueType: "option", fixed: "right", width: 58, render: (_, row) => <Button type="text" aria-label={`打开 ${row.runId}`} icon={<EyeOutlined />} onClick={() => navigateWithContext(`/runs/${row.runId}`)} /> },
  ];

  return (
    <div className="standard-page">
      <PageHeader
        title="Benchmark Runs"
        subtitle="运行权威状态来自 PostgreSQL；完成后的质量结果来自 ClickHouse 投影，Projection Pending 不显示 0。"
        meta={query.data?.meta}
        actions={<Button icon={<ReloadOutlined />} onClick={() => query.refetch()}>刷新</Button>}
      />
      <SectionCard className="table-card">
        <div className="run-filter-strip">
          <Select value="all" options={[{ value: "all", label: "全部状态" }, { value: "completed", label: "Completed" }]} />
          <Select value="all" options={[{ value: "all", label: "全部 Candidate" }, { value: "1.4.2", label: "SDAR 1.4.2" }]} />
          <Select value="all" options={[{ value: "all", label: "全部 Release Gate" }, { value: "blocked", label: "Blocked" }]} />
          <span className="table-watermark">Watermark {query.data?.meta.watermark?.slice(11, 19) ?? "—"}</span>
        </div>
        <ProTable<RunSummary>
          rowKey="runId"
          columns={columns}
          dataSource={query.data?.data ?? []}
          loading={query.isLoading}
          search={false}
          options={false}
          toolBarRender={false}
          scroll={{ x: 1550 }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          onRow={(row) => ({ onDoubleClick: () => navigateWithContext(`/runs/${row.runId}`) })}
        />
      </SectionCard>
    </div>
  );
}

import { useMemo, useState } from "react";
import { Alert, Button, Checkbox, Form, Input, InputNumber, Radio, Space, Tag } from "antd";
import { RedoOutlined } from "@ant-design/icons";

export interface BenchmarkRunRerunRequestView {
  schemaVersion: "sdar-benchmark.run-rerun-request/v1";
  selectedCaseIds: string[];
  repeatCount: number;
  target?: "simulated" | "live";
  reason: string;
  idempotencyKey: string;
}

export interface RerunCaseOption {
  caseId: string;
  label?: string;
  terminalState?: string | null;
}

export function RerunRequestPanel({ cases, pending = false, onSubmit }: { cases: RerunCaseOption[]; pending?: boolean; onSubmit: (request: BenchmarkRunRerunRequestView) => void }) {
  const uniqueCases = useMemo(() => [...new Map(cases.map((item) => [item.caseId, item])).values()], [cases]);
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>(uniqueCases.map((item) => item.caseId));
  const [repeatCount, setRepeatCount] = useState(1);
  const [target, setTarget] = useState<"simulated" | "live">("simulated");
  const [reason, setReason] = useState("Development diagnostic rerun from Console");
  const canSubmit = selectedCaseIds.length > 0 && reason.trim().length > 0 && repeatCount >= 1 && repeatCount <= 20;

  return <Form layout="vertical" onFinish={() => canSubmit && onSubmit({
    schemaVersion: "sdar-benchmark.run-rerun-request/v1",
    selectedCaseIds,
    repeatCount,
    target,
    reason: reason.trim(),
    idempotencyKey: `console-rerun-${crypto.randomUUID()}`,
  })}>
    <Alert type="info" showIcon message="重跑会创建不可变的子 Run" description="原 Run 与终态不会修改；子 Run 通过 parentRunId 保留 lineage。" />
    <Form.Item label="Case subset" required>
      <Checkbox.Group value={selectedCaseIds} onChange={(values) => setSelectedCaseIds(values as string[])}>
        <div className="rerun-case-grid">{uniqueCases.map((item) => <Checkbox key={item.caseId} value={item.caseId}><code>{item.caseId}</code>{item.label ? ` · ${item.label}` : ""}{item.terminalState && <Tag>{item.terminalState}</Tag>}</Checkbox>)}</div>
      </Checkbox.Group>
    </Form.Item>
    <Space wrap size="large" align="start">
      <Form.Item label="Repeat count" required><InputNumber min={1} max={20} value={repeatCount} onChange={(value) => setRepeatCount(value ?? 1)} /></Form.Item>
      <Form.Item label="Target" required><Radio.Group value={target} onChange={(event) => setTarget(event.target.value as "simulated" | "live")} options={[{ value: "simulated", label: "simulated" }, { value: "live", label: "live" }]} /></Form.Item>
    </Space>
    <Form.Item label="Reason" required><Input.TextArea value={reason} maxLength={1000} showCount onChange={(event) => setReason(event.target.value)} /></Form.Item>
    <Button type="primary" htmlType="submit" icon={<RedoOutlined />} disabled={!canSubmit} loading={pending}>创建子 Run</Button>
  </Form>;
}

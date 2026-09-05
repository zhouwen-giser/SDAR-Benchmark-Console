import type { ReactNode } from "react";
import { Alert, Descriptions, Empty, Skeleton, Space, Tag } from "antd";
import type { NativeDataClass, OperationalMeta } from "./types";

const statusColor: Record<string, string> = {
  ready: "green",
  healthy: "green",
  available: "green",
  exact: "green",
  native: "green",
  completed: "green",
  development_native: "cyan",
  development_native_test_fault: "purple",
  partial: "gold",
  degraded: "gold",
  stale: "gold",
  unresolved: "orange",
  unavailable: "red",
  not_ready: "red",
  conflict: "red",
  drift: "red",
  quarantined: "red",
  deterministic_substitute: "purple",
  proxy: "purple",
  development_fixture: "blue",
  development_substituted: "purple",
  not_required: "default",
  unknown: "default",
};

export function OperationalStatusTag({ value }: { value: string }) {
  return <Tag color={statusColor[value] ?? "blue"}>{value.replaceAll("_", " ").toUpperCase()}</Tag>;
}

export function OperationalMetaStrip({ meta }: { meta: OperationalMeta }) {
  const isFixture = meta.dataClass === "development_fixture";
  return (
    <div className="operational-meta-strip" aria-label="operational resource metadata">
      <Space wrap size={[6, 6]}>
        <OperationalStatusTag value={meta.availability} />
        <OperationalStatusTag value={meta.dataClass} />
        <Tag color={meta.formalEligible ? "green" : "red"}>FORMAL ELIGIBLE: {String(meta.formalEligible).toUpperCase()}</Tag>
        <Tag>{meta.authority}</Tag>
        <span>revision {meta.revision ?? "—"}</span>
        <span>watermark {compactTimestamp(meta.watermark)}</span>
        <span>projection lag {meta.projectionLagMs == null ? "—" : `${meta.projectionLagMs} ms`}</span>
      </Space>
      {(meta.reasonCodes.length > 0 || meta.warnings.length > 0 || isFixture) && (
        <Alert
          type={meta.availability === "unavailable" ? "error" : "warning"}
          showIcon
          message={isFixture ? "Contract fixture — not live-native evidence" : "Operational source advisory"}
          description={[...meta.reasonCodes, ...meta.warnings].join(" · ")}
        />
      )}
    </div>
  );
}

export function OperationalLoading({ label = "正在读取 Operational API" }: { label?: string }) {
  return <section className="section-card operational-loading" aria-label={label}><Skeleton active paragraph={{ rows: 8 }} /></section>;
}

export function OperationalError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <Alert
      type="error"
      showIcon
      message="Operational API unavailable"
      description={<Space direction="vertical"><span>{error instanceof Error ? error.message : String(error)}</span><span>HTTP 模式不会回退到 Mock/Seed。</span>{onRetry && <button type="button" className="link-button" onClick={onRetry}>重试</button>}</Space>}
    />
  );
}

export function EmptyOperational({ description }: { description: string }) {
  return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description} />;
}

export function NativeBoundaryNotice({ dataClass }: { dataClass?: NativeDataClass }) {
  return (
    <Alert
      type="info"
      showIcon
      message="Diagnostic operational data boundary"
      description={`dataClass=${dataClass ?? "unavailable"} · availability and evidence remain explicit · formalEligible=false · qualityScore=null · releaseGate=unavailable`}
    />
  );
}

export function SourceIdentity({ values }: { values: Array<{ label: string; value: ReactNode }> }) {
  return <Descriptions size="small" bordered column={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }} items={values.map((item, index) => ({ key: `${item.label}-${index}`, label: item.label, children: item.value }))} />;
}

export function compactTimestamp(value: string | null | undefined) {
  if (!value) return "—";
  return value.replace("T", " ").replace(/\.\d{3}Z$/u, "Z");
}

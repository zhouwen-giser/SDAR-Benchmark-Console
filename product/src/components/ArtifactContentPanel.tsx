import { Alert, Descriptions, Empty, Tag } from "antd";
import { DebugPayloadDrawer } from "./common";

export interface ArtifactContentPanelProps {
  artifactId: string;
  mediaType: string;
  sha256: string;
  sizeBytes: number;
  content: string;
  hashVerified?: boolean | null;
}

export function ArtifactContentPanel({ artifactId, mediaType, sha256, sizeBytes, content, hashVerified = null }: ArtifactContentPanelProps) {
  const json = mediaType === "application/json" ? parseJson(content) : undefined;
  return <div className="artifact-content-panel">
    <Descriptions bordered size="small" column={2} items={[
      { key: "id", label: "Artifact", children: <code>{artifactId}</code> },
      { key: "media", label: "Media Type", children: <Tag>{mediaType}</Tag> },
      { key: "hash", label: "SHA-256", children: <code>{sha256}</code> },
      { key: "size", label: "Size", children: `${sizeBytes} B` },
      { key: "verified", label: "Content Verification", span: 2, children: hashVerified == null ? <Tag>pending</Tag> : <Tag color={hashVerified ? "green" : "red"}>{hashVerified ? "verified" : "hash_mismatch"}</Tag> },
    ]} />

    {mediaType === "application/json" ? (
      json === undefined ? <Alert type="error" showIcon message="Artifact JSON 无法解析" /> : <JsonArtifact value={json} />
    ) : mediaType === "text/markdown" ? (
      <MarkdownArtifact content={content} />
    ) : mediaType === "text/plain" ? (
      <pre className="artifact-plain-text">{content}</pre>
    ) : (
      <Alert type="warning" showIcon message="不支持的 Artifact media type" description={mediaType} />
    )}

    <div className="artifact-debug-action"><DebugPayloadDrawer payload={{ artifactId, mediaType, sha256, sizeBytes, content }} /></div>
  </div>;
}

function JsonArtifact({ value }: { value: unknown }) {
  const rows = flattenJson(value);
  if (rows.length === 0) return <Empty description="JSON Artifact 没有可展示字段" />;
  return <Descriptions className="artifact-json-fields" bordered size="small" column={1} items={rows.map((row) => ({
    key: row.path,
    label: <code>{row.path}</code>,
    children: <ArtifactValue value={row.value} />,
  }))} />;
}

function ArtifactValue({ value }: { value: unknown }) {
  if (value == null) return <span>—</span>;
  if (typeof value === "boolean") return <Tag color={value ? "green" : "red"}>{String(value)}</Tag>;
  if (typeof value === "number") return <span>{value}</span>;
  if (typeof value === "string") return <span className="artifact-string-value">{value}</span>;
  if (Array.isArray(value)) return <div className="typed-cell-list">{value.map((item, index) => <Tag key={`${index}:${String(item)}`}>{scalar(item)}</Tag>)}</div>;
  return <span>typed object</span>;
}

function MarkdownArtifact({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  return <article className="artifact-markdown">{lines.map((line, index) => {
    if (line.startsWith("### ")) return <h4 key={index}>{line.slice(4)}</h4>;
    if (line.startsWith("## ")) return <h3 key={index}>{line.slice(3)}</h3>;
    if (line.startsWith("# ")) return <h2 key={index}>{line.slice(2)}</h2>;
    if (line.startsWith("- ")) return <div className="artifact-markdown-list-item" key={index}>• {line.slice(2)}</div>;
    if (!line.trim()) return <div className="artifact-markdown-spacer" key={index} />;
    return <p key={index}>{line}</p>;
  })}</article>;
}

function flattenJson(value: unknown, path = "$", depth = 0): Array<{ path: string; value: unknown }> {
  if (depth > 3 || !value || typeof value !== "object") return [{ path, value }];
  if (Array.isArray(value)) return value.length === 0 ? [{ path, value }] : value.flatMap((item, index) => flattenJson(item, `${path}[${index}]`, depth + 1));
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return [{ path, value }];
  return entries.flatMap(([key, item]) => flattenJson(item, path === "$" ? key : `${path}.${key}`, depth + 1)).slice(0, 80);
}

function parseJson(value: string): unknown | undefined {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

function scalar(value: unknown) {
  return value == null ? "—" : ["string", "number", "boolean"].includes(typeof value) ? String(value) : "typed object";
}

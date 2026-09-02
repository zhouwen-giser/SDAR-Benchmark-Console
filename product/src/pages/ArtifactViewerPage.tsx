import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Descriptions, Result, Tag } from "antd";
import { useParams } from "react-router-dom";
import { consoleApi } from "../api/consoleApi";
import { ArtifactContentPanel } from "../components/ArtifactContentPanel";
import { DataClassTag } from "../components/TypedAnalyticsModule";
import { ApiStatusTag, PageHeader, SectionCard } from "../components/common";
import { useAnalysisContext } from "../hooks/useAnalysisContext";

export function ArtifactViewerPage() {
  const { runId = "", repetitionId = "", artifactId = "" } = useParams();
  const { navigateWithContext } = useAnalysisContext();
  const metadata = useQuery({ queryKey: ["product-artifact", runId, repetitionId, artifactId], queryFn: ({ signal }) => consoleApi.getBenchmarkRunRepetitionArtifact(runId, repetitionId, artifactId, { signal }), retry: false });
  const content = useQuery({ queryKey: ["product-artifact-content", runId, repetitionId, artifactId], queryFn: ({ signal }) => consoleApi.getBenchmarkRunRepetitionArtifactContent(runId, repetitionId, artifactId, { signal }), retry: false });
  const [contentVerification, setContentVerification] = useState<boolean | null>(null);
  useEffect(() => {
    const body = content.data?.data;
    if (!body) {
      setContentVerification(null);
      return;
    }
    let active = true;
    void verifyContent(body.content, body.sha256, body.sizeBytes).then((verified) => {
      if (active) setContentVerification(verified);
    });
    return () => { active = false; };
  }, [content.data]);
  if (metadata.isLoading || content.isLoading) return <div className="standard-page"><SectionCard><div className="page-loading">正在验证并加载 Artifact…</div></SectionCard></div>;
  if (metadata.isError || content.isError || !metadata.data || !content.data) return <div className="standard-page"><Result status="warning" title="Artifact 不可用" subTitle="所有权、hash、size 或 mediaType 校验未通过，或 ArtifactStore 暂不可用。" extra={<Button onClick={() => navigateWithContext(`/runs/${runId}`)}>返回 Run</Button>} /></div>;
  const artifact = metadata.data.data;
  const body = content.data.data;
  const metadataVerified = artifact.artifactId === body.artifactId && artifact.artifactHash === body.sha256 && Number(artifact.artifactSizeBytes) === Number(body.sizeBytes) && artifact.mediaType === body.mediaType;
  const verified = contentVerification === null ? null : metadataVerified && contentVerification;
  return <div className="standard-page artifact-viewer-page">
    <PageHeader title={`Artifact ${artifact.artifactId}`} subtitle="内容仅在 Run / Repetition / Artifact relation ownership 校验后展示。" meta={content.data.meta} actions={<><ApiStatusTag meta={content.data.meta} /><Button onClick={() => navigateWithContext(`/runs/${runId}`)}>返回 Run</Button></>} />
    {verified === false && <Alert type="error" showIcon message="Artifact metadata/content verification mismatch" description="内容保持可诊断显示，但不能作为已验证 evidence 使用。" />}
    <SectionCard title="Immutable relation metadata">
      <Descriptions bordered size="small" column={2} items={[
        { key: "run", label: "Run", children: <code>{artifact.runId}</code> },
        { key: "rep", label: "Repetition", children: <code>{artifact.repetitionId}</code> },
        { key: "kind", label: "Kind", children: <Tag>{artifact.artifactKind}</Tag> },
        { key: "revision", label: "Revision", children: artifact.artifactRevision },
        { key: "schema", label: "Schema", children: <code>{artifact.artifactSchemaVersion}</code> },
        { key: "class", label: "Data Class", children: <DataClassTag value={artifact.dataClass} /> },
        { key: "relation", label: "Relation Hash", children: <code>{artifact.relationHash}</code> },
        { key: "created", label: "Created", children: artifact.createdAt },
      ]} />
    </SectionCard>
    <SectionCard title="Typed content viewer"><ArtifactContentPanel artifactId={body.artifactId} mediaType={body.mediaType} sha256={body.sha256} sizeBytes={body.sizeBytes} content={body.content} hashVerified={verified} /></SectionCard>
  </div>;
}

async function verifyContent(content: string, expectedHash: string, expectedSize: number): Promise<boolean> {
  const bytes = new TextEncoder().encode(content);
  if (bytes.byteLength !== Number(expectedSize) || !globalThis.crypto?.subtle) return false;
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  const actual = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return expectedHash === `sha256:${actual}`;
}

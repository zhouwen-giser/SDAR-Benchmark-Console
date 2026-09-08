import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ArtifactContentPanel } from "./ArtifactContentPanel";

afterEach(cleanup);

describe("ArtifactContentPanel", () => {
  it("renders verified JSON as typed fields", () => {
    render(<ArtifactContentPanel artifactId="artifact-1" mediaType="application/json" sha256={`sha256:${"a".repeat(64)}`} sizeBytes={42} hashVerified content={JSON.stringify({ caseId: "UGV-NODE-002", terminal: true })} />);
    expect(screen.getByText("UGV-NODE-002")).toBeInTheDocument();
    expect(screen.getByText("verified")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看原始数据" })).toBeInTheDocument();
  });

  it("renders Markdown without injecting HTML", () => {
    render(<ArtifactContentPanel artifactId="artifact-2" mediaType="text/markdown" sha256={`sha256:${"b".repeat(64)}`} sizeBytes={16} content={"# Evidence\n- complete"} />);
    expect(screen.getByRole("heading", { name: "Evidence" })).toBeInTheDocument();
    expect(screen.getByText("• complete")).toBeInTheDocument();
  });
});

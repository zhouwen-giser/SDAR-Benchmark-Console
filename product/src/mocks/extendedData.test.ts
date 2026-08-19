import { describe, expect, it } from "vitest";
import {
  alertRecords,
  buildCaseDetail,
  evaluationSummaries,
  evidenceBundleSummaries,
  resourceDetails,
} from "./extendedData";

describe("extended deterministic workspace data", () => {
  it("binds the release-blocking Case to Evaluation and Evidence", () => {
    const detail = buildCaseDetail("MCP-RESTART-017");
    expect(detail.requiredGates).toContain("HG4");
    expect(detail.requiredEvidenceFamilies).toContain("runtime.receipt");
    expect(detail.executions.every((item) => item.evaluationId === "eval-mcp17")).toBe(true);
    expect(detail.executions.every((item) => item.bundleId === "bundle-cand-mcp17")).toBe(true);
  });

  it("keeps not-ready evaluations scoreless", () => {
    const notReady = evaluationSummaries.find((item) => item.readiness === "not_ready");
    expect(notReady?.qualityScore).toBeNull();
    expect(notReady?.scoreStatus).toBe("not_ready");
  });

  it("marks incomplete bundles and session lifecycle examples explicitly", () => {
    expect(evidenceBundleSummaries.some((item) => item.missingFamilies.length > 0)).toBe(true);
    expect(alertRecords.map((item) => item.status)).toEqual(expect.arrayContaining(["open", "acknowledged", "resolved"]));
    expect(resourceDetails.profile.status).toContain("draft");
  });
});

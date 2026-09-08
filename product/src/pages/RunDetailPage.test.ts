import { describe, expect, it } from "vitest";
import { plannedRerunCases } from "./RunDetailPage";

describe("RunDetailPage rerun case planning", () => {
  it("keeps unmaterialized planned cases selectable after an early Run failure", () => {
    expect(plannedRerunCases(
      ["UGV-NODE-001", "UGV-CORE-001", "UGV-MCP-003", "UGV-XCHAIN-003"],
      [{ repetitionId: "rep-node", caseId: "UGV-NODE-001" }],
    )).toEqual([
      { caseId: "UGV-NODE-001", terminalState: null },
      { caseId: "UGV-CORE-001", terminalState: null },
      { caseId: "UGV-MCP-003", terminalState: null },
      { caseId: "UGV-XCHAIN-003", terminalState: null },
    ]);
  });
});

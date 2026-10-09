import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CaseDiagnosticEvaluationPanel } from "./CaseDiagnosticEvaluationPanel";
import { caseDiagnosticEvaluationFrom } from "../api/caseDiagnosticEvaluation";
import { observedEvaluationFrom } from "../api/observedEvaluation";
import caseV1 from "../test/fixtures/case-diagnostic-v1.json";
import caseV2 from "../test/fixtures/case-diagnostic-v2.json";
import observedWire from "../test/fixtures/observed-real-move.json";

const current = caseDiagnosticEvaluationFrom(caseV2)!;
const observed = observedEvaluationFrom(observedWire)!;
afterEach(cleanup);

describe("ordinary Case presentation (Server scores only)", () => {
  it("shows v2 100/100% and 8 PASS/2 N/A without promoting Candidate or formal success", () => {
    render(<CaseDiagnosticEvaluationPanel value={current} observed={observed} strictPassed={false} />);
    expect(screen.getByTestId("case-score")).toHaveTextContent("100.0");
    expect(screen.getByTestId("case-coverage")).toHaveTextContent("100%");
    expect(screen.getByTestId("case-verdict")).toHaveTextContent("Case PASS");
    expect(screen.getByText("8 / 8 可判 · 2 N/A")).toBeInTheDocument();
    expect(screen.getByText("8 PASS · 0 FAIL · 0 UNKNOWN")).toBeInTheDocument();
    expect(screen.getByTestId("case-task-outcome")).toHaveTextContent("INCONCLUSIVE");
    expect(screen.getByTestId("case-formal-qualification")).toHaveTextContent("NOT_GRANTED");
    expect(screen.getAllByText("N/A", { exact: true })).toHaveLength(2);
    expect(screen.queryByText("已通过")).not.toBeInTheDocument();
  });
  it("keeps historical v1 score/25%/INCONCLUSIVE and does not invent v2 quality", () => {
    render(<CaseDiagnosticEvaluationPanel value={caseDiagnosticEvaluationFrom(caseV1)!} observed={observed} />);
    expect(screen.getByTestId("case-score")).toHaveTextContent("100.0");
    expect(screen.getByTestId("case-coverage")).toHaveTextContent("25%");
    expect(screen.getByTestId("case-verdict")).toHaveTextContent("Case INCONCLUSIVE");
    expect(screen.getByText(/v1 · 严格证据政策/)).toBeInTheDocument();
    expect(screen.queryByText("来源范围与证据质量（不影响普通 Case 计分）")).not.toBeInTheDocument();
  });
  it("shows legitimate zero and FAIL alongside unknown rules without hiding partial coverage", () => {
    render(<CaseDiagnosticEvaluationPanel value={{ ...current, ruleScore: { numerator: "0", denominator: "1" }, displayScore: "0.000000", coverage: { numerator: "1", denominator: "8" }, caseVerdict: "FAIL", resultStatus: "PARTIAL_SCORED", scoredCount: 1, passCount: 0, failCount: 1, insufficientCount: 7,
      rules: current.rules.map((rule) => ({ ...rule, result: rule.result === "not_applicable" ? "not_applicable" : rule.ruleId === "UGV-DG-IDENTITY-01" ? "fail" : "insufficient_evidence" })) } as typeof current} />);
    expect(screen.getByTestId("case-score")).toHaveTextContent("0.0");
    expect(screen.getByTestId("case-coverage")).toHaveTextContent("12.5%");
    expect(screen.getByTestId("case-verdict")).toHaveTextContent("Case FAIL");
    expect(screen.getAllByText("UNKNOWN · 数据不足", { exact: true })).toHaveLength(7);
  });
  it.each(["NO_DATA", "NOT_APPLICABLE", "INVALID_INPUT"] as const)("keeps %s as unavailable score, not numeric zero", (resultStatus) => {
    render(<CaseDiagnosticEvaluationPanel value={{ ...current, resultStatus, ruleScore: null, displayScore: null, coverage: resultStatus === "NO_DATA" ? { numerator: "0", denominator: "1" } : null }} />);
    expect(screen.getByTestId("case-score")).toHaveTextContent("—");
    expect(screen.getByTestId("case-coverage")).toHaveTextContent(resultStatus === "NO_DATA" ? "0%" : "—");
  });
  it("discloses quality/limitations independently and leaves score unchanged when opened", () => {
    render(<CaseDiagnosticEvaluationPanel value={current} observed={observed} />);
    expect(screen.getByText("SAME_ORIGIN_MIRRORS_NOT_INDEPENDENT")).toBeInTheDocument();
    expect(screen.getByText("CONFIGURED_NOT_MEASURED")).toBeInTheDocument();
    expect(screen.getByText("BOUNDED_RECORDED_ONLY")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /数据限制（23）/ }));
    expect(screen.getAllByText("RAW_SOCKET_PAYLOAD_BODY_NOT_ARCHIVED").length).toBeGreaterThan(0);
    expect(screen.getAllByText("UNPROVEN_ZERO_CENSUS:fire").length).toBeGreaterThan(0);
    expect(screen.getByTestId("case-score")).toHaveTextContent("100.0");
    expect(screen.getByTestId("case-coverage")).toHaveTextContent("100%");
  });
  it("shows archived end state and unknown Agent terminal achievement separately", () => {
    render(<CaseDiagnosticEvaluationPanel value={current} observed={observed} />);
    fireEvent.click(screen.getByRole("button", { name: /已记录物理末态/ }));
    expect(screen.getByText("UNKNOWN · null")).toBeInTheDocument();
    expect(screen.getByText("7015 ms")).toBeInTheDocument();
    expect(screen.getByText("2 m")).toBeInTheDocument();
    expect(screen.getByText("REFEREE_RECEIVED_AT / referee_ingress_clock")).toBeInTheDocument();
    expect(screen.getByTestId("case-task-outcome")).toHaveTextContent("INCONCLUSIVE");
  });
  it("does not invent Candidate or formal results when observedEvaluation is absent", () => {
    render(<CaseDiagnosticEvaluationPanel value={current} />);
    const region = screen.getByRole("region", { name: "普通 Case 评测" });
    expect(within(region).getByTestId("case-task-outcome")).toHaveTextContent("unavailable");
    expect(within(region).getByTestId("case-formal-qualification")).toHaveTextContent("unavailable");
    expect(within(region).queryByText("NOT_GRANTED")).not.toBeInTheDocument();
  });
});

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ObservedEvaluationPanel } from "./ObservedEvaluationPanel";
import { mockObservedEvaluation } from "../mocks/observedEvaluation";

afterEach(cleanup);
describe("ordinary evidence-aware result", () => {
  it("shows 100 with 6% coverage, never a green overall-pass progress bar", () => {
    const { container } = render(<ObservedEvaluationPanel value={mockObservedEvaluation} />);
    expect(screen.getByTestId("observed-score")).toHaveTextContent("100.0");
    expect(screen.getByTestId("observed-coverage")).toHaveTextContent("6%");
    expect(screen.getByText("6 / 100 权重")).toBeInTheDocument();
    expect(screen.getByText("1 / 15 指标")).toBeInTheDocument();
    expect(screen.getByText(/部分评分 · PARTIAL_SCORED/)).toBeInTheDocument();
    expect(screen.getByText("INCONCLUSIVE")).toBeInTheDocument();
    expect(screen.getByText("NOT_GRANTED")).toBeInTheDocument();
    expect(container.querySelector(".ant-progress, .ant-tag-green")).toBeNull();
    expect(screen.queryByText("已通过")).not.toBeInTheDocument();
  });
  it("shows M1=2 while UNKNOWN metrics have no numeric zero", () => {
    render(<ObservedEvaluationPanel value={mockObservedEvaluation} />);
    expect(screen.getByTestId("observed-raw-M1")).toHaveTextContent("2");
    for (let i = 2; i <= 15; i++) expect(screen.getByTestId(`observed-raw-M${i}`)).toHaveTextContent("—");
    expect(screen.getAllByText("UNKNOWN · 数据不足")).toHaveLength(14);
  });
  it("retains legitimate zero, local blocked and not-applicable metric states", () => {
    const data = structuredClone(mockObservedEvaluation);
    data.metrics[0].rawScore = 0;
    data.metrics[1].status = "BLOCKED";
    data.metrics[2].status = "NOT_APPLICABLE";
    render(<ObservedEvaluationPanel value={data} />);
    expect(screen.getByTestId("observed-raw-M1")).toHaveTextContent("0");
    expect(screen.getByText("BLOCKED · 局部阻塞")).toBeInTheDocument();
    expect(screen.getByText("NOT_APPLICABLE · 不适用")).toBeInTheDocument();
  });
  it("shows NO_DATA and zero coverage, not a zero score", () => {
    render(<ObservedEvaluationPanel value={{ ...mockObservedEvaluation, scoreStatus: "NO_DATA", displayScore: null, observedScore: null, coverage: { numerator: "0", denominator: "1" }, scoredMetrics: [], scoredWeight: 0 }} />);
    expect(screen.getByTestId("observed-score")).toHaveTextContent("—");
    expect(screen.getByTestId("observed-coverage")).toHaveTextContent("0%");
    expect(screen.getByText(/NO_DATA/)).toBeInTheDocument();
  });
  it.each(["NOT_APPLICABLE", "INVALID_INPUT"] as const)("shows %s without an invented score", (scoreStatus) => {
    render(<ObservedEvaluationPanel value={{ ...mockObservedEvaluation, scoreStatus, observedScore: null, displayScore: null, coverage: null }} />);
    expect(screen.getByTestId("observed-score")).toHaveTextContent("—");
    expect(screen.getByTestId("observed-coverage")).toHaveTextContent("—");
    expect(screen.getByText(new RegExp(scoreStatus))).toBeInTheDocument();
  });
  it("preserves unmapped limitation codes when expanded", () => {
    render(<ObservedEvaluationPanel value={mockObservedEvaluation} />);
    expect(screen.getByText(/部分指标缺少可评分数据/)).toBeInTheDocument();
    expect(screen.queryByText("UNKNOWN_REASON_FROM_SERVER")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "展开全部 5 条限制" }));
    expect(screen.getByText("UNKNOWN_REASON_FROM_SERVER")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "普通评测" })).getByText("NOT_GRANTED")).toBeInTheDocument();
  });
});

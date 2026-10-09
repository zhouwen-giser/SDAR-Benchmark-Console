import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { consoleApi } from "../api/consoleApi";
import { capabilityMeta } from "../api/capability-map";
import { mapEvaluationHeader, mapEvaluationSummary } from "../api/viewModelMappers";
import { EvaluationPage } from "./EvaluationPage";
import { EvaluationsPage } from "./EvaluationsPage";
import type { EvaluationSummary as WireEvaluationSummary } from "../api/generated/model";
import caseV1 from "../test/fixtures/case-diagnostic-v1.json";
import caseV2 from "../test/fixtures/case-diagnostic-v2.json";
import observed from "../test/fixtures/observed-real-move.json";

const row = { evaluationId: "revision-19", subjectId: "archived-episode", evaluationReadiness: "not_ready", scoreStatus: "unavailable", qualityScore: null, level: "NR", passed: false, observedEvaluation: observed, caseDiagnosticEvaluation: caseV2 };
const resource = <T,>(data: T) => ({ data, meta: capabilityMeta("evaluation", { mocked: true }) });
function page(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.spyOn(consoleApi, "getEvaluationReadiness").mockResolvedValue(resource({ sourceEvidenceReadiness: "not_ready", evaluationReadiness: "not_ready", missingFamilies: [], conflictingFamilies: [], reasonCodes: [] }));
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><Routes><Route path="/evaluations" element={<EvaluationsPage />} /><Route path="/evaluations/:evaluationId" element={<EvaluationPage />} /></Routes></MemoryRouter></QueryClientProvider>);
}
afterEach(() => {
  cleanup();
  // Restore only this test's API spies; keep the shared browser shims intact.
  for (const method of [consoleApi.getEvaluationHeader, consoleApi.getEvaluationReadiness, consoleApi.listEvaluations]) {
    if (vi.isMockFunction(method)) method.mockRestore();
  }
});

describe("existing Evaluation pages with the optional ordinary Case result", () => {
  it("makes Case v2 primary, retains M=100/6% separately and leaves strict passed false", async () => {
    vi.spyOn(consoleApi, "getEvaluationHeader").mockResolvedValue(resource(mapEvaluationHeader(row)));
    page("/evaluations/revision-19");
    expect(await screen.findByTestId("case-score")).toHaveTextContent("100.0");
    expect(screen.getByTestId("case-coverage")).toHaveTextContent("100%");
    expect(screen.getByTestId("observed-score")).toHaveTextContent("100.0");
    expect(screen.getByTestId("observed-coverage")).toHaveTextContent("6%");
    expect(screen.getByRole("region", { name: "M 指标观察评测" })).toBeInTheDocument();
    expect(screen.getByTestId("observed-raw-M2")).toHaveTextContent("—");
    expect(screen.getByTestId("case-formal-qualification")).toHaveTextContent("NOT_GRANTED");
    fireEvent.click(screen.getByRole("button", { name: /严格评分 \/ 专家诊断/ }));
    expect(await screen.findByText("严格评分 · qualityScore")).toBeInTheDocument();
    expect(screen.getByText("未通过")).toBeInTheDocument();
  });
  it("shows Case fields in the list without mixing v1/v2/M or granting formal scoring", async () => {
    const rows = [row, { ...row, evaluationId: "historical-v1", caseDiagnosticEvaluation: caseV1 }, { ...row, evaluationId: "legacy-no-case", caseDiagnosticEvaluation: undefined }];
    vi.spyOn(consoleApi, "listEvaluations").mockResolvedValue(resource(rows.map((item) => mapEvaluationSummary(item as unknown as WireEvaluationSummary))));
    page("/evaluations");
    const currentRow = (await screen.findByRole("button", { name: "revision-19" })).closest("tr")!;
    expect(within(currentRow).getByText("覆盖 100%")).toBeInTheDocument();
    expect(within(currentRow).getByText("覆盖 6%")).toBeInTheDocument();
    expect(within(currentRow).getByText("Case PASS")).toBeInTheDocument();
    expect(within(currentRow).getByText("UGV-CORE-001")).toBeInTheDocument();
    const historicalRow = screen.getByRole("button", { name: "historical-v1" }).closest("tr")!;
    expect(within(historicalRow).getByText("覆盖 25%")).toBeInTheDocument();
    expect(within(historicalRow).getByText("Case INCONCLUSIVE")).toBeInTheDocument();
    const legacyRow = screen.getByRole("button", { name: "legacy-no-case" }).closest("tr")!;
    expect(within(legacyRow).queryByText(/Case PASS|Case INCONCLUSIVE/)).not.toBeInTheDocument();
    expect(within(legacyRow).getByText("覆盖 6%")).toBeInTheDocument();
  });
  it("keeps PG-only detail available and does not manufacture missing strict fields or evidence links", async () => {
    vi.spyOn(consoleApi, "getEvaluationHeader").mockResolvedValue(resource(mapEvaluationHeader({ evaluationId: row.evaluationId, projectionStatus: "pending", caseDiagnosticEvaluation: caseV2, observedEvaluation: observed })));
    page("/evaluations/revision-19");
    expect(await screen.findByTestId("case-score")).toHaveTextContent("100.0");
    expect(screen.getByRole("button", { name: /打开证据包/ })).toBeDisabled();
    expect(screen.getByText(/投影等待中/)).toBeInTheDocument();
    expect(screen.getByTestId("case-verdict")).toHaveTextContent("Case PASS");
  });
  it("retains the existing observed-only detail without a synthetic Case panel", async () => {
    vi.spyOn(consoleApi, "getEvaluationHeader").mockResolvedValue(resource(mapEvaluationHeader({ ...row, caseDiagnosticEvaluation: undefined })));
    page("/evaluations/legacy-no-case");
    expect(await screen.findByTestId("observed-score")).toHaveTextContent("100.0");
    expect(screen.queryByTestId("case-score")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "普通评测" })).toBeInTheDocument();
  });
});

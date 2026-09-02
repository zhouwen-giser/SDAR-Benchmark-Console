import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DiagnosticOutcomeDistributionPanel } from "./DiagnosticOutcomeDistributionPanel";

afterEach(cleanup);

describe("DiagnosticOutcomeDistributionPanel", () => {
  it("keeps diagnostic outcomes separate from formal scores", () => {
    render(<DiagnosticOutcomeDistributionPanel value={{
      schemaVersion: "sdar-benchmark.diagnostic-outcome-distribution/v1",
      dataClass: "development_substituted",
      total: 12,
      passed: 0,
      failed: 0,
      indeterminate: 12,
      cancelled: 0,
      completedWithSubstitutions: 12,
      groupBy: "run",
      watermark: null,
    }} />);
    expect(screen.getByText("development_substituted")).toBeInTheDocument();
    expect(screen.getByText("Indeterminate")).toBeInTheDocument();
    expect(screen.getByText("With substitutions")).toBeInTheDocument();
    expect(screen.queryByText(/quality score/i)).not.toBeInTheDocument();
  });
});

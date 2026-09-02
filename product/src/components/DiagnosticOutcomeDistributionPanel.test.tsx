import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DiagnosticOutcomeDistributionPanel } from "./DiagnosticOutcomeDistributionPanel";

afterEach(cleanup);

describe("DiagnosticOutcomeDistributionPanel", () => {
  it("keeps diagnostic outcomes separate from formal scores", () => {
    render(<DiagnosticOutcomeDistributionPanel rows={[{
      outcome: "completed_with_substitutions",
      count: 12,
      substitutedCount: 12,
      fixtureCount: 0,
      formalEligible: false,
      lastObservedAt: "2026-09-03T00:00:00Z",
    }]} />);
    expect(screen.getByText("completed_with_substitutions")).toBeInTheDocument();
    expect(screen.getAllByText("Substituted").length).toBeGreaterThan(0);
    expect(screen.getByText("false")).toBeInTheDocument();
    expect(screen.queryByText(/quality score/i)).not.toBeInTheDocument();
  });
});

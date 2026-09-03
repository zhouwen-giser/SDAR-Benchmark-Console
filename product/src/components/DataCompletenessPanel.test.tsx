import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DataCompletenessPanel } from "./DataCompletenessPanel";

afterEach(cleanup);

describe("DataCompletenessPanel", () => {
  it("renders typed coverage and explicit formal unavailability", () => {
    render(<DataCompletenessPanel value={{
      schemaVersion: "sdar-benchmark.data-completeness/v1",
      generatedAt: "2026-09-03T00:00:00.000Z",
      overallStatus: "partial",
      sections: [
        { sectionId: "registry", status: "complete", expectedCount: 3, availableCount: 3, reasonCodes: [] },
        { sectionId: "run", status: "complete", expectedCount: 12, availableCount: 12, reasonCodes: [] },
        { sectionId: "projection", status: "partial", expectedCount: 12, availableCount: 10, reasonCodes: ["PROJECTION_LAG"] },
        { sectionId: "identity", status: "partial", expectedCount: 12, availableCount: 8, reasonCodes: ["UNKNOWN_PROVIDER_IDENTITY"] },
        { sectionId: "artifact", status: "complete", expectedCount: 36, availableCount: 36, reasonCodes: [] },
        { sectionId: "formal", status: "unavailable", expectedCount: 12, availableCount: 0, reasonCodes: ["NO_FORMAL_SCORES"] },
      ],
    }} />);
    expect(screen.getByText("Registry")).toBeInTheDocument();
    expect(screen.getByText("Run Authority")).toBeInTheDocument();
    expect(screen.getByText("Analytics Projection")).toBeInTheDocument();
    expect(screen.getByText("Identity")).toBeInTheDocument();
    expect(screen.getByText("Artifact")).toBeInTheDocument();
    expect(screen.getByText("Formalization")).toBeInTheDocument();
    expect(screen.getByText("NO_FORMAL_SCORES")).toBeInTheDocument();
    expect(screen.queryByText(/\{\"/)).not.toBeInTheDocument();
  });
});

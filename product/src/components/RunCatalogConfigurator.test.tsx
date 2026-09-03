import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RunCatalogConfigurator } from "./RunCatalogConfigurator";

afterEach(cleanup);

describe("RunCatalogConfigurator", () => {
  it("keeps server-driven subset order editable", () => {
    const onChange = vi.fn();
    render(<RunCatalogConfigurator
      presets={[{ id: "regression/0.2", label: "Regression", datasetVersionRef: "dataset/0.2", candidateSnapshotRef: "candidate/0.2", candidateSnapshotRefs: ["candidate/0.2"], selectedCaseIds: ["UGV-NODE-002", "UGV-CORE-003"], repeatCount: 3, dataClass: "development_substituted" }]}
      datasets={[{ id: "dataset/0.2", label: "Dataset 0.2" }]}
      candidates={[{ id: "candidate/0.2", label: "Candidate 0.2" }]}
      cases={[{ caseId: "UGV-NODE-002", label: "stale telemetry", track: "NODE" }, { caseId: "UGV-CORE-003", label: "physical closure", track: "CORE" }]}
      value={{ presetId: "regression/0.2", datasetVersionRef: "dataset/0.2", candidateSnapshotRef: "candidate/0.2", target: "simulated", selectedCaseIds: ["UGV-NODE-002", "UGV-CORE-003"], repeatCount: 3 }}
      onChange={onChange}
    />);
    expect(screen.getByText("stale telemetry")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "UGV-NODE-002 down" }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ selectedCaseIds: ["UGV-CORE-003", "UGV-NODE-002"] }));
  });
});

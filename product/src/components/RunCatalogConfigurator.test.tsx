import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { executionTargetDefaults, RunCatalogConfigurator } from "./RunCatalogConfigurator";

afterEach(cleanup);

describe("RunCatalogConfigurator", () => {
  it("selects the complete accepted native policy when live-native is chosen", () => {
    expect(executionTargetDefaults("live_native")).toEqual({
      nativeRequirement: "require_native",
      telemetryPolicy: "require_full",
      observationTimePolicy: "require_source_observed_at",
      reconciliationPolicy: "automatic",
      streamingEnabled: true,
    });
    expect(executionTargetDefaults("simulated")).toEqual(expect.objectContaining({
      nativeRequirement: "prefer_native",
      telemetryPolicy: "allow_partial",
    }));
  });

  it("keeps server-driven subset order editable", () => {
    const onChange = vi.fn();
    render(<RunCatalogConfigurator
      presets={[{ id: "regression/0.2", label: "Regression", datasetVersionRef: "dataset/0.2", candidateSnapshotRef: "candidate/0.2", candidateSnapshotRefs: ["candidate/0.2"], selectedCaseIds: ["UGV-NODE-002", "UGV-CORE-003"], repeatCount: 3, dataClass: "development_substituted" }]}
      datasets={[{ id: "dataset/0.2", label: "Dataset 0.2" }]}
      candidates={[{ id: "candidate/0.2", label: "Candidate 0.2" }]}
      cases={[{ caseId: "UGV-NODE-002", label: "stale telemetry", track: "NODE" }, { caseId: "UGV-CORE-003", label: "physical closure", track: "CORE" }]}
      value={{ presetId: "regression/0.2", datasetVersionRef: "dataset/0.2", candidateSnapshotRef: "candidate/0.2", target: "simulated", nativeRequirement: "prefer_native", environmentId: "ugv-simulator-dev", resourceIds: ["vehicle:ugv1"], telemetryPolicy: "allow_partial", observationTimePolicy: "require_source_observed_at", reconciliationPolicy: "automatic", streamingEnabled: true, selectedCaseIds: ["UGV-NODE-002", "UGV-CORE-003"], repeatCount: 3 }}
      onChange={onChange}
    />);
    expect(screen.getByText("stale telemetry")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "UGV-NODE-002 down" }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ selectedCaseIds: ["UGV-CORE-003", "UGV-NODE-002"] }));
  });
});

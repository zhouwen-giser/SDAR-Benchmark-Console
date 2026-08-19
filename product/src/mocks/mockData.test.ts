import { describe, expect, it } from "vitest";
import apiCatalog from "../../api/api-catalog.json";
import { buildOverview } from "./mockData";

describe("mock adapter normalization", () => {
  it("preserves the frozen API catalog status counts", () => {
    const counts = apiCatalog.interfaces.reduce<Record<string, number>>((result, item) => {
      result[item.current_status] = (result[item.current_status] ?? 0) + 1;
      return result;
    }, {});
    expect(apiCatalog.interfaces).toHaveLength(99);
    expect(counts).toEqual({ EXISTING: 8, EXTEND: 15, NEW: 70, BLOCKED_DATA: 5, EXTERNAL: 1 });
  });

  it("fills the required mock-derived M1–M15 matrix explicitly", () => {
    const snapshot = buildOverview("blocked", "loaded");
    expect(snapshot.metricHeatmap).toHaveLength(75);
    expect(snapshot.snapshot.dataStatus).toBe("complete");
  });

  it("calibrates the READY trend endpoint to the READY KPIs", () => {
    const snapshot = buildOverview("ready", "loaded");
    expect(snapshot.qualityTrend.at(-1)?.meanScore).toBe(snapshot.kpis.qualityScore);
    expect(snapshot.qualityTrend.at(-1)?.passRate).toBe(snapshot.kpis.passRate);
  });

  it("never exposes a formal score in INVALID", () => {
    const snapshot = buildOverview("invalid", "loaded");
    expect(snapshot.kpis.qualityScore).toBeNull();
    expect(snapshot.kpis.passRate).toBeNull();
    expect(snapshot.regressionWaterfall).toBeNull();
    expect(snapshot.scoreDistribution).toBeNull();
    expect(snapshot.releaseGate.status).toBe("invalid");
  });

  it("marks retained data as stale and partial data as invalid", () => {
    const stale = buildOverview("blocked", "stale");
    const partial = buildOverview("blocked", "partial");
    expect(stale.snapshot.dataStatus).toBe("stale");
    expect(stale.snapshot.projectionLagMs).toBe(68_000);
    expect(partial.snapshot.dataStatus).toBe("partial");
    expect(partial.releaseGate.status).toBe("invalid");
    expect(partial.snapshot.moduleErrors).toHaveLength(2);
  });
});

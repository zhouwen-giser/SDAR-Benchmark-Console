import { describe, expect, it } from "vitest";
import sourceLock from "../../api/benchmark-server.openapi.source-lock.json";
import { apiCapabilityMap } from "../api/capability-map";
import { buildOverview } from "./mockData";

describe("mock adapter normalization", () => {
  it("pins the frozen v0.2 125-operation server contract", () => {
    expect(sourceLock.operationCount).toBe(125);
    expect(sourceLock.openapiSha256).toBe("92edbd609860b2dc8f38c123a10a4faf5d6a97355797ac43c4ae6dae30c5ca15");
    expect(apiCapabilityMap.overview.operationId).toBe("getDashboardOverview");
    expect(apiCapabilityMap.evidenceUsage.operationId).toBe("getEvidenceBundlesByBundleIdUsage");
    expect(apiCapabilityMap.reportDownload.operationId).toBe("getReportsByReportIdDownload");
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

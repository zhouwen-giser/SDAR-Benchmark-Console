import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { setupServer } from "msw/node";
import { HttpConsoleApi } from "./consoleApi";
import { handlers } from "../mocks/handlers";

const server = setupServer(...handlers);
const api = new HttpConsoleApi("http://127.0.0.1:18090");

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("HttpConsoleApi + MSW contract", () => {
  it("filters the Evaluation collection through serialized API parameters", async () => {
    const result = await api.listEvaluations({ track: "mcp", risk: "critical" });
    expect(result.data.map((item) => item.evaluationId)).toEqual(["eval-mcp17"]);
    expect(result.meta.mocked).toBe(false);
    expect(result.meta.watermark).toBe("2026-08-15T20:31:42Z");
  });

  it("serves Case, Evaluation and Evidence detail contracts", async () => {
    const caseDetail = await api.getCase("MCP-RESTART-017");
    const evaluation = await api.getEvaluation("eval-skill10");
    const evidence = await api.getEvidence("bundle-cand-mcp15");

    expect(caseDetail.data.requiredGates).toContain("HG4");
    expect(evaluation.data.caseId).toBe("SKILL-AREA-010");
    expect(evaluation.data.qualityScore).toBe(55);
    expect(evidence.data.status).toBe("partial");
    expect(evidence.data.missingFamilies).toContain("provider.diagnostic");
  });

  it("supports extended Analytics, System and registry resource endpoints", async () => {
    const analytics = await api.getAnalytics({ scenario: "ready", dataState: "loaded" });
    const system = await api.getSystemWorkspace();
    const candidate = await api.getResource("candidate", "cand-142-def456");

    expect(analytics.data.releaseGate.status).toBe("ready");
    expect(system.data.services.length).toBeGreaterThan(0);
    expect(candidate.data.kind).toBe("candidate");
  });

  it("filters Evidence collections without silently replacing the response shape", async () => {
    const result = await api.listEvidenceBundles({ status: "partial", family: "missing" });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].bundleId).toBe("bundle-cand-mcp15");
  });
});

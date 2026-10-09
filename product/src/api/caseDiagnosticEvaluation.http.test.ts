import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { HttpConsoleApi } from "./consoleApi";
import { caseDiagnosticEvaluationFrom } from "./caseDiagnosticEvaluation";
import caseV1 from "../test/fixtures/case-diagnostic-v1.json";
import caseV2 from "../test/fixtures/case-diagnostic-v2.json";
import observed from "../test/fixtures/observed-real-move.json";

const base = "http://benchmark.case.test";
const api = new HttpConsoleApi(base);
const server = setupServer();
const row = { evaluationId: "existing-case-evaluation", subjectId: "original-episode", profileVersionId: "native-profile", bundleSnapshotId: "bundle-real",
  evaluationReadiness: "not_ready", scoreStatus: "unavailable", qualityScore: null, level: "NR", passed: false, observedEvaluation: observed };
const envelope = (data: unknown) => ({ data, availability: { status: "available", reasonCodes: [], unavailableFields: [] }, warnings: [], contracts: [], generatedAt: "2026-10-09T00:00:00Z" });
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("existing optional Case v1/v2 HTTP field", () => {
  it.each([caseV1, caseV2])("preserves policy $policyRef.version through list/detail without replacing strict or M results", async (caseDiagnosticEvaluation) => {
    server.use(
      http.get(`${base}/v1/evaluations`, () => HttpResponse.json(envelope([{ ...row, caseDiagnosticEvaluation }]))),
      http.get(`${base}/v1/evaluations/:id`, () => HttpResponse.json(envelope({ ...row, caseDiagnosticEvaluation }))),
    );
    const list = await api.listEvaluations();
    const detail = await api.getEvaluationHeader(row.evaluationId);
    for (const result of [list.data[0], detail.data]) {
      expect(result.caseDiagnosticEvaluation).toEqual(caseDiagnosticEvaluation);
      expect(result.caseId).toBe("UGV-CORE-001");
      expect(result.observedEvaluation).toEqual(observed);
      expect(result.qualityScore).toBeNull();
    }
    expect(detail.data.passed).toBe(false);
    expect(detail.data.scoreStatus).toBe("unavailable");
    expect(detail.meta).toMatchObject({ mocked: false, mode: "http", status: "existing" });
  });
  it.each([null, undefined])("keeps old records without Case (%s) on the old path", async (caseDiagnosticEvaluation) => {
    server.use(http.get(`${base}/v1/evaluations/:id`, () => HttpResponse.json(envelope({ ...row, caseDiagnosticEvaluation }))));
    const detail = await api.getEvaluationHeader(row.evaluationId);
    expect(detail.data.caseDiagnosticEvaluation).toBeUndefined();
    expect(detail.data.observedEvaluation).toEqual(observed);
    expect(detail.data.caseId).toBe("original-episode");
  });
  it("keeps PG-only Case results available while strict projection is pending", async () => {
    server.use(http.get(`${base}/v1/evaluations/:id`, () => HttpResponse.json(envelope({ evaluationId: row.evaluationId, projectionStatus: "pending", observedEvaluation: observed, caseDiagnosticEvaluation: caseV2 }))));
    const detail = await api.getEvaluationHeader(row.evaluationId);
    expect(detail.data.caseDiagnosticEvaluation).toEqual(caseV2);
    expect(detail.data.observedEvaluation?.coverage).toEqual({ numerator: "3", denominator: "50" });
    expect(detail.data.projectionStatus).toBe("pending");
    expect(detail.data.passed).toBeNull();
    expect(detail.data.qualityScore).toBeNull();
  });
  it("passes the optional Case through the existing aggregated detail", async () => {
    server.use(
      http.get(`${base}/v1/evaluations/:id`, () => HttpResponse.json(envelope({ ...row, caseDiagnosticEvaluation: caseV2 }))),
      http.get(`${base}/v1/evaluations/:id/readiness`, () => HttpResponse.json(envelope({ sourceEvidenceReadiness: "not_ready", evaluationReadiness: "not_ready", missingFamilies: [], conflictingFamilies: [], reasonCodes: [] }))),
      ...["fatals", "hard-gates", "metrics", "dimensions", "findings"].map((path) => http.get(`${base}/v1/evaluations/:id/${path}`, () => HttpResponse.json(envelope([])))),
    );
    const result = await api.getEvaluation(row.evaluationId);
    expect(result.data.caseDiagnosticEvaluation).toEqual(caseV2);
    expect(result.data.observedEvaluation).toEqual(observed);
    expect(result.data.passed).toBe(false);
  });
  it.each([
    { ...caseV2, schemaVersion: "unknown-version" },
    { ...caseV2, policyRef: caseV1.policyRef },
    { ...caseV2, formalEligible: true },
    { ...caseV2, evidenceQuality: { ...caseV2.evidenceQuality, missingProofs: null } },
  ])("rejects incompatible Case data rather than fabricating a result or falling back to Mock", async (caseDiagnosticEvaluation) => {
    server.use(http.get(`${base}/v1/evaluations/:id`, () => HttpResponse.json(envelope({ ...row, caseDiagnosticEvaluation }))));
    await expect(api.getEvaluationHeader(row.evaluationId)).rejects.toThrow(/caseDiagnosticEvaluation.*no mock fallback/);
  });
  it("does not convert malformed fractions or missing rule inputs to zero", () => {
    expect(() => caseDiagnosticEvaluationFrom({ ...caseV2, coverage: { numerator: "1", denominator: "0" } })).toThrow();
    expect(() => caseDiagnosticEvaluationFrom({ ...caseV2, rules: [{ ...caseV2.rules[0], evidenceRefs: null }] })).toThrow();
  });
});

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { HttpConsoleApi } from "./consoleApi";
import realMove from "../test/fixtures/observed-real-move.json";

const base = "http://benchmark.observed.test";
const api = new HttpConsoleApi(base);
const server = setupServer();
const row = { evaluationId: "real-archive-evaluation", subjectId: "real-move-episode", origin: "operational",
  profileVersionId: "native-profile", bundleSnapshotId: "bundle-real", evaluationReadiness: "not_ready",
  scoreStatus: "unavailable", qualityScore: null, level: "NR", passed: false, observedEvaluation: realMove };
const envelope = (data: unknown) => ({ data, availability: { status: "available", reasonCodes: [], unavailableFields: [] }, warnings: [], contracts: [], generatedAt: "2026-09-30T00:00:00Z" });
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("actual additive observedEvaluation wire shape", () => {
  it("preserves receipt fields through existing list and detail adapters without changing strict scores", async () => {
    server.use(
      http.get(`${base}/v1/evaluations`, () => HttpResponse.json(envelope([row]))),
      http.get(`${base}/v1/evaluations/:id`, () => HttpResponse.json(envelope(row))),
    );
    const list = await api.listEvaluations();
    const detail = await api.getEvaluationHeader(row.evaluationId);
    for (const data of [list.data[0], detail.data]) {
      expect(data.observedEvaluation).toEqual(realMove);
      expect(data.qualityScore).toBeNull();
      expect(data.observedEvaluation?.metrics[0]).toMatchObject({ metricId: "M1", rawScore: 2, status: "SCORED" });
      expect(data.observedEvaluation?.coverage).toEqual({ numerator: "3", denominator: "50" });
    }
    expect(detail.data.scoreStatus).toBe("unavailable");
    expect(detail.meta).toMatchObject({ mocked: false, mode: "http", status: "existing" });
    expect(list.meta.status).toBe("existing");
  });
  it.each([undefined, null])("keeps legacy records without the additive field (%s)", async (observedEvaluation) => {
    server.use(http.get(`${base}/v1/evaluations/:id`, () => HttpResponse.json(envelope({ ...row, observedEvaluation }))));
    expect((await api.getEvaluationHeader(row.evaluationId)).data.observedEvaluation).toBeUndefined();
  });
  it("renders the PG pending-projection detail without inventing strict fields", async () => {
    server.use(http.get(`${base}/v1/evaluations/:id`, () => HttpResponse.json(envelope({ evaluationId: row.evaluationId, projectionStatus: "pending", observedEvaluation: realMove }))));
    const detail = await api.getEvaluationHeader(row.evaluationId);
    expect(detail.data.observedEvaluation).toEqual(realMove);
    expect(detail.data.projectionStatus).toBe("pending");
    expect(detail.data.qualityScore).toBeNull();
    expect(detail.data.passed).toBeNull();
  });
});

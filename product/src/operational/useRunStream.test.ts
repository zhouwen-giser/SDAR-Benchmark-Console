import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { consumeSse, parseSseFrame, useRunStream } from "./useRunStream";

vi.mock("../api/consoleApi", () => ({ currentApiMode: () => "http" }));

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("run SSE parser", () => {
  it("parses event ids, event names, and multiline payloads", () => {
    expect(parseSseFrame("id: run-19\nevent: case.changed\ndata: {\"a\":1,\ndata: \"b\":2}"))
      .toEqual({ id: "run-19", event: "case.changed", data: "{\"a\":1,\n\"b\":2}", comment: false });
  });

  it("recognizes heartbeat comment frames", () => {
    expect(parseSseFrame(": heartbeat")).toEqual({ id: null, event: null, data: "", comment: true });
  });

  it("consumes frames split across transport chunks", async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode("id: 1\ndata: one\n"));
        controller.enqueue(encoder.encode("\nid: 2\ndata: two\n\n"));
        controller.close();
      },
    });
    const values: string[] = [];
    await consumeSse(stream, (frame) => values.push(`${frame.id}:${frame.data}`));
    expect(values).toEqual(["1:one", "2:two"]);
  });

  it("resumes with Last-Event-ID and ignores the replayed boundary event", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(streamResponse([eventFrame("run-sse-resume", "1", 1)]))
      .mockResolvedValueOnce(
        streamResponse([
          eventFrame("run-sse-resume", "1", 1),
          eventFrame("run-sse-resume", "2", 2),
        ]),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { result, unmount } = renderHook(() => useRunStream({ runId: "run-sse-resume" }));
    await flushStreamWork();
    expect(result.current.events.map((event) => event.data.eventId)).toEqual(["1"]);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    await flushStreamWork();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[1]?.headers).toMatchObject({ "Last-Event-ID": "1" });
    expect(result.current.events.map((event) => event.data.eventId)).toEqual(["1", "2"]);
    expect(result.current.lastEventId).toBe("2");
    unmount();
  });

  it("bounds the client buffer and repairs event or authority revision gaps", async () => {
    vi.useFakeTimers();
    const repair = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        streamResponse([
          eventFrame("run-sse-gap", "1", 1),
          eventFrame("run-sse-gap", "3", 3),
          eventFrame("run-sse-gap", "4", 5),
        ]),
      ),
    );

    const { result, unmount } = renderHook(() =>
      useRunStream({ runId: "run-sse-gap", maxEvents: 2, onGapRepair: repair }),
    );
    await flushStreamWork();

    expect(result.current.events.map((event) => event.data.eventId)).toEqual(["3", "4"]);
    expect(result.current.droppedEventCount).toBe(1);
    expect(result.current.gapCount).toBe(2);
    expect(repair).toHaveBeenCalledTimes(2);
    unmount();
  });
});

function streamResponse(frames: string[]): Response {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(`${frames.join("\n\n")}\n\n`));
        controller.close();
      },
    }),
    { status: 200, headers: { "content-type": "text/event-stream" } },
  );
}

function eventFrame(runId: string, eventId: string, authorityRevision: number): string {
  const generatedAt = "2026-09-05T00:00:00.000Z";
  return [
    `id: ${eventId}`,
    "event: run.changed",
    `data: ${JSON.stringify({
      data: {
        eventId,
        eventType: "run.changed",
        runId,
        repetitionId: null,
        authorityRevision,
        occurredAt: generatedAt,
        receivedAt: generatedAt,
        source: "postgresql",
        dataClass: "development_native",
        payload: {},
        payloadRef: null,
      },
      meta: {
        schemaVersion: "sdar-benchmark.resource-envelope/v1",
        generatedAt,
        authority: "postgresql",
        dataClass: "development_native",
        availability: "available",
        formalEligible: false,
        revision: authorityRevision,
        watermark: generatedAt,
        projectionLagMs: 0,
        sourceRefs: [],
        reasonCodes: [],
        unavailableFields: [],
        warnings: [],
      },
    })}`,
  ].join("\n");
}

async function flushStreamWork(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

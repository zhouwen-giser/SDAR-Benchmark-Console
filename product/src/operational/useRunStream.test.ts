import { describe, expect, it } from "vitest";
import { consumeSse, parseSseFrame } from "./useRunStream";

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
});

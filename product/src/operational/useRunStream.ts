import { useEffect, useRef, useState } from "react";
import { BenchmarkApiTransport } from "../api/benchmarkApiTransport";
import { currentApiMode } from "../api/consoleApi";
import type { OperationalResource, RunStreamEventView } from "./types";

export type RunStreamState = "disabled" | "connecting" | "live" | "reconnecting" | "gap_repair" | "error";

export interface RunStreamSnapshot {
  state: RunStreamState;
  events: Array<OperationalResource<RunStreamEventView>>;
  lastEventId: string | null;
  lastHeartbeatAt: string | null;
  reconnectCount: number;
  droppedEventCount: number;
  gapCount: number;
  error: string | null;
}

interface UseRunStreamOptions {
  runId: string;
  enabled?: boolean;
  maxEvents?: number;
  onGapRepair?: () => void | Promise<void>;
}

interface SseFrame {
  id: string | null;
  event: string | null;
  data: string;
  comment: boolean;
}

const initialSnapshot: RunStreamSnapshot = {
  state: "disabled",
  events: [],
  lastEventId: null,
  lastHeartbeatAt: null,
  reconnectCount: 0,
  droppedEventCount: 0,
  gapCount: 0,
  error: null,
};

export function useRunStream({ runId, enabled = true, maxEvents = 200, onGapRepair }: UseRunStreamOptions): RunStreamSnapshot {
  const [snapshot, setSnapshot] = useState<RunStreamSnapshot>(initialSnapshot);
  const repairRef = useRef(onGapRepair);
  repairRef.current = onGapRepair;

  useEffect(() => {
    if (!enabled || currentApiMode() !== "http") {
      setSnapshot(initialSnapshot);
      return;
    }

    let disposed = false;
    let controller: AbortController | null = null;
    let reconnectTimer: number | null = null;
    let lastEventId: string | null = null;
    let reconnectCount = 0;
    const seenIds = new Set<string>();
    const authorityRevisions = new Map<string, number>();
    const transport = new BenchmarkApiTransport();

    const scheduleReconnect = () => {
      if (disposed) return;
      reconnectCount += 1;
      setSnapshot((current) => ({ ...current, state: "reconnecting", reconnectCount }));
      reconnectTimer = window.setTimeout(connect, Math.min(5_000, 400 * (2 ** Math.min(reconnectCount, 4))));
    };

    const triggerRepair = () => {
      setSnapshot((current) => ({ ...current, state: "gap_repair", gapCount: current.gapCount + 1 }));
      void Promise.resolve(repairRef.current?.()).finally(() => {
        if (!disposed) setSnapshot((current) => ({ ...current, state: "live" }));
      });
    };

    const acceptEnvelope = (envelope: OperationalResource<RunStreamEventView>, frameId: string | null) => {
      const eventId = frameId ?? envelope.data.eventId;
      if (!eventId || seenIds.has(eventId)) return;
      if (isStrictlyOlder(eventId, lastEventId)) return;

      const revision = envelope.data.authorityRevision;
      const revisionKey = envelope.data.repetitionId ?? envelope.data.runId;
      const previousRevision = authorityRevisions.get(revisionKey);
      const eventGap = hasNumericGap(lastEventId, eventId);
      const revisionGap = revision !== null && previousRevision !== undefined && revision > previousRevision + 1;
      if (revision !== null) authorityRevisions.set(revisionKey, Math.max(previousRevision ?? revision, revision));
      if (eventGap || revisionGap) triggerRepair();

      seenIds.add(eventId);
      lastEventId = eventId;
      setSnapshot((current) => {
        const nextEvents = [...current.events, envelope];
        const overflow = Math.max(0, nextEvents.length - maxEvents);
        const bounded = overflow > 0 ? nextEvents.slice(overflow) : nextEvents;
        if (overflow > 0) {
          for (const item of current.events.slice(0, overflow)) seenIds.delete(item.data.eventId);
        }
        return {
          ...current,
          state: "live",
          events: bounded,
          lastEventId: eventId,
          lastHeartbeatAt: envelope.data.eventType === "heartbeat" ? new Date().toISOString() : current.lastHeartbeatAt,
          droppedEventCount: current.droppedEventCount + overflow,
          error: null,
        };
      });
    };

    async function connect() {
      if (disposed) return;
      controller = new AbortController();
      setSnapshot((current) => ({ ...current, state: reconnectCount === 0 ? "connecting" : "reconnecting", error: null }));
      try {
        const response = await fetch(`${transport.baseUrl}/v1/benchmark-runs/${encodeURIComponent(runId)}/stream`, {
          headers: {
            Accept: "text/event-stream",
            ...(lastEventId ? { "Last-Event-ID": lastEventId } : {}),
          },
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok || !response.body) throw new Error(`SSE ${response.status || "stream unavailable"}`);
        reconnectCount = 0;
        setSnapshot((current) => ({ ...current, state: "live", reconnectCount, error: null }));
        await consumeSse(response.body, (frame) => {
          if (frame.comment) {
            setSnapshot((current) => ({ ...current, lastHeartbeatAt: new Date().toISOString() }));
            return;
          }
          if (!frame.data) return;
          try {
            const envelope = JSON.parse(frame.data) as OperationalResource<RunStreamEventView>;
            if (envelope?.data?.runId === runId) acceptEnvelope(envelope, frame.id);
            else triggerRepair();
          } catch {
            triggerRepair();
          }
        });
        scheduleReconnect();
      } catch (error) {
        if (disposed || controller.signal.aborted) return;
        setSnapshot((current) => ({ ...current, state: "error", error: error instanceof Error ? error.message : String(error) }));
        scheduleReconnect();
      }
    }

    void connect();
    return () => {
      disposed = true;
      controller?.abort();
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
    };
  }, [enabled, maxEvents, runId]);

  return snapshot;
}

export async function consumeSse(stream: ReadableStream<Uint8Array>, onFrame: (frame: SseFrame) => void): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/gu, "\n");
    let boundary = buffer.indexOf("\n\n");
    while (boundary >= 0) {
      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const frame = parseSseFrame(block);
      if (frame) onFrame(frame);
      boundary = buffer.indexOf("\n\n");
    }
    if (done) break;
  }
  const frame = parseSseFrame(buffer);
  if (frame) onFrame(frame);
}

export function parseSseFrame(block: string): SseFrame | null {
  if (!block.trim()) return null;
  let id: string | null = null;
  let event: string | null = null;
  const data: string[] = [];
  let comment = false;
  for (const line of block.split("\n")) {
    if (line.startsWith(":")) {
      comment = true;
      continue;
    }
    const separator = line.indexOf(":");
    const field = separator < 0 ? line : line.slice(0, separator);
    const value = separator < 0 ? "" : line.slice(separator + 1).replace(/^ /u, "");
    if (field === "id") id = value;
    if (field === "event") event = value;
    if (field === "data") data.push(value);
  }
  return { id, event, data: data.join("\n"), comment };
}

function numericSuffix(value: string | null): number | null {
  if (!value) return null;
  const match = /(?:^|[^0-9])([0-9]+)$/u.exec(value);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function hasNumericGap(previous: string | null, next: string): boolean {
  const before = numericSuffix(previous);
  const after = numericSuffix(next);
  return before !== null && after !== null && after > before + 1;
}

function isStrictlyOlder(next: string, previous: string | null): boolean {
  const before = numericSuffix(previous);
  const after = numericSuffix(next);
  return before !== null && after !== null && after <= before;
}

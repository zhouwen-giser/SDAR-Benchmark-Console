import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { MemoryRouter } from "react-router-dom";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { consoleApi } from "../api/consoleApi";
import { AppShell } from "../layouts/AppShell";
import { useAnalysisContext } from "./useAnalysisContext";

// A real HTTP adapter, with every network request intercepted locally by MSW.
vi.mock("../api/consoleApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/consoleApi")>();
  return { ...actual, consoleApi: new actual.HttpConsoleApi("http://console-context.test"), currentApiMode: () => "http" };
});

const base = "http://console-context.test";
const server = setupServer();
const clients: QueryClient[] = [];
const matchMedia = vi.mocked(window.matchMedia).getMockImplementation()!;
const emptyDefaults = { candidateSnapshotId: null, baselineId: null, datasetVersionRef: null, profileVersionId: null };
const context = (defaults: Record<string, string | null> = emptyDefaults) => ({
  data: { candidates: [], baselines: [], datasets: [], evaluationProfiles: [], runs: [], defaults },
  availability: { status: "available", reasonCodes: [], unavailableFields: [] },
});

function PageQuery() {
  const { filters, setFilters, navigateWithContext, setQueryParams } = useAnalysisContext();
  const overview = useQuery({ queryKey: ["overview", filters], queryFn: () => consoleApi.getOverview(filters) });
  return <>
    <output data-testid="context-filters">{JSON.stringify(filters)}</output>
    <output data-testid="http-result">{overview.data ? `${overview.data.meta.mode}/${overview.data.meta.mocked}` : "loading"}</output>
    <button onClick={() => setFilters({ candidateId: "" })}>清空候选</button>
    <button onClick={() => navigateWithContext("/analytics", { candidateId: "" })}>导航并清空</button>
    <button onClick={() => setQueryParams({ datasetVersion: "" })}>清空数据集参数</button>
  </>;
}

function mount(entry = "/overview") {
  vi.mocked(window.matchMedia).mockImplementation(matchMedia);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[entry]}><AppShell><PageQuery /></AppShell></MemoryRouter></QueryClientProvider>);
}
function captureOverview() {
  const urls: URL[] = [];
  server.use(http.get(`${base}/v1/dashboard/overview`, ({ request }) => {
    urls.push(new URL(request.url));
    return HttpResponse.json({ context: {}, snapshot: { dataStatus: "empty", moduleErrors: [] } });
  }));
  return urls;
}
const readFilters = () => JSON.parse(screen.getByTestId("context-filters").textContent!);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => { cleanup(); clients.splice(0).forEach((client) => client.clear()); server.resetHandlers(); });
afterAll(() => server.close());

describe("shared HTTP context and dependent requests", () => {
  it("does not block page requests while context fails; retries without any Mock fallback", async () => {
    let contextRequests = 0;
    server.use(http.get(`${base}/v1/context/options`, () => {
      contextRequests += 1;
      return HttpResponse.json({ error: { code: "CONTEXT_STORE_UNAVAILABLE" } }, { status: 503 });
    }));
    const urls = captureOverview();
    mount();
    expect(await screen.findByText("分析上下文读取失败")).toBeInTheDocument();
    expect(await screen.findByText("http/false")).toBeInTheDocument();
    expect(contextRequests).toBe(1);
    expect(urls).toHaveLength(1);
    expect([...urls[0]!.searchParams]).toEqual([["period", "7d"]]);
    expect(screen.getByText("503 CONTEXT_STORE_UNAVAILABLE")).toBeInTheDocument();
    server.use(http.get(`${base}/v1/context/options`, () => HttpResponse.json(context({ ...emptyDefaults, candidateSnapshotId: "server-candidate" }))));
    fireEvent.click(screen.getByRole("button", { name: "重试上下文" }));
    await waitFor(() => expect(urls.some((url) => url.searchParams.get("candidateId") === "server-candidate")).toBe(true));
    expect(screen.queryByText("分析上下文读取失败")).not.toBeInTheDocument();
    expect(readFilters().runId).toBe("");
  });

  it("sends no identity filters for empty defaults or explicit clears, including on navigation", async () => {
    server.use(http.get(`${base}/v1/context/options`, () => HttpResponse.json(context({ ...emptyDefaults, candidateSnapshotId: "default-candidate", datasetVersionRef: "default-dataset" }))));
    const urls = captureOverview();
    mount("/overview?candidateId=&datasetVersion=");
    expect(await screen.findByText("http/false")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "导航并清空" }));
    fireEvent.click(screen.getByRole("button", { name: "清空数据集参数" }));
    expect(readFilters()).toMatchObject({ candidateId: "", datasetVersion: "", runId: "" });
    for (const url of urls) expect([...url.searchParams]).toEqual([["period", "7d"]]);
  });

  it("keeps explicit URL identities ahead of defaults and serializes their original names", async () => {
    server.use(http.get(`${base}/v1/context/options`, () => HttpResponse.json(context({ ...emptyDefaults, candidateSnapshotId: "default-candidate" }))));
    const urls = captureOverview();
    mount("/overview?candidateId=historical&datasetVersion=old-data&runId=old-run");
    expect(await screen.findByText("http/false")).toBeInTheDocument();
    expect(readFilters().candidateId).toBe("historical");
    expect(Object.fromEntries(urls[0]!.searchParams)).toEqual({ candidateId: "historical", datasetVersion: "old-data", runId: "old-run", period: "7d" });
  });
});

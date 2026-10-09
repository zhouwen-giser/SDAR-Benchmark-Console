import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import * as apiModule from "../api/consoleApi";
import { capabilityMeta } from "../api/capability-map";
import { operationalApi } from "../operational/api";
import { ContextBar } from "../pages/OverviewPage";
import { RunCreatePage } from "../pages/RunCreatePage";
import { AnalyticsPage } from "../pages/AnalyticsPage";
import type { ContextOptionsView } from "../types";
import { useAnalysisContext } from "./useAnalysisContext";

vi.mock("../api/consoleApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/consoleApi")>();
  // Supply the HTTP-only seams without letting component tests reach a server.
  return { ...actual, consoleApi: Object.assign(actual.consoleApi, { getContextOptions: vi.fn(), getAnalyticsModule: vi.fn() }) };
});

const empty: ContextOptionsView = {
  candidates: [], baselines: [], datasets: [], profiles: [], runs: [],
  defaults: { candidateSnapshotId: null, baselineId: null, datasetVersionRef: null, profileVersionId: null },
  compatibilityPolicy: "exact-contract-and-dataset-identity",
};
const resource = (data = empty) => ({ data, meta: capabilityMeta("contextOptions", { mocked: false, mode: "http" }) });
const clients: QueryClient[] = [];
const matchMedia = vi.mocked(window.matchMedia).getMockImplementation()!;
function mount(ui: ReactNode, entry = "/overview") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  clients.push(client);
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[entry]}>{ui}</MemoryRouter></QueryClientProvider>);
}
function Probe() {
  const context = useAnalysisContext();
  const location = useLocation();
  const navigate = useNavigate();
  return <>
    <output data-testid="filters">{JSON.stringify(context.filters)}</output>
    <output data-testid="location">{location.pathname}{location.search}</output>
    <button onClick={() => context.setFilters({ candidateId: "" })}>clear</button>
    <button onClick={() => context.setFilters({ candidateId: "chosen" })}>choose</button>
    <button onClick={() => context.setFilters({ baselineId: "chosen-baseline" })}>choose baseline</button>
    <button onClick={() => context.navigateWithContext("/analytics")}>next page</button>
    <button onClick={() => navigate(-1)}>back</button>
    <button onClick={() => navigate(1)}>forward</button>
  </>;
}
function filters() { return JSON.parse(screen.getAllByTestId("filters")[0]!.textContent!); }

beforeEach(() => {
  vi.mocked(window.matchMedia).mockImplementation(matchMedia);
  vi.spyOn(apiModule, "currentApiMode").mockReturnValue("http");
  vi.spyOn(apiModule.consoleApi, "getContextOptions").mockResolvedValue(resource());
});
afterEach(() => { cleanup(); clients.splice(0).forEach((client) => client.clear()); vi.restoreAllMocks(); });

describe("remote HTTP analysis context", () => {
  it("shares one request and resolves Server defaults without choosing the first Run", async () => {
    vi.mocked(apiModule.consoleApi.getContextOptions).mockResolvedValue(resource({ ...empty,
      runs: [{ id: "not-a-default", label: "Run" }],
      defaults: { candidateSnapshotId: "candidate-server", baselineId: "baseline-server", datasetVersionRef: "dataset-server", profileVersionId: "profile-server" },
    }));
    mount(<><Probe /><Probe /></>);
    await waitFor(() => expect(filters().candidateId).toBe("candidate-server"));
    expect(filters()).toMatchObject({ baselineId: "baseline-server", datasetVersion: "dataset-server", profileVersionId: "profile-server", runId: "", track: "all", risk: "all", period: "7d" });
    expect(apiModule.consoleApi.getContextOptions).toHaveBeenCalledTimes(1);
  });

  it("uses no fixture identities when the catalog is empty or fails", async () => {
    vi.mocked(apiModule.consoleApi.getContextOptions).mockRejectedValue(new Error("503 BACKEND_UNAVAILABLE"));
    mount(<Probe />);
    await waitFor(() => expect(apiModule.consoleApi.getContextOptions).toHaveBeenCalledTimes(1));
    expect(filters()).toMatchObject({ candidateId: "", datasetVersion: "", profileVersionId: "", baselineId: "", runId: "" });
  });

  it("keeps explicit historical URL identities even outside the current catalog", async () => {
    mount(<Probe />, "/overview?candidateId=historic&runId=old-run&datasetVersion=old-data");
    await waitFor(() => expect(apiModule.consoleApi.getContextOptions).toHaveBeenCalled());
    expect(filters()).toMatchObject({ candidateId: "historic", runId: "old-run", datasetVersion: "old-data" });
  });

  it("preserves cleared defaults and selection across navigation, back and forward", async () => {
    vi.mocked(apiModule.consoleApi.getContextOptions).mockResolvedValue(resource({ ...empty, defaults: { ...empty.defaults, candidateSnapshotId: "server-default" } }));
    mount(<Probe />);
    await waitFor(() => expect(filters().candidateId).toBe("server-default"));
    fireEvent.click(screen.getByText("clear"));
    expect(filters().candidateId).toBe("");
    expect(screen.getByTestId("location")).toHaveTextContent("candidateId=");
    fireEvent.click(screen.getByText("next page"));
    expect(screen.getByTestId("location")).toHaveTextContent("/analytics?candidateId=");
    fireEvent.click(screen.getByText("choose"));
    expect(filters().candidateId).toBe("chosen");
    fireEvent.click(screen.getByText("back"));
    await waitFor(() => expect(filters().candidateId).toBe(""));
    fireEvent.click(screen.getByText("forward"));
    await waitFor(() => expect(filters().candidateId).toBe("chosen"));
  });

  it.each(["mock", "msw", "hybrid"] as const)("keeps the %s offline context without querying Server", (mode) => {
    vi.mocked(apiModule.currentApiMode).mockReturnValue(mode);
    mount(<Probe />);
    expect(filters().candidateId).toBe("cand-142-def456");
    expect(apiModule.consoleApi.getContextOptions).not.toHaveBeenCalled();
  });

  it("shows empty selectors without fixture detail links", async () => {
    const snapshot = await apiModule.consoleApi.getOverview({ scenario: "blocked", dataState: "loaded" });
    mount(<ContextBar data={snapshot.data} options={empty} onRefresh={() => {}} />);
    await waitFor(() => expect(screen.getAllByText("暂无可选数据").length).toBeGreaterThan(0));
    for (const name of ["候选版本 ↗", "基准版本 ↗", "数据集 ↗", "评价配置 ↗", "评测运行 ↗"]) expect(screen.getByRole("button", { name })).toBeDisabled();
    expect(screen.queryByText("cand-142-def456")).not.toBeInTheDocument();
  });

  it("refreshes analysis queries when only the baseline identity changes", async () => {
    const analytics = vi.spyOn(apiModule.consoleApi, "getAnalyticsModule").mockResolvedValue({ data: { key: "candidates", title: "Candidates", rows: [] }, meta: capabilityMeta("analytics", { mocked: false, mode: "http" }) });
    mount(<><Probe /><AnalyticsPage /></>, "/analytics");
    await waitFor(() => expect(analytics).toHaveBeenCalledTimes(18));
    fireEvent.click(screen.getByText("choose baseline"));
    await waitFor(() => expect(analytics).toHaveBeenCalledTimes(36));
    expect(analytics.mock.calls.slice(18).every(([, input]) => input.baselineId === "chosen-baseline")).toBe(true);
  });

  it("distinguishes pending and failed selectors even when the Overview has no data", async () => {
    let reject!: (error: Error) => void;
    vi.mocked(apiModule.consoleApi.getContextOptions).mockReturnValue(new Promise((_, rejectRequest) => { reject = rejectRequest; }));
    mount(<ContextBar onRefresh={() => {}} />);
    expect(screen.getAllByText("加载中…")).toHaveLength(5);
    reject(new Error("503 CONTEXT_DOWN"));
    await waitFor(() => expect(screen.getAllByText("读取失败")).toHaveLength(5));
    expect(screen.queryByText("暂无可选数据")).not.toBeInTheDocument();
  });

  it("shows an available-but-cleared selector as unselected, not as an empty catalog", async () => {
    const options = { ...empty, candidates: [{ id: "server-default", label: "Server candidate" }], defaults: { ...empty.defaults, candidateSnapshotId: "server-default" } };
    vi.mocked(apiModule.consoleApi.getContextOptions).mockResolvedValue(resource(options));
    mount(<><Probe /><ContextBar options={options} onRefresh={() => {}} /></>);
    await waitFor(() => expect(filters().candidateId).toBe("server-default"));
    fireEvent.click(screen.getByText("clear"));
    expect(screen.getAllByText("未选择")).toHaveLength(1);
    expect(screen.getAllByText("暂无可选数据")).toHaveLength(4);
    expect(screen.getByRole("button", { name: "候选版本 ↗" })).toBeDisabled();
  });

  it("separates template, catalog and request errors and refreshes all four resources", async () => {
    const template = await apiModule.consoleApi.getUgvDiagnosticDevelopmentPreset();
    const catalog = await apiModule.consoleApi.listBenchmarkRunPresets();
    const presetSpy = vi.spyOn(apiModule.consoleApi, "getUgvDiagnosticDevelopmentPreset").mockResolvedValue({ ...template, data: { ...template.data, availability: "unavailable", requestTemplate: null, reasonCodes: ["DEV_PRESET_NOT_CONFIGURED"] } });
    const catalogSpy = vi.spyOn(apiModule.consoleApi, "listBenchmarkRunPresets").mockResolvedValue({ ...catalog, data: [] });
    const envSpy = vi.spyOn(operationalApi, "listEnvironments").mockRejectedValue(new Error("503 ENV_DOWN"));
    const resSpy = vi.spyOn(operationalApi, "listResources").mockRejectedValue(new Error("503 RESOURCE_DOWN"));
    const create = vi.spyOn(apiModule.consoleApi, "createBenchmarkRun");
    mount(<RunCreatePage />);
    expect(await screen.findByText("执行模板未配置")).toBeInTheDocument();
    expect(screen.getByText("DEV_PRESET_NOT_CONFIGURED")).toBeInTheDocument();
    expect(await screen.findByText("Preset 目录为空")).toBeInTheDocument();
    expect(await screen.findByText(/环境: 503 ENV_DOWN/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /执行预检/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /创建 Benchmark Run/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "刷新执行配置" }));
    await waitFor(() => { for (const spy of [presetSpy, catalogSpy, envSpy, resSpy]) expect(spy).toHaveBeenCalledTimes(2); });
    expect(create).not.toHaveBeenCalled();
  });
});

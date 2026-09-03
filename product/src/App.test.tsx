import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

describe("SDAR Benchmark Console integration", () => {
  it("preflights a Server-driven Development catalog run before enabling creation", async () => {
    window.history.replaceState(null, "", "/runs/new");
    render(<App />);
    const user = userEvent.setup();
    expect(await screen.findByRole("heading", { name: "新建 Benchmark Run" })).toBeInTheDocument();
    expect(screen.getByText(/所有结果均为 NOT FORMAL QUALIFICATION/)).toBeInTheDocument();
    expect((await screen.findAllByLabelText("Preset")).length).toBeGreaterThan(0);
    const create = screen.getByRole("button", { name: /创建 Benchmark Run/ });
    expect(create).toBeDisabled();
    const preflight = screen.getByRole("button", { name: /执行预检/ });
    await waitFor(() => expect(preflight).toBeEnabled());
    await user.click(preflight);
    expect(await screen.findByText("ready_with_substitutions")).toBeInTheDocument();
    expect(create).toBeEnabled();
    expect(screen.getAllByText("UGV-XCHAIN-003").length).toBeGreaterThan(0);
  });

  it("shows the blocked decision and explicit API/demo-data provenance", async () => {
    window.history.replaceState(null, "", "/overview?scenario=blocked&dataState=loaded");
    render(<App />);
    expect(await screen.findByRole("button", { name: "发布门槛：已阻塞" })).toHaveTextContent("已阻塞");
    expect(screen.getAllByText("MOCK").length).toBeGreaterThan(0);
    expect(screen.getByText("运行指标摘要（不影响质量得分）")).toBeInTheDocument();
  });

  it("renders INVALID scores as em dash", async () => {
    window.history.replaceState(null, "", "/overview?scenario=invalid&dataState=loaded");
    render(<App />);
    expect(await screen.findByRole("button", { name: "发布门槛：不可判定" })).toHaveTextContent("不可判定");
    const qualityButton = screen.getByRole("button", { name: /质量得分/ });
    expect(qualityButton).toHaveTextContent("—");
    expect(qualityButton).not.toHaveTextContent("86.4");
  });

  it("keeps track and risk filters in the URL", async () => {
    window.history.replaceState(null, "", "/overview?scenario=blocked");
    render(<App />);
    const user = userEvent.setup();
    const track = await screen.findByRole("combobox", { name: "分轨筛选" });
    await user.click(track);
    await user.click(await screen.findByText("MCP 协议"));
    await waitFor(() => expect(window.location.search).toContain("track=mcp"));
  });

  it("renders the completed collection workspaces instead of placeholders", async () => {
    window.history.replaceState(null, "", "/evaluations");
    render(<App />);
    expect(await screen.findByRole("heading", { name: "评价结果浏览器" })).toBeInTheDocument();
    expect(screen.queryByText(/设计中/)).not.toBeInTheDocument();
  });

  it("renders Evaluation resources as typed views with raw data behind Debug", async () => {
    window.history.replaceState(null, "", "/evaluations/eval-mcp17?tab=readiness");
    render(<App />);
    const user = userEvent.setup();
    expect(await screen.findByRole("heading", { name: /评价结果 eval-mcp17/ })).toBeInTheDocument();
    expect(await screen.findByText("Source Evidence")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看原始数据" })).toBeInTheDocument();
    expect(document.querySelector(".evaluation-tab-json")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "M1–M15" }));
    expect(await screen.findByRole("columnheader", { name: "Metric" })).toBeInTheDocument();
    expect(document.querySelector(".evaluation-tab-json")).not.toBeInTheDocument();
  });

  it("renders Case contract and resource registry detail routes", async () => {
    window.history.replaceState(null, "", "/cases/MCP-RESTART-017");
    render(<App />);
    expect(await screen.findByRole("heading", { name: "测试用例 MCP-RESTART-017" })).toBeInTheDocument();
    expect(screen.getByText("评价与证据合同")).toBeInTheDocument();
  });

  it("creates a session-local report draft", async () => {
    window.history.replaceState(null, "", "/reports");
    render(<App />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /新建发布评审草稿/ }));
    expect(await screen.findByText(/报告预览 · DRAFT-001/)).toBeInTheDocument();
    expect(screen.getByText("DRAFT-001")).toBeInTheDocument();
  });

  it.each([
    ["/system/topology", "System Topology", "Native execution"],
    ["/environments", "Environments", "Environment registry"],
    ["/environments/ugv-simulator-dev", "Environment · ugv-simulator-dev", "Lease and cleanup history"],
    ["/resources", "Resources", "Resource registry and live status"],
    ["/resources/vehicle%3Augv1", "Resource · vehicle:ugv1", "Four time domains"],
    ["/runs/run-fixture-native-001/identity", "Identity Closure · run-fixture-native-001", "Exact identity graph"],
    ["/runs/run-fixture-native-001/repetitions/repetition-fixture-core-001/trajectory", "Trajectory · repetition-fixture-core-001", "Physical proof summary"],
    ["/telemetry", "Telemetry Workspace", "Telemetry source registry"],
    ["/reconciliation", "Reconciliation Center", "Side-effect policy"],
    ["/analytics/native", "Native Analytics", "Non-formal boundary"],
  ])("renders typed v0.3 operational workspace %s", async (path, heading, landmark) => {
    window.history.replaceState(null, "", path);
    render(<App />);
    expect(await screen.findByRole("heading", { name: heading })).toBeInTheDocument();
    expect(await screen.findByText(landmark, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/FORMAL ELIGIBLE: FALSE/)).toBeInTheDocument();
  });
});

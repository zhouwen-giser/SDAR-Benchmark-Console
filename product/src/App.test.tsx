import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

describe("SDAR Benchmark Console integration", () => {
  it("shows the blocked decision and explicit API/demo-data provenance", async () => {
    window.history.replaceState(null, "", "/overview?scenario=blocked&dataState=loaded");
    render(<App />);
    expect(await screen.findByRole("button", { name: "发布门槛：已阻塞" })).toHaveTextContent("已阻塞");
    expect(screen.getAllByText("演示数据").length).toBeGreaterThan(0);
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
});

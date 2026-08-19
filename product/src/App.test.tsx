import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

describe("SDAR Benchmark Console integration", () => {
  it("shows BLOCKED decision and explicit API/mock provenance", async () => {
    window.history.replaceState(null, "", "/overview?scenario=blocked&dataState=loaded");
    render(<App />);
    expect(await screen.findByRole("button", { name: "Release Gate blocked" })).toHaveTextContent("BLOCKED");
    expect(screen.getAllByText("MOCK DATA").length).toBeGreaterThan(0);
    expect(screen.getByText("Operational 摘要（不影响质量分）")).toBeInTheDocument();
  });

  it("renders INVALID scores as em dash", async () => {
    window.history.replaceState(null, "", "/overview?scenario=invalid&dataState=loaded");
    render(<App />);
    expect(await screen.findByRole("button", { name: "Release Gate invalid" })).toHaveTextContent("INVALID");
    const qualityButton = screen.getByRole("button", { name: /Quality Score/ });
    expect(qualityButton).toHaveTextContent("—");
    expect(qualityButton).not.toHaveTextContent("86.4");
  });

  it("keeps Track and Risk in the URL", async () => {
    window.history.replaceState(null, "", "/overview?scenario=blocked");
    render(<App />);
    const user = userEvent.setup();
    const track = await screen.findByRole("combobox", { name: "Track 筛选" });
    await user.click(track);
    await user.click(await screen.findByText("MCP"));
    await waitFor(() => expect(window.location.search).toContain("track=mcp"));
  });

  it("renders the completed collection workspaces instead of placeholders", async () => {
    window.history.replaceState(null, "", "/evaluations");
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Evaluation Explorer" })).toBeInTheDocument();
    expect(screen.queryByText(/设计中/)).not.toBeInTheDocument();
  });

  it("renders Case contract and resource registry detail routes", async () => {
    window.history.replaceState(null, "", "/cases/MCP-RESTART-017");
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Case MCP-RESTART-017" })).toBeInTheDocument();
    expect(screen.getByText("Evaluation & Evidence Contract")).toBeInTheDocument();
  });

  it("creates a session-local report draft", async () => {
    window.history.replaceState(null, "", "/reports");
    render(<App />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /新建发布评审草稿/ }));
    expect(await screen.findByText(/Report Preview · DRAFT-001/)).toBeInTheDocument();
    expect(screen.getByText("DRAFT-001")).toBeInTheDocument();
  });
});

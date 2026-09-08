import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TypedAnalyticsModule } from "./TypedAnalyticsModule";

describe("TypedAnalyticsModule", () => {
  it("renders module-specific columns without a JSON primary view", () => {
    render(<TypedAnalyticsModule moduleKey="skills" rows={[{
      skillId: "vehicle_navigate",
      skillVersion: "1",
      invocationCount: 12,
      terminalCount: 12,
      statusCounts: { completed: 12 },
      durationStats: { p50Ms: 42 },
      dataClass: "development_fixture",
    }]} />);

    expect(screen.getByRole("columnheader", { name: "Invocations" })).toBeInTheDocument();
    expect(screen.getByText("vehicle_navigate")).toBeInTheDocument();
    expect(screen.getByText("development_fixture")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看原始数据" })).toBeInTheDocument();
    expect(document.querySelector(".analytics-module-json")).not.toBeInTheDocument();
  });
});

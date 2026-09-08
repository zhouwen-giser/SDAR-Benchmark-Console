import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RerunRequestPanel } from "./RerunRequestPanel";

afterEach(cleanup);

describe("RerunRequestPanel", () => {
  it("submits an immutable child Run request for selected cases", async () => {
    const onSubmit = vi.fn();
    render(<RerunRequestPanel cases={[{ caseId: "UGV-NODE-001" }, { caseId: "UGV-CORE-002" }]} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByLabelText("UGV-CORE-002"));
    fireEvent.click(screen.getByRole("button", { name: /创建子 Run/ }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
        schemaVersion: "sdar-benchmark.run-rerun-request/v1",
        selectedCaseIds: ["UGV-NODE-001"],
        repeatCount: 1,
        target: "simulated",
    })));
  });
});

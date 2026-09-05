import { describe, expect, it } from "vitest";
import { canCreateFromPreflight } from "./RunCreatePage";

const nativeSelection = {
  implementationKind: "native" as const,
};

describe("RunCreatePage preflight gate", () => {
  it("allows require_native when every capability selection is native", () => {
    expect(canCreateFromPreflight({
      canCreateRun: true,
      canExecuteRun: true,
      substitutions: [nativeSelection],
    }, true)).toBe(true);
  });

  it("rejects require_native when any capability uses a non-native implementation", () => {
    expect(canCreateFromPreflight({
      canCreateRun: true,
      canExecuteRun: true,
      substitutions: [nativeSelection, {
        implementationKind: "deterministic_substitute",
      }],
    }, true)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { displayValue, signedDelta } from "./format";

describe("score semantics", () => {
  it("renders null and undefined as an em dash, never zero", () => {
    expect(displayValue(null)).toBe("—");
    expect(displayValue(undefined, "%")).toBe("—");
  });

  it("keeps a real zero visible", () => {
    expect(displayValue(0)).toBe("0");
    expect(displayValue(0, "%")).toBe("0%");
  });

  it("formats signed deltas without inventing missing values", () => {
    expect(signedDelta(3.2)).toBe("+3.2");
    expect(signedDelta(-14.2, "%")).toBe("-14.2%");
    expect(signedDelta(null)).toBe("—");
  });
});

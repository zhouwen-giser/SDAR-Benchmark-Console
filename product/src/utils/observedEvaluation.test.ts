import { describe, expect, it } from "vitest";
import { coverageText, formatFraction, observedScoreText } from "./observedEvaluation";
import { mockObservedEvaluation } from "../mocks/observedEvaluation";

describe("Observed display formatting (not scoring)", () => {
  it("formats exact fractions and server-rounded decimal text", () => {
    expect(observedScoreText(mockObservedEvaluation)).toBe("100.0");
    expect(coverageText({ numerator: "3", denominator: "50" })).toBe("6%");
    expect(coverageText({ numerator: "1", denominator: "1" })).toBe("100%");
    expect(coverageText({ numerator: "0", denominator: "1" })).toBe("0%");
    expect(formatFraction({ numerator: "999999999999999999999999", denominator: "999999999999999999999999" })).toBe("1.0");
    expect(formatFraction({ numerator: "1", denominator: "3" }, 2)).toBe("0.33");
  });
  it("never turns null or invalid fractions into zero", () => {
    expect(formatFraction(null)).toBe("—");
    expect(coverageText(null)).toBe("—");
    expect(formatFraction({ numerator: "3", denominator: "0" })).toBe("—");
    expect(formatFraction({ numerator: "NaN", denominator: "1" })).toBe("—");
    expect(observedScoreText({ ...mockObservedEvaluation, scoreStatus: "NO_DATA", displayScore: null, observedScore: null })).toBe("—");
  });
});

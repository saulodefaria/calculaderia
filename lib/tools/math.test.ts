import { describe, expect, test } from "vitest";
import { calculatePercentageApplied, calculatePercentageChange, calculatePercentageOf, solveRuleOfThree } from "./math";

describe("math tools", () => {
  test("calculates percentage operations", () => {
    expect(calculatePercentageOf(15, 200)).toBe(30);
    expect(calculatePercentageApplied(200, 15, "increase")).toBe(230);
    expect(calculatePercentageApplied(200, 15, "decrease")).toBe(170);
  });

  test("calculates percentage change", () => {
    expect(calculatePercentageChange(100, 125)).toBe(25);
    expect(calculatePercentageChange(100, 75)).toBe(-25);
    expect(calculatePercentageChange(0, 75)).toBeNull();
  });

  test("solves direct rule of three", () => {
    expect(solveRuleOfThree(2, 10, 5)).toBe(25);
    expect(solveRuleOfThree(0, 10, 5)).toBeNull();
  });
});

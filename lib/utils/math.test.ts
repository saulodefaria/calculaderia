import { describe, it, expect } from "vitest";
import { round2 } from "./math";

describe("round2", () => {
  it("rounds to 2 decimal places", () => {
    expect(round2(1.234)).toBe(1.23);
    expect(round2(1.235)).toBe(1.24);
    expect(round2(1.236)).toBe(1.24);
  });

  it("handles already rounded values", () => {
    expect(round2(1.23)).toBe(1.23);
    expect(round2(100)).toBe(100);
    expect(round2(0)).toBe(0);
  });

  it("handles negative values", () => {
    expect(round2(-1.234)).toBe(-1.23);
    expect(round2(-1.235)).toBe(-1.23); // Note: banker's rounding behavior may vary
    expect(round2(-1.236)).toBe(-1.24);
  });

  it("handles very small values", () => {
    expect(round2(0.001)).toBe(0);
    expect(round2(0.005)).toBe(0.01);
    expect(round2(0.004)).toBe(0);
  });

  it("handles large values", () => {
    expect(round2(1000000.999)).toBe(1000001);
    expect(round2(1000000.994)).toBe(1000000.99);
  });

  it("handles floating point precision issues", () => {
    // Famous floating point issue: 0.1 + 0.2 !== 0.3
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });
});

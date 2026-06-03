import { describe, expect, test } from "vitest";
import { countDaysBetween } from "./dates";

describe("date tools", () => {
  test("counts days between dates", () => {
    expect(countDaysBetween("2026-01-01", "2026-01-31")).toMatchObject({
      days: 30,
      absoluteDays: 30,
    });
  });

  test("supports inclusive counting", () => {
    expect(countDaysBetween("2026-01-01", "2026-01-31", true)).toMatchObject({
      days: 31,
      absoluteDays: 31,
    });
  });

  test("preserves direction for reversed dates", () => {
    expect(countDaysBetween("2026-01-31", "2026-01-01")).toMatchObject({
      days: -30,
      absoluteDays: 30,
    });
  });

  test("rejects invalid dates", () => {
    expect(countDaysBetween("2026-02-31", "2026-03-01")).toBeNull();
    expect(countDaysBetween("invalid", "2026-03-01")).toBeNull();
  });
});

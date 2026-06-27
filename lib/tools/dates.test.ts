import { describe, expect, test } from "vitest";
import {
  buildTimestampSearchParams,
  convertDateTimeToTimestamp,
  convertTimestampToDate,
  countDaysBetween,
  createUnixTimestampDefaultState,
  parseTimestampQuery,
  parseUnixTimestampInput,
  type UnixTimestampState,
} from "./dates";

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

  test("converts Unix seconds to milliseconds and UTC dates", () => {
    expect(convertTimestampToDate("0", "s")).toMatchObject({
      status: "valid",
      milliseconds: 0,
      millisecondsString: "0",
      secondsString: "0",
      isoUtc: "1970-01-01T00:00:00.000Z",
    });
    expect(convertTimestampToDate("1", "s")).toMatchObject({
      status: "valid",
      milliseconds: 1000,
      secondsString: "1",
    });
    expect(convertTimestampToDate("1700000000", "s")).toMatchObject({
      status: "valid",
      milliseconds: 1700000000000,
      isoUtc: "2023-11-14T22:13:20.000Z",
    });
    expect(convertTimestampToDate("2147483647", "s")).toMatchObject({
      status: "valid",
      milliseconds: 2147483647000,
      isoUtc: "2038-01-19T03:14:07.000Z",
    });
  });

  test("preserves fractional seconds to millisecond precision", () => {
    expect(convertTimestampToDate("1700000000.123", "s")).toMatchObject({
      status: "valid",
      milliseconds: 1700000000123,
      millisecondsString: "1700000000123",
      secondsString: "1700000000.123",
      isoUtc: "2023-11-14T22:13:20.123Z",
    });
    expect(convertTimestampToDate("-1", "s")).toMatchObject({
      status: "valid",
      milliseconds: -1000,
      secondsString: "-1",
      isoUtc: "1969-12-31T23:59:59.000Z",
    });
    expect(convertTimestampToDate("-0.001", "s")).toMatchObject({
      status: "valid",
      milliseconds: -1,
      secondsString: "-0.001",
      isoUtc: "1969-12-31T23:59:59.999Z",
    });
  });

  test("accepts integer milliseconds and rejects decimal milliseconds", () => {
    expect(convertTimestampToDate("1700000000123", "ms")).toMatchObject({
      status: "valid",
      milliseconds: 1700000000123,
      secondsString: "1700000000.123",
    });
    expect(convertTimestampToDate("1700000000.123", "ms")).toMatchObject({
      status: "invalid",
      issue: "millisecondsMustBeInteger",
    });
  });

  test("rejects malformed timestamps and values outside the Date range", () => {
    expect(parseUnixTimestampInput("", "s")).toMatchObject({ status: "empty", issue: "emptyTimestamp" });

    for (const value of ["abc", "1e3", "1,000", "12 34", "R$ 1700000000", " 1700000000"]) {
      expect(parseUnixTimestampInput(value, "s")).toMatchObject({
        status: "invalid",
        issue: "invalidTimestampFormat",
      });
    }

    expect(parseUnixTimestampInput("1700000000.1234", "s")).toMatchObject({
      status: "invalid",
      issue: "tooManyFractionDigits",
    });
    expect(parseUnixTimestampInput("8640000000000.001", "s")).toMatchObject({
      status: "invalid",
      issue: "timestampOutOfRange",
    });
    expect(parseUnixTimestampInput("-8640000000000.001", "s")).toMatchObject({
      status: "invalid",
      issue: "timestampOutOfRange",
    });
  });

  test("converts UTC date and time input to timestamps", () => {
    expect(convertDateTimeToTimestamp("1970-01-01", "00:00:00.000", "utc")).toMatchObject({
      status: "valid",
      milliseconds: 0,
      secondsString: "0",
      isoUtc: "1970-01-01T00:00:00.000Z",
      normalizedDate: "1970-01-01",
      normalizedTime: "00:00:00.000",
    });
    expect(convertDateTimeToTimestamp("2024-02-29", "12:34:56.789", "utc")).toMatchObject({
      status: "valid",
      milliseconds: 1709210096789,
      secondsString: "1709210096.789",
      isoUtc: "2024-02-29T12:34:56.789Z",
    });
    expect(convertDateTimeToTimestamp("2024-02-29", "12:34", "utc")).toMatchObject({
      status: "valid",
      normalizedTime: "12:34:00.000",
    });
  });

  test("constructs UTC calendar years 0000 through 0099 exactly", () => {
    expect(convertDateTimeToTimestamp("0000-01-01", "00:00:00.000", "utc")).toMatchObject({
      status: "valid",
      isoUtc: "0000-01-01T00:00:00.000Z",
      normalizedDate: "0000-01-01",
      normalizedTime: "00:00:00.000",
    });
    expect(convertDateTimeToTimestamp("0099-12-31", "23:59:59.999", "utc")).toMatchObject({
      status: "valid",
      isoUtc: "0099-12-31T23:59:59.999Z",
      normalizedDate: "0099-12-31",
      normalizedTime: "23:59:59.999",
    });
    expect(convertDateTimeToTimestamp("0001-02-29", "00:00:00.000", "utc")).toMatchObject({
      status: "invalid",
      issue: "invalidDateValue",
    });
  });

  test("validates impossible dates and invalid time strings", () => {
    expect(convertDateTimeToTimestamp("2026-02-30", "00:00:00.000", "utc")).toMatchObject({
      status: "invalid",
      issue: "invalidDateValue",
    });
    expect(convertDateTimeToTimestamp("2026-2-3", "00:00:00.000", "utc")).toMatchObject({
      status: "invalid",
      issue: "invalidDateFormat",
    });
    expect(convertDateTimeToTimestamp("2026-02-03", "24:00", "utc")).toMatchObject({
      status: "invalid",
      issue: "invalidTimeFormat",
    });
    expect(convertDateTimeToTimestamp("2026-02-03", "12:34:56.7890", "utc")).toMatchObject({
      status: "invalid",
      issue: "invalidTimeFormat",
    });
  });

  test("constructs local date input and preserves the requested wall-time components", () => {
    const result = convertDateTimeToTimestamp("2024-02-29", "12:34:56.789", "local");
    expect(result.status).toBe("valid");

    if (result.status === "valid") {
      expect(result.date.getFullYear()).toBe(2024);
      expect(result.date.getMonth()).toBe(1);
      expect(result.date.getDate()).toBe(29);
      expect(result.date.getHours()).toBe(12);
      expect(result.date.getMinutes()).toBe(34);
      expect(result.date.getSeconds()).toBe(56);
      expect(result.date.getMilliseconds()).toBe(789);
    }
  });

  test("seeds timestamp defaults once from an injected clock", () => {
    const state = createUnixTimestampDefaultState(1700000000123);
    const localDate = new Date(1700000000000);

    expect(state).toMatchObject({
      mode: "timestamp",
      timestamp: "1700000000",
      unit: "s",
      zone: "utc",
    });
    expect(state.date).toBe(
      `${String(localDate.getFullYear()).padStart(4, "0")}-${String(localDate.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(localDate.getDate()).padStart(2, "0")}`
    );
    expect(state.time).toBe(
      `${String(localDate.getHours()).padStart(2, "0")}:${String(localDate.getMinutes()).padStart(2, "0")}:${String(
        localDate.getSeconds()
      ).padStart(2, "0")}.000`
    );
  });

  test("parses timestamp query params and falls back from invalid values", () => {
    const epochParams = new URLSearchParams("modo=timestamp&ts=0&u=s");
    expect(parseTimestampQuery(epochParams, 1700000000123)).toMatchObject({
      mode: "timestamp",
      timestamp: "0",
      unit: "s",
    });

    const millisecondsParams = new URLSearchParams("modo=timestamp&ts=1700000000000&u=ms");
    expect(parseTimestampQuery(millisecondsParams, 1700000000123)).toMatchObject({
      mode: "timestamp",
      timestamp: "1700000000000",
      unit: "ms",
    });

    const invalidParams = new URLSearchParams("modo=wat&ts=1e3&u=bad&zona=bad");
    expect(parseTimestampQuery(invalidParams, 1700000000123)).toMatchObject({
      mode: "timestamp",
      timestamp: "1700000000",
      unit: "s",
      zone: "utc",
    });
  });

  test("parses and normalizes date-mode query params", () => {
    expect(
      parseTimestampQuery(new URLSearchParams("modo=data&data=1970-01-01&hora=00:00&zona=utc"), 1700000000123)
    ).toMatchObject({
      mode: "data",
      date: "1970-01-01",
      time: "00:00:00.000",
      zone: "utc",
    });
    expect(
      parseTimestampQuery(new URLSearchParams("modo=data&data=2026-02-30&hora=24:00&zona=local"), 1700000000123)
    ).toMatchObject({
      mode: "data",
      timestamp: "1700000000",
      zone: "local",
    });
  });

  test("builds compact normalized query params for share URLs", () => {
    const timestampState: UnixTimestampState = {
      mode: "timestamp",
      timestamp: "1700000000.123",
      unit: "s",
      date: "2024-02-29",
      time: "12:34:56.789",
      zone: "utc",
    };
    expect(buildTimestampSearchParams(timestampState).toString()).toBe("modo=timestamp&u=s&ts=1700000000.123");

    const dateState: UnixTimestampState = {
      ...timestampState,
      mode: "data",
      date: "1970-01-01",
      time: "00:00",
      zone: "utc",
    };
    expect(buildTimestampSearchParams(dateState).toString()).toBe(
      "modo=data&zona=utc&data=1970-01-01&hora=00%3A00%3A00.000"
    );

    const invalidState: UnixTimestampState = {
      ...timestampState,
      timestamp: "1e3",
    };
    expect(buildTimestampSearchParams(invalidState).toString()).toBe("modo=timestamp&u=s");
  });
});

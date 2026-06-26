const millisecondsPerDay = 24 * 60 * 60 * 1000;
const dateTimeValueMin = -8640000000000000;
const dateTimeValueMax = 8640000000000000;
const dateTimeValueMinBigInt = BigInt("-8640000000000000");
const dateTimeValueMaxBigInt = BigInt("8640000000000000");

export interface DayCountResult {
  days: number;
  absoluteDays: number;
  weeks: number;
  monthsApprox: number;
}

export type UnixTimestampMode = "timestamp" | "data";
export type UnixTimestampUnit = "s" | "ms";
export type UnixTimestampZone = "utc" | "local";

export type UnixTimestampIssueCode =
  | "emptyTimestamp"
  | "invalidTimestampFormat"
  | "tooManyFractionDigits"
  | "millisecondsMustBeInteger"
  | "timestampOutOfRange"
  | "invalidDateFormat"
  | "invalidDateValue"
  | "invalidTimeFormat"
  | "invalidLocalTime";

export interface UnixTimestampState {
  mode: UnixTimestampMode;
  timestamp: string;
  unit: UnixTimestampUnit;
  date: string;
  time: string;
  zone: UnixTimestampZone;
}

export interface ValidUnixTimestampConversion {
  status: "valid";
  source: "timestamp" | "datetime";
  input: string;
  unit?: UnixTimestampUnit;
  zone?: UnixTimestampZone;
  milliseconds: number;
  millisecondsString: string;
  secondsString: string;
  isoUtc: string;
  date: Date;
  normalizedDate?: string;
  normalizedTime?: string;
}

export interface EmptyUnixTimestampConversion {
  status: "empty";
  source: "timestamp";
  input: string;
  unit: UnixTimestampUnit;
  issue: "emptyTimestamp";
}

export interface InvalidUnixTimestampConversion {
  status: "invalid";
  source: "timestamp" | "datetime";
  input: string;
  unit?: UnixTimestampUnit;
  zone?: UnixTimestampZone;
  issue: Exclude<UnixTimestampIssueCode, "emptyTimestamp">;
}

export type UnixTimestampConversionResult =
  | ValidUnixTimestampConversion
  | EmptyUnixTimestampConversion
  | InvalidUnixTimestampConversion;

interface ParsedDateParts {
  year: number;
  month: number;
  day: number;
  normalizedDate: string;
}

interface ParsedTimeParts {
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
  normalizedTime: string;
}

function parseIsoDateAsUtc(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }

  return date.getTime();
}

function padNumber(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}

function createExactUtcDateTime(
  year: number,
  monthIndex: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0
): Date {
  const date = new Date(0);
  date.setUTCFullYear(year, monthIndex, day);
  date.setUTCHours(hour, minute, second, millisecond);
  return date;
}

function isTimeValueInRange(value: bigint): boolean {
  return value >= dateTimeValueMinBigInt && value <= dateTimeValueMaxBigInt;
}

function buildValidTimestampResult(
  milliseconds: number,
  input: string,
  source: "timestamp" | "datetime",
  metadata: { unit?: UnixTimestampUnit; zone?: UnixTimestampZone; normalizedDate?: string; normalizedTime?: string } = {}
): ValidUnixTimestampConversion {
  const date = new Date(milliseconds);

  return {
    status: "valid",
    source,
    input,
    unit: metadata.unit,
    zone: metadata.zone,
    milliseconds,
    millisecondsString: String(milliseconds),
    secondsString: formatMillisecondsAsUnixSeconds(milliseconds),
    isoUtc: date.toISOString(),
    date,
    normalizedDate: metadata.normalizedDate,
    normalizedTime: metadata.normalizedTime,
  };
}

function parseSecondsToMilliseconds(value: string): bigint | Exclude<UnixTimestampIssueCode, "emptyTimestamp"> {
  if (/^-?\d+\.\d{4,}$/.test(value)) {
    return "tooManyFractionDigits";
  }

  const match = /^(-?)(\d+)(?:\.(\d{1,3}))?$/.exec(value);
  if (!match) {
    return "invalidTimestampFormat";
  }

  const sign = match[1] === "-" ? -1 : 1;
  const wholeSeconds = BigInt(match[2]);
  const fraction = (match[3] ?? "").padEnd(3, "0");
  const fractionMilliseconds = BigInt(fraction || "0");
  const milliseconds = wholeSeconds * BigInt(1000) + fractionMilliseconds;

  return sign === -1 ? -milliseconds : milliseconds;
}

function parseMilliseconds(value: string): bigint | Exclude<UnixTimestampIssueCode, "emptyTimestamp"> {
  if (/^-?\d+\.\d+$/.test(value)) {
    return "millisecondsMustBeInteger";
  }

  if (!/^-?\d+$/.test(value)) {
    return "invalidTimestampFormat";
  }

  return BigInt(value);
}

function parseDateInput(value: string): ParsedDateParts | Exclude<UnixTimestampIssueCode, "emptyTimestamp"> {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return "invalidDateFormat";
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = createExactUtcDateTime(year, month - 1, day);

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return "invalidDateValue";
  }

  return {
    year,
    month,
    day,
    normalizedDate: `${padNumber(year, 4)}-${padNumber(month)}-${padNumber(day)}`,
  };
}

function parseTimeInput(value: string): ParsedTimeParts | Exclude<UnixTimestampIssueCode, "emptyTimestamp"> {
  const match = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(?:\.(\d{1,3}))?)?$/.exec(value);
  if (!match) {
    return "invalidTimeFormat";
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = Number(match[3] ?? "0");
  const millisecond = Number((match[4] ?? "").padEnd(3, "0"));

  return {
    hour,
    minute,
    second,
    millisecond,
    normalizedTime: `${padNumber(hour)}:${padNumber(minute)}:${padNumber(second)}.${padNumber(millisecond, 3)}`,
  };
}

function createUtcDateTime(dateParts: ParsedDateParts, timeParts: ParsedTimeParts): Date {
  return createExactUtcDateTime(
    dateParts.year,
    dateParts.month - 1,
    dateParts.day,
    timeParts.hour,
    timeParts.minute,
    timeParts.second,
    timeParts.millisecond
  );
}

function createLocalDateTime(dateParts: ParsedDateParts, timeParts: ParsedTimeParts): Date {
  const date = new Date(0);
  date.setFullYear(dateParts.year, dateParts.month - 1, dateParts.day);
  date.setHours(timeParts.hour, timeParts.minute, timeParts.second, timeParts.millisecond);

  return date;
}

function isUtcRoundTripValid(date: Date, dateParts: ParsedDateParts, timeParts: ParsedTimeParts): boolean {
  return (
    date.getUTCFullYear() === dateParts.year &&
    date.getUTCMonth() === dateParts.month - 1 &&
    date.getUTCDate() === dateParts.day &&
    date.getUTCHours() === timeParts.hour &&
    date.getUTCMinutes() === timeParts.minute &&
    date.getUTCSeconds() === timeParts.second &&
    date.getUTCMilliseconds() === timeParts.millisecond
  );
}

function isLocalRoundTripValid(date: Date, dateParts: ParsedDateParts, timeParts: ParsedTimeParts): boolean {
  return (
    date.getFullYear() === dateParts.year &&
    date.getMonth() === dateParts.month - 1 &&
    date.getDate() === dateParts.day &&
    date.getHours() === timeParts.hour &&
    date.getMinutes() === timeParts.minute &&
    date.getSeconds() === timeParts.second &&
    date.getMilliseconds() === timeParts.millisecond
  );
}

export function formatMillisecondsAsUnixSeconds(milliseconds: number): string {
  const value = BigInt(milliseconds);
  const isNegative = value < BigInt(0);
  const absoluteValue = isNegative ? -value : value;
  const wholeSeconds = absoluteValue / BigInt(1000);
  const fractionMilliseconds = absoluteValue % BigInt(1000);

  if (fractionMilliseconds === BigInt(0)) {
    return `${isNegative ? "-" : ""}${wholeSeconds.toString()}`;
  }

  const fraction = fractionMilliseconds.toString().padStart(3, "0").replace(/0+$/, "");
  return `${isNegative ? "-" : ""}${wholeSeconds.toString()}.${fraction}`;
}

export function parseUnixTimestampInput(input: string, unit: UnixTimestampUnit): UnixTimestampConversionResult {
  if (input === "") {
    return {
      status: "empty",
      source: "timestamp",
      input,
      unit,
      issue: "emptyTimestamp",
    };
  }

  const milliseconds = unit === "s" ? parseSecondsToMilliseconds(input) : parseMilliseconds(input);
  if (typeof milliseconds === "string") {
    return {
      status: "invalid",
      source: "timestamp",
      input,
      unit,
      issue: milliseconds,
    };
  }

  if (!isTimeValueInRange(milliseconds)) {
    return {
      status: "invalid",
      source: "timestamp",
      input,
      unit,
      issue: "timestampOutOfRange",
    };
  }

  return buildValidTimestampResult(Number(milliseconds), input, "timestamp", { unit });
}

export function convertTimestampToDate(input: string, unit: UnixTimestampUnit): UnixTimestampConversionResult {
  return parseUnixTimestampInput(input, unit);
}

export function convertDateTimeToTimestamp(
  dateInput: string,
  timeInput: string,
  zone: UnixTimestampZone
): UnixTimestampConversionResult {
  const dateParts = parseDateInput(dateInput);
  if (typeof dateParts === "string") {
    return {
      status: "invalid",
      source: "datetime",
      input: `${dateInput} ${timeInput}`,
      zone,
      issue: dateParts,
    };
  }

  const timeParts = parseTimeInput(timeInput);
  if (typeof timeParts === "string") {
    return {
      status: "invalid",
      source: "datetime",
      input: `${dateInput} ${timeInput}`,
      zone,
      issue: timeParts,
    };
  }

  const date = zone === "utc" ? createUtcDateTime(dateParts, timeParts) : createLocalDateTime(dateParts, timeParts);
  const isRoundTripValid =
    zone === "utc" ? isUtcRoundTripValid(date, dateParts, timeParts) : isLocalRoundTripValid(date, dateParts, timeParts);

  if (!isRoundTripValid) {
    return {
      status: "invalid",
      source: "datetime",
      input: `${dateInput} ${timeInput}`,
      zone,
      issue: zone === "local" ? "invalidLocalTime" : "invalidDateValue",
    };
  }

  const milliseconds = date.getTime();
  if (!Number.isFinite(milliseconds) || milliseconds < dateTimeValueMin || milliseconds > dateTimeValueMax) {
    return {
      status: "invalid",
      source: "datetime",
      input: `${dateInput} ${timeInput}`,
      zone,
      issue: "timestampOutOfRange",
    };
  }

  return buildValidTimestampResult(milliseconds, `${dateParts.normalizedDate} ${timeParts.normalizedTime}`, "datetime", {
    zone,
    normalizedDate: dateParts.normalizedDate,
    normalizedTime: timeParts.normalizedTime,
  });
}

export function createUnixTimestampDefaultState(nowMs = Date.now()): UnixTimestampState {
  const roundedMilliseconds = Math.floor(nowMs / 1000) * 1000;
  const date = new Date(roundedMilliseconds);

  return {
    mode: "timestamp",
    timestamp: String(Math.floor(nowMs / 1000)),
    unit: "s",
    date: `${padNumber(date.getFullYear(), 4)}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`,
    time: `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}:${padNumber(date.getSeconds())}.000`,
    zone: "utc",
  };
}

export function parseTimestampQuery(params: URLSearchParams, nowMs = Date.now()): UnixTimestampState {
  const defaults = createUnixTimestampDefaultState(nowMs);
  const mode = params.get("modo") === "data" ? "data" : defaults.mode;
  const unit = params.get("u") === "ms" ? "ms" : defaults.unit;
  const zone = params.get("zona") === "local" ? "local" : defaults.zone;
  const timestampParam = params.get("ts");
  const dateParam = params.get("data");
  const timeParam = params.get("hora");
  const parsedTimestamp = timestampParam === null ? null : parseUnixTimestampInput(timestampParam, unit);
  const timestamp =
    parsedTimestamp?.status === "valid"
      ? unit === "ms"
        ? parsedTimestamp.millisecondsString
        : parsedTimestamp.secondsString
      : defaults.timestamp;
  const parsedDate = dateParam === null ? null : parseDateInput(dateParam);
  const parsedTime = timeParam === null ? null : parseTimeInput(timeParam);

  return {
    mode,
    timestamp,
    unit,
    date: parsedDate && typeof parsedDate !== "string" ? parsedDate.normalizedDate : defaults.date,
    time: parsedTime && typeof parsedTime !== "string" ? parsedTime.normalizedTime : defaults.time,
    zone,
  };
}

export function buildTimestampSearchParams(state: UnixTimestampState): URLSearchParams {
  const params = new URLSearchParams();
  params.set("modo", state.mode);

  if (state.mode === "timestamp") {
    params.set("u", state.unit);

    const parsedTimestamp = parseUnixTimestampInput(state.timestamp, state.unit);
    if (parsedTimestamp.status === "valid") {
      params.set("ts", state.unit === "ms" ? parsedTimestamp.millisecondsString : parsedTimestamp.secondsString);
    }

    return params;
  }

  params.set("zona", state.zone);

  const parsedDateTime = convertDateTimeToTimestamp(state.date, state.time, state.zone);
  if (parsedDateTime.status === "valid") {
    params.set("data", parsedDateTime.normalizedDate ?? state.date);
    params.set("hora", parsedDateTime.normalizedTime ?? state.time);
  }

  return params;
}

export function formatTimestampSummary(
  result: ValidUnixTimestampConversion,
  labels: {
    input: string;
    interpretation: string;
    seconds: string;
    milliseconds: string;
    isoUtc: string;
    utc: string;
    local: string;
    localValue: string;
  }
): string {
  return [
    `${labels.input}: ${result.input}`,
    `${labels.interpretation}: ${result.zone ?? result.unit ?? "UTC"}`,
    `${labels.seconds}: ${result.secondsString}`,
    `${labels.milliseconds}: ${result.millisecondsString}`,
    `${labels.isoUtc}: ${result.isoUtc}`,
    `${labels.utc}: ${result.isoUtc}`,
    `${labels.local}: ${labels.localValue}`,
  ].join("\n");
}

export function countDaysBetween(startDate: string, endDate: string, inclusive = false): DayCountResult | null {
  const start = parseIsoDateAsUtc(startDate);
  const end = parseIsoDateAsUtc(endDate);

  if (start === null || end === null) {
    return null;
  }

  const direction = end >= start ? 1 : -1;
  const baseDays = Math.round((end - start) / millisecondsPerDay);
  const days = inclusive ? baseDays + direction : baseDays;
  const absoluteDays = Math.abs(days);

  return {
    days,
    absoluteDays,
    weeks: absoluteDays / 7,
    monthsApprox: absoluteDays / 30.4375,
  };
}

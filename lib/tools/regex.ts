export const REGEX_TESTER_FLAG_ORDER = ["d", "g", "i", "m", "s", "u", "v", "y"] as const;
export const REGEX_TESTER_UI_FLAG_ORDER = ["g", "i", "m", "s", "u", "v", "y", "d"] as const;
export const REGEX_TESTER_MATCH_LIMIT_OPTIONS = [25, 100, 250, 500] as const;
export const REGEX_TESTER_MAX_PATTERN_LENGTH = 5_000;
export const REGEX_TESTER_MAX_TEXT_LENGTH = 200_000;
export const REGEX_TESTER_LARGE_TEXT_WARNING_LENGTH = 50_000;
export const REGEX_TESTER_SHARE_FRAGMENT_LIMIT = 1_800;
export const REGEX_TESTER_PREVIEW_TEXT_LIMIT = 12_000;

export type RegexFlag = (typeof REGEX_TESTER_FLAG_ORDER)[number];
export type RegexMatchLimit = (typeof REGEX_TESTER_MATCH_LIMIT_OPTIONS)[number];
export type RegexTesterStatus =
  | "empty"
  | "needsText"
  | "valid"
  | "noMatch"
  | "invalidPattern"
  | "invalidFlags"
  | "tooLarge"
  | "tooManyMatches"
  | "timeout";
export type RegexTesterWarning =
  | "javascriptOnly"
  | "largeInput"
  | "possibleReDoS"
  | "zeroLengthMatches"
  | "matchLimitReached"
  | "singleMatchWithoutGlobalOrSticky"
  | "indicesUnsupported";
export type RegexTesterErrorCode = "invalidPattern" | "invalidFlags" | "unsupportedFlag" | "patternTooLarge" | "textTooLarge";
export type RegexHighlightSegmentKind = "text" | "match" | "zeroLength";

export interface RegexTesterState {
  pattern: string;
  text: string;
  flags: string;
  limit: RegexMatchLimit;
}

export interface RegexFlagNormalization {
  flags: string;
  invalidFlags: string[];
  duplicateFlags: string[];
  hasMutuallyExclusiveUnicodeFlags: boolean;
}

export interface RegexLiteralParseResult {
  parsed: boolean;
  pattern: string;
  flags: string;
  reason: "notLiteral" | "parsed" | "unterminated" | "invalidFlags";
}

export interface RegexRange {
  start: number;
  end: number;
  length: number;
}

export interface RegexCaptureGroup {
  index: number;
  value: string | null;
  range: RegexRange | null;
}

export interface RegexNamedGroup {
  name: string;
  value: string | null;
  range: RegexRange | null;
}

export interface RegexMatchIndices {
  full: RegexRange | null;
  captures: RegexCaptureGroup[];
  namedGroups: RegexNamedGroup[];
}

export interface RegexMatchResult {
  number: number;
  text: string;
  start: number;
  end: number;
  length: number;
  preview: string;
  groups: RegexCaptureGroup[];
  namedGroups: RegexNamedGroup[];
  indices: RegexMatchIndices | null;
}

export interface RegexTesterError {
  code: RegexTesterErrorCode;
  engineMessage?: string;
  flags?: string[];
}

export interface RegexTesterSummary {
  shownMatches: number;
  matchLimit: RegexMatchLimit;
  truncated: boolean;
  usesGlobalOrSticky: boolean;
  zeroLengthMatches: number;
}

export interface RegexTesterResult {
  status: RegexTesterStatus;
  pattern: string;
  text: string;
  compiledSource: string;
  flagsUsed: string;
  matches: RegexMatchResult[];
  summary: RegexTesterSummary;
  warnings: RegexTesterWarning[];
  error: RegexTesterError | null;
}

export interface RegexTesterSearchParamsResult {
  params: URLSearchParams;
  queryLength: number;
}

export interface RegexTesterContentFragmentResult {
  params: URLSearchParams;
  contentOmitted: boolean;
  fragmentLength: number;
}

export interface RegexTesterContentFragmentState {
  hasExplicitContent: boolean;
  pattern: string;
  text: string;
}

export interface RegexTesterShareUrlResult {
  url: string;
  searchParams: URLSearchParams;
  fragmentParams: URLSearchParams;
  contentOmitted: boolean;
}

export interface RegexHighlightSegment {
  kind: RegexHighlightSegmentKind;
  text: string;
  matchNumber: number | null;
}

type RegexExecArrayWithIndices = RegExpExecArray & {
  indices?: (Array<[number, number] | undefined> & {
    groups?: Record<string, [number, number] | undefined>;
  });
};

export const defaultRegexTesterState: RegexTesterState = {
  pattern: "",
  text: "",
  flags: "g",
  limit: 100,
};

const regexFlags = new Set<string>(REGEX_TESTER_FLAG_ORDER);
const regexMatchLimits = new Set<number>(REGEX_TESTER_MATCH_LIMIT_OPTIONS);
const regexFlagSupport = new Map<RegexFlag, boolean>();

function createRange(start: number, end: number): RegexRange {
  return {
    start,
    end,
    length: Math.max(0, end - start),
  };
}

function createEmptySummary(state: RegexTesterState, flags: string): RegexTesterSummary {
  return {
    shownMatches: 0,
    matchLimit: state.limit,
    truncated: false,
    usesGlobalOrSticky: flags.includes("g") || flags.includes("y"),
    zeroLengthMatches: 0,
  };
}

function uniqueValues<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function getBaseWarnings(pattern: string, text: string): RegexTesterWarning[] {
  const warnings: RegexTesterWarning[] = [];

  if (pattern.length > 0) {
    warnings.push("javascriptOnly");
  }

  if (text.length > REGEX_TESTER_LARGE_TEXT_WARNING_LENGTH) {
    warnings.push("largeInput");
  }

  if (hasPotentialReDoSPattern(pattern)) {
    warnings.push("possibleReDoS");
  }

  return warnings;
}

function normalizeState(state: RegexTesterState): RegexTesterState {
  const flags = normalizeRegexFlagsForState(state.flags);

  return {
    pattern: state.pattern,
    text: state.text,
    flags,
    limit: normalizeRegexMatchLimit(state.limit),
  };
}

export function canonicalizeRegexFlags(value: string | null | undefined): RegexFlagNormalization {
  const seen = new Set<RegexFlag>();
  const invalidFlags: string[] = [];
  const duplicateFlags: string[] = [];

  for (const flag of Array.from(value ?? "")) {
    if (!regexFlags.has(flag)) {
      invalidFlags.push(flag);
      continue;
    }

    const typedFlag = flag as RegexFlag;

    if (seen.has(typedFlag)) {
      duplicateFlags.push(typedFlag);
      continue;
    }

    seen.add(typedFlag);
  }

  const flags = REGEX_TESTER_FLAG_ORDER.filter((flag) => seen.has(flag)).join("");

  return {
    flags,
    invalidFlags: uniqueValues(invalidFlags),
    duplicateFlags: uniqueValues(duplicateFlags),
    hasMutuallyExclusiveUnicodeFlags: seen.has("u") && seen.has("v"),
  };
}

export function normalizeRegexFlagsForState(value: string | null | undefined): string {
  const normalized = canonicalizeRegexFlags(value);

  return normalized.invalidFlags.length > 0 || normalized.hasMutuallyExclusiveUnicodeFlags
    ? defaultRegexTesterState.flags
    : normalized.flags;
}

export function normalizeRegexMatchLimit(value: string | number | null | undefined): RegexMatchLimit {
  const numericValue = typeof value === "number" ? value : Number(value);

  return regexMatchLimits.has(numericValue) ? (numericValue as RegexMatchLimit) : defaultRegexTesterState.limit;
}

export function isRegexFlagSupported(flag: RegexFlag): boolean {
  const cached = regexFlagSupport.get(flag);
  if (cached !== undefined) return cached;

  try {
    new RegExp("", flag);
    regexFlagSupport.set(flag, true);
    return true;
  } catch {
    regexFlagSupport.set(flag, false);
    return false;
  }
}

export function getUnsupportedRegexFlags(flags: string): RegexFlag[] {
  return REGEX_TESTER_FLAG_ORDER.filter((flag) => flags.includes(flag) && !isRegexFlagSupported(flag));
}

export function toggleRegexFlag(flags: string, flag: RegexFlag, enabled: boolean): string {
  const normalized = canonicalizeRegexFlags(flags);
  const nextFlags = new Set<RegexFlag>(Array.from(normalized.flags) as RegexFlag[]);

  if (enabled) {
    if (flag === "u") nextFlags.delete("v");
    if (flag === "v") nextFlags.delete("u");
    nextFlags.add(flag);
  } else {
    nextFlags.delete(flag);
  }

  return REGEX_TESTER_FLAG_ORDER.filter((candidate) => nextFlags.has(candidate)).join("");
}

export function parseRegexLiteral(input: string): RegexLiteralParseResult {
  const trimmed = input.trim();

  if (!trimmed.startsWith("/")) {
    return {
      parsed: false,
      pattern: input,
      flags: "",
      reason: "notLiteral",
    };
  }

  let isEscaped = false;
  let isInCharacterClass = false;

  for (let index = 1; index < trimmed.length; index += 1) {
    const character = trimmed[index];

    if (isEscaped) {
      isEscaped = false;
      continue;
    }

    if (character === "\\") {
      isEscaped = true;
      continue;
    }

    if (character === "[") {
      isInCharacterClass = true;
      continue;
    }

    if (character === "]") {
      isInCharacterClass = false;
      continue;
    }

    if (character !== "/" || isInCharacterClass) {
      continue;
    }

    const rawFlags = trimmed.slice(index + 1);
    const normalized = canonicalizeRegexFlags(rawFlags);

    if (normalized.invalidFlags.length > 0 || normalized.hasMutuallyExclusiveUnicodeFlags) {
      return {
        parsed: false,
        pattern: input,
        flags: rawFlags,
        reason: "invalidFlags",
      };
    }

    return {
      parsed: true,
      pattern: trimmed.slice(1, index),
      flags: normalized.flags,
      reason: "parsed",
    };
  }

  return {
    parsed: false,
    pattern: input,
    flags: "",
    reason: "unterminated",
  };
}

export function hasPotentialReDoSPattern(pattern: string): boolean {
  const compact = pattern.replace(/\\./g, "");
  const nestedQuantifierPattern = /\((?:[^()[\]]|\[[^\]]*\])*(?:[+*]|\{\d+,?\d*\})(?:[^()[\]]|\[[^\]]*\])*\)(?:[+*]|\{\d+,?\d*\})/;
  const repeatedAlternationPattern = /\((?:[^()|]{1,40}\|[^()|]{1,40})(?:\|[^()|]{1,40})*\)(?:[+*]|\{\d+,?\d*\})/;
  const broadDotRepeatPattern = /\.\*(?:\.\*|[+*]|\{\d+,?\d*\})/;

  return (
    nestedQuantifierPattern.test(compact) ||
    repeatedAlternationPattern.test(compact) ||
    broadDotRepeatPattern.test(compact)
  );
}

export function getRegexTextMetrics(value: string) {
  return {
    characters: Array.from(value).length,
    codeUnits: value.length,
    lines: value.length === 0 ? 0 : value.replace(/\r\n?/g, "\n").split("\n").length,
  };
}

export function getRegexMatchPreview(input: string, start: number, end: number, radius = 36): string {
  const safeStart = Math.max(0, Math.min(start, input.length));
  const safeEnd = Math.max(safeStart, Math.min(end, input.length));
  const previewStart = Math.max(0, safeStart - radius);
  const previewEnd = Math.min(input.length, safeEnd + radius);
  const prefix = previewStart > 0 ? "..." : "";
  const suffix = previewEnd < input.length ? "..." : "";

  return `${prefix}${input.slice(previewStart, previewEnd)}${suffix}`;
}

function rangeFromTuple(tuple: [number, number] | undefined): RegexRange | null {
  return tuple ? createRange(tuple[0], tuple[1]) : null;
}

function advanceRegexStringIndex(input: string, index: number, unicode: boolean): number {
  if (!unicode || index + 1 >= input.length) return index + 1;

  const first = input.charCodeAt(index);
  const second = input.charCodeAt(index + 1);

  return first >= 0xd800 && first <= 0xdbff && second >= 0xdc00 && second <= 0xdfff ? index + 2 : index + 1;
}

function shapeRegexMatch(match: RegexExecArrayWithIndices, number: number, input: string): RegexMatchResult {
  const start = match.index;
  const end = start + match[0].length;
  const groups: RegexCaptureGroup[] = [];
  const namedGroups: RegexNamedGroup[] = [];
  const indices = match.indices;

  for (let index = 1; index < match.length; index += 1) {
    groups.push({
      index,
      value: match[index] ?? null,
      range: rangeFromTuple(indices?.[index]),
    });
  }

  for (const [name, value] of Object.entries(match.groups ?? {}).sort(([left], [right]) => left.localeCompare(right))) {
    namedGroups.push({
      name,
      value: value ?? null,
      range: rangeFromTuple(indices?.groups?.[name]),
    });
  }

  return {
    number,
    text: match[0],
    start,
    end,
    length: match[0].length,
    preview: getRegexMatchPreview(input, start, end),
    groups,
    namedGroups,
    indices: indices
      ? {
          full: rangeFromTuple(indices[0]),
          captures: groups,
          namedGroups,
        }
      : null,
  };
}

function buildResult(
  state: RegexTesterState,
  status: RegexTesterStatus,
  options: {
    compiledSource?: string;
    flagsUsed?: string;
    matches?: RegexMatchResult[];
    summary?: RegexTesterSummary;
    warnings?: RegexTesterWarning[];
    error?: RegexTesterError | null;
  } = {}
): RegexTesterResult {
  const flagsUsed = options.flagsUsed ?? state.flags;

  return {
    status,
    pattern: state.pattern,
    text: state.text,
    compiledSource: options.compiledSource ?? "",
    flagsUsed,
    matches: options.matches ?? [],
    summary: options.summary ?? createEmptySummary(state, flagsUsed),
    warnings: uniqueValues(options.warnings ?? []),
    error: options.error ?? null,
  };
}

export function processRegexTester(state: RegexTesterState): RegexTesterResult {
  const normalizedState = normalizeState(state);
  const normalizedFlags = canonicalizeRegexFlags(state.flags);
  const warnings = getBaseWarnings(normalizedState.pattern, normalizedState.text);

  if (normalizedFlags.invalidFlags.length > 0 || normalizedFlags.hasMutuallyExclusiveUnicodeFlags) {
    return buildResult(normalizedState, "invalidFlags", {
      flagsUsed: normalizedFlags.flags,
      warnings,
      error: {
        code: "invalidFlags",
        flags: normalizedFlags.invalidFlags,
      },
    });
  }

  if (normalizedState.pattern.length === 0) {
    return buildResult(normalizedState, "empty", { warnings: [] });
  }

  if (normalizedState.pattern.length > REGEX_TESTER_MAX_PATTERN_LENGTH) {
    return buildResult(normalizedState, "tooLarge", {
      warnings,
      error: { code: "patternTooLarge" },
    });
  }

  if (normalizedState.text.length === 0) {
    return buildResult(normalizedState, "needsText", { warnings });
  }

  if (normalizedState.text.length > REGEX_TESTER_MAX_TEXT_LENGTH) {
    return buildResult(normalizedState, "tooLarge", {
      warnings,
      error: { code: "textTooLarge" },
    });
  }

  const unsupportedFlags = getUnsupportedRegexFlags(normalizedFlags.flags);
  if (unsupportedFlags.length > 0) {
    return buildResult(normalizedState, "invalidFlags", {
      flagsUsed: normalizedFlags.flags,
      warnings,
      error: {
        code: "unsupportedFlag",
        flags: unsupportedFlags,
      },
    });
  }

  let regex: RegExp;

  try {
    regex = new RegExp(normalizedState.pattern, normalizedFlags.flags);
  } catch (error) {
    return buildResult(normalizedState, "invalidPattern", {
      flagsUsed: normalizedFlags.flags,
      warnings,
      error: {
        code: "invalidPattern",
        engineMessage: error instanceof Error ? error.message : String(error),
      },
    });
  }

  const matches: RegexMatchResult[] = [];
  const usesGlobalOrSticky = regex.global || regex.sticky;
  let truncated = false;
  let zeroLengthMatches = 0;
  let nextMatch: RegexExecArrayWithIndices | null;

  if (!usesGlobalOrSticky) {
    nextMatch = regex.exec(normalizedState.text) as RegexExecArrayWithIndices | null;

    if (nextMatch) {
      const shapedMatch = shapeRegexMatch(nextMatch, 1, normalizedState.text);
      matches.push(shapedMatch);
      if (shapedMatch.length === 0) zeroLengthMatches += 1;
      warnings.push("singleMatchWithoutGlobalOrSticky");
    }
  } else {
    while ((nextMatch = regex.exec(normalizedState.text) as RegexExecArrayWithIndices | null)) {
      const shapedMatch = shapeRegexMatch(nextMatch, matches.length + 1, normalizedState.text);

      if (matches.length >= normalizedState.limit) {
        truncated = true;
        break;
      }

      matches.push(shapedMatch);

      if (shapedMatch.length === 0) {
        zeroLengthMatches += 1;
        regex.lastIndex = advanceRegexStringIndex(
          normalizedState.text,
          regex.lastIndex,
          normalizedFlags.flags.includes("u") || normalizedFlags.flags.includes("v")
        );

        if (regex.lastIndex > normalizedState.text.length) {
          break;
        }
      }
    }
  }

  if (zeroLengthMatches > 0) warnings.push("zeroLengthMatches");
  if (truncated) warnings.push("matchLimitReached");
  if (normalizedFlags.flags.includes("d") && matches.length > 0 && matches.every((match) => match.indices === null)) {
    warnings.push("indicesUnsupported");
  }

  const summary: RegexTesterSummary = {
    shownMatches: matches.length,
    matchLimit: normalizedState.limit,
    truncated,
    usesGlobalOrSticky,
    zeroLengthMatches,
  };
  const status: RegexTesterStatus =
    matches.length === 0 ? "noMatch" : truncated ? "tooManyMatches" : "valid";

  return buildResult(normalizedState, status, {
    compiledSource: regex.source,
    flagsUsed: regex.flags,
    matches,
    summary,
    warnings,
  });
}

export function buildRegexTesterPreflightResult(state: RegexTesterState): RegexTesterResult {
  const normalizedState = normalizeState(state);
  const normalizedFlags = canonicalizeRegexFlags(state.flags);
  const warnings = getBaseWarnings(normalizedState.pattern, normalizedState.text);

  if (normalizedFlags.invalidFlags.length > 0 || normalizedFlags.hasMutuallyExclusiveUnicodeFlags) {
    return buildResult(normalizedState, "invalidFlags", {
      flagsUsed: normalizedFlags.flags,
      warnings,
      error: {
        code: "invalidFlags",
        flags: normalizedFlags.invalidFlags,
      },
    });
  }

  if (normalizedState.pattern.length === 0) {
    return buildResult(normalizedState, "empty", { warnings: [] });
  }

  if (normalizedState.pattern.length > REGEX_TESTER_MAX_PATTERN_LENGTH) {
    return buildResult(normalizedState, "tooLarge", {
      warnings,
      error: { code: "patternTooLarge" },
    });
  }

  if (normalizedState.text.length === 0) {
    return buildResult(normalizedState, "needsText", { warnings });
  }

  if (normalizedState.text.length > REGEX_TESTER_MAX_TEXT_LENGTH) {
    return buildResult(normalizedState, "tooLarge", {
      warnings,
      error: { code: "textTooLarge" },
    });
  }

  return buildResult(normalizedState, "empty", {
    flagsUsed: normalizedFlags.flags,
    warnings,
  });
}

export function shouldProcessRegexTesterInWorker(state: RegexTesterState): boolean {
  const normalizedState = normalizeState(state);
  const normalizedFlags = canonicalizeRegexFlags(state.flags);

  return (
    normalizedFlags.invalidFlags.length === 0 &&
    !normalizedFlags.hasMutuallyExclusiveUnicodeFlags &&
    normalizedState.pattern.length > 0 &&
    normalizedState.pattern.length <= REGEX_TESTER_MAX_PATTERN_LENGTH &&
    normalizedState.text.length > 0 &&
    normalizedState.text.length <= REGEX_TESTER_MAX_TEXT_LENGTH
  );
}

export function buildRegexTesterTimeoutResult(state: RegexTesterState): RegexTesterResult {
  const normalizedState = normalizeState(state);
  const normalizedFlags = canonicalizeRegexFlags(state.flags);

  return buildResult(normalizedState, "timeout", {
    flagsUsed: normalizedFlags.flags,
    warnings: getBaseWarnings(normalizedState.pattern, normalizedState.text),
  });
}

export function readRegexTesterStateFromParams(params: URLSearchParams): RegexTesterState {
  const rawFlags = params.get("flags");

  return {
    pattern: defaultRegexTesterState.pattern,
    text: defaultRegexTesterState.text,
    flags: rawFlags === null ? defaultRegexTesterState.flags : normalizeRegexFlagsForState(rawFlags),
    limit: normalizeRegexMatchLimit(params.get("limite")),
  };
}

export function readRegexTesterContentFromFragment(fragment: string): RegexTesterContentFragmentState {
  const normalizedFragment = fragment.startsWith("#") ? fragment.slice(1) : fragment;
  const params = new URLSearchParams(normalizedFragment);
  const hasExplicitContent = params.get("conteudo") === "1";

  return {
    hasExplicitContent,
    pattern: hasExplicitContent ? params.get("padrao") ?? "" : defaultRegexTesterState.pattern,
    text: hasExplicitContent ? params.get("texto") ?? "" : defaultRegexTesterState.text,
  };
}

export function buildRegexTesterSearchParams(state: RegexTesterState): RegexTesterSearchParamsResult {
  const params = new URLSearchParams();

  params.set("flags", normalizeRegexFlagsForState(state.flags));
  params.set("limite", String(normalizeRegexMatchLimit(state.limit)));

  return {
    params,
    queryLength: params.toString().length,
  };
}

export function buildRegexTesterContentFragmentParams(
  state: RegexTesterState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): RegexTesterContentFragmentResult {
  const params = new URLSearchParams();
  const maxFragmentLength = options.maxFragmentLength ?? REGEX_TESTER_SHARE_FRAGMENT_LIMIT;

  if (!options.includeContent) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: 0,
    };
  }

  params.set("conteudo", "1");

  if (state.pattern.length === 0 && state.text.length === 0) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: params.toString().length,
    };
  }

  params.set("padrao", state.pattern);
  params.set("texto", state.text);

  if (params.toString().length <= maxFragmentLength) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: params.toString().length,
    };
  }

  params.delete("padrao");
  params.delete("texto");

  return {
    params,
    contentOmitted: true,
    fragmentLength: params.toString().length,
  };
}

export function buildRegexTesterShareUrl(
  baseUrl: string,
  state: RegexTesterState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): RegexTesterShareUrlResult {
  const searchResult = buildRegexTesterSearchParams(state);
  const fragmentResult = buildRegexTesterContentFragmentParams(state, options);
  const query = searchResult.params.toString();
  const fragment = fragmentResult.params.toString();

  return {
    url: `${baseUrl}${query ? `?${query}` : ""}${fragment ? `#${fragment}` : ""}`,
    searchParams: searchResult.params,
    fragmentParams: fragmentResult.params,
    contentOmitted: fragmentResult.contentOmitted,
  };
}

export function buildRegexHighlightSegments(
  input: string,
  matches: RegexMatchResult[],
  maxTextLength = REGEX_TESTER_PREVIEW_TEXT_LIMIT
): RegexHighlightSegment[] {
  const visibleText = input.slice(0, maxTextLength);
  const segments: RegexHighlightSegment[] = [];
  let cursor = 0;

  for (const match of matches) {
    if (match.start > visibleText.length) break;

    const safeStart = Math.max(cursor, Math.min(match.start, visibleText.length));
    const safeEnd = Math.max(safeStart, Math.min(match.end, visibleText.length));

    if (safeStart > cursor) {
      segments.push({
        kind: "text",
        text: visibleText.slice(cursor, safeStart),
        matchNumber: null,
      });
      cursor = safeStart;
    }

    if (match.length === 0) {
      segments.push({
        kind: "zeroLength",
        text: "",
        matchNumber: match.number,
      });
    } else if (safeEnd > safeStart) {
      segments.push({
        kind: "match",
        text: visibleText.slice(safeStart, safeEnd),
        matchNumber: match.number,
      });
      cursor = safeEnd;
    }
  }

  if (cursor < visibleText.length) {
    segments.push({
      kind: "text",
      text: visibleText.slice(cursor),
      matchNumber: null,
    });
  }

  return segments.length > 0
    ? segments
    : [
        {
          kind: "text",
          text: visibleText,
          matchNumber: null,
        },
      ];
}

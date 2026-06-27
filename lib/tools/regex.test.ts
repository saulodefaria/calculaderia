import { describe, expect, test } from "vitest";
import {
  REGEX_TESTER_MAX_TEXT_LENGTH,
  buildRegexHighlightSegments,
  buildRegexTesterContentFragmentParams,
  buildRegexTesterSearchParams,
  buildRegexTesterShareUrl,
  canonicalizeRegexFlags,
  defaultRegexTesterState,
  isRegexFlagSupported,
  parseRegexLiteral,
  processRegexTester,
  readRegexTesterContentFromFragment,
  readRegexTesterStateFromParams,
  toggleRegexFlag,
  type RegexTesterState,
} from "./regex";

describe("regex tester tool", () => {
  test("returns neutral states for empty pattern and missing text", () => {
    expect(processRegexTester(defaultRegexTesterState).status).toBe("empty");

    const needsText = processRegexTester({
      pattern: "\\d+",
      text: "",
      flags: "g",
      limit: 100,
    });

    expect(needsText.status).toBe("needsText");
    expect(needsText.matches).toEqual([]);
  });

  test("canonicalizes flags, deduplicates duplicates, and keeps u and v exclusive in toggles", () => {
    expect(canonicalizeRegexFlags("migggd")).toEqual({
      flags: "dgim",
      invalidFlags: [],
      duplicateFlags: ["g"],
      hasMutuallyExclusiveUnicodeFlags: false,
    });
    expect(canonicalizeRegexFlags("uv")).toMatchObject({
      flags: "uv",
      hasMutuallyExclusiveUnicodeFlags: true,
    });
    expect(canonicalizeRegexFlags("gz")).toMatchObject({
      flags: "g",
      invalidFlags: ["z"],
    });
    expect(toggleRegexFlag("gu", "v", true)).toBe("gv");
    expect(toggleRegexFlag("gv", "u", true)).toBe("gu");
    expect(toggleRegexFlag("gim", "i", false)).toBe("gm");
  });

  test("finds all global matches and first non-global match", () => {
    const globalResult = processRegexTester({
      pattern: "\\b\\w+@\\w+\\.\\w+\\b",
      text: "Ana: ana@example.com; Beto: beto@test.dev",
      flags: "g",
      limit: 100,
    });

    expect(globalResult.status).toBe("valid");
    expect(globalResult.matches.map((match) => match.text)).toEqual(["ana@example.com", "beto@test.dev"]);
    expect(globalResult.summary.usesGlobalOrSticky).toBe(true);

    const firstOnly = processRegexTester({
      pattern: "\\b\\w+@\\w+\\.\\w+\\b",
      text: "ana@example.com beto@test.dev",
      flags: "",
      limit: 100,
    });

    expect(firstOnly.status).toBe("valid");
    expect(firstOnly.matches).toHaveLength(1);
    expect(firstOnly.warnings).toContain("singleMatchWithoutGlobalOrSticky");
  });

  test("exposes numbered and named capture groups", () => {
    const numbered = processRegexTester({
      pattern: "(\\w+)@(\\w+\\.\\w+)",
      text: "ana@example.com",
      flags: "g",
      limit: 100,
    });

    expect(numbered.matches[0].groups).toEqual([
      { index: 1, value: "ana", range: null },
      { index: 2, value: "example.com", range: null },
    ]);

    const named = processRegexTester({
      pattern: "(?<user>\\w+)@(?<host>\\w+\\.\\w+)",
      text: "ana@example.com",
      flags: "g",
      limit: 100,
    });

    expect(named.matches[0].namedGroups).toEqual([
      { name: "host", value: "example.com", range: null },
      { name: "user", value: "ana", range: null },
    ]);
  });

  test("includes d-flag indices when the runtime supports them", () => {
    if (!isRegexFlagSupported("d")) {
      expect(processRegexTester({ pattern: "a", text: "a", flags: "dg", limit: 100 }).status).toBe("invalidFlags");
      return;
    }

    const result = processRegexTester({
      pattern: "(?<word>\\w+)",
      text: "abc",
      flags: "dg",
      limit: 100,
    });

    expect(result.status).toBe("valid");
    expect(result.matches[0].indices?.full).toEqual({ start: 0, end: 3, length: 3 });
    expect(result.matches[0].groups[0].range).toEqual({ start: 0, end: 3, length: 3 });
    expect(result.matches[0].namedGroups[0].range).toEqual({ start: 0, end: 3, length: 3 });
  });

  test("covers multiline, dotAll, ignore-case, and sticky behavior", () => {
    const multiline = processRegexTester({
      pattern: "^linha",
      text: "linha 1\nlinha 2",
      flags: "gm",
      limit: 100,
    });

    expect(multiline.matches).toHaveLength(2);

    const withoutDotAll = processRegexTester({
      pattern: "a.*b",
      text: "a\nb",
      flags: "g",
      limit: 100,
    });
    const withDotAll = processRegexTester({
      pattern: "a.*b",
      text: "a\nb",
      flags: "gs",
      limit: 100,
    });

    expect(withoutDotAll.status).toBe("noMatch");
    expect(withDotAll.status).toBe("valid");

    const caseInsensitive = processRegexTester({
      pattern: "abc",
      text: "ABC",
      flags: "gi",
      limit: 100,
    });
    const sticky = processRegexTester({
      pattern: "\\w+",
      text: "one two",
      flags: "y",
      limit: 100,
    });

    expect(caseInsensitive.matches[0].text).toBe("ABC");
    expect(sticky.matches.map((match) => match.text)).toEqual(["one"]);
  });

  test("guards zero-length global matches and truncates at the configured limit", () => {
    const zeroLength = processRegexTester({
      pattern: "(?=a)",
      text: "aaa",
      flags: "g",
      limit: 100,
    });

    expect(zeroLength.status).toBe("valid");
    expect(zeroLength.matches).toHaveLength(3);
    expect(zeroLength.warnings).toContain("zeroLengthMatches");

    const limited = processRegexTester({
      pattern: "a",
      text: "aaaa",
      flags: "g",
      limit: 25,
    });

    expect(limited.status).toBe("valid");

    const truncated = processRegexTester({
      pattern: "a",
      text: "a".repeat(30),
      flags: "g",
      limit: 25,
    });

    expect(truncated.status).toBe("tooManyMatches");
    expect(truncated.matches).toHaveLength(25);
    expect(truncated.warnings).toContain("matchLimitReached");
  });

  test("reports invalid patterns, invalid flags, risky patterns, and too-large text", () => {
    const invalidPattern = processRegexTester({
      pattern: "(",
      text: "abc",
      flags: "g",
      limit: 100,
    });

    expect(invalidPattern.status).toBe("invalidPattern");
    expect(invalidPattern.error?.code).toBe("invalidPattern");
    expect(invalidPattern.error?.engineMessage).toBeTruthy();

    const invalidFlags = processRegexTester({
      pattern: "abc",
      text: "abc",
      flags: "uv",
      limit: 100,
    });

    expect(invalidFlags.status).toBe("invalidFlags");
    expect(invalidFlags.error?.code).toBe("invalidFlags");

    const risky = processRegexTester({
      pattern: "(a+)+$",
      text: "aaaa",
      flags: "g",
      limit: 100,
    });

    expect(risky.warnings).toContain("possibleReDoS");

    const tooLarge = processRegexTester({
      pattern: "a",
      text: "a".repeat(REGEX_TESTER_MAX_TEXT_LENGTH + 1),
      flags: "g",
      limit: 100,
    });

    expect(tooLarge.status).toBe("tooLarge");
    expect(tooLarge.error?.code).toBe("textTooLarge");
  });

  test("parses unambiguous JavaScript regex literals only when requested", () => {
    expect(parseRegexLiteral("/abc/gi")).toEqual({
      parsed: true,
      pattern: "abc",
      flags: "gi",
      reason: "parsed",
    });
    expect(parseRegexLiteral("/a\\/b/g")).toEqual({
      parsed: true,
      pattern: "a\\/b",
      flags: "g",
      reason: "parsed",
    });
    expect(parseRegexLiteral("\\/api\\/")).toMatchObject({
      parsed: false,
      pattern: "\\/api\\/",
      reason: "notLiteral",
    });
    expect(parseRegexLiteral("/abc/z")).toMatchObject({
      parsed: false,
      flags: "z",
      reason: "invalidFlags",
    });
  });

  test("reads and writes only safe settings in URL search params", () => {
    const state: RegexTesterState = {
      pattern: "token=(\\w+)",
      text: "token=privado",
      flags: "ig",
      limit: 25,
    };
    const safeParams = buildRegexTesterSearchParams(state);

    expect(safeParams.params.get("flags")).toBe("gi");
    expect(safeParams.params.get("limite")).toBe("25");
    expect(safeParams.params.get("padrao")).toBeNull();
    expect(safeParams.params.get("texto")).toBeNull();
    expect(safeParams.params.get("conteudo")).toBeNull();
    expect(readRegexTesterStateFromParams(new URLSearchParams("flags=im&limite=250&padrao=ignorado&texto=ignorado"))).toEqual({
      pattern: "",
      text: "",
      flags: "im",
      limit: 250,
    });
    expect(readRegexTesterStateFromParams(new URLSearchParams("flags=uv&limite=999"))).toEqual(defaultRegexTesterState);
  });

  test("writes explicit shared pattern and text to the URL fragment only", () => {
    const state: RegexTesterState = {
      pattern: "(?<user>\\w+)@(?<host>\\w+\\.\\w+)",
      text: "ana@example.com",
      flags: "dg",
      limit: 100,
    };
    const shareUrl = buildRegexTesterShareUrl("https://calculaderia.test/dev/regex-tester", state, {
      includeContent: true,
    });
    const parsedShareUrl = new URL(shareUrl.url);
    const parsedFragment = new URLSearchParams(parsedShareUrl.hash.slice(1));

    expect(parsedShareUrl.searchParams.get("flags")).toBe("dg");
    expect(parsedShareUrl.searchParams.get("limite")).toBe("100");
    expect(parsedShareUrl.searchParams.get("padrao")).toBeNull();
    expect(parsedShareUrl.searchParams.get("texto")).toBeNull();
    expect(parsedShareUrl.searchParams.get("conteudo")).toBeNull();
    expect(parsedFragment.get("conteudo")).toBe("1");
    expect(parsedFragment.get("padrao")).toBe(state.pattern);
    expect(parsedFragment.get("texto")).toBe(state.text);
    expect(readRegexTesterContentFromFragment(parsedShareUrl.hash)).toEqual({
      hasExplicitContent: true,
      pattern: state.pattern,
      text: state.text,
    });
    expect(readRegexTesterContentFromFragment("flags=g&padrao=ignorado")).toEqual({
      hasExplicitContent: false,
      pattern: "",
      text: "",
    });
  });

  test("omits shared pattern and text when the fragment would exceed the URL budget", () => {
    const result = buildRegexTesterContentFragmentParams(
      {
        pattern: "a+",
        text: "valor".repeat(100),
        flags: "g",
        limit: 100,
      },
      { includeContent: true, maxFragmentLength: 30 }
    );

    expect(result.contentOmitted).toBe(true);
    expect(result.params.get("conteudo")).toBe("1");
    expect(result.params.get("padrao")).toBeNull();
    expect(result.params.get("texto")).toBeNull();
  });

  test("builds highlight segments without overlapping text ranges", () => {
    const result = processRegexTester({
      pattern: "a",
      text: "aba",
      flags: "g",
      limit: 100,
    });
    const segments = buildRegexHighlightSegments(result.text, result.matches);

    expect(segments).toEqual([
      { kind: "match", text: "a", matchNumber: 1 },
      { kind: "text", text: "b", matchNumber: null },
      { kind: "match", text: "a", matchNumber: 2 },
    ]);
  });

  test("builds zero-length highlight segments without duplicating text", () => {
    const result = processRegexTester({
      pattern: "(?=a)",
      text: "aaa",
      flags: "g",
      limit: 100,
    });
    const segments = buildRegexHighlightSegments(result.text, result.matches);

    expect(segments).toEqual([
      { kind: "zeroLength", text: "", matchNumber: 1 },
      { kind: "text", text: "a", matchNumber: null },
      { kind: "zeroLength", text: "", matchNumber: 2 },
      { kind: "text", text: "a", matchNumber: null },
      { kind: "zeroLength", text: "", matchNumber: 3 },
      { kind: "text", text: "a", matchNumber: null },
    ]);
  });
});

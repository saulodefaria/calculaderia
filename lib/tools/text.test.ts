import { describe, expect, test } from "vitest";
import {
  CHARACTER_LIMIT_MAX,
  analyzeText,
  buildCharacterCounterSearchParams,
  getUtf8ByteLength,
  normalizeCharacterLimit,
  readCharacterCounterStateFromParams,
  type CharacterCounterState,
} from "./text";

describe("text tool", () => {
  test("returns zero counts for empty text", () => {
    expect(analyzeText("", { locale: "pt-BR" })).toEqual({
      characters: 0,
      charactersWithoutWhitespace: 0,
      words: 0,
      sentences: 0,
      lines: 0,
      nonEmptyLines: 0,
      paragraphs: 0,
      bytes: 0,
      limit: null,
    });
  });

  test("counts a simple ASCII phrase and limit feedback", () => {
    const analysis = analyzeText("Ola mundo", { locale: "pt-BR", limit: 10 });

    expect(analysis.characters).toBe(9);
    expect(analysis.charactersWithoutWhitespace).toBe(8);
    expect(analysis.words).toBe(2);
    expect(analysis.sentences).toBe(1);
    expect(analysis.lines).toBe(1);
    expect(analysis.nonEmptyLines).toBe(1);
    expect(analysis.paragraphs).toBe(1);
    expect(analysis.bytes).toBe(9);
    expect(analysis.limit).toEqual({
      limit: 10,
      used: 9,
      remaining: 1,
      exceeded: 0,
      percentUsed: 90,
      isExceeded: false,
    });
  });

  test("handles Portuguese accents, emoji, and combining marks as graphemes", () => {
    const text = "👩‍💻 café e\u0301";
    const analysis = analyzeText(text, { locale: "pt-BR" });

    expect(analysis.characters).toBe(8);
    expect(analysis.charactersWithoutWhitespace).toBe(6);
    expect(analysis.words).toBe(2);
    expect(analysis.bytes).toBe(getUtf8ByteLength(text));
  });

  test("normalizes CRLF and LF line endings for line and paragraph counts", () => {
    const text = "Primeira linha\r\n\r\nSegundo parágrafo\nlinha 2";
    const analysis = analyzeText(text, { locale: "pt-BR" });

    expect(analysis.lines).toBe(4);
    expect(analysis.nonEmptyLines).toBe(3);
    expect(analysis.paragraphs).toBe(2);
    expect(analysis.words).toBe(6);
  });

  test("counts whitespace-only input without words or paragraphs", () => {
    const analysis = analyzeText("   \n\t", { locale: "pt-BR" });

    expect(analysis.characters).toBe(5);
    expect(analysis.charactersWithoutWhitespace).toBe(0);
    expect(analysis.words).toBe(0);
    expect(analysis.sentences).toBe(0);
    expect(analysis.lines).toBe(2);
    expect(analysis.nonEmptyLines).toBe(0);
    expect(analysis.paragraphs).toBe(0);
    expect(analysis.bytes).toBe(5);
  });

  test("counts punctuation-delimited sentences", () => {
    const analysis = analyzeText("Olá. Tudo bem? Sim!", { locale: "pt-BR" });

    expect(analysis.sentences).toBe(3);
    expect(analysis.words).toBe(4);
  });

  test("normalizes only positive integer limits", () => {
    expect(normalizeCharacterLimit(null)).toBeNull();
    expect(normalizeCharacterLimit("")).toBeNull();
    expect(normalizeCharacterLimit("abc")).toBeNull();
    expect(normalizeCharacterLimit("0")).toBeNull();
    expect(normalizeCharacterLimit("-5")).toBeNull();
    expect(normalizeCharacterLimit("12.9")).toBeNull();
    expect(normalizeCharacterLimit("1e3")).toBeNull();
    expect(normalizeCharacterLimit("0x10")).toBeNull();
    expect(normalizeCharacterLimit(12.9)).toBeNull();
    expect(normalizeCharacterLimit("12")).toBe(12);
    expect(normalizeCharacterLimit(12)).toBe(12);
    expect(normalizeCharacterLimit(String(CHARACTER_LIMIT_MAX + 100))).toBe(CHARACTER_LIMIT_MAX);

    const exceeded = analyzeText("abc", { limit: 2 });

    expect(exceeded.limit).toEqual({
      limit: 2,
      used: 3,
      remaining: 0,
      exceeded: 1,
      percentUsed: 150,
      isExceeded: true,
    });
  });

  test("reads and writes URL state without text unless content sharing is explicit", () => {
    const state: CharacterCounterState = {
      text: "Texto privado com acento",
      limitInput: "280",
    };

    const safeParams = buildCharacterCounterSearchParams(state);
    const sharedParams = buildCharacterCounterSearchParams(state, { includeContent: true });

    expect(safeParams.params.get("limite")).toBe("280");
    expect(safeParams.params.get("conteudo")).toBeNull();
    expect(safeParams.params.get("texto")).toBeNull();

    expect(sharedParams.params.get("limite")).toBe("280");
    expect(sharedParams.params.get("conteudo")).toBe("1");
    expect(sharedParams.params.get("texto")).toBe("Texto privado com acento");

    const ignoredText = readCharacterCounterStateFromParams(
      new URLSearchParams("limite=140&texto=nao-deve-carregar")
    );
    expect(ignoredText).toEqual({ text: "", limitInput: "140" });

    const restoredText = readCharacterCounterStateFromParams(
      new URLSearchParams("conteudo=1&limite=140&texto=deve-carregar")
    );
    expect(restoredText).toEqual({ text: "deve-carregar", limitInput: "140" });

    const invalidLimit = readCharacterCounterStateFromParams(
      new URLSearchParams("conteudo=1&limite=12.9&texto=deve-carregar")
    );
    expect(invalidLimit).toEqual({ text: "deve-carregar", limitInput: "" });

    const invalidLimitParams = buildCharacterCounterSearchParams({
      text: "",
      limitInput: "1e3",
    });
    expect(invalidLimitParams.params.get("limite")).toBeNull();
  });

  test("omits shared text when the query would exceed the URL budget", () => {
    const result = buildCharacterCounterSearchParams(
      {
        text: "conteudo grande",
        limitInput: "20",
      },
      { includeContent: true, maxQueryLength: 20 }
    );

    expect(result.contentOmitted).toBe(true);
    expect(result.params.get("conteudo")).toBe("1");
    expect(result.params.get("limite")).toBe("20");
    expect(result.params.get("texto")).toBeNull();
  });
});

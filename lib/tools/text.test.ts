import { describe, expect, test } from "vitest";
import {
  CHARACTER_LIMIT_MAX,
  TEXT_CASE_MAX_INPUT_LENGTH,
  analyzeText,
  buildCharacterCounterSearchParams,
  buildTextCaseContentFragmentParams,
  buildTextCaseSearchParams,
  buildTextCaseShareUrl,
  convertTextCase,
  getUtf8ByteLength,
  normalizeCharacterLimit,
  readTextCaseContentFromFragment,
  readTextCaseStateFromParams,
  readCharacterCounterStateFromParams,
  type CharacterCounterState,
  type TextCaseState,
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

describe("text case converter", () => {
  test("returns a neutral result for empty input", () => {
    expect(convertTextCase("", { locale: "pt-BR" })).toEqual({
      status: "empty",
      output: "",
      modeApplied: "maiusculas",
      inputMetrics: { characters: 0, bytes: 0 },
      outputMetrics: { characters: 0, bytes: 0 },
      changedCharacters: 0,
      warnings: [],
    });
  });

  test("converts uppercase and lowercase with Portuguese accents", () => {
    const uppercase = convertTextCase("Olá Mundo", { mode: "maiusculas", locale: "pt-BR" });
    const lowercase = convertTextCase("Olá Mundo", { mode: "minusculas", locale: "pt-BR" });

    expect(uppercase.status).toBe("converted");
    expect(uppercase.output).toBe("OLÁ MUNDO");
    expect(uppercase.changedCharacters).toBe(6);
    expect(lowercase.output).toBe("olá mundo");
  });

  test("applies sentence case across punctuation, inverted marks, and line starts", () => {
    const input = "olá mundo. tudo bem? sim! ¿qué tal? ¡bien!\r\nsegunda linha";
    const result = convertTextCase(input, { mode: "frase", locale: "es" });

    expect(result.output).toBe("Olá mundo. Tudo bem? Sim! ¿Qué tal? ¡Bien!\r\nSegunda linha");
  });

  test("applies practical localized title case with connector words", () => {
    const result = convertTextCase("o senhor dos anéis e o retorno do rei", {
      mode: "titulo",
      locale: "pt-BR",
    });

    expect(result.output).toBe("O Senhor dos Anéis e o Retorno do Rei");
    expect(result.warnings).toContain("titleCaseApproximation");
  });

  test("keeps decomposed accent marks attached in title case word tokens", () => {
    const result = convertTextCase("e\u0301clair cafe\u0301", {
      mode: "titulo",
      locale: "pt-BR",
    });

    expect(result.output).toBe("E\u0301clair Cafe\u0301");
  });

  test("matches decomposed accented connector words without normalizing output", () => {
    const result = convertTextCase("o retorno a\u0300 casa", {
      mode: "titulo",
      locale: "pt-BR",
    });

    expect(result.output).toBe("O Retorno a\u0300 Casa");
  });

  test("capitalizes every word while preserving punctuation and spacing", () => {
    const result = convertTextCase("joão d'ávila\tmcDONALD, 123abc", {
      mode: "capitalizar-palavras",
      locale: "pt-BR",
    });

    expect(result.output).toBe("João D'ávila\tMcdonald, 123Abc");
  });

  test("keeps decomposed accent marks attached when capitalizing every word", () => {
    const result = convertTextCase("e\u0301clair cafe\u0301", {
      mode: "capitalizar-palavras",
      locale: "pt-BR",
    });

    expect(result.output).toBe("E\u0301clair Cafe\u0301");
  });

  test("inverts only letter casing and leaves numbers, punctuation, and emoji", () => {
    const result = convertTextCase("AbC 123! çÃ🙂", { mode: "inverter", locale: "pt-BR" });

    expect(result.output).toBe("aBc 123! Çã🙂");
  });

  test("alternates letter casing while ignoring spaces, punctuation, digits, and emoji", () => {
    const result = convertTextCase("ab c!d1e🙂f", { mode: "alternado", locale: "pt-BR" });

    expect(result.output).toBe("Ab C!d1E🙂f");
  });

  test("handles combining marks, apostrophes, CRLF, LF, and emoji deterministically", () => {
    const input = "cafe\u0301\nrock'n'roll\r\n🙂 ação";
    const result = convertTextCase(input, { mode: "maiusculas", locale: "pt-BR" });

    expect(result.output).toBe("CAFE\u0301\nROCK'N'ROLL\r\n🙂 AÇÃO");
    expect(result.inputMetrics.characters).toBe(23);
    expect(result.outputMetrics.bytes).toBe(getUtf8ByteLength(result.output));
  });

  test("can replace line breaks with spaces when preservation is disabled", () => {
    const result = convertTextCase("linha um\r\nlinha dois\nlinha três", {
      mode: "frase",
      preserveLineBreaks: false,
      locale: "pt-BR",
    });

    expect(result.output).toBe("Linha um linha dois linha três");
  });

  test("falls back from invalid modes and invalid params", () => {
    const converted = convertTextCase("abc", { mode: "modo-invalido", locale: "pt-BR" });
    const state = readTextCaseStateFromParams(
      new URLSearchParams("modo=invalido&preservarQuebras=talvez&texto=nao-carregar")
    );

    expect(converted.modeApplied).toBe("maiusculas");
    expect(converted.output).toBe("ABC");
    expect(state).toEqual({ text: "", mode: "maiusculas", preserveLineBreaks: true });
  });

  test("returns tooLarge before conversion when input exceeds the guardrail", () => {
    const result = convertTextCase("abcdef", { mode: "minusculas", maxInputLength: 5 });

    expect(TEXT_CASE_MAX_INPUT_LENGTH).toBe(500_000);
    expect(result.status).toBe("tooLarge");
    expect(result.output).toBe("");
    expect(result.inputMetrics).toEqual({ characters: 6, bytes: 6 });
    expect(result.outputMetrics).toEqual({ characters: 0, bytes: 0 });
    expect(result.warnings).toEqual(["largeInput"]);
  });

  test("writes only safe non-default settings to query params", () => {
    const defaultParams = buildTextCaseSearchParams({
      text: "texto privado",
      mode: "maiusculas",
      preserveLineBreaks: true,
    });
    const customParams = buildTextCaseSearchParams({
      text: "texto privado",
      mode: "minusculas",
      preserveLineBreaks: false,
    });

    expect(defaultParams.params.toString()).toBe("");
    expect(customParams.params.get("modo")).toBe("minusculas");
    expect(customParams.params.get("preservarQuebras")).toBe("0");
    expect(customParams.params.get("texto")).toBeNull();
    expect(readTextCaseStateFromParams(customParams.params)).toEqual({
      text: "",
      mode: "minusculas",
      preserveLineBreaks: false,
    });
  });

  test("builds explicit content share links with text only in the fragment", () => {
    const state: TextCaseState = {
      text: "Texto privado\ncom acento",
      mode: "titulo",
      preserveLineBreaks: true,
    };
    const fragment = buildTextCaseContentFragmentParams(state, { includeContent: true });
    const share = buildTextCaseShareUrl("https://calculaderia.test/texto/conversor-maiusculas", state, {
      includeContent: true,
    });
    const parsedUrl = new URL(share.url);
    const fragmentParams = new URLSearchParams(parsedUrl.hash.slice(1));

    expect(parsedUrl.searchParams.get("modo")).toBe("titulo");
    expect(parsedUrl.searchParams.get("texto")).toBeNull();
    expect(fragment.params.get("conteudo")).toBe("1");
    expect(fragment.params.get("texto")).toBe("Texto privado\ncom acento");
    expect(fragmentParams.get("conteudo")).toBe("1");
    expect(fragmentParams.get("texto")).toBe("Texto privado\ncom acento");
    expect(readTextCaseContentFromFragment(parsedUrl.hash)).toEqual({
      hasExplicitContent: true,
      text: "Texto privado\ncom acento",
    });
    expect(readTextCaseContentFromFragment("texto=ignorado")).toEqual({
      hasExplicitContent: false,
      text: "",
    });
  });

  test("omits oversized shared text from explicit content fragments", () => {
    const share = buildTextCaseShareUrl(
      "https://calculaderia.test/texto/conversor-maiusculas",
      {
        text: "conteudo grande",
        mode: "minusculas",
        preserveLineBreaks: false,
      },
      { includeContent: true, maxFragmentLength: 20 }
    );
    const parsedUrl = new URL(share.url);
    const fragmentParams = new URLSearchParams(parsedUrl.hash.slice(1));

    expect(share.contentOmitted).toBe(true);
    expect(fragmentParams.get("conteudo")).toBe("1");
    expect(fragmentParams.get("texto")).toBeNull();
    expect(parsedUrl.searchParams.get("texto")).toBeNull();
  });
});

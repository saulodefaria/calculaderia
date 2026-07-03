import { describe, expect, test } from "vitest";
import {
  CHARACTER_LIMIT_MAX,
  SLUG_GENERATOR_MAX_INPUT_LENGTH,
  TEXT_CASE_MAX_INPUT_LENGTH,
  analyzeText,
  buildCharacterCounterSearchParams,
  buildSlugGeneratorContentFragmentParams,
  buildSlugGeneratorSearchParams,
  buildSlugGeneratorShareUrl,
  buildTextCaseContentFragmentParams,
  buildTextCaseSearchParams,
  buildTextCaseShareUrl,
  convertTextCase,
  generateSlug,
  getUtf8ByteLength,
  normalizeCharacterLimit,
  readCharacterCounterStateFromParams,
  readSlugGeneratorContentFromFragment,
  readSlugGeneratorStateFromParams,
  readTextCaseContentFromFragment,
  readTextCaseStateFromParams,
  type CharacterCounterState,
  type SlugGeneratorState,
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

describe("slug generator", () => {
  test("returns a neutral result for empty input", () => {
    expect(generateSlug("", { locale: "pt-BR" })).toEqual({
      status: "empty",
      slug: "",
      pathSegment: "",
      modeApplied: { separator: "hifen", lowercase: true, maxLength: null },
      inputMetrics: { characters: 0, bytes: 0 },
      outputMetrics: { characters: 0, bytes: 0 },
      removedCharacters: 0,
      warnings: [],
    });
  });

  test("generates ASCII slugs from Portuguese and Spanish accents", () => {
    const portuguese = generateSlug("Olá, mundo! Café com açúcar", { locale: "pt-BR" });
    const spanish = generateSlug("niño rápido y corazón", { locale: "es" });

    expect(portuguese.slug).toBe("ola-mundo-cafe-com-acucar");
    expect(portuguese.pathSegment).toBe("/ola-mundo-cafe-com-acucar");
    expect(portuguese.status).toBe("generated");
    expect(portuguese.warnings).toContain("accentApproximation");
    expect(portuguese.warnings).toContain("unsupportedCharactersRemoved");
    expect(spanish.slug).toBe("nino-rapido-y-corazon");
  });

  test("handles decomposed marks and Latin fallback mappings", () => {
    const result = generateSlug("cafe\u0301 com ac\u0327ucar, Straße æther œuf øresund łódź", {
      locale: "pt-BR",
    });

    expect(result.slug).toBe("cafe-com-acucar-strasse-aether-oeuf-oresund-lodz");
    expect(result.warnings).toContain("accentApproximation");
  });

  test("treats punctuation, slashes, dots, emoji, and repeated separators as boundaries", () => {
    const result = generateSlug("///Curso de Next.js: página #1 😄 fim...", { locale: "pt-BR" });

    expect(result.slug).toBe("curso-de-next-js-pagina-1-fim");
    expect(result.warnings).toContain("unsupportedCharactersRemoved");
  });

  test("treats compatibility symbols as boundaries instead of slug text", () => {
    expect(generateSlug("Produto № 5", { locale: "pt-BR" }).slug).toBe("produto-5");
    expect(generateSlug("Etapa ① final", { locale: "pt-BR" }).slug).toBe("etapa-final");
    expect(generateSlug("Marca ℠ lançada", { locale: "pt-BR" }).slug).toBe("marca-lancada");
    expect(generateSlug("Pacote ㎏ extra", { locale: "pt-BR" }).slug).toBe("pacote-extra");
  });

  test("supports underscore, compact mode, and disabled lowercase", () => {
    expect(generateSlug("Curso de Next.js", { separator: "underscore", locale: "pt-BR" }).slug).toBe(
      "curso_de_next_js"
    );
    expect(generateSlug("Curso de Next.js", { separator: "nenhum", locale: "pt-BR" }).slug).toBe("cursodenextjs");
    expect(
      generateSlug("Curso de Next.js", {
        separator: "underscore",
        lowercase: false,
        locale: "pt-BR",
      }).slug
    ).toBe("Curso_de_Next_js");
  });

  test("trims to max length at a separator when possible", () => {
    const result = generateSlug("curso completo de next js avançado", {
      maxLength: 18,
      locale: "pt-BR",
    });

    expect(result.slug).toBe("curso-completo-de");
    expect(result.modeApplied.maxLength).toBe(18);
    expect(result.warnings).toContain("trimmedToLimit");
  });

  test("falls back from invalid params and reports empty-after-normalization", () => {
    const state = readSlugGeneratorStateFromParams(
      new URLSearchParams("sep=invalido&max=abc&minusculas=talvez&texto=nao-carregar")
    );
    const empty = generateSlug("😄 / 中文", { locale: "pt-BR" });

    expect(state).toEqual({ text: "", separator: "hifen", lowercase: true, maxLengthInput: "" });
    expect(empty.status).toBe("emptyAfterNormalization");
    expect(empty.slug).toBe("");
    expect(empty.warnings).toContain("emptyAfterNormalization");
    expect(empty.warnings).toContain("unsupportedCharactersRemoved");
  });

  test("returns tooLarge before full slug generation", () => {
    const result = generateSlug("abcdef", { maxInputLength: 5 });

    expect(SLUG_GENERATOR_MAX_INPUT_LENGTH).toBe(500_000);
    expect(result.status).toBe("tooLarge");
    expect(result.slug).toBe("");
    expect(result.inputMetrics).toEqual({ characters: 6, bytes: 6 });
    expect(result.outputMetrics).toEqual({ characters: 0, bytes: 0 });
    expect(result.warnings).toEqual(["tooLarge"]);
  });

  test("writes only safe non-default settings to query params", () => {
    const defaultParams = buildSlugGeneratorSearchParams({
      text: "texto privado",
      separator: "hifen",
      lowercase: true,
      maxLengthInput: "",
    });
    const customParams = buildSlugGeneratorSearchParams({
      text: "texto privado",
      separator: "underscore",
      lowercase: false,
      maxLengthInput: "80",
    });

    expect(defaultParams.params.toString()).toBe("");
    expect(customParams.params.get("sep")).toBe("underscore");
    expect(customParams.params.get("max")).toBe("80");
    expect(customParams.params.get("minusculas")).toBe("0");
    expect(customParams.params.get("texto")).toBeNull();
    expect(customParams.params.get("conteudo")).toBeNull();
    expect(readSlugGeneratorStateFromParams(customParams.params)).toEqual({
      text: "",
      separator: "underscore",
      lowercase: false,
      maxLengthInput: "80",
    });
  });

  test("builds explicit content share links with text only in the fragment", () => {
    const state: SlugGeneratorState = {
      text: "Título privado com café",
      separator: "underscore",
      lowercase: true,
      maxLengthInput: "60",
    };
    const fragment = buildSlugGeneratorContentFragmentParams(state, { includeContent: true });
    const share = buildSlugGeneratorShareUrl("https://calculaderia.test/texto/gerador-slug", state, {
      includeContent: true,
    });
    const parsedUrl = new URL(share.url);
    const fragmentParams = new URLSearchParams(parsedUrl.hash.slice(1));

    expect(parsedUrl.searchParams.get("sep")).toBe("underscore");
    expect(parsedUrl.searchParams.get("max")).toBe("60");
    expect(parsedUrl.searchParams.get("texto")).toBeNull();
    expect(fragment.params.get("conteudo")).toBe("1");
    expect(fragment.params.get("texto")).toBe("Título privado com café");
    expect(fragmentParams.get("conteudo")).toBe("1");
    expect(fragmentParams.get("texto")).toBe("Título privado com café");
    expect(readSlugGeneratorContentFromFragment(parsedUrl.hash)).toEqual({
      hasExplicitContent: true,
      text: "Título privado com café",
    });
    expect(readSlugGeneratorContentFromFragment("texto=ignorado")).toEqual({
      hasExplicitContent: false,
      text: "",
    });
  });

  test("omits oversized shared text from explicit content fragments", () => {
    const share = buildSlugGeneratorShareUrl(
      "https://calculaderia.test/texto/gerador-slug",
      {
        text: "conteudo grande",
        separator: "hifen",
        lowercase: true,
        maxLengthInput: "",
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

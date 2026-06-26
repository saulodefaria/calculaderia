import { describe, expect, test } from "vitest";
import {
  buildCpfCnpjFormatterSearchParams,
  buildCpfCnpjFormatterShareUrl,
  detectCpfCnpjType,
  formatCnpj,
  formatCnpjAlphanumeric,
  formatCpf,
  formatCpfCnpjInput,
  readCpfCnpjFormatterContentFromFragment,
  readCpfCnpjFormatterStateFromParams,
  sanitizeCpfCnpjFormatterSharedInput,
  validateCnpj,
  validateCpf,
} from "./documents";

describe("document validators", () => {
  test("validates CPF check digits", () => {
    expect(validateCpf("529.982.247-25")).toBe(true);
    expect(validateCpf("52998224724")).toBe(false);
    expect(validateCpf("111.111.111-11")).toBe(false);
    expect(validateCpf("123")).toBe(false);
  });

  test("formats CPF input", () => {
    expect(formatCpf("52998224725")).toBe("529.982.247-25");
  });

  test("validates CNPJ check digits", () => {
    expect(validateCnpj("04.252.011/0001-10")).toBe(true);
    expect(validateCnpj("04252011000111")).toBe(false);
    expect(validateCnpj("00.000.000/0000-00")).toBe(false);
    expect(validateCnpj("123")).toBe(false);
  });

  test("formats CNPJ input", () => {
    expect(formatCnpj("04252011000110")).toBe("04.252.011/0001-10");
  });
});

describe("CPF and CNPJ formatter", () => {
  test("formats and unmasks CPF without validating check digits", () => {
    const formatted = formatCpfCnpjInput("529.982.247-25");

    expect(formatted).toMatchObject({
      status: "complete",
      selectedType: "cpf",
      rawValue: "52998224725",
      maskedValue: "529.982.247-25",
      normalizedLength: 11,
      requiredLength: 11,
      issues: [],
    });
  });

  test("formats progressive CPF masks and reports extra digits", () => {
    expect(formatCpfCnpjInput("529982247")).toMatchObject({
      status: "incomplete",
      selectedType: "cpf",
      rawValue: "529982247",
      maskedValue: "529.982.247",
      normalizedLength: 9,
    });

    const formatted = formatCpfCnpjInput("5299822472500");

    expect(formatted).toMatchObject({
      status: "incomplete",
      selectedType: "cnpj",
      rawValue: "5299822472500",
      maskedValue: "52.998.224/7250-0",
      normalizedLength: 13,
      issues: [],
    });

    const forcedCpf = formatCpfCnpjInput("5299822472500", "cpf");

    expect(forcedCpf).toMatchObject({
      status: "attention",
      selectedType: "cpf",
      rawValue: "52998224725",
      maskedValue: "529.982.247-25",
      extraValue: "00",
      normalizedLength: 13,
    });
    expect(forcedCpf.issues).toEqual([{ code: "extraCharacters", value: "00", count: 2 }]);
  });

  test("reports letters in CPF mode instead of silently accepting them", () => {
    const formatted = formatCpfCnpjInput("abc 529.982.247-25", "cpf");

    expect(formatted.status).toBe("attention");
    expect(formatted.rawValue).toBe("52998224725");
    expect(formatted.maskedValue).toBe("529.982.247-25");
    expect(formatted.issues).toEqual([{ code: "cpfLetters", characters: "ABC", count: 3 }]);
  });

  test("formats numeric CNPJ and removes punctuation", () => {
    const formatted = formatCpfCnpjInput("04.252.011/0001-10");

    expect(formatted).toMatchObject({
      status: "complete",
      selectedType: "cnpj",
      rawValue: "04252011000110",
      maskedValue: "04.252.011/0001-10",
      normalizedLength: 14,
      requiredLength: 14,
      issues: [],
    });
  });

  test("formats alphanumeric CNPJ with uppercase output", () => {
    const formatted = formatCpfCnpjInput("ab12cd34efgh56", "cnpj");

    expect(formatted).toMatchObject({
      status: "complete",
      selectedType: "cnpj",
      rawValue: "AB12CD34EFGH56",
      maskedValue: "AB.12C.D34/EFGH-56",
      normalizedLength: 14,
      issues: [],
    });
    expect(formatCnpjAlphanumeric("ab12cd34efgh56")).toBe("AB.12C.D34/EFGH-56");
  });

  test("reports letters in final CNPJ check-digit positions", () => {
    const formatted = formatCpfCnpjInput("ab12cd34efghij", "cnpj");

    expect(formatted).toMatchObject({
      status: "attention",
      selectedType: "cnpj",
      rawValue: "AB12CD34EFGHIJ",
      maskedValue: "AB.12C.D34/EFGH-IJ",
    });
    expect(formatted.issues).toEqual([{ code: "cnpjCheckDigitLetters", characters: "IJ", count: 2 }]);
  });

  test("reports unsupported symbols and extra CNPJ characters", () => {
    const formatted = formatCpfCnpjInput("04.252.011/0001-10 @@@ 99", "cnpj");

    expect(formatted).toMatchObject({
      status: "attention",
      rawValue: "04252011000110",
      extraValue: "99",
      normalizedLength: 16,
    });
    expect(formatted.issues).toEqual([
      { code: "unsupportedCharacters", characters: "@", count: 3 },
      { code: "extraCharacters", value: "99", count: 2 },
    ]);
  });

  test("detects CPF and CNPJ types in auto mode", () => {
    expect(detectCpfCnpjType("52998224725")).toBe("cpf");
    expect(detectCpfCnpjType("04252011000110")).toBe("cnpj");
    expect(detectCpfCnpjType("AB12CD34EFGH56")).toBe("cnpj");
    expect(detectCpfCnpjType("529982247")).toBe("cpf");
    expect(detectCpfCnpjType("")).toBeNull();
  });

  test("reads invalid query params with safe defaults and excludes document input from live params", () => {
    const state = readCpfCnpjFormatterStateFromParams(
      new URLSearchParams("tipo=empresa&saida=html&entrada=52998224725")
    );

    expect(state).toEqual({ entrada: "", tipo: "auto", saida: "mascara" });

    const params = buildCpfCnpjFormatterSearchParams({
      entrada: "52998224725",
      tipo: "cnpj",
      saida: "limpar",
    }).params;

    expect(params.toString()).toBe("tipo=cnpj&saida=limpar");
    expect(params.get("entrada")).toBeNull();
  });

  test("builds default share URLs without document content", () => {
    const shareUrl = buildCpfCnpjFormatterShareUrl("https://example.com/validadores/formatador-cpf-cnpj", {
      entrada: "52998224725",
      tipo: "auto",
      saida: "mascara",
    });
    const url = new URL(shareUrl.url);

    expect(url.searchParams.get("tipo")).toBe("auto");
    expect(url.searchParams.get("saida")).toBe("mascara");
    expect(url.searchParams.get("entrada")).toBeNull();
    expect(url.hash).toBe("");
    expect(shareUrl.contentOmitted).toBe(false);
  });

  test("supports explicit hash-only content sharing with length budget", () => {
    const shareUrl = buildCpfCnpjFormatterShareUrl(
      "https://example.com/validadores/formatador-cpf-cnpj",
      {
        entrada: "529.982.247-25",
        tipo: "cpf",
        saida: "limpar",
      },
      { includeContent: true }
    );
    const url = new URL(shareUrl.url);
    const hashParams = new URLSearchParams(url.hash.slice(1));

    expect(url.searchParams.get("tipo")).toBe("cpf");
    expect(url.searchParams.get("saida")).toBe("limpar");
    expect(url.searchParams.get("entrada")).toBeNull();
    expect(hashParams.get("conteudo")).toBe("1");
    expect(hashParams.get("entrada")).toBe("52998224725");
    expect(readCpfCnpjFormatterContentFromFragment(url.hash)).toEqual({
      hasExplicitContent: true,
      entrada: "52998224725",
      contentOmitted: false,
    });

    const noisyAutoShareUrl = buildCpfCnpjFormatterShareUrl(
      "https://example.com/validadores/formatador-cpf-cnpj",
      {
        entrada: "1".repeat(600),
        tipo: "auto",
        saida: "mascara",
      },
      { includeContent: true }
    );
    const noisyAutoHashParams = new URLSearchParams(new URL(noisyAutoShareUrl.url).hash.slice(1));

    expect(noisyAutoShareUrl.contentOmitted).toBe(false);
    expect(noisyAutoHashParams.get("conteudo")).toBe("1");
    expect(noisyAutoHashParams.get("entrada")).toBeNull();

    const tinyBudgetShareUrl = buildCpfCnpjFormatterShareUrl(
      "https://example.com/validadores/formatador-cpf-cnpj",
      {
        entrada: "52998224725",
        tipo: "cpf",
        saida: "mascara",
      },
      { includeContent: true, maxFragmentLength: 16 }
    );
    const tinyBudgetHashParams = new URLSearchParams(new URL(tinyBudgetShareUrl.url).hash.slice(1));

    expect(tinyBudgetShareUrl.contentOmitted).toBe(true);
    expect(tinyBudgetHashParams.get("conteudo")).toBe("1");
    expect(tinyBudgetHashParams.get("entrada")).toBeNull();
    expect(readCpfCnpjFormatterContentFromFragment(`#conteudo=1&entrada=${"1".repeat(600)}`)).toEqual({
      hasExplicitContent: true,
      entrada: "",
      contentOmitted: true,
    });
  });

  test("shares explicit auto content only when the detected result is clean", () => {
    const cleanPartialCpfShareUrl = buildCpfCnpjFormatterShareUrl(
      "https://example.com/validadores/formatador-cpf-cnpj",
      {
        entrada: "529.982",
        tipo: "auto",
        saida: "mascara",
      },
      { includeContent: true }
    );
    const cleanPartialCpfHashParams = new URLSearchParams(new URL(cleanPartialCpfShareUrl.url).hash.slice(1));

    expect(cleanPartialCpfHashParams.get("entrada")).toBe("529982");

    const cleanCnpjShareUrl = buildCpfCnpjFormatterShareUrl(
      "https://example.com/validadores/formatador-cpf-cnpj",
      {
        entrada: "ab12cd34efgh56",
        tipo: "auto",
        saida: "limpar",
      },
      { includeContent: true }
    );
    const cleanCnpjHashParams = new URLSearchParams(new URL(cleanCnpjShareUrl.url).hash.slice(1));

    expect(cleanCnpjHashParams.get("entrada")).toBe("AB12CD34EFGH56");

    const noisyCpfNoteShareUrl = buildCpfCnpjFormatterShareUrl(
      "https://example.com/validadores/formatador-cpf-cnpj",
      {
        entrada: "52998224725 @ Maria",
        tipo: "auto",
        saida: "mascara",
      },
      { includeContent: true }
    );
    const noisyCpfNoteHashParams = new URLSearchParams(new URL(noisyCpfNoteShareUrl.url).hash.slice(1));

    expect(noisyCpfNoteHashParams.get("conteudo")).toBe("1");
    expect(noisyCpfNoteHashParams.get("entrada")).toBeNull();
    expect(sanitizeCpfCnpjFormatterSharedInput("52998224725 @ Maria", "auto")).toBe("");
    expect(
      readCpfCnpjFormatterContentFromFragment("#conteudo=1&entrada=52998224725+%40+Maria", {
        requestedType: "auto",
      })
    ).toEqual({
      hasExplicitContent: true,
      entrada: "",
      contentOmitted: false,
    });
  });

  test("canonicalizes noisy explicit content sharing for CPF and CNPJ", () => {
    const noisyCpfShareUrl = buildCpfCnpjFormatterShareUrl(
      "https://example.com/validadores/formatador-cpf-cnpj",
      {
        entrada: "abc 529.982.247-25 @ Maria",
        tipo: "cpf",
        saida: "mascara",
      },
      { includeContent: true }
    );
    const noisyCpfHashParams = new URLSearchParams(new URL(noisyCpfShareUrl.url).hash.slice(1));

    expect(noisyCpfHashParams.get("entrada")).toBe("52998224725");
    expect(
      readCpfCnpjFormatterContentFromFragment("#conteudo=1&entrada=abc+529.982.247-25+%40+Maria", {
        requestedType: "cpf",
      })
    ).toEqual({
      hasExplicitContent: true,
      entrada: "52998224725",
      contentOmitted: false,
    });

    const noisyCnpjShareUrl = buildCpfCnpjFormatterShareUrl(
      "https://example.com/validadores/formatador-cpf-cnpj",
      {
        entrada: "ab12cd34efghij56 @ matriz",
        tipo: "cnpj",
        saida: "limpar",
      },
      { includeContent: true }
    );
    const noisyCnpjHashParams = new URLSearchParams(new URL(noisyCnpjShareUrl.url).hash.slice(1));

    expect(noisyCnpjHashParams.get("entrada")).toBe("AB12CD34EFGH56");
    expect(sanitizeCpfCnpjFormatterSharedInput("ab12cd34efghij", "cnpj")).toBe("AB12CD34EFGH");
    expect(
      readCpfCnpjFormatterContentFromFragment("#conteudo=1&entrada=ab12cd34efghij56+%40+matriz", {
        requestedType: "cnpj",
      })
    ).toEqual({
      hasExplicitContent: true,
      entrada: "AB12CD34EFGH56",
      contentOmitted: false,
    });
  });
});

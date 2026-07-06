import { describe, expect, it } from "vitest";
import {
  buildCepValidatorContentFragmentParams,
  buildCepValidatorSearchParams,
  buildCepValidatorShareUrl,
  formatCepDigits,
  readCepValidatorContentFromFragment,
  readCepValidatorStateFromParams,
  validateCepFormat,
} from "./cep";

function issueCodes(input: string) {
  return validateCepFormat(input).issues.map((issue) => issue.code);
}

describe("CEP tool helpers", () => {
  it("formats progressive and complete digit strings", () => {
    expect(formatCepDigits("")).toBe("");
    expect(formatCepDigits("01001")).toBe("01001");
    expect(formatCepDigits("0100100")).toBe("01001-00");
    expect(formatCepDigits("01001000")).toBe("01001-000");
    expect(formatCepDigits("01001000999")).toBe("01001-000");
  });

  it("accepts raw eight-digit CEP input", () => {
    const result = validateCepFormat("01001000");

    expect(result.status).toBe("validFormat");
    expect(result.rawDigits).toBe("01001000");
    expect(result.formattedCep).toBe("01001-000");
    expect(result.outputValue).toBe("01001-000");
    expect(result.issues).toEqual([]);
  });

  it("accepts formatted CEP input", () => {
    const result = validateCepFormat("01001-000", "digitos");

    expect(result.status).toBe("validFormat");
    expect(result.rawDigits).toBe("01001000");
    expect(result.formattedCep).toBe("01001-000");
    expect(result.outputValue).toBe("01001000");
  });

  it("classifies empty and incomplete values", () => {
    expect(validateCepFormat("").status).toBe("empty");

    const fiveDigits = validateCepFormat("01001");
    expect(fiveDigits.status).toBe("incomplete");
    expect(fiveDigits.formattedCep).toBe("01001");
    expect(fiveDigits.issues).toContainEqual({ code: "tooFewDigits", count: 3 });

    const sevenDigits = validateCepFormat("0100100");
    expect(sevenDigits.status).toBe("incomplete");
    expect(sevenDigits.formattedCep).toBe("01001-00");
    expect(sevenDigits.issues).toContainEqual({ code: "tooFewDigits", count: 1 });
  });

  it("reports attention for trimming and supported CEP prefixes", () => {
    const trimmed = validateCepFormat(" 01001-000 ");
    expect(trimmed.status).toBe("attention");
    expect(trimmed.formattedCep).toBe("01001-000");
    expect(trimmed.issues.map((issue) => issue.code)).toContain("trimmedWhitespace");

    const prefixed = validateCepFormat("CEP: 01001-000");
    expect(prefixed.status).toBe("attention");
    expect(prefixed.rawDigits).toBe("01001000");
    expect(prefixed.formattedCep).toBe("01001-000");
    expect(prefixed.issues.map((issue) => issue.code)).toContain("prefixRemoved");
  });

  it("reports attention for extra digits without hiding them", () => {
    const result = validateCepFormat("010010000");

    expect(result.status).toBe("attention");
    expect(result.rawDigits).toBe("01001000");
    expect(result.formattedCep).toBe("01001-000");
    expect(result.extraDigits).toBe("0");
    expect(result.issues).toContainEqual({ code: "extraDigits", value: "0", count: 1 });
  });

  it("rejects misplaced or repeated hyphens", () => {
    expect(validateCepFormat("0100-1000").status).toBe("invalid");
    expect(issueCodes("0100-1000")).toContain("misplacedHyphen");

    expect(validateCepFormat("01001--000").status).toBe("invalid");
    expect(issueCodes("01001--000")).toContain("multipleHyphens");
  });

  it("rejects embedded spaces and unsupported punctuation or symbols", () => {
    for (const value of ["01001 000", "01001.000", "01001/000", "abc01001000", "01001-00🙂"]) {
      expect(validateCepFormat(value).status).toBe("invalid");
    }

    expect(issueCodes("01001 000")).toContain("embeddedWhitespace");
    expect(issueCodes("01001.000")).toContain("unsupportedCharacters");
    expect(issueCodes("01001/000")).toContain("unsupportedCharacters");
    expect(issueCodes("abc01001000")).toContain("unsupportedCharacters");
    expect(issueCodes("01001-00🙂")).toContain("unsupportedCharacters");
  });

  it("keeps live query params limited to safe settings", () => {
    const defaults = readCepValidatorStateFromParams(new URLSearchParams("cep=01001000&saida=invalida"));
    expect(defaults).toEqual({ cep: "", saida: "formatado" });

    const params = buildCepValidatorSearchParams({ cep: "01001-000", saida: "digitos" }).params;
    expect(params.toString()).toBe("saida=digitos");
    expect(params.has("cep")).toBe(false);
  });

  it("builds default share URLs without CEP content", () => {
    const shareUrl = buildCepValidatorShareUrl("https://example.com/validadores/validador-cep", {
      cep: "01001-000",
      saida: "formatado",
    });

    expect(shareUrl.url).toBe("https://example.com/validadores/validador-cep");
    expect(shareUrl.searchParams.has("cep")).toBe(false);
    expect(shareUrl.fragmentParams.has("cep")).toBe(false);
  });

  it("uses hash-only explicit content sharing with a small fragment limit", () => {
    const state = { cep: "01001-000", saida: "digitos" as const };
    const shareUrl = buildCepValidatorShareUrl("https://example.com/validadores/validador-cep", state, {
      includeContent: true,
    });
    const parsedUrl = new URL(shareUrl.url);

    expect(parsedUrl.searchParams.toString()).toBe("saida=digitos");
    expect(parsedUrl.hash).toBe("#conteudo=1&cep=01001-000");
    expect(readCepValidatorContentFromFragment(parsedUrl.hash)).toEqual({
      hasExplicitContent: true,
      cep: "01001-000",
      contentOmitted: false,
    });

    expect(readCepValidatorContentFromFragment("cep=01001000")).toEqual({
      hasExplicitContent: false,
      cep: "",
      contentOmitted: false,
    });

    const omitted = buildCepValidatorContentFragmentParams(
      { cep: "01001000".repeat(20), saida: "formatado" },
      { includeContent: true }
    );
    expect(omitted.contentOmitted).toBe(true);
    expect(omitted.params.toString()).toBe("conteudo=1");

    expect(readCepValidatorContentFromFragment(`#conteudo=1&cep=${"1".repeat(160)}`)).toEqual({
      hasExplicitContent: true,
      cep: "",
      contentOmitted: true,
    });
  });
});

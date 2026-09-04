import { describe, expect, test } from "vitest";
import {
  buildBrazilianPlateContentFragmentParams,
  buildBrazilianPlateValidatorSearchParams,
  buildBrazilianPlateValidatorShareUrl,
  convertMercosulToOldPlate,
  convertOldPlateToMercosul,
  normalizeBrazilianPlateInput,
  readBrazilianPlateContentFromFragment,
  readBrazilianPlateValidatorStateFromParams,
  validateBrazilianPlate,
  type BrazilianPlateValidatorState,
} from "./license-plate";

describe("Brazilian license plate helpers", () => {
  test("returns a neutral empty state for empty or whitespace-only input", () => {
    expect(validateBrazilianPlate("").status).toBe("empty");
    expect(validateBrazilianPlate(" \n\t ").status).toBe("empty");
    expect(validateBrazilianPlate("").formattedPlate).toBeNull();
  });

  test("validates Mercosul/PIV plates with lowercase and visual separator normalization", () => {
    const direct = validateBrazilianPlate("ABC1D23");
    expect(direct).toMatchObject({
      status: "validMercosul",
      format: "mercosul",
      normalizedPlate: "ABC1D23",
      formattedPlate: "ABC1D23",
    });

    const lowercase = validateBrazilianPlate("abc1d23");
    expect(lowercase.status).toBe("validMercosul");
    expect(lowercase.normalizedPlate).toBe("ABC1D23");
    expect(lowercase.issueCodes).toContain("letterCaseNormalized");

    const separated = validateBrazilianPlate("ABC 1D23");
    expect(separated.status).toBe("validMercosul");
    expect(separated.normalizedPlate).toBe("ABC1D23");
    expect(separated.issueCodes).toContain("ignoredSeparators");
  });

  test("validates old PNU plates and formats them with a hyphen", () => {
    const result = validateBrazilianPlate(" ABC-1234 ");

    expect(result).toMatchObject({
      status: "validAntiga",
      format: "antiga",
      normalizedPlate: "ABC1234",
      formattedPlate: "ABC-1234",
    });
    expect(result.issueCodes).toContain("trimmedWhitespace");
    expect(result.issueCodes).toContain("ignoredSeparators");
  });

  test("converts old PNU plates to Mercosul with the official A-J table", () => {
    expect(convertOldPlateToMercosul("ABC1234")).toEqual({
      direction: "oldToMercosul",
      input: "ABC1234",
      output: "ABC1C34",
      mappingDigit: "2",
      mappingLetter: "C",
    });

    const result = validateBrazilianPlate("ABC1234");
    expect(result.conversion?.output).toBe("ABC1C34");
  });

  test("does not convert old PNU input after hard normalization failures", () => {
    expect(convertOldPlateToMercosul("ABC_1234")).toBeNull();
    expect(convertOldPlateToMercosul("ABC\t1234")).toBeNull();
    expect(convertOldPlateToMercosul("ABC1234\nDEF1234")).toBeNull();
  });

  test("reverse-converts Mercosul plates only when the fifth character is A-J", () => {
    expect(convertMercosulToOldPlate("ABC1A34")?.output).toBe("ABC1034");
    expect(convertMercosulToOldPlate("ABC1J34")?.output).toBe("ABC1934");
    expect(convertMercosulToOldPlate("ABC1K34")).toBeNull();

    const pivWithoutOldEquivalent = validateBrazilianPlate("ABC1K34");
    expect(pivWithoutOldEquivalent.status).toBe("validMercosul");
    expect(pivWithoutOldEquivalent.issueCodes).toContain("oldEquivalentUnavailable");
  });

  test("does not reverse-convert Mercosul input after hard normalization failures", () => {
    expect(convertMercosulToOldPlate("ABC_1A34")).toBeNull();
    expect(convertMercosulToOldPlate("ABC\t1A34")).toBeNull();
    expect(convertMercosulToOldPlate("ABC1A34\nDEF1A34")).toBeNull();
  });

  test("reports selected-mode mismatches as attention without losing the recognized format", () => {
    const oldInMercosulMode = validateBrazilianPlate("ABC1234", { mode: "mercosul" });
    expect(oldInMercosulMode.status).toBe("attention");
    expect(oldInMercosulMode.format).toBe("antiga");
    expect(oldInMercosulMode.issueCodes).toContain("modeMismatchMercosul");

    const mercosulInOldMode = validateBrazilianPlate("ABC1D23", { mode: "antiga" });
    expect(mercosulInOldMode.status).toBe("attention");
    expect(mercosulInOldMode.format).toBe("mercosul");
    expect(mercosulInOldMode.issueCodes).toContain("modeMismatchAntiga");
  });

  test("returns stable issue codes for invalid lengths and position groups", () => {
    expect(validateBrazilianPlate("ABC123").status).toBe("incomplete");
    expect(validateBrazilianPlate("ABC123").issueCodes).toContain("tooShort");
    expect(validateBrazilianPlate("ABC12345").status).toBe("invalid");
    expect(validateBrazilianPlate("ABC12345").issueCodes).toContain("tooLong");
    expect(validateBrazilianPlate("AB12345").issueCodes).toContain("expectedLetterPrefix");
    expect(validateBrazilianPlate("ABCD123").issueCodes).toContain("expectedDigitFourth");
    expect(validateBrazilianPlate("ABC12D3").issueCodes).toContain("expectedDigitTail");
  });

  test("rejects unsupported punctuation, controls, multiline values, and non-ASCII characters", () => {
    expect(validateBrazilianPlate("ABC_1234").issueCodes).toContain("unsupportedCharacters");
    expect(validateBrazilianPlate("ABC@123").issueCodes).toContain("unsupportedCharacters");
    expect(validateBrazilianPlate("ABC\t1234").issueCodes).toContain("controlCharacters");
    expect(validateBrazilianPlate("ABC1234\nDEF1234").issueCodes).toContain("multipleValues");
    expect(validateBrazilianPlate("ÁBC1234").issueCodes).toContain("unsupportedCharacters");
  });

  test("keeps confusable-character hints informational and does not mutate letters into digits", () => {
    const normalized = normalizeBrazilianPlateInput("ABO1I88");
    expect(normalized.normalizedPlate).toBe("ABO1I88");
    expect(normalized.confusableCharacters).toEqual(expect.arrayContaining(["B", "O", "1", "I", "8"]));

    const result = validateBrazilianPlate("ABO1I88");
    expect(result.status).toBe("validMercosul");
    expect(result.normalizedPlate).toBe("ABO1I88");
    expect(result.issueCodes).toContain("confusableCharacters");
  });

  test("reads and writes only safe live URL search params", () => {
    const state: BrazilianPlateValidatorState = {
      placa: "ABC1D23",
      modo: "auto",
    };

    expect(buildBrazilianPlateValidatorSearchParams(state).params.toString()).toBe("");
    expect(buildBrazilianPlateValidatorSearchParams({ ...state, modo: "mercosul" }).params.toString()).toBe(
      "modo=mercosul"
    );
    expect(
      readBrazilianPlateValidatorStateFromParams(
        new URLSearchParams("modo=antiga&placa=ABC1234&plate=ABC1D23&q=ABC1D23&conteudo=1")
      )
    ).toEqual({
      placa: "",
      modo: "antiga",
    });
    expect(readBrazilianPlateValidatorStateFromParams(new URLSearchParams("modo=desconhecido"))).toEqual({
      placa: "",
      modo: "auto",
    });
  });

  test("builds explicit content share URLs with plate content in the hash only", () => {
    const state: BrazilianPlateValidatorState = {
      placa: "ABC1D23",
      modo: "mercosul",
    };
    const fragment = buildBrazilianPlateContentFragmentParams(state, { includeContent: true });
    const shareUrl = buildBrazilianPlateValidatorShareUrl(
      "https://calculaderia.test/validadores/validador-placa?placa=vazou#placa=vazou",
      state,
      { includeContent: true }
    );
    const parsed = new URL(shareUrl.url);
    const parsedHash = new URLSearchParams(parsed.hash.slice(1));

    expect(fragment.params.get("conteudo")).toBe("1");
    expect(fragment.params.get("placa")).toBe("ABC1D23");
    expect(parsed.searchParams.get("modo")).toBe("mercosul");
    expect(parsed.searchParams.get("placa")).toBeNull();
    expect(parsedHash.get("conteudo")).toBe("1");
    expect(parsedHash.get("placa")).toBe("ABC1D23");
    expect(readBrazilianPlateContentFromFragment(parsed.hash)).toEqual({
      hasExplicitContent: true,
      placa: "ABC1D23",
    });
    expect(readBrazilianPlateContentFromFragment("placa=ignorada")).toEqual({
      hasExplicitContent: false,
      placa: "",
    });
  });

  test("omits explicit shared content when the fragment exceeds the URL budget", () => {
    const result = buildBrazilianPlateContentFragmentParams(
      {
        placa: "ABC1D23",
        modo: "auto",
      },
      { includeContent: true, maxFragmentLength: 12 }
    );

    expect(result.contentOmitted).toBe(true);
    expect(result.params.get("conteudo")).toBe("1");
    expect(result.params.get("placa")).toBeNull();
    expect(readBrazilianPlateContentFromFragment("#conteudo=1&placa=ABC1D23", { maxFragmentLength: 12 })).toEqual({
      hasExplicitContent: true,
      placa: "",
    });
  });
});

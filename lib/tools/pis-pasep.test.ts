import { describe, expect, test } from "vitest";
import {
  buildPisPasepValidatorContentFragmentParams,
  buildPisPasepValidatorSearchParams,
  buildPisPasepValidatorShareUrl,
  calculatePisPasepCheckDigit,
  formatPisPasep,
  normalizePisPasepInput,
  readPisPasepValidatorContentFromFragment,
  readPisPasepValidatorSearchParams,
  sanitizePisPasepSharedInput,
  validatePisPasepChecksum,
  validatePisPasepNumber,
} from "./pis-pasep";

describe("PIS/PASEP validator helpers", () => {
  test("validates a known PIS/PASEP checksum with common separators", () => {
    const result = validatePisPasepNumber(" 120.44560.08-0 ");

    expect(result.status).toBe("validChecksum");
    expect(result.digits).toBe("12044560080");
    expect(result.normalizedValue).toBe("12044560080");
    expect(result.formattedValue).toBe("120.44560.08-0");
    expect(result.expectedCheckDigit).toBe("0");
    expect(result.providedCheckDigit).toBe("0");
    expect(result.issueCodes).toContain("trimmedWhitespace");
    expect(result.issueCodes).toContain("validChecksum");
  });

  test("reports invalid check digits with expected and provided values", () => {
    const result = validatePisPasepNumber("120.44560.08-3");

    expect(result.status).toBe("invalidChecksum");
    expect(result.expectedCheckDigit).toBe("0");
    expect(result.providedCheckDigit).toBe("3");
    expect(result.issueCodes).toContain("invalidChecksum");
  });

  test("computes expected check digits with the public modulo-11 convention", () => {
    expect(calculatePisPasepCheckDigit("1204456008")).toBe(0);
    expect(validatePisPasepChecksum("12044560080")).toEqual({
      expectedCheckDigit: "0",
      providedCheckDigit: "0",
      valid: true,
    });
  });

  test("formats partial and full values as 000.00000.00-0", () => {
    expect(formatPisPasep("1")).toBe("1");
    expect(formatPisPasep("1204")).toBe("120.4");
    expect(formatPisPasep("1204456008")).toBe("120.44560.08");
    expect(formatPisPasep("12044560080")).toBe("120.44560.08-0");
  });

  test("normalizes only ASCII digits and accepted visual separators", () => {
    const result = normalizePisPasepInput("120.44560/08-0");

    expect(result.digits).toBe("12044560080");
    expect(result.ignoredSeparatorCount).toBe(3);
    expect(result.unsupportedCharacters).toEqual([]);
  });

  test("rejects letters, emoji, unsupported punctuation, and non-ASCII digits", () => {
    const result = validatePisPasepNumber("120.44560.08-٣🙂A!");

    expect(result.status).toBe("invalidFormat");
    expect(result.issueCodes).toContain("unsupportedCharacters");
    expect(result.issueCodes).toContain("checksumUnavailable");
    expect(result.issues.find((issue) => issue.code === "unsupportedCharacters")?.count).toBe(4);
  });

  test("reports empty, incomplete, too long, and repeated digit inputs", () => {
    expect(validatePisPasepNumber("").status).toBe("empty");
    expect(validatePisPasepNumber(" \n\t ").status).toBe("empty");

    const incomplete = validatePisPasepNumber("120445");
    expect(incomplete.status).toBe("incomplete");
    expect(incomplete.issueCodes).toContain("incompleteLength");
    expect(incomplete.issueCodes).toContain("checksumUnavailable");

    const tooLong = validatePisPasepNumber("120445600830");
    expect(tooLong.status).toBe("invalidFormat");
    expect(tooLong.issueCodes).toContain("tooLong");

    const repeated = validatePisPasepNumber("00000000000");
    expect(repeated.status).toBe("invalidFormat");
    expect(repeated.issueCodes).toContain("repeatedDigits");
    expect(repeated.issueCodes).toContain("checksumUnavailable");
  });

  test("keeps live search params content-free and ignores hostile query content", () => {
    const hostileParams = new URLSearchParams("pis=12044560080&conteudo=1&q=12044560080");
    const state = readPisPasepValidatorSearchParams(hostileParams);
    const safeParams = buildPisPasepValidatorSearchParams({ pis: "12044560080" });

    expect(state).toEqual({ pis: "" });
    expect(safeParams.params.toString()).toBe("");
  });

  test("builds default share URLs without identifier content, query, or fragment", () => {
    const result = buildPisPasepValidatorShareUrl(
      "https://calculaderia.com/validadores/validador-pis-pasep?pis=12044560080#conteudo=1&pis=99999999999",
      { pis: "12044560080" }
    );

    expect(result.url).toBe("https://calculaderia.com/validadores/validador-pis-pasep");
    expect(result.url).not.toContain("12044560080");
    expect(result.url).not.toContain("99999999999");
    expect(result.searchParams.toString()).toBe("");
    expect(result.fragmentParams.toString()).toBe("");
  });

  test("writes explicit shared content to the URL fragment only", () => {
    const contentFragment = buildPisPasepValidatorContentFragmentParams(
      { pis: "120.44560.08-0" },
      { includeContent: true }
    );
    const shareUrl = buildPisPasepValidatorShareUrl(
      "https://calculaderia.test/validadores/validador-pis-pasep?pis=ignored",
      { pis: "120.44560.08-0" },
      { includeContent: true }
    );
    const parsedShareUrl = new URL(shareUrl.url);
    const parsedFragment = new URLSearchParams(parsedShareUrl.hash.slice(1));

    expect(contentFragment.params.get("conteudo")).toBe("1");
    expect(contentFragment.params.get("pis")).toBe("12044560080");
    expect(parsedShareUrl.searchParams.get("pis")).toBeNull();
    expect(parsedShareUrl.searchParams.get("conteudo")).toBeNull();
    expect(parsedFragment.get("conteudo")).toBe("1");
    expect(parsedFragment.get("pis")).toBe("12044560080");
    expect(readPisPasepValidatorContentFromFragment(parsedShareUrl.hash)).toEqual({
      hasExplicitContent: true,
      pis: "12044560080",
      contentOmitted: false,
    });
  });

  test("sanitizes shared content and omits noisy or oversized fragments", () => {
    expect(sanitizePisPasepSharedInput("120.44560.08-0")).toBe("12044560080");
    expect(sanitizePisPasepSharedInput("12044560080A")).toBe("");
    expect(sanitizePisPasepSharedInput("120445600800")).toBe("");
    expect(readPisPasepValidatorContentFromFragment("pis=12044560080")).toEqual({
      hasExplicitContent: false,
      pis: "",
      contentOmitted: false,
    });

    const noisyShare = buildPisPasepValidatorContentFragmentParams({ pis: "12044560080A" }, { includeContent: true });
    expect(noisyShare.contentOmitted).toBe(true);
    expect(noisyShare.params.get("conteudo")).toBe("1");
    expect(noisyShare.params.get("pis")).toBeNull();

    expect(
      readPisPasepValidatorContentFromFragment("#conteudo=1&pis=12044560080", { maxFragmentLength: 10 })
    ).toEqual({
      hasExplicitContent: true,
      pis: "",
      contentOmitted: true,
    });
  });
});

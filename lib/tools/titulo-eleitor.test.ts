import { describe, expect, test } from "vitest";
import {
  buildTituloEleitorContentFragment,
  buildTituloEleitorSearchParams,
  buildTituloEleitorShareUrl,
  calculateTituloEleitorCheckDigits,
  formatTituloEleitorDigits,
  readTituloEleitorContentFromFragment,
  readTituloEleitorSearchParams,
  validateTituloEleitor,
} from "./titulo-eleitor";

describe("titulo eleitor helpers", () => {
  test("validates the public Santa Catarina example with common separators", () => {
    const result = validateTituloEleitor(" 0043 5687-09.06 ");

    expect(result.status).toBe("validChecksum");
    expect(result.digits).toBe("004356870906");
    expect(result.canonicalDigits).toBe("004356870906");
    expect(result.formattedNumber).toBe("0043 5687 09 06");
    expect(result.uf).toMatchObject({ code: "09", abbreviation: "SC", name: "Santa Catarina" });
    expect(result.expectedCheckDigits).toBe("06");
    expect(result.providedCheckDigits).toBe("06");
    expect(result.issueCodes).toContain("trimmedWhitespace");
    expect(result.issueCodes).toContain("validChecksum");
  });

  test("reports check-digit mismatches without treating them as format errors", () => {
    const result = validateTituloEleitor("0043 5687 09 07");

    expect(result.status).toBe("invalidChecksum");
    expect(result.expectedCheckDigits).toBe("06");
    expect(result.providedCheckDigits).toBe("07");
    expect(result.issueCodes).toContain("invalidChecksum");
    expect(result.issueCodes).not.toContain("checksumUnavailable");
  });

  test("rejects invalid UF codes before interpreting checksum results", () => {
    const invalidZero = validateTituloEleitor("004356870006");
    const invalidHigh = validateTituloEleitor("004356872906");

    expect(invalidZero.status).toBe("invalidUf");
    expect(invalidZero.uf).toBeNull();
    expect(invalidZero.issueCodes).toContain("invalidUf");
    expect(invalidHigh.status).toBe("invalidUf");
    expect(invalidHigh.ufCode).toBe("29");
  });

  test("rejects unsupported letters, emoji, punctuation, non-ASCII digits, and repeated fake values", () => {
    const unsupported = validateTituloEleitor("0043 A687 09🙂0٦!");

    expect(unsupported.status).toBe("invalidFormat");
    expect(unsupported.issueCodes).toContain("unsupportedCharacters");
    expect(unsupported.issueCodes).toContain("checksumUnavailable");

    const repeated = validateTituloEleitor("111111111111");
    expect(repeated.status).toBe("invalidFormat");
    expect(repeated.issueCodes).toContain("repeatedDigits");
  });

  test("reports empty, incomplete, too-long, and left-padded attention states", () => {
    expect(validateTituloEleitor("").status).toBe("empty");

    const incomplete = validateTituloEleitor("1234");
    expect(incomplete.status).toBe("incomplete");
    expect(incomplete.issueCodes).toContain("incompleteLength");

    const tooLong = validateTituloEleitor("1234567890123");
    expect(tooLong.status).toBe("invalidFormat");
    expect(tooLong.issueCodes).toContain("tooLong");

    const leftPadded = validateTituloEleitor("4356870906");
    expect(leftPadded.status).toBe("attention");
    expect(leftPadded.canonicalDigits).toBe("004356870906");
    expect(leftPadded.leftPadded).toBe(true);
    expect(leftPadded.issueCodes).toContain("leftPadded");
    expect(leftPadded.issueCodes).toContain("validChecksum");

    const leftPaddedInvalid = validateTituloEleitor("4356870907");
    expect(leftPaddedInvalid.status).toBe("attention");
    expect(leftPaddedInvalid.canonicalDigits).toBe("004356870907");
    expect(leftPaddedInvalid.leftPadded).toBe(true);
    expect(leftPaddedInvalid.issueCodes).toContain("leftPadded");
    expect(leftPaddedInvalid.issueCodes).toContain("invalidChecksum");
  });

  test("handles Sao Paulo and Minas Gerais remainder-zero special cases", () => {
    expect(calculateTituloEleitorCheckDigits("00000014", "01")).toMatchObject({
      first: "1",
      second: "6",
      firstRemainder: 0,
    });
    expect(validateTituloEleitor("000000140116").status).toBe("validChecksum");

    expect(calculateTituloEleitorCheckDigits("00000014", "02")).toMatchObject({
      first: "1",
      second: "3",
      firstRemainder: 0,
    });
    expect(validateTituloEleitor("000000140213").status).toBe("validChecksum");

    expect(calculateTituloEleitorCheckDigits("00000009", "01")).toMatchObject({
      first: "4",
      second: "1",
      secondRemainder: 0,
    });
    expect(validateTituloEleitor("000000090141").status).toBe("validChecksum");

    expect(calculateTituloEleitorCheckDigits("00000005", "03")).toMatchObject({
      first: "1",
      second: "0",
      secondRemainder: 0,
    });
    expect(validateTituloEleitor("000000050310").status).toBe("validChecksum");
  });

  test("formats and masks title digits predictably", () => {
    expect(formatTituloEleitorDigits("004356870906")).toBe("0043 5687 09 06");
    expect(validateTituloEleitor("004356870906").maskedNumber).toBe("**** **** ** 06");
  });

  test("keeps live query params empty and ignores hostile search params", () => {
    const hostileParams = new URLSearchParams("titulo=004356870906&valor=004356870906&q=x&conteudo=1");

    expect(readTituloEleitorSearchParams(hostileParams)).toEqual({ titulo: "" });
    expect(buildTituloEleitorSearchParams({ titulo: "004356870906" }).params.toString()).toBe("");
  });

  test("builds share URLs without content by default and hash-only content after explicit opt-in", () => {
    const baseUrl =
      "https://calculaderia.com/validadores/validador-titulo-eleitor?titulo=004356870906#conteudo=1&titulo=123";
    const defaultShare = buildTituloEleitorShareUrl(baseUrl, { titulo: "004356870906" });

    expect(defaultShare.url).toBe("https://calculaderia.com/validadores/validador-titulo-eleitor");
    expect(defaultShare.url).not.toContain("004356870906");
    expect(defaultShare.url).not.toContain("#");

    const contentShare = buildTituloEleitorShareUrl(baseUrl, { titulo: "0043 5687 09 06" }, { includeContent: true });
    expect(contentShare.url).toBe(
      "https://calculaderia.com/validadores/validador-titulo-eleitor#conteudo=1&titulo=004356870906"
    );
    expect(contentShare.searchParams.toString()).toBe("");
    expect(contentShare.fragmentParams.get("titulo")).toBe("004356870906");
  });

  test("reads content fragments only with explicit opt-in and a safe length budget", () => {
    expect(readTituloEleitorContentFromFragment("#titulo=004356870906")).toEqual({
      hasExplicitContent: false,
      titulo: "",
      contentOmitted: false,
    });
    expect(readTituloEleitorContentFromFragment("#conteudo=1&titulo=0043%205687%2009%2006")).toEqual({
      hasExplicitContent: true,
      titulo: "004356870906",
      contentOmitted: false,
    });
    expect(readTituloEleitorContentFromFragment(`#${"x".repeat(257)}`)).toEqual({
      hasExplicitContent: false,
      titulo: "",
      contentOmitted: true,
    });
    expect(buildTituloEleitorContentFragment({ titulo: "1234567890123" }, { includeContent: true })).toMatchObject({
      contentOmitted: true,
    });
  });
});

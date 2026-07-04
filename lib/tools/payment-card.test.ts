import { describe, expect, test } from "vitest";
import {
  buildPaymentCardValidatorSearchParams,
  buildPaymentCardValidatorShareUrl,
  calculateLuhnCheckDigit,
  maskPaymentCardDigits,
  normalizePaymentCardInput,
  readPaymentCardValidatorSearchParams,
  validateLuhn,
  validatePaymentCardNumber,
} from "./payment-card";

describe("payment card helpers", () => {
  test("validates a Luhn-valid card-like number with common separators", () => {
    const result = validatePaymentCardNumber(" 4242 4242-4242 4242 ");

    expect(result.status).toBe("validChecksum");
    expect(result.digits).toBe("4242424242424242");
    expect(result.expectedCheckDigit).toBe("2");
    expect(result.providedCheckDigit).toBe("2");
    expect(result.issueCodes).toContain("trimmedWhitespace");
    expect(result.issueCodes).toContain("validChecksum");
    expect(result.maskedNumber).toBe("**** **** **** 4242");
  });

  test("reports invalid Luhn check digits without treating them as format errors", () => {
    const result = validatePaymentCardNumber("4242 4242 4242 4243");

    expect(result.status).toBe("invalidChecksum");
    expect(result.expectedCheckDigit).toBe("2");
    expect(result.providedCheckDigit).toBe("3");
    expect(result.issueCodes).toContain("invalidChecksum");
    expect(result.issueCodes).not.toContain("luhnUnavailable");
  });

  test("computes expected Luhn check digits from payload digits", () => {
    expect(calculateLuhnCheckDigit("424242424242424")).toBe(2);
    expect(validateLuhn("4242424242424242")).toEqual({
      expectedCheckDigit: "2",
      providedCheckDigit: "2",
      valid: true,
    });
  });

  test("normalizes only ASCII digits and an explicit separator allowlist", () => {
    const result = normalizePaymentCardInput("4242\u00a04242\u20134242\u20144242");

    expect(result.digits).toBe("4242424242424242");
    expect(result.ignoredSeparatorCount).toBe(3);
    expect(result.unsupportedCharacters).toEqual([]);
  });

  test("rejects letters, punctuation, emoji, and non-ASCII digits", () => {
    const result = validatePaymentCardNumber("4242 ٤٢٤٢ 4242 🙂 4242!");

    expect(result.status).toBe("invalidFormat");
    expect(result.issueCodes).toContain("unsupportedCharacters");
    expect(result.issueCodes).toContain("luhnUnavailable");
    expect(result.issues.find((issue) => issue.code === "unsupportedCharacters")?.count).toBeGreaterThan(0);
  });

  test("reports empty, incomplete, too long, and repeated digit inputs", () => {
    expect(validatePaymentCardNumber("").status).toBe("empty");

    const incomplete = validatePaymentCardNumber("4242 4242");
    expect(incomplete.status).toBe("incomplete");
    expect(incomplete.issueCodes).toContain("incompleteLength");
    expect(incomplete.issueCodes).toContain("luhnUnavailable");

    const tooLong = validatePaymentCardNumber("12345678901234567890");
    expect(tooLong.status).toBe("invalidFormat");
    expect(tooLong.issueCodes).toContain("tooLong");

    const repeated = validatePaymentCardNumber("0000 0000 0000 0000");
    expect(repeated.status).toBe("invalidFormat");
    expect(repeated.issueCodes).toContain("repeatedDigits");
    expect(repeated.issueCodes).toContain("luhnUnavailable");
  });

  test("masks summaries without exposing the full typed value", () => {
    expect(maskPaymentCardDigits("1")).toBe("*");
    expect(maskPaymentCardDigits("123")).toBe("***");
    expect(maskPaymentCardDigits("1234")).toBe("****");
    expect(maskPaymentCardDigits("123456789012345")).toBe("**** **** ***2 345");
    expect(maskPaymentCardDigits("4242424242424242")).toBe("**** **** **** 4242");
    expect(maskPaymentCardDigits("1234567890123456789")).toBe("**** **** **** ***6 789");

    const result = validatePaymentCardNumber("4242424242424242", { masked: false });
    expect(result.displayNumber).toBe("4242 4242 4242 4242");
    expect(result.maskedNumber).toBe("**** **** **** 4242");
  });

  test("reads and builds only the masking setting in query params", () => {
    const hostileParams = new URLSearchParams("numero=4242424242424242&pan=4111111111111111&mascarado=0&q=card");
    const state = readPaymentCardValidatorSearchParams(hostileParams);

    expect(state).toEqual({ numero: "", mascarado: false });
    expect(buildPaymentCardValidatorSearchParams({ numero: "4242424242424242", mascarado: true }).params.toString()).toBe(
      ""
    );
    expect(buildPaymentCardValidatorSearchParams({ numero: "4242424242424242", mascarado: false }).params.toString()).toBe(
      "mascarado=0"
    );
  });

  test("builds share URLs without card digits, unknown params, or fragments", () => {
    const result = buildPaymentCardValidatorShareUrl(
      "https://calculaderia.com/validadores/validador-cartao?numero=4242424242424242#conteudo=1&card=4111111111111111",
      { numero: "4242424242424242", mascarado: false }
    );

    expect(result.url).toBe("https://calculaderia.com/validadores/validador-cartao?mascarado=0");
    expect(result.url).not.toContain("4242424242424242");
    expect(result.url).not.toContain("4111111111111111");
    expect(result.url).not.toContain("#");
  });
});

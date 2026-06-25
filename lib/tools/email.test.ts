import { describe, expect, test } from "vitest";
import {
  EMAIL_VALIDATOR_MAX_DOMAIN_LENGTH,
  EMAIL_VALIDATOR_MAX_DOMAIN_LABEL_LENGTH,
  buildEmailValidatorContentFragmentParams,
  buildEmailValidatorSearchParams,
  buildEmailValidatorShareUrl,
  readEmailValidatorContentFromFragment,
  readEmailValidatorStateFromParams,
  validateEmailSyntax,
  type EmailValidatorState,
} from "./email";

describe("email validator tool", () => {
  test("returns a neutral empty state for empty or whitespace-only input", () => {
    expect(validateEmailSyntax("").status).toBe("empty");
    expect(validateEmailSyntax(" \n\t ").status).toBe("empty");
    expect(validateEmailSyntax("").normalizedEmail).toBeNull();
  });

  test("accepts common addresses and preserves local-part case", () => {
    expect(validateEmailSyntax("user@example.com")).toMatchObject({
      status: "valid",
      normalizedEmail: "user@example.com",
    });
    expect(validateEmailSyntax("first.last+tag@example.com")).toMatchObject({
      status: "valid",
      normalizedEmail: "first.last+tag@example.com",
    });
    expect(validateEmailSyntax("Usuario+tag@Example.COM")).toMatchObject({
      status: "valid",
      normalizedEmail: "Usuario+tag@example.com",
    });
    expect(validateEmailSyntax("dev_ops/release=canary?@mail.example.co.uk")).toMatchObject({
      status: "valid",
      normalizedEmail: "dev_ops/release=canary?@mail.example.co.uk",
    });
  });

  test("normalizes IDN domains through URL hostname handling", () => {
    const result = validateEmailSyntax("user@exämple.com");

    expect(result.status).toBe("valid");
    expect(result.normalizedEmail).toBe("user@xn--exmple-cua.com");
    expect(result.issues).toContain("domainIdnNormalized");
  });

  test("returns attention for trimmed whitespace and non-ASCII local parts", () => {
    const trimmed = validateEmailSyntax(" Usuario@example.com ");
    expect(trimmed.status).toBe("attention");
    expect(trimmed.normalizedEmail).toBe("Usuario@example.com");
    expect(trimmed.issues).toContain("trimmedWhitespace");

    const smtpUtf8 = validateEmailSyntax("usuário@example.com");
    expect(smtpUtf8.status).toBe("attention");
    expect(smtpUtf8.normalizedEmail).toBe("usuário@example.com");
    expect(smtpUtf8.issues).toContain("nonAsciiLocalPart");
  });

  test("rejects missing or repeated at signs", () => {
    expect(validateEmailSyntax("usuario.example.com").issues).toContain("missingAt");
    expect(validateEmailSyntax("usuario@@example.com").issues).toContain("multipleAt");
    expect(validateEmailSyntax("@example.com").issues).toContain("missingLocalPart");
    expect(validateEmailSyntax("usuario@").issues).toContain("missingDomain");
  });

  test("rejects whitespace, controls, and overlong input", () => {
    expect(validateEmailSyntax("usuario exemplo@example.com").issues).toContain("internalWhitespace");
    expect(validateEmailSyntax("usuario\n@example.com").issues).toEqual(
      expect.arrayContaining(["asciiControl", "internalWhitespace"])
    );
    expect(validateEmailSyntax(`${"a".repeat(321)}@example.com`).issues).toContain("inputTooLong");
  });

  test("rejects malformed local parts", () => {
    expect(validateEmailSyntax(".user@example.com").issues).toContain("localPartStartsWithDot");
    expect(validateEmailSyntax("user.@example.com").issues).toContain("localPartEndsWithDot");
    expect(validateEmailSyntax("first..last@example.com").issues).toContain("localPartConsecutiveDots");
    expect(validateEmailSyntax("user:tag@example.com").issues).toContain("localPartInvalidCharacters");
    expect(validateEmailSyntax(`${"a".repeat(65)}@example.com`).issues).toContain("localPartTooLong");
  });

  test("rejects malformed domains", () => {
    expect(validateEmailSyntax("user@example").issues).toContain("domainNeedsDot");
    expect(validateEmailSyntax("user@example..com").issues).toContain("domainEmptyLabel");
    expect(validateEmailSyntax("user@-example.com").issues).toContain("domainLabelStartsOrEndsWithHyphen");
    expect(validateEmailSyntax("user@example-.com").issues).toContain("domainLabelStartsOrEndsWithHyphen");
    expect(validateEmailSyntax("user@exa_mple.com").issues).toContain("domainInvalidCharacters");
    expect(validateEmailSyntax("user@example%2ecom").issues).toContain("domainInvalidCharacters");
    expect(validateEmailSyntax("user@%65xample.com").issues).toContain("domainInvalidCharacters");
    const backslashDomain = validateEmailSyntax("user@example.com\\foo");
    expect(backslashDomain.status).toBe("invalid");
    expect(backslashDomain.normalizedEmail).toBeNull();
    expect(backslashDomain.issues).toContain("domainInvalidCharacters");
    expect(validateEmailSyntax(`user@${"a".repeat(EMAIL_VALIDATOR_MAX_DOMAIN_LABEL_LENGTH + 1)}.com`).issues).toContain(
      "domainLabelTooLong"
    );
    expect(
      validateEmailSyntax(
        `user@${"a".repeat(63)}.${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(
          EMAIL_VALIDATOR_MAX_DOMAIN_LENGTH - 63 * 3 - 4
        )}.com`
      ).issues
    ).toContain("domainTooLong");
    expect(validateEmailSyntax("user@xn--.com").issues).toContain("domainInvalidIdn");
  });

  test("rejects unsupported RFC edge forms for v1 common syntax", () => {
    expect(validateEmailSyntax("Name <usuario@example.com>").issues).toContain("displayNameUnsupported");
    expect(validateEmailSyntax('"a b"@example.com').issues).toContain("quotedLocalPartUnsupported");
    expect(validateEmailSyntax("user(comment)@example.com").issues).toContain("commentsUnsupported");
    expect(validateEmailSyntax("user@[192.0.2.1]").issues).toContain("domainLiteralUnsupported");
    expect(validateEmailSyntax("a@example.com,b@example.com").issues).toContain("multipleAddressesUnsupported");
  });

  test("reads and writes only safe URL search params", () => {
    const state: EmailValidatorState = {
      email: "pessoa@example.com",
      mode: "comum",
    };
    const safeParams = buildEmailValidatorSearchParams(state);

    expect(safeParams.params.get("email")).toBeNull();
    expect(safeParams.params.get("conteudo")).toBeNull();
    expect(safeParams.params.toString()).toBe("");

    expect(readEmailValidatorStateFromParams(new URLSearchParams("modo=relatorio&email=vazou@example.com"))).toEqual({
      email: "",
      mode: "comum",
    });
  });

  test("writes explicit shared email to the URL fragment only", () => {
    const state: EmailValidatorState = {
      email: "pessoa@example.com",
      mode: "comum",
    };
    const contentFragment = buildEmailValidatorContentFragmentParams(state, { includeContent: true });
    const shareUrl = buildEmailValidatorShareUrl("https://calculaderia.test/validadores/validador-email", state, {
      includeContent: true,
    });
    const parsedShareUrl = new URL(shareUrl.url);
    const parsedFragment = new URLSearchParams(parsedShareUrl.hash.slice(1));

    expect(contentFragment.params.get("conteudo")).toBe("1");
    expect(contentFragment.params.get("email")).toBe("pessoa@example.com");
    expect(parsedShareUrl.searchParams.get("email")).toBeNull();
    expect(parsedShareUrl.searchParams.get("conteudo")).toBeNull();
    expect(parsedFragment.get("conteudo")).toBe("1");
    expect(parsedFragment.get("email")).toBe("pessoa@example.com");
    expect(readEmailValidatorContentFromFragment(parsedShareUrl.hash)).toEqual({
      hasExplicitContent: true,
      email: "pessoa@example.com",
    });
    expect(readEmailValidatorContentFromFragment("email=ignorado@example.com")).toEqual({
      hasExplicitContent: false,
      email: "",
    });
  });

  test("omits shared email when the fragment would exceed the URL budget", () => {
    const result = buildEmailValidatorContentFragmentParams(
      {
        email: "conteudo-grande@example.com",
        mode: "comum",
      },
      { includeContent: true, maxFragmentLength: 20 }
    );

    expect(result.contentOmitted).toBe(true);
    expect(result.params.get("conteudo")).toBe("1");
    expect(result.params.get("email")).toBeNull();
  });
});

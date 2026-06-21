import { describe, expect, test } from "vitest";
import {
  BASE64_CONVERTER_MAX_INPUT_LENGTH,
  buildBase64ContentFragmentParams,
  buildBase64SearchParams,
  buildBase64ShareUrl,
  decodeBase64,
  encodeBase64,
  getBase64TextMetrics,
  processBase64Converter,
  readBase64ContentFromFragment,
  readBase64StateFromParams,
  type Base64ConverterState,
} from "./base64";

describe("base64 converter tool", () => {
  test("returns neutral empty states without throwing", () => {
    expect(encodeBase64("").status).toBe("empty");
    expect(decodeBase64("").status).toBe("empty");
    expect(decodeBase64(" \n\t ").status).toBe("empty");

    const whitespaceRejected = decodeBase64(" \n\t ", "base64", false);

    expect(whitespaceRejected.status).toBe("invalidBase64");
    expect(whitespaceRejected.error?.code).toBe("invalidCharacter");
  });

  test("encodes and decodes ASCII text with standard Base64", () => {
    const encoded = encodeBase64("Hello");

    expect(encoded.status).toBe("valid");
    expect(encoded.output).toBe("SGVsbG8=");
    expect(encoded.warnings).toEqual([]);

    const decoded = decodeBase64("SGVsbG8=");

    expect(decoded.status).toBe("valid");
    expect(decoded.output).toBe("Hello");
    expect(decoded.normalizedInput).toBe("SGVsbG8=");
  });

  test("roundtrips UTF-8 text with accents, combining marks, and emoji", () => {
    const input = "Ola com acento: Olá, café, e\u0301 👋🏽";
    const encoded = encodeBase64(input);
    const decoded = decodeBase64(encoded.output);

    expect(encoded.status).toBe("valid");
    expect(decoded.status).toBe("valid");
    expect(decoded.output).toBe(input);
    expect(encoded.inputMetrics.bytes).toBe(new TextEncoder().encode(input).length);
  });

  test("supports Base64URL alphabet and optional padding", () => {
    expect(encodeBase64("💩", "base64").output).toBe("8J+SqQ==");
    expect(encodeBase64("💩", "base64url").output).toBe("8J-SqQ==");

    const urlWithoutPadding = encodeBase64("\u083f", "base64url", false);

    expect(urlWithoutPadding.output).toBe("4KC_");
    expect(urlWithoutPadding.warnings).toContain("paddingOmitted");
    expect(decodeBase64(urlWithoutPadding.output, "base64url").output).toBe("\u083f");
  });

  test("infers recoverable missing padding while decoding", () => {
    const result = decodeBase64("SGVsbG8");

    expect(result.status).toBe("valid");
    expect(result.output).toBe("Hello");
    expect(result.normalizedInput).toBe("SGVsbG8=");
    expect(result.warnings).toContain("paddingInferred");
  });

  test("ignores wrapped whitespace only when configured", () => {
    const ignored = decodeBase64("SGVs\n bG8=");

    expect(ignored.status).toBe("valid");
    expect(ignored.output).toBe("Hello");
    expect(ignored.normalizedInput).toBe("SGVsbG8=");
    expect(ignored.warnings).toContain("whitespaceIgnored");

    const rejected = decodeBase64("SGVs\n bG8=", "base64", false);

    expect(rejected.status).toBe("invalidBase64");
    expect(rejected.error?.code).toBe("invalidCharacter");
  });

  test("rejects malformed Base64 syntax with stable error codes", () => {
    expect(decodeBase64("SGV%").error?.code).toBe("invalidCharacter");
    expect(decodeBase64("8J+SqQ-_").error?.code).toBe("mixedAlphabet");
    expect(decodeBase64("SG=VsbG8=").error?.code).toBe("invalidPadding");
    expect(decodeBase64("SGVsbG8===").error?.code).toBe("invalidPadding");
    expect(decodeBase64("abcde").error?.code).toBe("invalidLength");
  });

  test("distinguishes syntactically valid Base64 from invalid UTF-8 bytes", () => {
    const result = decodeBase64("/w==");

    expect(result.status).toBe("invalidUtf8");
    expect(result.error?.code).toBe("invalidUtf8");
    expect(result.output).toBe("");
  });

  test("reports deterministic metrics and input guardrail results", () => {
    const metrics = getBase64TextMetrics("Olá 👋");

    expect(metrics.characters).toBe(5);
    expect(metrics.bytes).toBe(new TextEncoder().encode("Olá 👋").length);

    const result = processBase64Converter({
      input: "a".repeat(BASE64_CONVERTER_MAX_INPUT_LENGTH + 1),
      mode: "codificar",
      alphabet: "base64",
      padding: true,
      ignoreWhitespace: true,
    });

    expect(result.status).toBe("tooLarge");
    expect(result.error?.code).toBe("inputTooLarge");
  });

  test("reads and writes only safe settings in URL search params", () => {
    const state: Base64ConverterState = {
      input: "token: privado",
      mode: "decodificar",
      alphabet: "base64url",
      padding: false,
      ignoreWhitespace: true,
    };

    const safeParams = buildBase64SearchParams(state);

    expect(safeParams.params.get("modo")).toBe("decodificar");
    expect(safeParams.params.get("alfabeto")).toBe("base64url");
    expect(safeParams.params.get("padding")).toBe("0");
    expect(safeParams.params.get("ignorarEspacos")).toBe("1");
    expect(safeParams.params.get("conteudo")).toBeNull();
    expect(safeParams.params.get("entrada")).toBeNull();

    expect(
      readBase64StateFromParams(
        new URLSearchParams("modo=decodificar&alfabeto=base64url&padding=0&ignorarEspacos=1&conteudo=1&entrada=ignorado")
      )
    ).toEqual({
      input: "",
      mode: "decodificar",
      alphabet: "base64url",
      padding: false,
      ignoreWhitespace: true,
    });
    expect(readBase64StateFromParams(new URLSearchParams("modo=zip&alfabeto=hex&padding=x&ignorarEspacos=y"))).toEqual({
      input: "",
      mode: "codificar",
      alphabet: "base64",
      padding: true,
      ignoreWhitespace: true,
    });
  });

  test("writes explicit shared input to the URL fragment only", () => {
    const state: Base64ConverterState = {
      input: "token: privado",
      mode: "codificar",
      alphabet: "base64url",
      padding: false,
      ignoreWhitespace: true,
    };
    const contentFragment = buildBase64ContentFragmentParams(state, { includeContent: true });
    const shareUrl = buildBase64ShareUrl("https://calculaderia.test/dev/conversor-base64", state, {
      includeContent: true,
    });
    const parsedShareUrl = new URL(shareUrl.url);
    const parsedFragment = new URLSearchParams(parsedShareUrl.hash.slice(1));

    expect(contentFragment.params.get("conteudo")).toBe("1");
    expect(contentFragment.params.get("entrada")).toBe("token: privado");
    expect(parsedShareUrl.searchParams.get("modo")).toBe("codificar");
    expect(parsedShareUrl.searchParams.get("alfabeto")).toBe("base64url");
    expect(parsedShareUrl.searchParams.get("entrada")).toBeNull();
    expect(parsedShareUrl.searchParams.get("conteudo")).toBeNull();
    expect(parsedFragment.get("conteudo")).toBe("1");
    expect(parsedFragment.get("entrada")).toBe("token: privado");
    expect(readBase64ContentFromFragment(parsedShareUrl.hash)).toEqual({
      hasExplicitContent: true,
      input: "token: privado",
    });
    expect(readBase64ContentFromFragment("modo=codificar&entrada=ignorado")).toEqual({
      hasExplicitContent: false,
      input: "",
    });
  });

  test("omits shared input when the fragment would exceed the URL budget", () => {
    const result = buildBase64ContentFragmentParams(
      {
        input: "valor".repeat(100),
        mode: "codificar",
        alphabet: "base64",
        padding: true,
        ignoreWhitespace: true,
      },
      { includeContent: true, maxFragmentLength: 30 }
    );

    expect(result.contentOmitted).toBe(true);
    expect(result.params.get("conteudo")).toBe("1");
    expect(result.params.get("entrada")).toBeNull();
  });
});

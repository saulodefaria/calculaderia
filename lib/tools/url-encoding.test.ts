import { describe, expect, test, vi } from "vitest";
import {
  URL_ENCODING_MAX_INPUT_LENGTH,
  buildUrlEncodingContentFragmentParams,
  buildUrlEncodingSearchParams,
  buildUrlEncodingShareUrl,
  decodeUrlValue,
  encodeUrlValue,
  getUrlEncodingTextMetrics,
  processUrlEncoding,
  readUrlEncodingContentFromFragment,
  readUrlEncodingStateFromParams,
  type UrlEncodingState,
} from "./url-encoding";

describe("url encoding tool", () => {
  test("returns neutral empty states without throwing", () => {
    expect(encodeUrlValue("").status).toBe("empty");
    expect(decodeUrlValue("").status).toBe("empty");
    expect(decodeUrlValue("", "form").normalizedInput).toBe("");
  });

  test("encodes URL components and roundtrips UTF-8 text", () => {
    const encoded = encodeUrlValue("cafe com acucar & valor=10/20?");

    expect(encoded.status).toBe("valid");
    expect(encoded.output).toBe("cafe%20com%20acucar%20%26%20valor%3D10%2F20%3F");
    expect(encoded.outputMetrics?.percentTriplets).toBe(8);

    const utf8Input = "café 👋";
    const utf8Encoded = encodeUrlValue(utf8Input);
    const decoded = decodeUrlValue(utf8Encoded.output);

    expect(utf8Encoded.output).toBe("caf%C3%A9%20%F0%9F%91%8B");
    expect(decoded.status).toBe("valid");
    expect(decoded.output).toBe(utf8Input);
  });

  test("preserves URI delimiters in full URI context", () => {
    const result = encodeUrlValue("https://exemplo.test/a b?x=1&y=2#frag", "uri");

    expect(result.status).toBe("valid");
    expect(result.output).toBe("https://exemplo.test/a%20b?x=1&y=2#frag");
    expect(result.warnings).toContain("reservedDelimitersPreserved");
  });

  test("uses application/x-www-form-urlencoded value semantics", () => {
    const encoded = encodeUrlValue("nome=Joao Maria+Silva", "form");
    const decoded = decodeUrlValue(encoded.output, "form");
    const plusDecoded = decodeUrlValue("Joao+Maria%2BSilva", "form");

    expect(encoded.status).toBe("valid");
    expect(encoded.output).toBe("nome%3DJoao+Maria%2BSilva");
    expect(decoded.output).toBe("nome=Joao Maria+Silva");
    expect(plusDecoded.output).toBe("Joao Maria+Silva");
    expect(plusDecoded.normalizedInput).toBe("Joao Maria%2BSilva");
    expect(plusDecoded.warnings).toContain("plusAsSpace");
  });

  test("applies strict RFC 3986 component encoding", () => {
    const result = encodeUrlValue("!'()*", "componente", true);

    expect(result.status).toBe("valid");
    expect(result.output).toBe("%21%27%28%29%2A");
    expect(result.warnings).toContain("strictRfc3986Applied");
  });

  test("leaves RFC 3986 extra component characters literal when strict mode is off", () => {
    const result = encodeUrlValue("!'()*", "componente", false);

    expect(result.status).toBe("valid");
    expect(result.output).toBe("!'()*");
    expect(result.warnings).not.toContain("strictRfc3986Applied");
  });

  test("returns decoded literal percent triplets without uppercasing them", () => {
    const result = decodeUrlValue("%25ab");

    expect(result.status).toBe("valid");
    expect(result.output).toBe("%ab");
    expect(result.outputMetrics?.percentTriplets).toBe(1);
    expect(result.warnings).toContain("possibleDoubleEncoding");
  });

  test("rejects malformed percent escapes before decoding", () => {
    for (const input of ["%", "%G0", "%E0%A4%A"]) {
      const result = decodeUrlValue(input);

      expect(result.status).toBe("malformedPercent");
      expect(result.error?.code).toBe("malformedPercent");
    }
  });

  test("distinguishes malformed UTF-8 from malformed percent syntax", () => {
    const result = decodeUrlValue("%C3%28");

    expect(result.status).toBe("invalidUtf8");
    expect(result.error?.code).toBe("invalidUtf8");
    expect(result.output).toBe("");
  });

  test("rejects unpaired UTF-16 surrogates during encoding", () => {
    const result = encodeUrlValue("\uD800");

    expect(result.status).toBe("invalidUnicode");
    expect(result.error?.code).toBe("invalidUnicode");
  });

  test("reports deterministic metrics and input guardrail results", () => {
    const metrics = getUrlEncodingTextMetrics("Olá\n%20 👋");

    expect(metrics.characters).toBe(9);
    expect(metrics.bytes).toBe(new TextEncoder().encode("Olá\n%20 👋").length);
    expect(metrics.lines).toBe(2);
    expect(metrics.percentTriplets).toBe(1);

    const originalTextEncoder = globalThis.TextEncoder;

    vi.stubGlobal(
      "TextEncoder",
      class {
        encode() {
          throw new Error("too-large input should not compute full metrics");
        }
      }
    );

    try {
      const result = processUrlEncoding({
        input: "a".repeat(URL_ENCODING_MAX_INPUT_LENGTH + 1),
        mode: "codificar",
        context: "componente",
        strict: false,
      });

      expect(result.status).toBe("tooLarge");
      expect(result.error?.code).toBe("inputTooLarge");
      expect(result.inputMetrics).toEqual({
        characters: URL_ENCODING_MAX_INPUT_LENGTH + 1,
        bytes: URL_ENCODING_MAX_INPUT_LENGTH + 1,
        lines: 1,
        percentTriplets: 0,
      });
      expect(result.outputMetrics).toBeNull();
    } finally {
      vi.stubGlobal("TextEncoder", originalTextEncoder);
    }
  });

  test("warns about likely already encoded and double encoded content", () => {
    const alreadyEncoded = encodeUrlValue("a%20b");
    const doubleEncoded = decodeUrlValue("%252Fapi%253Ftoken%253Dabc");

    expect(alreadyEncoded.output).toBe("a%2520b");
    expect(alreadyEncoded.warnings).toContain("possibleAlreadyEncoded");
    expect(doubleEncoded.output).toBe("%2Fapi%3Ftoken%3Dabc");
    expect(doubleEncoded.warnings).toContain("possibleDoubleEncoding");
  });

  test("reads and writes only safe URL search params", () => {
    const state: UrlEncodingState = {
      input: "token=privado",
      mode: "decodificar",
      context: "form",
      strict: true,
    };
    const safeParams = buildUrlEncodingSearchParams(state);

    expect(safeParams.params.get("modo")).toBe("decodificar");
    expect(safeParams.params.get("contexto")).toBe("form");
    expect(safeParams.params.get("estrito")).toBe("1");
    expect(safeParams.params.get("entrada")).toBeNull();
    expect(safeParams.params.get("conteudo")).toBeNull();

    expect(
      readUrlEncodingStateFromParams(
        new URLSearchParams("modo=decodificar&contexto=form&estrito=1&conteudo=1&entrada=ignorado")
      )
    ).toEqual({
      input: "",
      mode: "decodificar",
      context: "form",
      strict: true,
    });
    expect(readUrlEncodingStateFromParams(new URLSearchParams("modo=zip&contexto=html&estrito=x"))).toEqual({
      input: "",
      mode: "codificar",
      context: "componente",
      strict: false,
    });
  });

  test("writes explicit shared input to the URL fragment only", () => {
    const state: UrlEncodingState = {
      input: "token=privado&assinatura=abc",
      mode: "decodificar",
      context: "form",
      strict: false,
    };
    const contentFragment = buildUrlEncodingContentFragmentParams(state, { includeContent: true });
    const shareUrl = buildUrlEncodingShareUrl("https://calculaderia.test/dev/url-encode-decode", state, {
      includeContent: true,
    });
    const parsedShareUrl = new URL(shareUrl.url);
    const parsedFragment = new URLSearchParams(parsedShareUrl.hash.slice(1));

    expect(contentFragment.params.get("conteudo")).toBe("1");
    expect(contentFragment.params.get("entrada")).toBe("token=privado&assinatura=abc");
    expect(parsedShareUrl.searchParams.get("modo")).toBe("decodificar");
    expect(parsedShareUrl.searchParams.get("contexto")).toBe("form");
    expect(parsedShareUrl.searchParams.get("estrito")).toBe("0");
    expect(parsedShareUrl.searchParams.get("entrada")).toBeNull();
    expect(parsedShareUrl.searchParams.get("conteudo")).toBeNull();
    expect(parsedFragment.get("conteudo")).toBe("1");
    expect(parsedFragment.get("entrada")).toBe("token=privado&assinatura=abc");
    expect(readUrlEncodingContentFromFragment(parsedShareUrl.hash)).toEqual({
      hasExplicitContent: true,
      input: "token=privado&assinatura=abc",
    });
    expect(readUrlEncodingContentFromFragment("modo=codificar&entrada=ignorado")).toEqual({
      hasExplicitContent: false,
      input: "",
    });
  });

  test("omits shared input when the fragment would exceed the URL budget", () => {
    const result = buildUrlEncodingContentFragmentParams(
      {
        input: "valor".repeat(100),
        mode: "codificar",
        context: "componente",
        strict: false,
      },
      { includeContent: true, maxFragmentLength: 30 }
    );

    expect(result.contentOmitted).toBe(true);
    expect(result.params.get("conteudo")).toBe("1");
    expect(result.params.get("entrada")).toBeNull();
  });
});

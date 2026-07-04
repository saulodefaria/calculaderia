import { describe, expect, test } from "vitest";
import {
  JWT_DECODER_MAX_INPUT_LENGTH,
  buildJwtDecoderSearchParams,
  buildJwtDecoderShareUrl,
  processJwtDecoder,
  readJwtDecoderStateFromUrl,
  shouldSanitizeJwtDecoderUrl,
  type JwtDecoderState,
} from "./jwt";

const REFERENCE_NOW_MS = Date.UTC(2026, 0, 1, 0, 0, 0);

function encodeJsonPart(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function encodePaddedJsonPart(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function encodeTextPart(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function compactToken(header: unknown, payload: unknown, signature = "signature"): string {
  return `${encodeJsonPart(header)}.${encodeJsonPart(payload)}.${encodeTextPart(signature)}`;
}

function decode(token: string, nowMs = REFERENCE_NOW_MS) {
  const state: JwtDecoderState = { token };

  return processJwtDecoder(state, { nowMs });
}

describe("jwt decoder tool", () => {
  test("returns a neutral empty state for blank input", () => {
    const result = decode(" \n\t ");

    expect(result.status).toBe("empty");
    expect(result.error).toBeNull();
    expect(result.parts).toEqual([]);
  });

  test("decodes a valid compact JWS header, payload, registered claims, and NumericDate rows", () => {
    const token = compactToken(
      { alg: "HS256", typ: "JWT", kid: "demo-key" },
      {
        iss: "https://issuer.example",
        sub: "user-123",
        aud: ["api.example"],
        exp: 1893456000,
        nbf: 1735689600,
        iat: 1735689600,
        jti: "demo-token",
        role: "admin",
      }
    );
    const result = decode(token);

    expect(result.status).toBe("valid");
    expect(result.tokenKind).toBe("jws");
    expect(result.headerJson).toMatchObject({ alg: "HS256", typ: "JWT", kid: "demo-key" });
    expect(result.payloadJson).toMatchObject({ sub: "user-123", role: "admin" });
    expect(result.formattedHeader).toContain('"alg": "HS256"');
    expect(result.formattedPayload).toContain('"role": "admin"');
    expect(result.algorithmInfo).toEqual({ value: "HS256", family: "HMAC" });
    expect(result.registeredClaims.map((claim) => claim.claim)).toEqual(["iss", "sub", "aud", "exp", "nbf", "iat", "jti"]);
    expect(result.registeredClaims.find((claim) => claim.claim === "aud")?.rawValue).toBe('["api.example"]');
    expect(result.timeClaims.find((claim) => claim.claim === "exp")).toMatchObject({
      seconds: 1893456000,
      isoUtc: "2030-01-01T00:00:00.000Z",
      status: "valid",
    });
    expect(result.parts).toEqual([
      expect.objectContaining({ name: "header", decoded: true, isEmpty: false }),
      expect.objectContaining({ name: "payload", decoded: true, isEmpty: false }),
      expect.objectContaining({ name: "signature", decoded: true, isEmpty: false }),
    ]);
    expect(result.warnings).toEqual(["notVerified", "payloadVisibleNotEncrypted"]);
  });

  test("accepts a simple Bearer prefix and reports that it was ignored", () => {
    const token = compactToken({ alg: "RS256", typ: "JWT" }, { sub: "user-123" });
    const result = decode(`Bearer ${token}`);

    expect(result.status).toBe("valid");
    expect(result.normalizedToken).toBe(token);
    expect(result.algorithmInfo.family).toBe("RSA");
    expect(result.warnings).toContain("bearerPrefixIgnored");
  });

  test("detects unsecured alg=none tokens without treating an empty signature as a malformed token", () => {
    const token = `${encodeJsonPart({ alg: "none", typ: "JWT" })}.${encodeJsonPart({ sub: "demo" })}.`;
    const result = decode(token);

    expect(result.status).toBe("valid");
    expect(result.tokenKind).toBe("unsecuredJws");
    expect(result.parts[2]).toMatchObject({ name: "signature", isEmpty: true, decodedByteLength: 0 });
    expect(result.warnings).toContain("algNone");
    expect(result.warnings).not.toContain("emptySignature");
  });

  test("warns when a signed algorithm has an empty signature segment", () => {
    const token = `${encodeJsonPart({ alg: "HS256", typ: "JWT" })}.${encodeJsonPart({ sub: "demo" })}.`;
    const result = decode(token);

    expect(result.status).toBe("valid");
    expect(result.tokenKind).toBe("jws");
    expect(result.warnings).toContain("emptySignature");
  });

  test("reports time-claim warnings for expired, future, and invalid NumericDate values", () => {
    const token = compactToken(
      { alg: "ES256", typ: "JWT", crit: ["demo"] },
      {
        exp: 1767225599,
        nbf: 1767229200,
        iat: 1767229200,
        jti: "time-demo",
      }
    );
    const invalidNumericToken = compactToken({ alg: "ES256" }, { exp: "tomorrow", nbf: null, iat: { seconds: 1 } });

    const result = decode(token);
    expect(result.algorithmInfo.family).toBe("ECDSA");
    expect(result.timeClaims.map((claim) => [claim.claim, claim.status])).toEqual([
      ["exp", "expired"],
      ["nbf", "notYetValid"],
      ["iat", "issuedInFuture"],
    ]);
    expect(result.warnings).toEqual(
      expect.arrayContaining(["expired", "notYetValid", "issuedInFuture", "critNotInterpreted"])
    );

    const invalidNumeric = decode(invalidNumericToken);
    expect(invalidNumeric.status).toBe("valid");
    expect(invalidNumeric.timeClaims.every((claim) => claim.status === "invalid")).toBe(true);
    expect(invalidNumeric.warnings).toEqual(expect.arrayContaining(["invalidNumericDate", "missingTyp"]));
  });

  test("detects unsupported compact JWE and decodes only the protected header when possible", () => {
    const header = encodeJsonPart({ alg: "dir", enc: "A256GCM", typ: "JWT" });
    const result = decode(`${header}..aXY.Y2lwaGVydGV4dA.dGFn`);

    expect(result.status).toBe("unsupportedJwe");
    expect(result.tokenKind).toBe("jweUnsupported");
    expect(result.partCount).toBe(5);
    expect(result.headerJson).toMatchObject({ alg: "dir", enc: "A256GCM", typ: "JWT" });
    expect(result.payloadJson).toBeNull();
    expect(result.warnings).toEqual(expect.arrayContaining(["notVerified", "jweHeaderOnly"]));
  });

  test("returns stable invalid branches for part count, whitespace, and oversized input", () => {
    expect(decode("abc.def").status).toBe("invalidPartCount");
    expect(decode("abc def.ghi.jkl").error).toEqual({ code: "internalWhitespace", part: "token" });
    expect(decode("Bearer").error).toEqual({ code: "emptyBearerToken", part: "token" });

    const tooLarge = decode("a".repeat(JWT_DECODER_MAX_INPUT_LENGTH + 1));

    expect(tooLarge.status).toBe("tooLarge");
    expect(tooLarge.error).toEqual({ code: "inputTooLarge", part: "token" });
  });

  test("rejects malformed Base64URL, non-standard padding errors, invalid UTF-8, invalid JSON, and bad JSON shapes", () => {
    expect(decode("abc+.def.ghi")).toMatchObject({
      status: "invalidBase64url",
      error: { code: "invalidBase64urlCharacter", part: "header" },
    });
    expect(decode("a.def.ghi")).toMatchObject({
      status: "invalidBase64url",
      error: { code: "invalidBase64urlLength", part: "header" },
    });
    expect(decode("_w.abc.def")).toMatchObject({
      status: "invalidUtf8",
      error: { code: "invalidUtf8", part: "header" },
    });
    expect(decode(`${encodeTextPart("not json")}.${encodeJsonPart({ sub: "demo" })}.sig`)).toMatchObject({
      status: "invalidJson",
      error: { code: "invalidJson", part: "header" },
    });
    expect(decode(compactToken(["alg"], { sub: "demo" }))).toMatchObject({
      status: "invalidHeaderShape",
      error: { code: "invalidHeaderShape", part: "header" },
    });
    expect(decode(compactToken({ alg: "HS256", typ: "JWT" }, ["claim"]))).toMatchObject({
      status: "invalidPayloadShape",
      error: { code: "invalidPayloadShape", part: "payload" },
    });
  });

  test("accepts trailing Base64URL padding as non-standard input with a warning", () => {
    const token = `${encodePaddedJsonPart({ alg: "PS256", typ: "JWT" })}.${encodePaddedJsonPart({
      sub: "demo",
    })}.${encodeTextPart("signature")}`;
    const result = decode(token);

    expect(result.status).toBe("valid");
    expect(result.algorithmInfo.family).toBe("RSA-PSS");
    expect(result.warnings).toContain("nonStandardPadding");
  });

  test("keeps JWT content out of URL state and default share URLs", () => {
    const params = new URLSearchParams("token=secret.jwt.value&jwt=secret&entrada=conteudo");

    expect(readJwtDecoderStateFromUrl(params, "#token=secret.jwt.value")).toEqual({ token: "" });
    expect(buildJwtDecoderSearchParams().toString()).toBe("");
    expect(buildJwtDecoderShareUrl("https://calculaderia.test/dev/jwt-decoder?token=secret#token=secret")).toBe(
      "https://calculaderia.test/dev/jwt-decoder"
    );
    expect(shouldSanitizeJwtDecoderUrl(params, "")).toBe(true);
    expect(shouldSanitizeJwtDecoderUrl(new URLSearchParams(), "#jwt=secret")).toBe(true);
    expect(shouldSanitizeJwtDecoderUrl(new URLSearchParams(), "")).toBe(false);
  });
});

export type JwtDecoderStatus =
  | "empty"
  | "valid"
  | "unsupportedJwe"
  | "invalidPartCount"
  | "invalidBase64url"
  | "invalidUtf8"
  | "invalidJson"
  | "invalidHeaderShape"
  | "invalidPayloadShape"
  | "tooLarge";

export type JwtTokenKind = "jws" | "unsecuredJws" | "jweUnsupported" | "unknown";

export type JwtPartName = "header" | "payload" | "signature" | "encryptedKey" | "iv" | "ciphertext" | "tag";

export type JwtDecoderWarning =
  | "notVerified"
  | "bearerPrefixIgnored"
  | "algNone"
  | "missingAlg"
  | "missingTyp"
  | "ambiguousTyp"
  | "emptySignature"
  | "nonStandardPadding"
  | "expired"
  | "notYetValid"
  | "issuedInFuture"
  | "invalidNumericDate"
  | "critNotInterpreted"
  | "jweHeaderOnly"
  | "payloadVisibleNotEncrypted";

export type JwtDecoderErrorCode =
  | "inputTooLarge"
  | "emptyBearerToken"
  | "internalWhitespace"
  | "invalidPartCount"
  | "emptyHeader"
  | "emptyPayload"
  | "invalidBase64urlCharacter"
  | "invalidBase64urlPadding"
  | "invalidBase64urlLength"
  | "invalidUtf8"
  | "invalidJson"
  | "invalidHeaderShape"
  | "invalidPayloadShape";

export type JwtAlgorithmFamily = "HMAC" | "RSA" | "ECDSA" | "RSA-PSS" | "none" | "unknown";

export type JwtRegisteredClaimCode = "iss" | "sub" | "aud" | "exp" | "nbf" | "iat" | "jti";

export type JwtTimeClaimStatus = "valid" | "expired" | "notYetValid" | "issued" | "issuedInFuture" | "invalid";

export interface JwtDecoderState {
  token: string;
}

export interface JwtDecoderProcessOptions {
  nowMs?: number;
}

export interface JwtDecoderError {
  code: JwtDecoderErrorCode;
  part: JwtPartName | "token";
}

export interface JwtPartMetadata {
  name: JwtPartName;
  encodedLength: number;
  decodedByteLength: number | null;
  isEmpty: boolean;
  decoded: boolean;
}

export interface JwtAlgorithmInfo {
  value: string | null;
  family: JwtAlgorithmFamily;
}

export interface JwtRegisteredClaimRow {
  claim: JwtRegisteredClaimCode;
  rawValue: string;
  valueKind: string;
}

export interface JwtTimeClaimRow {
  claim: Extract<JwtRegisteredClaimCode, "exp" | "nbf" | "iat">;
  rawValue: unknown;
  seconds: number | null;
  isoUtc: string | null;
  status: JwtTimeClaimStatus;
  deltaSeconds: number | null;
}

export interface JwtDecoderResult {
  status: JwtDecoderStatus;
  tokenKind: JwtTokenKind;
  partCount: number;
  normalizedToken: string;
  parts: JwtPartMetadata[];
  headerJson: Record<string, unknown> | null;
  payloadJson: Record<string, unknown> | null;
  formattedHeader: string;
  formattedPayload: string;
  registeredClaims: JwtRegisteredClaimRow[];
  timeClaims: JwtTimeClaimRow[];
  algorithmInfo: JwtAlgorithmInfo;
  warnings: JwtDecoderWarning[];
  error: JwtDecoderError | null;
}

interface Base64UrlDecodeSuccess {
  ok: true;
  bytes: Uint8Array;
  warnings: JwtDecoderWarning[];
}

interface Base64UrlDecodeFailure {
  ok: false;
  error: JwtDecoderErrorCode;
}

type Base64UrlDecodeResult = Base64UrlDecodeSuccess | Base64UrlDecodeFailure;

interface JsonSegmentDecodeSuccess {
  ok: true;
  value: unknown;
  formatted: string;
  decodedByteLength: number;
  warnings: JwtDecoderWarning[];
}

interface JsonSegmentDecodeFailure {
  ok: false;
  status: JwtDecoderStatus;
  error: JwtDecoderError;
  decodedByteLength: number | null;
  warnings: JwtDecoderWarning[];
}

type JsonSegmentDecodeResult = JsonSegmentDecodeSuccess | JsonSegmentDecodeFailure;

export const JWT_DECODER_MAX_INPUT_LENGTH = 20_000;

export const defaultJwtDecoderState: JwtDecoderState = {
  token: "",
};

export const JWT_DECODER_SAFE_EXAMPLE_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImRlbW8ta2V5In0.eyJpc3MiOiJodHRwczovL2lzc3Vlci5leGFtcGxlIiwic3ViIjoidXNlci0xMjMiLCJhdWQiOlsiYXBpLmV4YW1wbGUiXSwiZXhwIjoxODkzNDU2MDAwLCJuYmYiOjE3MzU2ODk2MDAsImlhdCI6MTczNTY4OTYwMCwianRpIjoiZGVtby10b2tlbiJ9.ZXhhbXBsZS1zaWduYXR1cmU";

const URL_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const asciiWhitespacePattern = /[\t\n\f\r ]/;
const trimAsciiWhitespacePattern = /^[\t\n\f\r ]+|[\t\n\f\r ]+$/g;
const base64UrlDecodeMap = new Map<string, number>(
  Array.from(URL_ALPHABET).map((character, index) => [character, index])
);
const registeredClaimOrder: JwtRegisteredClaimCode[] = ["iss", "sub", "aud", "exp", "nbf", "iat", "jti"];
const timeClaimOrder: JwtTimeClaimRow["claim"][] = ["exp", "nbf", "iat"];

function getTextDecoder() {
  return new TextDecoder("utf-8", { fatal: true });
}

function appendWarning(warnings: JwtDecoderWarning[], warning: JwtDecoderWarning) {
  if (!warnings.includes(warning)) {
    warnings.push(warning);
  }
}

function appendWarnings(warnings: JwtDecoderWarning[], nextWarnings: JwtDecoderWarning[]) {
  for (const warning of nextWarnings) {
    appendWarning(warnings, warning);
  }
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getValueKind(value: unknown): string {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";

  return typeof value;
}

function formatRawClaimValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || value === null) return String(value);

  return JSON.stringify(value);
}

function decodeBase64UrlToBytes(segment: string): Base64UrlDecodeResult {
  const warnings: JwtDecoderWarning[] = [];

  if (/[+/]/.test(segment) || !/^[A-Za-z0-9\-_=]*$/.test(segment)) {
    return { ok: false, error: "invalidBase64urlCharacter" };
  }

  const firstPaddingIndex = segment.indexOf("=");
  const paddingCount = firstPaddingIndex === -1 ? 0 : segment.length - firstPaddingIndex;

  if (paddingCount > 0) {
    appendWarning(warnings, "nonStandardPadding");
  }

  if (paddingCount > 2 || (firstPaddingIndex !== -1 && !/^=+$/.test(segment.slice(firstPaddingIndex)))) {
    return { ok: false, error: "invalidBase64urlPadding" };
  }

  if (paddingCount > 0 && segment.length % 4 !== 0) {
    return { ok: false, error: "invalidBase64urlPadding" };
  }

  const lengthModulo = segment.length % 4;

  if (lengthModulo === 1) {
    return { ok: false, error: "invalidBase64urlLength" };
  }

  const normalized = lengthModulo === 2 || lengthModulo === 3 ? `${segment}${"=".repeat(4 - lengthModulo)}` : segment;
  const bytes: number[] = [];

  for (let index = 0; index < normalized.length; index += 4) {
    const first = base64UrlDecodeMap.get(normalized[index]);
    const second = base64UrlDecodeMap.get(normalized[index + 1]);
    const thirdCharacter = normalized[index + 2];
    const fourthCharacter = normalized[index + 3];
    const third = thirdCharacter === "=" ? 0 : base64UrlDecodeMap.get(thirdCharacter);
    const fourth = fourthCharacter === "=" ? 0 : base64UrlDecodeMap.get(fourthCharacter);

    if (
      first === undefined ||
      second === undefined ||
      third === undefined ||
      fourth === undefined ||
      (thirdCharacter === "=" && fourthCharacter !== "=")
    ) {
      return { ok: false, error: "invalidBase64urlPadding" };
    }

    const triplet = (first << 18) | (second << 12) | (third << 6) | fourth;
    bytes.push((triplet >> 16) & 255);

    if (thirdCharacter !== "=") {
      bytes.push((triplet >> 8) & 255);
    }

    if (fourthCharacter !== "=") {
      bytes.push(triplet & 255);
    }
  }

  return {
    ok: true,
    bytes: new Uint8Array(bytes),
    warnings,
  };
}

function decodeJsonSegment(segment: string, part: JwtPartName): JsonSegmentDecodeResult {
  const decoded = decodeBase64UrlToBytes(segment);

  if (!decoded.ok) {
    return {
      ok: false,
      status: "invalidBase64url",
      error: { code: decoded.error, part },
      decodedByteLength: null,
      warnings: [],
    };
  }

  let decodedText = "";

  try {
    decodedText = getTextDecoder().decode(decoded.bytes);
  } catch {
    return {
      ok: false,
      status: "invalidUtf8",
      error: { code: "invalidUtf8", part },
      decodedByteLength: decoded.bytes.length,
      warnings: decoded.warnings,
    };
  }

  try {
    const value = JSON.parse(decodedText) as unknown;

    return {
      ok: true,
      value,
      formatted: JSON.stringify(value, null, 2),
      decodedByteLength: decoded.bytes.length,
      warnings: decoded.warnings,
    };
  } catch {
    return {
      ok: false,
      status: "invalidJson",
      error: { code: "invalidJson", part },
      decodedByteLength: decoded.bytes.length,
      warnings: decoded.warnings,
    };
  }
}

function getPartNames(partCount: number): JwtPartName[] {
  if (partCount === 5) {
    return ["header", "encryptedKey", "iv", "ciphertext", "tag"];
  }

  return ["header", "payload", "signature"];
}

function buildPartMetadata(parts: string[]): JwtPartMetadata[] {
  const names = getPartNames(parts.length);

  return parts.map((part, index) => ({
    name: names[index] ?? "payload",
    encodedLength: part.length,
    decodedByteLength: null,
    isEmpty: part.length === 0,
    decoded: false,
  }));
}

function setPartDecoded(parts: JwtPartMetadata[], index: number, decodedByteLength: number | null) {
  const part = parts[index];
  if (!part) return;

  parts[index] = {
    ...part,
    decoded: decodedByteLength !== null,
    decodedByteLength,
  };
}

function getAlgorithmFamily(value: string | null): JwtAlgorithmFamily {
  if (!value) return "unknown";
  if (value === "none") return "none";
  if (/^HS(256|384|512)$/.test(value)) return "HMAC";
  if (/^RS(256|384|512)$/.test(value)) return "RSA";
  if (/^ES(256|384|512)$/.test(value)) return "ECDSA";
  if (/^PS(256|384|512)$/.test(value)) return "RSA-PSS";

  return "unknown";
}

function getAlgorithmInfo(headerJson: Record<string, unknown> | null): JwtAlgorithmInfo {
  const rawAlgorithm = headerJson?.alg;
  const value = typeof rawAlgorithm === "string" && rawAlgorithm.length > 0 ? rawAlgorithm : null;

  return {
    value,
    family: getAlgorithmFamily(value),
  };
}

function normalizeTokenInput(input: string): {
  token: string;
  warnings: JwtDecoderWarning[];
  error: JwtDecoderError | null;
} {
  const trimmed = input.replace(trimAsciiWhitespacePattern, "");
  const warnings: JwtDecoderWarning[] = [];

  if (/^Bearer(?:[\t ]|$)/i.test(trimmed)) {
    const match = /^Bearer[\t ]+([^\t\n\f\r ]+)$/i.exec(trimmed);

    if (!match) {
      return {
        token: "",
        warnings,
        error: {
          code: trimmed.length === "Bearer".length ? "emptyBearerToken" : "internalWhitespace",
          part: "token",
        },
      };
    }

    appendWarning(warnings, "bearerPrefixIgnored");

    return {
      token: match[1],
      warnings,
      error: null,
    };
  }

  if (asciiWhitespacePattern.test(trimmed)) {
    return {
      token: trimmed,
      warnings,
      error: { code: "internalWhitespace", part: "token" },
    };
  }

  return {
    token: trimmed,
    warnings,
    error: null,
  };
}

function buildRegisteredClaims(payloadJson: Record<string, unknown>): JwtRegisteredClaimRow[] {
  return registeredClaimOrder
    .filter((claim) => Object.hasOwn(payloadJson, claim))
    .map((claim) => {
      const value = payloadJson[claim];

      return {
        claim,
        rawValue: formatRawClaimValue(value),
        valueKind: getValueKind(value),
      };
    });
}

function analyzeTimeClaim(
  claim: JwtTimeClaimRow["claim"],
  rawValue: unknown,
  nowSeconds: number
): JwtTimeClaimRow {
  if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) {
    return {
      claim,
      rawValue,
      seconds: null,
      isoUtc: null,
      status: "invalid",
      deltaSeconds: null,
    };
  }

  const milliseconds = rawValue * 1000;
  const date = new Date(milliseconds);

  if (!Number.isFinite(milliseconds) || Number.isNaN(date.getTime())) {
    return {
      claim,
      rawValue,
      seconds: null,
      isoUtc: null,
      status: "invalid",
      deltaSeconds: null,
    };
  }

  let status: JwtTimeClaimStatus = "valid";

  if (claim === "exp") {
    status = nowSeconds >= rawValue ? "expired" : "valid";
  } else if (claim === "nbf") {
    status = nowSeconds < rawValue ? "notYetValid" : "valid";
  } else if (claim === "iat") {
    status = nowSeconds < rawValue ? "issuedInFuture" : "issued";
  }

  return {
    claim,
    rawValue,
    seconds: rawValue,
    isoUtc: date.toISOString(),
    status,
    deltaSeconds: rawValue - nowSeconds,
  };
}

function buildTimeClaims(payloadJson: Record<string, unknown>, nowMs: number): JwtTimeClaimRow[] {
  const nowSeconds = nowMs / 1000;

  return timeClaimOrder
    .filter((claim) => Object.hasOwn(payloadJson, claim))
    .map((claim) => analyzeTimeClaim(claim, payloadJson[claim], nowSeconds));
}

function buildEmptyResult(): JwtDecoderResult {
  return {
    status: "empty",
    tokenKind: "unknown",
    partCount: 0,
    normalizedToken: "",
    parts: [],
    headerJson: null,
    payloadJson: null,
    formattedHeader: "",
    formattedPayload: "",
    registeredClaims: [],
    timeClaims: [],
    algorithmInfo: { value: null, family: "unknown" },
    warnings: [],
    error: null,
  };
}

function buildFailureResult(
  status: JwtDecoderStatus,
  options: {
    normalizedToken: string;
    parts?: JwtPartMetadata[];
    headerJson?: Record<string, unknown> | null;
    formattedHeader?: string;
    warnings?: JwtDecoderWarning[];
    error: JwtDecoderError;
    tokenKind?: JwtTokenKind;
  }
): JwtDecoderResult {
  return {
    status,
    tokenKind: options.tokenKind ?? "unknown",
    partCount: options.parts?.length ?? 0,
    normalizedToken: options.normalizedToken,
    parts: options.parts ?? [],
    headerJson: options.headerJson ?? null,
    payloadJson: null,
    formattedHeader: options.formattedHeader ?? "",
    formattedPayload: "",
    registeredClaims: [],
    timeClaims: [],
    algorithmInfo: getAlgorithmInfo(options.headerJson ?? null),
    warnings: options.warnings ?? [],
    error: options.error,
  };
}

function buildJweResult(
  normalizedToken: string,
  parts: JwtPartMetadata[],
  headerDecode: JsonSegmentDecodeResult,
  prefixWarnings: JwtDecoderWarning[]
): JwtDecoderResult {
  const warnings: JwtDecoderWarning[] = [...prefixWarnings, "notVerified", "jweHeaderOnly"];

  if (!headerDecode.ok) {
    appendWarnings(warnings, headerDecode.warnings);

    return {
      status: "unsupportedJwe",
      tokenKind: "jweUnsupported",
      partCount: parts.length,
      normalizedToken,
      parts,
      headerJson: null,
      payloadJson: null,
      formattedHeader: "",
      formattedPayload: "",
      registeredClaims: [],
      timeClaims: [],
      algorithmInfo: { value: null, family: "unknown" },
      warnings,
      error: headerDecode.error,
    };
  }

  appendWarnings(warnings, headerDecode.warnings);
  setPartDecoded(parts, 0, headerDecode.decodedByteLength);

  const headerJson = isJsonObject(headerDecode.value) ? headerDecode.value : null;

  return {
    status: "unsupportedJwe",
    tokenKind: "jweUnsupported",
    partCount: parts.length,
    normalizedToken,
    parts,
    headerJson,
    payloadJson: null,
    formattedHeader: headerJson ? headerDecode.formatted : "",
    formattedPayload: "",
    registeredClaims: [],
    timeClaims: [],
    algorithmInfo: getAlgorithmInfo(headerJson),
    warnings,
    error: null,
  };
}

export function processJwtDecoder(
  state: JwtDecoderState,
  options: JwtDecoderProcessOptions = {}
): JwtDecoderResult {
  if (state.token.length > JWT_DECODER_MAX_INPUT_LENGTH) {
    return buildFailureResult("tooLarge", {
      normalizedToken: "",
      error: { code: "inputTooLarge", part: "token" },
    });
  }

  const normalized = normalizeTokenInput(state.token);

  if (normalized.error) {
    return buildFailureResult("invalidPartCount", {
      normalizedToken: normalized.token,
      warnings: normalized.warnings,
      error: normalized.error,
    });
  }

  if (normalized.token.length === 0) {
    return buildEmptyResult();
  }

  const tokenParts = normalized.token.split(".");
  const parts = buildPartMetadata(tokenParts);

  if (tokenParts.length === 5) {
    const headerDecode = decodeJsonSegment(tokenParts[0], "header");
    return buildJweResult(normalized.token, parts, headerDecode, normalized.warnings);
  }

  if (tokenParts.length !== 3) {
    return buildFailureResult("invalidPartCount", {
      normalizedToken: normalized.token,
      parts,
      warnings: normalized.warnings,
      error: { code: "invalidPartCount", part: "token" },
    });
  }

  const [headerSegment, payloadSegment, signatureSegment] = tokenParts;

  if (!headerSegment) {
    return buildFailureResult("invalidBase64url", {
      normalizedToken: normalized.token,
      parts,
      warnings: normalized.warnings,
      error: { code: "emptyHeader", part: "header" },
    });
  }

  if (!payloadSegment) {
    return buildFailureResult("invalidBase64url", {
      normalizedToken: normalized.token,
      parts,
      warnings: normalized.warnings,
      error: { code: "emptyPayload", part: "payload" },
    });
  }

  const warnings: JwtDecoderWarning[] = [...normalized.warnings];
  const headerDecode = decodeJsonSegment(headerSegment, "header");

  if (!headerDecode.ok) {
    appendWarnings(warnings, headerDecode.warnings);

    return buildFailureResult(headerDecode.status, {
      normalizedToken: normalized.token,
      parts,
      warnings,
      error: headerDecode.error,
    });
  }

  appendWarnings(warnings, headerDecode.warnings);
  setPartDecoded(parts, 0, headerDecode.decodedByteLength);

  if (!isJsonObject(headerDecode.value)) {
    return buildFailureResult("invalidHeaderShape", {
      normalizedToken: normalized.token,
      parts,
      warnings,
      error: { code: "invalidHeaderShape", part: "header" },
    });
  }

  const payloadDecode = decodeJsonSegment(payloadSegment, "payload");

  if (!payloadDecode.ok) {
    appendWarnings(warnings, payloadDecode.warnings);

    return buildFailureResult(payloadDecode.status, {
      normalizedToken: normalized.token,
      parts,
      headerJson: headerDecode.value,
      formattedHeader: headerDecode.formatted,
      warnings,
      error: payloadDecode.error,
    });
  }

  appendWarnings(warnings, payloadDecode.warnings);
  setPartDecoded(parts, 1, payloadDecode.decodedByteLength);

  if (!isJsonObject(payloadDecode.value)) {
    return buildFailureResult("invalidPayloadShape", {
      normalizedToken: normalized.token,
      parts,
      headerJson: headerDecode.value,
      formattedHeader: headerDecode.formatted,
      warnings,
      error: { code: "invalidPayloadShape", part: "payload" },
    });
  }

  const algorithmInfo = getAlgorithmInfo(headerDecode.value);

  appendWarning(warnings, "notVerified");
  appendWarning(warnings, "payloadVisibleNotEncrypted");

  if (!algorithmInfo.value) {
    appendWarning(warnings, "missingAlg");
  } else if (algorithmInfo.value === "none") {
    appendWarning(warnings, "algNone");
  }

  if (typeof headerDecode.value.typ !== "string") {
    appendWarning(warnings, "missingTyp");
  } else if (headerDecode.value.typ.toUpperCase() !== "JWT") {
    appendWarning(warnings, "ambiguousTyp");
  }

  if (Object.hasOwn(headerDecode.value, "crit")) {
    appendWarning(warnings, "critNotInterpreted");
  }

  if (signatureSegment.length === 0) {
    setPartDecoded(parts, 2, 0);

    if (algorithmInfo.value !== "none") {
      appendWarning(warnings, "emptySignature");
    }
  } else {
    const signatureDecode = decodeBase64UrlToBytes(signatureSegment);

    if (!signatureDecode.ok) {
      return buildFailureResult("invalidBase64url", {
        normalizedToken: normalized.token,
        parts,
        headerJson: headerDecode.value,
        formattedHeader: headerDecode.formatted,
        warnings,
        error: { code: signatureDecode.error, part: "signature" },
      });
    }

    appendWarnings(warnings, signatureDecode.warnings);
    setPartDecoded(parts, 2, signatureDecode.bytes.length);
  }

  const timeClaims = buildTimeClaims(payloadDecode.value, options.nowMs ?? Date.now());

  for (const timeClaim of timeClaims) {
    if (timeClaim.status === "invalid") appendWarning(warnings, "invalidNumericDate");
    if (timeClaim.status === "expired") appendWarning(warnings, "expired");
    if (timeClaim.status === "notYetValid") appendWarning(warnings, "notYetValid");
    if (timeClaim.status === "issuedInFuture") appendWarning(warnings, "issuedInFuture");
  }

  return {
    status: "valid",
    tokenKind: algorithmInfo.value === "none" && signatureSegment.length === 0 ? "unsecuredJws" : "jws",
    partCount: parts.length,
    normalizedToken: normalized.token,
    parts,
    headerJson: headerDecode.value,
    payloadJson: payloadDecode.value,
    formattedHeader: headerDecode.formatted,
    formattedPayload: payloadDecode.formatted,
    registeredClaims: buildRegisteredClaims(payloadDecode.value),
    timeClaims,
    algorithmInfo,
    warnings,
    error: null,
  };
}

export function readJwtDecoderStateFromUrl(
  searchParams: URLSearchParams,
  hash: string = ""
): JwtDecoderState {
  void searchParams;
  void hash;

  return {
    ...defaultJwtDecoderState,
  };
}

export function buildJwtDecoderSearchParams(): URLSearchParams {
  return new URLSearchParams();
}

export function buildJwtDecoderShareUrl(baseUrl: string): string {
  const markerIndex = baseUrl.search(/[?#]/);

  return markerIndex === -1 ? baseUrl : baseUrl.slice(0, markerIndex);
}

export function shouldSanitizeJwtDecoderUrl(searchParams: URLSearchParams, hash: string): boolean {
  return searchParams.toString().length > 0 || hash.length > 0;
}

export function buildJwtDecoderDiagnosticSummary(result: JwtDecoderResult): string {
  const lines = [
    `status: ${result.status}`,
    `tokenKind: ${result.tokenKind}`,
    `partCount: ${result.partCount}`,
    `algorithm: ${result.algorithmInfo.value ?? "unknown"}`,
    `algorithmFamily: ${result.algorithmInfo.family}`,
  ];

  if (result.error) {
    lines.push(`error: ${result.error.code}`, `errorPart: ${result.error.part}`);
  }

  if (result.warnings.length > 0) {
    lines.push(`warnings: ${result.warnings.join(", ")}`);
  }

  if (result.timeClaims.length > 0) {
    lines.push(`timeClaims: ${result.timeClaims.map((claim) => `${claim.claim}:${claim.status}`).join(", ")}`);
  }

  return lines.join("\n");
}

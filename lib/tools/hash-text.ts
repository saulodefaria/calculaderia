export type HashTextAlgorithmId = "sha-256" | "sha-384" | "sha-512" | "sha-1" | "md5";
export type HashTextOutputFormat = "hex" | "base64" | "base64url";
export type HashTextStatus = "empty" | "hashing" | "valid" | "tooLarge" | "unsupported" | "error";
export type HashTextSecurityLevel = "recommended" | "legacy";
export type HashTextWarning =
  | "legacyAlgorithm"
  | "md5CollisionRisk"
  | "sha1Retired"
  | "exactWhitespace"
  | "inputTooLarge"
  | "subtleCryptoUnavailable";
export type HashTextErrorCode = "inputTooLarge" | "subtleCryptoUnavailable" | "digestFailed";

export interface HashTextAlgorithm {
  id: HashTextAlgorithmId;
  label: string;
  webCryptoName: AlgorithmIdentifier | null;
  digestBits: number;
  digestBytes: number;
  securityLevel: HashTextSecurityLevel;
}

export interface HashTextState {
  input: string;
  algorithm: HashTextAlgorithmId;
  format: HashTextOutputFormat;
  uppercaseHex: boolean;
}

export interface HashTextInputMetrics {
  characters: number;
  utf8Bytes: number;
  lines: number;
}

export interface HashTextDigestMetrics {
  digestBits: number;
  digestBytes: number;
  outputLength: number;
}

export interface HashTextComparison {
  algorithm: HashTextAlgorithm;
  hash: string;
  digestMetrics: HashTextDigestMetrics;
  warnings: HashTextWarning[];
}

export interface HashTextError {
  code: HashTextErrorCode;
}

export interface HashTextResult {
  status: HashTextStatus;
  algorithm: HashTextAlgorithm;
  format: HashTextOutputFormat;
  uppercaseHex: boolean;
  securityLevel: HashTextSecurityLevel;
  inputMetrics: HashTextInputMetrics;
  digestMetrics: HashTextDigestMetrics | null;
  hash: string;
  warnings: HashTextWarning[];
  error: HashTextError | null;
  comparisons: HashTextComparison[];
}

export interface HashTextSearchParamsResult {
  params: URLSearchParams;
  queryLength: number;
}

export interface HashTextContentFragmentResult {
  params: URLSearchParams;
  contentOmitted: boolean;
  fragmentLength: number;
}

export interface HashTextContentFragmentState {
  hasExplicitContent: boolean;
  input: string;
}

export interface HashTextShareUrlResult {
  url: string;
  searchParams: URLSearchParams;
  fragmentParams: URLSearchParams;
  contentOmitted: boolean;
}

export type HashTextDigestProvider = Pick<Crypto, "subtle"> | null | undefined;

export const HASH_TEXT_MAX_INPUT_LENGTH = 1_000_000;
export const HASH_TEXT_SHARE_FRAGMENT_LIMIT = 1_800;

export const hashTextAlgorithms: HashTextAlgorithm[] = [
  {
    id: "sha-256",
    label: "SHA-256",
    webCryptoName: "SHA-256",
    digestBits: 256,
    digestBytes: 32,
    securityLevel: "recommended",
  },
  {
    id: "sha-384",
    label: "SHA-384",
    webCryptoName: "SHA-384",
    digestBits: 384,
    digestBytes: 48,
    securityLevel: "recommended",
  },
  {
    id: "sha-512",
    label: "SHA-512",
    webCryptoName: "SHA-512",
    digestBits: 512,
    digestBytes: 64,
    securityLevel: "recommended",
  },
  {
    id: "sha-1",
    label: "SHA-1",
    webCryptoName: "SHA-1",
    digestBits: 160,
    digestBytes: 20,
    securityLevel: "legacy",
  },
  {
    id: "md5",
    label: "MD5",
    webCryptoName: null,
    digestBits: 128,
    digestBytes: 16,
    securityLevel: "legacy",
  },
];

export const defaultHashTextState: HashTextState = {
  input: "",
  algorithm: "sha-256",
  format: "hex",
  uppercaseHex: false,
};

const algorithmIds = new Set<HashTextAlgorithmId>(hashTextAlgorithms.map((algorithm) => algorithm.id));
const outputFormats = new Set<HashTextOutputFormat>(["hex", "base64", "base64url"]);
const comparisonAlgorithmIds: HashTextAlgorithmId[] = ["sha-256", "sha-1", "md5"];
const base64Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const md5ShiftAmounts = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5,
  9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10,
  15, 21, 6, 10, 15, 21,
];
const md5Constants = Array.from({ length: 64 }, (_, index) =>
  Math.floor(Math.abs(Math.sin(index + 1)) * 2 ** 32) >>> 0
);

function getTextEncoder() {
  return new TextEncoder();
}

function getGlobalDigestProvider(): HashTextDigestProvider {
  return typeof globalThis.crypto === "object" ? globalThis.crypto : null;
}

function leftRotate(value: number, bits: number) {
  return ((value << bits) | (value >>> (32 - bits))) >>> 0;
}

function numberToLittleEndianBytes(value: number) {
  return [value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255];
}

export function getHashTextAlgorithm(algorithmId: HashTextAlgorithmId): HashTextAlgorithm {
  return hashTextAlgorithms.find((algorithm) => algorithm.id === algorithmId) ?? hashTextAlgorithms[0];
}

export function normalizeHashTextAlgorithm(value: string | null | undefined): HashTextAlgorithmId {
  return value && algorithmIds.has(value as HashTextAlgorithmId)
    ? (value as HashTextAlgorithmId)
    : defaultHashTextState.algorithm;
}

export function normalizeHashTextOutputFormat(value: string | null | undefined): HashTextOutputFormat {
  return value && outputFormats.has(value as HashTextOutputFormat)
    ? (value as HashTextOutputFormat)
    : defaultHashTextState.format;
}

export function normalizeHashTextBoolean(value: string | null | undefined, fallback: boolean): boolean {
  if (value === "1") return true;
  if (value === "0") return false;

  return fallback;
}

export function getHashTextUtf8Bytes(input: string): Uint8Array {
  return getTextEncoder().encode(input);
}

export function getHashTextInputMetrics(input: string): HashTextInputMetrics {
  return {
    characters: Array.from(input).length,
    utf8Bytes: getHashTextUtf8Bytes(input).length,
    lines: input.length === 0 ? 0 : input.split(/\r\n|\r|\n/).length,
  };
}

export function encodeHashBytes(
  bytes: Uint8Array,
  format: HashTextOutputFormat,
  options: { uppercaseHex?: boolean } = {}
): string {
  if (format === "hex") {
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

    return options.uppercaseHex ? hex.toUpperCase() : hex;
  }

  let output = "";

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const hasSecond = index + 1 < bytes.length;
    const hasThird = index + 2 < bytes.length;
    const second = hasSecond ? bytes[index + 1] : 0;
    const third = hasThird ? bytes[index + 2] : 0;
    const triplet = (first << 16) | (second << 8) | third;

    output += base64Alphabet[(triplet >> 18) & 63];
    output += base64Alphabet[(triplet >> 12) & 63];
    output += hasSecond ? base64Alphabet[(triplet >> 6) & 63] : "=";
    output += hasThird ? base64Alphabet[triplet & 63] : "=";
  }

  if (format === "base64url") {
    return output.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  return output;
}

export function md5DigestBytes(input: Uint8Array): Uint8Array {
  const bitLength = input.length * 8;
  const paddingBytes = (56 - ((input.length + 1) % 64) + 64) % 64;
  const padded = new Uint8Array(input.length + 1 + paddingBytes + 8);
  const words = new Array<number>(16);

  padded.set(input);
  padded[input.length] = 0x80;

  for (let index = 0; index < 8; index += 1) {
    padded[padded.length - 8 + index] = Math.floor(bitLength / 2 ** (8 * index)) & 255;
  }

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let chunkStart = 0; chunkStart < padded.length; chunkStart += 64) {
    for (let wordIndex = 0; wordIndex < 16; wordIndex += 1) {
      const byteIndex = chunkStart + wordIndex * 4;
      words[wordIndex] =
        (padded[byteIndex] |
          (padded[byteIndex + 1] << 8) |
          (padded[byteIndex + 2] << 16) |
          (padded[byteIndex + 3] << 24)) >>>
        0;
    }

    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    for (let index = 0; index < 64; index += 1) {
      let f: number;
      let g: number;

      if (index < 16) {
        f = (b & c) | (~b & d);
        g = index;
      } else if (index < 32) {
        f = (d & b) | (~d & c);
        g = (5 * index + 1) % 16;
      } else if (index < 48) {
        f = b ^ c ^ d;
        g = (3 * index + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * index) % 16;
      }

      const nextD = c;
      const rotated = leftRotate((a + f + md5Constants[index] + words[g]) >>> 0, md5ShiftAmounts[index]);

      a = d;
      d = nextD;
      c = b;
      b = (b + rotated) >>> 0;
    }

    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  return new Uint8Array([
    ...numberToLittleEndianBytes(a0),
    ...numberToLittleEndianBytes(b0),
    ...numberToLittleEndianBytes(c0),
    ...numberToLittleEndianBytes(d0),
  ]);
}

function getHashTextWarnings(algorithm: HashTextAlgorithm, input: string): HashTextWarning[] {
  const warnings: HashTextWarning[] = [];

  if (algorithm.securityLevel === "legacy") {
    warnings.push("legacyAlgorithm");
  }

  if (algorithm.id === "md5") {
    warnings.push("md5CollisionRisk");
  }

  if (algorithm.id === "sha-1") {
    warnings.push("sha1Retired");
  }

  if (/\s/.test(input)) {
    warnings.push("exactWhitespace");
  }

  return warnings;
}

function createDigestMetrics(algorithm: HashTextAlgorithm, hash: string): HashTextDigestMetrics {
  return {
    digestBits: algorithm.digestBits,
    digestBytes: algorithm.digestBytes,
    outputLength: hash.length,
  };
}

function createBaseResult(
  state: HashTextState,
  status: HashTextStatus,
  inputMetrics: HashTextInputMetrics,
  options: {
    hash?: string;
    warnings?: HashTextWarning[];
    error?: HashTextError | null;
    comparisons?: HashTextComparison[];
  } = {}
): HashTextResult {
  const algorithm = getHashTextAlgorithm(state.algorithm);
  const hash = options.hash ?? "";

  return {
    status,
    algorithm,
    format: state.format,
    uppercaseHex: state.uppercaseHex,
    securityLevel: algorithm.securityLevel,
    inputMetrics,
    digestMetrics: hash ? createDigestMetrics(algorithm, hash) : null,
    hash,
    warnings: options.warnings ?? [],
    error: options.error ?? null,
    comparisons: options.comparisons ?? [],
  };
}

export function createHashTextHashingResult(state: HashTextState): HashTextResult {
  const normalizedState = normalizeHashTextState(state);

  return createBaseResult(normalizedState, "hashing", getHashTextInputMetrics(normalizedState.input));
}

function normalizeHashTextState(state: HashTextState): HashTextState {
  return {
    input: state.input,
    algorithm: normalizeHashTextAlgorithm(state.algorithm),
    format: normalizeHashTextOutputFormat(state.format),
    uppercaseHex: Boolean(state.uppercaseHex),
  };
}

async function digestBytes(
  algorithm: HashTextAlgorithm,
  inputBytes: Uint8Array,
  digestProvider: HashTextDigestProvider
): Promise<Uint8Array> {
  if (algorithm.id === "md5") {
    return md5DigestBytes(inputBytes);
  }

  if (!digestProvider?.subtle) {
    throw new Error("subtleCryptoUnavailable");
  }

  const digestInput = inputBytes.slice().buffer;
  const digest = await digestProvider.subtle.digest(algorithm.webCryptoName ?? algorithm.label, digestInput);

  return new Uint8Array(digest);
}

function createComparison(
  algorithm: HashTextAlgorithm,
  input: string,
  digest: Uint8Array,
  format: HashTextOutputFormat,
  uppercaseHex: boolean
): HashTextComparison {
  const hash = encodeHashBytes(digest, format, { uppercaseHex: format === "hex" && uppercaseHex });

  return {
    algorithm,
    hash,
    digestMetrics: createDigestMetrics(algorithm, hash),
    warnings: getHashTextWarnings(algorithm, input),
  };
}

export async function processHashText(
  state: HashTextState,
  options: { digestProvider?: HashTextDigestProvider; includeComparisons?: boolean } = {}
): Promise<HashTextResult> {
  const normalizedState = normalizeHashTextState(state);
  const algorithm = getHashTextAlgorithm(normalizedState.algorithm);
  const inputMetrics = getHashTextInputMetrics(normalizedState.input);
  const digestProvider = options.digestProvider === undefined ? getGlobalDigestProvider() : options.digestProvider;

  if (normalizedState.input.length === 0) {
    return createBaseResult(normalizedState, "empty", inputMetrics);
  }

  if (normalizedState.input.length > HASH_TEXT_MAX_INPUT_LENGTH) {
    return createBaseResult(normalizedState, "tooLarge", inputMetrics, {
      warnings: ["inputTooLarge"],
      error: { code: "inputTooLarge" },
    });
  }

  if (algorithm.id !== "md5" && !digestProvider?.subtle) {
    return createBaseResult(normalizedState, "unsupported", inputMetrics, {
      warnings: ["subtleCryptoUnavailable"],
      error: { code: "subtleCryptoUnavailable" },
    });
  }

  const inputBytes = getHashTextUtf8Bytes(normalizedState.input);
  const digestCache = new Map<HashTextAlgorithmId, Uint8Array>();
  let primaryDigest: Uint8Array;

  try {
    primaryDigest = await digestBytes(algorithm, inputBytes, digestProvider);
    digestCache.set(algorithm.id, primaryDigest);
  } catch {
    return createBaseResult(normalizedState, "error", inputMetrics, {
      error: { code: "digestFailed" },
    });
  }

  const hash = encodeHashBytes(primaryDigest, normalizedState.format, {
    uppercaseHex: normalizedState.format === "hex" && normalizedState.uppercaseHex,
  });
  const comparisons: HashTextComparison[] = [];

  if (options.includeComparisons !== false) {
    for (const algorithmId of comparisonAlgorithmIds) {
      const comparisonAlgorithm = getHashTextAlgorithm(algorithmId);

      try {
        const comparisonDigest =
          digestCache.get(algorithmId) ?? (await digestBytes(comparisonAlgorithm, inputBytes, digestProvider));
        digestCache.set(algorithmId, comparisonDigest);
        comparisons.push(
          createComparison(
            comparisonAlgorithm,
            normalizedState.input,
            comparisonDigest,
            normalizedState.format,
            normalizedState.uppercaseHex
          )
        );
      } catch {
        if (comparisonAlgorithm.id === algorithm.id) {
          throw new Error("Selected hash comparison failed unexpectedly.");
        }
      }
    }
  }

  return createBaseResult(normalizedState, "valid", inputMetrics, {
    hash,
    warnings: getHashTextWarnings(algorithm, normalizedState.input),
    comparisons,
  });
}

export function readHashTextStateFromParams(params: URLSearchParams): HashTextState {
  return {
    input: defaultHashTextState.input,
    algorithm: normalizeHashTextAlgorithm(params.get("alg")),
    format: normalizeHashTextOutputFormat(params.get("fmt")),
    uppercaseHex: normalizeHashTextBoolean(params.get("upper"), defaultHashTextState.uppercaseHex),
  };
}

export function readHashTextContentFromFragment(fragment: string): HashTextContentFragmentState {
  const normalizedFragment = fragment.startsWith("#") ? fragment.slice(1) : fragment;
  const params = new URLSearchParams(normalizedFragment);
  const hasExplicitContent = params.get("conteudo") === "1";

  return {
    hasExplicitContent,
    input: hasExplicitContent ? params.get("entrada") ?? "" : defaultHashTextState.input,
  };
}

export function buildHashTextSearchParams(state: HashTextState): HashTextSearchParamsResult {
  const params = new URLSearchParams();

  params.set("alg", normalizeHashTextAlgorithm(state.algorithm));
  params.set("fmt", normalizeHashTextOutputFormat(state.format));
  params.set("upper", state.uppercaseHex ? "1" : "0");

  return {
    params,
    queryLength: params.toString().length,
  };
}

export function buildHashTextContentFragmentParams(
  state: HashTextState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): HashTextContentFragmentResult {
  const params = new URLSearchParams();
  const maxFragmentLength = options.maxFragmentLength ?? HASH_TEXT_SHARE_FRAGMENT_LIMIT;

  if (!options.includeContent) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: 0,
    };
  }

  params.set("conteudo", "1");

  if (state.input.length === 0) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: params.toString().length,
    };
  }

  params.set("entrada", state.input);

  if (params.toString().length <= maxFragmentLength) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: params.toString().length,
    };
  }

  params.delete("entrada");

  return {
    params,
    contentOmitted: true,
    fragmentLength: params.toString().length,
  };
}

export function buildHashTextShareUrl(
  baseUrl: string,
  state: HashTextState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): HashTextShareUrlResult {
  const searchResult = buildHashTextSearchParams(state);
  const fragmentResult = buildHashTextContentFragmentParams(state, options);
  const query = searchResult.params.toString();
  const fragment = fragmentResult.params.toString();

  return {
    url: `${baseUrl}${query ? `?${query}` : ""}${fragment ? `#${fragment}` : ""}`,
    searchParams: searchResult.params,
    fragmentParams: fragmentResult.params,
    contentOmitted: fragmentResult.contentOmitted,
  };
}

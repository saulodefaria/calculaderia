export type Base64ConverterMode = "codificar" | "decodificar";
export type Base64Alphabet = "base64" | "base64url";
export type Base64ConverterStatus = "empty" | "valid" | "invalidBase64" | "invalidUtf8" | "tooLarge";
export type Base64ConverterWarning = "whitespaceIgnored" | "paddingInferred" | "paddingOmitted";
export type Base64ConverterErrorCode =
  | "invalidCharacter"
  | "mixedAlphabet"
  | "invalidPadding"
  | "invalidLength"
  | "decodeFailed"
  | "invalidUtf8"
  | "inputTooLarge";

export interface Base64ConverterState {
  input: string;
  mode: Base64ConverterMode;
  alphabet: Base64Alphabet;
  padding: boolean;
  ignoreWhitespace: boolean;
}

export interface Base64TextMetrics {
  characters: number;
  bytes: number;
}

export interface Base64ConverterError {
  code: Base64ConverterErrorCode;
}

export interface Base64ConverterResult {
  status: Base64ConverterStatus;
  mode: Base64ConverterMode;
  alphabet: Base64Alphabet;
  alphabetUsed: Base64Alphabet;
  padding: boolean;
  ignoreWhitespace: boolean;
  inputMetrics: Base64TextMetrics;
  outputMetrics: Base64TextMetrics | null;
  output: string;
  normalizedInput: string;
  warnings: Base64ConverterWarning[];
  error: Base64ConverterError | null;
}

export interface Base64SearchParamsResult {
  params: URLSearchParams;
  queryLength: number;
}

export interface Base64ContentFragmentResult {
  params: URLSearchParams;
  contentOmitted: boolean;
  fragmentLength: number;
}

export interface Base64ContentFragmentState {
  hasExplicitContent: boolean;
  input: string;
}

export interface Base64ShareUrlResult {
  url: string;
  searchParams: URLSearchParams;
  fragmentParams: URLSearchParams;
  contentOmitted: boolean;
}

export const BASE64_CONVERTER_MAX_INPUT_LENGTH = 1_000_000;
export const BASE64_CONVERTER_SHARE_FRAGMENT_LIMIT = 1_800;

export const defaultBase64ConverterState: Base64ConverterState = {
  input: "",
  mode: "codificar",
  alphabet: "base64",
  padding: true,
  ignoreWhitespace: true,
};

const STANDARD_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const URL_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const base64Modes = new Set<Base64ConverterMode>(["codificar", "decodificar"]);
const base64Alphabets = new Set<Base64Alphabet>(["base64", "base64url"]);
const standardDecodeMap = new Map<string, number>(
  Array.from(STANDARD_ALPHABET).map((character, index) => [character, index])
);
const asciiWhitespacePattern = /[\t\n\f\r ]/g;

function getTextEncoder() {
  return new TextEncoder();
}

function getTextDecoder() {
  return new TextDecoder("utf-8", { fatal: true });
}

export function getBase64Utf8ByteLength(value: string): number {
  return getTextEncoder().encode(value).length;
}

export function getBase64TextMetrics(value: string): Base64TextMetrics {
  return {
    characters: Array.from(value).length,
    bytes: getBase64Utf8ByteLength(value),
  };
}

export function normalizeBase64Mode(value: string | null | undefined): Base64ConverterMode {
  return value && base64Modes.has(value as Base64ConverterMode)
    ? (value as Base64ConverterMode)
    : defaultBase64ConverterState.mode;
}

export function normalizeBase64Alphabet(value: string | null | undefined): Base64Alphabet {
  return value && base64Alphabets.has(value as Base64Alphabet)
    ? (value as Base64Alphabet)
    : defaultBase64ConverterState.alphabet;
}

export function normalizeBase64Boolean(value: string | null | undefined, fallback: boolean): boolean {
  if (value === "1") return true;
  if (value === "0") return false;

  return fallback;
}

function createResult(
  state: Base64ConverterState,
  status: Base64ConverterStatus,
  inputMetrics: Base64TextMetrics,
  options: {
    output?: string;
    normalizedInput?: string;
    warnings?: Base64ConverterWarning[];
    error?: Base64ConverterError | null;
  } = {}
): Base64ConverterResult {
  const output = options.output ?? "";

  return {
    status,
    mode: state.mode,
    alphabet: state.alphabet,
    alphabetUsed: state.alphabet,
    padding: state.padding,
    ignoreWhitespace: state.ignoreWhitespace,
    inputMetrics,
    outputMetrics: output.length > 0 ? getBase64TextMetrics(output) : null,
    output,
    normalizedInput: options.normalizedInput ?? "",
    warnings: options.warnings ?? [],
    error: options.error ?? null,
  };
}

function encodeBytesToBase64(bytes: Uint8Array, alphabet: Base64Alphabet, includePadding: boolean): string {
  const selectedAlphabet = alphabet === "base64url" ? URL_ALPHABET : STANDARD_ALPHABET;
  let output = "";

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const hasSecond = index + 1 < bytes.length;
    const hasThird = index + 2 < bytes.length;
    const second = hasSecond ? bytes[index + 1] : 0;
    const third = hasThird ? bytes[index + 2] : 0;
    const triplet = (first << 16) | (second << 8) | third;

    output += selectedAlphabet[(triplet >> 18) & 63];
    output += selectedAlphabet[(triplet >> 12) & 63];
    output += hasSecond ? selectedAlphabet[(triplet >> 6) & 63] : includePadding ? "=" : "";
    output += hasThird ? selectedAlphabet[triplet & 63] : includePadding ? "=" : "";
  }

  return output;
}

function decodeStandardBase64ToBytes(input: string): Uint8Array | null {
  if (input.length % 4 !== 0) return null;

  const bytes: number[] = [];

  for (let index = 0; index < input.length; index += 4) {
    const first = standardDecodeMap.get(input[index]);
    const second = standardDecodeMap.get(input[index + 1]);
    const thirdCharacter = input[index + 2];
    const fourthCharacter = input[index + 3];
    const third = thirdCharacter === "=" ? 0 : standardDecodeMap.get(thirdCharacter);
    const fourth = fourthCharacter === "=" ? 0 : standardDecodeMap.get(fourthCharacter);

    if (
      first === undefined ||
      second === undefined ||
      third === undefined ||
      fourth === undefined ||
      (thirdCharacter === "=" && fourthCharacter !== "=")
    ) {
      return null;
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

  return new Uint8Array(bytes);
}

function normalizeDecodeInput(
  input: string,
  alphabet: Base64Alphabet,
  ignoreWhitespace: boolean
): { normalizedInput: string; warnings: Base64ConverterWarning[]; error: Base64ConverterError | null } {
  const withoutWhitespace = ignoreWhitespace ? input.replace(asciiWhitespacePattern, "") : input;
  const warnings: Base64ConverterWarning[] =
    ignoreWhitespace && withoutWhitespace !== input ? ["whitespaceIgnored"] : [];

  if (withoutWhitespace.length === 0) {
    return { normalizedInput: "", warnings, error: null };
  }

  const hasStandardOnlySymbols = /[+/]/.test(withoutWhitespace);
  const hasUrlOnlySymbols = /[-_]/.test(withoutWhitespace);

  if (hasStandardOnlySymbols && hasUrlOnlySymbols) {
    return {
      normalizedInput: withoutWhitespace,
      warnings,
      error: { code: "mixedAlphabet" },
    };
  }

  const validCharacters =
    alphabet === "base64" ? /^[A-Za-z0-9+/=]*$/.test(withoutWhitespace) : /^[A-Za-z0-9\-_=]*$/.test(withoutWhitespace);

  if (!validCharacters) {
    return {
      normalizedInput: withoutWhitespace,
      warnings,
      error: { code: "invalidCharacter" },
    };
  }

  const firstPaddingIndex = withoutWhitespace.indexOf("=");
  const paddingCount = firstPaddingIndex === -1 ? 0 : withoutWhitespace.length - firstPaddingIndex;

  if (paddingCount > 2 || (firstPaddingIndex !== -1 && !/^=+$/.test(withoutWhitespace.slice(firstPaddingIndex)))) {
    return {
      normalizedInput: withoutWhitespace,
      warnings,
      error: { code: "invalidPadding" },
    };
  }

  if (paddingCount > 0 && withoutWhitespace.length % 4 !== 0) {
    return {
      normalizedInput: withoutWhitespace,
      warnings,
      error: { code: "invalidPadding" },
    };
  }

  const lengthModulo = withoutWhitespace.length % 4;

  if (lengthModulo === 1) {
    return {
      normalizedInput: withoutWhitespace,
      warnings,
      error: { code: "invalidLength" },
    };
  }

  if (lengthModulo === 2 || lengthModulo === 3) {
    const normalizedInput = `${withoutWhitespace}${"=".repeat(4 - lengthModulo)}`;

    return {
      normalizedInput,
      warnings: [...warnings, "paddingInferred"],
      error: null,
    };
  }

  return {
    normalizedInput: withoutWhitespace,
    warnings,
    error: null,
  };
}

function processEncode(state: Base64ConverterState, inputMetrics: Base64TextMetrics): Base64ConverterResult {
  if (state.input.length === 0) {
    return createResult(state, "empty", inputMetrics);
  }

  const output = encodeBytesToBase64(getTextEncoder().encode(state.input), state.alphabet, state.padding);
  const warnings: Base64ConverterWarning[] = !state.padding && output.length > 0 ? ["paddingOmitted"] : [];

  return createResult(state, "valid", inputMetrics, {
    output,
    warnings,
  });
}

function processDecode(state: Base64ConverterState, inputMetrics: Base64TextMetrics): Base64ConverterResult {
  const normalized = normalizeDecodeInput(state.input, state.alphabet, state.ignoreWhitespace);

  if (normalized.normalizedInput.length === 0 && !normalized.error) {
    return createResult(state, "empty", inputMetrics, {
      warnings: normalized.warnings,
    });
  }

  if (normalized.error) {
    return createResult(state, "invalidBase64", inputMetrics, {
      normalizedInput: normalized.normalizedInput,
      warnings: normalized.warnings,
      error: normalized.error,
    });
  }

  const standardInput =
    state.alphabet === "base64url"
      ? normalized.normalizedInput.replace(/-/g, "+").replace(/_/g, "/")
      : normalized.normalizedInput;
  const bytes = decodeStandardBase64ToBytes(standardInput);

  if (!bytes) {
    return createResult(state, "invalidBase64", inputMetrics, {
      normalizedInput: normalized.normalizedInput,
      warnings: normalized.warnings,
      error: { code: "decodeFailed" },
    });
  }

  try {
    const output = getTextDecoder().decode(bytes);

    return createResult(state, "valid", inputMetrics, {
      output,
      normalizedInput: normalized.normalizedInput,
      warnings: normalized.warnings,
    });
  } catch {
    return createResult(state, "invalidUtf8", inputMetrics, {
      normalizedInput: normalized.normalizedInput,
      warnings: normalized.warnings,
      error: { code: "invalidUtf8" },
    });
  }
}

export function processBase64Converter(state: Base64ConverterState): Base64ConverterResult {
  const normalizedState: Base64ConverterState = {
    input: state.input,
    mode: normalizeBase64Mode(state.mode),
    alphabet: normalizeBase64Alphabet(state.alphabet),
    padding: Boolean(state.padding),
    ignoreWhitespace: Boolean(state.ignoreWhitespace),
  };
  const inputMetrics = getBase64TextMetrics(normalizedState.input);

  if (normalizedState.input.length > BASE64_CONVERTER_MAX_INPUT_LENGTH) {
    return createResult(normalizedState, "tooLarge", inputMetrics, {
      error: { code: "inputTooLarge" },
    });
  }

  return normalizedState.mode === "codificar"
    ? processEncode(normalizedState, inputMetrics)
    : processDecode(normalizedState, inputMetrics);
}

export function encodeBase64(input: string, alphabet: Base64Alphabet = "base64", padding = true): Base64ConverterResult {
  return processBase64Converter({
    input,
    mode: "codificar",
    alphabet,
    padding,
    ignoreWhitespace: defaultBase64ConverterState.ignoreWhitespace,
  });
}

export function decodeBase64(
  input: string,
  alphabet: Base64Alphabet = "base64",
  ignoreWhitespace = true
): Base64ConverterResult {
  return processBase64Converter({
    input,
    mode: "decodificar",
    alphabet,
    padding: defaultBase64ConverterState.padding,
    ignoreWhitespace,
  });
}

export function readBase64StateFromParams(params: URLSearchParams): Base64ConverterState {
  return {
    input: defaultBase64ConverterState.input,
    mode: normalizeBase64Mode(params.get("modo")),
    alphabet: normalizeBase64Alphabet(params.get("alfabeto")),
    padding: normalizeBase64Boolean(params.get("padding"), defaultBase64ConverterState.padding),
    ignoreWhitespace: normalizeBase64Boolean(
      params.get("ignorarEspacos"),
      defaultBase64ConverterState.ignoreWhitespace
    ),
  };
}

export function readBase64ContentFromFragment(fragment: string): Base64ContentFragmentState {
  const normalizedFragment = fragment.startsWith("#") ? fragment.slice(1) : fragment;
  const params = new URLSearchParams(normalizedFragment);
  const hasExplicitContent = params.get("conteudo") === "1";

  return {
    hasExplicitContent,
    input: hasExplicitContent ? params.get("entrada") ?? "" : defaultBase64ConverterState.input,
  };
}

export function buildBase64SearchParams(state: Base64ConverterState): Base64SearchParamsResult {
  const params = new URLSearchParams();
  const mode = normalizeBase64Mode(state.mode);
  const alphabet = normalizeBase64Alphabet(state.alphabet);

  params.set("modo", mode);
  params.set("alfabeto", alphabet);
  params.set("padding", state.padding ? "1" : "0");
  params.set("ignorarEspacos", state.ignoreWhitespace ? "1" : "0");

  return {
    params,
    queryLength: params.toString().length,
  };
}

export function buildBase64ContentFragmentParams(
  state: Base64ConverterState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): Base64ContentFragmentResult {
  const params = new URLSearchParams();
  const maxFragmentLength = options.maxFragmentLength ?? BASE64_CONVERTER_SHARE_FRAGMENT_LIMIT;

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

export function buildBase64ShareUrl(
  baseUrl: string,
  state: Base64ConverterState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): Base64ShareUrlResult {
  const searchResult = buildBase64SearchParams(state);
  const fragmentResult = buildBase64ContentFragmentParams(state, options);
  const query = searchResult.params.toString();
  const fragment = fragmentResult.params.toString();

  return {
    url: `${baseUrl}${query ? `?${query}` : ""}${fragment ? `#${fragment}` : ""}`,
    searchParams: searchResult.params,
    fragmentParams: fragmentResult.params,
    contentOmitted: fragmentResult.contentOmitted,
  };
}

export type UrlEncodingMode = "codificar" | "decodificar";
export type UrlEncodingContext = "componente" | "uri" | "form";
export type UrlEncodingStatus = "empty" | "valid" | "malformedPercent" | "invalidUtf8" | "invalidUnicode" | "tooLarge";
export type UrlEncodingWarning =
  | "possibleAlreadyEncoded"
  | "possibleDoubleEncoding"
  | "plusAsSpace"
  | "strictRfc3986Applied"
  | "reservedDelimitersPreserved";
export type UrlEncodingErrorCode = "malformedPercent" | "invalidUtf8" | "invalidUnicode" | "inputTooLarge";

export interface UrlEncodingState {
  input: string;
  mode: UrlEncodingMode;
  context: UrlEncodingContext;
  strict: boolean;
}

export interface UrlEncodingTextMetrics {
  characters: number;
  bytes: number;
  lines: number;
  percentTriplets: number;
}

export interface UrlEncodingError {
  code: UrlEncodingErrorCode;
  percentIndex?: number;
  engineMessage?: string;
}

export interface UrlEncodingResult {
  status: UrlEncodingStatus;
  mode: UrlEncodingMode;
  context: UrlEncodingContext;
  strict: boolean;
  inputMetrics: UrlEncodingTextMetrics;
  outputMetrics: UrlEncodingTextMetrics | null;
  output: string;
  normalizedInput: string;
  warnings: UrlEncodingWarning[];
  error: UrlEncodingError | null;
}

export interface UrlEncodingSearchParamsResult {
  params: URLSearchParams;
  queryLength: number;
}

export interface UrlEncodingContentFragmentResult {
  params: URLSearchParams;
  contentOmitted: boolean;
  fragmentLength: number;
}

export interface UrlEncodingContentFragmentState {
  hasExplicitContent: boolean;
  input: string;
}

export interface UrlEncodingShareUrlResult {
  url: string;
  searchParams: URLSearchParams;
  fragmentParams: URLSearchParams;
  contentOmitted: boolean;
}

export const URL_ENCODING_MAX_INPUT_LENGTH = 1_000_000;
export const URL_ENCODING_SHARE_FRAGMENT_LIMIT = 1_800;

export const defaultUrlEncodingState: UrlEncodingState = {
  input: "",
  mode: "codificar",
  context: "componente",
  strict: false,
};

const urlEncodingModes = new Set<UrlEncodingMode>(["codificar", "decodificar"]);
const urlEncodingContexts = new Set<UrlEncodingContext>(["componente", "uri", "form"]);
const percentTripletPattern = /%[0-9A-Fa-f]{2}/g;
const reservedDelimiterPattern = /[:/?#[\]@!$&'()*+,;=]/;
const strictRfc3986ExtraPattern = /[!'()*]/g;

function getTextEncoder() {
  return new TextEncoder();
}

export function getUrlEncodingUtf8ByteLength(value: string): number {
  return getTextEncoder().encode(value).length;
}

export function countUrlEncodingPercentTriplets(value: string): number {
  return value.match(percentTripletPattern)?.length ?? 0;
}

export function getUrlEncodingTextMetrics(value: string): UrlEncodingTextMetrics {
  return {
    characters: Array.from(value).length,
    bytes: getUrlEncodingUtf8ByteLength(value),
    lines: value.length === 0 ? 0 : value.replace(/\r\n?/g, "\n").split("\n").length,
    percentTriplets: countUrlEncodingPercentTriplets(value),
  };
}

function getUrlEncodingCheapTextMetrics(value: string): UrlEncodingTextMetrics {
  return {
    characters: value.length,
    bytes: value.length,
    lines: value.length === 0 ? 0 : 1,
    percentTriplets: 0,
  };
}

export function normalizeUrlEncodingMode(value: string | null | undefined): UrlEncodingMode {
  return value && urlEncodingModes.has(value as UrlEncodingMode)
    ? (value as UrlEncodingMode)
    : defaultUrlEncodingState.mode;
}

export function normalizeUrlEncodingContext(value: string | null | undefined): UrlEncodingContext {
  return value && urlEncodingContexts.has(value as UrlEncodingContext)
    ? (value as UrlEncodingContext)
    : defaultUrlEncodingState.context;
}

export function normalizeUrlEncodingBoolean(value: string | null | undefined, fallback: boolean): boolean {
  if (value === "1") return true;
  if (value === "0") return false;

  return fallback;
}

function uppercaseHexByte(character: string): string {
  return `%${character.charCodeAt(0).toString(16).toUpperCase()}`;
}

function uppercasePercentEscapes(value: string): string {
  return value.replace(percentTripletPattern, (match) => match.toUpperCase());
}

function hasUnpairedSurrogate(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);

    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);

      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        return true;
      }

      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return true;
    }
  }

  return false;
}

function findMalformedPercentIndex(value: string): number | null {
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] !== "%") continue;

    if (!/^[0-9A-Fa-f]{2}$/.test(value.slice(index + 1, index + 3))) {
      return index;
    }
  }

  return null;
}

function encodeFormValue(input: string): string {
  const params = new URLSearchParams();

  params.set("v", input);

  return uppercasePercentEscapes(params.toString().slice(2));
}

function encodeComponentValue(input: string, strict: boolean): string {
  const encoded = encodeURIComponent(input);

  return uppercasePercentEscapes(strict ? encoded.replace(strictRfc3986ExtraPattern, uppercaseHexByte) : encoded);
}

function createResult(
  state: UrlEncodingState,
  status: UrlEncodingStatus,
  inputMetrics: UrlEncodingTextMetrics,
  options: {
    output?: string;
    normalizedInput?: string;
    warnings?: UrlEncodingWarning[];
    error?: UrlEncodingError | null;
  } = {}
): UrlEncodingResult {
  const output = options.output ?? "";

  return {
    status,
    mode: state.mode,
    context: state.context,
    strict: state.strict,
    inputMetrics,
    outputMetrics: output.length > 0 ? getUrlEncodingTextMetrics(output) : null,
    output,
    normalizedInput: options.normalizedInput ?? state.input,
    warnings: options.warnings ?? [],
    error: options.error ?? null,
  };
}

function getEncodeWarnings(state: UrlEncodingState, output: string): UrlEncodingWarning[] {
  const warnings: UrlEncodingWarning[] = [];

  if (percentTripletPattern.test(state.input)) {
    warnings.push("possibleAlreadyEncoded");
  }

  percentTripletPattern.lastIndex = 0;

  if (state.mode === "codificar" && state.context === "componente" && state.strict) {
    warnings.push("strictRfc3986Applied");
  }

  if (state.context === "uri" && reservedDelimiterPattern.test(state.input) && reservedDelimiterPattern.test(output)) {
    warnings.push("reservedDelimitersPreserved");
  }

  return warnings;
}

function processEncode(state: UrlEncodingState, inputMetrics: UrlEncodingTextMetrics): UrlEncodingResult {
  if (state.input.length === 0) {
    return createResult(state, "empty", inputMetrics);
  }

  if (hasUnpairedSurrogate(state.input)) {
    return createResult(state, "invalidUnicode", inputMetrics, {
      error: { code: "invalidUnicode" },
    });
  }

  try {
    const output =
      state.context === "form"
        ? encodeFormValue(state.input)
        : state.context === "uri"
          ? uppercasePercentEscapes(encodeURI(state.input))
          : encodeComponentValue(state.input, state.strict);

    return createResult(state, "valid", inputMetrics, {
      output,
      warnings: getEncodeWarnings(state, output),
    });
  } catch (error) {
    return createResult(state, "invalidUnicode", inputMetrics, {
      error: {
        code: "invalidUnicode",
        engineMessage: error instanceof Error ? error.message : String(error),
      },
    });
  }
}

function getDecodeWarnings(state: UrlEncodingState, normalizedInput: string, output: string): UrlEncodingWarning[] {
  const warnings: UrlEncodingWarning[] = [];

  if (state.context === "form" && state.input.includes("+")) {
    warnings.push("plusAsSpace");
  }

  if (countUrlEncodingPercentTriplets(output) > 0) {
    warnings.push("possibleDoubleEncoding");
  }

  if (state.context === "uri" && normalizedInput !== output) {
    warnings.push("reservedDelimitersPreserved");
  }

  return warnings;
}

function processDecode(state: UrlEncodingState, inputMetrics: UrlEncodingTextMetrics): UrlEncodingResult {
  const normalizedInput = state.context === "form" ? state.input.replace(/\+/g, " ") : state.input;

  if (state.input.length === 0) {
    return createResult(state, "empty", inputMetrics, { normalizedInput });
  }

  const malformedPercentIndex = findMalformedPercentIndex(normalizedInput);

  if (malformedPercentIndex !== null) {
    return createResult(state, "malformedPercent", inputMetrics, {
      normalizedInput,
      error: {
        code: "malformedPercent",
        percentIndex: malformedPercentIndex,
      },
    });
  }

  try {
    const output = state.context === "uri" ? decodeURI(normalizedInput) : decodeURIComponent(normalizedInput);

    return createResult(state, "valid", inputMetrics, {
      output,
      normalizedInput,
      warnings: getDecodeWarnings(state, normalizedInput, output),
    });
  } catch (error) {
    return createResult(state, "invalidUtf8", inputMetrics, {
      normalizedInput,
      error: {
        code: "invalidUtf8",
        engineMessage: error instanceof Error ? error.message : String(error),
      },
    });
  }
}

export function processUrlEncoding(state: UrlEncodingState): UrlEncodingResult {
  const normalizedState: UrlEncodingState = {
    input: state.input,
    mode: normalizeUrlEncodingMode(state.mode),
    context: normalizeUrlEncodingContext(state.context),
    strict: Boolean(state.strict),
  };

  if (normalizedState.input.length > URL_ENCODING_MAX_INPUT_LENGTH) {
    const inputMetrics = getUrlEncodingCheapTextMetrics(normalizedState.input);

    return createResult(normalizedState, "tooLarge", inputMetrics, {
      error: { code: "inputTooLarge" },
    });
  }

  const inputMetrics = getUrlEncodingTextMetrics(normalizedState.input);

  return normalizedState.mode === "codificar"
    ? processEncode(normalizedState, inputMetrics)
    : processDecode(normalizedState, inputMetrics);
}

export function encodeUrlValue(
  input: string,
  context: UrlEncodingContext = "componente",
  strict = false
): UrlEncodingResult {
  return processUrlEncoding({
    input,
    mode: "codificar",
    context,
    strict,
  });
}

export function decodeUrlValue(input: string, context: UrlEncodingContext = "componente"): UrlEncodingResult {
  return processUrlEncoding({
    input,
    mode: "decodificar",
    context,
    strict: defaultUrlEncodingState.strict,
  });
}

export function readUrlEncodingStateFromParams(params: URLSearchParams): UrlEncodingState {
  return {
    input: defaultUrlEncodingState.input,
    mode: normalizeUrlEncodingMode(params.get("modo")),
    context: normalizeUrlEncodingContext(params.get("contexto")),
    strict: normalizeUrlEncodingBoolean(params.get("estrito"), defaultUrlEncodingState.strict),
  };
}

export function readUrlEncodingContentFromFragment(fragment: string): UrlEncodingContentFragmentState {
  const normalizedFragment = fragment.startsWith("#") ? fragment.slice(1) : fragment;
  const params = new URLSearchParams(normalizedFragment);
  const hasExplicitContent = params.get("conteudo") === "1";

  return {
    hasExplicitContent,
    input: hasExplicitContent ? params.get("entrada") ?? "" : defaultUrlEncodingState.input,
  };
}

export function buildUrlEncodingSearchParams(state: UrlEncodingState): UrlEncodingSearchParamsResult {
  const params = new URLSearchParams();
  const mode = normalizeUrlEncodingMode(state.mode);
  const context = normalizeUrlEncodingContext(state.context);

  params.set("modo", mode);
  params.set("contexto", context);
  params.set("estrito", state.strict ? "1" : "0");

  return {
    params,
    queryLength: params.toString().length,
  };
}

export function buildUrlEncodingContentFragmentParams(
  state: UrlEncodingState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): UrlEncodingContentFragmentResult {
  const params = new URLSearchParams();
  const maxFragmentLength = options.maxFragmentLength ?? URL_ENCODING_SHARE_FRAGMENT_LIMIT;

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

export function buildUrlEncodingShareUrl(
  baseUrl: string,
  state: UrlEncodingState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): UrlEncodingShareUrlResult {
  const searchResult = buildUrlEncodingSearchParams(state);
  const fragmentResult = buildUrlEncodingContentFragmentParams(state, options);
  const query = searchResult.params.toString();
  const fragment = fragmentResult.params.toString();

  return {
    url: `${baseUrl}${query ? `?${query}` : ""}${fragment ? `#${fragment}` : ""}`,
    searchParams: searchResult.params,
    fragmentParams: fragmentResult.params,
    contentOmitted: fragmentResult.contentOmitted,
  };
}

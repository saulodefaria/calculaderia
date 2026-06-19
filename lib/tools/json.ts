export type JsonFormatterMode = "formatar" | "minificar" | "validar";
export type JsonIndent = "2" | "4" | "tab";
export type JsonFormatterStatus = "empty" | "valid" | "invalid" | "tooLarge";
export type JsonValueKind = "object" | "array" | "string" | "number" | "boolean" | "null";
export type JsonFormatterErrorCode = "invalidJson" | "inputTooLarge";

export interface JsonFormatterState {
  input: string;
  mode: JsonFormatterMode;
  indent: JsonIndent;
}

export interface JsonTextMetrics {
  characters: number;
  bytes: number;
  lines: number;
}

export interface JsonParseLocation {
  offset: number | null;
  line: number;
  column: number;
  snippet: string;
}

export interface JsonFormatterError {
  code: JsonFormatterErrorCode;
  engineMessage?: string;
  location?: JsonParseLocation;
}

export interface JsonFormatterResult {
  status: JsonFormatterStatus;
  mode: JsonFormatterMode;
  indent: JsonIndent;
  inputMetrics: JsonTextMetrics;
  outputMetrics: JsonTextMetrics | null;
  output: string;
  valueKind: JsonValueKind | null;
  minificationSavings: {
    bytes: number;
    percent: number;
  } | null;
  error: JsonFormatterError | null;
}

export interface JsonFormatterSearchParamsResult {
  params: URLSearchParams;
  queryLength: number;
}

export interface JsonFormatterContentFragmentResult {
  params: URLSearchParams;
  contentOmitted: boolean;
  fragmentLength: number;
}

export interface JsonFormatterContentFragmentState {
  hasExplicitContent: boolean;
  input: string;
}

export interface JsonFormatterShareUrlResult {
  url: string;
  searchParams: URLSearchParams;
  fragmentParams: URLSearchParams;
  contentOmitted: boolean;
}

export const JSON_FORMATTER_MAX_INPUT_LENGTH = 1_000_000;
export const JSON_FORMATTER_SHARE_FRAGMENT_LIMIT = 1_800;

export const defaultJsonFormatterState: JsonFormatterState = {
  input: "",
  mode: "formatar",
  indent: "2",
};

const jsonFormatterModes = new Set<JsonFormatterMode>(["formatar", "minificar", "validar"]);
const jsonIndentValues = new Set<JsonIndent>(["2", "4", "tab"]);

function getTextEncoder() {
  return new TextEncoder();
}

export function getJsonUtf8ByteLength(value: string): number {
  return getTextEncoder().encode(value).length;
}

export function getJsonTextMetrics(value: string): JsonTextMetrics {
  return {
    characters: Array.from(value).length,
    bytes: getJsonUtf8ByteLength(value),
    lines: value.length === 0 ? 0 : value.replace(/\r\n?/g, "\n").split("\n").length,
  };
}

export function normalizeJsonFormatterMode(value: string | null | undefined): JsonFormatterMode {
  return value && jsonFormatterModes.has(value as JsonFormatterMode) ? (value as JsonFormatterMode) : "formatar";
}

export function normalizeJsonIndent(value: string | null | undefined): JsonIndent {
  return value && jsonIndentValues.has(value as JsonIndent) ? (value as JsonIndent) : "2";
}

function getJsonStringifyIndent(indent: JsonIndent): number | string {
  return indent === "tab" ? "\t" : Number(indent);
}

function getJsonValueKind(value: unknown): JsonValueKind {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";

  const type = typeof value;
  if (type === "string" || type === "number" || type === "boolean") return type;

  return "object";
}

function getLineColumnFromOffset(input: string, offset: number): Pick<JsonParseLocation, "line" | "column"> {
  const boundedOffset = Math.max(0, Math.min(offset, input.length));
  let line = 1;
  let column = 1;

  for (let index = 0; index < boundedOffset; index += 1) {
    const character = input[index];
    if (character === "\n") {
      line += 1;
      column = 1;
    } else if (character === "\r") {
      if (input[index + 1] === "\n" && index + 1 < boundedOffset) {
        index += 1;
      }
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }

  return { line, column };
}

function getOffsetFromLineColumn(input: string, line: number, column: number): number {
  const normalizedLines = input.replace(/\r\n?/g, "\n").split("\n");
  const targetLine = Math.max(1, Math.min(line, normalizedLines.length));
  let offset = 0;

  for (let index = 0; index < targetLine - 1; index += 1) {
    offset += normalizedLines[index].length + 1;
  }

  return offset + Math.max(0, column - 1);
}

function getSnippet(input: string, line: number, column: number): string {
  const lineText = input.replace(/\r\n?/g, "\n").split("\n")[line - 1] ?? "";
  if (lineText.length <= 140) return lineText;

  const zeroBasedColumn = Math.max(0, column - 1);
  const start = Math.max(0, zeroBasedColumn - 55);
  const end = Math.min(lineText.length, zeroBasedColumn + 85);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < lineText.length ? "..." : "";

  return `${prefix}${lineText.slice(start, end)}${suffix}`;
}

export function normalizeJsonParseError(input: string, error: unknown): JsonFormatterError {
  const engineMessage = error instanceof Error ? error.message : String(error);
  const positionMatch = engineMessage.match(/position\s+(\d+)/i);
  const lineColumnMatch = engineMessage.match(/line\s+(\d+)\s+column\s+(\d+)/i);
  const unexpectedTokenMatch = engineMessage.match(/Unexpected token '([^']+)'/i);
  let offset: number | null = positionMatch ? Number(positionMatch[1]) : null;
  let line: number | null = null;
  let column: number | null = null;

  if (lineColumnMatch) {
    line = Number(lineColumnMatch[1]);
    column = Number(lineColumnMatch[2]);
    if (offset === null) {
      offset = getOffsetFromLineColumn(input, line, column);
    }
  } else if (offset !== null && Number.isFinite(offset)) {
    const computed = getLineColumnFromOffset(input, offset);
    line = computed.line;
    column = computed.column;
  } else if (unexpectedTokenMatch) {
    const token = unexpectedTokenMatch[1];
    const tokenOffset = token === "}" || token === "]" ? input.lastIndexOf(token) : input.indexOf(token);

    if (tokenOffset >= 0) {
      offset = tokenOffset;
      const computed = getLineColumnFromOffset(input, offset);
      line = computed.line;
      column = computed.column;
    }
  }

  if (offset !== null && (!Number.isFinite(offset) || offset < 0)) {
    offset = null;
  }

  return {
    code: "invalidJson",
    engineMessage,
    location:
      line !== null && column !== null
        ? {
            offset,
            line,
            column,
            snippet: getSnippet(input, line, column),
          }
        : undefined,
  };
}

function buildValidResult(
  state: JsonFormatterState,
  parsedValue: unknown,
  inputMetrics: JsonTextMetrics
): JsonFormatterResult {
  const output =
    state.mode === "validar"
      ? ""
      : (state.mode === "minificar"
          ? JSON.stringify(parsedValue)
          : JSON.stringify(parsedValue, null, getJsonStringifyIndent(state.indent))) ?? "";
  const outputMetrics = output.length > 0 ? getJsonTextMetrics(output) : null;
  const minificationSavings =
    state.mode === "minificar" && outputMetrics
      ? {
          bytes: inputMetrics.bytes - outputMetrics.bytes,
          percent: inputMetrics.bytes === 0 ? 0 : ((inputMetrics.bytes - outputMetrics.bytes) / inputMetrics.bytes) * 100,
        }
      : null;

  return {
    status: "valid",
    mode: state.mode,
    indent: state.indent,
    inputMetrics,
    outputMetrics,
    output,
    valueKind: getJsonValueKind(parsedValue),
    minificationSavings,
    error: null,
  };
}

export function processJsonFormatter(state: JsonFormatterState): JsonFormatterResult {
  const normalizedState = {
    input: state.input,
    mode: normalizeJsonFormatterMode(state.mode),
    indent: normalizeJsonIndent(state.indent),
  };
  const inputMetrics = getJsonTextMetrics(normalizedState.input);

  if (normalizedState.input.trim().length === 0) {
    return {
      status: "empty",
      mode: normalizedState.mode,
      indent: normalizedState.indent,
      inputMetrics,
      outputMetrics: null,
      output: "",
      valueKind: null,
      minificationSavings: null,
      error: null,
    };
  }

  if (normalizedState.input.length > JSON_FORMATTER_MAX_INPUT_LENGTH) {
    return {
      status: "tooLarge",
      mode: normalizedState.mode,
      indent: normalizedState.indent,
      inputMetrics,
      outputMetrics: null,
      output: "",
      valueKind: null,
      minificationSavings: null,
      error: { code: "inputTooLarge" },
    };
  }

  try {
    return buildValidResult(normalizedState, JSON.parse(normalizedState.input), inputMetrics);
  } catch (error) {
    return {
      status: "invalid",
      mode: normalizedState.mode,
      indent: normalizedState.indent,
      inputMetrics,
      outputMetrics: null,
      output: "",
      valueKind: null,
      minificationSavings: null,
      error: normalizeJsonParseError(normalizedState.input, error),
    };
  }
}

export function formatJson(input: string, indent: JsonIndent = "2"): JsonFormatterResult {
  return processJsonFormatter({ input, mode: "formatar", indent });
}

export function minifyJson(input: string): JsonFormatterResult {
  return processJsonFormatter({ input, mode: "minificar", indent: defaultJsonFormatterState.indent });
}

export function validateJson(input: string): JsonFormatterResult {
  return processJsonFormatter({ input, mode: "validar", indent: defaultJsonFormatterState.indent });
}

export function readJsonFormatterStateFromParams(params: URLSearchParams): JsonFormatterState {
  return {
    input: defaultJsonFormatterState.input,
    mode: normalizeJsonFormatterMode(params.get("modo")),
    indent: normalizeJsonIndent(params.get("recuo")),
  };
}

export function readJsonFormatterContentFromFragment(fragment: string): JsonFormatterContentFragmentState {
  const normalizedFragment = fragment.startsWith("#") ? fragment.slice(1) : fragment;
  const params = new URLSearchParams(normalizedFragment);
  const hasExplicitContent = params.get("conteudo") === "1";

  return {
    hasExplicitContent,
    input: hasExplicitContent ? params.get("entrada") ?? "" : defaultJsonFormatterState.input,
  };
}

export function buildJsonFormatterSearchParams(state: JsonFormatterState): JsonFormatterSearchParamsResult {
  const params = new URLSearchParams();
  const mode = normalizeJsonFormatterMode(state.mode);
  const indent = normalizeJsonIndent(state.indent);

  params.set("modo", mode);
  params.set("recuo", indent);

  return {
    params,
    queryLength: params.toString().length,
  };
}

export function buildJsonFormatterContentFragmentParams(
  state: JsonFormatterState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): JsonFormatterContentFragmentResult {
  const params = new URLSearchParams();
  const maxFragmentLength = options.maxFragmentLength ?? JSON_FORMATTER_SHARE_FRAGMENT_LIMIT;

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

export function buildJsonFormatterShareUrl(
  baseUrl: string,
  state: JsonFormatterState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): JsonFormatterShareUrlResult {
  const searchResult = buildJsonFormatterSearchParams(state);
  const fragmentResult = buildJsonFormatterContentFragmentParams(state, options);
  const query = searchResult.params.toString();
  const fragment = fragmentResult.params.toString();

  return {
    url: `${baseUrl}${query ? `?${query}` : ""}${fragment ? `#${fragment}` : ""}`,
    searchParams: searchResult.params,
    fragmentParams: fragmentResult.params,
    contentOmitted: fragmentResult.contentOmitted,
  };
}

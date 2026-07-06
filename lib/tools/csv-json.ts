import Papa from "papaparse";

export type CsvJsonMode = "csvParaJson" | "jsonParaCsv";
export type CsvJsonDelimiterOption = "auto" | "virgula" | "pontoEVirgula" | "tab" | "pipe";
export type CsvJsonResolvedDelimiter = Exclude<CsvJsonDelimiterOption, "auto">;
export type CsvJsonHeaderMode = "primeiraLinha" | "semCabecalho";
export type CsvJsonOutputShape = "objetos" | "arrays";
export type CsvJsonTypeMode = "strings" | "inferir";
export type CsvJsonEmptyLineMode = "ignorar" | "preservar";
export type CsvJsonIndent = "2" | "4" | "compacto";
export type CsvJsonStatus = "empty" | "valid" | "invalidCsv" | "invalidJson" | "tooLarge";
export type CsvJsonWarningCode =
  | "bomRemoved"
  | "delimiterDetected"
  | "ambiguousDelimiter"
  | "duplicateHeadersRenamed"
  | "emptyHeadersGenerated"
  | "raggedRows"
  | "extraFieldsPreserved"
  | "missingFieldsFilled"
  | "typesInferred"
  | "emptyLinesIgnored"
  | "nestedValuesSerialized"
  | "formulaLikeCells"
  | "formulaEscaped";
export type CsvJsonErrorCode =
  | "undetectableDelimiter"
  | "missingClosingQuote"
  | "malformedQuotes"
  | "parserError"
  | "invalidJson"
  | "unsupportedJsonRoot"
  | "mixedJsonRows"
  | "unsupportedJsonRow"
  | "invalidFieldsData"
  | "inputTooLarge";

export interface CsvJsonState {
  input: string;
  mode: CsvJsonMode;
  delimiter: CsvJsonDelimiterOption;
  headerMode: CsvJsonHeaderMode;
  outputShape: CsvJsonOutputShape;
  typeMode: CsvJsonTypeMode;
  emptyLineMode: CsvJsonEmptyLineMode;
  jsonIndent: CsvJsonIndent;
  escapeFormulas: boolean;
}

export interface CsvJsonTextMetrics {
  characters: number;
  bytes: number;
  lines: number;
}

export interface CsvJsonWarning {
  code: CsvJsonWarningCode;
  count?: number;
  delimiter?: CsvJsonResolvedDelimiter;
  details?: string[];
}

export interface CsvJsonError {
  code: CsvJsonErrorCode;
  row?: number;
  column?: number;
  index?: number;
  message?: string;
}

export interface CsvJsonPreview {
  headers: string[];
  rows: string[][];
}

export interface CsvJsonMetrics {
  inputCharacters: number;
  inputBytes: number;
  outputCharacters: number;
  outputBytes: number;
  rows: number;
  columns: number;
  warnings: number;
  delimiter: CsvJsonResolvedDelimiter | null;
}

export interface CsvJsonResult {
  status: CsvJsonStatus;
  mode: CsvJsonMode;
  delimiter: CsvJsonDelimiterOption;
  detectedDelimiter: CsvJsonResolvedDelimiter | null;
  rows: number;
  columns: number;
  inputMetrics: CsvJsonTextMetrics;
  outputMetrics: CsvJsonTextMetrics | null;
  metrics: CsvJsonMetrics;
  output: string;
  preview: CsvJsonPreview;
  warnings: CsvJsonWarning[];
  errors: CsvJsonError[];
}

export interface CsvJsonSearchParamsResult {
  params: URLSearchParams;
  queryLength: number;
}

export interface CsvJsonContentFragmentResult {
  params: URLSearchParams;
  contentOmitted: boolean;
  fragmentLength: number;
}

export interface CsvJsonContentFragmentState {
  hasExplicitContent: boolean;
  input: string;
}

export interface CsvJsonShareUrlResult {
  url: string;
  searchParams: URLSearchParams;
  fragmentParams: URLSearchParams;
  contentOmitted: boolean;
}

type CsvJsonCell = string | number | boolean | null;
type CsvJsonObject = Record<string, CsvJsonCell | CsvJsonCell[]>;
type JsonObject = Record<string, unknown>;

interface CsvRowsResult {
  rows: string[][];
  ignoredEmptyLines: number;
}

interface DelimiterDetectionResult {
  delimiter: CsvJsonResolvedDelimiter | null;
  ambiguous: boolean;
}

export const CSV_JSON_MAX_INPUT_LENGTH = 1_000_000;
export const CSV_JSON_SHARE_FRAGMENT_LIMIT = 1_800;
export const CSV_JSON_PREVIEW_ROW_LIMIT = 8;

export const defaultCsvJsonState: CsvJsonState = {
  input: "",
  mode: "csvParaJson",
  delimiter: "auto",
  headerMode: "primeiraLinha",
  outputShape: "objetos",
  typeMode: "strings",
  emptyLineMode: "ignorar",
  jsonIndent: "2",
  escapeFormulas: false,
};

const csvJsonModes = new Set<CsvJsonMode>(["csvParaJson", "jsonParaCsv"]);
const delimiterOptions = new Set<CsvJsonDelimiterOption>(["auto", "virgula", "pontoEVirgula", "tab", "pipe"]);
const headerModes = new Set<CsvJsonHeaderMode>(["primeiraLinha", "semCabecalho"]);
const outputShapes = new Set<CsvJsonOutputShape>(["objetos", "arrays"]);
const typeModes = new Set<CsvJsonTypeMode>(["strings", "inferir"]);
const emptyLineModes = new Set<CsvJsonEmptyLineMode>(["ignorar", "preservar"]);
const jsonIndents = new Set<CsvJsonIndent>(["2", "4", "compacto"]);

const delimiterCharacters: Record<CsvJsonResolvedDelimiter, string> = {
  virgula: ",",
  pontoEVirgula: ";",
  tab: "\t",
  pipe: "|",
};

const formulaStartPattern = /^[=+\-@\t\r\n]/;
const inferredNumberPattern = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;

function getTextEncoder() {
  return new TextEncoder();
}

export function getCsvJsonUtf8ByteLength(value: string): number {
  return getTextEncoder().encode(value).length;
}

export function getCsvJsonTextMetrics(value: string): CsvJsonTextMetrics {
  return {
    characters: Array.from(value).length,
    bytes: getCsvJsonUtf8ByteLength(value),
    lines: value.length === 0 ? 0 : value.replace(/\r\n?/g, "\n").split("\n").length,
  };
}

export function getCsvJsonDelimiterCharacter(delimiter: CsvJsonDelimiterOption): string {
  return delimiter === "auto" ? delimiterCharacters.virgula : delimiterCharacters[delimiter];
}

export function normalizeCsvJsonMode(value: string | null | undefined): CsvJsonMode {
  return value && csvJsonModes.has(value as CsvJsonMode) ? (value as CsvJsonMode) : defaultCsvJsonState.mode;
}

export function normalizeCsvJsonDelimiter(value: string | null | undefined): CsvJsonDelimiterOption {
  return value && delimiterOptions.has(value as CsvJsonDelimiterOption)
    ? (value as CsvJsonDelimiterOption)
    : defaultCsvJsonState.delimiter;
}

export function normalizeCsvJsonHeaderMode(value: string | null | undefined): CsvJsonHeaderMode {
  return value && headerModes.has(value as CsvJsonHeaderMode)
    ? (value as CsvJsonHeaderMode)
    : defaultCsvJsonState.headerMode;
}

export function normalizeCsvJsonOutputShape(value: string | null | undefined): CsvJsonOutputShape {
  return value && outputShapes.has(value as CsvJsonOutputShape)
    ? (value as CsvJsonOutputShape)
    : defaultCsvJsonState.outputShape;
}

export function normalizeCsvJsonTypeMode(value: string | null | undefined): CsvJsonTypeMode {
  return value && typeModes.has(value as CsvJsonTypeMode) ? (value as CsvJsonTypeMode) : defaultCsvJsonState.typeMode;
}

export function normalizeCsvJsonEmptyLineMode(value: string | null | undefined): CsvJsonEmptyLineMode {
  return value && emptyLineModes.has(value as CsvJsonEmptyLineMode)
    ? (value as CsvJsonEmptyLineMode)
    : defaultCsvJsonState.emptyLineMode;
}

export function normalizeCsvJsonIndent(value: string | null | undefined): CsvJsonIndent {
  return value && jsonIndents.has(value as CsvJsonIndent) ? (value as CsvJsonIndent) : defaultCsvJsonState.jsonIndent;
}

export function normalizeCsvJsonBoolean(value: string | null | undefined, fallback: boolean): boolean {
  if (value === "1") return true;
  if (value === "0") return false;

  return fallback;
}

function normalizeState(state: CsvJsonState): CsvJsonState {
  return {
    input: state.input,
    mode: normalizeCsvJsonMode(state.mode),
    delimiter: normalizeCsvJsonDelimiter(state.delimiter),
    headerMode: normalizeCsvJsonHeaderMode(state.headerMode),
    outputShape: normalizeCsvJsonOutputShape(state.outputShape),
    typeMode: normalizeCsvJsonTypeMode(state.typeMode),
    emptyLineMode: normalizeCsvJsonEmptyLineMode(state.emptyLineMode),
    jsonIndent: normalizeCsvJsonIndent(state.jsonIndent),
    escapeFormulas: Boolean(state.escapeFormulas),
  };
}

function getJsonStringifyIndent(indent: CsvJsonIndent): number | undefined {
  if (indent === "compacto") return undefined;
  return Number(indent);
}

function createEmptyPreview(): CsvJsonPreview {
  return {
    headers: [],
    rows: [],
  };
}

function getPreviewValue(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "undefined") return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value) ?? "";
}

function buildPreviewFromObjects(items: CsvJsonObject[], headers: string[]): CsvJsonPreview {
  return {
    headers,
    rows: items.slice(0, CSV_JSON_PREVIEW_ROW_LIMIT).map((item) => headers.map((header) => getPreviewValue(item[header]))),
  };
}

function buildPreviewFromRows(rows: CsvJsonCell[][], headers?: string[]): CsvJsonPreview {
  const columnCount = Math.max(headers?.length ?? 0, rows.reduce((max, row) => Math.max(max, row.length), 0));

  return {
    headers:
      headers ??
      Array.from({ length: columnCount }, (_, index) => {
        return `column_${index + 1}`;
      }),
    rows: rows.slice(0, CSV_JSON_PREVIEW_ROW_LIMIT).map((row) =>
      Array.from({ length: columnCount }, (_, index) => getPreviewValue(row[index]))
    ),
  };
}

function createCsvJsonObject(): CsvJsonObject {
  return Object.create(null) as CsvJsonObject;
}

function defineCsvJsonObjectProperty(
  item: CsvJsonObject,
  key: string,
  value: CsvJsonCell | CsvJsonCell[]
) {
  Object.defineProperty(item, key, {
    value,
    enumerable: true,
    configurable: true,
    writable: true,
  });
}

function createResult(
  state: CsvJsonState,
  status: CsvJsonStatus,
  inputMetrics: CsvJsonTextMetrics,
  options: Partial<Omit<CsvJsonResult, "status" | "mode" | "delimiter" | "inputMetrics" | "metrics">> = {}
): CsvJsonResult {
  const output = options.output ?? "";
  const outputMetrics = options.outputMetrics ?? (output.length > 0 ? getCsvJsonTextMetrics(output) : null);
  const warnings = options.warnings ?? [];
  const rows = options.rows ?? 0;
  const columns = options.columns ?? 0;
  const detectedDelimiter = options.detectedDelimiter ?? null;

  return {
    status,
    mode: state.mode,
    delimiter: state.delimiter,
    detectedDelimiter,
    rows,
    columns,
    inputMetrics,
    outputMetrics,
    metrics: {
      inputCharacters: inputMetrics.characters,
      inputBytes: inputMetrics.bytes,
      outputCharacters: outputMetrics?.characters ?? 0,
      outputBytes: outputMetrics?.bytes ?? 0,
      rows,
      columns,
      warnings: warnings.length,
      delimiter: detectedDelimiter,
    },
    output,
    preview: options.preview ?? createEmptyPreview(),
    warnings,
    errors: options.errors ?? [],
  };
}

function getCsvRows(data: unknown[]): string[][] {
  return data.map((row) => (Array.isArray(row) ? row.map((value) => String(value ?? "")) : [String(row ?? "")]));
}

function endsWithRecordTerminator(input: string): boolean {
  return input.endsWith("\n") || input.endsWith("\r");
}

function splitCsvRecordTexts(input: string): string[] {
  const records: string[] = [];
  let start = 0;
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];

    if (character === '"') {
      if (inQuotes && input[index + 1] === '"') {
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && (character === "\n" || character === "\r")) {
      records.push(input.slice(start, index));
      if (character === "\r" && input[index + 1] === "\n") {
        index += 1;
      }
      start = index + 1;
    }
  }

  if (start < input.length || !endsWithRecordTerminator(input)) {
    records.push(input.slice(start));
  }

  return records;
}

function getPreparedCsvRows(rows: string[][], input: string, emptyLineMode: CsvJsonEmptyLineMode): CsvRowsResult {
  const rawRecords = splitCsvRecordTexts(input);
  const usableRows =
    endsWithRecordTerminator(input) && rows.at(-1)?.length === 1 && rows.at(-1)?.[0] === "" ? rows.slice(0, -1) : rows;

  if (emptyLineMode === "preservar") {
    return {
      rows: usableRows,
      ignoredEmptyLines: 0,
    };
  }

  let ignoredEmptyLines = 0;
  const filteredRows = usableRows.filter((row, index) => {
    const isTrulyEmptyLine = row.length === 1 && row[0] === "" && (rawRecords[index] ?? "") === "";

    if (isTrulyEmptyLine) {
      ignoredEmptyLines += 1;
      return false;
    }

    return true;
  });

  return {
    rows: filteredRows,
    ignoredEmptyLines,
  };
}

function getDelimiterScore(input: string, delimiter: CsvJsonResolvedDelimiter): number {
  const parsed = Papa.parse<string[]>(input, {
    delimiter: delimiterCharacters[delimiter],
    dynamicTyping: false,
    preview: 20,
    skipEmptyLines: false,
  });

  if (parsed.errors.length > 0) return Number.NEGATIVE_INFINITY;

  const prepared = getPreparedCsvRows(getCsvRows(parsed.data), input, "ignorar");
  const multiFieldRows = prepared.rows.filter((row) => row.length > 1);

  if (multiFieldRows.length === 0) return Number.NEGATIVE_INFINITY;

  const widths = new Map<number, number>();
  for (const row of multiFieldRows) {
    widths.set(row.length, (widths.get(row.length) ?? 0) + 1);
  }

  const mostCommonWidthCount = Math.max(...widths.values());
  const maxFields = Math.max(...multiFieldRows.map((row) => row.length));

  return multiFieldRows.length * 1_000 + mostCommonWidthCount * 100 + maxFields * 10;
}

function detectDelimiter(input: string): DelimiterDetectionResult {
  const scores = (Object.keys(delimiterCharacters) as CsvJsonResolvedDelimiter[])
    .map((delimiter) => ({
      delimiter,
      score: getDelimiterScore(input, delimiter),
    }))
    .sort((a, b) => b.score - a.score);
  const best = scores[0];

  if (!best || !Number.isFinite(best.score)) {
    return {
      delimiter: null,
      ambiguous: false,
    };
  }

  return {
    delimiter: best.delimiter,
    ambiguous: scores[1] ? best.score === scores[1].score : false,
  };
}

function mapPapaError(error: Papa.ParseError): CsvJsonError {
  if (error.code === "MissingQuotes") {
    return {
      code: "missingClosingQuote",
      row: typeof error.row === "number" ? error.row + 1 : undefined,
      message: error.message,
    };
  }

  if (error.code === "InvalidQuotes" || error.code === "UndetectableDelimiter") {
    return {
      code: error.code === "UndetectableDelimiter" ? "undetectableDelimiter" : "malformedQuotes",
      row: typeof error.row === "number" ? error.row + 1 : undefined,
      message: error.message,
    };
  }

  return {
    code: "parserError",
    row: typeof error.row === "number" ? error.row + 1 : undefined,
    message: error.message,
  };
}

function countRealHeaderNames(rawHeaders: string[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const rawHeader of rawHeaders) {
    if (rawHeader.length === 0) continue;
    counts.set(rawHeader, (counts.get(rawHeader) ?? 0) + 1);
  }

  return counts;
}

function normalizeHeader(rawHeader: string, index: number, emitted: Set<string>, realHeaderCounts: Map<string, number>) {
  const generated = rawHeader.length === 0;
  const initialName = generated ? `column_${index + 1}` : rawHeader;
  const currentRealHeader = generated ? null : rawHeader;
  let name = initialName;
  let suffix = 2;

  while (emitted.has(name) || (name !== currentRealHeader && (realHeaderCounts.get(name) ?? 0) > 0)) {
    name = `${initialName}_${suffix}`;
    suffix += 1;
  }

  emitted.add(name);

  return {
    name,
    generated,
    duplicate: name !== initialName,
    duplicateSourceName: initialName,
  };
}

function getExtraFieldsHeader(headers: string[]): string {
  const usedHeaders = new Set(headers);
  let candidate = "_extra";
  let suffix = 2;

  while (usedHeaders.has(candidate)) {
    candidate = `_extra_${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function normalizeCsvValue(rawValue: string | undefined, typeMode: CsvJsonTypeMode, counters: { inferred: number }): CsvJsonCell {
  const value = rawValue ?? "";

  if (typeMode !== "inferir" || value === "") {
    return value;
  }

  if (value === "true") {
    counters.inferred += 1;
    return true;
  }

  if (value === "false") {
    counters.inferred += 1;
    return false;
  }

  if (value === "null") {
    counters.inferred += 1;
    return null;
  }

  if (inferredNumberPattern.test(value)) {
    const numericValue = Number(value);

    if (Number.isFinite(numericValue) && Math.abs(numericValue) <= Number.MAX_SAFE_INTEGER) {
      counters.inferred += 1;
      return numericValue;
    }
  }

  return value;
}

function pushCountWarning(warnings: CsvJsonWarning[], code: CsvJsonWarningCode, count: number, details?: string[]) {
  if (count <= 0) return;

  warnings.push({
    code,
    count,
    details,
  });
}

function processCsvToJson(state: CsvJsonState, inputMetrics: CsvJsonTextMetrics): CsvJsonResult {
  const warnings: CsvJsonWarning[] = [];
  let input = state.input;

  if (input.charCodeAt(0) === 0xfeff) {
    input = input.slice(1);
    warnings.push({ code: "bomRemoved" });
  }

  const detection = state.delimiter === "auto" ? detectDelimiter(input) : { delimiter: state.delimiter, ambiguous: false };
  const detectedDelimiter = detection.delimiter;

  if (!detectedDelimiter) {
    return createResult(state, "invalidCsv", inputMetrics, {
      warnings,
      errors: [{ code: "undetectableDelimiter" }],
    });
  }

  if (state.delimiter === "auto") {
    warnings.push({ code: "delimiterDetected", delimiter: detectedDelimiter });
    if (detection.ambiguous) {
      warnings.push({ code: "ambiguousDelimiter", delimiter: detectedDelimiter });
    }
  }

  const parsed = Papa.parse<string[]>(input, {
    delimiter: delimiterCharacters[detectedDelimiter],
    dynamicTyping: false,
    skipEmptyLines: false,
  });

  if (parsed.errors.length > 0) {
    return createResult(state, "invalidCsv", inputMetrics, {
      detectedDelimiter,
      warnings,
      errors: parsed.errors.map(mapPapaError),
    });
  }

  const prepared = getPreparedCsvRows(getCsvRows(parsed.data), input, state.emptyLineMode);
  const rows = prepared.rows;
  const fieldCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
  const counters = {
    inferred: 0,
    duplicateHeaders: 0,
    emptyHeaders: 0,
    raggedRows: 0,
    extraFields: 0,
    missingFields: 0,
  };

  pushCountWarning(warnings, "emptyLinesIgnored", prepared.ignoredEmptyLines);

  if (rows.length === 0) {
    return createResult(state, "empty", inputMetrics, { detectedDelimiter, warnings });
  }

  if (state.outputShape === "arrays") {
    const dataRows = state.headerMode === "primeiraLinha" ? rows.slice(1) : rows;
    const expectedWidth = state.headerMode === "primeiraLinha" ? rows[0]?.length ?? 0 : rows[0]?.length ?? 0;
    const outputValue = dataRows.map((row) => {
      if (row.length !== expectedWidth) counters.raggedRows += 1;
      return row.map((value) => normalizeCsvValue(value, state.typeMode, counters));
    });
    const output = JSON.stringify(outputValue, null, getJsonStringifyIndent(state.jsonIndent));

    pushCountWarning(warnings, "raggedRows", counters.raggedRows);
    pushCountWarning(warnings, "typesInferred", counters.inferred);

    return createResult(state, "valid", inputMetrics, {
      detectedDelimiter,
      rows: outputValue.length,
      columns: fieldCount,
      output,
      preview: buildPreviewFromRows(outputValue),
      warnings,
    });
  }

  const hasHeader = state.headerMode === "primeiraLinha";
  const rawHeaders = hasHeader
    ? rows[0]
    : Array.from({ length: fieldCount }, (_, index) => {
        return `column_${index + 1}`;
      });
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const emittedHeaders = new Set<string>();
  const realHeaderCounts = countRealHeaderNames(rawHeaders);
  const headerResults = rawHeaders.map((header, index) => normalizeHeader(header, index, emittedHeaders, realHeaderCounts));
  const headers = headerResults.map((header) => header.name);
  const extraFieldsHeader = getExtraFieldsHeader(headers);
  const duplicateDetails = headerResults
    .map((header) => (header.duplicate ? `${header.duplicateSourceName} -> ${header.name}` : ""))
    .filter(Boolean);
  const emptyDetails = headerResults
    .map((header, index) => (header.generated ? `column ${index + 1} -> ${header.name}` : ""))
    .filter(Boolean);
  const outputValue = dataRows.map((row) => {
    const item = createCsvJsonObject();

    if (row.length !== headers.length) counters.raggedRows += 1;

    for (let index = 0; index < headers.length; index += 1) {
      if (index >= row.length) counters.missingFields += 1;
      defineCsvJsonObjectProperty(item, headers[index], normalizeCsvValue(row[index], state.typeMode, counters));
    }

    if (row.length > headers.length) {
      const extra = row.slice(headers.length).map((value) => normalizeCsvValue(value, state.typeMode, counters));
      counters.extraFields += extra.length;
      defineCsvJsonObjectProperty(item, extraFieldsHeader, extra);
    }

    return item;
  });

  counters.duplicateHeaders = duplicateDetails.length;
  counters.emptyHeaders = hasHeader ? emptyDetails.length : 0;

  pushCountWarning(warnings, "duplicateHeadersRenamed", counters.duplicateHeaders, duplicateDetails);
  pushCountWarning(warnings, "emptyHeadersGenerated", counters.emptyHeaders, emptyDetails);
  pushCountWarning(warnings, "raggedRows", counters.raggedRows);
  pushCountWarning(warnings, "extraFieldsPreserved", counters.extraFields);
  pushCountWarning(warnings, "missingFieldsFilled", counters.missingFields);
  pushCountWarning(warnings, "typesInferred", counters.inferred);

  return createResult(state, "valid", inputMetrics, {
    detectedDelimiter,
    rows: outputValue.length,
    columns: headers.length,
    output: JSON.stringify(outputValue, null, getJsonStringifyIndent(state.jsonIndent)),
    preview: buildPreviewFromObjects(outputValue, headers.concat(counters.extraFields > 0 ? [extraFieldsHeader] : [])),
    warnings,
  });
}

function isPlainObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeJsonCell(value: unknown, counters: { nested: number; formulaLike: number; escaped: number }, escapeFormulas: boolean) {
  let cell: string;

  if (value === null || typeof value === "undefined") {
    cell = "";
  } else if (typeof value === "string") {
    cell = value;
  } else if (typeof value === "number" || typeof value === "boolean") {
    cell = String(value);
  } else {
    counters.nested += 1;
    cell = JSON.stringify(value) ?? "";
  }

  if (formulaStartPattern.test(cell)) {
    counters.formulaLike += 1;
    if (escapeFormulas) {
      counters.escaped += 1;
      return `'${cell}`;
    }
  }

  return cell;
}

function getFieldsFromObjects(items: JsonObject[]): string[] {
  const fields: string[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    for (const key of Object.keys(item)) {
      if (!seen.has(key)) {
        fields.push(key);
        seen.add(key);
      }
    }
  }

  return fields;
}

function normalizeObjectRows(
  items: JsonObject[],
  fields: string[],
  counters: { nested: number; formulaLike: number; escaped: number },
  escapeFormulas: boolean
): string[][] {
  return items.map((item) => fields.map((field) => normalizeJsonCell(item[field], counters, escapeFormulas)));
}

function normalizeArrayRows(
  rows: unknown[][],
  counters: { nested: number; formulaLike: number; escaped: number },
  escapeFormulas: boolean
): string[][] {
  return rows.map((row) => row.map((value) => normalizeJsonCell(value, counters, escapeFormulas)));
}

function getJsonToCsvShape(
  value: unknown,
  counters: { nested: number; formulaLike: number; escaped: number },
  escapeFormulas: boolean
): { fields: string[] | null; rows: string[][]; error: CsvJsonError | null } {
  if (Array.isArray(value)) {
    if (value.length === 0) return { fields: null, rows: [], error: null };

    const objectRows = value.filter(isPlainObject);
    const arrayRows = value.filter(Array.isArray);

    if (objectRows.length > 0 && arrayRows.length > 0) {
      return { fields: null, rows: [], error: { code: "mixedJsonRows" } };
    }

    if (objectRows.length === value.length) {
      const fields = getFieldsFromObjects(objectRows);
      return {
        fields,
        rows: normalizeObjectRows(objectRows, fields, counters, escapeFormulas),
        error: null,
      };
    }

    if (arrayRows.length === value.length) {
      return {
        fields: null,
        rows: normalizeArrayRows(arrayRows, counters, escapeFormulas),
        error: null,
      };
    }

    return { fields: null, rows: [], error: { code: "unsupportedJsonRow" } };
  }

  if (isPlainObject(value) && Array.isArray(value.fields) && Array.isArray(value.data)) {
    const fields = value.fields;
    const data = value.data;

    if (!fields.every((field): field is string => typeof field === "string")) {
      return { fields: null, rows: [], error: { code: "invalidFieldsData" } };
    }

    if (data.length === 0) return { fields, rows: [], error: null };

    const objectRows = data.filter(isPlainObject);
    const arrayRows = data.filter(Array.isArray);

    if (objectRows.length === data.length) {
      return {
        fields,
        rows: normalizeObjectRows(objectRows, fields, counters, escapeFormulas),
        error: null,
      };
    }

    if (arrayRows.length === data.length) {
      return {
        fields,
        rows: normalizeArrayRows(arrayRows, counters, escapeFormulas),
        error: null,
      };
    }

    return { fields: null, rows: [], error: { code: "invalidFieldsData" } };
  }

  return { fields: null, rows: [], error: { code: "unsupportedJsonRoot" } };
}

function processJsonToCsv(state: CsvJsonState, inputMetrics: CsvJsonTextMetrics): CsvJsonResult {
  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(state.input);
  } catch (error) {
    return createResult(state, "invalidJson", inputMetrics, {
      errors: [{ code: "invalidJson", message: error instanceof Error ? error.message : String(error) }],
    });
  }

  const counters = { nested: 0, formulaLike: 0, escaped: 0 };
  const shape = getJsonToCsvShape(parsedValue, counters, state.escapeFormulas);

  if (shape.error) {
    return createResult(state, "invalidJson", inputMetrics, { errors: [shape.error] });
  }

  const resolvedDelimiter = state.delimiter === "auto" ? "virgula" : state.delimiter;
  const output = Papa.unparse(shape.fields ? { fields: shape.fields, data: shape.rows } : shape.rows, {
    delimiter: delimiterCharacters[resolvedDelimiter],
    newline: "\r\n",
  });
  const columns = shape.fields?.length ?? shape.rows.reduce((max, row) => Math.max(max, row.length), 0);
  const warnings: CsvJsonWarning[] = [];

  pushCountWarning(warnings, "nestedValuesSerialized", counters.nested);
  pushCountWarning(warnings, "formulaLikeCells", counters.formulaLike);
  pushCountWarning(warnings, "formulaEscaped", counters.escaped);

  return createResult(state, "valid", inputMetrics, {
    detectedDelimiter: resolvedDelimiter,
    rows: shape.rows.length,
    columns,
    output,
    preview: {
      headers:
        shape.fields ??
        Array.from({ length: columns }, (_, index) => {
          return `column_${index + 1}`;
        }),
      rows: shape.rows.slice(0, CSV_JSON_PREVIEW_ROW_LIMIT),
    },
    warnings,
  });
}

export function processCsvJsonConverter(state: CsvJsonState): CsvJsonResult {
  const normalizedState = normalizeState(state);
  const inputMetrics = getCsvJsonTextMetrics(normalizedState.input);

  if (normalizedState.input.trim().length === 0) {
    return createResult(normalizedState, "empty", inputMetrics);
  }

  if (normalizedState.input.length > CSV_JSON_MAX_INPUT_LENGTH) {
    return createResult(normalizedState, "tooLarge", inputMetrics, {
      errors: [{ code: "inputTooLarge" }],
    });
  }

  return normalizedState.mode === "csvParaJson"
    ? processCsvToJson(normalizedState, inputMetrics)
    : processJsonToCsv(normalizedState, inputMetrics);
}

export function readCsvJsonStateFromParams(params: URLSearchParams): CsvJsonState {
  return {
    input: defaultCsvJsonState.input,
    mode: normalizeCsvJsonMode(params.get("modo")),
    delimiter: normalizeCsvJsonDelimiter(params.get("delimitador")),
    headerMode: normalizeCsvJsonHeaderMode(params.get("cabecalho")),
    outputShape: normalizeCsvJsonOutputShape(params.get("saida")),
    typeMode: normalizeCsvJsonTypeMode(params.get("tipos")),
    emptyLineMode: normalizeCsvJsonEmptyLineMode(params.get("linhas")),
    jsonIndent: normalizeCsvJsonIndent(params.get("recuo")),
    escapeFormulas: normalizeCsvJsonBoolean(params.get("formulas"), defaultCsvJsonState.escapeFormulas),
  };
}

export function buildCsvJsonSearchParams(state: CsvJsonState): CsvJsonSearchParamsResult {
  const normalizedState = normalizeState(state);
  const params = new URLSearchParams();

  params.set("modo", normalizedState.mode);
  params.set("delimitador", normalizedState.delimiter);
  params.set("cabecalho", normalizedState.headerMode);
  params.set("saida", normalizedState.outputShape);
  params.set("tipos", normalizedState.typeMode);
  params.set("linhas", normalizedState.emptyLineMode);
  params.set("recuo", normalizedState.jsonIndent);
  params.set("formulas", normalizedState.escapeFormulas ? "1" : "0");

  return {
    params,
    queryLength: params.toString().length,
  };
}

export function readCsvJsonContentFromFragment(fragment: string): CsvJsonContentFragmentState {
  const normalizedFragment = fragment.startsWith("#") ? fragment.slice(1) : fragment;
  const params = new URLSearchParams(normalizedFragment);
  const hasExplicitContent = params.get("conteudo") === "1";

  return {
    hasExplicitContent,
    input: hasExplicitContent ? params.get("entrada") ?? "" : defaultCsvJsonState.input,
  };
}

export function buildCsvJsonContentFragmentParams(
  state: CsvJsonState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): CsvJsonContentFragmentResult {
  const params = new URLSearchParams();
  const maxFragmentLength = options.maxFragmentLength ?? CSV_JSON_SHARE_FRAGMENT_LIMIT;

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

export function buildCsvJsonShareUrl(
  baseUrl: string,
  state: CsvJsonState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): CsvJsonShareUrlResult {
  const searchResult = buildCsvJsonSearchParams(state);
  const fragmentResult = buildCsvJsonContentFragmentParams(state, options);
  const query = searchResult.params.toString();
  const fragment = fragmentResult.params.toString();

  return {
    url: `${baseUrl}${query ? `?${query}` : ""}${fragment ? `#${fragment}` : ""}`,
    searchParams: searchResult.params,
    fragmentParams: fragmentResult.params,
    contentOmitted: fragmentResult.contentOmitted,
  };
}

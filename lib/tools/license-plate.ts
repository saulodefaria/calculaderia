export type BrazilianPlateMode = "auto" | "mercosul" | "antiga";
export type BrazilianPlateStatus =
  | "empty"
  | "validMercosul"
  | "validAntiga"
  | "invalid"
  | "incomplete"
  | "attention";
export type BrazilianPlateFormat = "mercosul" | "antiga" | "unknown";
export type BrazilianPlateDiagnosticStatus = "pass" | "fail" | "warn" | "info";
export type BrazilianPlateDiagnosticId = "input" | "characters" | "length" | "format" | "conversion" | "privacy";
export type BrazilianPlateConversionDirection = "oldToMercosul" | "mercosulToOld";

export type BrazilianPlateIssueCode =
  | "empty"
  | "trimmedWhitespace"
  | "letterCaseNormalized"
  | "ignoredSeparators"
  | "unsupportedCharacters"
  | "controlCharacters"
  | "multipleValues"
  | "tooShort"
  | "tooLong"
  | "expectedLetterPrefix"
  | "expectedDigitFourth"
  | "expectedLetterFifth"
  | "expectedDigitFifth"
  | "expectedDigitTail"
  | "expectedLetterOrDigitFifth"
  | "unknownFormat"
  | "modeMismatchMercosul"
  | "modeMismatchAntiga"
  | "confusableCharacters"
  | "oldEquivalentUnavailable"
  | "syntaxOnly";

export interface BrazilianPlateIssue {
  code: BrazilianPlateIssueCode;
  characters?: string;
  count?: number;
}

export interface BrazilianPlateDiagnostic {
  id: BrazilianPlateDiagnosticId;
  status: BrazilianPlateDiagnosticStatus;
  issueCodes: BrazilianPlateIssueCode[];
}

export interface BrazilianPlateNormalizationResult {
  input: string;
  trimmedInput: string;
  normalizedPlate: string;
  normalizedLength: number;
  ignoredSeparatorCount: number;
  ignoredSeparators: string[];
  unsupportedCharacters: string[];
  unsupportedCharacterCount: number;
  controlCharacterCount: number;
  lineBreakCount: number;
  hasLetterCaseNormalization: boolean;
  confusableCharacters: string[];
  issueCodes: BrazilianPlateIssueCode[];
}

export interface BrazilianPlateConversionResult {
  direction: BrazilianPlateConversionDirection;
  input: string;
  output: string;
  mappingDigit: string;
  mappingLetter: string;
}

export interface BrazilianPlateValidationResult extends BrazilianPlateNormalizationResult {
  status: BrazilianPlateStatus;
  mode: BrazilianPlateMode;
  format: BrazilianPlateFormat;
  formattedPlate: string | null;
  conversion: BrazilianPlateConversionResult | null;
  issues: BrazilianPlateIssue[];
  diagnostics: BrazilianPlateDiagnostic[];
}

export interface BrazilianPlateValidatorState {
  placa: string;
  modo: BrazilianPlateMode;
}

export interface BrazilianPlateValidatorSearchParamsResult {
  params: URLSearchParams;
  queryLength: number;
}

export interface BrazilianPlateContentFragmentResult {
  params: URLSearchParams;
  contentOmitted: boolean;
  fragmentLength: number;
}

export interface BrazilianPlateContentFragmentState {
  hasExplicitContent: boolean;
  placa: string;
}

export interface BrazilianPlateShareUrlResult {
  url: string;
  searchParams: URLSearchParams;
  fragmentParams: URLSearchParams;
  contentOmitted: boolean;
}

export const BRAZILIAN_PLATE_SHARE_FRAGMENT_LIMIT = 200;

export const BRAZILIAN_PLATE_CONVERSION_TABLE = {
  "0": "A",
  "1": "B",
  "2": "C",
  "3": "D",
  "4": "E",
  "5": "F",
  "6": "G",
  "7": "H",
  "8": "I",
  "9": "J",
} as const;

export const defaultBrazilianPlateValidatorState: BrazilianPlateValidatorState = {
  placa: "",
  modo: "auto",
};

const brazilianPlateModes = new Set<BrazilianPlateMode>(["auto", "mercosul", "antiga"]);
const separatorCharacters = new Set([" ", "\u00a0", "-", "."]);
const confusableCharacterSet = new Set(["O", "0", "I", "1", "B", "8"]);
const hardNormalizationFailureCodes: BrazilianPlateIssueCode[] = [
  "unsupportedCharacters",
  "controlCharacters",
  "multipleValues",
];
const reverseConversionTable = new Map<string, string>(
  Object.entries(BRAZILIAN_PLATE_CONVERSION_TABLE).map(([digit, letter]) => [letter, digit])
);

function trimPlateWhitespace(value: string): string {
  return value.replace(/^[\u0009-\u000d \u00a0]+|[\u0009-\u000d \u00a0]+$/g, "");
}

function isAsciiLetter(character: string): boolean {
  return /^[A-Z]$/.test(character);
}

function isAsciiDigit(character: string): boolean {
  return /^[0-9]$/.test(character);
}

function isAsciiLowercaseLetter(character: string): boolean {
  return /^[a-z]$/.test(character);
}

function isControlCharacter(character: string): boolean {
  return /[\u0000-\u001f\u007f]/.test(character);
}

function uniqueCharacters(characters: string[]) {
  return Array.from(new Set(characters));
}

function addIssue(issues: BrazilianPlateIssue[], issue: BrazilianPlateIssue) {
  const existingIssue = issues.find((item) => item.code === issue.code);

  if (!existingIssue) {
    issues.push(issue);
    return;
  }

  existingIssue.characters = issue.characters ?? existingIssue.characters;
  existingIssue.count = issue.count ?? existingIssue.count;
}

function addIssueCode(issueCodes: BrazilianPlateIssueCode[], code: BrazilianPlateIssueCode) {
  if (!issueCodes.includes(code)) {
    issueCodes.push(code);
  }
}

function hasAnyIssue(issueCodes: BrazilianPlateIssueCode[], codes: BrazilianPlateIssueCode[]) {
  return codes.some((code) => issueCodes.includes(code));
}

function getIssueCodes(issueCodes: BrazilianPlateIssueCode[], codes: BrazilianPlateIssueCode[]) {
  return codes.filter((code) => issueCodes.includes(code));
}

function toIssueCodes(issues: BrazilianPlateIssue[]) {
  return issues.map((issue) => issue.code);
}

export function normalizeBrazilianPlateInput(input: string): BrazilianPlateNormalizationResult {
  const trimmedInput = trimPlateWhitespace(input);
  const normalizedCharacters: string[] = [];
  const ignoredSeparators: string[] = [];
  const unsupportedCharacters: string[] = [];
  const confusableCharacters: string[] = [];
  const issueCodes: BrazilianPlateIssueCode[] = [];
  let controlCharacterCount = 0;
  let lineBreakCount = 0;
  let hasLetterCaseNormalization = false;

  if (input !== trimmedInput) {
    addIssueCode(issueCodes, "trimmedWhitespace");
  }

  for (const character of Array.from(trimmedInput)) {
    if (isAsciiLetter(character)) {
      normalizedCharacters.push(character);
      continue;
    }

    if (isAsciiLowercaseLetter(character)) {
      normalizedCharacters.push(character.toUpperCase());
      hasLetterCaseNormalization = true;
      continue;
    }

    if (isAsciiDigit(character)) {
      normalizedCharacters.push(character);
      continue;
    }

    if (separatorCharacters.has(character)) {
      ignoredSeparators.push(character);
      continue;
    }

    if (character === "\n" || character === "\r") {
      lineBreakCount += 1;
      continue;
    }

    if (isControlCharacter(character)) {
      controlCharacterCount += 1;
      continue;
    }

    unsupportedCharacters.push(character);
  }

  const normalizedPlate = normalizedCharacters.join("");

  if (hasLetterCaseNormalization) {
    addIssueCode(issueCodes, "letterCaseNormalized");
  }

  if (ignoredSeparators.length > 0) {
    addIssueCode(issueCodes, "ignoredSeparators");
  }

  if (unsupportedCharacters.length > 0) {
    addIssueCode(issueCodes, "unsupportedCharacters");
  }

  if (controlCharacterCount > 0) {
    addIssueCode(issueCodes, "controlCharacters");
  }

  if (lineBreakCount > 0) {
    addIssueCode(issueCodes, "multipleValues");
  }

  for (const character of normalizedPlate) {
    if (confusableCharacterSet.has(character)) {
      confusableCharacters.push(character);
    }
  }

  if (confusableCharacters.length > 0) {
    addIssueCode(issueCodes, "confusableCharacters");
  }

  return {
    input,
    trimmedInput,
    normalizedPlate,
    normalizedLength: normalizedPlate.length,
    ignoredSeparatorCount: ignoredSeparators.length,
    ignoredSeparators: uniqueCharacters(ignoredSeparators),
    unsupportedCharacters: uniqueCharacters(unsupportedCharacters),
    unsupportedCharacterCount: unsupportedCharacters.length,
    controlCharacterCount,
    lineBreakCount,
    hasLetterCaseNormalization,
    confusableCharacters: uniqueCharacters(confusableCharacters),
    issueCodes,
  };
}

export function normalizeBrazilianPlateMode(value: string | null | undefined): BrazilianPlateMode {
  return value && brazilianPlateModes.has(value as BrazilianPlateMode) ? (value as BrazilianPlateMode) : "auto";
}

export function getBrazilianPlateFormat(normalizedPlate: string): BrazilianPlateFormat {
  if (/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(normalizedPlate)) {
    return "mercosul";
  }

  if (/^[A-Z]{3}[0-9]{4}$/.test(normalizedPlate)) {
    return "antiga";
  }

  return "unknown";
}

export function formatBrazilianPlate(normalizedPlate: string, format: BrazilianPlateFormat): string | null {
  if (format === "mercosul" && getBrazilianPlateFormat(normalizedPlate) === "mercosul") {
    return normalizedPlate;
  }

  if (format === "antiga" && getBrazilianPlateFormat(normalizedPlate) === "antiga") {
    return `${normalizedPlate.slice(0, 3)}-${normalizedPlate.slice(3)}`;
  }

  return null;
}

export function convertOldPlateToMercosul(oldPlate: string): BrazilianPlateConversionResult | null {
  const normalization = normalizeBrazilianPlateInput(oldPlate);

  if (hasAnyIssue(normalization.issueCodes, hardNormalizationFailureCodes)) {
    return null;
  }

  const normalized = normalization.normalizedPlate;

  if (getBrazilianPlateFormat(normalized) !== "antiga") {
    return null;
  }

  const mappingDigit = normalized[4] ?? "";
  const mappingLetter = BRAZILIAN_PLATE_CONVERSION_TABLE[mappingDigit as keyof typeof BRAZILIAN_PLATE_CONVERSION_TABLE];
  if (!mappingLetter) return null;

  return {
    direction: "oldToMercosul",
    input: normalized,
    output: `${normalized.slice(0, 4)}${mappingLetter}${normalized.slice(5)}`,
    mappingDigit,
    mappingLetter,
  };
}

export function convertMercosulToOldPlate(mercosulPlate: string): BrazilianPlateConversionResult | null {
  const normalization = normalizeBrazilianPlateInput(mercosulPlate);

  if (hasAnyIssue(normalization.issueCodes, hardNormalizationFailureCodes)) {
    return null;
  }

  const normalized = normalization.normalizedPlate;

  if (getBrazilianPlateFormat(normalized) !== "mercosul") {
    return null;
  }

  const mappingLetter = normalized[4] ?? "";
  const mappingDigit = reverseConversionTable.get(mappingLetter);
  if (!mappingDigit) return null;

  return {
    direction: "mercosulToOld",
    input: normalized,
    output: `${normalized.slice(0, 4)}${mappingDigit}${normalized.slice(5)}`,
    mappingDigit,
    mappingLetter,
  };
}

function getPatternIssue(normalizedPlate: string, mode: BrazilianPlateMode): BrazilianPlateIssueCode {
  const requiresOld = mode === "antiga";
  const requiresMercosul = mode === "mercosul";

  for (let index = 0; index < 3; index += 1) {
    if (!isAsciiLetter(normalizedPlate[index] ?? "")) {
      return "expectedLetterPrefix";
    }
  }

  if (!isAsciiDigit(normalizedPlate[3] ?? "")) {
    return "expectedDigitFourth";
  }

  if (requiresMercosul && !isAsciiLetter(normalizedPlate[4] ?? "")) {
    return "expectedLetterFifth";
  }

  if (requiresOld && !isAsciiDigit(normalizedPlate[4] ?? "")) {
    return "expectedDigitFifth";
  }

  if (!requiresOld && !requiresMercosul && !isAsciiLetter(normalizedPlate[4] ?? "") && !isAsciiDigit(normalizedPlate[4] ?? "")) {
    return "expectedLetterOrDigitFifth";
  }

  if (!/^[0-9]{2}$/.test(normalizedPlate.slice(5))) {
    return "expectedDigitTail";
  }

  return "unknownFormat";
}

function buildDiagnostics(
  issueCodes: BrazilianPlateIssueCode[],
  status: BrazilianPlateStatus,
  format: BrazilianPlateFormat
): BrazilianPlateDiagnostic[] {
  const inputWarnings: BrazilianPlateIssueCode[] = ["trimmedWhitespace", "letterCaseNormalized"];
  const characterFailures: BrazilianPlateIssueCode[] = ["unsupportedCharacters", "controlCharacters", "multipleValues"];
  const characterWarnings: BrazilianPlateIssueCode[] = ["ignoredSeparators", "confusableCharacters"];
  const lengthFailures: BrazilianPlateIssueCode[] = ["tooLong"];
  const lengthWarnings: BrazilianPlateIssueCode[] = ["tooShort"];
  const formatFailures: BrazilianPlateIssueCode[] = [
    "expectedLetterPrefix",
    "expectedDigitFourth",
    "expectedLetterFifth",
    "expectedDigitFifth",
    "expectedDigitTail",
    "expectedLetterOrDigitFifth",
    "unknownFormat",
  ];
  const formatWarnings: BrazilianPlateIssueCode[] = ["modeMismatchMercosul", "modeMismatchAntiga"];

  return [
    {
      id: "input",
      status: status === "empty" ? "info" : hasAnyIssue(issueCodes, inputWarnings) ? "warn" : "pass",
      issueCodes: status === "empty" ? ["empty"] : getIssueCodes(issueCodes, inputWarnings),
    },
    {
      id: "characters",
      status: hasAnyIssue(issueCodes, characterFailures)
        ? "fail"
        : hasAnyIssue(issueCodes, characterWarnings)
          ? "warn"
          : status === "empty"
            ? "info"
            : "pass",
      issueCodes: getIssueCodes(issueCodes, [...characterFailures, ...characterWarnings]),
    },
    {
      id: "length",
      status: hasAnyIssue(issueCodes, lengthFailures)
        ? "fail"
        : hasAnyIssue(issueCodes, lengthWarnings)
          ? "warn"
          : status === "empty"
            ? "info"
            : "pass",
      issueCodes: status === "empty" ? ["empty"] : getIssueCodes(issueCodes, [...lengthFailures, ...lengthWarnings]),
    },
    {
      id: "format",
      status: hasAnyIssue(issueCodes, formatFailures)
        ? "fail"
        : hasAnyIssue(issueCodes, formatWarnings)
          ? "warn"
          : status === "empty"
            ? "info"
            : "pass",
      issueCodes: getIssueCodes(issueCodes, [...formatFailures, ...formatWarnings]),
    },
    {
      id: "conversion",
      status: hasAnyIssue(issueCodes, ["oldEquivalentUnavailable"])
        ? "info"
        : format === "unknown"
          ? "info"
          : "pass",
      issueCodes: getIssueCodes(issueCodes, ["oldEquivalentUnavailable"]),
    },
    {
      id: "privacy",
      status: "info",
      issueCodes: ["syntaxOnly"],
    },
  ];
}

export function validateBrazilianPlate(
  input: string,
  options: { mode?: BrazilianPlateMode } = {}
): BrazilianPlateValidationResult {
  const mode = normalizeBrazilianPlateMode(options.mode);
  const normalization = normalizeBrazilianPlateInput(input);
  const issues: BrazilianPlateIssue[] = normalization.issueCodes.map((code) => ({ code }));

  if (normalization.unsupportedCharacterCount > 0) {
    addIssue(issues, {
      code: "unsupportedCharacters",
      characters: normalization.unsupportedCharacters.join(""),
      count: normalization.unsupportedCharacterCount,
    });
  }

  if (normalization.controlCharacterCount > 0) {
    addIssue(issues, { code: "controlCharacters", count: normalization.controlCharacterCount });
  }

  if (normalization.lineBreakCount > 0) {
    addIssue(issues, { code: "multipleValues", count: normalization.lineBreakCount });
  }

  let issueCodes = toIssueCodes(issues);
  let status: BrazilianPlateStatus = "empty";
  let format: BrazilianPlateFormat = "unknown";
  let conversion: BrazilianPlateConversionResult | null = null;
  let formattedPlate: string | null = null;

  const hasHardCharacterFailure = hasAnyIssue(issueCodes, hardNormalizationFailureCodes);

  if (normalization.trimmedInput.length === 0 && normalization.normalizedLength === 0) {
    addIssue(issues, { code: "empty" });
    issueCodes = toIssueCodes(issues);
    status = "empty";
  } else if (hasHardCharacterFailure) {
    status = "invalid";
  } else if (normalization.normalizedLength < 7) {
    addIssue(issues, { code: "tooShort" });
    issueCodes = toIssueCodes(issues);
    status = "incomplete";
  } else if (normalization.normalizedLength > 7) {
    addIssue(issues, { code: "tooLong" });
    issueCodes = toIssueCodes(issues);
    status = "invalid";
  } else {
    format = getBrazilianPlateFormat(normalization.normalizedPlate);

    if (format === "unknown") {
      addIssue(issues, { code: getPatternIssue(normalization.normalizedPlate, mode) });
      issueCodes = toIssueCodes(issues);
      status = "invalid";
    } else if (format === "mercosul") {
      if (mode === "antiga") {
        addIssue(issues, { code: "modeMismatchAntiga" });
        status = "attention";
      } else {
        status = "validMercosul";
      }

      formattedPlate = formatBrazilianPlate(normalization.normalizedPlate, format);
      conversion = convertMercosulToOldPlate(normalization.normalizedPlate);

      if (!conversion) {
        addIssue(issues, { code: "oldEquivalentUnavailable" });
      }
    } else {
      if (mode === "mercosul") {
        addIssue(issues, { code: "modeMismatchMercosul" });
        status = "attention";
      } else {
        status = "validAntiga";
      }

      formattedPlate = formatBrazilianPlate(normalization.normalizedPlate, format);
      conversion = convertOldPlateToMercosul(normalization.normalizedPlate);
    }
  }

  issueCodes = toIssueCodes(issues);

  return {
    ...normalization,
    status,
    mode,
    format,
    formattedPlate,
    conversion,
    issues,
    issueCodes,
    diagnostics: buildDiagnostics(issueCodes, status, format),
  };
}

export function readBrazilianPlateValidatorStateFromParams(params: URLSearchParams): BrazilianPlateValidatorState {
  return {
    placa: defaultBrazilianPlateValidatorState.placa,
    modo: normalizeBrazilianPlateMode(params.get("modo")),
  };
}

export function buildBrazilianPlateValidatorSearchParams(
  state: BrazilianPlateValidatorState
): BrazilianPlateValidatorSearchParamsResult {
  const params = new URLSearchParams();
  const modo = normalizeBrazilianPlateMode(state.modo);

  if (modo !== defaultBrazilianPlateValidatorState.modo) {
    params.set("modo", modo);
  }

  return {
    params,
    queryLength: params.toString().length,
  };
}

export function readBrazilianPlateContentFromFragment(
  fragment: string,
  options: { maxFragmentLength?: number } = {}
): BrazilianPlateContentFragmentState {
  const normalizedFragment = fragment.startsWith("#") ? fragment.slice(1) : fragment;
  const params = new URLSearchParams(normalizedFragment);
  const hasExplicitContent = params.get("conteudo") === "1";
  const maxFragmentLength = options.maxFragmentLength ?? BRAZILIAN_PLATE_SHARE_FRAGMENT_LIMIT;

  return {
    hasExplicitContent,
    placa:
      hasExplicitContent && normalizedFragment.length <= maxFragmentLength
        ? (params.get("placa") ?? defaultBrazilianPlateValidatorState.placa)
        : defaultBrazilianPlateValidatorState.placa,
  };
}

export function buildBrazilianPlateContentFragmentParams(
  state: BrazilianPlateValidatorState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): BrazilianPlateContentFragmentResult {
  const params = new URLSearchParams();
  const maxFragmentLength = options.maxFragmentLength ?? BRAZILIAN_PLATE_SHARE_FRAGMENT_LIMIT;

  if (!options.includeContent) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: 0,
    };
  }

  params.set("conteudo", "1");

  if (state.placa.length === 0) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: params.toString().length,
    };
  }

  params.set("placa", state.placa);

  if (params.toString().length <= maxFragmentLength) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: params.toString().length,
    };
  }

  params.delete("placa");

  return {
    params,
    contentOmitted: true,
    fragmentLength: params.toString().length,
  };
}

export function buildBrazilianPlateValidatorShareUrl(
  baseUrl: string,
  state: BrazilianPlateValidatorState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): BrazilianPlateShareUrlResult {
  const searchResult = buildBrazilianPlateValidatorSearchParams(state);
  const fragmentResult = buildBrazilianPlateContentFragmentParams(state, options);
  const baseWithoutFragment = baseUrl.split("#")[0] ?? "";
  const baseWithoutQuery = baseWithoutFragment.split("?")[0] ?? "";
  const query = searchResult.params.toString();
  const fragment = fragmentResult.params.toString();

  return {
    url: `${baseWithoutQuery}${query ? `?${query}` : ""}${fragment ? `#${fragment}` : ""}`,
    searchParams: searchResult.params,
    fragmentParams: fragmentResult.params,
    contentOmitted: fragmentResult.contentOmitted,
  };
}

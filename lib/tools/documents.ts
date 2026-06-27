export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export type CpfCnpjFormatterType = "auto" | "cpf" | "cnpj";
export type CpfCnpjFormatterOutputMode = "mascara" | "limpar";
export type CpfCnpjFormatterDocumentType = Exclude<CpfCnpjFormatterType, "auto">;
export type CpfCnpjFormatterStatus = "empty" | "incomplete" | "complete" | "attention";
export type CpfCnpjFormatterIssueCode =
  | "unsupportedCharacters"
  | "extraCharacters"
  | "cpfLetters"
  | "cnpjCheckDigitLetters";

export interface CpfCnpjFormatterIssue {
  code: CpfCnpjFormatterIssueCode;
  characters?: string;
  value?: string;
  count?: number;
}

export interface CpfCnpjFormatterState {
  entrada: string;
  tipo: CpfCnpjFormatterType;
  saida: CpfCnpjFormatterOutputMode;
}

export interface CpfCnpjFormatterResult {
  status: CpfCnpjFormatterStatus;
  input: string;
  trimmedInput: string;
  selectedType: CpfCnpjFormatterDocumentType | null;
  requestedType: CpfCnpjFormatterType;
  rawValue: string;
  maskedValue: string;
  normalizedValue: string;
  extraValue: string;
  normalizedLength: number;
  usedLength: number;
  requiredLength: number | null;
  issues: CpfCnpjFormatterIssue[];
}

export interface CpfCnpjFormatterSearchParamsResult {
  params: URLSearchParams;
  queryLength: number;
}

export interface CpfCnpjFormatterContentFragmentResult {
  params: URLSearchParams;
  contentOmitted: boolean;
  fragmentLength: number;
}

export interface CpfCnpjFormatterContentFragmentState {
  hasExplicitContent: boolean;
  entrada: string;
  contentOmitted: boolean;
}

export interface CpfCnpjFormatterContentFragmentReadOptions {
  maxFragmentLength?: number;
  requestedType?: CpfCnpjFormatterType | null;
}

export interface CpfCnpjFormatterShareUrlResult {
  url: string;
  searchParams: URLSearchParams;
  fragmentParams: URLSearchParams;
  contentOmitted: boolean;
}

export const CPF_CNPJ_FORMATTER_SHARE_FRAGMENT_LIMIT = 512;

export const defaultCpfCnpjFormatterState: CpfCnpjFormatterState = {
  entrada: "",
  tipo: "auto",
  saida: "mascara",
};

const cpfCnpjFormatterTypes = new Set<CpfCnpjFormatterType>(["auto", "cpf", "cnpj"]);
const cpfCnpjFormatterOutputModes = new Set<CpfCnpjFormatterOutputMode>(["mascara", "limpar"]);
const commonDocumentSeparatorPattern = /[.\-\/\s]/u;

function hasRepeatedDigits(value: string): boolean {
  return /^(\d)\1+$/.test(value);
}

function trimAsciiWhitespace(value: string): string {
  return value.replace(/^[\u0009-\u000d ]+|[\u0009-\u000d ]+$/g, "");
}

function isAsciiLetter(value: string): boolean {
  return /^[A-Za-z]$/.test(value);
}

function isDigit(value: string): boolean {
  return /^\d$/.test(value);
}

function uniqueCharacters(characters: string[]) {
  return Array.from(new Set(characters)).join("");
}

function addFormatterIssue(issues: CpfCnpjFormatterIssue[], issue: CpfCnpjFormatterIssue) {
  const existingIssue = issues.find((item) => item.code === issue.code);

  if (!existingIssue) {
    issues.push(issue);
    return;
  }

  existingIssue.characters = issue.characters ?? existingIssue.characters;
  existingIssue.value = issue.value ?? existingIssue.value;
  existingIssue.count = issue.count ?? existingIssue.count;
}

function normalizeDocumentInput(input: string) {
  const trimmedInput = trimAsciiWhitespace(input);
  const normalizedCharacters: string[] = [];
  const unsupportedCharacters: string[] = [];

  for (const character of Array.from(trimmedInput)) {
    if (commonDocumentSeparatorPattern.test(character)) continue;

    if (isDigit(character)) {
      normalizedCharacters.push(character);
      continue;
    }

    if (isAsciiLetter(character)) {
      normalizedCharacters.push(character.toUpperCase());
      continue;
    }

    unsupportedCharacters.push(character);
  }

  return {
    trimmedInput,
    normalizedCharacters,
    unsupportedCharacters,
  };
}

export function normalizeCpfCnpjFormatterType(value: string | null | undefined): CpfCnpjFormatterType {
  return value && cpfCnpjFormatterTypes.has(value as CpfCnpjFormatterType)
    ? (value as CpfCnpjFormatterType)
    : defaultCpfCnpjFormatterState.tipo;
}

export function normalizeCpfCnpjFormatterOutputMode(
  value: string | null | undefined
): CpfCnpjFormatterOutputMode {
  return value && cpfCnpjFormatterOutputModes.has(value as CpfCnpjFormatterOutputMode)
    ? (value as CpfCnpjFormatterOutputMode)
    : defaultCpfCnpjFormatterState.saida;
}

export function detectCpfCnpjType(normalizedValue: string): CpfCnpjFormatterDocumentType | null {
  if (normalizedValue.length === 0) return null;

  return /[A-Z]/.test(normalizedValue) || normalizedValue.length > 11 ? "cnpj" : "cpf";
}

function applyGroupedMask(value: string, groupSizes: number[], separators: string[]) {
  let cursor = 0;
  const groups: string[] = [];

  for (const groupSize of groupSizes) {
    if (cursor >= value.length) break;
    groups.push(value.slice(cursor, cursor + groupSize));
    cursor += groupSize;
  }

  return groups.reduce((maskedValue, group, index) => {
    if (index === 0) return group;
    return `${maskedValue}${separators[index - 1]}${group}`;
  }, "");
}

export function formatCnpjAlphanumeric(value: string): string {
  return applyGroupedMask(value.replace(/[^0-9A-Za-z]/g, "").toUpperCase().slice(0, 14), [2, 3, 3, 4, 2], [
    ".",
    ".",
    "/",
    "-",
  ]);
}

export function formatCpfCnpjInput(
  input: string,
  requestedType: CpfCnpjFormatterType = defaultCpfCnpjFormatterState.tipo
): CpfCnpjFormatterResult {
  const type = normalizeCpfCnpjFormatterType(requestedType);
  const { trimmedInput, normalizedCharacters, unsupportedCharacters } = normalizeDocumentInput(input);
  const normalizedValue = normalizedCharacters.join("");
  const selectedType = type === "auto" ? detectCpfCnpjType(normalizedValue) : type;
  const issues: CpfCnpjFormatterIssue[] = [];

  if (unsupportedCharacters.length > 0) {
    addFormatterIssue(issues, {
      code: "unsupportedCharacters",
      characters: uniqueCharacters(unsupportedCharacters),
      count: unsupportedCharacters.length,
    });
  }

  if (!selectedType) {
    return {
      status: issues.length > 0 ? "attention" : "empty",
      input,
      trimmedInput,
      selectedType,
      requestedType: type,
      rawValue: "",
      maskedValue: "",
      normalizedValue,
      extraValue: "",
      normalizedLength: normalizedValue.length,
      usedLength: 0,
      requiredLength: null,
      issues,
    };
  }

  if (selectedType === "cpf") {
    const letters = normalizedCharacters.filter((character) => isAsciiLetter(character));
    const digits = normalizedCharacters.filter((character) => isDigit(character)).join("");
    const rawValue = digits.slice(0, 11);
    const extraValue = digits.slice(11);

    if (letters.length > 0) {
      addFormatterIssue(issues, {
        code: "cpfLetters",
        characters: uniqueCharacters(letters),
        count: letters.length,
      });
    }

    if (extraValue.length > 0) {
      addFormatterIssue(issues, {
        code: "extraCharacters",
        value: extraValue,
        count: extraValue.length,
      });
    }

    return {
      status:
        issues.length > 0 ? "attention" : rawValue.length === 0 ? "empty" : rawValue.length < 11 ? "incomplete" : "complete",
      input,
      trimmedInput,
      selectedType,
      requestedType: type,
      rawValue,
      maskedValue: applyGroupedMask(rawValue, [3, 3, 3, 2], [".", ".", "-"]),
      normalizedValue: digits,
      extraValue,
      normalizedLength: digits.length,
      usedLength: rawValue.length,
      requiredLength: 11,
      issues,
    };
  }

  const rawValue = normalizedValue.slice(0, 14);
  const extraValue = normalizedValue.slice(14);
  const checkDigitLetters = Array.from(rawValue.slice(12, 14)).filter((character) => isAsciiLetter(character));

  if (checkDigitLetters.length > 0) {
    addFormatterIssue(issues, {
      code: "cnpjCheckDigitLetters",
      characters: uniqueCharacters(checkDigitLetters),
      count: checkDigitLetters.length,
    });
  }

  if (extraValue.length > 0) {
    addFormatterIssue(issues, {
      code: "extraCharacters",
      value: extraValue,
      count: extraValue.length,
    });
  }

  return {
    status:
      issues.length > 0 ? "attention" : rawValue.length === 0 ? "empty" : rawValue.length < 14 ? "incomplete" : "complete",
    input,
    trimmedInput,
    selectedType,
    requestedType: type,
    rawValue,
    maskedValue: formatCnpjAlphanumeric(rawValue),
    normalizedValue,
    extraValue,
    normalizedLength: normalizedValue.length,
    usedLength: rawValue.length,
    requiredLength: 14,
    issues,
  };
}

export function sanitizeCpfCnpjFormatterSharedInput(
  input: string,
  requestedType: CpfCnpjFormatterType = defaultCpfCnpjFormatterState.tipo
): string {
  const type = normalizeCpfCnpjFormatterType(requestedType);

  if (type === "auto") {
    const result = formatCpfCnpjInput(input, "auto");

    if (!result.selectedType || result.issues.length > 0) {
      return defaultCpfCnpjFormatterState.entrada;
    }

    if (result.selectedType === "cpf") {
      return result.rawValue;
    }

    return result.status === "complete" && result.normalizedLength === 14
      ? result.rawValue
      : defaultCpfCnpjFormatterState.entrada;
  }

  const { normalizedCharacters } = normalizeDocumentInput(input);

  if (type === "cpf") {
    return normalizedCharacters.filter((character) => isDigit(character)).join("").slice(0, 11);
  }

  const body = normalizedCharacters.slice(0, 12).join("");
  const checkDigits = normalizedCharacters.slice(12).filter((character) => isDigit(character)).join("").slice(0, 2);

  return `${body}${checkDigits}`;
}

export function readCpfCnpjFormatterStateFromParams(params: URLSearchParams): CpfCnpjFormatterState {
  return {
    entrada: defaultCpfCnpjFormatterState.entrada,
    tipo: normalizeCpfCnpjFormatterType(params.get("tipo")),
    saida: normalizeCpfCnpjFormatterOutputMode(params.get("saida")),
  };
}

export function readCpfCnpjFormatterContentFromFragment(
  fragment: string,
  options: CpfCnpjFormatterContentFragmentReadOptions = {}
): CpfCnpjFormatterContentFragmentState {
  const normalizedFragment = fragment.startsWith("#") ? fragment.slice(1) : fragment;
  const maxFragmentLength = options.maxFragmentLength ?? CPF_CNPJ_FORMATTER_SHARE_FRAGMENT_LIMIT;
  const params = new URLSearchParams(normalizedFragment);
  const hasExplicitContent = params.get("conteudo") === "1";

  if (!hasExplicitContent) {
    return {
      hasExplicitContent: false,
      entrada: defaultCpfCnpjFormatterState.entrada,
      contentOmitted: false,
    };
  }

  if (normalizedFragment.length > maxFragmentLength) {
    return {
      hasExplicitContent: true,
      entrada: defaultCpfCnpjFormatterState.entrada,
      contentOmitted: true,
    };
  }

  return {
    hasExplicitContent: true,
    entrada: sanitizeCpfCnpjFormatterSharedInput(
      params.get("entrada") ?? defaultCpfCnpjFormatterState.entrada,
      options.requestedType ?? defaultCpfCnpjFormatterState.tipo
    ),
    contentOmitted: false,
  };
}

export function buildCpfCnpjFormatterSearchParams(
  state: CpfCnpjFormatterState
): CpfCnpjFormatterSearchParamsResult {
  const params = new URLSearchParams();

  params.set("tipo", normalizeCpfCnpjFormatterType(state.tipo));
  params.set("saida", normalizeCpfCnpjFormatterOutputMode(state.saida));

  return {
    params,
    queryLength: params.toString().length,
  };
}

export function buildCpfCnpjFormatterContentFragmentParams(
  state: CpfCnpjFormatterState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): CpfCnpjFormatterContentFragmentResult {
  const params = new URLSearchParams();
  const maxFragmentLength = options.maxFragmentLength ?? CPF_CNPJ_FORMATTER_SHARE_FRAGMENT_LIMIT;

  if (!options.includeContent) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: 0,
    };
  }

  params.set("conteudo", "1");

  const entrada = sanitizeCpfCnpjFormatterSharedInput(state.entrada, state.tipo);

  if (entrada.length === 0) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: params.toString().length,
    };
  }

  params.set("entrada", entrada);

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

export function buildCpfCnpjFormatterShareUrl(
  baseUrl: string,
  state: CpfCnpjFormatterState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): CpfCnpjFormatterShareUrlResult {
  const searchResult = buildCpfCnpjFormatterSearchParams(state);
  const fragmentResult = buildCpfCnpjFormatterContentFragmentParams(state, options);
  const query = searchResult.params.toString();
  const fragment = fragmentResult.params.toString();

  return {
    url: `${baseUrl}${query ? `?${query}` : ""}${fragment ? `#${fragment}` : ""}`,
    searchParams: searchResult.params,
    fragmentParams: fragmentResult.params,
    contentOmitted: fragmentResult.contentOmitted,
  };
}

export function formatCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function validateCpf(value: string): boolean {
  const digits = onlyDigits(value);

  if (digits.length !== 11 || hasRepeatedDigits(digits)) {
    return false;
  }

  const numbers = digits.split("").map(Number);

  const firstSum = numbers.slice(0, 9).reduce((sum, digit, index) => sum + digit * (10 - index), 0);
  const firstCheck = firstSum % 11 < 2 ? 0 : 11 - (firstSum % 11);

  if (numbers[9] !== firstCheck) {
    return false;
  }

  const secondSum = numbers.slice(0, 10).reduce((sum, digit, index) => sum + digit * (11 - index), 0);
  const secondCheck = secondSum % 11 < 2 ? 0 : 11 - (secondSum % 11);

  return numbers[10] === secondCheck;
}

export function formatCnpj(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function validateCnpj(value: string): boolean {
  const digits = onlyDigits(value);

  if (digits.length !== 14 || hasRepeatedDigits(digits)) {
    return false;
  }

  const numbers = digits.split("").map(Number);
  const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const secondWeights = [6, ...firstWeights];

  const firstSum = firstWeights.reduce((sum, weight, index) => sum + numbers[index] * weight, 0);
  const firstRemainder = firstSum % 11;
  const firstCheck = firstRemainder < 2 ? 0 : 11 - firstRemainder;

  if (numbers[12] !== firstCheck) {
    return false;
  }

  const secondSum = secondWeights.reduce((sum, weight, index) => sum + numbers[index] * weight, 0);
  const secondRemainder = secondSum % 11;
  const secondCheck = secondRemainder < 2 ? 0 : 11 - secondRemainder;

  return numbers[13] === secondCheck;
}

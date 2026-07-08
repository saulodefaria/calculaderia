export type PisPasepValidationStatus =
  | "empty"
  | "incomplete"
  | "invalidFormat"
  | "invalidChecksum"
  | "validChecksum";

export type PisPasepDiagnosticStatus = "pass" | "fail" | "warn" | "info";

export type PisPasepDiagnosticId = "input" | "characters" | "length" | "repeated" | "checkDigit" | "scope" | "privacy";

export type PisPasepValidationIssueCode =
  | "empty"
  | "trimmedWhitespace"
  | "unsupportedCharacters"
  | "incompleteLength"
  | "tooLong"
  | "repeatedDigits"
  | "checksumUnavailable"
  | "invalidChecksum"
  | "validChecksum"
  | "syntaxOnly"
  | "localOnly";

export interface PisPasepIssue {
  code: PisPasepValidationIssueCode;
  characters?: string;
  count?: number;
}

export interface PisPasepDiagnostic {
  id: PisPasepDiagnosticId;
  status: PisPasepDiagnosticStatus;
  issueCodes: PisPasepValidationIssueCode[];
}

export interface PisPasepNormalizationResult {
  input: string;
  trimmedInput: string;
  digits: string;
  digitCount: number;
  ignoredSeparatorCount: number;
  unsupportedCharacters: string[];
  unsupportedCharacterCount: number;
}

export interface PisPasepValidatorState {
  pis: string;
}

export interface PisPasepValidationResult extends PisPasepNormalizationResult {
  status: PisPasepValidationStatus;
  issues: PisPasepIssue[];
  issueCodes: PisPasepValidationIssueCode[];
  diagnostics: PisPasepDiagnostic[];
  normalizedValue: string | null;
  formattedValue: string | null;
  providedCheckDigit: string | null;
  expectedCheckDigit: string | null;
  checksumValid: boolean | null;
}

export interface PisPasepValidatorSearchParamsResult {
  params: URLSearchParams;
  queryLength: number;
}

export interface PisPasepValidatorContentFragmentResult {
  params: URLSearchParams;
  contentOmitted: boolean;
  fragmentLength: number;
}

export interface PisPasepValidatorContentFragmentState {
  hasExplicitContent: boolean;
  pis: string;
  contentOmitted: boolean;
}

export interface PisPasepValidatorShareUrlResult {
  url: string;
  searchParams: URLSearchParams;
  fragmentParams: URLSearchParams;
  contentOmitted: boolean;
}

export const PIS_PASEP_DIGIT_COUNT = 11;
export const PIS_PASEP_SHARE_FRAGMENT_LIMIT = 128;
export const PIS_PASEP_CHECK_DIGIT_WEIGHTS = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;

export const defaultPisPasepValidatorState: PisPasepValidatorState = {
  pis: "",
};

const separatorCharacters = new Set([".", "-", "/", " ", "\t", "\n", "\r", "\f", "\v"]);

function trimAsciiWhitespace(value: string): string {
  return value.replace(/^[\u0009-\u000d ]+|[\u0009-\u000d ]+$/g, "");
}

function isAsciiDigit(character: string): boolean {
  return character >= "0" && character <= "9";
}

function uniqueCharacters(characters: string[]) {
  return Array.from(new Set(characters)).join("");
}

function addIssue(issues: PisPasepIssue[], issue: PisPasepIssue) {
  const existingIssue = issues.find((item) => item.code === issue.code);

  if (!existingIssue) {
    issues.push(issue);
    return;
  }

  existingIssue.characters = issue.characters ?? existingIssue.characters;
  existingIssue.count = issue.count ?? existingIssue.count;
}

function getIssueCodes(issues: PisPasepIssue[], codes: PisPasepValidationIssueCode[]) {
  const issueCodeSet = new Set(issues.map((issue) => issue.code));
  return codes.filter((code) => issueCodeSet.has(code));
}

function hasAnyIssue(issues: PisPasepIssue[], codes: PisPasepValidationIssueCode[]) {
  return codes.some((code) => issues.some((issue) => issue.code === code));
}

function hasRepeatedDigits(value: string): boolean {
  return /^([0-9])\1+$/.test(value);
}

function assertBase10Digits(value: string) {
  if (!/^[0-9]{10}$/.test(value)) {
    throw new Error("base10 must contain exactly 10 ASCII digits.");
  }
}

export function normalizePisPasepInput(input: string): PisPasepNormalizationResult {
  const trimmedInput = trimAsciiWhitespace(input);
  const digits: string[] = [];
  const unsupportedCharacters: string[] = [];
  let ignoredSeparatorCount = 0;

  for (const character of Array.from(trimmedInput)) {
    if (isAsciiDigit(character)) {
      digits.push(character);
      continue;
    }

    if (separatorCharacters.has(character)) {
      ignoredSeparatorCount += 1;
      continue;
    }

    unsupportedCharacters.push(character);
  }

  const normalizedDigits = digits.join("");

  return {
    input,
    trimmedInput,
    digits: normalizedDigits,
    digitCount: normalizedDigits.length,
    ignoredSeparatorCount,
    unsupportedCharacters,
    unsupportedCharacterCount: unsupportedCharacters.length,
  };
}

export function calculatePisPasepCheckDigit(base10: string): number {
  assertBase10Digits(base10);

  const sum = PIS_PASEP_CHECK_DIGIT_WEIGHTS.reduce((total, weight, index) => total + Number(base10[index]) * weight, 0);
  const candidate = 11 - (sum % 11);

  return candidate === 10 || candidate === 11 ? 0 : candidate;
}

export function validatePisPasepChecksum(
  fullDigits: string
): { expectedCheckDigit: string; providedCheckDigit: string; valid: boolean } | null {
  if (!/^[0-9]{11}$/.test(fullDigits)) {
    return null;
  }

  const providedCheckDigit = fullDigits.slice(-1);
  const expectedCheckDigit = String(calculatePisPasepCheckDigit(fullDigits.slice(0, 10)));

  return {
    expectedCheckDigit,
    providedCheckDigit,
    valid: providedCheckDigit === expectedCheckDigit,
  };
}

export function formatPisPasep(value: string): string {
  const digits = normalizePisPasepInput(value).digits.slice(0, PIS_PASEP_DIGIT_COUNT);
  const groups = [digits.slice(0, 3), digits.slice(3, 8), digits.slice(8, 10), digits.slice(10, 11)].filter(Boolean);

  if (groups.length <= 1) return groups[0] ?? "";
  if (groups.length === 2) return `${groups[0]}.${groups[1]}`;
  if (groups.length === 3) return `${groups[0]}.${groups[1]}.${groups[2]}`;

  return `${groups[0]}.${groups[1]}.${groups[2]}-${groups[3]}`;
}

function buildDiagnostics(issues: PisPasepIssue[], status: PisPasepValidationStatus): PisPasepDiagnostic[] {
  return [
    {
      id: "input",
      status: status === "empty" ? "info" : hasAnyIssue(issues, ["trimmedWhitespace"]) ? "warn" : "pass",
      issueCodes: status === "empty" ? ["empty"] : getIssueCodes(issues, ["trimmedWhitespace"]),
    },
    {
      id: "characters",
      status: hasAnyIssue(issues, ["unsupportedCharacters"]) ? "fail" : "pass",
      issueCodes: getIssueCodes(issues, ["unsupportedCharacters"]),
    },
    {
      id: "length",
      status: hasAnyIssue(issues, ["tooLong"])
        ? "fail"
        : hasAnyIssue(issues, ["incompleteLength"])
          ? "warn"
          : status === "empty"
            ? "info"
            : "pass",
      issueCodes: status === "empty" ? ["empty"] : getIssueCodes(issues, ["tooLong", "incompleteLength"]),
    },
    {
      id: "repeated",
      status: hasAnyIssue(issues, ["repeatedDigits"]) ? "fail" : status === "empty" || status === "incomplete" ? "info" : "pass",
      issueCodes: getIssueCodes(issues, ["repeatedDigits"]),
    },
    {
      id: "checkDigit",
      status: hasAnyIssue(issues, ["invalidChecksum"])
        ? "fail"
        : hasAnyIssue(issues, ["validChecksum"])
          ? "pass"
          : "info",
      issueCodes: getIssueCodes(issues, ["invalidChecksum", "validChecksum", "checksumUnavailable"]),
    },
    {
      id: "scope",
      status: "info",
      issueCodes: ["syntaxOnly"],
    },
    {
      id: "privacy",
      status: "info",
      issueCodes: ["localOnly"],
    },
  ];
}

export function validatePisPasepNumber(input: string): PisPasepValidationResult {
  const normalization = normalizePisPasepInput(input);
  const issues: PisPasepIssue[] = [];

  if (normalization.input !== normalization.trimmedInput) {
    addIssue(issues, { code: "trimmedWhitespace" });
  }

  if (normalization.unsupportedCharacterCount > 0) {
    addIssue(issues, {
      code: "unsupportedCharacters",
      characters: uniqueCharacters(normalization.unsupportedCharacters),
      count: normalization.unsupportedCharacterCount,
    });
  }

  if (normalization.digitCount === 0) {
    addIssue(issues, { code: "empty" });
  } else if (normalization.digitCount < PIS_PASEP_DIGIT_COUNT) {
    addIssue(issues, { code: "incompleteLength" });
  } else if (normalization.digitCount > PIS_PASEP_DIGIT_COUNT) {
    addIssue(issues, { code: "tooLong" });
  }

  if (normalization.digitCount === PIS_PASEP_DIGIT_COUNT && hasRepeatedDigits(normalization.digits)) {
    addIssue(issues, { code: "repeatedDigits" });
  }

  const canRunChecksum =
    normalization.digitCount === PIS_PASEP_DIGIT_COUNT && !hasAnyIssue(issues, ["unsupportedCharacters", "repeatedDigits"]);
  const checksumResult = canRunChecksum ? validatePisPasepChecksum(normalization.digits) : null;

  let status: PisPasepValidationStatus = "empty";
  if (normalization.digitCount === 0) {
    status = "empty";
  } else if (hasAnyIssue(issues, ["unsupportedCharacters", "tooLong", "repeatedDigits"])) {
    status = "invalidFormat";
  } else if (hasAnyIssue(issues, ["incompleteLength"])) {
    status = "incomplete";
  } else if (checksumResult?.valid) {
    status = "validChecksum";
  } else {
    status = "invalidChecksum";
  }

  if (normalization.digitCount > 0 && status !== "validChecksum" && status !== "invalidChecksum") {
    addIssue(issues, { code: "checksumUnavailable" });
  }

  if (status === "validChecksum") {
    addIssue(issues, { code: "validChecksum" });
  } else if (status === "invalidChecksum") {
    addIssue(issues, { code: "invalidChecksum" });
  }

  const issueCodes = issues.map((issue) => issue.code);
  const readableValue =
    normalization.digitCount > 0 &&
    normalization.digitCount <= PIS_PASEP_DIGIT_COUNT &&
    !hasAnyIssue(issues, ["unsupportedCharacters"])
      ? normalization.digits
      : null;

  return {
    ...normalization,
    status,
    issues,
    issueCodes,
    diagnostics: buildDiagnostics(issues, status),
    normalizedValue: readableValue,
    formattedValue: readableValue ? formatPisPasep(readableValue) : null,
    providedCheckDigit:
      normalization.digitCount === PIS_PASEP_DIGIT_COUNT ? normalization.digits.slice(-1) : null,
    expectedCheckDigit: checksumResult?.expectedCheckDigit ?? null,
    checksumValid: checksumResult?.valid ?? null,
  };
}

export function sanitizePisPasepSharedInput(input: string): string {
  const normalization = normalizePisPasepInput(input);

  if (normalization.unsupportedCharacterCount > 0 || normalization.digitCount > PIS_PASEP_DIGIT_COUNT) {
    return defaultPisPasepValidatorState.pis;
  }

  return normalization.digits;
}

export function readPisPasepValidatorSearchParams(_params: URLSearchParams): PisPasepValidatorState {
  void _params;

  return defaultPisPasepValidatorState;
}

export function readPisPasepValidatorContentFromFragment(
  fragment: string,
  options: { maxFragmentLength?: number } = {}
): PisPasepValidatorContentFragmentState {
  const normalizedFragment = fragment.startsWith("#") ? fragment.slice(1) : fragment;
  const maxFragmentLength = options.maxFragmentLength ?? PIS_PASEP_SHARE_FRAGMENT_LIMIT;
  const params = new URLSearchParams(normalizedFragment);
  const hasExplicitContent = params.get("conteudo") === "1";

  if (!hasExplicitContent) {
    return {
      hasExplicitContent: false,
      pis: defaultPisPasepValidatorState.pis,
      contentOmitted: false,
    };
  }

  if (normalizedFragment.length > maxFragmentLength) {
    return {
      hasExplicitContent: true,
      pis: defaultPisPasepValidatorState.pis,
      contentOmitted: true,
    };
  }

  return {
    hasExplicitContent: true,
    pis: sanitizePisPasepSharedInput(params.get("pis") ?? defaultPisPasepValidatorState.pis),
    contentOmitted: false,
  };
}

export function buildPisPasepValidatorSearchParams(
  _state: PisPasepValidatorState
): PisPasepValidatorSearchParamsResult {
  void _state;

  const params = new URLSearchParams();

  return {
    params,
    queryLength: params.toString().length,
  };
}

export function buildPisPasepValidatorContentFragmentParams(
  state: PisPasepValidatorState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): PisPasepValidatorContentFragmentResult {
  const params = new URLSearchParams();
  const maxFragmentLength = options.maxFragmentLength ?? PIS_PASEP_SHARE_FRAGMENT_LIMIT;

  if (!options.includeContent) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: 0,
    };
  }

  params.set("conteudo", "1");

  const pis = sanitizePisPasepSharedInput(state.pis);
  if (pis.length > 0) {
    params.set("pis", pis);
  } else if (state.pis.trim().length > 0) {
    return {
      params,
      contentOmitted: true,
      fragmentLength: params.toString().length,
    };
  }

  if (params.toString().length <= maxFragmentLength) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: params.toString().length,
    };
  }

  params.delete("pis");

  return {
    params,
    contentOmitted: true,
    fragmentLength: params.toString().length,
  };
}

export function buildPisPasepValidatorShareUrl(
  baseUrl: string,
  state: PisPasepValidatorState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): PisPasepValidatorShareUrlResult {
  const searchResult = buildPisPasepValidatorSearchParams(state);
  const fragmentResult = buildPisPasepValidatorContentFragmentParams(state, options);
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

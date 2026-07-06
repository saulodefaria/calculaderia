export const CEP_REQUIRED_DIGITS = 8;
export const CEP_VALIDATOR_SHARE_FRAGMENT_LIMIT = 128;

export const cepOutputModes = ["formatado", "digitos"] as const;

export type CepOutputMode = (typeof cepOutputModes)[number];
export type CepValidationStatus = "empty" | "incomplete" | "validFormat" | "invalid" | "attention";
export type CepDiagnosticStatus = "pass" | "fail" | "warn" | "info";
export type CepDiagnosticId = "input" | "digits" | "separator" | "format" | "scope";
export type CepValidationIssueCode =
  | "empty"
  | "trimmedWhitespace"
  | "prefixRemoved"
  | "tooFewDigits"
  | "extraDigits"
  | "misplacedHyphen"
  | "multipleHyphens"
  | "embeddedWhitespace"
  | "unsupportedCharacters"
  | "syntaxOnly";

export interface CepValidationIssue {
  code: CepValidationIssueCode;
  characters?: string;
  value?: string;
  count?: number;
}

export interface CepDiagnostic {
  id: CepDiagnosticId;
  status: CepDiagnosticStatus;
  issueCodes: CepValidationIssueCode[];
}

export interface CepValidationResult {
  status: CepValidationStatus;
  input: string;
  trimmedInput: string;
  processedInput: string;
  rawDigits: string;
  allDigits: string;
  formattedCep: string;
  outputValue: string;
  extraDigits: string;
  digitCount: number;
  requiredDigits: number;
  issues: CepValidationIssue[];
  diagnostics: CepDiagnostic[];
}

export interface CepValidatorState {
  cep: string;
  saida: CepOutputMode;
}

export interface CepValidatorSearchParamsResult {
  params: URLSearchParams;
  queryLength: number;
}

export interface CepValidatorContentFragmentResult {
  params: URLSearchParams;
  contentOmitted: boolean;
  fragmentLength: number;
}

export interface CepValidatorContentFragmentState {
  hasExplicitContent: boolean;
  cep: string;
  contentOmitted: boolean;
}

export interface CepValidatorShareUrlResult {
  url: string;
  searchParams: URLSearchParams;
  fragmentParams: URLSearchParams;
  contentOmitted: boolean;
}

export const defaultCepValidatorState: CepValidatorState = {
  cep: "",
  saida: "formatado",
};

const cepOutputModeSet = new Set<CepOutputMode>(cepOutputModes);
const hardIssueCodes = new Set<CepValidationIssueCode>([
  "misplacedHyphen",
  "multipleHyphens",
  "embeddedWhitespace",
  "unsupportedCharacters",
]);
const warningIssueCodes = new Set<CepValidationIssueCode>(["trimmedWhitespace", "prefixRemoved", "extraDigits"]);

function trimAsciiWhitespace(value: string): string {
  return value.replace(/^[\u0009-\u000d ]+|[\u0009-\u000d ]+$/g, "");
}

function isDigit(character: string): boolean {
  return /^[0-9]$/.test(character);
}

function isAsciiWhitespace(character: string): boolean {
  return /^[\u0009-\u000d ]$/.test(character);
}

function uniqueCharacters(characters: string[]) {
  return Array.from(new Set(characters)).join("");
}

function addIssue(issues: CepValidationIssue[], issue: CepValidationIssue) {
  const existingIssue = issues.find((item) => item.code === issue.code);

  if (!existingIssue) {
    issues.push(issue);
    return;
  }

  existingIssue.characters = issue.characters ?? existingIssue.characters;
  existingIssue.value = issue.value ?? existingIssue.value;
  existingIssue.count = issue.count ?? existingIssue.count;
}

function hasIssue(issues: CepValidationIssue[], code: CepValidationIssueCode) {
  return issues.some((issue) => issue.code === code);
}

function hasAnyIssue(issues: CepValidationIssue[], codes: CepValidationIssueCode[]) {
  return codes.some((code) => hasIssue(issues, code));
}

function getIssueCodes(issues: CepValidationIssue[], codes: CepValidationIssueCode[]) {
  return codes.filter((code) => hasIssue(issues, code));
}

function hasHardIssue(issues: CepValidationIssue[]): boolean {
  return issues.some((issue) => hardIssueCodes.has(issue.code));
}

function hasWarningIssue(issues: CepValidationIssue[]): boolean {
  return issues.some((issue) => warningIssueCodes.has(issue.code));
}

function removeKnownCepPrefix(value: string, issues: CepValidationIssue[]): string {
  const match = value.match(/^cep(?::[\u0009-\u000d ]*|[\u0009-\u000d ]+)(.+)$/i);

  if (!match) {
    return value;
  }

  addIssue(issues, { code: "prefixRemoved" });
  return trimAsciiWhitespace(match[1] ?? "");
}

function buildDiagnostics(issues: CepValidationIssue[], status: CepValidationStatus): CepDiagnostic[] {
  const inputFailures: CepValidationIssueCode[] = ["embeddedWhitespace", "unsupportedCharacters"];
  const inputWarnings: CepValidationIssueCode[] = ["trimmedWhitespace", "prefixRemoved"];
  const digitWarnings: CepValidationIssueCode[] = ["tooFewDigits", "extraDigits"];
  const separatorFailures: CepValidationIssueCode[] = ["misplacedHyphen", "multipleHyphens"];

  return [
    {
      id: "input",
      status:
        status === "empty"
          ? "info"
          : hasAnyIssue(issues, inputFailures)
            ? "fail"
            : hasAnyIssue(issues, inputWarnings)
              ? "warn"
              : "pass",
      issueCodes: status === "empty" ? ["empty"] : getIssueCodes(issues, [...inputFailures, ...inputWarnings]),
    },
    {
      id: "digits",
      status:
        status === "empty"
          ? "info"
          : hasIssue(issues, "tooFewDigits")
            ? "warn"
            : hasIssue(issues, "extraDigits")
              ? "warn"
              : "pass",
      issueCodes: status === "empty" ? ["empty"] : getIssueCodes(issues, digitWarnings),
    },
    {
      id: "separator",
      status: hasAnyIssue(issues, separatorFailures) ? "fail" : "pass",
      issueCodes: getIssueCodes(issues, separatorFailures),
    },
    {
      id: "format",
      status: status === "invalid" ? "fail" : status === "incomplete" || status === "attention" ? "warn" : "pass",
      issueCodes: status === "empty" ? ["empty"] : getIssueCodes(issues, [...separatorFailures, ...digitWarnings]),
    },
    {
      id: "scope",
      status: "info",
      issueCodes: ["syntaxOnly"],
    },
  ];
}

export function normalizeCepOutputMode(value: string | null | undefined): CepOutputMode {
  return value && cepOutputModeSet.has(value as CepOutputMode) ? (value as CepOutputMode) : defaultCepValidatorState.saida;
}

export function formatCepDigits(digits: string): string {
  const normalizedDigits = digits.replace(/\D/g, "").slice(0, CEP_REQUIRED_DIGITS);

  if (normalizedDigits.length <= 5) {
    return normalizedDigits;
  }

  return `${normalizedDigits.slice(0, 5)}-${normalizedDigits.slice(5)}`;
}

export function validateCepFormat(
  input: string,
  outputMode: CepOutputMode = defaultCepValidatorState.saida
): CepValidationResult {
  const issues: CepValidationIssue[] = [];
  const trimmedInput = trimAsciiWhitespace(input);

  if (input !== trimmedInput) {
    addIssue(issues, { code: "trimmedWhitespace" });
  }

  const processedInput = removeKnownCepPrefix(trimmedInput, issues);
  const unsupportedCharacters: string[] = [];
  const digits: string[] = [];
  let hyphenCount = 0;
  let digitsBeforeFirstHyphen = 0;

  for (const character of Array.from(processedInput)) {
    if (isDigit(character)) {
      if (hyphenCount === 0) {
        digitsBeforeFirstHyphen += 1;
      }

      digits.push(character);
      continue;
    }

    if (character === "-") {
      hyphenCount += 1;
      continue;
    }

    if (isAsciiWhitespace(character)) {
      addIssue(issues, { code: "embeddedWhitespace" });
      continue;
    }

    unsupportedCharacters.push(character);
  }

  if (unsupportedCharacters.length > 0) {
    addIssue(issues, {
      code: "unsupportedCharacters",
      characters: uniqueCharacters(unsupportedCharacters),
      count: unsupportedCharacters.length,
    });
  }

  if (hyphenCount > 1) {
    addIssue(issues, { code: "multipleHyphens", count: hyphenCount });
  } else if (hyphenCount === 1 && digitsBeforeFirstHyphen !== 5) {
    addIssue(issues, { code: "misplacedHyphen" });
  }

  const allDigits = digits.join("");
  const rawDigits = allDigits.slice(0, CEP_REQUIRED_DIGITS);
  const extraDigits = allDigits.slice(CEP_REQUIRED_DIGITS);
  const digitCount = allDigits.length;

  if (!hasHardIssue(issues)) {
    if (digitCount > 0 && digitCount < CEP_REQUIRED_DIGITS) {
      addIssue(issues, {
        code: "tooFewDigits",
        count: CEP_REQUIRED_DIGITS - digitCount,
      });
    } else if (digitCount > CEP_REQUIRED_DIGITS) {
      addIssue(issues, {
        code: "extraDigits",
        value: extraDigits,
        count: extraDigits.length,
      });
    }
  }

  const normalizedOutputMode = normalizeCepOutputMode(outputMode);
  const formattedCep = formatCepDigits(rawDigits);
  const status: CepValidationStatus = hasHardIssue(issues)
    ? "invalid"
    : digitCount === 0
      ? "empty"
      : hasWarningIssue(issues)
        ? "attention"
        : digitCount < CEP_REQUIRED_DIGITS
          ? "incomplete"
          : "validFormat";

  return {
    status,
    input,
    trimmedInput,
    processedInput,
    rawDigits,
    allDigits,
    formattedCep,
    outputValue: normalizedOutputMode === "digitos" ? rawDigits : formattedCep,
    extraDigits,
    digitCount,
    requiredDigits: CEP_REQUIRED_DIGITS,
    issues: status === "empty" ? [{ code: "empty" }] : issues,
    diagnostics: buildDiagnostics(status === "empty" ? [{ code: "empty" }] : issues, status),
  };
}

export function readCepValidatorStateFromParams(params: URLSearchParams): CepValidatorState {
  return {
    cep: defaultCepValidatorState.cep,
    saida: normalizeCepOutputMode(params.get("saida")),
  };
}

export function buildCepValidatorSearchParams(state: CepValidatorState): CepValidatorSearchParamsResult {
  const params = new URLSearchParams();
  const outputMode = normalizeCepOutputMode(state.saida);

  if (outputMode !== defaultCepValidatorState.saida) {
    params.set("saida", outputMode);
  }

  return {
    params,
    queryLength: params.toString().length,
  };
}

export function buildCepValidatorContentFragmentParams(
  state: CepValidatorState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): CepValidatorContentFragmentResult {
  const params = new URLSearchParams();
  const maxFragmentLength = options.maxFragmentLength ?? CEP_VALIDATOR_SHARE_FRAGMENT_LIMIT;

  if (!options.includeContent) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: 0,
    };
  }

  params.set("conteudo", "1");

  if (state.cep.length === 0) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: params.toString().length,
    };
  }

  params.set("cep", state.cep);

  if (params.toString().length <= maxFragmentLength) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: params.toString().length,
    };
  }

  params.delete("cep");

  return {
    params,
    contentOmitted: true,
    fragmentLength: params.toString().length,
  };
}

export function readCepValidatorContentFromFragment(
  fragment: string,
  options: { maxFragmentLength?: number } = {}
): CepValidatorContentFragmentState {
  const normalizedFragment = fragment.startsWith("#") ? fragment.slice(1) : fragment;
  const params = new URLSearchParams(normalizedFragment);
  const hasExplicitContent = params.get("conteudo") === "1";
  const maxFragmentLength = options.maxFragmentLength ?? CEP_VALIDATOR_SHARE_FRAGMENT_LIMIT;

  if (!hasExplicitContent) {
    return {
      hasExplicitContent: false,
      cep: defaultCepValidatorState.cep,
      contentOmitted: false,
    };
  }

  if (normalizedFragment.length > maxFragmentLength) {
    return {
      hasExplicitContent: true,
      cep: defaultCepValidatorState.cep,
      contentOmitted: true,
    };
  }

  return {
    hasExplicitContent: true,
    cep: params.get("cep") ?? defaultCepValidatorState.cep,
    contentOmitted: false,
  };
}

export function buildCepValidatorShareUrl(
  baseUrl: string,
  state: CepValidatorState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): CepValidatorShareUrlResult {
  const searchResult = buildCepValidatorSearchParams(state);
  const fragmentResult = buildCepValidatorContentFragmentParams(state, options);
  const query = searchResult.params.toString();
  const fragment = fragmentResult.params.toString();

  return {
    url: `${baseUrl}${query ? `?${query}` : ""}${fragment ? `#${fragment}` : ""}`,
    searchParams: searchResult.params,
    fragmentParams: fragmentResult.params,
    contentOmitted: fragmentResult.contentOmitted,
  };
}

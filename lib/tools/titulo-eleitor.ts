export type TituloEleitorValidationStatus =
  | "empty"
  | "incomplete"
  | "attention"
  | "invalidFormat"
  | "invalidUf"
  | "invalidChecksum"
  | "validChecksum";

export type TituloEleitorDiagnosticStatus = "pass" | "fail" | "warn" | "info";

export type TituloEleitorDiagnosticId =
  | "input"
  | "characters"
  | "length"
  | "uf"
  | "firstCheckDigit"
  | "secondCheckDigit"
  | "privacy";

export type TituloEleitorValidationIssueCode =
  | "empty"
  | "trimmedWhitespace"
  | "unsupportedCharacters"
  | "incompleteLength"
  | "tooLong"
  | "leftPadded"
  | "repeatedDigits"
  | "invalidUf"
  | "checksumUnavailable"
  | "invalidChecksum"
  | "validChecksum"
  | "localOnly";

export interface TituloEleitorIssue {
  code: TituloEleitorValidationIssueCode;
  characters?: string;
  count?: number;
}

export interface TituloEleitorDiagnostic {
  id: TituloEleitorDiagnosticId;
  status: TituloEleitorDiagnosticStatus;
  issueCodes: TituloEleitorValidationIssueCode[];
}

export interface TituloEleitorNormalizationResult {
  input: string;
  trimmedInput: string;
  digits: string;
  digitCount: number;
  ignoredSeparatorCount: number;
  unsupportedCharacters: string[];
  unsupportedCharacterCount: number;
}

export interface TituloEleitorUf {
  code: string;
  name: string;
  abbreviation: string;
}

export interface TituloEleitorCheckDigits {
  first: string;
  second: string;
  firstRemainder: number;
  secondRemainder: number;
  firstSum: number;
  secondSum: number;
}

export interface TituloEleitorValidatorState {
  titulo: string;
}

export interface TituloEleitorValidationResult extends TituloEleitorNormalizationResult {
  status: TituloEleitorValidationStatus;
  issues: TituloEleitorIssue[];
  issueCodes: TituloEleitorValidationIssueCode[];
  diagnostics: TituloEleitorDiagnostic[];
  canonicalDigits: string | null;
  formattedNumber: string;
  maskedNumber: string;
  sequenceDigits: string | null;
  ufCode: string | null;
  uf: TituloEleitorUf | null;
  providedCheckDigits: string | null;
  expectedCheckDigits: string | null;
  firstCheckDigit: string | null;
  secondCheckDigit: string | null;
  leftPadded: boolean;
  checksumValid: boolean | null;
  checkDigits: TituloEleitorCheckDigits | null;
}

export interface TituloEleitorSearchParamsResult {
  params: URLSearchParams;
  queryLength: number;
}

export interface TituloEleitorContentFragmentResult {
  params: URLSearchParams;
  contentOmitted: boolean;
  fragmentLength: number;
}

export interface TituloEleitorContentFragmentState {
  hasExplicitContent: boolean;
  titulo: string;
  contentOmitted: boolean;
}

export interface TituloEleitorShareUrlResult {
  url: string;
  searchParams: URLSearchParams;
  fragmentParams: URLSearchParams;
  contentOmitted: boolean;
}

export const TITULO_ELEITOR_LENGTH = 12;
export const TITULO_ELEITOR_SHARE_FRAGMENT_LIMIT = 256;

export const defaultTituloEleitorValidatorState: TituloEleitorValidatorState = {
  titulo: "",
};

export const tituloEleitorUfTable: TituloEleitorUf[] = [
  { code: "01", name: "Sao Paulo", abbreviation: "SP" },
  { code: "02", name: "Minas Gerais", abbreviation: "MG" },
  { code: "03", name: "Rio de Janeiro", abbreviation: "RJ" },
  { code: "04", name: "Rio Grande do Sul", abbreviation: "RS" },
  { code: "05", name: "Bahia", abbreviation: "BA" },
  { code: "06", name: "Parana", abbreviation: "PR" },
  { code: "07", name: "Ceara", abbreviation: "CE" },
  { code: "08", name: "Pernambuco", abbreviation: "PE" },
  { code: "09", name: "Santa Catarina", abbreviation: "SC" },
  { code: "10", name: "Goias", abbreviation: "GO" },
  { code: "11", name: "Maranhao", abbreviation: "MA" },
  { code: "12", name: "Paraiba", abbreviation: "PB" },
  { code: "13", name: "Para", abbreviation: "PA" },
  { code: "14", name: "Espirito Santo", abbreviation: "ES" },
  { code: "15", name: "Piaui", abbreviation: "PI" },
  { code: "16", name: "Rio Grande do Norte", abbreviation: "RN" },
  { code: "17", name: "Alagoas", abbreviation: "AL" },
  { code: "18", name: "Mato Grosso", abbreviation: "MT" },
  { code: "19", name: "Mato Grosso do Sul", abbreviation: "MS" },
  { code: "20", name: "Distrito Federal", abbreviation: "DF" },
  { code: "21", name: "Sergipe", abbreviation: "SE" },
  { code: "22", name: "Amazonas", abbreviation: "AM" },
  { code: "23", name: "Rondonia", abbreviation: "RO" },
  { code: "24", name: "Acre", abbreviation: "AC" },
  { code: "25", name: "Amapa", abbreviation: "AP" },
  { code: "26", name: "Roraima", abbreviation: "RR" },
  { code: "27", name: "Tocantins", abbreviation: "TO" },
  { code: "28", name: "Exterior", abbreviation: "ZZ" },
];

const tituloEleitorUfMap = new Map(tituloEleitorUfTable.map((uf) => [uf.code, uf]));
const separatorCharacters = new Set([" ", "\t", "\n", "\r", "\f", "\v", ".", "-", "\u00a0", "\u2007", "\u202f"]);
const specialRemainderZeroUfCodes = new Set(["01", "02"]);

function trimAsciiWhitespace(value: string): string {
  return value.replace(/^[\u0009-\u000d ]+|[\u0009-\u000d ]+$/g, "");
}

function isAsciiDigit(character: string): boolean {
  return character >= "0" && character <= "9";
}

function uniqueCharacters(characters: string[]) {
  return Array.from(new Set(characters)).join("");
}

function addIssue(issues: TituloEleitorIssue[], issue: TituloEleitorIssue) {
  const existingIssue = issues.find((item) => item.code === issue.code);

  if (!existingIssue) {
    issues.push(issue);
    return;
  }

  existingIssue.characters = issue.characters ?? existingIssue.characters;
  existingIssue.count = issue.count ?? existingIssue.count;
}

function getIssueCodes(issues: TituloEleitorIssue[], codes: TituloEleitorValidationIssueCode[]) {
  const issueCodeSet = new Set(issues.map((issue) => issue.code));
  return codes.filter((code) => issueCodeSet.has(code));
}

function hasAnyIssue(issues: TituloEleitorIssue[], codes: TituloEleitorValidationIssueCode[]) {
  return codes.some((code) => issues.some((issue) => issue.code === code));
}

function hasRepeatedDigits(value: string): boolean {
  return /^([0-9])\1+$/.test(value);
}

function assertAsciiDigits(value: string, expectedLength: number, label: string) {
  if (!new RegExp(`^[0-9]{${expectedLength}}$`).test(value)) {
    throw new Error(`${label} must contain exactly ${expectedLength} ASCII digits.`);
  }
}

function normalizeModulo11Remainder(remainder: number, ufCode: string): number {
  if (remainder === 10) return 0;
  if (remainder === 0 && specialRemainderZeroUfCodes.has(ufCode)) return 1;
  return remainder;
}

export function normalizeTituloEleitorInput(input: string): TituloEleitorNormalizationResult {
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

export function getTituloEleitorUf(code: string | null | undefined): TituloEleitorUf | null {
  return code ? (tituloEleitorUfMap.get(code) ?? null) : null;
}

export function formatTituloEleitorDigits(digits: string): string {
  const normalizedDigits = digits.replace(/\D/g, "").slice(0, TITULO_ELEITOR_LENGTH);
  return formatTituloEleitorGroups(normalizedDigits);
}

function formatTituloEleitorGroups(value: string): string {
  const groups = [
    value.slice(0, 4),
    value.slice(4, 8),
    value.slice(8, 10),
    value.slice(10, 12),
  ].filter(Boolean);

  return groups.join(" ");
}

export function maskTituloEleitorDigits(digits: string): string {
  const normalizedDigits = digits.replace(/\D/g, "").slice(0, TITULO_ELEITOR_LENGTH);
  if (!normalizedDigits) return "";
  if (normalizedDigits.length <= 2) return formatTituloEleitorDigits("*".repeat(normalizedDigits.length));

  const maskedDigits = `${"*".repeat(normalizedDigits.length - 2)}${normalizedDigits.slice(-2)}`;
  return formatTituloEleitorGroups(maskedDigits);
}

export function calculateTituloEleitorCheckDigits(sequenceDigits: string, ufCode: string): TituloEleitorCheckDigits {
  assertAsciiDigits(sequenceDigits, 8, "sequenceDigits");
  assertAsciiDigits(ufCode, 2, "ufCode");

  const firstWeights = [2, 3, 4, 5, 6, 7, 8, 9];
  const firstSum = sequenceDigits
    .split("")
    .reduce((sum, digit, index) => sum + Number(digit) * firstWeights[index], 0);
  const firstRemainder = firstSum % 11;
  const first = String(normalizeModulo11Remainder(firstRemainder, ufCode));

  const secondDigits = `${ufCode}${first}`;
  const secondWeights = [7, 8, 9];
  const secondSum = secondDigits
    .split("")
    .reduce((sum, digit, index) => sum + Number(digit) * secondWeights[index], 0);
  const secondRemainder = secondSum % 11;
  const second = String(normalizeModulo11Remainder(secondRemainder, ufCode));

  return {
    first,
    second,
    firstRemainder,
    secondRemainder,
    firstSum,
    secondSum,
  };
}

function buildDiagnostics(issues: TituloEleitorIssue[], status: TituloEleitorValidationStatus): TituloEleitorDiagnostic[] {
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
        : hasAnyIssue(issues, ["incompleteLength", "leftPadded"])
          ? "warn"
          : status === "empty"
            ? "info"
            : "pass",
      issueCodes:
        status === "empty" ? ["empty"] : getIssueCodes(issues, ["tooLong", "incompleteLength", "leftPadded"]),
    },
    {
      id: "uf",
      status: hasAnyIssue(issues, ["invalidUf"])
        ? "fail"
        : status === "empty" || status === "incomplete" || status === "invalidFormat"
          ? "info"
          : "pass",
      issueCodes: getIssueCodes(issues, ["invalidUf", "checksumUnavailable"]),
    },
    {
      id: "firstCheckDigit",
      status: hasAnyIssue(issues, ["invalidChecksum"])
        ? "fail"
        : hasAnyIssue(issues, ["validChecksum"])
          ? "pass"
          : "info",
      issueCodes: getIssueCodes(issues, ["invalidChecksum", "validChecksum", "checksumUnavailable"]),
    },
    {
      id: "secondCheckDigit",
      status: hasAnyIssue(issues, ["invalidChecksum"])
        ? "fail"
        : hasAnyIssue(issues, ["validChecksum"])
          ? "pass"
          : "info",
      issueCodes: getIssueCodes(issues, ["invalidChecksum", "validChecksum", "checksumUnavailable"]),
    },
    {
      id: "privacy",
      status: "info",
      issueCodes: ["localOnly"],
    },
  ];
}

export function validateTituloEleitor(input: string): TituloEleitorValidationResult {
  const normalization = normalizeTituloEleitorInput(input);
  const issues: TituloEleitorIssue[] = [];

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
  } else if (normalization.digitCount < 5) {
    addIssue(issues, { code: "incompleteLength" });
  } else if (normalization.digitCount > TITULO_ELEITOR_LENGTH) {
    addIssue(issues, { code: "tooLong" });
  }

  const leftPadded = normalization.digitCount >= 5 && normalization.digitCount < TITULO_ELEITOR_LENGTH;
  const canonicalDigits =
    normalization.digitCount >= 5 && normalization.digitCount <= TITULO_ELEITOR_LENGTH
      ? normalization.digits.padStart(TITULO_ELEITOR_LENGTH, "0")
      : null;

  if (leftPadded) {
    addIssue(issues, { code: "leftPadded" });
  }

  if (canonicalDigits && hasRepeatedDigits(canonicalDigits)) {
    addIssue(issues, { code: "repeatedDigits" });
  }

  const sequenceDigits = canonicalDigits ? canonicalDigits.slice(0, 8) : null;
  const ufCode = canonicalDigits ? canonicalDigits.slice(8, 10) : null;
  const uf = getTituloEleitorUf(ufCode);
  const providedCheckDigits = canonicalDigits ? canonicalDigits.slice(10, 12) : null;

  if (canonicalDigits && !uf) {
    addIssue(issues, { code: "invalidUf" });
  }

  const canCheckDigits =
    Boolean(canonicalDigits && sequenceDigits && ufCode && uf) &&
    !hasAnyIssue(issues, ["unsupportedCharacters", "tooLong", "incompleteLength", "repeatedDigits", "invalidUf"]);
  const checkDigits = canCheckDigits ? calculateTituloEleitorCheckDigits(sequenceDigits as string, ufCode as string) : null;
  const expectedCheckDigits = checkDigits ? `${checkDigits.first}${checkDigits.second}` : null;
  const checksumValid = checkDigits && providedCheckDigits ? expectedCheckDigits === providedCheckDigits : null;

  let status: TituloEleitorValidationStatus = "empty";
  if (normalization.digitCount === 0) {
    status = "empty";
  } else if (hasAnyIssue(issues, ["unsupportedCharacters", "tooLong", "repeatedDigits"])) {
    status = "invalidFormat";
  } else if (hasAnyIssue(issues, ["incompleteLength"])) {
    status = "incomplete";
  } else if (hasAnyIssue(issues, ["invalidUf"])) {
    status = "invalidUf";
  } else if (leftPadded) {
    status = "attention";
  } else if (checksumValid) {
    status = "validChecksum";
  } else if (checksumValid === false) {
    status = "invalidChecksum";
  } else {
    status = "invalidFormat";
  }

  if (normalization.digitCount > 0 && !checkDigits) {
    addIssue(issues, { code: "checksumUnavailable" });
  }

  if (checksumValid) {
    addIssue(issues, { code: "validChecksum" });
  } else if (checksumValid === false) {
    addIssue(issues, { code: "invalidChecksum" });
  }

  const issueCodes = issues.map((issue) => issue.code);

  return {
    ...normalization,
    status,
    issues,
    issueCodes,
    diagnostics: buildDiagnostics(issues, status),
    canonicalDigits,
    formattedNumber: canonicalDigits ? formatTituloEleitorDigits(canonicalDigits) : "",
    maskedNumber: canonicalDigits ? maskTituloEleitorDigits(canonicalDigits) : "",
    sequenceDigits,
    ufCode,
    uf,
    providedCheckDigits,
    expectedCheckDigits,
    firstCheckDigit: checkDigits?.first ?? null,
    secondCheckDigit: checkDigits?.second ?? null,
    leftPadded,
    checksumValid,
    checkDigits,
  };
}

export function readTituloEleitorSearchParams(_params: URLSearchParams): TituloEleitorValidatorState {
  void _params;

  return defaultTituloEleitorValidatorState;
}

export function buildTituloEleitorSearchParams(_state: TituloEleitorValidatorState): TituloEleitorSearchParamsResult {
  void _state;

  const params = new URLSearchParams();

  return {
    params,
    queryLength: 0,
  };
}

export function buildTituloEleitorContentFragment(
  state: TituloEleitorValidatorState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): TituloEleitorContentFragmentResult {
  const params = new URLSearchParams();
  const maxFragmentLength = options.maxFragmentLength ?? TITULO_ELEITOR_SHARE_FRAGMENT_LIMIT;

  if (!options.includeContent) {
    return { params, contentOmitted: false, fragmentLength: 0 };
  }

  const normalization = normalizeTituloEleitorInput(state.titulo);
  if (normalization.digitCount === 0 || normalization.digitCount > TITULO_ELEITOR_LENGTH) {
    return { params, contentOmitted: normalization.digitCount > TITULO_ELEITOR_LENGTH, fragmentLength: 0 };
  }

  params.set("conteudo", "1");
  params.set("titulo", normalization.digits);

  const fragmentLength = params.toString().length;
  if (fragmentLength > maxFragmentLength) {
    return { params: new URLSearchParams(), contentOmitted: true, fragmentLength };
  }

  return {
    params,
    contentOmitted: false,
    fragmentLength,
  };
}

export function readTituloEleitorContentFromFragment(
  hash: string,
  options: { maxFragmentLength?: number } = {}
): TituloEleitorContentFragmentState {
  const rawHash = hash.startsWith("#") ? hash.slice(1) : hash;
  const maxFragmentLength = options.maxFragmentLength ?? TITULO_ELEITOR_SHARE_FRAGMENT_LIMIT;

  if (!rawHash) {
    return { hasExplicitContent: false, titulo: "", contentOmitted: false };
  }

  if (rawHash.length > maxFragmentLength) {
    return { hasExplicitContent: false, titulo: "", contentOmitted: true };
  }

  const params = new URLSearchParams(rawHash);
  if (params.get("conteudo") !== "1") {
    return { hasExplicitContent: false, titulo: "", contentOmitted: false };
  }

  const titulo = params.get("titulo") ?? "";
  const normalization = normalizeTituloEleitorInput(titulo);

  if (
    normalization.unsupportedCharacterCount > 0 ||
    normalization.digitCount === 0 ||
    normalization.digitCount > TITULO_ELEITOR_LENGTH
  ) {
    return { hasExplicitContent: false, titulo: "", contentOmitted: true };
  }

  return {
    hasExplicitContent: true,
    titulo: normalization.digits,
    contentOmitted: false,
  };
}

export function buildTituloEleitorShareUrl(
  baseUrl: string,
  state: TituloEleitorValidatorState,
  options: { includeContent?: boolean } = {}
): TituloEleitorShareUrlResult {
  const searchResult = buildTituloEleitorSearchParams(state);
  const fragmentResult = buildTituloEleitorContentFragment(state, { includeContent: options.includeContent });
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

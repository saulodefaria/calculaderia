export type PaymentCardValidationStatus =
  | "empty"
  | "incomplete"
  | "invalidFormat"
  | "invalidChecksum"
  | "validChecksum";

export type PaymentCardDiagnosticStatus = "pass" | "fail" | "warn" | "info";

export type PaymentCardDiagnosticId = "input" | "characters" | "length" | "repeated" | "checkDigit" | "luhn" | "privacy";

export type PaymentCardValidationIssueCode =
  | "empty"
  | "trimmedWhitespace"
  | "unsupportedCharacters"
  | "incompleteLength"
  | "tooLong"
  | "repeatedDigits"
  | "luhnUnavailable"
  | "invalidChecksum"
  | "validChecksum"
  | "localOnly";

export interface PaymentCardIssue {
  code: PaymentCardValidationIssueCode;
  characters?: string;
  count?: number;
}

export interface PaymentCardDiagnostic {
  id: PaymentCardDiagnosticId;
  status: PaymentCardDiagnosticStatus;
  issueCodes: PaymentCardValidationIssueCode[];
}

export interface PaymentCardNormalizationResult {
  input: string;
  trimmedInput: string;
  digits: string;
  digitCount: number;
  ignoredSeparatorCount: number;
  unsupportedCharacters: string[];
  unsupportedCharacterCount: number;
}

export interface PaymentCardValidatorState {
  numero: string;
  mascarado: boolean;
}

export interface PaymentCardValidationResult extends PaymentCardNormalizationResult {
  status: PaymentCardValidationStatus;
  issues: PaymentCardIssue[];
  issueCodes: PaymentCardValidationIssueCode[];
  diagnostics: PaymentCardDiagnostic[];
  providedCheckDigit: string | null;
  expectedCheckDigit: string | null;
  luhnValid: boolean | null;
  maskedNumber: string;
  displayNumber: string;
}

export interface PaymentCardValidatorSearchParamsResult {
  params: URLSearchParams;
  queryLength: number;
}

export interface PaymentCardValidatorShareUrlResult {
  url: string;
  searchParams: URLSearchParams;
}

export const PAYMENT_CARD_MIN_DIGITS = 12;
export const PAYMENT_CARD_MAX_DIGITS = 19;

export const defaultPaymentCardValidatorState: PaymentCardValidatorState = {
  numero: "",
  mascarado: true,
};

const separatorCharacters = new Set([" ", "\t", "\n", "\r", "\f", "\v", "-", "\u00a0", "\u2007", "\u202f", "\u2013", "\u2014"]);

function trimAsciiWhitespace(value: string): string {
  return value.replace(/^[\u0009-\u000d ]+|[\u0009-\u000d ]+$/g, "");
}

function isAsciiDigit(character: string): boolean {
  return character >= "0" && character <= "9";
}

function uniqueCharacters(characters: string[]) {
  return Array.from(new Set(characters)).join("");
}

function addIssue(issues: PaymentCardIssue[], issue: PaymentCardIssue) {
  const existingIssue = issues.find((item) => item.code === issue.code);

  if (!existingIssue) {
    issues.push(issue);
    return;
  }

  existingIssue.characters = issue.characters ?? existingIssue.characters;
  existingIssue.count = issue.count ?? existingIssue.count;
}

function getIssueCodes(issues: PaymentCardIssue[], codes: PaymentCardValidationIssueCode[]) {
  const issueCodeSet = new Set(issues.map((issue) => issue.code));
  return codes.filter((code) => issueCodeSet.has(code));
}

function hasAnyIssue(issues: PaymentCardIssue[], codes: PaymentCardValidationIssueCode[]) {
  return codes.some((code) => issues.some((issue) => issue.code === code));
}

function hasRepeatedDigits(value: string): boolean {
  return /^([0-9])\1+$/.test(value);
}

function assertAsciiDigits(value: string, label: string) {
  if (!/^[0-9]+$/.test(value)) {
    throw new Error(`${label} must contain only ASCII digits.`);
  }
}

export function normalizePaymentCardInput(input: string): PaymentCardNormalizationResult {
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

export function calculateLuhnCheckDigit(payloadDigits: string): number {
  assertAsciiDigits(payloadDigits, "payloadDigits");

  let sum = 0;
  let shouldDouble = true;

  for (let index = payloadDigits.length - 1; index >= 0; index -= 1) {
    let digit = Number(payloadDigits[index]);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return (10 - (sum % 10)) % 10;
}

export function validateLuhn(fullDigits: string): { expectedCheckDigit: string; providedCheckDigit: string; valid: boolean } | null {
  if (!/^[0-9]{2,}$/.test(fullDigits)) {
    return null;
  }

  const payloadDigits = fullDigits.slice(0, -1);
  const providedCheckDigit = fullDigits.slice(-1);
  const expectedCheckDigit = String(calculateLuhnCheckDigit(payloadDigits));

  return {
    expectedCheckDigit,
    providedCheckDigit,
    valid: providedCheckDigit === expectedCheckDigit,
  };
}

export function formatPaymentCardDigits(digits: string): string {
  return digits.match(/.{1,4}/g)?.join(" ") ?? "";
}

export function maskPaymentCardDigits(digits: string, options: { masked?: boolean } = {}): string {
  if (digits.length === 0) return "";
  if (options.masked === false) return formatPaymentCardDigits(digits);

  if (digits.length <= 4) {
    return formatPaymentCardDigits("*".repeat(digits.length));
  }

  const maskedValue = `${"*".repeat(digits.length - 4)}${digits.slice(-4)}`;
  return formatPaymentCardDigits(maskedValue);
}

function buildDiagnostics(issues: PaymentCardIssue[], status: PaymentCardValidationStatus): PaymentCardDiagnostic[] {
  const lengthFailures: PaymentCardValidationIssueCode[] = ["tooLong"];
  const lengthWarnings: PaymentCardValidationIssueCode[] = ["incompleteLength"];

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
      status: hasAnyIssue(issues, lengthFailures)
        ? "fail"
        : hasAnyIssue(issues, lengthWarnings)
          ? "warn"
          : status === "empty"
            ? "info"
            : "pass",
      issueCodes: status === "empty" ? ["empty"] : getIssueCodes(issues, [...lengthFailures, ...lengthWarnings]),
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
      issueCodes: getIssueCodes(issues, ["invalidChecksum", "validChecksum", "luhnUnavailable"]),
    },
    {
      id: "luhn",
      status: hasAnyIssue(issues, ["invalidChecksum"])
        ? "fail"
        : hasAnyIssue(issues, ["validChecksum"])
          ? "pass"
          : "info",
      issueCodes: getIssueCodes(issues, ["invalidChecksum", "validChecksum", "luhnUnavailable"]),
    },
    {
      id: "privacy",
      status: "info",
      issueCodes: ["localOnly"],
    },
  ];
}

export function validatePaymentCardNumber(
  input: string,
  options: { masked?: boolean } = {}
): PaymentCardValidationResult {
  const normalization = normalizePaymentCardInput(input);
  const issues: PaymentCardIssue[] = [];

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
  } else if (normalization.digitCount < PAYMENT_CARD_MIN_DIGITS) {
    addIssue(issues, { code: "incompleteLength" });
  } else if (normalization.digitCount > PAYMENT_CARD_MAX_DIGITS) {
    addIssue(issues, { code: "tooLong" });
  }

  if (
    normalization.digitCount >= PAYMENT_CARD_MIN_DIGITS &&
    normalization.digitCount <= PAYMENT_CARD_MAX_DIGITS &&
    hasRepeatedDigits(normalization.digits)
  ) {
    addIssue(issues, { code: "repeatedDigits" });
  }

  const canRunLuhn =
    normalization.digitCount >= PAYMENT_CARD_MIN_DIGITS &&
    normalization.digitCount <= PAYMENT_CARD_MAX_DIGITS &&
    !hasAnyIssue(issues, ["unsupportedCharacters", "repeatedDigits"]);
  const luhnResult = canRunLuhn ? validateLuhn(normalization.digits) : null;

  let status: PaymentCardValidationStatus = "empty";
  if (normalization.digitCount === 0) {
    status = "empty";
  } else if (hasAnyIssue(issues, ["unsupportedCharacters", "tooLong", "repeatedDigits"])) {
    status = "invalidFormat";
  } else if (hasAnyIssue(issues, ["incompleteLength"])) {
    status = "incomplete";
  } else if (luhnResult?.valid) {
    status = "validChecksum";
  } else {
    status = "invalidChecksum";
  }

  if (normalization.digitCount > 0 && status !== "validChecksum" && status !== "invalidChecksum") {
    addIssue(issues, { code: "luhnUnavailable" });
  }

  if (status === "validChecksum") {
    addIssue(issues, { code: "validChecksum" });
  } else if (status === "invalidChecksum") {
    addIssue(issues, { code: "invalidChecksum" });
  }

  const issueCodes = issues.map((issue) => issue.code);
  const maskedNumber = maskPaymentCardDigits(normalization.digits, { masked: true });

  return {
    ...normalization,
    status,
    issues,
    issueCodes,
    diagnostics: buildDiagnostics(issues, status),
    providedCheckDigit: luhnResult?.providedCheckDigit ?? (normalization.digitCount >= 2 ? normalization.digits.slice(-1) : null),
    expectedCheckDigit: luhnResult?.expectedCheckDigit ?? null,
    luhnValid: luhnResult?.valid ?? null,
    maskedNumber,
    displayNumber: maskPaymentCardDigits(normalization.digits, { masked: options.masked ?? true }),
  };
}

export function readPaymentCardValidatorSearchParams(params: URLSearchParams): PaymentCardValidatorState {
  return {
    numero: defaultPaymentCardValidatorState.numero,
    mascarado: params.get("mascarado") === "0" ? false : defaultPaymentCardValidatorState.mascarado,
  };
}

export function buildPaymentCardValidatorSearchParams(
  state: PaymentCardValidatorState
): PaymentCardValidatorSearchParamsResult {
  const params = new URLSearchParams();

  if (state.mascarado === false) {
    params.set("mascarado", "0");
  }

  return {
    params,
    queryLength: params.toString().length,
  };
}

export function buildPaymentCardValidatorShareUrl(
  baseUrl: string,
  state: PaymentCardValidatorState
): PaymentCardValidatorShareUrlResult {
  const searchResult = buildPaymentCardValidatorSearchParams(state);
  const baseWithoutFragment = baseUrl.split("#")[0] ?? "";
  const baseWithoutQuery = baseWithoutFragment.split("?")[0] ?? "";
  const query = searchResult.params.toString();

  return {
    url: `${baseWithoutQuery}${query ? `?${query}` : ""}`,
    searchParams: searchResult.params,
  };
}

export type PhoneValidatorMode = "br" | "internacional";
export type PhoneValidatorOutput = "formatado" | "e164" | "digitos";
export type PhoneValidationStatus = "empty" | "valid" | "attention" | "special" | "invalid";
export type PhoneValidationKind =
  | "brFixed"
  | "brMobile"
  | "brLocalOnly"
  | "brSpecialUtility"
  | "brNonGeographic"
  | "internationalE164"
  | "dialingNotation"
  | "unknown";
export type PhoneDiagnosticStatus = "pass" | "fail" | "warn" | "info";
export type PhoneDiagnosticId =
  | "input"
  | "characters"
  | "countryDdd"
  | "length"
  | "localPrefix"
  | "e164"
  | "specialService"
  | "normalization"
  | "privacy";

export type PhoneValidationIssueCode =
  | "empty"
  | "trimmedWhitespace"
  | "inputTooLong"
  | "unsupportedCharacters"
  | "unsupportedExtension"
  | "nonAsciiDigits"
  | "multiplePlus"
  | "misplacedPlus"
  | "noDigits"
  | "separatorsIgnored"
  | "tooShort"
  | "tooLong"
  | "brCountryCodeWithoutPlus"
  | "brDialingPrefix"
  | "brInternationalDialingPrefix"
  | "brMissingDdd"
  | "brInvalidLength"
  | "brInvalidLocalPrefix"
  | "dddNotVerified"
  | "brServiceUtility"
  | "brNonGeographic"
  | "missingPlus"
  | "internationalModeRecommended"
  | "e164TooShort"
  | "e164TooLong"
  | "e164InvalidCountryCode"
  | "internationalStructureOnly"
  | "localValidationOnly";

export interface PhoneDiagnostic {
  id: PhoneDiagnosticId;
  status: PhoneDiagnosticStatus;
  issueCodes: PhoneValidationIssueCode[];
}

export interface PhoneNormalizationResult {
  input: string;
  trimmedInput: string;
  mainInput: string;
  extension: string | null;
  compactInput: string;
  digits: string;
  hasLeadingPlus: boolean;
  plusCount: number;
  ignoredSeparatorCount: number;
  unsupportedCharacters: string;
  unsupportedCharacterCount: number;
  nonAsciiDigits: string;
  nonAsciiDigitCount: number;
}

export interface PhoneValidationResult extends PhoneNormalizationResult {
  mode: PhoneValidatorMode;
  status: PhoneValidationStatus;
  kind: PhoneValidationKind;
  issues: PhoneValidationIssueCode[];
  diagnostics: PhoneDiagnostic[];
  countryCode: string | null;
  ddd: string | null;
  accessCode: string | null;
  localNumber: string | null;
  dialingPrefix: string | null;
  formattedNational: string | null;
  formattedLocal: string | null;
  e164: string | null;
  digitsOnly: string | null;
  serviceNumber: string | null;
}

export interface PhoneValidatorState {
  telefone: string;
  pais: PhoneValidatorMode;
  saida: PhoneValidatorOutput;
}

export interface PhoneValidatorSearchParamsResult {
  params: URLSearchParams;
  queryLength: number;
}

export interface PhoneValidatorContentFragmentResult {
  params: URLSearchParams;
  contentOmitted: boolean;
  fragmentLength: number;
}

export interface PhoneValidatorContentFragmentState {
  hasExplicitContent: boolean;
  telefone: string;
}

export interface PhoneValidatorShareUrlResult {
  url: string;
  searchParams: URLSearchParams;
  fragmentParams: URLSearchParams;
  contentOmitted: boolean;
}

export const PHONE_VALIDATOR_MAX_INPUT_LENGTH = 80;
export const PHONE_VALIDATOR_SHARE_FRAGMENT_LIMIT = 1_800;

export const defaultPhoneValidatorState: PhoneValidatorState = {
  telefone: "",
  pais: "br",
  saida: "formatado",
};

const phoneValidatorModes = new Set<PhoneValidatorMode>(["br", "internacional"]);
const phoneValidatorOutputs = new Set<PhoneValidatorOutput>(["formatado", "e164", "digitos"]);
const separatorCharacters = new Set([
  " ",
  "\t",
  "\n",
  "\r",
  "\f",
  "\v",
  "\u00a0",
  "\u2007",
  "\u202f",
  "(",
  ")",
  "-",
  "\u2013",
  "\u2014",
  ".",
]);
const nonGeographicPrefixes = ["0300", "0303", "0500", "0800", "0900"] as const;

const fatalIssueCodes = new Set<PhoneValidationIssueCode>([
  "inputTooLong",
  "unsupportedCharacters",
  "nonAsciiDigits",
  "multiplePlus",
  "misplacedPlus",
  "noDigits",
  "tooShort",
  "tooLong",
  "brInvalidLength",
  "brInvalidLocalPrefix",
  "e164TooShort",
  "e164TooLong",
  "e164InvalidCountryCode",
]);

const warningIssueCodes = new Set<PhoneValidationIssueCode>([
  "trimmedWhitespace",
  "unsupportedExtension",
  "brCountryCodeWithoutPlus",
  "brDialingPrefix",
  "brInternationalDialingPrefix",
  "brMissingDdd",
  "missingPlus",
  "internationalModeRecommended",
]);

function trimAsciiWhitespace(value: string): string {
  return value.replace(/^[\u0009-\u000d ]+|[\u0009-\u000d ]+$/g, "");
}

function isAsciiDigit(character: string): boolean {
  return character >= "0" && character <= "9";
}

function isNonAsciiDigit(character: string): boolean {
  return /\p{Decimal_Number}/u.test(character) && !isAsciiDigit(character);
}

function uniqueCharacters(characters: string[]) {
  return Array.from(new Set(characters)).join("");
}

function addIssue(issues: PhoneValidationIssueCode[], code: PhoneValidationIssueCode) {
  if (!issues.includes(code)) {
    issues.push(code);
  }
}

function getIssueCodes(issues: PhoneValidationIssueCode[], codes: PhoneValidationIssueCode[]) {
  return codes.filter((code) => issues.includes(code));
}

function hasAnyIssue(issues: PhoneValidationIssueCode[], codes: PhoneValidationIssueCode[]) {
  return codes.some((code) => issues.includes(code));
}

function hasFatalIssue(issues: PhoneValidationIssueCode[]) {
  return issues.some((issue) => fatalIssueCodes.has(issue));
}

function hasWarningIssue(issues: PhoneValidationIssueCode[]) {
  return issues.some((issue) => warningIssueCodes.has(issue));
}

function detectExtension(input: string): { mainInput: string; extension: string | null } {
  const extensionMatch = input.match(/(?:[\s().,;:-](?:ramal|ext|r|x)\.?\s*:?\s*|x)[0-9]+$/i);

  if (!extensionMatch || extensionMatch.index === undefined) {
    return { mainInput: input, extension: null };
  }

  return {
    mainInput: trimAsciiWhitespace(input.slice(0, extensionMatch.index)),
    extension: extensionMatch[0].trim(),
  };
}

export function normalizePhoneInput(input: string): PhoneNormalizationResult {
  const trimmedInput = trimAsciiWhitespace(input);
  const { mainInput, extension } = detectExtension(trimmedInput);
  const compactCharacters: string[] = [];
  const digits: string[] = [];
  const unsupportedCharacters: string[] = [];
  const nonAsciiDigits: string[] = [];
  let plusCount = 0;
  let ignoredSeparatorCount = 0;

  for (const character of Array.from(mainInput)) {
    if (isAsciiDigit(character)) {
      digits.push(character);
      compactCharacters.push(character);
      continue;
    }

    if (character === "+") {
      plusCount += 1;
      compactCharacters.push(character);
      continue;
    }

    if (separatorCharacters.has(character)) {
      ignoredSeparatorCount += 1;
      continue;
    }

    if (isNonAsciiDigit(character)) {
      nonAsciiDigits.push(character);
      continue;
    }

    unsupportedCharacters.push(character);
  }

  const compactInput = compactCharacters.join("");

  return {
    input,
    trimmedInput,
    mainInput,
    extension,
    compactInput,
    digits: digits.join(""),
    hasLeadingPlus: plusCount === 1 && compactInput.startsWith("+"),
    plusCount,
    ignoredSeparatorCount,
    unsupportedCharacters: uniqueCharacters(unsupportedCharacters),
    unsupportedCharacterCount: unsupportedCharacters.length,
    nonAsciiDigits: uniqueCharacters(nonAsciiDigits),
    nonAsciiDigitCount: nonAsciiDigits.length,
  };
}

export function normalizePhoneValidatorMode(value: string | null | undefined): PhoneValidatorMode {
  return value && phoneValidatorModes.has(value as PhoneValidatorMode) ? (value as PhoneValidatorMode) : "br";
}

export function normalizePhoneValidatorOutput(value: string | null | undefined): PhoneValidatorOutput {
  return value && phoneValidatorOutputs.has(value as PhoneValidatorOutput) ? (value as PhoneValidatorOutput) : "formatado";
}

export function formatBrazilPhone(nationalDigits: string): string | null {
  if (!/^[0-9]{10,11}$/.test(nationalDigits)) return null;

  const ddd = nationalDigits.slice(0, 2);
  const accessCode = nationalDigits.slice(2);

  if (accessCode.length === 8) {
    return `(${ddd}) ${accessCode.slice(0, 4)}-${accessCode.slice(4)}`;
  }

  return `(${ddd}) ${accessCode.slice(0, 5)}-${accessCode.slice(5)}`;
}

export function formatBrazilLocalPhone(localDigits: string): string | null {
  if (/^[0-9]{8}$/.test(localDigits)) {
    return `${localDigits.slice(0, 4)}-${localDigits.slice(4)}`;
  }

  if (/^[0-9]{9}$/.test(localDigits)) {
    return `${localDigits.slice(0, 5)}-${localDigits.slice(5)}`;
  }

  return null;
}

export function formatBrazilServiceNumber(digits: string): string {
  if (digits.length === 3) return digits;
  if (digits.length === 10) return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  if (digits.length === 11) return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;

  return digits;
}

function buildDiagnostics(issues: PhoneValidationIssueCode[], status: PhoneValidationStatus): PhoneDiagnostic[] {
  const inputFailures: PhoneValidationIssueCode[] = ["empty", "inputTooLong", "noDigits"];
  const inputWarnings: PhoneValidationIssueCode[] = ["trimmedWhitespace"];
  const characterFailures: PhoneValidationIssueCode[] = [
    "unsupportedCharacters",
    "nonAsciiDigits",
    "multiplePlus",
    "misplacedPlus",
  ];
  const countryWarnings: PhoneValidationIssueCode[] = [
    "brCountryCodeWithoutPlus",
    "brDialingPrefix",
    "brInternationalDialingPrefix",
    "brMissingDdd",
    "missingPlus",
    "internationalModeRecommended",
  ];
  const countryNotes: PhoneValidationIssueCode[] = ["dddNotVerified"];
  const lengthFailures: PhoneValidationIssueCode[] = ["tooShort", "tooLong", "brInvalidLength", "e164TooShort", "e164TooLong"];
  const localPrefixFailures: PhoneValidationIssueCode[] = ["brInvalidLocalPrefix"];
  const e164Failures: PhoneValidationIssueCode[] = ["e164TooShort", "e164TooLong", "e164InvalidCountryCode"];
  const e164Warnings: PhoneValidationIssueCode[] = ["missingPlus", "brInternationalDialingPrefix"];
  const e164Notes: PhoneValidationIssueCode[] = ["internationalStructureOnly"];
  const specialNotes: PhoneValidationIssueCode[] = ["brServiceUtility", "brNonGeographic"];
  const normalizationWarnings: PhoneValidationIssueCode[] = ["unsupportedExtension", "trimmedWhitespace"];
  const normalizationNotes: PhoneValidationIssueCode[] = ["separatorsIgnored"];

  return [
    {
      id: "input",
      status: status === "empty" ? "info" : hasAnyIssue(issues, inputFailures) ? "fail" : hasAnyIssue(issues, inputWarnings) ? "warn" : "pass",
      issueCodes: status === "empty" ? ["empty"] : getIssueCodes(issues, [...inputFailures, ...inputWarnings]),
    },
    {
      id: "characters",
      status: hasAnyIssue(issues, characterFailures) ? "fail" : "pass",
      issueCodes: getIssueCodes(issues, characterFailures),
    },
    {
      id: "countryDdd",
      status: hasAnyIssue(issues, countryWarnings) ? "warn" : hasAnyIssue(issues, countryNotes) ? "info" : "pass",
      issueCodes: getIssueCodes(issues, [...countryWarnings, ...countryNotes]),
    },
    {
      id: "length",
      status: status === "empty" ? "info" : hasAnyIssue(issues, lengthFailures) ? "fail" : "pass",
      issueCodes: status === "empty" ? ["empty"] : getIssueCodes(issues, lengthFailures),
    },
    {
      id: "localPrefix",
      status: hasAnyIssue(issues, localPrefixFailures) ? "fail" : status === "empty" ? "info" : "pass",
      issueCodes: getIssueCodes(issues, localPrefixFailures),
    },
    {
      id: "e164",
      status: hasAnyIssue(issues, e164Failures)
        ? "fail"
        : hasAnyIssue(issues, e164Warnings)
          ? "warn"
          : hasAnyIssue(issues, e164Notes)
            ? "info"
            : "pass",
      issueCodes: getIssueCodes(issues, [...e164Failures, ...e164Warnings, ...e164Notes]),
    },
    {
      id: "specialService",
      status: hasAnyIssue(issues, specialNotes) ? "info" : "pass",
      issueCodes: getIssueCodes(issues, specialNotes),
    },
    {
      id: "normalization",
      status: hasAnyIssue(issues, normalizationWarnings)
        ? "warn"
        : hasAnyIssue(issues, normalizationNotes)
          ? "info"
          : "pass",
      issueCodes: getIssueCodes(issues, [...normalizationWarnings, ...normalizationNotes]),
    },
    {
      id: "privacy",
      status: "info",
      issueCodes: ["localValidationOnly"],
    },
  ];
}

function finalizeStatus(status: PhoneValidationStatus, issues: PhoneValidationIssueCode[]): PhoneValidationStatus {
  if (status === "valid" && hasWarningIssue(issues)) return "attention";

  return status;
}

function createResult(
  normalization: PhoneNormalizationResult,
  mode: PhoneValidatorMode,
  issues: PhoneValidationIssueCode[],
  parsed: Partial<
    Pick<
      PhoneValidationResult,
      | "status"
      | "kind"
      | "countryCode"
      | "ddd"
      | "accessCode"
      | "localNumber"
      | "dialingPrefix"
      | "formattedNational"
      | "formattedLocal"
      | "e164"
      | "digitsOnly"
      | "serviceNumber"
    >
  > = {}
): PhoneValidationResult {
  const status = finalizeStatus(parsed.status ?? (hasFatalIssue(issues) ? "invalid" : "valid"), issues);
  const diagnostics = buildDiagnostics(issues, status);

  return {
    ...normalization,
    mode,
    status,
    kind: parsed.kind ?? "unknown",
    issues,
    diagnostics,
    countryCode: parsed.countryCode ?? null,
    ddd: parsed.ddd ?? null,
    accessCode: parsed.accessCode ?? null,
    localNumber: parsed.localNumber ?? null,
    dialingPrefix: parsed.dialingPrefix ?? null,
    formattedNational: parsed.formattedNational ?? null,
    formattedLocal: parsed.formattedLocal ?? null,
    e164: parsed.e164 ?? null,
    digitsOnly: parsed.digitsOnly ?? null,
    serviceNumber: parsed.serviceNumber ?? null,
  };
}

function hasBaseFatalIssues(issues: PhoneValidationIssueCode[]) {
  return hasAnyIssue(issues, [
    "inputTooLong",
    "unsupportedCharacters",
    "nonAsciiDigits",
    "multiplePlus",
    "misplacedPlus",
    "noDigits",
  ]);
}

function isBrazilNonGeographicService(digits: string) {
  return (
    digits.length >= 8 &&
    digits.length <= 11 &&
    nonGeographicPrefixes.some((prefix) => digits.startsWith(prefix))
  );
}

function parseBrazilNationalNumber(
  normalization: PhoneNormalizationResult,
  mode: PhoneValidatorMode,
  issues: PhoneValidationIssueCode[],
  nationalDigits: string,
  options: { dialingPrefix?: string | null; countryCode?: string | null } = {}
): PhoneValidationResult {
  if (nationalDigits.length === 8 || nationalDigits.length === 9) {
    const localPrefixIsValid =
      (nationalDigits.length === 8 && /^[2-6]/.test(nationalDigits)) ||
      (nationalDigits.length === 9 && /^[7-9]/.test(nationalDigits));

    if (!localPrefixIsValid) {
      addIssue(issues, "brInvalidLocalPrefix");
      return createResult(normalization, mode, issues, {
        status: "invalid",
        kind: "brLocalOnly",
        localNumber: nationalDigits,
        formattedLocal: formatBrazilLocalPhone(nationalDigits),
        digitsOnly: nationalDigits,
      });
    }

    addIssue(issues, "brMissingDdd");
    return createResult(normalization, mode, issues, {
      status: "attention",
      kind: "brLocalOnly",
      localNumber: nationalDigits,
      formattedLocal: formatBrazilLocalPhone(nationalDigits),
      digitsOnly: nationalDigits,
    });
  }

  if (nationalDigits.length !== 10 && nationalDigits.length !== 11) {
    addIssue(issues, nationalDigits.length < 8 ? "tooShort" : "tooLong");
    addIssue(issues, "brInvalidLength");
    return createResult(normalization, mode, issues, {
      status: "invalid",
      kind: options.dialingPrefix ? "dialingNotation" : "unknown",
      dialingPrefix: options.dialingPrefix ?? null,
      digitsOnly: nationalDigits || null,
    });
  }

  const ddd = nationalDigits.slice(0, 2);
  const accessCode = nationalDigits.slice(2);
  const isFixed = nationalDigits.length === 10 && /^[2-6]/.test(accessCode);
  const isMobile = nationalDigits.length === 11 && /^[7-9]/.test(accessCode);

  if (!isFixed && !isMobile) {
    addIssue(issues, "brInvalidLocalPrefix");
    return createResult(normalization, mode, issues, {
      status: "invalid",
      kind: "unknown",
      countryCode: options.countryCode ?? "55",
      ddd,
      accessCode,
      localNumber: accessCode,
      dialingPrefix: options.dialingPrefix ?? null,
      digitsOnly: nationalDigits,
    });
  }

  addIssue(issues, "dddNotVerified");

  return createResult(normalization, mode, issues, {
    status: "valid",
    kind: options.dialingPrefix ? "dialingNotation" : isFixed ? "brFixed" : "brMobile",
    countryCode: options.countryCode ?? "55",
    ddd,
    accessCode,
    localNumber: accessCode,
    dialingPrefix: options.dialingPrefix ?? null,
    formattedNational: formatBrazilPhone(nationalDigits),
    e164: `+55${nationalDigits}`,
    digitsOnly: nationalDigits,
  });
}

function parseInternationalDigits(
  normalization: PhoneNormalizationResult,
  mode: PhoneValidatorMode,
  issues: PhoneValidationIssueCode[],
  digits: string,
  options: { hasPlus: boolean; dialingPrefix?: string | null; attention?: boolean } = { hasPlus: true }
): PhoneValidationResult {
  if (!options.hasPlus) {
    addIssue(issues, "missingPlus");
  }

  if (digits.length < 8) {
    addIssue(issues, "e164TooShort");
  }

  if (digits.length > 15) {
    addIssue(issues, "e164TooLong");
  }

  if (digits.startsWith("0")) {
    addIssue(issues, "e164InvalidCountryCode");
  }

  if (hasAnyIssue(issues, ["e164TooShort", "e164TooLong", "e164InvalidCountryCode"])) {
    return createResult(normalization, mode, issues, {
      status: "invalid",
      kind: options.dialingPrefix ? "dialingNotation" : "internationalE164",
      dialingPrefix: options.dialingPrefix ?? null,
      digitsOnly: digits || null,
    });
  }

  addIssue(issues, "internationalStructureOnly");

  const brazilDigits = digits.startsWith("55") ? digits.slice(2) : "";
  const formattedNational = /^[0-9]{10,11}$/.test(brazilDigits) ? formatBrazilPhone(brazilDigits) : null;

  return createResult(normalization, mode, issues, {
    status: options.attention || !options.hasPlus || options.dialingPrefix ? "attention" : "valid",
    kind: options.dialingPrefix ? "dialingNotation" : "internationalE164",
    countryCode: digits.startsWith("55") ? "55" : null,
    ddd: formattedNational ? brazilDigits.slice(0, 2) : null,
    accessCode: formattedNational ? brazilDigits.slice(2) : null,
    localNumber: formattedNational ? brazilDigits.slice(2) : null,
    dialingPrefix: options.dialingPrefix ?? null,
    formattedNational,
    e164: `+${digits}`,
    digitsOnly: digits,
  });
}

function validateBrazilPhone(normalization: PhoneNormalizationResult, issues: PhoneValidationIssueCode[]): PhoneValidationResult {
  if (hasBaseFatalIssues(issues)) {
    return createResult(normalization, "br", issues, { status: "invalid" });
  }

  const { digits } = normalization;

  if (digits.length === 3 && digits.startsWith("1")) {
    addIssue(issues, "brServiceUtility");
    return createResult(normalization, "br", issues, {
      status: "special",
      kind: "brSpecialUtility",
      serviceNumber: digits,
      digitsOnly: digits,
    });
  }

  if (isBrazilNonGeographicService(digits)) {
    addIssue(issues, "brNonGeographic");
    return createResult(normalization, "br", issues, {
      status: "special",
      kind: "brNonGeographic",
      serviceNumber: formatBrazilServiceNumber(digits),
      digitsOnly: digits,
    });
  }

  if (normalization.hasLeadingPlus) {
    if (!digits.startsWith("55")) {
      addIssue(issues, "internationalModeRecommended");
      return parseInternationalDigits(normalization, "br", issues, digits, {
        hasPlus: true,
        attention: true,
      });
    }

    return parseBrazilNationalNumber(normalization, "br", issues, digits.slice(2), { countryCode: "55" });
  }

  if (digits.startsWith("00") && digits.length > 2) {
    const internationalDigits = digits.slice(2);
    addIssue(issues, "brInternationalDialingPrefix");

    if (internationalDigits.startsWith("55")) {
      return parseBrazilNationalNumber(normalization, "br", issues, internationalDigits.slice(2), {
        countryCode: "55",
        dialingPrefix: "00",
      });
    }

    return parseInternationalDigits(normalization, "br", issues, internationalDigits, {
      hasPlus: false,
      dialingPrefix: "00",
      attention: true,
    });
  }

  if (digits.startsWith("90") && digits.length > 2) {
    const withoutCollectCallPrefix = digits.slice(2);
    const withoutCollectCallCarrierSelection = digits.slice(4);

    if (withoutCollectCallPrefix.length === 10 || withoutCollectCallPrefix.length === 11) {
      addIssue(issues, "brDialingPrefix");
      return parseBrazilNationalNumber(normalization, "br", issues, withoutCollectCallPrefix, {
        countryCode: "55",
        dialingPrefix: digits.slice(0, 2),
      });
    }

    if (
      (withoutCollectCallCarrierSelection.length === 10 || withoutCollectCallCarrierSelection.length === 11) &&
      /^[0-9]{2}/.test(digits.slice(2, 4))
    ) {
      addIssue(issues, "brDialingPrefix");
      return parseBrazilNationalNumber(normalization, "br", issues, withoutCollectCallCarrierSelection, {
        countryCode: "55",
        dialingPrefix: digits.slice(0, 4),
      });
    }
  }

  if (digits.startsWith("0") && digits.length > 1) {
    const withoutTrunk = digits.slice(1);
    const withoutCarrierSelection = digits.slice(3);

    if (withoutTrunk.length === 10 || withoutTrunk.length === 11) {
      addIssue(issues, "brDialingPrefix");
      return parseBrazilNationalNumber(normalization, "br", issues, withoutTrunk, {
        countryCode: "55",
        dialingPrefix: digits.slice(0, 1),
      });
    }

    if ((withoutCarrierSelection.length === 10 || withoutCarrierSelection.length === 11) && /^[0-9]{2}/.test(digits.slice(1, 3))) {
      addIssue(issues, "brDialingPrefix");
      return parseBrazilNationalNumber(normalization, "br", issues, withoutCarrierSelection, {
        countryCode: "55",
        dialingPrefix: digits.slice(0, 3),
      });
    }
  }

  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    addIssue(issues, "brCountryCodeWithoutPlus");
    return parseBrazilNationalNumber(normalization, "br", issues, digits.slice(2), { countryCode: "55" });
  }

  return parseBrazilNationalNumber(normalization, "br", issues, digits, { countryCode: "55" });
}

function validateInternationalPhone(
  normalization: PhoneNormalizationResult,
  issues: PhoneValidationIssueCode[]
): PhoneValidationResult {
  if (hasBaseFatalIssues(issues)) {
    return createResult(normalization, "internacional", issues, { status: "invalid" });
  }

  if (!normalization.hasLeadingPlus && normalization.digits.startsWith("00") && normalization.digits.length > 2) {
    addIssue(issues, "brInternationalDialingPrefix");
    return parseInternationalDigits(normalization, "internacional", issues, normalization.digits.slice(2), {
      hasPlus: false,
      dialingPrefix: "00",
      attention: true,
    });
  }

  return parseInternationalDigits(normalization, "internacional", issues, normalization.digits, {
    hasPlus: normalization.hasLeadingPlus,
  });
}

export function validatePhoneNumber(
  input: string,
  options: { mode?: PhoneValidatorMode | string | null } = {}
): PhoneValidationResult {
  const mode = normalizePhoneValidatorMode(options.mode);
  const normalization = normalizePhoneInput(input);
  const issues: PhoneValidationIssueCode[] = [];

  if (normalization.trimmedInput.length === 0) {
    return createResult(normalization, mode, ["empty"], {
      status: "empty",
      kind: "unknown",
    });
  }

  if (normalization.input !== normalization.trimmedInput) {
    addIssue(issues, "trimmedWhitespace");
  }

  if (normalization.trimmedInput.length > PHONE_VALIDATOR_MAX_INPUT_LENGTH) {
    addIssue(issues, "inputTooLong");
  }

  if (normalization.extension) {
    addIssue(issues, "unsupportedExtension");
  }

  if (normalization.ignoredSeparatorCount > 0) {
    addIssue(issues, "separatorsIgnored");
  }

  if (normalization.unsupportedCharacterCount > 0) {
    addIssue(issues, "unsupportedCharacters");
  }

  if (normalization.nonAsciiDigitCount > 0) {
    addIssue(issues, "nonAsciiDigits");
  }

  if (normalization.plusCount > 1) {
    addIssue(issues, "multiplePlus");
  } else if (normalization.plusCount === 1 && !normalization.hasLeadingPlus) {
    addIssue(issues, "misplacedPlus");
  }

  if (normalization.digits.length === 0) {
    addIssue(issues, "noDigits");
  }

  return mode === "br" ? validateBrazilPhone(normalization, issues) : validateInternationalPhone(normalization, issues);
}

export function readPhoneValidatorStateFromParams(params: URLSearchParams): PhoneValidatorState {
  return {
    telefone: defaultPhoneValidatorState.telefone,
    pais: normalizePhoneValidatorMode(params.get("pais")),
    saida: normalizePhoneValidatorOutput(params.get("saida")),
  };
}

export function buildPhoneValidatorSearchParams(state: PhoneValidatorState): PhoneValidatorSearchParamsResult {
  const params = new URLSearchParams();
  const pais = normalizePhoneValidatorMode(state.pais);
  const saida = normalizePhoneValidatorOutput(state.saida);

  if (pais !== defaultPhoneValidatorState.pais) {
    params.set("pais", pais);
  }

  if (saida !== defaultPhoneValidatorState.saida) {
    params.set("saida", saida);
  }

  return {
    params,
    queryLength: params.toString().length,
  };
}

function sanitizeSharedPhoneContent(value: string) {
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").slice(0, PHONE_VALIDATOR_MAX_INPUT_LENGTH);
}

export function readPhoneValidatorContentFromFragment(fragment: string): PhoneValidatorContentFragmentState {
  const normalizedFragment = fragment.startsWith("#") ? fragment.slice(1) : fragment;
  const params = new URLSearchParams(normalizedFragment);
  const hasExplicitContent = params.get("conteudo") === "1";

  return {
    hasExplicitContent,
    telefone: hasExplicitContent ? sanitizeSharedPhoneContent(params.get("telefone") ?? "") : defaultPhoneValidatorState.telefone,
  };
}

export function buildPhoneValidatorContentFragmentParams(
  state: PhoneValidatorState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): PhoneValidatorContentFragmentResult {
  const params = new URLSearchParams();
  const maxFragmentLength = options.maxFragmentLength ?? PHONE_VALIDATOR_SHARE_FRAGMENT_LIMIT;

  if (!options.includeContent) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: 0,
    };
  }

  params.set("conteudo", "1");

  if (state.telefone.length === 0) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: params.toString().length,
    };
  }

  if (state.telefone.length > PHONE_VALIDATOR_MAX_INPUT_LENGTH) {
    return {
      params,
      contentOmitted: true,
      fragmentLength: params.toString().length,
    };
  }

  params.set("telefone", state.telefone);

  if (params.toString().length <= maxFragmentLength) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: params.toString().length,
    };
  }

  params.delete("telefone");

  return {
    params,
    contentOmitted: true,
    fragmentLength: params.toString().length,
  };
}

export function buildPhoneValidatorShareUrl(
  baseUrl: string,
  state: PhoneValidatorState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): PhoneValidatorShareUrlResult {
  const searchResult = buildPhoneValidatorSearchParams(state);
  const fragmentResult = buildPhoneValidatorContentFragmentParams(state, options);
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

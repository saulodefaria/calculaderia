export type EmailValidatorMode = "comum";
export type EmailValidationStatus = "empty" | "valid" | "invalid" | "attention";
export type EmailDiagnosticStatus = "pass" | "fail" | "warn" | "info";
export type EmailDiagnosticId =
  | "input"
  | "atSign"
  | "localPart"
  | "domain"
  | "unsupportedSyntax"
  | "normalization"
  | "privacy";

export type EmailValidationIssueCode =
  | "empty"
  | "trimmedWhitespace"
  | "inputTooLong"
  | "asciiControl"
  | "internalWhitespace"
  | "missingAt"
  | "multipleAt"
  | "missingLocalPart"
  | "missingDomain"
  | "localPartTooLong"
  | "localPartStartsWithDot"
  | "localPartEndsWithDot"
  | "localPartConsecutiveDots"
  | "localPartInvalidCharacters"
  | "nonAsciiLocalPart"
  | "displayNameUnsupported"
  | "quotedLocalPartUnsupported"
  | "commentsUnsupported"
  | "domainLiteralUnsupported"
  | "multipleAddressesUnsupported"
  | "domainIdnNormalized"
  | "domainInvalidIdn"
  | "domainNeedsDot"
  | "domainEmptyLabel"
  | "domainLabelTooLong"
  | "domainTooLong"
  | "domainLabelStartsOrEndsWithHyphen"
  | "domainInvalidCharacters"
  | "syntaxOnly";

export interface EmailDiagnostic {
  id: EmailDiagnosticId;
  status: EmailDiagnosticStatus;
  issueCodes: EmailValidationIssueCode[];
}

export interface EmailValidationResult {
  status: EmailValidationStatus;
  input: string;
  trimmedInput: string;
  normalizedEmail: string | null;
  localPart: string | null;
  domain: string | null;
  asciiDomain: string | null;
  issues: EmailValidationIssueCode[];
  diagnostics: EmailDiagnostic[];
}

export interface EmailValidatorState {
  email: string;
  mode: EmailValidatorMode;
}

export interface EmailValidatorSearchParamsResult {
  params: URLSearchParams;
  queryLength: number;
}

export interface EmailValidatorContentFragmentResult {
  params: URLSearchParams;
  contentOmitted: boolean;
  fragmentLength: number;
}

export interface EmailValidatorContentFragmentState {
  hasExplicitContent: boolean;
  email: string;
}

export interface EmailValidatorShareUrlResult {
  url: string;
  searchParams: URLSearchParams;
  fragmentParams: URLSearchParams;
  contentOmitted: boolean;
}

export const EMAIL_VALIDATOR_MAX_INPUT_LENGTH = 320;
export const EMAIL_VALIDATOR_MAX_LOCAL_PART_LENGTH = 64;
export const EMAIL_VALIDATOR_MAX_DOMAIN_LENGTH = 253;
export const EMAIL_VALIDATOR_MAX_DOMAIN_LABEL_LENGTH = 63;
export const EMAIL_VALIDATOR_SHARE_FRAGMENT_LIMIT = 1_800;

export const defaultEmailValidatorState: EmailValidatorState = {
  email: "",
  mode: "comum",
};

const emailValidatorModes = new Set<EmailValidatorMode>(["comum"]);
const asciiLocalPartCharacters = new Set(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&'*+-/=?^_`{|}~".split("")
);

const errorIssueCodes = new Set<EmailValidationIssueCode>([
  "inputTooLong",
  "asciiControl",
  "internalWhitespace",
  "missingAt",
  "multipleAt",
  "missingLocalPart",
  "missingDomain",
  "localPartTooLong",
  "localPartStartsWithDot",
  "localPartEndsWithDot",
  "localPartConsecutiveDots",
  "localPartInvalidCharacters",
  "displayNameUnsupported",
  "quotedLocalPartUnsupported",
  "commentsUnsupported",
  "domainLiteralUnsupported",
  "multipleAddressesUnsupported",
  "domainInvalidIdn",
  "domainNeedsDot",
  "domainEmptyLabel",
  "domainLabelTooLong",
  "domainTooLong",
  "domainLabelStartsOrEndsWithHyphen",
  "domainInvalidCharacters",
]);

const warningIssueCodes = new Set<EmailValidationIssueCode>(["trimmedWhitespace", "nonAsciiLocalPart"]);

function trimAsciiWhitespace(value: string): string {
  return value.replace(/^[\u0009-\u000d ]+|[\u0009-\u000d ]+$/g, "");
}

function hasNonAscii(value: string): boolean {
  return /[^\x00-\x7f]/.test(value);
}

function addIssue(issues: EmailValidationIssueCode[], code: EmailValidationIssueCode) {
  if (!issues.includes(code)) {
    issues.push(code);
  }
}

function hasAnyIssue(issues: EmailValidationIssueCode[], codes: EmailValidationIssueCode[]) {
  return codes.some((code) => issues.includes(code));
}

function getIssueCodes(issues: EmailValidationIssueCode[], codes: EmailValidationIssueCode[]) {
  return codes.filter((code) => issues.includes(code));
}

function hasErrorIssue(issues: EmailValidationIssueCode[]): boolean {
  return issues.some((issue) => errorIssueCodes.has(issue));
}

function hasWarningIssue(issues: EmailValidationIssueCode[]): boolean {
  return issues.some((issue) => warningIssueCodes.has(issue));
}

function detectUnsupportedSyntax(input: string, domain: string | null, issues: EmailValidationIssueCode[]) {
  if (input.includes(",")) {
    addIssue(issues, "multipleAddressesUnsupported");
  }

  if (input.includes("<") || input.includes(">")) {
    addIssue(issues, "displayNameUnsupported");
  }

  if (input.includes('"')) {
    addIssue(issues, "quotedLocalPartUnsupported");
  }

  if (/[()]/.test(input)) {
    addIssue(issues, "commentsUnsupported");
  }

  if (domain && /^\[.*\]$/.test(domain)) {
    addIssue(issues, "domainLiteralUnsupported");
  }
}

function validateLocalPart(localPart: string, issues: EmailValidationIssueCode[]) {
  if (localPart.length === 0) {
    addIssue(issues, "missingLocalPart");
    return;
  }

  if (localPart.length > EMAIL_VALIDATOR_MAX_LOCAL_PART_LENGTH) {
    addIssue(issues, "localPartTooLong");
  }

  if (localPart.startsWith(".")) {
    addIssue(issues, "localPartStartsWithDot");
  }

  if (localPart.endsWith(".")) {
    addIssue(issues, "localPartEndsWithDot");
  }

  if (localPart.includes("..")) {
    addIssue(issues, "localPartConsecutiveDots");
  }

  if (hasNonAscii(localPart)) {
    addIssue(issues, "nonAsciiLocalPart");
  }

  for (const character of Array.from(localPart)) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint > 0x7f) continue;
    if (character === "." || asciiLocalPartCharacters.has(character)) continue;

    addIssue(issues, "localPartInvalidCharacters");
    return;
  }
}

function normalizeDomainToAscii(domain: string): { asciiDomain: string | null; issueCode: EmailValidationIssueCode | null } {
  if (/[\\/?#:%]/.test(domain)) {
    return { asciiDomain: null, issueCode: "domainInvalidCharacters" };
  }

  try {
    const url = new URL(`https://${domain}`);
    if (url.pathname !== "/" || url.search || url.hash) {
      return { asciiDomain: null, issueCode: "domainInvalidCharacters" };
    }

    const hostname = url.hostname.toLowerCase();
    return hostname ? { asciiDomain: hostname, issueCode: null } : { asciiDomain: null, issueCode: "domainInvalidIdn" };
  } catch {
    return { asciiDomain: null, issueCode: "domainInvalidIdn" };
  }
}

function validateDomain(domain: string, issues: EmailValidationIssueCode[]): string | null {
  if (domain.length === 0) {
    addIssue(issues, "missingDomain");
    return null;
  }

  const normalized = normalizeDomainToAscii(domain);
  if (normalized.issueCode) {
    addIssue(issues, normalized.issueCode);
  }

  const asciiDomain = normalized.asciiDomain;
  if (!asciiDomain) {
    return null;
  }

  if (hasNonAscii(domain) && asciiDomain !== domain.toLowerCase()) {
    addIssue(issues, "domainIdnNormalized");
  }

  if (asciiDomain.length > EMAIL_VALIDATOR_MAX_DOMAIN_LENGTH) {
    addIssue(issues, "domainTooLong");
  }

  const labels = asciiDomain.split(".");
  if (labels.length < 2) {
    addIssue(issues, "domainNeedsDot");
  }

  for (const label of labels) {
    if (label.length === 0) {
      addIssue(issues, "domainEmptyLabel");
      continue;
    }

    if (label.length > EMAIL_VALIDATOR_MAX_DOMAIN_LABEL_LENGTH) {
      addIssue(issues, "domainLabelTooLong");
    }

    if (!/^[a-z0-9-]+$/i.test(label)) {
      addIssue(issues, "domainInvalidCharacters");
    }

    if (!/^[a-z0-9]/i.test(label) || !/[a-z0-9]$/i.test(label)) {
      addIssue(issues, "domainLabelStartsOrEndsWithHyphen");
    }
  }

  return asciiDomain;
}

function buildDiagnostics(issues: EmailValidationIssueCode[], status: EmailValidationStatus): EmailDiagnostic[] {
  const inputFailures: EmailValidationIssueCode[] = ["empty", "inputTooLong", "asciiControl", "internalWhitespace"];
  const inputWarnings: EmailValidationIssueCode[] = ["trimmedWhitespace"];
  const atFailures: EmailValidationIssueCode[] = ["missingAt", "multipleAt"];
  const localFailures: EmailValidationIssueCode[] = [
    "missingLocalPart",
    "localPartTooLong",
    "localPartStartsWithDot",
    "localPartEndsWithDot",
    "localPartConsecutiveDots",
    "localPartInvalidCharacters",
  ];
  const localWarnings: EmailValidationIssueCode[] = ["nonAsciiLocalPart"];
  const domainFailures: EmailValidationIssueCode[] = [
    "missingDomain",
    "domainInvalidIdn",
    "domainNeedsDot",
    "domainEmptyLabel",
    "domainLabelTooLong",
    "domainTooLong",
    "domainLabelStartsOrEndsWithHyphen",
    "domainInvalidCharacters",
    "domainLiteralUnsupported",
  ];
  const domainNotes: EmailValidationIssueCode[] = ["domainIdnNormalized"];
  const unsupportedFailures: EmailValidationIssueCode[] = [
    "displayNameUnsupported",
    "quotedLocalPartUnsupported",
    "commentsUnsupported",
    "domainLiteralUnsupported",
    "multipleAddressesUnsupported",
  ];
  const normalizationNotes: EmailValidationIssueCode[] = ["trimmedWhitespace", "domainIdnNormalized"];

  return [
    {
      id: "input",
      status: status === "empty" ? "info" : hasAnyIssue(issues, inputFailures) ? "fail" : hasAnyIssue(issues, inputWarnings) ? "warn" : "pass",
      issueCodes: status === "empty" ? ["empty"] : getIssueCodes(issues, [...inputFailures, ...inputWarnings]),
    },
    {
      id: "atSign",
      status: hasAnyIssue(issues, atFailures) ? "fail" : "pass",
      issueCodes: getIssueCodes(issues, atFailures),
    },
    {
      id: "localPart",
      status: hasAnyIssue(issues, localFailures) ? "fail" : hasAnyIssue(issues, localWarnings) ? "warn" : "pass",
      issueCodes: getIssueCodes(issues, [...localFailures, ...localWarnings]),
    },
    {
      id: "domain",
      status: hasAnyIssue(issues, domainFailures)
        ? "fail"
        : hasAnyIssue(issues, domainNotes)
          ? "info"
          : "pass",
      issueCodes: getIssueCodes(issues, [...domainFailures, ...domainNotes]),
    },
    {
      id: "unsupportedSyntax",
      status: hasAnyIssue(issues, unsupportedFailures) ? "fail" : "pass",
      issueCodes: getIssueCodes(issues, unsupportedFailures),
    },
    {
      id: "normalization",
      status: hasAnyIssue(issues, normalizationNotes) ? "info" : "pass",
      issueCodes: getIssueCodes(issues, normalizationNotes),
    },
    {
      id: "privacy",
      status: "info",
      issueCodes: ["syntaxOnly"],
    },
  ];
}

export function normalizeEmailValidatorMode(value: string | null | undefined): EmailValidatorMode {
  return value && emailValidatorModes.has(value as EmailValidatorMode) ? (value as EmailValidatorMode) : "comum";
}

export function validateEmailSyntax(input: string): EmailValidationResult {
  const issues: EmailValidationIssueCode[] = [];
  const trimmedInput = trimAsciiWhitespace(input);

  if (trimmedInput.length === 0) {
    return {
      status: "empty",
      input,
      trimmedInput,
      normalizedEmail: null,
      localPart: null,
      domain: null,
      asciiDomain: null,
      issues: ["empty"],
      diagnostics: buildDiagnostics(["empty"], "empty"),
    };
  }

  if (input !== trimmedInput) {
    addIssue(issues, "trimmedWhitespace");
  }

  if (trimmedInput.length > EMAIL_VALIDATOR_MAX_INPUT_LENGTH) {
    addIssue(issues, "inputTooLong");
  }

  if (/[\u0000-\u001f\u007f]/.test(trimmedInput)) {
    addIssue(issues, "asciiControl");
  }

  if (/[\t\n\f\r ]/.test(trimmedInput)) {
    addIssue(issues, "internalWhitespace");
  }

  const atMatches = trimmedInput.match(/@/g) ?? [];
  if (atMatches.length === 0) {
    addIssue(issues, "missingAt");
  } else if (atMatches.length > 1) {
    addIssue(issues, "multipleAt");
  }

  const [localPart = "", domain = ""] = atMatches.length === 1 ? trimmedInput.split("@") : ["", ""];
  detectUnsupportedSyntax(trimmedInput, domain || null, issues);

  let asciiDomain: string | null = null;
  if (atMatches.length === 1) {
    validateLocalPart(localPart, issues);
    asciiDomain = validateDomain(domain, issues);
  }

  const status: EmailValidationStatus = hasErrorIssue(issues) ? "invalid" : hasWarningIssue(issues) ? "attention" : "valid";
  const normalizedEmail = (status === "valid" || status === "attention") && asciiDomain ? `${localPart}@${asciiDomain}` : null;

  return {
    status,
    input,
    trimmedInput,
    normalizedEmail,
    localPart: atMatches.length === 1 ? localPart : null,
    domain: atMatches.length === 1 ? domain : null,
    asciiDomain,
    issues,
    diagnostics: buildDiagnostics(issues, status),
  };
}

export function readEmailValidatorStateFromParams(params: URLSearchParams): EmailValidatorState {
  return {
    email: defaultEmailValidatorState.email,
    mode: normalizeEmailValidatorMode(params.get("modo")),
  };
}

export function readEmailValidatorContentFromFragment(fragment: string): EmailValidatorContentFragmentState {
  const normalizedFragment = fragment.startsWith("#") ? fragment.slice(1) : fragment;
  const params = new URLSearchParams(normalizedFragment);
  const hasExplicitContent = params.get("conteudo") === "1";

  return {
    hasExplicitContent,
    email: hasExplicitContent ? params.get("email") ?? "" : defaultEmailValidatorState.email,
  };
}

export function buildEmailValidatorSearchParams(state: EmailValidatorState): EmailValidatorSearchParamsResult {
  const params = new URLSearchParams();
  const mode = normalizeEmailValidatorMode(state.mode);

  if (mode !== defaultEmailValidatorState.mode) {
    params.set("modo", mode);
  }

  return {
    params,
    queryLength: params.toString().length,
  };
}

export function buildEmailValidatorContentFragmentParams(
  state: EmailValidatorState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): EmailValidatorContentFragmentResult {
  const params = new URLSearchParams();
  const maxFragmentLength = options.maxFragmentLength ?? EMAIL_VALIDATOR_SHARE_FRAGMENT_LIMIT;

  if (!options.includeContent) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: 0,
    };
  }

  params.set("conteudo", "1");

  if (state.email.length === 0) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: params.toString().length,
    };
  }

  params.set("email", state.email);

  if (params.toString().length <= maxFragmentLength) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: params.toString().length,
    };
  }

  params.delete("email");

  return {
    params,
    contentOmitted: true,
    fragmentLength: params.toString().length,
  };
}

export function buildEmailValidatorShareUrl(
  baseUrl: string,
  state: EmailValidatorState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): EmailValidatorShareUrlResult {
  const searchResult = buildEmailValidatorSearchParams(state);
  const fragmentResult = buildEmailValidatorContentFragmentParams(state, options);
  const query = searchResult.params.toString();
  const fragment = fragmentResult.params.toString();

  return {
    url: `${baseUrl}${query ? `?${query}` : ""}${fragment ? `#${fragment}` : ""}`,
    searchParams: searchResult.params,
    fragmentParams: fragmentResult.params,
    contentOmitted: fragmentResult.contentOmitted,
  };
}

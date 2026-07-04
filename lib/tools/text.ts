export const CHARACTER_LIMIT_MIN = 1;
export const CHARACTER_LIMIT_MAX = 1_000_000;
export const CHARACTER_COUNTER_SHARE_QUERY_LIMIT = 1_800;
export const TEXT_CASE_MAX_INPUT_LENGTH = 500_000;
export const TEXT_CASE_SHARE_FRAGMENT_LIMIT = 1_800;
export const SLUG_GENERATOR_MAX_INPUT_LENGTH = 500_000;
export const SLUG_GENERATOR_MAX_OUTPUT_LENGTH = 200;
export const SLUG_GENERATOR_SHARE_FRAGMENT_LIMIT = 1_800;
export const ACCENT_REMOVAL_MAX_INPUT_LENGTH = 500_000;
export const ACCENT_REMOVAL_SHARE_FRAGMENT_LIMIT = 1_800;

export const textCaseModes = [
  "maiusculas",
  "minusculas",
  "frase",
  "titulo",
  "capitalizar-palavras",
  "alternado",
  "inverter",
] as const;

export const slugSeparatorModes = ["hifen", "underscore", "nenhum"] as const;
export const accentRemovalModes = ["acentos", "compatibilidade"] as const;

export type TextCaseMode = (typeof textCaseModes)[number];
export type TextCaseStatus = "empty" | "converted" | "tooLarge";
export type TextCaseWarning = "titleCaseApproximation" | "largeInput" | "noLetterChanges";
export type SlugSeparatorMode = (typeof slugSeparatorModes)[number];
export type SlugGeneratorStatus = "empty" | "generated" | "emptyAfterNormalization" | "tooLarge";
export type SlugGeneratorWarning =
  | "accentApproximation"
  | "unsupportedCharactersRemoved"
  | "trimmedToLimit"
  | "emptyAfterNormalization"
  | "tooLarge"
  | "noChanges";
export type AccentRemovalMode = (typeof accentRemovalModes)[number];
export type AccentRemovalStatus = "empty" | "converted" | "unchanged" | "tooLarge";
export type AccentRemovalWarning =
  | "noAccentMarks"
  | "largeInput"
  | "compatibilityMode"
  | "limitedTransliteration";

export interface TextLimitResult {
  limit: number;
  used: number;
  remaining: number;
  exceeded: number;
  percentUsed: number;
  isExceeded: boolean;
}

export interface TextAnalysisResult {
  characters: number;
  charactersWithoutWhitespace: number;
  words: number;
  sentences: number;
  lines: number;
  nonEmptyLines: number;
  paragraphs: number;
  bytes: number;
  limit: TextLimitResult | null;
}

export interface TextAnalysisOptions {
  locale?: string;
  limit?: number | string | null;
}

export interface CharacterCounterState {
  text: string;
  limitInput: string;
}

export interface CharacterCounterSearchParamsResult {
  params: URLSearchParams;
  contentOmitted: boolean;
  queryLength: number;
}

export interface TextCaseState {
  text: string;
  mode: TextCaseMode;
  preserveLineBreaks: boolean;
}

export interface TextCaseMetrics {
  characters: number;
  bytes: number;
}

export type SlugGeneratorMetrics = TextCaseMetrics;

export interface TextCaseResult {
  status: TextCaseStatus;
  output: string;
  modeApplied: TextCaseMode;
  inputMetrics: TextCaseMetrics;
  outputMetrics: TextCaseMetrics;
  changedCharacters: number;
  warnings: TextCaseWarning[];
}

export interface TextCaseSearchParamsResult {
  params: URLSearchParams;
  queryLength: number;
}

export interface TextCaseContentFragmentResult {
  params: URLSearchParams;
  contentOmitted: boolean;
  fragmentLength: number;
}

export interface TextCaseContentFragmentState {
  hasExplicitContent: boolean;
  text: string;
}

export interface TextCaseShareUrlResult {
  url: string;
  searchParams: URLSearchParams;
  fragmentParams: URLSearchParams;
  contentOmitted: boolean;
}

export interface SlugGeneratorState {
  text: string;
  separator: SlugSeparatorMode;
  lowercase: boolean;
  maxLengthInput: string;
}

export interface SlugGeneratorModeApplied {
  separator: SlugSeparatorMode;
  lowercase: boolean;
  maxLength: number | null;
}

export interface SlugGeneratorResult {
  status: SlugGeneratorStatus;
  slug: string;
  pathSegment: string;
  modeApplied: SlugGeneratorModeApplied;
  inputMetrics: SlugGeneratorMetrics;
  outputMetrics: SlugGeneratorMetrics;
  removedCharacters: number;
  warnings: SlugGeneratorWarning[];
}

export interface SlugGeneratorSearchParamsResult {
  params: URLSearchParams;
  queryLength: number;
}

export interface SlugGeneratorContentFragmentResult {
  params: URLSearchParams;
  contentOmitted: boolean;
  fragmentLength: number;
}

export interface SlugGeneratorContentFragmentState {
  hasExplicitContent: boolean;
  text: string;
}

export interface SlugGeneratorShareUrlResult {
  url: string;
  searchParams: URLSearchParams;
  fragmentParams: URLSearchParams;
  contentOmitted: boolean;
}

export interface AccentRemovalState {
  text: string;
  mode: AccentRemovalMode;
}

export interface AccentRemovalMetrics {
  characters: number;
  bytes: number;
}

export interface AccentRemovalResult {
  status: AccentRemovalStatus;
  output: string;
  modeApplied: AccentRemovalMode;
  inputMetrics: AccentRemovalMetrics;
  outputMetrics: AccentRemovalMetrics;
  changedCharacters: number;
  removedMarks: number;
  warnings: AccentRemovalWarning[];
}

export interface AccentRemovalSearchParamsResult {
  params: URLSearchParams;
  queryLength: number;
}

export interface AccentRemovalContentFragmentResult {
  params: URLSearchParams;
  contentOmitted: boolean;
  fragmentLength: number;
}

export interface AccentRemovalContentFragmentState {
  hasExplicitContent: boolean;
  text: string;
}

export interface AccentRemovalShareUrlResult {
  url: string;
  searchParams: URLSearchParams;
  fragmentParams: URLSearchParams;
  contentOmitted: boolean;
}

export const defaultCharacterCounterState: CharacterCounterState = {
  text: "",
  limitInput: "",
};

export const defaultTextCaseState: TextCaseState = {
  text: "",
  mode: "maiusculas",
  preserveLineBreaks: true,
};

export const defaultSlugGeneratorState: SlugGeneratorState = {
  text: "",
  separator: "hifen",
  lowercase: true,
  maxLengthInput: "",
};

export const defaultAccentRemovalState: AccentRemovalState = {
  text: "",
  mode: "acentos",
};

const whitespaceRegex = /^\s+$/u;
const plainIntegerStringRegex = /^\d+$/u;
const fallbackWordRegex = /(?:[\p{L}\p{N}]\p{M}*)+(?:['’-](?:[\p{L}\p{N}]\p{M}*)+)*/gu;
const fallbackSentenceRegex = /[^.!?…]+[.!?…]+|[^.!?…]+$/gu;
const casedLetterRegex = /\p{Ll}|\p{Lu}|\p{Lt}/u;
const letterRegex = /\p{L}/u;
const wordTokenRegex = /(?:[\p{L}\p{N}]\p{M}*)+(?:['’-](?:[\p{L}\p{N}]\p{M}*)+)*/gu;
const sentenceBoundaryRegex = /[.!?…]/u;
const lineBreakRegex = /\r\n?|\n/g;
const combiningDiacriticalMarkRegex = /[\u0300-\u036f\u1ab0-\u1aff\u1dc0-\u1dff\ufe20-\ufe2f]/gu;
const textCaseModeSet = new Set<TextCaseMode>(textCaseModes);
const slugSeparatorModeSet = new Set<SlugSeparatorMode>(slugSeparatorModes);
const asciiAlphanumericRegex = /^[A-Za-z0-9]$/u;
const combiningMarkRegex = /\p{M}/gu;
const combiningMarkCharacterRegex = /^\p{M}$/u;
const decimalDigitCharacterRegex = /^\p{Nd}$/u;
const emojiBoundaryRegex = /[\u20e3\ufe0f]|\p{Extended_Pictographic}/u;
const latinLetterCharacterRegex = /^(?=\p{L}$)\p{Script=Latin}$/u;
const accentRemovalModeSet = new Set<AccentRemovalMode>(accentRemovalModes);
const titleCaseConnectorWords: Record<string, Set<string>> = {
  "pt-br": new Set(["a", "as", "o", "os", "ao", "aos", "à", "às", "de", "da", "do", "das", "dos", "e", "em", "para", "por", "com", "sem"]),
  pt: new Set(["a", "as", "o", "os", "ao", "aos", "à", "às", "de", "da", "do", "das", "dos", "e", "em", "para", "por", "com", "sem"]),
  en: new Set(["a", "an", "and", "as", "at", "but", "by", "for", "in", "of", "on", "or", "the", "to", "vs", "via"]),
  es: new Set(["a", "al", "de", "del", "el", "la", "las", "los", "y", "e", "en", "para", "por", "con", "sin", "o"]),
};
const slugLatinFallbackMap: Record<string, string> = {
  ß: "ss",
  ẞ: "SS",
  æ: "ae",
  Æ: "AE",
  œ: "oe",
  Œ: "OE",
  ø: "o",
  Ø: "O",
  đ: "d",
  Đ: "D",
  ł: "l",
  Ł: "L",
  þ: "th",
  Þ: "TH",
  ð: "d",
  Ð: "D",
  ħ: "h",
  Ħ: "H",
};

function getTextEncoder() {
  return new TextEncoder();
}

function getSegmenter(locale: string | undefined, granularity: Intl.SegmenterOptions["granularity"]) {
  if (typeof Intl === "undefined" || typeof Intl.Segmenter === "undefined") {
    return null;
  }

  return new Intl.Segmenter(locale, { granularity });
}

function getGraphemes(value: string, locale?: string): string[] {
  const segmenter = getSegmenter(locale, "grapheme");
  if (!segmenter) return Array.from(value);

  return Array.from(segmenter.segment(value), (segment) => segment.segment);
}

function safeLocaleUpper(value: string, locale?: string): string {
  try {
    return value.toLocaleUpperCase(locale || undefined);
  } catch {
    return value.toUpperCase();
  }
}

function safeLocaleLower(value: string, locale?: string): string {
  try {
    return value.toLocaleLowerCase(locale || undefined);
  } catch {
    return value.toLowerCase();
  }
}

function hasCasedLetter(value: string): boolean {
  return casedLetterRegex.test(value);
}

function getTextCaseMetrics(value: string, locale?: string): TextCaseMetrics {
  return {
    characters: getGraphemes(value, locale).length,
    bytes: getUtf8ByteLength(value),
  };
}

function getCheapTextCaseMetrics(value: string): TextCaseMetrics {
  return {
    characters: value.length,
    bytes: getUtf8ByteLength(value),
  };
}

function getAccentRemovalMetrics(value: string, locale?: string): AccentRemovalMetrics {
  return {
    characters: getGraphemes(value, locale).length,
    bytes: getUtf8ByteLength(value),
  };
}

function getCheapAccentRemovalMetrics(value: string): AccentRemovalMetrics {
  return {
    characters: value.length,
    bytes: getUtf8ByteLength(value),
  };
}

function prepareTextCaseInput(value: string, preserveLineBreaks: boolean): string {
  return preserveLineBreaks ? value : value.replace(lineBreakRegex, " ");
}

function capitalizeFirstCasedGrapheme(value: string, locale?: string): string {
  const graphemes = getGraphemes(value, locale);
  const index = graphemes.findIndex(hasCasedLetter);
  if (index === -1) return value;

  graphemes[index] = safeLocaleUpper(graphemes[index], locale);
  return graphemes.join("");
}

function transformWordTokens(value: string, transform: (word: string, index: number, words: RegExpMatchArray[]) => string) {
  const words = Array.from(value.matchAll(wordTokenRegex));
  if (words.length === 0) return value;

  let output = "";
  let cursor = 0;

  words.forEach((word, index) => {
    const start = word.index ?? cursor;
    output += value.slice(cursor, start);
    output += transform(word[0], index, words);
    cursor = start + word[0].length;
  });

  return output + value.slice(cursor);
}

function getConnectorWords(locale?: string): Set<string> {
  const normalizedLocale = (locale || "").toLocaleLowerCase();

  if (normalizedLocale.startsWith("pt")) return titleCaseConnectorWords["pt-br"];
  if (normalizedLocale.startsWith("es")) return titleCaseConnectorWords.es;
  if (normalizedLocale.startsWith("en")) return titleCaseConnectorWords.en;

  return titleCaseConnectorWords["pt-br"];
}

function sentenceCaseText(value: string, locale?: string): string {
  const lower = safeLocaleLower(value, locale);
  const graphemes = getGraphemes(lower, locale);
  let shouldCapitalize = true;

  return graphemes
    .map((grapheme) => {
      if (grapheme.includes("\n") || grapheme.includes("\r")) {
        shouldCapitalize = true;
        return grapheme;
      }

      if (hasCasedLetter(grapheme)) {
        if (!shouldCapitalize) return grapheme;

        shouldCapitalize = false;
        return safeLocaleUpper(grapheme, locale);
      }

      if (sentenceBoundaryRegex.test(grapheme)) {
        shouldCapitalize = true;
      }

      return grapheme;
    })
    .join("");
}

function titleCaseText(value: string, locale?: string): string {
  const lower = safeLocaleLower(value, locale);
  const connectorWords = getConnectorWords(locale);

  return transformWordTokens(lower, (word, index, words) => {
    const isFirstOrLast = index === 0 || index === words.length - 1;
    const normalizedWord = safeLocaleLower(word, locale);
    const connectorLookupKey = normalizedWord.normalize("NFC");

    if (!isFirstOrLast && connectorWords.has(connectorLookupKey)) {
      return normalizedWord;
    }

    return capitalizeFirstCasedGrapheme(word, locale);
  });
}

function capitalizeWordsText(value: string, locale?: string): string {
  const lower = safeLocaleLower(value, locale);
  return transformWordTokens(lower, (word) => capitalizeFirstCasedGrapheme(word, locale));
}

function alternateCaseText(value: string, locale?: string): string {
  let useUppercase = true;

  return getGraphemes(value, locale)
    .map((grapheme) => {
      if (!hasCasedLetter(grapheme)) return grapheme;

      const next = useUppercase ? safeLocaleUpper(grapheme, locale) : safeLocaleLower(grapheme, locale);
      useUppercase = !useUppercase;
      return next;
    })
    .join("");
}

function invertCaseText(value: string, locale?: string): string {
  return getGraphemes(value, locale)
    .map((grapheme) => {
      if (!hasCasedLetter(grapheme)) return grapheme;

      const upper = safeLocaleUpper(grapheme, locale);
      const lower = safeLocaleLower(grapheme, locale);

      return grapheme === upper && grapheme !== lower ? lower : upper;
    })
    .join("");
}

function countChangedGraphemes(input: string, output: string, locale?: string): number {
  const inputGraphemes = getGraphemes(input, locale);
  const outputGraphemes = getGraphemes(output, locale);
  const maxLength = Math.max(inputGraphemes.length, outputGraphemes.length);
  let changed = 0;

  for (let index = 0; index < maxLength; index += 1) {
    if ((inputGraphemes[index] ?? "") !== (outputGraphemes[index] ?? "")) {
      changed += 1;
    }
  }

  return changed;
}

function removeCombiningDiacriticalMarks(value: string) {
  let removedMarks = 0;
  const output = value.replace(combiningDiacriticalMarkRegex, () => {
    removedMarks += 1;
    return "";
  });

  return { output, removedMarks };
}

function hasNonAsciiLetter(value: string): boolean {
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;

    if (codePoint > 0x7f && letterRegex.test(character)) {
      return true;
    }
  }

  return false;
}

function countWords(value: string, locale?: string): number {
  if (!value.trim()) return 0;

  const segmenter = getSegmenter(locale, "word");
  if (segmenter) {
    return Array.from(segmenter.segment(value)).filter((segment) => segment.isWordLike).length;
  }

  return value.match(fallbackWordRegex)?.length ?? 0;
}

function countSentences(value: string, locale?: string): number {
  if (!value.trim()) return 0;

  const segmenter = getSegmenter(locale, "sentence");
  if (segmenter) {
    return Array.from(segmenter.segment(value)).filter((segment) => segment.segment.trim().length > 0).length;
  }

  return value.match(fallbackSentenceRegex)?.filter((sentence) => sentence.trim().length > 0).length ?? 0;
}

function getNormalizedLines(value: string): string[] {
  if (value.length === 0) return [];

  return value.replace(/\r\n?/g, "\n").split("\n");
}

function countParagraphs(value: string): number {
  const normalized = value.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return 0;

  return normalized.split(/\n\s*\n+/u).filter((block) => block.trim().length > 0).length;
}

export function normalizeCharacterLimit(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) return null;

    return Math.min(CHARACTER_LIMIT_MAX, Math.max(CHARACTER_LIMIT_MIN, value));
  }

  const trimmed = value.trim();
  if (!plainIntegerStringRegex.test(trimmed)) return null;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  return Math.min(CHARACTER_LIMIT_MAX, Math.max(CHARACTER_LIMIT_MIN, parsed));
}

export function getUtf8ByteLength(value: string): number {
  return getTextEncoder().encode(value).length;
}

export function analyzeText(value: string, options: TextAnalysisOptions = {}): TextAnalysisResult {
  const graphemes = getGraphemes(value, options.locale);
  const lines = getNormalizedLines(value);
  const characters = graphemes.length;
  const limit = normalizeCharacterLimit(options.limit);
  const limitResult =
    limit === null
      ? null
      : {
          limit,
          used: characters,
          remaining: Math.max(limit - characters, 0),
          exceeded: Math.max(characters - limit, 0),
          percentUsed: (characters / limit) * 100,
          isExceeded: characters > limit,
        };

  return {
    characters,
    charactersWithoutWhitespace: graphemes.filter((grapheme) => !whitespaceRegex.test(grapheme)).length,
    words: countWords(value, options.locale),
    sentences: countSentences(value, options.locale),
    lines: lines.length,
    nonEmptyLines: lines.filter((line) => line.trim().length > 0).length,
    paragraphs: countParagraphs(value),
    bytes: getUtf8ByteLength(value),
    limit: limitResult,
  };
}

export function normalizeTextCaseMode(value: string | null | undefined): TextCaseMode {
  return value && textCaseModeSet.has(value as TextCaseMode) ? (value as TextCaseMode) : defaultTextCaseState.mode;
}

export function normalizeAccentRemovalMode(value: string | null | undefined): AccentRemovalMode {
  return value && accentRemovalModeSet.has(value as AccentRemovalMode)
    ? (value as AccentRemovalMode)
    : defaultAccentRemovalState.mode;
}

export function readTextCaseBoolean(value: string | null, defaultValue: boolean): boolean {
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return defaultValue;
}

export function convertAccentRemoval(
  input: string,
  options: { mode?: string | null; locale?: string; maxInputLength?: number } = {}
): AccentRemovalResult {
  const mode = normalizeAccentRemovalMode(options.mode);
  const maxInputLength = options.maxInputLength ?? ACCENT_REMOVAL_MAX_INPUT_LENGTH;

  if (input.length > maxInputLength) {
    return {
      status: "tooLarge",
      output: "",
      modeApplied: mode,
      inputMetrics: getCheapAccentRemovalMetrics(input),
      outputMetrics: { characters: 0, bytes: 0 },
      changedCharacters: 0,
      removedMarks: 0,
      warnings: ["largeInput"],
    };
  }

  const inputMetrics = getAccentRemovalMetrics(input, options.locale);

  if (input.length === 0) {
    return {
      status: "empty",
      output: "",
      modeApplied: mode,
      inputMetrics,
      outputMetrics: inputMetrics,
      changedCharacters: 0,
      removedMarks: 0,
      warnings: [],
    };
  }

  const normalizationForm = mode === "compatibilidade" ? "NFKD" : "NFD";
  const decomposedInput = input.normalize(normalizationForm);
  const removed = removeCombiningDiacriticalMarks(decomposedInput);
  const output = removed.output.normalize("NFC");
  const warnings: AccentRemovalWarning[] = [];

  if (mode === "compatibilidade") warnings.push("compatibilityMode");
  if (output === input) warnings.push("noAccentMarks");
  if (hasNonAsciiLetter(output)) warnings.push("limitedTransliteration");

  return {
    status: output === input ? "unchanged" : "converted",
    output,
    modeApplied: mode,
    inputMetrics,
    outputMetrics: getAccentRemovalMetrics(output, options.locale),
    changedCharacters: countChangedGraphemes(input, output, options.locale),
    removedMarks: removed.removedMarks,
    warnings,
  };
}

export function convertTextCase(
  input: string,
  options: { mode?: string | null; preserveLineBreaks?: boolean; locale?: string; maxInputLength?: number } = {}
): TextCaseResult {
  const mode = normalizeTextCaseMode(options.mode);
  const preserveLineBreaks = options.preserveLineBreaks ?? defaultTextCaseState.preserveLineBreaks;
  const maxInputLength = options.maxInputLength ?? TEXT_CASE_MAX_INPUT_LENGTH;

  if (input.length > maxInputLength) {
    const inputMetrics = getCheapTextCaseMetrics(input);

    return {
      status: "tooLarge",
      output: "",
      modeApplied: mode,
      inputMetrics,
      outputMetrics: { characters: 0, bytes: 0 },
      changedCharacters: 0,
      warnings: ["largeInput"],
    };
  }

  const preparedInput = prepareTextCaseInput(input, preserveLineBreaks);
  const inputMetrics = getTextCaseMetrics(input, options.locale);

  if (input.length === 0) {
    return {
      status: "empty",
      output: "",
      modeApplied: mode,
      inputMetrics,
      outputMetrics: inputMetrics,
      changedCharacters: 0,
      warnings: [],
    };
  }

  let output: string;

  switch (mode) {
    case "minusculas":
      output = safeLocaleLower(preparedInput, options.locale);
      break;
    case "frase":
      output = sentenceCaseText(preparedInput, options.locale);
      break;
    case "titulo":
      output = titleCaseText(preparedInput, options.locale);
      break;
    case "capitalizar-palavras":
      output = capitalizeWordsText(preparedInput, options.locale);
      break;
    case "alternado":
      output = alternateCaseText(preparedInput, options.locale);
      break;
    case "inverter":
      output = invertCaseText(preparedInput, options.locale);
      break;
    case "maiusculas":
    default:
      output = safeLocaleUpper(preparedInput, options.locale);
      break;
  }

  const warnings: TextCaseWarning[] = [];
  if (mode === "titulo") warnings.push("titleCaseApproximation");
  if (output === preparedInput) warnings.push("noLetterChanges");

  return {
    status: "converted",
    output,
    modeApplied: mode,
    inputMetrics,
    outputMetrics: getTextCaseMetrics(output, options.locale),
    changedCharacters: countChangedGraphemes(preparedInput, output, options.locale),
    warnings,
  };
}

export function normalizeSlugSeparator(value: string | null | undefined): SlugSeparatorMode {
  return value && slugSeparatorModeSet.has(value as SlugSeparatorMode)
    ? (value as SlugSeparatorMode)
    : defaultSlugGeneratorState.separator;
}

export function normalizeSlugMaxLength(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number") {
    if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) return null;

    return Math.min(SLUG_GENERATOR_MAX_OUTPUT_LENGTH, Math.max(1, value));
  }

  const trimmed = value.trim();
  if (!plainIntegerStringRegex.test(trimmed)) return null;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  return Math.min(SLUG_GENERATOR_MAX_OUTPUT_LENGTH, Math.max(1, parsed));
}

function getSlugSeparatorCharacter(separator: SlugSeparatorMode): "-" | "_" | "" {
  if (separator === "underscore") return "_";
  if (separator === "nenhum") return "";
  return "-";
}

function canNormalizeSlugGrapheme(grapheme: string): boolean {
  return Array.from(grapheme).every(
    (character) =>
      latinLetterCharacterRegex.test(character) ||
      decimalDigitCharacterRegex.test(character) ||
      combiningMarkCharacterRegex.test(character)
  );
}

function mapSlugGrapheme(grapheme: string): {
  characters: string[];
  accentApproximation: boolean;
  boundary: boolean;
  unsupportedCharactersRemoved: boolean;
} {
  if (emojiBoundaryRegex.test(grapheme)) {
    return {
      characters: [],
      accentApproximation: false,
      boundary: true,
      unsupportedCharactersRemoved: true,
    };
  }

  let mapped = "";
  let usedFallbackMap = false;
  const decomposed = canNormalizeSlugGrapheme(grapheme) ? grapheme.normalize("NFKD") : grapheme;

  for (const character of Array.from(decomposed)) {
    const fallback = slugLatinFallbackMap[character];

    if (fallback) {
      mapped += fallback;
      usedFallbackMap = true;
    } else {
      mapped += character;
    }
  }

  const withoutMarks = mapped.replace(combiningMarkRegex, "");
  const removedMarks = withoutMarks !== mapped;
  const characters: string[] = [];
  let boundary = false;
  let unsupportedCharactersRemoved = false;

  for (const character of Array.from(withoutMarks)) {
    if (asciiAlphanumericRegex.test(character)) {
      characters.push(character);
      continue;
    }

    boundary = true;
    if (!whitespaceRegex.test(character)) {
      unsupportedCharactersRemoved = true;
    }
  }

  return {
    characters,
    accentApproximation: (removedMarks || usedFallbackMap) && characters.length > 0,
    boundary: boundary || characters.length === 0,
    unsupportedCharactersRemoved,
  };
}

function appendSlugBoundary(output: string, separatorCharacter: "-" | "_" | "") {
  if (!separatorCharacter || output.length === 0 || output.endsWith(separatorCharacter)) return output;

  return `${output}${separatorCharacter}`;
}

function trimSlugSeparators(value: string, separatorCharacter: "-" | "_" | "") {
  if (!separatorCharacter) return value;

  let output = value;
  while (output.startsWith(separatorCharacter)) output = output.slice(1);
  while (output.endsWith(separatorCharacter)) output = output.slice(0, -1);
  return output;
}

function trimSlugToMaxLength(value: string, maxLength: number | null, separatorCharacter: "-" | "_" | ""): string {
  if (maxLength === null || value.length <= maxLength) return value;

  const rawTrimmed = value.slice(0, maxLength);
  const hardTrimmed = trimSlugSeparators(rawTrimmed, separatorCharacter);
  if (!separatorCharacter || hardTrimmed.length === 0) return hardTrimmed;
  if (rawTrimmed.endsWith(separatorCharacter)) return hardTrimmed;

  const lastSeparatorIndex = hardTrimmed.lastIndexOf(separatorCharacter);
  if (lastSeparatorIndex > 0) {
    const wordBoundaryTrimmed = trimSlugSeparators(hardTrimmed.slice(0, lastSeparatorIndex), separatorCharacter);
    if (wordBoundaryTrimmed.length > 0) return wordBoundaryTrimmed;
  }

  return hardTrimmed;
}

export function generateSlug(
  input: string,
  options: {
    separator?: string | null;
    lowercase?: boolean;
    maxLength?: number | string | null;
    locale?: string;
    maxInputLength?: number;
  } = {}
): SlugGeneratorResult {
  const separator = normalizeSlugSeparator(options.separator);
  const separatorCharacter = getSlugSeparatorCharacter(separator);
  const lowercase = options.lowercase ?? defaultSlugGeneratorState.lowercase;
  const maxLength = normalizeSlugMaxLength(options.maxLength);
  const modeApplied: SlugGeneratorModeApplied = { separator, lowercase, maxLength };
  const maxInputLength = options.maxInputLength ?? SLUG_GENERATOR_MAX_INPUT_LENGTH;

  if (input.length > maxInputLength) {
    return {
      status: "tooLarge",
      slug: "",
      pathSegment: "",
      modeApplied,
      inputMetrics: getCheapTextCaseMetrics(input),
      outputMetrics: { characters: 0, bytes: 0 },
      removedCharacters: 0,
      warnings: ["tooLarge"],
    };
  }

  const inputMetrics = getTextCaseMetrics(input, options.locale);
  if (input.length === 0) {
    return {
      status: "empty",
      slug: "",
      pathSegment: "",
      modeApplied,
      inputMetrics,
      outputMetrics: { characters: 0, bytes: 0 },
      removedCharacters: 0,
      warnings: [],
    };
  }

  const preparedInput = lowercase ? safeLocaleLower(input, options.locale) : input;
  let output = "";
  let hasPendingBoundary = false;
  let accentApproximation = false;
  let unsupportedCharactersRemoved = false;

  for (const grapheme of getGraphemes(preparedInput, options.locale)) {
    const mapped = mapSlugGrapheme(grapheme);

    if (mapped.characters.length > 0) {
      if (hasPendingBoundary) {
        output = appendSlugBoundary(output, separatorCharacter);
      }
      output += mapped.characters.join("");
      hasPendingBoundary = false;
    } else if (mapped.boundary) {
      hasPendingBoundary = output.length > 0;
    }

    accentApproximation ||= mapped.accentApproximation;
    unsupportedCharactersRemoved ||= mapped.unsupportedCharactersRemoved;
  }

  const untrimmedSlug = trimSlugSeparators(output, separatorCharacter);
  const slug = trimSlugToMaxLength(untrimmedSlug, maxLength, separatorCharacter);
  const outputMetrics = getTextCaseMetrics(slug, options.locale);
  const warnings: SlugGeneratorWarning[] = [];
  const status: SlugGeneratorStatus = slug.length > 0 ? "generated" : "emptyAfterNormalization";

  if (accentApproximation) warnings.push("accentApproximation");
  if (unsupportedCharactersRemoved) warnings.push("unsupportedCharactersRemoved");
  if (maxLength !== null && slug !== untrimmedSlug) warnings.push("trimmedToLimit");
  if (status === "emptyAfterNormalization") warnings.push("emptyAfterNormalization");
  if (status === "generated" && slug === input) warnings.push("noChanges");

  return {
    status,
    slug,
    pathSegment: slug ? `/${slug}` : "",
    modeApplied,
    inputMetrics,
    outputMetrics,
    removedCharacters: Math.max(inputMetrics.characters - outputMetrics.characters, 0),
    warnings,
  };
}

export function readSlugGeneratorStateFromParams(params: URLSearchParams): SlugGeneratorState {
  const maxLength = normalizeSlugMaxLength(params.get("max"));

  return {
    text: defaultSlugGeneratorState.text,
    separator: normalizeSlugSeparator(params.get("sep")),
    lowercase: readTextCaseBoolean(params.get("minusculas"), defaultSlugGeneratorState.lowercase),
    maxLengthInput: maxLength === null ? defaultSlugGeneratorState.maxLengthInput : String(maxLength),
  };
}

export function readSlugGeneratorContentFromFragment(fragment: string): SlugGeneratorContentFragmentState {
  const normalizedFragment = fragment.startsWith("#") ? fragment.slice(1) : fragment;
  const params = new URLSearchParams(normalizedFragment);
  const hasExplicitContent = params.get("conteudo") === "1";

  return {
    hasExplicitContent,
    text: hasExplicitContent ? params.get("texto") ?? "" : defaultSlugGeneratorState.text,
  };
}

export function buildSlugGeneratorSearchParams(state: SlugGeneratorState): SlugGeneratorSearchParamsResult {
  const params = new URLSearchParams();
  const separator = normalizeSlugSeparator(state.separator);
  const maxLength = normalizeSlugMaxLength(state.maxLengthInput);

  if (separator !== defaultSlugGeneratorState.separator) {
    params.set("sep", separator);
  }

  if (maxLength !== null) {
    params.set("max", String(maxLength));
  }

  if (state.lowercase !== defaultSlugGeneratorState.lowercase) {
    params.set("minusculas", state.lowercase ? "1" : "0");
  }

  return {
    params,
    queryLength: params.toString().length,
  };
}

export function buildSlugGeneratorContentFragmentParams(
  state: SlugGeneratorState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): SlugGeneratorContentFragmentResult {
  const params = new URLSearchParams();
  const maxFragmentLength = options.maxFragmentLength ?? SLUG_GENERATOR_SHARE_FRAGMENT_LIMIT;

  if (!options.includeContent) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: 0,
    };
  }

  params.set("conteudo", "1");

  if (state.text.length === 0) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: params.toString().length,
    };
  }

  params.set("texto", state.text);

  if (params.toString().length <= maxFragmentLength) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: params.toString().length,
    };
  }

  params.delete("texto");

  return {
    params,
    contentOmitted: true,
    fragmentLength: params.toString().length,
  };
}

export function buildSlugGeneratorShareUrl(
  baseUrl: string,
  state: SlugGeneratorState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): SlugGeneratorShareUrlResult {
  const searchResult = buildSlugGeneratorSearchParams(state);
  const fragmentResult = buildSlugGeneratorContentFragmentParams(state, options);
  const query = searchResult.params.toString();
  const fragment = fragmentResult.params.toString();

  return {
    url: `${baseUrl}${query ? `?${query}` : ""}${fragment ? `#${fragment}` : ""}`,
    searchParams: searchResult.params,
    fragmentParams: fragmentResult.params,
    contentOmitted: fragmentResult.contentOmitted,
  };
}

export function readTextCaseStateFromParams(params: URLSearchParams): TextCaseState {
  return {
    text: defaultTextCaseState.text,
    mode: normalizeTextCaseMode(params.get("modo")),
    preserveLineBreaks: readTextCaseBoolean(params.get("preservarQuebras"), defaultTextCaseState.preserveLineBreaks),
  };
}

export function readTextCaseContentFromFragment(fragment: string): TextCaseContentFragmentState {
  const normalizedFragment = fragment.startsWith("#") ? fragment.slice(1) : fragment;
  const params = new URLSearchParams(normalizedFragment);
  const hasExplicitContent = params.get("conteudo") === "1";

  return {
    hasExplicitContent,
    text: hasExplicitContent ? params.get("texto") ?? "" : defaultTextCaseState.text,
  };
}

export function buildTextCaseSearchParams(state: TextCaseState): TextCaseSearchParamsResult {
  const params = new URLSearchParams();
  const mode = normalizeTextCaseMode(state.mode);

  if (mode !== defaultTextCaseState.mode) {
    params.set("modo", mode);
  }

  if (state.preserveLineBreaks !== defaultTextCaseState.preserveLineBreaks) {
    params.set("preservarQuebras", state.preserveLineBreaks ? "1" : "0");
  }

  return {
    params,
    queryLength: params.toString().length,
  };
}

export function buildTextCaseContentFragmentParams(
  state: TextCaseState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): TextCaseContentFragmentResult {
  const params = new URLSearchParams();
  const maxFragmentLength = options.maxFragmentLength ?? TEXT_CASE_SHARE_FRAGMENT_LIMIT;

  if (!options.includeContent) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: 0,
    };
  }

  params.set("conteudo", "1");

  if (state.text.length === 0) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: params.toString().length,
    };
  }

  params.set("texto", state.text);

  if (params.toString().length <= maxFragmentLength) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: params.toString().length,
    };
  }

  params.delete("texto");

  return {
    params,
    contentOmitted: true,
    fragmentLength: params.toString().length,
  };
}

export function buildTextCaseShareUrl(
  baseUrl: string,
  state: TextCaseState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): TextCaseShareUrlResult {
  const searchResult = buildTextCaseSearchParams(state);
  const fragmentResult = buildTextCaseContentFragmentParams(state, options);
  const query = searchResult.params.toString();
  const fragment = fragmentResult.params.toString();

  return {
    url: `${baseUrl}${query ? `?${query}` : ""}${fragment ? `#${fragment}` : ""}`,
    searchParams: searchResult.params,
    fragmentParams: fragmentResult.params,
    contentOmitted: fragmentResult.contentOmitted,
  };
}

export function readAccentRemovalStateFromParams(params: URLSearchParams): AccentRemovalState {
  return {
    text: defaultAccentRemovalState.text,
    mode: normalizeAccentRemovalMode(params.get("modo")),
  };
}

export function readAccentRemovalContentFromFragment(fragment: string): AccentRemovalContentFragmentState {
  const normalizedFragment = fragment.startsWith("#") ? fragment.slice(1) : fragment;
  const params = new URLSearchParams(normalizedFragment);
  const hasExplicitContent = params.get("conteudo") === "1";

  return {
    hasExplicitContent,
    text: hasExplicitContent ? params.get("texto") ?? "" : defaultAccentRemovalState.text,
  };
}

export function buildAccentRemovalSearchParams(state: AccentRemovalState): AccentRemovalSearchParamsResult {
  const params = new URLSearchParams();
  const mode = normalizeAccentRemovalMode(state.mode);

  if (mode !== defaultAccentRemovalState.mode) {
    params.set("modo", mode);
  }

  return {
    params,
    queryLength: params.toString().length,
  };
}

export function buildAccentRemovalContentFragmentParams(
  state: AccentRemovalState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): AccentRemovalContentFragmentResult {
  const params = new URLSearchParams();
  const maxFragmentLength = options.maxFragmentLength ?? ACCENT_REMOVAL_SHARE_FRAGMENT_LIMIT;

  if (!options.includeContent) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: 0,
    };
  }

  params.set("conteudo", "1");

  if (state.text.length === 0) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: params.toString().length,
    };
  }

  params.set("texto", state.text);

  if (params.toString().length <= maxFragmentLength) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: params.toString().length,
    };
  }

  params.delete("texto");

  return {
    params,
    contentOmitted: true,
    fragmentLength: params.toString().length,
  };
}

export function buildAccentRemovalShareUrl(
  baseUrl: string,
  state: AccentRemovalState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): AccentRemovalShareUrlResult {
  const searchResult = buildAccentRemovalSearchParams(state);
  const fragmentResult = buildAccentRemovalContentFragmentParams(state, options);
  const query = searchResult.params.toString();
  const fragment = fragmentResult.params.toString();

  return {
    url: `${baseUrl}${query ? `?${query}` : ""}${fragment ? `#${fragment}` : ""}`,
    searchParams: searchResult.params,
    fragmentParams: fragmentResult.params,
    contentOmitted: fragmentResult.contentOmitted,
  };
}

export function readCharacterCounterStateFromParams(params: URLSearchParams): CharacterCounterState {
  const limit = normalizeCharacterLimit(params.get("limite"));
  const hasExplicitContent = params.get("conteudo") === "1";

  return {
    text: hasExplicitContent ? params.get("texto") ?? "" : defaultCharacterCounterState.text,
    limitInput: limit === null ? defaultCharacterCounterState.limitInput : String(limit),
  };
}

export function buildCharacterCounterSearchParams(
  state: CharacterCounterState,
  options: { includeContent?: boolean; maxQueryLength?: number } = {}
): CharacterCounterSearchParamsResult {
  const params = new URLSearchParams();
  const limit = normalizeCharacterLimit(state.limitInput);
  const maxQueryLength = options.maxQueryLength ?? CHARACTER_COUNTER_SHARE_QUERY_LIMIT;

  if (limit !== null) {
    params.set("limite", String(limit));
  }

  if (!options.includeContent) {
    return {
      params,
      contentOmitted: false,
      queryLength: params.toString().length,
    };
  }

  params.set("conteudo", "1");

  if (state.text.length === 0) {
    return {
      params,
      contentOmitted: false,
      queryLength: params.toString().length,
    };
  }

  params.set("texto", state.text);

  if (params.toString().length <= maxQueryLength) {
    return {
      params,
      contentOmitted: false,
      queryLength: params.toString().length,
    };
  }

  params.delete("texto");

  return {
    params,
    contentOmitted: true,
    queryLength: params.toString().length,
  };
}

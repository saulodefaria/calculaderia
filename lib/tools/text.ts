export const CHARACTER_LIMIT_MIN = 1;
export const CHARACTER_LIMIT_MAX = 1_000_000;
export const CHARACTER_COUNTER_SHARE_QUERY_LIMIT = 1_800;
export const TEXT_CASE_MAX_INPUT_LENGTH = 500_000;
export const TEXT_CASE_SHARE_FRAGMENT_LIMIT = 1_800;
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

export const accentRemovalModes = ["acentos", "compatibilidade"] as const;

export type TextCaseMode = (typeof textCaseModes)[number];
export type TextCaseStatus = "empty" | "converted" | "tooLarge";
export type TextCaseWarning = "titleCaseApproximation" | "largeInput" | "noLetterChanges";
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
const accentRemovalModeSet = new Set<AccentRemovalMode>(accentRemovalModes);
const titleCaseConnectorWords: Record<string, Set<string>> = {
  "pt-br": new Set(["a", "as", "o", "os", "ao", "aos", "à", "às", "de", "da", "do", "das", "dos", "e", "em", "para", "por", "com", "sem"]),
  pt: new Set(["a", "as", "o", "os", "ao", "aos", "à", "às", "de", "da", "do", "das", "dos", "e", "em", "para", "por", "com", "sem"]),
  en: new Set(["a", "an", "and", "as", "at", "but", "by", "for", "in", "of", "on", "or", "the", "to", "vs", "via"]),
  es: new Set(["a", "al", "de", "del", "el", "la", "las", "los", "y", "e", "en", "para", "por", "con", "sin", "o"]),
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

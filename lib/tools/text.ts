export const CHARACTER_LIMIT_MIN = 1;
export const CHARACTER_LIMIT_MAX = 1_000_000;
export const CHARACTER_COUNTER_SHARE_QUERY_LIMIT = 1_800;

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

export const defaultCharacterCounterState: CharacterCounterState = {
  text: "",
  limitInput: "",
};

const whitespaceRegex = /^\s+$/u;
const plainIntegerStringRegex = /^\d+$/u;
const fallbackWordRegex = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;
const fallbackSentenceRegex = /[^.!?…]+[.!?…]+|[^.!?…]+$/gu;

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

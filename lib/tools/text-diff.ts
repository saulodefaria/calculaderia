export const TEXT_DIFF_MAX_INPUT_LENGTH = 200_000;
export const TEXT_DIFF_SHARE_FRAGMENT_LIMIT = 1_800;
export const TEXT_DIFF_INLINE_CHARACTER_LIMIT = 1_200;

export const textDiffModes = ["linhas", "palavras", "caracteres"] as const;
export const textDiffViews = ["lado-a-lado", "unificado"] as const;

export type TextDiffMode = (typeof textDiffModes)[number];
export type TextDiffView = (typeof textDiffViews)[number];
export type TextDiffStatus =
  | "empty"
  | "missingOriginal"
  | "missingRevised"
  | "identical"
  | "different"
  | "tooLarge"
  | "tooManyTokens";
export type TextDiffBlockType = "equal" | "insert" | "delete" | "replace";
export type TextDiffInlineChangeType = "equal" | "insert" | "delete";
export type TextDiffWarning =
  | "largeInput"
  | "lineEndingNormalized"
  | "caseIgnored"
  | "trailingSpacesIgnored"
  | "blankLinesIgnored"
  | "inlineDiffSkipped"
  | "comparisonApproximation";

export interface TextDiffState {
  original: string;
  alterado: string;
  modo: TextDiffMode;
  visao: TextDiffView;
  ignorarCaixa: boolean;
  ignorarEspacosFinais: boolean;
  ignorarLinhasVazias: boolean;
}

export interface TextDiffOptions {
  mode?: string | null;
  ignoreCase?: boolean;
  ignoreTrailingSpaces?: boolean;
  ignoreBlankLines?: boolean;
  locale?: string;
  maxInputLength?: number;
  maxTokens?: Partial<Record<TextDiffMode, number>>;
  maxMatrixCells?: number;
}

export interface TextDiffToken {
  value: string;
  key: string;
  index: number;
  lineNumber: number | null;
  ignored?: boolean;
}

export interface TextDiffInlineChange {
  type: TextDiffInlineChangeType;
  text: string;
}

export interface TextDiffBlock {
  id: string;
  type: TextDiffBlockType;
  originalStart: number | null;
  originalEnd: number | null;
  revisedStart: number | null;
  revisedEnd: number | null;
  originalText: string;
  revisedText: string;
  originalTokens: TextDiffToken[];
  revisedTokens: TextDiffToken[];
  inlineChanges: TextDiffInlineChange[];
}

export interface TextDiffSummary {
  unchanged: number;
  added: number;
  removed: number;
  modified: number;
  totalChangedBlocks: number;
  originalLines: number;
  revisedLines: number;
  originalTokens: number;
  revisedTokens: number;
  percentChanged: number;
}

export interface TextDiffResult {
  status: TextDiffStatus;
  modeApplied: TextDiffMode;
  optionsApplied: {
    ignoreCase: boolean;
    ignoreTrailingSpaces: boolean;
    ignoreBlankLines: boolean;
  };
  summary: TextDiffSummary;
  blocks: TextDiffBlock[];
  warnings: TextDiffWarning[];
}

export interface TextDiffContentFragmentResult {
  params: URLSearchParams;
  contentOmitted: boolean;
  fragmentLength: number;
}

export interface TextDiffContentFragmentState {
  hasExplicitContent: boolean;
  original: string;
  alterado: string;
}

export interface TextDiffSearchParamsResult {
  params: URLSearchParams;
  queryLength: number;
}

export interface TextDiffShareUrlResult {
  url: string;
  searchParams: URLSearchParams;
  fragmentParams: URLSearchParams;
  contentOmitted: boolean;
}

interface TokenizedText {
  tokens: TextDiffToken[];
  lineCount: number;
  lineEndingNormalized: boolean;
}

interface DiffOperation {
  type: TextDiffInlineChangeType;
  originalToken?: TextDiffToken;
  revisedToken?: TextDiffToken;
}

interface RawBlock {
  type: TextDiffBlockType;
  originalTokens: TextDiffToken[];
  revisedTokens: TextDiffToken[];
}

export const defaultTextDiffState: TextDiffState = {
  original: "",
  alterado: "",
  modo: "linhas",
  visao: "lado-a-lado",
  ignorarCaixa: false,
  ignorarEspacosFinais: false,
  ignorarLinhasVazias: false,
};

const textDiffModeSet = new Set<TextDiffMode>(textDiffModes);
const textDiffViewSet = new Set<TextDiffView>(textDiffViews);
const defaultTokenCaps: Record<TextDiffMode, number> = {
  linhas: 4_000,
  palavras: 3_000,
  caracteres: 1_500,
};
const defaultMatrixCellLimit = 4_000_000;
const wordTokenRegex = /[\p{L}\p{N}]+(?:[\p{M}'’-][\p{L}\p{N}]+)*|\s+|[^\s]/gu;
const trailingHorizontalWhitespaceRegex = /[ \t]+$/u;
const trailingHorizontalWhitespaceInTextRegex = /[ \t]+(?=\n|$)/gu;

function normalizeLineEndings(value: string) {
  const normalized = value.replace(/\r\n?/g, "\n");

  return {
    value: normalized,
    changed: normalized !== value,
  };
}

function safeLocaleLower(value: string, locale?: string): string {
  try {
    return value.toLocaleLowerCase(locale || undefined);
  } catch {
    return value.toLowerCase();
  }
}

function getSegmenter(locale: string | undefined, granularity: Intl.SegmenterOptions["granularity"]) {
  if (typeof Intl === "undefined" || typeof Intl.Segmenter === "undefined") {
    return null;
  }

  return new Intl.Segmenter(locale, { granularity });
}

function countLines(value: string) {
  if (value.length === 0) return 0;

  return normalizeLineEndings(value).value.split("\n").length;
}

function normalizeTokenKey(value: string, options: Required<Pick<TextDiffOptions, "ignoreCase" | "locale">>) {
  return options.ignoreCase ? safeLocaleLower(value, options.locale) : value;
}

function getIgnoredBlankLineIndexes(value: string) {
  const ignoredIndexes = new Set<number>();
  const lines = value.split("\n");
  let offset = 0;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex] ?? "";
    const hasTrailingNewline = lineIndex < lines.length - 1;
    const lineStart = offset;
    const lineEnd = lineStart + line.length;

    if (line.trim().length === 0) {
      for (let index = lineStart; index < lineEnd; index += 1) {
        ignoredIndexes.add(index);
      }

      if (hasTrailingNewline) {
        ignoredIndexes.add(lineEnd);
      } else if (value.endsWith("\n")) {
        ignoredIndexes.add(value.length - 1);
      }
    }

    offset = lineEnd + (hasTrailingNewline ? 1 : 0);
  }

  return ignoredIndexes;
}

function getIgnoredTrailingWhitespaceIndexes(value: string) {
  const ignoredIndexes = new Set<number>();

  for (const match of value.matchAll(trailingHorizontalWhitespaceInTextRegex)) {
    const start = match.index ?? 0;
    const text = match[0];

    for (let index = start; index < start + text.length; index += 1) {
      ignoredIndexes.add(index);
    }
  }

  return ignoredIndexes;
}

function mergeIgnoredIndexes(...sets: Array<Set<number> | null | undefined>) {
  const merged = new Set<number>();

  for (const set of sets) {
    if (!set) continue;

    for (const index of set) {
      merged.add(index);
    }
  }

  return merged;
}

function buildDisplayTokenKey(
  value: string,
  start: number,
  ignoredIndexes: Set<number>,
  options: Required<Pick<TextDiffOptions, "ignoreCase" | "locale">>
) {
  if (ignoredIndexes.size === 0) {
    return {
      key: normalizeTokenKey(value, options),
      ignored: false,
    };
  }

  let key = "";
  let removed = 0;

  for (let offset = 0; offset < value.length; offset += 1) {
    if (ignoredIndexes.has(start + offset)) {
      removed += 1;
    } else {
      key += value[offset];
    }
  }

  return {
    key: normalizeTokenKey(key, options),
    ignored: removed > 0 && key.length === 0,
  };
}

function tokenizeLineText(
  value: string,
  options: Required<Pick<TextDiffOptions, "ignoreBlankLines" | "ignoreCase" | "ignoreTrailingSpaces" | "locale">>
): TextDiffToken[] {
  if (value.length === 0) return [];

  const lines = value.split("\n");

  return lines.map((line, index) => {
    const key = normalizeTokenKey(
      options.ignoreTrailingSpaces ? line.replace(trailingHorizontalWhitespaceRegex, "") : line,
      options
    );
    const ignored = options.ignoreBlankLines && line.trim().length === 0;

    return {
      value: line,
      key,
      index: index + 1,
      lineNumber: index + 1,
      ...(ignored ? { ignored } : {}),
    };
  });
}

function tokenizeWordText(
  value: string,
  options: Required<Pick<TextDiffOptions, "ignoreCase" | "locale">>,
  ignoredIndexes: Set<number>
): TextDiffToken[] {
  if (value.length === 0) return [];

  return Array.from(value.matchAll(wordTokenRegex), (match, index) => {
    const tokenValue = match[0];
    const key = buildDisplayTokenKey(tokenValue, match.index ?? 0, ignoredIndexes, options);

    return {
      value: tokenValue,
      key: key.key,
      index: index + 1,
      lineNumber: null,
      ...(key.ignored ? { ignored: true } : {}),
    };
  });
}

function getGraphemeSegments(value: string, locale?: string): Array<{ value: string; start: number }> {
  const segmenter = getSegmenter(locale, "grapheme");

  if (segmenter) {
    return Array.from(segmenter.segment(value), (segment) => ({
      value: segment.segment,
      start: segment.index,
    }));
  }

  const segments: Array<{ value: string; start: number }> = [];
  let start = 0;

  for (const grapheme of Array.from(value)) {
    segments.push({ value: grapheme, start });
    start += grapheme.length;
  }

  return segments;
}

function tokenizeCharacterText(
  value: string,
  options: Required<Pick<TextDiffOptions, "ignoreCase" | "locale">>,
  ignoredIndexes: Set<number>
): TextDiffToken[] {
  return getGraphemeSegments(value, options.locale).map((grapheme, index) => {
    const key = buildDisplayTokenKey(grapheme.value, grapheme.start, ignoredIndexes, options);

    return {
      value: grapheme.value,
      key: key.key,
      index: index + 1,
      lineNumber: null,
      ...(key.ignored ? { ignored: true } : {}),
    };
  });
}

function tokenizeText(value: string, mode: TextDiffMode, options: TextDiffOptions): TokenizedText {
  const normalized = normalizeLineEndings(value);
  const ignoreBlankLines = options.ignoreBlankLines ?? false;
  const locale = options.locale ?? "pt-BR";
  const ignoredIndexes = mergeIgnoredIndexes(
    ignoreBlankLines ? getIgnoredBlankLineIndexes(normalized.value) : null,
    options.ignoreTrailingSpaces ? getIgnoredTrailingWhitespaceIndexes(normalized.value) : null
  );
  const commonOptions = {
    ignoreBlankLines,
    ignoreCase: options.ignoreCase ?? false,
    ignoreTrailingSpaces: options.ignoreTrailingSpaces ?? false,
    locale,
  };
  const tokens =
    mode === "linhas"
      ? tokenizeLineText(normalized.value, commonOptions)
      : mode === "palavras"
        ? tokenizeWordText(normalized.value, commonOptions, ignoredIndexes)
        : tokenizeCharacterText(normalized.value, commonOptions, ignoredIndexes);

  return {
    tokens,
    lineCount: countLines(normalized.value),
    lineEndingNormalized: normalized.changed,
  };
}

function getComparableTokens(tokens: TextDiffToken[]) {
  return tokens.filter((token) => !token.ignored);
}

function countComparableTokens(tokens: TextDiffToken[]) {
  return getComparableTokens(tokens).length;
}

function expandRawBlocksWithIgnoredTokens(
  rawBlocks: RawBlock[],
  originalTokens: TextDiffToken[],
  revisedTokens: TextDiffToken[]
) {
  if (rawBlocks.length === 0 && (originalTokens.length > 0 || revisedTokens.length > 0)) {
    return [
      {
        type: "equal",
        originalTokens,
        revisedTokens,
      } satisfies RawBlock,
    ];
  }

  const expandedBlocks = rawBlocks.map((block) => ({
    ...block,
    originalTokens: [] as TextDiffToken[],
    revisedTokens: [] as TextDiffToken[],
  }));

  let originalCursor = 0;
  let revisedCursor = 0;

  rawBlocks.forEach((block, blockIndex) => {
    const expandedBlock = expandedBlocks[blockIndex];
    const originalEndIndex = block.originalTokens.at(-1)?.index;
    const revisedEndIndex = block.revisedTokens.at(-1)?.index;

    if (expandedBlock && originalEndIndex !== undefined) {
      expandedBlock.originalTokens = originalTokens.slice(originalCursor, originalEndIndex);
      originalCursor = originalEndIndex;
    }

    if (expandedBlock && revisedEndIndex !== undefined) {
      expandedBlock.revisedTokens = revisedTokens.slice(revisedCursor, revisedEndIndex);
      revisedCursor = revisedEndIndex;
    }
  });

  const lastBlock = expandedBlocks.at(-1);

  if (lastBlock) {
    lastBlock.originalTokens.push(...originalTokens.slice(originalCursor));
    lastBlock.revisedTokens.push(...revisedTokens.slice(revisedCursor));
  }

  return expandedBlocks;
}

function getTokenRange(tokens: TextDiffToken[]) {
  if (tokens.length === 0) {
    return {
      start: null,
      end: null,
    };
  }

  return {
    start: tokens[0]?.index ?? null,
    end: tokens[tokens.length - 1]?.index ?? null,
  };
}

function joinTokens(tokens: TextDiffToken[], mode: TextDiffMode) {
  if (mode === "linhas") return tokens.map((token) => token.value).join("\n");

  return tokens.map((token) => token.value).join("");
}

function runTokenDiff(
  originalTokens: TextDiffToken[],
  revisedTokens: TextDiffToken[],
  maxMatrixCells = defaultMatrixCellLimit
): DiffOperation[] | null {
  const originalLength = originalTokens.length;
  const revisedLength = revisedTokens.length;
  const cellCount = (originalLength + 1) * (revisedLength + 1);

  if (cellCount > maxMatrixCells) return null;

  const width = revisedLength + 1;
  const table = new Uint32Array(cellCount);

  for (let originalIndex = originalLength - 1; originalIndex >= 0; originalIndex -= 1) {
    for (let revisedIndex = revisedLength - 1; revisedIndex >= 0; revisedIndex -= 1) {
      const offset = originalIndex * width + revisedIndex;

      if (originalTokens[originalIndex]?.key === revisedTokens[revisedIndex]?.key) {
        table[offset] = table[(originalIndex + 1) * width + revisedIndex + 1] + 1;
      } else {
        const deleteScore = table[(originalIndex + 1) * width + revisedIndex];
        const insertScore = table[originalIndex * width + revisedIndex + 1];
        table[offset] = deleteScore >= insertScore ? deleteScore : insertScore;
      }
    }
  }

  const operations: DiffOperation[] = [];
  let originalIndex = 0;
  let revisedIndex = 0;

  while (originalIndex < originalLength && revisedIndex < revisedLength) {
    const originalToken = originalTokens[originalIndex];
    const revisedToken = revisedTokens[revisedIndex];

    if (originalToken?.key === revisedToken?.key) {
      operations.push({ type: "equal", originalToken, revisedToken });
      originalIndex += 1;
      revisedIndex += 1;
      continue;
    }

    const deleteScore = table[(originalIndex + 1) * width + revisedIndex];
    const insertScore = table[originalIndex * width + revisedIndex + 1];

    if (deleteScore >= insertScore) {
      operations.push({ type: "delete", originalToken });
      originalIndex += 1;
    } else {
      operations.push({ type: "insert", revisedToken });
      revisedIndex += 1;
    }
  }

  while (originalIndex < originalLength) {
    operations.push({ type: "delete", originalToken: originalTokens[originalIndex] });
    originalIndex += 1;
  }

  while (revisedIndex < revisedLength) {
    operations.push({ type: "insert", revisedToken: revisedTokens[revisedIndex] });
    revisedIndex += 1;
  }

  return operations;
}

function operationsToRawBlocks(operations: DiffOperation[]) {
  const rawBlocks: RawBlock[] = [];

  for (const operation of operations) {
    const lastBlock = rawBlocks[rawBlocks.length - 1];
    const blockType = operation.type;
    const shouldAppend = lastBlock && lastBlock.type === blockType;
    const block = shouldAppend
      ? lastBlock
      : {
          type: blockType,
          originalTokens: [],
          revisedTokens: [],
        };

    if (operation.originalToken) block.originalTokens.push(operation.originalToken);
    if (operation.revisedToken) block.revisedTokens.push(operation.revisedToken);
    if (!shouldAppend) rawBlocks.push(block);
  }

  const coalesced: RawBlock[] = [];
  let index = 0;

  while (index < rawBlocks.length) {
    const current = rawBlocks[index];
    const next = rawBlocks[index + 1];

    if (current && next && current.type === "delete" && next.type === "insert") {
      coalesced.push({
        type: "replace",
        originalTokens: current.originalTokens,
        revisedTokens: next.revisedTokens,
      });
      index += 2;
      continue;
    }

    if (current && next && current.type === "insert" && next.type === "delete") {
      coalesced.push({
        type: "replace",
        originalTokens: next.originalTokens,
        revisedTokens: current.revisedTokens,
      });
      index += 2;
      continue;
    }

    if (current) coalesced.push(current);
    index += 1;
  }

  return coalesced;
}

function buildInlineChanges(
  originalText: string,
  revisedText: string,
  mode: TextDiffMode,
  options: TextDiffOptions
): { changes: TextDiffInlineChange[]; skipped: boolean } {
  if (originalText.length + revisedText.length > TEXT_DIFF_INLINE_CHARACTER_LIMIT) {
    return { changes: [], skipped: true };
  }

  const inlineMode: TextDiffMode = mode === "caracteres" ? "caracteres" : "palavras";
  const originalTokens = tokenizeText(originalText, inlineMode, {
    ...options,
    ignoreBlankLines: false,
  }).tokens;
  const revisedTokens = tokenizeText(revisedText, inlineMode, {
    ...options,
    ignoreBlankLines: false,
  }).tokens;
  const operations = runTokenDiff(originalTokens, revisedTokens, 250_000);

  if (!operations) return { changes: [], skipped: true };

  const changes: TextDiffInlineChange[] = [];

  for (const operation of operations) {
    const text = operation.type === "insert" ? operation.revisedToken?.value : operation.originalToken?.value;
    const lastChange = changes[changes.length - 1];

    if (!text) continue;

    if (lastChange?.type === operation.type) {
      lastChange.text += text;
    } else {
      changes.push({ type: operation.type, text });
    }
  }

  return { changes, skipped: false };
}

function rawBlocksToBlocks(rawBlocks: RawBlock[], mode: TextDiffMode, options: TextDiffOptions) {
  let skippedInline = false;

  const blocks = rawBlocks.map((block, index): TextDiffBlock => {
    const originalRange = getTokenRange(block.originalTokens);
    const revisedRange = getTokenRange(block.revisedTokens);
    const originalText = joinTokens(block.originalTokens, mode);
    const revisedText = joinTokens(block.revisedTokens, mode);
    const inline =
      block.type === "replace" ? buildInlineChanges(originalText, revisedText, mode, options) : { changes: [], skipped: false };

    skippedInline ||= inline.skipped;

    return {
      id: `${index + 1}-${block.type}`,
      type: block.type,
      originalStart: originalRange.start,
      originalEnd: originalRange.end,
      revisedStart: revisedRange.start,
      revisedEnd: revisedRange.end,
      originalText,
      revisedText,
      originalTokens: block.originalTokens,
      revisedTokens: block.revisedTokens,
      inlineChanges: inline.changes,
    };
  });

  return { blocks, skippedInline };
}

function makeEmptySummary(originalLines = 0, revisedLines = 0): TextDiffSummary {
  return {
    unchanged: 0,
    added: 0,
    removed: 0,
    modified: 0,
    totalChangedBlocks: 0,
    originalLines,
    revisedLines,
    originalTokens: 0,
    revisedTokens: 0,
    percentChanged: 0,
  };
}

function summarizeBlocks(
  blocks: TextDiffBlock[],
  originalTokenCount: number,
  revisedTokenCount: number,
  originalLineCount: number,
  revisedLineCount: number
): TextDiffSummary {
  let unchanged = 0;
  let added = 0;
  let removed = 0;
  let modified = 0;
  let totalChangedBlocks = 0;

  for (const block of blocks) {
    if (block.type === "equal") {
      unchanged += countComparableTokens(block.originalTokens);
    } else if (block.type === "insert") {
      added += countComparableTokens(block.revisedTokens);
      totalChangedBlocks += 1;
    } else if (block.type === "delete") {
      removed += countComparableTokens(block.originalTokens);
      totalChangedBlocks += 1;
    } else {
      modified += Math.max(countComparableTokens(block.originalTokens), countComparableTokens(block.revisedTokens));
      totalChangedBlocks += 1;
    }
  }

  const changedWeight = added + removed + modified;
  const denominator = Math.max(originalTokenCount, revisedTokenCount, 1);

  return {
    unchanged,
    added,
    removed,
    modified,
    totalChangedBlocks,
    originalLines: originalLineCount,
    revisedLines: revisedLineCount,
    originalTokens: originalTokenCount,
    revisedTokens: revisedTokenCount,
    percentChanged: Math.min(100, Math.round((changedWeight / denominator) * 100)),
  };
}

function getStatus(original: string, revised: string, blocks: TextDiffBlock[]): TextDiffStatus {
  if (original.length === 0 && revised.length === 0) return "empty";
  if (original.length === 0) return "missingOriginal";
  if (revised.length === 0) return "missingRevised";
  if (blocks.every((block) => block.type === "equal")) return "identical";

  return "different";
}

function getBaseWarnings(options: TextDiffOptions, original: TokenizedText, revised: TokenizedText): TextDiffWarning[] {
  const warnings: TextDiffWarning[] = [];

  if (original.lineEndingNormalized || revised.lineEndingNormalized) warnings.push("lineEndingNormalized");
  if (options.ignoreCase) warnings.push("caseIgnored");
  if (options.ignoreTrailingSpaces) warnings.push("trailingSpacesIgnored");
  if (options.ignoreBlankLines) warnings.push("blankLinesIgnored");

  return warnings;
}

export function normalizeTextDiffMode(value: string | null | undefined): TextDiffMode {
  return value && textDiffModeSet.has(value as TextDiffMode) ? (value as TextDiffMode) : defaultTextDiffState.modo;
}

export function normalizeTextDiffView(value: string | null | undefined): TextDiffView {
  return value && textDiffViewSet.has(value as TextDiffView) ? (value as TextDiffView) : defaultTextDiffState.visao;
}

export function readTextDiffBoolean(value: string | null, defaultValue: boolean): boolean {
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;

  return defaultValue;
}

export function compareTexts(original: string, revised: string, options: TextDiffOptions = {}): TextDiffResult {
  const mode = normalizeTextDiffMode(options.mode);
  const maxInputLength = options.maxInputLength ?? TEXT_DIFF_MAX_INPUT_LENGTH;
  const appliedOptions = {
    ignoreCase: options.ignoreCase ?? false,
    ignoreTrailingSpaces: options.ignoreTrailingSpaces ?? false,
    ignoreBlankLines: options.ignoreBlankLines ?? false,
  };

  if (original.length > maxInputLength || revised.length > maxInputLength) {
    return {
      status: "tooLarge",
      modeApplied: mode,
      optionsApplied: appliedOptions,
      summary: makeEmptySummary(countLines(original), countLines(revised)),
      blocks: [],
      warnings: ["largeInput"],
    };
  }

  const originalTokenized = tokenizeText(original, mode, {
    ...options,
    ...appliedOptions,
  });
  const revisedTokenized = tokenizeText(revised, mode, {
    ...options,
    ...appliedOptions,
  });
  const originalComparableTokens = getComparableTokens(originalTokenized.tokens);
  const revisedComparableTokens = getComparableTokens(revisedTokenized.tokens);
  const maxTokens = options.maxTokens?.[mode] ?? defaultTokenCaps[mode];
  const warnings = getBaseWarnings(options, originalTokenized, revisedTokenized);

  if (originalComparableTokens.length > maxTokens || revisedComparableTokens.length > maxTokens) {
    return {
      status: "tooManyTokens",
      modeApplied: mode,
      optionsApplied: appliedOptions,
      summary: {
        ...makeEmptySummary(originalTokenized.lineCount, revisedTokenized.lineCount),
        originalTokens: originalComparableTokens.length,
        revisedTokens: revisedComparableTokens.length,
      },
      blocks: [],
      warnings: [...warnings, "largeInput"],
    };
  }

  const operations = runTokenDiff(originalComparableTokens, revisedComparableTokens, options.maxMatrixCells);

  if (!operations) {
    return {
      status: "tooManyTokens",
      modeApplied: mode,
      optionsApplied: appliedOptions,
      summary: {
        ...makeEmptySummary(originalTokenized.lineCount, revisedTokenized.lineCount),
        originalTokens: originalComparableTokens.length,
        revisedTokens: revisedComparableTokens.length,
      },
      blocks: [],
      warnings: [...warnings, "comparisonApproximation"],
    };
  }

  const rawBlocks = expandRawBlocksWithIgnoredTokens(
    operationsToRawBlocks(operations),
    originalTokenized.tokens,
    revisedTokenized.tokens
  );
  const { blocks, skippedInline } = rawBlocksToBlocks(rawBlocks, mode, {
    ...options,
    ...appliedOptions,
  });
  const summary = summarizeBlocks(
    blocks,
    originalComparableTokens.length,
    revisedComparableTokens.length,
    originalTokenized.lineCount,
    revisedTokenized.lineCount
  );

  if (skippedInline) warnings.push("inlineDiffSkipped");

  return {
    status: getStatus(original, revised, blocks),
    modeApplied: mode,
    optionsApplied: appliedOptions,
    summary,
    blocks,
    warnings,
  };
}

export function readTextDiffStateFromParams(params: URLSearchParams): TextDiffState {
  return {
    original: defaultTextDiffState.original,
    alterado: defaultTextDiffState.alterado,
    modo: normalizeTextDiffMode(params.get("modo")),
    visao: normalizeTextDiffView(params.get("visao")),
    ignorarCaixa: readTextDiffBoolean(params.get("ignorarCaixa"), defaultTextDiffState.ignorarCaixa),
    ignorarEspacosFinais: readTextDiffBoolean(
      params.get("ignorarEspacosFinais"),
      defaultTextDiffState.ignorarEspacosFinais
    ),
    ignorarLinhasVazias: readTextDiffBoolean(
      params.get("ignorarLinhasVazias"),
      defaultTextDiffState.ignorarLinhasVazias
    ),
  };
}

export function readTextDiffContentFromFragment(fragment: string): TextDiffContentFragmentState {
  const normalizedFragment = fragment.startsWith("#") ? fragment.slice(1) : fragment;
  const params = new URLSearchParams(normalizedFragment);
  const hasExplicitContent = params.get("conteudo") === "1";

  return {
    hasExplicitContent,
    original: hasExplicitContent ? params.get("original") ?? "" : defaultTextDiffState.original,
    alterado: hasExplicitContent ? params.get("alterado") ?? "" : defaultTextDiffState.alterado,
  };
}

export function buildTextDiffSearchParams(state: TextDiffState): TextDiffSearchParamsResult {
  const params = new URLSearchParams();
  const mode = normalizeTextDiffMode(state.modo);
  const view = normalizeTextDiffView(state.visao);

  if (mode !== defaultTextDiffState.modo) params.set("modo", mode);
  if (view !== defaultTextDiffState.visao) params.set("visao", view);
  if (state.ignorarCaixa !== defaultTextDiffState.ignorarCaixa) {
    params.set("ignorarCaixa", state.ignorarCaixa ? "1" : "0");
  }
  if (state.ignorarEspacosFinais !== defaultTextDiffState.ignorarEspacosFinais) {
    params.set("ignorarEspacosFinais", state.ignorarEspacosFinais ? "1" : "0");
  }
  if (state.ignorarLinhasVazias !== defaultTextDiffState.ignorarLinhasVazias) {
    params.set("ignorarLinhasVazias", state.ignorarLinhasVazias ? "1" : "0");
  }

  return {
    params,
    queryLength: params.toString().length,
  };
}

export function buildTextDiffContentFragmentParams(
  state: TextDiffState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): TextDiffContentFragmentResult {
  const params = new URLSearchParams();
  const maxFragmentLength = options.maxFragmentLength ?? TEXT_DIFF_SHARE_FRAGMENT_LIMIT;

  if (!options.includeContent) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: 0,
    };
  }

  params.set("conteudo", "1");

  if (state.original.length === 0 && state.alterado.length === 0) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: params.toString().length,
    };
  }

  params.set("original", state.original);
  params.set("alterado", state.alterado);

  if (params.toString().length <= maxFragmentLength) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: params.toString().length,
    };
  }

  params.delete("original");
  params.delete("alterado");

  return {
    params,
    contentOmitted: true,
    fragmentLength: params.toString().length,
  };
}

export function buildTextDiffShareUrl(
  baseUrl: string,
  state: TextDiffState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): TextDiffShareUrlResult {
  const searchResult = buildTextDiffSearchParams(state);
  const fragmentResult = buildTextDiffContentFragmentParams(state, options);
  const query = searchResult.params.toString();
  const fragment = fragmentResult.params.toString();

  return {
    url: `${baseUrl}${query ? `?${query}` : ""}${fragment ? `#${fragment}` : ""}`,
    searchParams: searchResult.params,
    fragmentParams: fragmentResult.params,
    contentOmitted: fragmentResult.contentOmitted,
  };
}

export function formatTextDiffRange(start: number | null, end: number | null) {
  if (start === null || end === null) return "";
  if (start === end) return String(start);

  return `${start}-${end}`;
}

export function buildTextDiffSummaryText(result: TextDiffResult) {
  return [
    `Status: ${result.status}`,
    `Mode: ${result.modeApplied}`,
    `Unchanged: ${result.summary.unchanged}`,
    `Added: ${result.summary.added}`,
    `Removed: ${result.summary.removed}`,
    `Modified: ${result.summary.modified}`,
    `Changed blocks: ${result.summary.totalChangedBlocks}`,
    `Changed percent: ${result.summary.percentChanged}%`,
  ].join("\n");
}

export function buildUnifiedTextDiff(result: TextDiffResult) {
  const lines: string[] = [];

  for (const block of result.blocks) {
    if (block.type === "equal") {
      lines.push(...splitBlockText(block.originalText).map((line) => `  ${line}`));
    } else if (block.type === "delete") {
      lines.push(...splitBlockText(block.originalText).map((line) => `- ${line}`));
    } else if (block.type === "insert") {
      lines.push(...splitBlockText(block.revisedText).map((line) => `+ ${line}`));
    } else {
      lines.push(...splitBlockText(block.originalText).map((line) => `- ${line}`));
      lines.push(...splitBlockText(block.revisedText).map((line) => `+ ${line}`));
    }
  }

  return lines.join("\n");
}

function splitBlockText(value: string) {
  if (value.length === 0) return [""];

  return value.split("\n");
}

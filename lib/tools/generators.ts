export interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

export interface RandomNumberOptions {
  min: number;
  max: number;
  count: number;
  unique: boolean;
}

export type UuidFormat = "padrao" | "sem-hifens" | "urn";
export type UuidGeneratorIssue = "quantityClamped";

export interface UuidGeneratorState {
  count: number;
  format: UuidFormat;
  uppercase: boolean;
}

export interface UuidCountNormalization {
  count: number;
  issue: UuidGeneratorIssue | null;
}

export interface UuidFormatOptions {
  format: UuidFormat;
  uppercase: boolean;
}

export type NameDrawMode = "vencedores" | "embaralhar";
export type NameSeparatorMode = "linhas" | "auto";
export type NameDrawValidationCode =
  | "empty"
  | "singleEntry"
  | "inputTooLong"
  | "entryLimitReached"
  | "entryTooLong"
  | "quantityCapped"
  | "duplicatesFound";

export interface NameDrawerState {
  input: string;
  mode: NameDrawMode;
  quantity: number;
  separator: NameSeparatorMode;
  noRepeat: boolean;
  removeDuplicates: boolean;
}

export interface ParseNameEntriesOptions {
  separator?: NameSeparatorMode;
  locale?: string;
  maxInputLength?: number;
  maxEntries?: number;
  maxEntryLength?: number;
}

export interface NameEntry {
  id: string;
  label: string;
  normalizedLabel: string;
  key: string;
  originalIndex: number;
  wasTruncated: boolean;
}

export interface NameEntryStats {
  inputLength: number;
  rawEntries: number;
  validEntries: number;
  uniqueEntries: number;
  duplicateEntries: number;
  duplicateGroups: number;
  ignoredEmptyEntries: number;
  truncatedEntries: number;
  tooLongEntries: number;
  inputTooLong: boolean;
}

export interface ParseNameEntriesResult {
  entries: NameEntry[];
  uniqueEntries: NameEntry[];
  stats: NameEntryStats;
}

export interface NameDrawResult {
  mode: "vencedores";
  entries: NameEntry[];
  requestedQuantity: number;
  selectedQuantity: number;
  availableEntries: number;
  cappedByAvailable: boolean;
  noRepeat: boolean;
  removeDuplicates: boolean;
}

export interface NameShuffleResult {
  mode: "embaralhar";
  entries: NameEntry[];
  selectedQuantity: number;
  availableEntries: number;
  removeDuplicates: boolean;
}

export interface NameDrawerSearchParamsResult {
  params: URLSearchParams;
  queryLength: number;
}

export interface NameDrawerContentFragmentResult {
  params: URLSearchParams;
  contentOmitted: boolean;
  fragmentLength: number;
}

export interface NameDrawerContentFragmentState {
  hasExplicitContent: boolean;
  input: string;
}

export interface NameDrawerShareUrlResult {
  url: string;
  searchParams: URLSearchParams;
  fragmentParams: URLSearchParams;
  contentOmitted: boolean;
}

export const NAME_DRAW_MAX_INPUT_LENGTH = 200_000;
export const NAME_DRAW_MAX_ENTRIES = 5_000;
export const NAME_DRAW_MAX_ENTRY_LENGTH = 120;
export const NAME_DRAW_MAX_QUANTITY = 500;
export const NAME_DRAW_SHARE_FRAGMENT_LIMIT = 1_800;
export const UUID_GENERATOR_MIN_COUNT = 1;
export const UUID_GENERATOR_MAX_COUNT = 100;

export const defaultNameDrawerState: NameDrawerState = {
  input: "",
  mode: "vencedores",
  quantity: 1,
  separator: "linhas",
  noRepeat: true,
  removeDuplicates: false,
};

export const defaultUuidGeneratorState: UuidGeneratorState = {
  count: 5,
  format: "padrao",
  uppercase: false,
};

const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const lowercase = "abcdefghijkmnopqrstuvwxyz";
const numbers = "23456789";
const symbols = "!@#$%&*_-+=?";
const nameDrawModes = new Set<NameDrawMode>(["vencedores", "embaralhar"]);
const nameSeparatorModes = new Set<NameSeparatorMode>(["linhas", "auto"]);
const uuidFormats = new Set<UuidFormat>(["padrao", "sem-hifens", "urn"]);
const hexPairs = Array.from({ length: 256 }, (_, value) => value.toString(16).padStart(2, "0"));

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function randomIndex(maxExclusive: number, random: () => number): number {
  return Math.min(maxExclusive - 1, Math.floor(random() * maxExclusive));
}

function pick(pool: string, random: () => number): string {
  return pool[randomIndex(pool.length, random)] ?? pool[0] ?? "";
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const out = [...items];
  for (let index = out.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1, random);
    [out[index], out[swapIndex]] = [out[swapIndex], out[index]];
  }
  return out;
}

export function getPasswordPools(options: PasswordOptions): string[] {
  return [
    options.includeUppercase ? uppercase : "",
    options.includeLowercase ? lowercase : "",
    options.includeNumbers ? numbers : "",
    options.includeSymbols ? symbols : "",
  ].filter(Boolean);
}

export function generatePassword(options: PasswordOptions, random = Math.random): string {
  const length = clampInteger(options.length, 4, 128);
  const pools = getPasswordPools(options);

  if (pools.length === 0) {
    return "";
  }

  const allCharacters = pools.join("");
  const requiredCharacters = pools.slice(0, length).map((pool) => pick(pool, random));
  const remainingCharacters = Array.from({ length: length - requiredCharacters.length }, () =>
    pick(allCharacters, random)
  );

  return shuffle([...requiredCharacters, ...remainingCharacters], random).join("");
}

export function generateRandomNumbers(options: RandomNumberOptions, random = Math.random): number[] {
  const min = Math.trunc(Math.min(options.min, options.max));
  const max = Math.trunc(Math.max(options.min, options.max));
  const rangeSize = max - min + 1;
  const requestedCount = clampInteger(options.count, 1, 500);
  const count = options.unique ? Math.min(requestedCount, rangeSize) : requestedCount;

  if (options.unique) {
    return shuffle(
      Array.from({ length: rangeSize }, (_, index) => min + index),
      random
    ).slice(0, count);
  }

  return Array.from({ length: count }, () => min + randomIndex(rangeSize, random));
}

export function normalizeUuidFormat(value: string | null | undefined): UuidFormat {
  return value && uuidFormats.has(value as UuidFormat) ? (value as UuidFormat) : defaultUuidGeneratorState.format;
}

export function normalizeUuidGeneratorCount(value: string | number | null | undefined): UuidCountNormalization {
  if (value === null || value === undefined || value === "") {
    return {
      count: defaultUuidGeneratorState.count,
      issue: null,
    };
  }

  const numericValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numericValue)) {
    return {
      count: defaultUuidGeneratorState.count,
      issue: null,
    };
  }

  const count = clampInteger(numericValue, UUID_GENERATOR_MIN_COUNT, UUID_GENERATOR_MAX_COUNT);

  return {
    count,
    issue: count !== numericValue ? "quantityClamped" : null,
  };
}

export function readUuidGeneratorStateFromParams(params: URLSearchParams): UuidGeneratorState {
  return {
    count: normalizeUuidGeneratorCount(params.get("quantidade")).count,
    format: normalizeUuidFormat(params.get("formato")),
    uppercase: params.get("maiusculas") === "1" || params.get("maiusculas") === "true",
  };
}

export function buildUuidGeneratorSearchParams(state: UuidGeneratorState): URLSearchParams {
  const params = new URLSearchParams();

  params.set("quantidade", String(normalizeUuidGeneratorCount(state.count).count));
  params.set("formato", normalizeUuidFormat(state.format));
  params.set("maiusculas", state.uppercase ? "1" : "0");

  return params;
}

export function formatUuid(canonicalUuid: string, options: UuidFormatOptions): string {
  const uuid = options.uppercase ? canonicalUuid.toLowerCase().toUpperCase() : canonicalUuid.toLowerCase();

  if (options.format === "sem-hifens") {
    return uuid.replaceAll("-", "");
  }

  if (options.format === "urn") {
    return `urn:uuid:${uuid}`;
  }

  return uuid;
}

export function createUuidV4FromBytes(bytes: ArrayLike<number>): string {
  if (bytes.length < 16) {
    throw new RangeError("UUIDv4 generation requires at least 16 random bytes.");
  }

  const uuidBytes = Uint8Array.from(Array.from({ length: 16 }, (_, index) => bytes[index] ?? 0));
  uuidBytes[6] = (uuidBytes[6] & 0x0f) | 0x40;
  uuidBytes[8] = (uuidBytes[8] & 0x3f) | 0x80;
  const hex = Array.from(uuidBytes, (byte) => hexPairs[byte] ?? "00");

  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex
    .slice(8, 10)
    .join("")}-${hex.slice(10, 16).join("")}`;
}

export function generateUuidBatch(
  count: number,
  generator: () => string,
  options: UuidFormatOptions = {
    format: defaultUuidGeneratorState.format,
    uppercase: defaultUuidGeneratorState.uppercase,
  }
): string[] {
  const safeCount = normalizeUuidGeneratorCount(count).count;

  return Array.from({ length: safeCount }, () => formatUuid(generator(), options));
}

export function normalizeNameDrawMode(value: string | null | undefined): NameDrawMode {
  return value && nameDrawModes.has(value as NameDrawMode) ? (value as NameDrawMode) : defaultNameDrawerState.mode;
}

export function normalizeNameSeparatorMode(value: string | null | undefined): NameSeparatorMode {
  return value && nameSeparatorModes.has(value as NameSeparatorMode)
    ? (value as NameSeparatorMode)
    : defaultNameDrawerState.separator;
}

export function normalizeNameDrawQuantity(value: number): number {
  return clampInteger(value, 1, NAME_DRAW_MAX_QUANTITY);
}

function readNameDrawBoolean(value: string | null, defaultValue: boolean): boolean {
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return defaultValue;
}

function normalizeNameDisplayLabel(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function truncateNameDisplayLabel(value: string, maxLength: number): string {
  const characters = Array.from(value);
  if (characters.length <= maxLength) return value;

  return `${characters.slice(0, Math.max(1, maxLength - 3)).join("")}...`;
}

export function normalizeNameEntryKey(value: string, locale?: string): string {
  const normalized = normalizeNameDisplayLabel(value);

  try {
    return normalized.toLocaleLowerCase(locale || undefined);
  } catch {
    return normalized.toLowerCase();
  }
}

function getUniqueNameEntries(entries: readonly NameEntry[]): NameEntry[] {
  const seen = new Map<string, NameEntry>();

  for (const entry of entries) {
    if (!seen.has(entry.key)) {
      seen.set(entry.key, entry);
    }
  }

  return Array.from(seen.values());
}

function getDuplicateStats(entries: readonly NameEntry[], uniqueCount: number) {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    counts.set(entry.key, (counts.get(entry.key) ?? 0) + 1);
  }

  return {
    duplicateEntries: Math.max(0, entries.length - uniqueCount),
    duplicateGroups: Array.from(counts.values()).filter((count) => count > 1).length,
  };
}

export function parseNameEntries(input: string, options: ParseNameEntriesOptions = {}): ParseNameEntriesResult {
  const separator = normalizeNameSeparatorMode(options.separator);
  const maxInputLength = options.maxInputLength ?? NAME_DRAW_MAX_INPUT_LENGTH;
  const maxEntries = options.maxEntries ?? NAME_DRAW_MAX_ENTRIES;
  const maxEntryLength = options.maxEntryLength ?? NAME_DRAW_MAX_ENTRY_LENGTH;
  const inputTooLong = input.length > maxInputLength;
  const boundedInput = inputTooLong ? input.slice(0, maxInputLength) : input;
  const normalizedInput = boundedInput.replace(/\r\n?/g, "\n");
  const rawParts = normalizedInput.length === 0 ? [] : normalizedInput.split(separator === "auto" ? /[\n,;]/ : "\n");
  const entries: NameEntry[] = [];
  let ignoredEmptyEntries = 0;
  let truncatedEntries = 0;
  let tooLongEntries = 0;

  rawParts.forEach((part, index) => {
    const normalizedLabel = normalizeNameDisplayLabel(part);

    if (!normalizedLabel) {
      ignoredEmptyEntries += 1;
      return;
    }

    if (entries.length >= maxEntries) {
      truncatedEntries += 1;
      return;
    }

    const wasTruncated = Array.from(normalizedLabel).length > maxEntryLength;
    if (wasTruncated) tooLongEntries += 1;

    entries.push({
      id: `${index}-${entries.length}`,
      label: truncateNameDisplayLabel(normalizedLabel, maxEntryLength),
      normalizedLabel,
      key: normalizeNameEntryKey(normalizedLabel, options.locale),
      originalIndex: index,
      wasTruncated,
    });
  });

  const uniqueEntries = getUniqueNameEntries(entries);
  const duplicateStats = getDuplicateStats(entries, uniqueEntries.length);

  return {
    entries,
    uniqueEntries,
    stats: {
      inputLength: input.length,
      rawEntries: rawParts.length,
      validEntries: entries.length,
      uniqueEntries: uniqueEntries.length,
      duplicateEntries: duplicateStats.duplicateEntries,
      duplicateGroups: duplicateStats.duplicateGroups,
      ignoredEmptyEntries,
      truncatedEntries,
      tooLongEntries,
      inputTooLong,
    },
  };
}

export function getNameDrawCandidateEntries(
  parsed: Pick<ParseNameEntriesResult, "entries" | "uniqueEntries">,
  options: Pick<NameDrawerState, "removeDuplicates">
): NameEntry[] {
  return options.removeDuplicates ? parsed.uniqueEntries : parsed.entries;
}

export function drawNameEntries(
  parsed: Pick<ParseNameEntriesResult, "entries" | "uniqueEntries">,
  options: Pick<NameDrawerState, "quantity" | "noRepeat" | "removeDuplicates">,
  random = Math.random
): NameDrawResult {
  const candidates = getNameDrawCandidateEntries(parsed, options);
  const requestedQuantity = normalizeNameDrawQuantity(options.quantity);
  const selectedQuantity = options.noRepeat ? Math.min(requestedQuantity, candidates.length) : requestedQuantity;

  if (candidates.length === 0) {
    return {
      mode: "vencedores",
      entries: [],
      requestedQuantity,
      selectedQuantity: 0,
      availableEntries: 0,
      cappedByAvailable: false,
      noRepeat: options.noRepeat,
      removeDuplicates: options.removeDuplicates,
    };
  }

  const entries = options.noRepeat
    ? shuffle(candidates, random).slice(0, selectedQuantity)
    : Array.from({ length: selectedQuantity }, () => candidates[randomIndex(candidates.length, random)]);

  return {
    mode: "vencedores",
    entries,
    requestedQuantity,
    selectedQuantity,
    availableEntries: candidates.length,
    cappedByAvailable: options.noRepeat && requestedQuantity > candidates.length,
    noRepeat: options.noRepeat,
    removeDuplicates: options.removeDuplicates,
  };
}

export function shuffleNameEntries(
  parsed: Pick<ParseNameEntriesResult, "entries" | "uniqueEntries">,
  options: Pick<NameDrawerState, "removeDuplicates">,
  random = Math.random
): NameShuffleResult {
  const candidates = getNameDrawCandidateEntries(parsed, options);
  const entries = shuffle(candidates, random);

  return {
    mode: "embaralhar",
    entries,
    selectedQuantity: entries.length,
    availableEntries: candidates.length,
    removeDuplicates: options.removeDuplicates,
  };
}

export function getNameDrawValidationCodes(
  parsed: ParseNameEntriesResult,
  options: Pick<NameDrawerState, "quantity" | "noRepeat" | "removeDuplicates">
): NameDrawValidationCode[] {
  const candidates = getNameDrawCandidateEntries(parsed, options);
  const codes: NameDrawValidationCode[] = [];

  if (parsed.stats.validEntries === 0) {
    codes.push("empty");
  } else if (candidates.length < 2) {
    codes.push("singleEntry");
  }

  if (parsed.stats.inputTooLong) codes.push("inputTooLong");
  if (parsed.stats.truncatedEntries > 0) codes.push("entryLimitReached");
  if (parsed.stats.tooLongEntries > 0) codes.push("entryTooLong");
  if (options.noRepeat && normalizeNameDrawQuantity(options.quantity) > candidates.length && candidates.length > 0) {
    codes.push("quantityCapped");
  }
  if (!options.removeDuplicates && parsed.stats.duplicateEntries > 0) {
    codes.push("duplicatesFound");
  }

  return codes;
}

export function readNameDrawerStateFromParams(params: URLSearchParams): NameDrawerState {
  return {
    input: defaultNameDrawerState.input,
    mode: normalizeNameDrawMode(params.get("modo")),
    quantity: normalizeNameDrawQuantity(Number(params.get("quantidade") ?? defaultNameDrawerState.quantity)),
    separator: normalizeNameSeparatorMode(params.get("separador")),
    noRepeat: readNameDrawBoolean(params.get("semRepetir"), defaultNameDrawerState.noRepeat),
    removeDuplicates: readNameDrawBoolean(params.get("removerDuplicados"), defaultNameDrawerState.removeDuplicates),
  };
}

export function buildNameDrawerSearchParams(state: NameDrawerState): NameDrawerSearchParamsResult {
  const params = new URLSearchParams();

  params.set("modo", normalizeNameDrawMode(state.mode));
  params.set("quantidade", String(normalizeNameDrawQuantity(state.quantity)));
  params.set("separador", normalizeNameSeparatorMode(state.separator));
  params.set("semRepetir", state.noRepeat ? "1" : "0");
  params.set("removerDuplicados", state.removeDuplicates ? "1" : "0");

  return {
    params,
    queryLength: params.toString().length,
  };
}

export function readNameDrawerContentFromFragment(fragment: string): NameDrawerContentFragmentState {
  const normalizedFragment = fragment.startsWith("#") ? fragment.slice(1) : fragment;
  const params = new URLSearchParams(normalizedFragment);
  const hasExplicitContent = params.get("conteudo") === "1";

  return {
    hasExplicitContent,
    input: hasExplicitContent ? params.get("nomes") ?? "" : defaultNameDrawerState.input,
  };
}

export function buildNameDrawerContentFragmentParams(
  state: NameDrawerState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): NameDrawerContentFragmentResult {
  const params = new URLSearchParams();
  const maxFragmentLength = options.maxFragmentLength ?? NAME_DRAW_SHARE_FRAGMENT_LIMIT;

  if (!options.includeContent) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: 0,
    };
  }

  params.set("conteudo", "1");

  if (state.input.length === 0) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: params.toString().length,
    };
  }

  params.set("nomes", state.input);

  if (params.toString().length <= maxFragmentLength) {
    return {
      params,
      contentOmitted: false,
      fragmentLength: params.toString().length,
    };
  }

  params.delete("nomes");

  return {
    params,
    contentOmitted: true,
    fragmentLength: params.toString().length,
  };
}

export function buildNameDrawerShareUrl(
  baseUrl: string,
  state: NameDrawerState,
  options: { includeContent?: boolean; maxFragmentLength?: number } = {}
): NameDrawerShareUrlResult {
  const searchResult = buildNameDrawerSearchParams(state);
  const fragmentResult = buildNameDrawerContentFragmentParams(state, options);
  const query = searchResult.params.toString();
  const fragment = fragmentResult.params.toString();

  return {
    url: `${baseUrl}${query ? `?${query}` : ""}${fragment ? `#${fragment}` : ""}`,
    searchParams: searchResult.params,
    fragmentParams: fragmentResult.params,
    contentOmitted: fragmentResult.contentOmitted,
  };
}

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

const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const lowercase = "abcdefghijkmnopqrstuvwxyz";
const numbers = "23456789";
const symbols = "!@#$%&*_-+=?";

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

import { describe, expect, test } from "vitest";
import {
  buildNameDrawerShareUrl,
  buildNameDrawerSearchParams,
  drawNameEntries,
  generatePassword,
  generateRandomNumbers,
  getNameDrawValidationCodes,
  getPasswordPools,
  parseNameEntries,
  readNameDrawerContentFromFragment,
  readNameDrawerStateFromParams,
  shuffleNameEntries,
  type NameDrawerState,
} from "./generators";

function sequenceRandom(values: number[]) {
  let index = 0;

  return () => values[index++] ?? values.at(-1) ?? 0;
}

describe("generators", () => {
  test("generates passwords with the requested length and selected pools", () => {
    const password = generatePassword(
      {
        length: 12,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
      },
      () => 0.5
    );

    expect(password).toHaveLength(12);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/\d/);
    expect(password).toMatch(/[!@#$%&*_\-+=?]/);
  });

  test("returns an empty password when no pools are selected", () => {
    expect(
      generatePassword({
        length: 12,
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false,
      })
    ).toBe("");
    expect(
      getPasswordPools({
        length: 12,
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false,
      })
    ).toHaveLength(0);
  });

  test("generates random numbers within bounds", () => {
    const numbers = generateRandomNumbers({ min: 10, max: 12, count: 5, unique: false }, () => 0);

    expect(numbers).toEqual([10, 10, 10, 10, 10]);
  });

  test("limits unique random numbers to the range size", () => {
    const numbers = generateRandomNumbers({ min: 1, max: 3, count: 10, unique: true }, () => 0.5);

    expect(numbers).toHaveLength(3);
    expect(new Set(numbers).size).toBe(3);
    expect(numbers.every((number) => number >= 1 && number <= 3)).toBe(true);
  });

  test("parses line-separated names with trim, blank counts, and duplicate stats", () => {
    const parsed = parseNameEntries(" Ana \r\n\nBruno\nana\n  Caio  ", { separator: "linhas", locale: "pt-BR" });

    expect(parsed.entries.map((entry) => entry.label)).toEqual(["Ana", "Bruno", "ana", "Caio"]);
    expect(parsed.uniqueEntries.map((entry) => entry.label)).toEqual(["Ana", "Bruno", "Caio"]);
    expect(parsed.stats).toMatchObject({
      validEntries: 4,
      uniqueEntries: 3,
      duplicateEntries: 1,
      duplicateGroups: 1,
      ignoredEmptyEntries: 1,
    });
  });

  test("supports auto separator for lines, commas, and semicolons", () => {
    const parsed = parseNameEntries("Ana, Bruno;Caio\nDuda,,", { separator: "auto" });

    expect(parsed.entries.map((entry) => entry.label)).toEqual(["Ana", "Bruno", "Caio", "Duda"]);
    expect(parsed.stats.ignoredEmptyEntries).toBe(2);
  });

  test("draws unique winners deterministically without replacement", () => {
    const parsed = parseNameEntries("Ana\nBruno\nCaio", { separator: "linhas" });
    const result = drawNameEntries(
      parsed,
      { quantity: 2, noRepeat: true, removeDuplicates: false },
      sequenceRandom([0, 0])
    );

    expect(result.entries.map((entry) => entry.label)).toEqual(["Bruno", "Caio"]);
    expect(result.selectedQuantity).toBe(2);
    expect(result.cappedByAvailable).toBe(false);
  });

  test("caps no-repeat draws at available entries", () => {
    const parsed = parseNameEntries("Ana\nBruno", { separator: "linhas" });
    const result = drawNameEntries(parsed, { quantity: 10, noRepeat: true, removeDuplicates: false }, () => 0.5);

    expect(result.entries).toHaveLength(2);
    expect(result.requestedQuantity).toBe(10);
    expect(result.selectedQuantity).toBe(2);
    expect(result.cappedByAvailable).toBe(true);
  });

  test("draws with replacement and can repeat the same entry", () => {
    const parsed = parseNameEntries("Ana\nBruno\nCaio", { separator: "linhas" });
    const result = drawNameEntries(
      parsed,
      { quantity: 3, noRepeat: false, removeDuplicates: false },
      sequenceRandom([0.01, 0.01, 0.8])
    );

    expect(result.entries.map((entry) => entry.label)).toEqual(["Ana", "Ana", "Caio"]);
  });

  test("removes duplicates while preserving the first display label", () => {
    const parsed = parseNameEntries(" Ana Silva \nana   silva\nBruno", { separator: "linhas", locale: "pt-BR" });
    const result = drawNameEntries(parsed, { quantity: 3, noRepeat: true, removeDuplicates: true }, () => 0.99);

    expect(result.availableEntries).toBe(2);
    expect(result.entries.map((entry) => entry.label).sort()).toEqual(["Ana Silva", "Bruno"]);
  });

  test("shuffles names deterministically", () => {
    const parsed = parseNameEntries("Ana\nBruno\nCaio", { separator: "linhas" });
    const result = shuffleNameEntries(parsed, { removeDuplicates: false }, sequenceRandom([0, 0]));

    expect(result.entries.map((entry) => entry.label)).toEqual(["Bruno", "Caio", "Ana"]);
  });

  test("enforces input, entry, display, and quantity limits without throwing", () => {
    const parsed = parseNameEntries("Nome muito longo".repeat(20) + "\nAna\nBruno\nCaio", {
      maxInputLength: 80,
      maxEntries: 2,
      maxEntryLength: 12,
      separator: "linhas",
    });
    const result = drawNameEntries(parsed, { quantity: 999, noRepeat: false, removeDuplicates: false }, () => 0);

    expect(parsed.stats.inputTooLong).toBe(true);
    expect(parsed.stats.tooLongEntries).toBe(1);
    expect(parsed.entries[0]?.label).toHaveLength(12);
    expect(result.requestedQuantity).toBe(500);
  });

  test("reports validation states for empty, one-entry, duplicate, and capped draws", () => {
    const empty = parseNameEntries("", { separator: "linhas" });
    const one = parseNameEntries("Ana\nAna", { separator: "linhas" });
    const many = parseNameEntries("Ana\nBruno\nAna", { separator: "linhas" });

    expect(getNameDrawValidationCodes(empty, { quantity: 1, noRepeat: true, removeDuplicates: false })).toContain(
      "empty"
    );
    expect(getNameDrawValidationCodes(one, { quantity: 1, noRepeat: true, removeDuplicates: true })).toContain(
      "singleEntry"
    );
    expect(getNameDrawValidationCodes(many, { quantity: 10, noRepeat: true, removeDuplicates: false })).toEqual(
      expect.arrayContaining(["duplicatesFound", "quantityCapped"])
    );
  });

  test("reads and writes only safe name drawer query params", () => {
    const params = new URLSearchParams(
      "modo=embaralhar&quantidade=3&separador=auto&semRepetir=0&removerDuplicados=1&nomes=Ana"
    );
    const state = readNameDrawerStateFromParams(params);
    const built = buildNameDrawerSearchParams({ ...state, input: "Ana\nBruno" }).params;

    expect(state).toEqual({
      input: "",
      mode: "embaralhar",
      quantity: 3,
      separator: "auto",
      noRepeat: false,
      removeDuplicates: true,
    });
    expect(built.get("nomes")).toBeNull();
    expect(built.get("modo")).toBe("embaralhar");
    expect(built.get("semRepetir")).toBe("0");
  });

  test("builds explicit content share links with names only in the fragment", () => {
    const state: NameDrawerState = {
      input: "Ana\nBruno",
      mode: "vencedores",
      quantity: 2,
      separator: "linhas",
      noRepeat: true,
      removeDuplicates: false,
    };
    const share = buildNameDrawerShareUrl("https://example.test/geradores/sorteador-nomes", state, {
      includeContent: true,
    });
    const url = new URL(share.url);
    const fragmentParams = new URLSearchParams(url.hash.slice(1));

    expect(url.searchParams.get("nomes")).toBeNull();
    expect(url.searchParams.get("modo")).toBe("vencedores");
    expect(fragmentParams.get("conteudo")).toBe("1");
    expect(fragmentParams.get("nomes")).toBe("Ana\nBruno");
    expect(readNameDrawerContentFromFragment(url.hash)).toEqual({
      hasExplicitContent: true,
      input: "Ana\nBruno",
    });
  });

  test("omits oversized names from explicit content share fragments", () => {
    const share = buildNameDrawerShareUrl(
      "https://example.test/geradores/sorteador-nomes",
      {
        input: "Ana\n".repeat(1000),
        mode: "vencedores",
        quantity: 1,
        separator: "linhas",
        noRepeat: true,
        removeDuplicates: false,
      },
      { includeContent: true, maxFragmentLength: 40 }
    );
    const url = new URL(share.url);
    const fragmentParams = new URLSearchParams(url.hash.slice(1));

    expect(share.contentOmitted).toBe(true);
    expect(fragmentParams.get("conteudo")).toBe("1");
    expect(fragmentParams.get("nomes")).toBeNull();
  });
});

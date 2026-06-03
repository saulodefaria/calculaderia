import { describe, expect, test } from "vitest";
import { generatePassword, generateRandomNumbers, getPasswordPools } from "./generators";

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
});

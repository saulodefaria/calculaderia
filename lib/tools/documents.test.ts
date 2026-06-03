import { describe, expect, test } from "vitest";
import { formatCnpj, formatCpf, validateCnpj, validateCpf } from "./documents";

describe("document validators", () => {
  test("validates CPF check digits", () => {
    expect(validateCpf("529.982.247-25")).toBe(true);
    expect(validateCpf("52998224724")).toBe(false);
    expect(validateCpf("111.111.111-11")).toBe(false);
    expect(validateCpf("123")).toBe(false);
  });

  test("formats CPF input", () => {
    expect(formatCpf("52998224725")).toBe("529.982.247-25");
  });

  test("validates CNPJ check digits", () => {
    expect(validateCnpj("04.252.011/0001-10")).toBe(true);
    expect(validateCnpj("04252011000111")).toBe(false);
    expect(validateCnpj("00.000.000/0000-00")).toBe(false);
    expect(validateCnpj("123")).toBe(false);
  });

  test("formats CNPJ input", () => {
    expect(formatCnpj("04252011000110")).toBe("04.252.011/0001-10");
  });
});

import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatPercent,
  parseCurrencyInput,
  formatCurrencyInput,
  formatCurrencyFromNumber,
  parseCurrencyValue,
  formatPercentInput,
  formatPercentFromNumber,
  parsePercentValue,
} from "./format";

describe("formatCurrency", () => {
  it("formats positive numbers as BRL currency", () => {
    // Use toContain/toMatch to handle different space characters (regular vs non-breaking)
    expect(formatCurrency(1234.56)).toMatch(/R\$\s*1\.234,56/);
    expect(formatCurrency(1000000)).toMatch(/R\$\s*1\.000\.000,00/);
    expect(formatCurrency(0.99)).toMatch(/R\$\s*0,99/);
  });

  it("formats zero correctly", () => {
    expect(formatCurrency(0)).toMatch(/R\$\s*0,00/);
  });

  it("formats negative numbers correctly", () => {
    expect(formatCurrency(-1234.56)).toMatch(/-R\$\s*1\.234,56/);
  });

  it("handles non-finite values by returning zero", () => {
    expect(formatCurrency(NaN)).toMatch(/R\$\s*0,00/);
    expect(formatCurrency(Infinity)).toMatch(/R\$\s*0,00/);
    expect(formatCurrency(-Infinity)).toMatch(/R\$\s*0,00/);
  });

  it("rounds to 2 decimal places", () => {
    expect(formatCurrency(1234.567)).toMatch(/R\$\s*1\.234,57/);
    expect(formatCurrency(1234.564)).toMatch(/R\$\s*1\.234,56/);
  });
});

describe("formatPercent", () => {
  it("formats percentage values correctly", () => {
    expect(formatPercent(6)).toBe("6,00%");
    expect(formatPercent(12.5)).toBe("12,50%");
    expect(formatPercent(100)).toBe("100,00%");
  });

  it("formats zero correctly", () => {
    expect(formatPercent(0)).toBe("0,00%");
  });

  it("formats fractional percentages", () => {
    expect(formatPercent(0.5)).toBe("0,50%");
    expect(formatPercent(0.01)).toBe("0,01%");
  });
});

describe("parseCurrencyInput", () => {
  it("parses simple strings with comma", () => {
    expect(parseCurrencyInput("1234,56")).toBe(1234.56);
  });

  it("parses US formatted strings", () => {
    expect(parseCurrencyInput("1234.56")).toBe(1234.56);
  });

  it("removes currency symbols and handles comma decimal", () => {
    expect(parseCurrencyInput("R$ 1234,56")).toBe(1234.56);
    expect(parseCurrencyInput("R$1234,56")).toBe(1234.56);
  });

  it("returns 0 for invalid input", () => {
    expect(parseCurrencyInput("")).toBe(0);
    expect(parseCurrencyInput("abc")).toBe(0);
  });
});

describe("formatCurrencyInput", () => {
  it("formats digit strings as currency without prefix", () => {
    expect(formatCurrencyInput("123456")).toBe("1.234,56");
    expect(formatCurrencyInput("100000")).toBe("1.000,00");
  });

  it("handles small values", () => {
    expect(formatCurrencyInput("1")).toBe("0,01");
    expect(formatCurrencyInput("99")).toBe("0,99");
  });

  it("returns empty for empty input", () => {
    expect(formatCurrencyInput("")).toBe("");
  });

  it("strips non-digit characters", () => {
    expect(formatCurrencyInput("1.234,56")).toBe("1.234,56");
  });
});

describe("formatCurrencyFromNumber", () => {
  it("formats positive numbers without currency prefix", () => {
    expect(formatCurrencyFromNumber(1234.56)).toBe("1.234,56");
    expect(formatCurrencyFromNumber(1000000)).toBe("1.000.000,00");
  });

  it("returns empty for zero or negative values", () => {
    expect(formatCurrencyFromNumber(0)).toBe("");
    expect(formatCurrencyFromNumber(-100)).toBe("");
  });
});

describe("parseCurrencyValue", () => {
  it("parses BRL formatted strings to numbers", () => {
    expect(parseCurrencyValue("1.234,56")).toBe(1234.56);
    expect(parseCurrencyValue("1.000.000,00")).toBe(1000000);
  });

  it("returns 0 for empty string", () => {
    expect(parseCurrencyValue("")).toBe(0);
  });

  it("returns 0 for invalid input", () => {
    expect(parseCurrencyValue("abc")).toBe(0);
  });
});

describe("formatPercentInput", () => {
  it("keeps only digits and comma", () => {
    expect(formatPercentInput("6,5")).toBe("6,5");
    expect(formatPercentInput("12.5")).toBe("125");
    expect(formatPercentInput("abc6,5def")).toBe("6,5");
  });

  it("keeps only one comma", () => {
    expect(formatPercentInput("6,5,3")).toBe("6,53");
  });

  it("handles empty input", () => {
    expect(formatPercentInput("")).toBe("");
  });
});

describe("formatPercentFromNumber", () => {
  it("formats numbers as percent string with comma", () => {
    expect(formatPercentFromNumber(6)).toBe("6");
    expect(formatPercentFromNumber(6.5)).toBe("6,5");
    expect(formatPercentFromNumber(12.75)).toBe("12,75");
  });

  it("returns empty for zero or negative values", () => {
    expect(formatPercentFromNumber(0)).toBe("");
    expect(formatPercentFromNumber(-5)).toBe("");
  });
});

describe("parsePercentValue", () => {
  it("parses percent strings to numbers", () => {
    expect(parsePercentValue("6,5")).toBe(6.5);
    expect(parsePercentValue("12,75")).toBe(12.75);
  });

  it("returns 0 for empty string", () => {
    expect(parsePercentValue("")).toBe(0);
  });

  it("returns 0 for invalid input", () => {
    expect(parsePercentValue("abc")).toBe(0);
  });
});

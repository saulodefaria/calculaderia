import { describe, it, expect } from "vitest";
import {
  calcularTir,
  parseCashflowValue,
  parseCashflowsFromText,
  taxaAnualParaPeriodica,
  taxaPeriodicaParaAnual,
  validarCashflows,
} from "./tir";

/**
 * NPV com convenção do projeto: o primeiro fluxo está no período 1 (não no tempo 0).
 * \sum_{t=1..n} CF_t / (1+r)^t
 */
function npvPeriod1(rate: number, cashflows: number[]): number {
  return cashflows.reduce((acc, cf, i) => acc + cf / Math.pow(1 + rate, i + 1), 0);
}

describe("taxaPeriodicaParaAnual / taxaAnualParaPeriodica", () => {
  it("converts periodic rate -> annual and does roundtrip for all periods", () => {
    const cases: Array<{ periodo: "mensal" | "trimestral" | "semestral" | "anual"; n: number; r: number }> = [
      { periodo: "mensal", n: 12, r: 0.01 },
      { periodo: "trimestral", n: 4, r: 0.05 },
      { periodo: "semestral", n: 2, r: 0.03 },
      { periodo: "anual", n: 1, r: 0.12 },
    ];

    for (const { periodo, n, r } of cases) {
      const anual = taxaPeriodicaParaAnual(r, periodo);
      expect(anual).toBeCloseTo(Math.pow(1 + r, n) - 1, 12);

      const back = taxaAnualParaPeriodica(anual, periodo);
      expect(back).toBeCloseTo(r, 12);
    }
  });

  it("handles negative rates (e.g.: -1% per month)", () => {
    const anual = taxaPeriodicaParaAnual(-0.01, "mensal");
    expect(anual).toBeCloseTo(Math.pow(0.99, 12) - 1, 12);

    const mensal = taxaAnualParaPeriodica(anual, "mensal");
    expect(mensal).toBeCloseTo(-0.01, 12);
  });
});

describe("parseCashflowValue", () => {
  it("parses BR and US formats with symbol/currency, including negative", () => {
    expect(parseCashflowValue("R$ 1.234,56")).toBeCloseTo(1234.56, 10);
    expect(parseCashflowValue("$1,234.56")).toBeCloseTo(1234.56, 10);
    expect(parseCashflowValue("-1.234,56")).toBeCloseTo(-1234.56, 10);
    expect(parseCashflowValue("  - 1.234,56  ")).toBeCloseTo(-1234.56, 10);
    expect(parseCashflowValue("1234")).toBeCloseTo(1234, 10);
  });

  it("interprets single separator as thousands when there is grouping (e.g.: 1,234 / 1.234)", () => {
    expect(parseCashflowValue("1,234")).toBe(1234);
    expect(parseCashflowValue("1.234")).toBe(1234);
    expect(parseCashflowValue("1,234,567")).toBe(1234567);
    expect(parseCashflowValue("1.234.567")).toBe(1234567);
  });

  it("rejects empty or invalid strings (strict parse, without accepting partial parse)", () => {
    expect(parseCashflowValue("")).toBeNull();
    expect(parseCashflowValue("   ")).toBeNull();
    expect(parseCashflowValue("-")).toBeNull();
    expect(parseCashflowValue("abc")).toBeNull();
    expect(parseCashflowValue("1.2.3")).toBeNull();
    expect(parseCashflowValue("1,2,3")).toBeNull();
    expect(parseCashflowValue("1.1,2.2,3.3")).toBeNull(); // list, not a single number
  });
});

describe("parseCashflowsFromText", () => {
  it("returns empty for empty text", () => {
    expect(parseCashflowsFromText("")).toEqual({ values: [], errors: [] });
    expect(parseCashflowsFromText("   ")).toEqual({ values: [], errors: [] });
  });

  it("parses list by newline / tab / semicolon", () => {
    const byNewline = parseCashflowsFromText("100\n-50\nR$ 25,50");
    expect(byNewline.errors).toEqual([]);
    expect(byNewline.values).toHaveLength(3);
    expect(byNewline.values[0]).toBeCloseTo(100, 10);
    expect(byNewline.values[1]).toBeCloseTo(-50, 10);
    expect(byNewline.values[2]).toBeCloseTo(25.5, 10);

    const byTab = parseCashflowsFromText("100\t-50\t25");
    expect(byTab).toEqual({ values: [100, -50, 25], errors: [] });

    const bySemicolon = parseCashflowsFromText("100; -50; 25");
    expect(bySemicolon).toEqual({ values: [100, -50, 25], errors: [] });
  });

  it("parses list by comma (including decimals with dot) when not a single number", () => {
    const ints = parseCashflowsFromText("100,-50,25");
    expect(ints).toEqual({ values: [100, -50, 25], errors: [] });

    const dotDecimals = parseCashflowsFromText("1.1,2.2,3.3");
    expect(dotDecimals.errors).toEqual([]);
    expect(dotDecimals.values).toHaveLength(3);
    expect(dotDecimals.values[0]).toBeCloseTo(1.1, 10);
    expect(dotDecimals.values[1]).toBeCloseTo(2.2, 10);
    expect(dotDecimals.values[2]).toBeCloseTo(3.3, 10);
  });

  it("does not interpret single number with US thousands as list (e.g.: 1,234,567.89)", () => {
    const r = parseCashflowsFromText("1,234,567.89");
    expect(r.errors).toEqual([]);
    expect(r.values).toEqual([1234567.89]);
  });

  it("reports error indices keeping valid values", () => {
    const r = parseCashflowsFromText("100\nabc\n-50");
    expect(r.values).toEqual([100, -50]);
    expect(r.errors).toEqual([1]);

    const r2 = parseCashflowsFromText("abc,def");
    expect(r2.values).toEqual([]);
    expect(r2.errors).toEqual([0, 1]);
  });
});

describe("validarCashflows", () => {
  it("requires at least 2 flows", () => {
    expect(validarCashflows([]).valido).toBe(false);
    expect(validarCashflows([100]).valido).toBe(false);
  });

  it("requires at least one positive and one negative flow (zeros don't count)", () => {
    expect(validarCashflows([100, 100]).valido).toBe(false);
    expect(validarCashflows([-100, -1]).valido).toBe(false);
    expect(validarCashflows([0, 0, 0]).valido).toBe(false);

    expect(validarCashflows([-100, 0, 50]).valido).toBe(true);
  });
});

describe("calcularTir", () => {
  it("returns error and statistics when validation fails (no sign change)", () => {
    const r = calcularTir({ cashflows: [100, 100], periodo: "mensal" });
    expect(r.tirPeriodica).toBeNull();
    expect(r.tirAnual).toBeNull();
    expect(r.erroCode).toBe("needs_positive_and_negative");
    expect(r.totalFluxos).toBe(200);
    expect(r.totalPositivos).toBe(200);
    expect(r.totalNegativos).toBe(0);
    expect(r.quantidadePeriodos).toBe(2);
  });

  it("returns error and statistics when there are less than 2 flows", () => {
    const r = calcularTir({ cashflows: [100], periodo: "mensal" });
    expect(r.tirPeriodica).toBeNull();
    expect(r.tirAnual).toBeNull();
    expect(r.erroCode).toBe("min_cashflows");
    expect(r.totalFluxos).toBe(100);
    expect(r.totalPositivos).toBe(100);
    expect(r.totalNegativos).toBe(0);
    expect(r.quantidadePeriodos).toBe(1);
  });

  it("calculates a known IRR (2 periods): [-100, 110] => 10% per period", () => {
    const cashflows = [-100, 110];
    const r = calcularTir({ cashflows, periodo: "mensal" });

    expect(r.erroCode).toBeUndefined();
    expect(r.tirPeriodica).not.toBeNull();
    expect(r.tirAnual).not.toBeNull();

    expect(r.tirPeriodica!).toBeCloseTo(0.1, 7);
    expect(r.tirAnual!).toBeCloseTo(Math.pow(1.1, 12) - 1, 5);

    // Fundamental property: NPV(irr) ~ 0 in project convention (period 1)
    expect(Math.abs(npvPeriod1(r.tirPeriodica!, cashflows))).toBeLessThan(1e-4);

    // Statistics
    expect(r.totalFluxos).toBe(10);
    expect(r.totalPositivos).toBe(110);
    expect(r.totalNegativos).toBe(100);
    expect(r.quantidadePeriodos).toBe(2);
  });

  it("correctly converts periodic IRR to equivalent annual according to periodicity", () => {
    const cashflows = [-100, 110]; // irr = 10% per period

    const trimestral = calcularTir({ cashflows, periodo: "trimestral" });
    expect(trimestral.tirPeriodica).not.toBeNull();
    expect(trimestral.tirAnual).not.toBeNull();
    expect(trimestral.tirPeriodica!).toBeCloseTo(0.1, 7);
    expect(trimestral.tirAnual!).toBeCloseTo(Math.pow(1.1, 4) - 1, 6);
  });

  it("calculates IRR in multiple periods with analytical solution: [-100, 0, 110] => sqrt(1.1)-1", () => {
    const cashflows = [-100, 0, 110];
    const expected = Math.sqrt(1.1) - 1;

    const r = calcularTir({ cashflows, periodo: "anual" });
    expect(r.tirPeriodica).not.toBeNull();
    expect(r.tirAnual).not.toBeNull();

    expect(r.tirPeriodica!).toBeCloseTo(expected, 7);
    expect(r.tirAnual!).toBeCloseTo(expected, 7); // anual -> n=1
    expect(Math.abs(npvPeriod1(r.tirPeriodica!, cashflows))).toBeLessThan(1e-4);
  });

  it("calculates negative IRR when return is insufficient: [-100, 50] => -50% per period", () => {
    const cashflows = [-100, 50];
    const r = calcularTir({ cashflows, periodo: "anual" });
    expect(r.tirPeriodica).not.toBeNull();
    expect(r.tirAnual).not.toBeNull();

    expect(r.tirPeriodica!).toBeCloseTo(-0.5, 8);
    expect(r.tirAnual!).toBeCloseTo(-0.5, 8);
    expect(Math.abs(npvPeriod1(r.tirPeriodica!, cashflows))).toBeLessThan(1e-4);
  });

  it("returns IRR close to zero when NPV zeros at r=0: [-100, 100] => 0%", () => {
    const cashflows = [-100, 100];
    const r = calcularTir({ cashflows, periodo: "mensal" });
    expect(r.tirPeriodica).not.toBeNull();
    expect(r.tirAnual).not.toBeNull();

    expect(Math.abs(r.tirPeriodica!)).toBeLessThan(1e-5);
    expect(Math.abs(r.tirAnual!)).toBeLessThan(1e-5);
    expect(Math.abs(npvPeriod1(r.tirPeriodica!, cashflows))).toBeLessThan(1e-4);
  });
});

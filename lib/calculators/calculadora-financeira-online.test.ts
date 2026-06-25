import { describe, expect, it } from "vitest";
import {
  CALCULADORA_FINANCEIRA_ONLINE_SUPPORTED_SOURCE_VERSION,
  calculateFinancialCashflows,
  calculateFinancialTvm,
  calculateFinancialNpv,
  countCashflowSignChanges,
  getDefaultCalculadoraFinanceiraOnlineInputs,
  validateCalculadoraFinanceiraOnlineInputs,
  type FinancialTvmInputs,
} from "./calculadora-financeira-online";

function tvm(overrides: Partial<FinancialTvmInputs> = {}): FinancialTvmInputs {
  return {
    ...getDefaultCalculadoraFinanceiraOnlineInputs().tvm,
    ...overrides,
  };
}

describe("calculateFinancialTvm", () => {
  it("solves future value from the source-derived compound value example", () => {
    const result = calculateFinancialTvm(tvm({ solveFor: "fv", pv: -1000, i: 1, n: 12, pmt: 0 }));

    expect(result.ok).toBe(true);
    expect(result.roundedSolvedValue).toBe(1126.83);
    expect(result.residual).toBeCloseTo(0, 6);
  });

  it("solves end-of-period PMT for the default source-derived TVM example", () => {
    const result = calculateFinancialTvm(tvm({ solveFor: "pmt", pv: 100000, i: 1, n: 12, fv: 0, paymentTiming: "end" }));

    expect(result.ok).toBe(true);
    expect(result.roundedSolvedValue).toBe(-8884.88);
    expect(result.totalPayments).toBe(-106618.55);
    expect(result.residual).toBeCloseTo(0, 6);
  });

  it("solves beginning-of-period PMT with the timing adjustment", () => {
    const result = calculateFinancialTvm(
      tvm({ solveFor: "pmt", pv: 100000, i: 1, n: 12, fv: 0, paymentTiming: "begin" })
    );

    expect(result.ok).toBe(true);
    expect(result.roundedSolvedValue).toBe(-8796.91);
    expect(result.residual).toBeCloseTo(0, 6);
  });

  it("solves present value and zero-rate payment variants", () => {
    const pv = calculateFinancialTvm(tvm({ solveFor: "pv", i: 1, n: 12, pmt: -8884.878867834166, fv: 0 }));
    const zeroRatePmt = calculateFinancialTvm(tvm({ solveFor: "pmt", i: 0, n: 10, pv: 1000, fv: 0 }));

    expect(pv.roundedSolvedValue).toBe(100000);
    expect(zeroRatePmt.roundedSolvedValue).toBe(-100);
    expect(zeroRatePmt.warnings).toContain("zeroRate");
  });

  it("solves rate with a bounded method for a known PMT scenario", () => {
    const result = calculateFinancialTvm(
      tvm({ solveFor: "i", pv: 100000, n: 12, pmt: -8884.878867834166, fv: 0, paymentTiming: "end" })
    );

    expect(result.ok).toBe(true);
    expect(result.solvedValue).toBeCloseTo(1, 5);
    expect(result.residual).toBeCloseTo(0, 5);
  });

  it("solves an integer period count and rejects invalid logarithm inputs", () => {
    const valid = calculateFinancialTvm(tvm({ solveFor: "n", pv: -1000, pmt: 0, fv: 1126.8250301319698, i: 1 }));
    const invalid = calculateFinancialTvm(tvm({ solveFor: "n", pv: 1000, pmt: -10, fv: 1000, i: 1 }));

    expect(valid.ok).toBe(true);
    expect(valid.roundedSolvedValue).toBe(12);
    expect(invalid.ok).toBe(false);
    expect(invalid.errors).toContain("invalidLogarithm");
  });

  it("validates source version, period, rate, money, and timing constraints", () => {
    const defaults = getDefaultCalculadoraFinanceiraOnlineInputs();

    expect(
      validateCalculadoraFinanceiraOnlineInputs({
        ...defaults,
        sourceVersion: "2027-01-01" as typeof CALCULADORA_FINANCEIRA_ONLINE_SUPPORTED_SOURCE_VERSION,
      })
    ).toContain("sourceVersion");
    expect(calculateFinancialTvm(tvm({ n: 12.5, pmt: -100 })).errors).toContain("periodsInteger");
    expect(calculateFinancialTvm(tvm({ i: -100 })).errors).toContain("rate");
    expect(calculateFinancialTvm(tvm({ pv: 1_000_000_000_001 })).errors).toContain("presentValue");
    expect(calculateFinancialTvm(tvm({ paymentTiming: "middle" as FinancialTvmInputs["paymentTiming"] })).errors).toContain(
      "paymentTiming"
    );
  });
});

describe("calculateFinancialCashflows", () => {
  it("calculates source-derived NPV and IRR examples with period-0 cash flow", () => {
    const result = calculateFinancialCashflows({
      discountRate: 10,
      cashflows: [-1000, 400, 400, 400],
      periodLabel: "periodic",
    });

    expect(result.ok).toBe(true);
    expect(result.roundedNpv).toBe(-5.26);
    expect(result.irrPerPeriodPercent).toBeCloseTo(9.701, 3);
    expect(result.totalInflows).toBe(1200);
    expect(result.totalOutflows).toBe(1000);
    expect(result.netCashflow).toBe(200);
  });

  it("annualizes IRR only when the period label is known", () => {
    const monthly = calculateFinancialCashflows({
      discountRate: 10,
      cashflows: [-1000, 400, 400, 400],
      periodLabel: "monthly",
    });
    const periodic = calculateFinancialCashflows({
      discountRate: 10,
      cashflows: [-1000, 400, 400, 400],
      periodLabel: "periodic",
    });

    expect(monthly.annualizedIrrPercent).toBeCloseTo(203.758, 3);
    expect(periodic.annualizedIrrPercent).toBeNull();
  });

  it("returns an IRR error when cash flows do not have opposite signs", () => {
    const result = calculateFinancialCashflows({
      discountRate: 10,
      cashflows: [100, 200, 300],
      periodLabel: "periodic",
    });

    expect(result.ok).toBe(false);
    expect(result.roundedNpv).toBe(529.75);
    expect(result.errors).toContain("cashflowSigns");
    expect(result.irrPerPeriod).toBeNull();
  });

  it("warns about multiple sign changes", () => {
    const result = calculateFinancialCashflows({
      discountRate: 10,
      cashflows: [-1000, 2000, -1200],
      periodLabel: "periodic",
    });

    expect(result.signChanges).toBe(2);
    expect(countCashflowSignChanges([-1000, 2000, -1200])).toBe(2);
    expect(result.warnings).toContain("multipleSignChanges");
  });

  it("uses the period-0 NPV formula directly", () => {
    expect(calculateFinancialNpv(10, [-1000, 400, 400, 400])).toBeCloseTo(-5.259203606, 9);
  });

  it("validates discount rate, count, and maximum cash-flow amount", () => {
    expect(
      calculateFinancialCashflows({ discountRate: -100, cashflows: [-1000, 400], periodLabel: "periodic" }).errors
    ).toContain("cashflowDiscountRate");
    expect(
      calculateFinancialCashflows({ discountRate: 10, cashflows: [-1000], periodLabel: "periodic" }).errors
    ).toContain("cashflowCount");
    expect(
      calculateFinancialCashflows({
        discountRate: 10,
        cashflows: [-1000, 1_000_000_000_001],
        periodLabel: "periodic",
      }).errors
    ).toContain("cashflowValue");
  });
});

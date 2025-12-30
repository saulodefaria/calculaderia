import { describe, it, expect } from "vitest";
import { npv, calculateIrr } from "./irr";
import { convertMonthlyRateToAnnualRate } from "./math";
import { calcularFinanciamento, type InputsFinanciamento } from "../calculators/financiamento";

describe("npv - Net Present Value", () => {
  it("calculates NPV for simple cashflows", () => {
    // At 0% rate, NPV should equal sum of discounted cashflows
    const result = npv(0, [100, 100, 100]);
    expect(result).toBeCloseTo(300, 1);
  });

  it("calculates NPV with positive rate", () => {
    // At 10% rate, future values are worth less
    const result = npv(0.1, [100, 100, 100]);
    expect(result).toBeLessThan(300);
    expect(result).toBeGreaterThan(0);
  });

  it("calculates NPV with negative rate", () => {
    // At -10% rate, future values are worth more
    const result = npv(-0.1, [100, 100, 100]);
    expect(result).toBeGreaterThan(300);
  });

  it("returns NaN for extreme rates causing overflow", () => {
    // Very extreme negative rate should cause overflow
    const result = npv(-0.999, Array(500).fill(100));
    expect(Number.isNaN(result)).toBe(true);
  });

  it("handles empty cashflows", () => {
    expect(npv(0.1, [])).toBe(0);
  });
});

describe("calculateIrr - basic sanity checks", () => {
  it("returns null when there is no sign change", () => {
    // All positive flows
    expect(calculateIrr([100, 100, 100])).toBeNull();
    // All negative flows
    expect(calculateIrr([-100, -50, -25])).toBeNull();
  });

  it("returns null for empty cashflows", () => {
    expect(calculateIrr([])).toBeNull();
  });

  it("computes a simple known IRR", () => {
    // Flows: -100, +110 → exact IRR of 10% per period
    const irr = calculateIrr([-100, 110]);
    expect(irr).not.toBeNull();
    expect(irr!).toBeCloseTo(0.1, 6);

    const irrAnual = convertMonthlyRateToAnnualRate(irr!);
    // 10% per month ≈ 213.84% per year
    expect(irrAnual).toBeGreaterThan(2.0);
  });

  it("computes IRR for a series of negative cashflows with positive ending", () => {
    // Simulates: pays 100/month for 12 months, receives 1500 at the end
    // Total paid: 1200, receives 1500 → should have positive IRR
    const cashflows = Array(12).fill(-100);
    cashflows[11] += 1500; // last month: -100 + 1500 = 1400

    const irr = calculateIrr(cashflows);
    expect(irr).not.toBeNull();
    expect(irr!).toBeGreaterThan(0); // should be positive
  });

  it("computes negative IRR when total paid exceeds return", () => {
    // Simulates: pays 100/month for 12 months, receives only 800 at the end
    // Total paid: 1200, receives 800 → should have negative IRR
    const cashflows = Array(12).fill(-100);
    cashflows[11] += 800; // last month: -100 + 800 = 700

    const irr = calculateIrr(cashflows);
    expect(irr).not.toBeNull();
    expect(irr!).toBeLessThan(0); // should be negative
  });

  it("handles investment scenario (positive first, negative after)", () => {
    // Investment: receive 1000 now, pay 100/month for 12 months
    const cashflows = [1000, ...Array(12).fill(-100)];
    const irr = calculateIrr(cashflows);
    expect(irr).not.toBeNull();
    expect(irr!).toBeGreaterThan(0);
  });
});

describe("convertMonthlyRateToAnnualRate", () => {
  it("converts monthly to annual rate correctly", () => {
    // 1% monthly = (1.01)^12 - 1 ≈ 12.68% annual
    const annual = convertMonthlyRateToAnnualRate(0.01);
    expect(annual).toBeCloseTo(0.1268, 3);
  });

  it("handles zero rate", () => {
    expect(convertMonthlyRateToAnnualRate(0)).toBe(0);
  });

  it("handles negative rates", () => {
    // -1% monthly = (0.99)^12 - 1 ≈ -11.36% annual
    const annual = convertMonthlyRateToAnnualRate(-0.01);
    expect(annual).toBeCloseTo(-0.1136, 3);
  });

  it("handles high rates", () => {
    // 10% monthly = (1.1)^12 - 1 ≈ 213.84% annual
    const annual = convertMonthlyRateToAnnualRate(0.1);
    expect(annual).toBeCloseTo(2.1384, 2);
  });
});

describe("calculateIrr - loan scenarios", () => {
  it("produces a negative IRR when interest rates are very high and property doesn't appreciate", () => {
    const inputs: InputsFinanciamento = {
      valorEmprestimo: 1_000_000,
      valorEntrada: 0,
      taxaJurosAnual: 40,
      meses: 360,
      correcaoAnualImovel: 0,
    };

    const resultadoSAC = calcularFinanciamento(inputs, "sac");
    expect(resultadoSAC.tirMensal).not.toBeNull();
    // With very high interest and no property appreciation, we expect negative TIR
    expect(resultadoSAC.tirMensal!).toBeLessThan(0);

    const resultadoPRICE = calcularFinanciamento(inputs, "price");
    expect(resultadoPRICE.tirMensal).not.toBeNull();
    expect(resultadoPRICE.tirMensal!).toBeLessThan(0);
  });

  it("produces a positive IRR when property appreciates significantly", () => {
    const inputs: InputsFinanciamento = {
      valorEmprestimo: 500_000,
      valorEntrada: 100_000,
      taxaJurosAnual: 10, // moderate interest
      meses: 240, // 20 years
      correcaoAnualImovel: 8, // property appreciates 8% per year
    };

    const resultadoSAC = calcularFinanciamento(inputs, "sac");
    expect(resultadoSAC.tirMensal).not.toBeNull();
    // With high property appreciation, we expect positive TIR
    expect(resultadoSAC.tirMensal!).toBeGreaterThan(0);

    const resultadoPRICE = calcularFinanciamento(inputs, "price");
    expect(resultadoPRICE.tirMensal).not.toBeNull();
    expect(resultadoPRICE.tirMensal!).toBeGreaterThan(0);
  });

  it("IRR is close to zero when costs and appreciation balance out", () => {
    // Scenario where interest and appreciation roughly balance
    const inputs: InputsFinanciamento = {
      valorEmprestimo: 300_000,
      valorEntrada: 60_000,
      taxaJurosAnual: 12,
      meses: 180, // 15 years
      correcaoAnualImovel: 4, // appreciation less than interest
    };

    const resultado = calcularFinanciamento(inputs, "sac");
    expect(resultado.tirMensal).not.toBeNull();
    // IRR should exist (can be positive or negative, but close to zero)
    expect(Math.abs(resultado.tirMensal!)).toBeLessThan(0.001); // less than 0.1% per month
  });

  it("handles short-term loan correctly", () => {
    const inputs: InputsFinanciamento = {
      valorEmprestimo: 100_000,
      valorEntrada: 20_000,
      taxaJurosAnual: 15,
      meses: 24, // 2 years
      correcaoAnualImovel: 5,
    };

    const resultado = calcularFinanciamento(inputs, "price");
    expect(resultado.tirMensal).not.toBeNull();
    // Should calculate a valid IRR for short loan
    expect(resultado.tirAnual).not.toBeNull();
  });

  it("calculates correct valorImovelFinal based on correcaoAnualImovel", () => {
    const inputs: InputsFinanciamento = {
      valorEmprestimo: 1_000_000,
      valorEntrada: 0,
      taxaJurosAnual: 10,
      meses: 120, // 10 years
      correcaoAnualImovel: 6,
    };

    const resultado = calcularFinanciamento(inputs, "sac");

    // Expected final value: 1M * (1.06)^10 ≈ 1,790,847
    const expectedFinal = 1_000_000 * Math.pow(1.06, 10);
    expect(resultado.valorImovelFinal).toBeCloseTo(expectedFinal, 0);
  });
});

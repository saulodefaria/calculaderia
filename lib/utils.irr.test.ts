import { describe, it, expect } from "vitest";
import { calculateIrr, irrMonthlyToAnnual } from "./utils";
import { calcularFinanciamento, type InputsFinanciamento } from "./calculators/financiamento";

describe("calculateIrr - basic sanity checks", () => {
  it("returns null when there is no sign change", () => {
    // Todos fluxos positivos
    expect(calculateIrr([100, 100, 100])).toBeNull();
    // Todos fluxos negativos
    expect(calculateIrr([-100, -50, -25])).toBeNull();
  });

  it("computes a simple known IRR", () => {
    // Fluxos: -100, +110 → TIR exata de 10% ao período
    const irr = calculateIrr([-100, 110]);
    expect(irr).not.toBeNull();
    expect(irr!).toBeCloseTo(0.1, 6);

    const irrAnual = irrMonthlyToAnnual(irr!);
    // 10% ao mês ≈ 213.84% ao ano
    expect(irrAnual).toBeGreaterThan(2.0);
  });

  it("computes IRR for a series of negative cashflows with positive ending", () => {
    // Simula: paga 100/mês por 12 meses, recebe 1500 no final
    // Total pago: 1200, recebe 1500 → deve ter TIR positiva
    const cashflows = Array(12).fill(-100);
    cashflows[11] += 1500; // último mês: -100 + 1500 = 1400

    const irr = calculateIrr(cashflows);
    expect(irr).not.toBeNull();
    expect(irr!).toBeGreaterThan(0); // deve ser positiva
  });

  it("computes negative IRR when total paid exceeds return", () => {
    // Simula: paga 100/mês por 12 meses, recebe apenas 800 no final
    // Total pago: 1200, recebe 800 → deve ter TIR negativa
    const cashflows = Array(12).fill(-100);
    cashflows[11] += 800; // último mês: -100 + 800 = 700

    const irr = calculateIrr(cashflows);
    expect(irr).not.toBeNull();
    expect(irr!).toBeLessThan(0); // deve ser negativa
  });
});

describe("calculateIrr - financiamento scenarios", () => {
  it("produces a negative TIR when juros are very high and the imóvel não valoriza", () => {
    const inputs: InputsFinanciamento = {
      valorEmprestimo: 1_000_000,
      valorEntrada: 0,
      taxaJurosAnual: 40,
      meses: 360,
      correcaoAnualImovel: 0,
    };

    const resultadoSAC = calcularFinanciamento(inputs, "sac");
    expect(resultadoSAC.tirMensal).not.toBeNull();
    // Com juros muito altos e imóvel sem valorização, esperamos TIR negativa
    expect(resultadoSAC.tirMensal!).toBeLessThan(0);

    const resultadoPRICE = calcularFinanciamento(inputs, "price");
    expect(resultadoPRICE.tirMensal).not.toBeNull();
    expect(resultadoPRICE.tirMensal!).toBeLessThan(0);
  });

  it("produces a positive TIR when property appreciates significantly", () => {
    const inputs: InputsFinanciamento = {
      valorEmprestimo: 500_000,
      valorEntrada: 100_000,
      taxaJurosAnual: 10, // juros moderados
      meses: 240, // 20 anos
      correcaoAnualImovel: 8, // imóvel valoriza 8% ao ano
    };

    const resultadoSAC = calcularFinanciamento(inputs, "sac");
    expect(resultadoSAC.tirMensal).not.toBeNull();
    // Com valorização alta do imóvel, esperamos TIR positiva
    expect(resultadoSAC.tirMensal!).toBeGreaterThan(0);

    const resultadoPRICE = calcularFinanciamento(inputs, "price");
    expect(resultadoPRICE.tirMensal).not.toBeNull();
    expect(resultadoPRICE.tirMensal!).toBeGreaterThan(0);
  });

  it("TIR is close to zero when costs and appreciation balance out", () => {
    // Cenário onde juros e valorização se equilibram aproximadamente
    const inputs: InputsFinanciamento = {
      valorEmprestimo: 300_000,
      valorEntrada: 60_000,
      taxaJurosAnual: 12,
      meses: 180, // 15 anos
      correcaoAnualImovel: 4, // valorização menor que os juros
    };

    const resultado = calcularFinanciamento(inputs, "sac");
    expect(resultado.tirMensal).not.toBeNull();
    // A TIR deve existir (pode ser positiva ou negativa, mas próxima de zero)
    expect(Math.abs(resultado.tirMensal!)).toBeLessThan(0.001); // menos que 0,1% ao mês em valor absoluto ~ 0,06%
  });

  it("handles short-term financing correctly", () => {
    const inputs: InputsFinanciamento = {
      valorEmprestimo: 100_000,
      valorEntrada: 20_000,
      taxaJurosAnual: 15,
      meses: 24, // 2 anos
      correcaoAnualImovel: 5,
    };

    const resultado = calcularFinanciamento(inputs, "price");
    expect(resultado.tirMensal).not.toBeNull();
    // Deve calcular uma TIR válida para financiamento curto
    expect(resultado.tirAnual).not.toBeNull();
  });

  it("calculates correct valorImovelFinal based on correcaoAnualImovel", () => {
    const inputs: InputsFinanciamento = {
      valorEmprestimo: 1_000_000,
      valorEntrada: 0,
      taxaJurosAnual: 10,
      meses: 120, // 10 anos
      correcaoAnualImovel: 6,
    };

    const resultado = calcularFinanciamento(inputs, "sac");

    // Valor final esperado: 1M * (1.06)^10 ≈ 1.790.847
    const expectedFinal = 1_000_000 * Math.pow(1.06, 10);
    expect(resultado.valorImovelFinal).toBeCloseTo(expectedFinal, 0);
  });
});

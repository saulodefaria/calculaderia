import { describe, it, expect } from "vitest";
import { calculateIrr, getAluguelCorrigidoNoMes, round2 } from "../utils";
import {
  calcularSAC,
  calcularPRICE,
  recalcularComAmortizacoes,
  type InputsFinanciamento,
  type AmortizacaoAdicional,
} from "./financiamento";

describe("calcularSAC", () => {
  it("correctly calculates basic SAC", () => {
    const inputs: InputsFinanciamento = {
      valorEmprestimo: 100000,
      valorEntrada: 0,
      taxaJurosAnual: 12, // 12% a.a.
      meses: 12,
      correcaoAnualImovel: 0,
    };

    const resultado = calcularSAC(inputs);

    expect(resultado.valorFinanciado).toBe(100000);
    expect(resultado.parcelas.length).toBe(12);

    // Constant amortization
    const amortizacaoEsperada = 100000 / 12;
    resultado.parcelas.forEach((p) => {
      expect(p.amortizacao).toBeCloseTo(amortizacaoEsperada, 0);
    });

    // Decreasing payments (interest decreases)
    expect(resultado.parcelas[0].prestacao).toBeGreaterThan(resultado.parcelas[11].prestacao);
  });

  it("considers down payment in calculation", () => {
    const inputs: InputsFinanciamento = {
      valorEmprestimo: 100000,
      valorEntrada: 20000,
      taxaJurosAnual: 12,
      meses: 12,
      correcaoAnualImovel: 0,
    };

    const resultado = calcularSAC(inputs);

    expect(resultado.valorFinanciado).toBe(80000);
  });
});

describe("calcularPRICE", () => {
  it("correctly calculates basic PRICE", () => {
    const inputs: InputsFinanciamento = {
      valorEmprestimo: 100000,
      valorEntrada: 0,
      taxaJurosAnual: 12,
      meses: 12,
      correcaoAnualImovel: 0,
    };

    const resultado = calcularPRICE(inputs);

    expect(resultado.valorFinanciado).toBe(100000);
    expect(resultado.parcelas.length).toBe(12);

    // Constant payments (with small tolerance for rounding)
    const primeiraPrestacao = resultado.parcelas[0].prestacao;
    resultado.parcelas.forEach((p, i) => {
      // Last payment may be slightly different due to rounding
      if (i < resultado.parcelas.length - 1) {
        expect(p.prestacao).toBeCloseTo(primeiraPrestacao, 1);
      }
    });

    // Increasing amortization
    expect(resultado.parcelas[0].amortizacao).toBeLessThan(resultado.parcelas[11].amortizacao);
  });

  it("supports zero interest and closes the final cent", () => {
    const resultado = calcularPRICE({
      valorEmprestimo: 100000,
      valorEntrada: 10000,
      taxaJurosAnual: 0,
      meses: 12,
      correcaoAnualImovel: 0,
    });

    expect(resultado.totalJurosPagos).toBe(0);
    expect(resultado.primeiraPrestacao).toBe(7500);
    expect(resultado.ultimaPrestacao).toBe(7500);
    expect(resultado.parcelas.at(-1)?.saldoDevedor).toBe(0);
  });
});

describe("zero-interest financing schedules", () => {
  it("closes SAC at zero with a cent-safe final amortization", () => {
    const resultado = calcularSAC({
      valorEmprestimo: 100000,
      valorEntrada: 0,
      taxaJurosAnual: 0,
      meses: 12,
      correcaoAnualImovel: 0,
    });

    expect(resultado.totalJurosPagos).toBe(0);
    expect(resultado.parcelas.at(-1)?.saldoDevedor).toBe(0);
    expect(resultado.parcelas.reduce((total, parcela) => total + parcela.amortizacao, 0)).toBeCloseTo(100000, 2);
  });
});

describe("positive-rate financing accounting invariants", () => {
  it.each([
    ["SAC", calcularSAC],
    ["Price", calcularPRICE],
  ] as const)("keeps an awkward %s schedule cent-consistent", (_label, calculate) => {
    const resultado = calculate({
      valorEmprestimo: 123456.78,
      valorEntrada: 1234.56,
      taxaJurosAnual: 11.37,
      meses: 137,
      correcaoAnualImovel: 4.25,
    });
    const totalAmortizado = round2(
      resultado.parcelas.reduce((total, parcela) => total + parcela.amortizacao, 0)
    );
    const totalPrestacoes = round2(
      resultado.parcelas.reduce((total, parcela) => total + parcela.prestacao, 0)
    );

    expect(resultado.parcelas.at(-1)?.saldoDevedor).toBe(0);
    expect(totalAmortizado).toBeCloseTo(resultado.valorFinanciado, 2);
    expect(totalPrestacoes).toBeCloseTo(round2(resultado.valorFinanciado + resultado.totalJurosPagos), 2);
  });
});

describe("calcularPRICE - IRR with rent", () => {
  it("allows positive monthly cashflow when rent > payment", () => {
    const baseInputs: InputsFinanciamento = {
      valorEmprestimo: 300_000,
      valorEntrada: 60_000,
      taxaJurosAnual: 12,
      meses: 24,
      correcaoAnualImovel: 0,
    };

    const base = calcularPRICE(baseInputs);
    const prestacaoBase = base.parcelas[0]?.prestacao ?? 0;
    expect(prestacaoBase).toBeGreaterThan(0);

    // Ensures that rent exceeds payment, generating positive monthly flow.
    const aluguelMensal = round2(prestacaoBase + 100);

    const inputs: InputsFinanciamento = {
      ...baseInputs,
      aluguelMensal,
      correcaoAnualAluguel: 0,
    };

    const resultado = calcularPRICE(inputs);
    expect(resultado.tirMensal).not.toBeNull();

    // Reconstructs expected cashflows from payments and validates they match calculated IRR.
    const cashflows = resultado.parcelas.map((p) => {
      const aluguelNoMes = getAluguelCorrigidoNoMes(p.mes, aluguelMensal, 0);
      return round2(aluguelNoMes - p.prestacao);
    });

    // Down payment as outflow in first month
    cashflows[0] -= inputs.valorEntrada;
    // Property value in last month
    cashflows[cashflows.length - 1] += resultado.valorImovelFinal;

    // There should be at least one intermediate month with positive flow due to rent > payment.
    expect(cashflows.slice(1, -1).some((cf) => cf > 0)).toBe(true);

    const irrEsperada = calculateIrr(cashflows);
    expect(irrEsperada).not.toBeNull();
    expect(resultado.tirMensal).toBeCloseTo(irrEsperada!, 8);
  });
});

describe("recalcularComAmortizacoes - type TERM", () => {
  it("SAC with TERM type amortization: maintains similar payment and significantly reduces term (real scenario)", () => {
    const inputs: InputsFinanciamento = {
      // Caso reportado pelo usuário (link compartilhado)
      valorEmprestimo: 371753,
      valorEntrada: 0,
      taxaJurosAnual: 9.3764,
      meses: 420,
      correcaoAnualImovel: 6,
    };

    const amortizacoesAdicionais: AmortizacaoAdicional[] = [{ mes: 1, valor: 140000, tipo: "prazo" }];

    const resultadoOriginal = calcularSAC(inputs);
    const resultadoComAmortizacao = recalcularComAmortizacoes(inputs, "sac", amortizacoesAdicionais);

    // Sanity: extra amortization applied in month 1 strongly reduces balance
    expect(resultadoComAmortizacao.parcelas[0].amortizacaoAdicional).toBeCloseTo(140000, 2);
    expect(resultadoComAmortizacao.parcelas[0].saldoDevedor).toBeCloseTo(230867.87, 2);

    // Term: payment should remain similar (should not drop like in "payment" mode)
    const prestacaoMes1 = resultadoComAmortizacao.parcelas[0].prestacao;
    const prestacaoMes2 = resultadoComAmortizacao.parcelas[1].prestacao;
    const diffPrestacao = Math.abs(prestacaoMes2 - prestacaoMes1) / prestacaoMes1;
    expect(diffPrestacao).toBeLessThan(0.05);

    // SAC: when choosing "term", monthly amortization should increase (to maintain payment and reduce more months)
    const amortizacaoOriginal = resultadoOriginal.parcelas[0].amortizacao;
    expect(resultadoComAmortizacao.parcelas[1].amortizacao).toBeGreaterThan(amortizacaoOriginal * 1.8);

    // Term should be less than original
    expect(resultadoComAmortizacao.mesesComAdicionais).toBeLessThan(resultadoComAmortizacao.mesesOriginais);
    // And, in this scenario, reduction should be quite significant (if not, behavior is closer to "payment")
    expect(resultadoComAmortizacao.mesesComAdicionais).toBeLessThan(200);

    // Interest savings should exist
    expect(resultadoComAmortizacao.economiaJuros).toBeGreaterThan(0);
  });

  it("PRICE with TERM type amortization: maintains base payment and reduces term", () => {
    const inputs: InputsFinanciamento = {
      valorEmprestimo: 120000,
      valorEntrada: 0,
      taxaJurosAnual: 12,
      meses: 24,
      correcaoAnualImovel: 0,
    };

    const amortizacoesAdicionais: AmortizacaoAdicional[] = [{ mes: 12, valor: 40000, tipo: "prazo" }];

    const resultadoOriginal = calcularPRICE(inputs);
    const resultadoComAmortizacao = recalcularComAmortizacoes(inputs, "price", amortizacoesAdicionais);

    const prestacaoOriginal = resultadoOriginal.primeiraPrestacao;

    // Payments before additional amortization should have payment similar to original
    for (let i = 0; i < 11; i++) {
      expect(resultadoComAmortizacao.parcelas[i].prestacao).toBeCloseTo(prestacaoOriginal, 1);
    }

    // Month 12 payment has additional amortization
    expect(resultadoComAmortizacao.parcelas[11].amortizacaoAdicional).toBe(40000);

    // After additional amortization, payment should remain similar
    // (should not decrease significantly for TERM type)
    // IMPORTANT: exclude last payment, as it is final settlement and may be smaller
    for (let i = 12; i < resultadoComAmortizacao.parcelas.length - 1; i++) {
      // Payment should be close to original (5% tolerance for rounding)
      const diferencaPercentual =
        Math.abs(resultadoComAmortizacao.parcelas[i].prestacao - prestacaoOriginal) / prestacaoOriginal;
      expect(diferencaPercentual).toBeLessThan(0.05);
    }

    // Term should be less than original
    expect(resultadoComAmortizacao.mesesComAdicionais).toBeLessThan(resultadoComAmortizacao.mesesOriginais);

    // Interest savings
    expect(resultadoComAmortizacao.economiaJuros).toBeGreaterThan(0);
  });

  it("PRICE with multiple TERM type amortizations: maintains base payment", () => {
    const inputs: InputsFinanciamento = {
      valorEmprestimo: 200000,
      valorEntrada: 0,
      taxaJurosAnual: 12,
      meses: 36,
      correcaoAnualImovel: 0,
    };

    const amortizacoesAdicionais: AmortizacaoAdicional[] = [
      { mes: 6, valor: 20000, tipo: "prazo" },
      { mes: 12, valor: 20000, tipo: "prazo" },
      { mes: 18, valor: 20000, tipo: "prazo" },
    ];

    const resultadoOriginal = calcularPRICE(inputs);
    const resultadoComAmortizacao = recalcularComAmortizacoes(inputs, "price", amortizacoesAdicionais);

    const prestacaoOriginal = resultadoOriginal.primeiraPrestacao;

    // Verify that payments over time remain close to original
    // (except last one which may be different as it's final settlement)
    for (let i = 0; i < resultadoComAmortizacao.parcelas.length - 1; i++) {
      const diferencaPercentual =
        Math.abs(resultadoComAmortizacao.parcelas[i].prestacao - prestacaoOriginal) / prestacaoOriginal;
      // 5% tolerance for rounding
      expect(diferencaPercentual).toBeLessThan(0.05);
    }

    // Reduced term
    expect(resultadoComAmortizacao.mesesComAdicionais).toBeLessThan(36);
  });
});

describe("recalcularComAmortizacoes - type PAYMENT", () => {
  it("SAC with PAYMENT type amortization: maintains term and reduces amortization", () => {
    const inputs: InputsFinanciamento = {
      valorEmprestimo: 120000,
      valorEntrada: 0,
      taxaJurosAnual: 12,
      meses: 12,
      correcaoAnualImovel: 0,
    };

    const amortizacoesAdicionais: AmortizacaoAdicional[] = [{ mes: 6, valor: 30000, tipo: "parcela" }];

    const resultadoComAmortizacao = recalcularComAmortizacoes(inputs, "sac", amortizacoesAdicionais);

    // Term should remain the same
    expect(resultadoComAmortizacao.mesesComAdicionais).toBe(resultadoComAmortizacao.mesesOriginais);

    // After additional amortization, base amortization should be recalculated
    // to be smaller (to fit in remaining term)
    const amortizacaoBaseOriginal = 120000 / 12;
    const saldoDepoisAmortizacao = resultadoComAmortizacao.parcelas[5].saldoDevedor;
    const mesesRestantes = 12 - 6;
    const novaAmortizacaoBase = saldoDepoisAmortizacao / mesesRestantes;

    // Verify that new amortization is smaller than original
    expect(novaAmortizacaoBase).toBeLessThan(amortizacaoBaseOriginal);

    // Verify that payments after additional amortization use new amortization
    for (let i = 6; i < 12; i++) {
      expect(resultadoComAmortizacao.parcelas[i].amortizacao).toBeCloseTo(novaAmortizacaoBase, 0);
    }
  });

  it("PRICE with PAYMENT type amortization: maintains term and reduces payment", () => {
    const inputs: InputsFinanciamento = {
      valorEmprestimo: 120000,
      valorEntrada: 0,
      taxaJurosAnual: 12,
      meses: 24,
      correcaoAnualImovel: 0,
    };

    const amortizacoesAdicionais: AmortizacaoAdicional[] = [{ mes: 12, valor: 40000, tipo: "parcela" }];

    const resultadoOriginal = calcularPRICE(inputs);
    const resultadoComAmortizacao = recalcularComAmortizacoes(inputs, "price", amortizacoesAdicionais);

    // Term should remain the same
    expect(resultadoComAmortizacao.mesesComAdicionais).toBe(resultadoComAmortizacao.mesesOriginais);

    const prestacaoOriginal = resultadoOriginal.primeiraPrestacao;

    // After additional amortization, payment should be smaller
    const prestacaoDepoisAmortizacao = resultadoComAmortizacao.parcelas[12].prestacao;
    expect(prestacaoDepoisAmortizacao).toBeLessThan(prestacaoOriginal);

    // All payments after amortization should have same payment (new base)
    for (let i = 13; i < resultadoComAmortizacao.parcelas.length - 1; i++) {
      expect(resultadoComAmortizacao.parcelas[i].prestacao).toBeCloseTo(prestacaoDepoisAmortizacao, 1);
    }
  });
});

describe("recalcularComAmortizacoes - edge cases", () => {
  it("amortization greater than outstanding balance is limited to balance", () => {
    const inputs: InputsFinanciamento = {
      valorEmprestimo: 50000,
      valorEntrada: 0,
      taxaJurosAnual: 12,
      meses: 12,
      correcaoAnualImovel: 0,
    };

    const amortizacoesAdicionais: AmortizacaoAdicional[] = [
      { mes: 6, valor: 999999, tipo: "prazo" }, // Very high value
    ];

    const resultadoComAmortizacao = recalcularComAmortizacoes(inputs, "sac", amortizacoesAdicionais);

    // Should settle before original term
    expect(resultadoComAmortizacao.mesesComAdicionais).toBeLessThan(12);

    // Final balance should be zero
    const ultimaParcela = resultadoComAmortizacao.parcelas[resultadoComAmortizacao.parcelas.length - 1];
    expect(ultimaParcela.saldoDevedor).toBeCloseTo(0, 1);
  });

  it("multiple amortizations of same type work correctly", () => {
    const inputs: InputsFinanciamento = {
      valorEmprestimo: 200000,
      valorEntrada: 0,
      taxaJurosAnual: 12,
      meses: 24,
      correcaoAnualImovel: 0,
    };

    const amortizacoesAdicionais: AmortizacaoAdicional[] = [
      { mes: 6, valor: 20000, tipo: "parcela" },
      { mes: 12, valor: 20000, tipo: "parcela" },
    ];

    const resultadoComAmortizacao = recalcularComAmortizacoes(inputs, "price", amortizacoesAdicionais);

    // Term should be maintained
    expect(resultadoComAmortizacao.mesesComAdicionais).toBe(24);

    // Each amortization should reduce payment even more
    const prestacao5 = resultadoComAmortizacao.parcelas[4].prestacao;
    const prestacao11 = resultadoComAmortizacao.parcelas[10].prestacao;
    const prestacao18 = resultadoComAmortizacao.parcelas[17].prestacao;

    expect(prestacao11).toBeLessThan(prestacao5);
    expect(prestacao18).toBeLessThan(prestacao11);
  });
});

describe("recalcularComAmortizacoes - multiple types (term -> payment)", () => {
  it("PRICE: after reducing term (TERM), a subsequent PAYMENT amortization should not 'return' to original term", () => {
    const inputs: InputsFinanciamento = {
      valorEmprestimo: 200_000,
      valorEntrada: 0,
      taxaJurosAnual: 12,
      meses: 240,
      correcaoAnualImovel: 0,
    };

    const rPrazo = recalcularComAmortizacoes(inputs, "price", [{ mes: 1, valor: 100_000, tipo: "prazo" }]);
    expect(rPrazo.mesesComAdicionais).toBeLessThan(inputs.meses);
    // Ensure month 12 still exists (for 2nd event test)
    expect(rPrazo.mesesComAdicionais).toBeGreaterThan(12);

    const rMix = recalcularComAmortizacoes(inputs, "price", [
      { mes: 1, valor: 100_000, tipo: "prazo" },
      { mes: 12, valor: 10_000, tipo: "parcela" },
    ]);

    // BUG (regression): before fix, this scenario could "stretch" and approach original term.
    // Rule: current term (already reduced) should be maintained; payment should be recalculated.
    expect(rMix.mesesComAdicionais).toBeLessThanOrEqual(rPrazo.mesesComAdicionais + 1);

    // "Payment": after month 12, base payment should drop (without changing current term).
    const p12 = rMix.parcelas[11]; // mês 12
    const p13 = rMix.parcelas[12]; // mês 13
    expect(p12.mes).toBe(12);
    expect(p13.mes).toBe(13);
    expect(p13.prestacao).toBeLessThan(p12.prestacao);
  });

  it("SAC: after reducing term (TERM), a subsequent PAYMENT amortization should not 'return' to original term", () => {
    const inputs: InputsFinanciamento = {
      valorEmprestimo: 200_000,
      valorEntrada: 0,
      taxaJurosAnual: 12,
      meses: 240,
      correcaoAnualImovel: 0,
    };

    const rPrazo = recalcularComAmortizacoes(inputs, "sac", [{ mes: 1, valor: 100_000, tipo: "prazo" }]);
    expect(rPrazo.mesesComAdicionais).toBeLessThan(inputs.meses);
    expect(rPrazo.mesesComAdicionais).toBeGreaterThan(12);

    const rMix = recalcularComAmortizacoes(inputs, "sac", [
      { mes: 1, valor: 100_000, tipo: "prazo" },
      { mes: 12, valor: 10_000, tipo: "parcela" },
    ]);

    expect(rMix.mesesComAdicionais).toBeLessThanOrEqual(rPrazo.mesesComAdicionais + 1);
  });
});

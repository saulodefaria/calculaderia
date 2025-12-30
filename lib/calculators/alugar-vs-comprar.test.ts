import { describe, it, expect } from "vitest";
import { calcularAluguelVsComprar, type InputsAluguelVsComprar } from "./alugar-vs-comprar";
import { round2 } from "../utils";
import { calcularFinanciamento } from "./financiamento";

describe("calcularAluguelVsComprar", () => {
  it("generates basic structure and includes down payment in month 1 displayed payment", () => {
    const inputs: InputsAluguelVsComprar = {
      valorImovel: 500000,
      valorEntrada: 100000,
      taxaJurosAnual: 10,
      meses: 120,
      metodo: "price",
      correcaoAnualImovel: 5,
      aluguelMensal: 3000,
      correcaoAnualAluguel: 6,
      taxaRendimentoAnual: 8,
    };

    const resultado = calcularAluguelVsComprar(inputs);

    expect(resultado.valorImovel).toBe(500000);
    expect(resultado.parcelasMensais.length).toBe(120);
    expect(resultado.comparacao.mesesTotal).toBe(120);

    // Verifies that all payments have the necessary fields
    resultado.parcelasMensais.forEach((p) => {
      expect(p.mes).toBeGreaterThan(0);
      expect(p.prestacaoFinanciamento).toBeGreaterThan(0);
      expect(p.aluguelPago).toBeGreaterThan(0);
      expect(p.diferencaInvestida).toBeDefined();
      expect(p.saldoInvestimentoAluguel).toBeGreaterThanOrEqual(0);
      expect(p.aporteExtraAluguel).toBeGreaterThanOrEqual(0);
      expect(p.patrimonioComprar).toBeDefined();
      expect(p.patrimonioAluguel).toBeDefined();
    });

    // Verifies that the first month includes the down payment in the loan
    expect(resultado.parcelasMensais[0].prestacaoFinanciamento).toBeGreaterThan(
      resultado.parcelasMensais[1].prestacaoFinanciamento
    );
  });

  it("calculates invested difference as (monthly payment without down payment - rent for the month)", () => {
    const inputs: InputsAluguelVsComprar = {
      valorImovel: 300000,
      valorEntrada: 60000,
      taxaJurosAnual: 12,
      meses: 24,
      metodo: "price",
      correcaoAnualImovel: 0,
      aluguelMensal: 2000,
      correcaoAnualAluguel: 0,
      taxaRendimentoAnual: 10,
    };

    const resultado = calcularAluguelVsComprar(inputs);

    const primeiraParcela = resultado.parcelasMensais[0]!;
    const prestacaoMensalSemEntrada = round2(primeiraParcela.prestacaoFinanciamento - inputs.valorEntrada);
    const diferencaEsperada = round2(prestacaoMensalSemEntrada - primeiraParcela.aluguelPago);
    expect(primeiraParcela.diferencaInvestida).toBeCloseTo(diferencaEsperada, 2);
  });

  it("applies annual rent correction correctly", () => {
    const inputs: InputsAluguelVsComprar = {
      valorImovel: 400000,
      valorEntrada: 80000,
      taxaJurosAnual: 10,
      meses: 36,
      metodo: "price",
      correcaoAnualImovel: 0,
      aluguelMensal: 2500,
      correcaoAnualAluguel: 6, // 6% ao ano
      taxaRendimentoAnual: 8,
    };

    const resultado = calcularAluguelVsComprar(inputs);

    // Month 1 should have base rent
    expect(resultado.parcelasMensais[0].aluguelPago).toBeCloseTo(2500, 2);

    // Month 12 should still have base rent (correction only in month 13)
    expect(resultado.parcelasMensais[11].aluguelPago).toBeCloseTo(2500, 2);

    // Month 13 should have corrected rent (2500 * 1.06)
    expect(resultado.parcelasMensais[12].aluguelPago).toBeCloseTo(2650, 2);

    // Month 25 should have second correction (2500 * 1.06^2)
    expect(resultado.parcelasMensais[24].aluguelPago).toBeCloseTo(2809, 2);
  });

  it("calculates buy scenario equity as equity (property value - outstanding balance)", () => {
    const inputs: InputsAluguelVsComprar = {
      valorImovel: 500000,
      valorEntrada: 100000,
      taxaJurosAnual: 10,
      meses: 60,
      metodo: "price",
      correcaoAnualImovel: 5, // 5% ao ano
      aluguelMensal: 3000,
      correcaoAnualAluguel: 6,
      taxaRendimentoAnual: 8,
    };

    const resultado = calcularAluguelVsComprar(inputs);

    const financiamento = calcularFinanciamento(
      {
        valorEmprestimo: inputs.valorImovel,
        valorEntrada: inputs.valorEntrada,
        taxaJurosAnual: inputs.taxaJurosAnual,
        meses: inputs.meses,
        correcaoAnualImovel: inputs.correcaoAnualImovel,
      },
      inputs.metodo
    );

    // Month 1: equity = property value in the month - outstanding balance after month payment
    const parcelaMes1 = financiamento.parcelas[0]!;
    const valorImovelMes1 = round2(inputs.valorImovel * Math.pow(1 + inputs.correcaoAnualImovel / 100, 1 / 12));
    const equidadeMes1Esperada = round2(valorImovelMes1 - parcelaMes1.saldoDevedor);
    expect(resultado.parcelasMensais[0]!.patrimonioComprar).toBeCloseTo(equidadeMes1Esperada, 2);

    // Final: outstanding balance should be ~0, so final equity ≈ final property value
    const ultimaParcela = resultado.parcelasMensais[resultado.parcelasMensais.length - 1]!;
    const saldoDevedorFinal = financiamento.parcelas[financiamento.parcelas.length - 1]!.saldoDevedor;
    const equidadeFinalEsperada = round2(resultado.comparacao.valorImovelFinal - saldoDevedorFinal);
    expect(ultimaParcela.patrimonioComprar).toBeCloseTo(equidadeFinalEsperada, 2);
    expect(resultado.comparacao.patrimonioFinalComprar).toBeCloseTo(ultimaParcela.patrimonioComprar, 2);
  });

  it("correctly determines the winner and savings based on final equity", () => {
    const inputs: InputsAluguelVsComprar = {
      valorImovel: 300000,
      valorEntrada: 60000,
      taxaJurosAnual: 15, // High interest rate favors renting
      meses: 60,
      metodo: "price",
      correcaoAnualImovel: 3, // Low appreciation
      aluguelMensal: 2000, // Low rent
      correcaoAnualAluguel: 4,
      taxaRendimentoAnual: 12, // High investment return favors renting
    };

    const resultado = calcularAluguelVsComprar(inputs);

    expect(["comprar", "aluguel", "empate"]).toContain(resultado.comparacao.vencedor);

    const diff = round2(resultado.comparacao.patrimonioFinalComprar - resultado.comparacao.patrimonioFinalAluguel);

    if (Math.abs(diff) < 0.01) {
      expect(resultado.comparacao.vencedor).toBe("empate");
      expect(resultado.comparacao.economiaVencedor).toBe(0);
    } else if (diff > 0) {
      expect(resultado.comparacao.vencedor).toBe("comprar");
      expect(resultado.comparacao.economiaVencedor).toBeCloseTo(Math.abs(diff), 2);
    } else {
      expect(resultado.comparacao.vencedor).toBe("aluguel");
      expect(resultado.comparacao.economiaVencedor).toBeCloseTo(Math.abs(diff), 2);
    }
  });

  it("when rent is greater than payment, may require extra contribution and renting equity may become negative", () => {
    const base: Omit<InputsAluguelVsComprar, "aluguelMensal"> = {
      valorImovel: 200000,
      valorEntrada: 40000,
      taxaJurosAnual: 8,
      meses: 24,
      metodo: "price",
      correcaoAnualImovel: 0,
      correcaoAnualAluguel: 0,
      taxaRendimentoAnual: 10,
    };

    // Ensures that rent is greater than loan payment for this scenario
    const financiamento = calcularFinanciamento(
      {
        valorEmprestimo: base.valorImovel,
        valorEntrada: base.valorEntrada,
        taxaJurosAnual: base.taxaJurosAnual,
        meses: base.meses,
        correcaoAnualImovel: base.correcaoAnualImovel,
      },
      base.metodo
    );
    const prestacaoBase = financiamento.parcelas[0]!.prestacao;
    const inputs: InputsAluguelVsComprar = {
      ...base,
      // Well above to force consumption of investment and generation of extra contribution
      aluguelMensal: round2(prestacaoBase + 5000),
    };

    const resultado = calcularAluguelVsComprar(inputs);

    const primeiraParcela = resultado.parcelasMensais[0]!;
    const prestacaoSemEntrada = round2(primeiraParcela.prestacaoFinanciamento - inputs.valorEntrada);
    expect(primeiraParcela.aluguelPago).toBeGreaterThan(prestacaoSemEntrada);
    expect(primeiraParcela.diferencaInvestida).toBeLessThan(0);

    // At some point extra contribution should appear (very high rent)
    expect(resultado.parcelasMensais.some((p) => p.aporteExtraAluguel > 0)).toBe(true);
    expect(resultado.comparacao.aporteExtraTotalAluguel).toBeGreaterThan(0);

    // Invested balance should never be negative
    expect(resultado.parcelasMensais.every((p) => p.saldoInvestimentoAluguel >= 0)).toBe(true);

    // And renting final equity should become negative (needed to contribute more than could keep invested)
    expect(resultado.comparacao.patrimonioFinalAluguel).toBeLessThan(0);
  });

  it("applies monthly return rate correctly to investment", () => {
    const inputs: InputsAluguelVsComprar = {
      valorImovel: 400000,
      valorEntrada: 80000,
      taxaJurosAnual: 10,
      meses: 12,
      metodo: "price",
      correcaoAnualImovel: 0,
      aluguelMensal: 3000,
      correcaoAnualAluguel: 0,
      taxaRendimentoAnual: 12, // 12% ao ano
    };

    const resultado = calcularAluguelVsComprar(inputs);

    // Verifies investment growth month by month
    for (let i = 1; i < resultado.parcelasMensais.length; i++) {
      const mesAnterior = resultado.parcelasMensais[i - 1];
      const mesAtual = resultado.parcelasMensais[i];

      // Balance should grow even without new contributions (due to return)
      // But may decrease if invested difference is negative
      // Let's verify that growth is happening when there's positive balance
      if (mesAnterior.saldoInvestimentoAluguel > 0 && mesAtual.diferencaInvestida >= 0) {
        // Balance should grow at least by monthly return
        const rendimentoMensalEsperado = mesAnterior.saldoInvestimentoAluguel * (Math.pow(1.12, 1 / 12) - 1);
        const crescimentoMinimo = mesAnterior.saldoInvestimentoAluguel + rendimentoMensalEsperado - 1; // tolerância
        expect(mesAtual.saldoInvestimentoAluguel).toBeGreaterThanOrEqual(crescimentoMinimo);
      }
    }
  });

  it("correctly calculates appreciated property value at the end", () => {
    const inputs: InputsAluguelVsComprar = {
      valorImovel: 500000,
      valorEntrada: 100000,
      taxaJurosAnual: 10,
      meses: 120, // 10 anos
      metodo: "price",
      correcaoAnualImovel: 5, // 5% ao ano
      aluguelMensal: 3000,
      correcaoAnualAluguel: 6,
      taxaRendimentoAnual: 8,
    };

    const resultado = calcularAluguelVsComprar(inputs);

    // Property value after 10 years with 5% per year: 500000 * (1.05)^10
    const valorEsperado = round2(500000 * Math.pow(1.05, 10));
    expect(resultado.comparacao.valorImovelFinal).toBeCloseTo(valorEsperado, 0);
  });

  it("works correctly with SAC method", () => {
    const inputs: InputsAluguelVsComprar = {
      valorImovel: 400000,
      valorEntrada: 80000,
      taxaJurosAnual: 12,
      meses: 60,
      metodo: "sac",
      correcaoAnualImovel: 4,
      aluguelMensal: 2500,
      correcaoAnualAluguel: 5,
      taxaRendimentoAnual: 9,
    };

    const resultado = calcularAluguelVsComprar(inputs);

    expect(resultado.parcelasMensais.length).toBe(60);

    // With SAC, payments should be decreasing
    expect(resultado.parcelasMensais[0].prestacaoFinanciamento).toBeGreaterThan(
      resultado.parcelasMensais[59].prestacaoFinanciamento
    );
  });

  it("correctly calculates total paid in each scenario", () => {
    const inputs: InputsAluguelVsComprar = {
      valorImovel: 300000,
      valorEntrada: 60000,
      taxaJurosAnual: 10,
      meses: 24,
      metodo: "price",
      correcaoAnualImovel: 0,
      aluguelMensal: 2000,
      correcaoAnualAluguel: 0,
      taxaRendimentoAnual: 8,
    };

    const resultado = calcularAluguelVsComprar(inputs);

    // Total paid in buy scenario = down payment + sum of payments
    const totalPrestacoes = resultado.parcelasMensais.reduce((sum, p) => sum + p.prestacaoFinanciamento, 0);
    expect(resultado.comparacao.totalPagoComprar).toBeCloseTo(totalPrestacoes, 2);

    // Total paid in rent scenario = sum of rents
    const totalAlugueis = resultado.parcelasMensais.reduce((sum, p) => sum + p.aluguelPago, 0);
    expect(resultado.comparacao.totalPagoAluguel).toBeCloseTo(totalAlugueis, 2);
  });
});

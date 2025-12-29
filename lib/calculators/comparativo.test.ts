import { describe, it, expect } from "vitest";
import { calcularComparativo, type InputsComparativo } from "./comparativo";
import { calcularFinanciamento } from "./financiamento";
import { calcularConsorcio } from "./consorcio";

describe("calcularComparativo", () => {
  it("usa as mesmas calculadoras (financiamento/consórcio) e propaga aluguel/mesContemplacao para TIR/cashflows", () => {
    const inputs: InputsComparativo = {
      financiamento: {
        valorImovel: 300000,
        valorEntrada: 60000,
        taxaJurosAnual: 11.5,
        meses: 360,
        metodo: "sac",
        correcaoAnualImovel: 6,
      },
      consorcio: {
        meses: 180,
        taxaAdministracaoTotal: 18,
        correcaoAnual: 6,
        agioCartaContemplada: 0,
        mesContemplacao: 12,
        valorLance: 0,
      },
      taxaRendimentoAnual: 10,
      aluguelMensal: 2000,
      correcaoAnualAluguel: 6,
    };

    const resultado = calcularComparativo(inputs);

    const esperadoFin = calcularFinanciamento(
      {
        valorEmprestimo: inputs.financiamento.valorImovel,
        valorEntrada: inputs.financiamento.valorEntrada,
        taxaJurosAnual: inputs.financiamento.taxaJurosAnual,
        meses: inputs.financiamento.meses,
        correcaoAnualImovel: inputs.financiamento.correcaoAnualImovel,
        aluguelMensal: inputs.aluguelMensal,
        correcaoAnualAluguel: inputs.correcaoAnualAluguel,
      },
      inputs.financiamento.metodo
    );

    const esperadoCons = calcularConsorcio({
      valorBem: inputs.financiamento.valorImovel,
      meses: inputs.consorcio.meses,
      taxaAdministracaoTotal: inputs.consorcio.taxaAdministracaoTotal,
      correcaoAnual: inputs.consorcio.correcaoAnual,
      agio: inputs.consorcio.agioCartaContemplada,
      mesContemplacao: inputs.consorcio.mesContemplacao,
      aluguelMensal: inputs.aluguelMensal,
      correcaoAnualAluguel: inputs.correcaoAnualAluguel,
    });

    // Financiamento: mesmo resultado base e mesma base de TIR/cashflows
    expect(resultado.financiamento.totalPago).toBe(esperadoFin.totalPago);
    expect(resultado.financiamento.parcelas.length).toBe(esperadoFin.parcelas.length);
    expect(resultado.financiamento.tirMensal).toBeCloseTo(esperadoFin.tirMensal ?? 0, 10);
    expect(resultado.financiamento.tirAnual).toBeCloseTo(esperadoFin.tirAnual ?? 0, 10);
    expect(resultado.financiamento.cashflows).toEqual(esperadoFin.cashflows);

    // Consórcio: mesmo resultado base e mesma base de TIR/cashflows
    expect(resultado.consorcio.totalPago).toBe(esperadoCons.totalPago);
    expect(resultado.consorcio.parcelas.length).toBe(esperadoCons.parcelas.length);
    expect(resultado.consorcio.tirMensal).toBeCloseTo(esperadoCons.tirMensal ?? 0, 10);
    expect(resultado.consorcio.tirAnual).toBeCloseTo(esperadoCons.tirAnual ?? 0, 10);
    expect(resultado.consorcio.cashflows).toEqual(esperadoCons.cashflows);

    // Sanity: antes da contemplação, consórcio não considera aluguel no cashflow mensal
    expect(esperadoCons.cashflows?.[0]).toBeCloseTo(-esperadoCons.parcelas[0].parcela, 2);
  });

  it("ágio entra no consórcio no mês 1 (como na calculadora standalone) e não é somado duas vezes no total", () => {
    const inputs: InputsComparativo = {
      financiamento: {
        valorImovel: 200000,
        valorEntrada: 40000,
        taxaJurosAnual: 10,
        meses: 240,
        metodo: "price",
        correcaoAnualImovel: 6,
      },
      consorcio: {
        meses: 180,
        taxaAdministracaoTotal: 15,
        correcaoAnual: 6,
        agioCartaContemplada: 12000,
        mesContemplacao: 1,
        valorLance: 0,
      },
      taxaRendimentoAnual: 10,
      aluguelMensal: 0,
      correcaoAnualAluguel: 6,
    };

    const resultado = calcularComparativo(inputs);

    expect(resultado.comparacao.totalPagoConsorcio).toBe(resultado.consorcio.totalPago);
    expect(resultado.comparacao.parcelasMensais[0].parcelaConsorcio).toBe(resultado.consorcio.parcelas[0].parcela);
    expect(resultado.comparacao.parcelasMensais[0].valorAgio).toBe(inputs.consorcio.agioCartaContemplada);
  });
});

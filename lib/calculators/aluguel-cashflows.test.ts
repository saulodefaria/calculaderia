import { describe, it, expect } from "vitest";
import { calculateIrr, getAluguelCorrigidoNoMes, round2 } from "../utils";
import { calcularFinanciamento, type InputsFinanciamento } from "./financiamento";
import { calcularConsorcio, type InputsConsorcio } from "./consorcio";

describe("Cashflows com aluguel - financiamento e consórcio", () => {
  it("financiamento: permite cashflow mensal positivo quando aluguel > prestação", () => {
    const baseInputs: InputsFinanciamento = {
      valorEmprestimo: 300_000,
      valorEntrada: 60_000,
      taxaJurosAnual: 12,
      meses: 24,
      correcaoAnualImovel: 0,
      aluguelMensal: 0,
      correcaoAnualAluguel: 0,
    };

    const base = calcularFinanciamento(baseInputs, "price");
    const prestacaoBase = base.parcelas[0]?.prestacao ?? 0;
    expect(prestacaoBase).toBeGreaterThan(0);

    // Garante que o aluguel supera a prestação, gerando fluxo mensal positivo.
    const aluguelMensal = round2(prestacaoBase + 100);

    const inputs: InputsFinanciamento = {
      ...baseInputs,
      aluguelMensal,
      correcaoAnualAluguel: 0,
    };

    const resultado = calcularFinanciamento(inputs, "price");
    expect(resultado.tirMensal).not.toBeNull();

    // Reconstrói os cashflows esperados a partir das parcelas e valida que batem com a TIR calculada.
    const cashflows = resultado.parcelas.map((p) => {
      const aluguelNoMes = getAluguelCorrigidoNoMes(p.mes, aluguelMensal, 0);
      return round2(aluguelNoMes - p.prestacao);
    });

    // Entrada como saída no primeiro mês
    cashflows[0] -= inputs.valorEntrada;
    // Valor do imóvel no último mês
    cashflows[cashflows.length - 1] += resultado.valorImovelFinal;

    // Deve existir pelo menos um mês intermediário com fluxo positivo devido ao aluguel > prestação.
    expect(cashflows.slice(1, -1).some((cf) => cf > 0)).toBe(true);

    const irrEsperada = calculateIrr(cashflows);
    expect(irrEsperada).not.toBeNull();
    expect(resultado.tirMensal).toBeCloseTo(irrEsperada!, 8);
  });

  it("consórcio: permite cashflow mensal positivo quando aluguel > parcela (após contemplação)", () => {
    const baseInputs: InputsConsorcio = {
      valorBem: 200_000,
      meses: 24,
      taxaAdministracaoTotal: 10,
      correcaoAnual: 0,
      mesContemplacao: 6,
      aluguelMensal: 0,
      correcaoAnualAluguel: 0,
      agio: 0,
    };

    const base = calcularConsorcio(baseInputs);
    const parcelaBase = base.parcelas[0]?.parcela ?? 0;
    expect(parcelaBase).toBeGreaterThan(0);

    // Garante aluguel acima da parcela (fluxo positivo após contemplação).
    const aluguelMensal = round2(parcelaBase + 100);

    const inputs: InputsConsorcio = {
      ...baseInputs,
      aluguelMensal,
      correcaoAnualAluguel: 0,
    };

    const resultado = calcularConsorcio(inputs);
    expect(resultado.tirMensal).not.toBeNull();

    const mesContemplacao = inputs.mesContemplacao ?? 1;

    const cashflows = resultado.parcelas.map((p) => {
      const aluguelNoMes =
        p.mes >= mesContemplacao ? getAluguelCorrigidoNoMes(p.mes, aluguelMensal, 0) : 0;
      return round2(aluguelNoMes - p.parcela);
    });

    // Ágio como saída no primeiro mês (se houver)
    if ((resultado.agio ?? 0) > 0) {
      cashflows[0] -= resultado.agio;
    }

    // Valor do bem no último mês
    cashflows[cashflows.length - 1] += resultado.valorBemFinal;

    // Meses antes da contemplação devem ser negativos (sem aluguel).
    expect(cashflows.slice(0, mesContemplacao - 1).every((cf) => cf < 0)).toBe(true);
    // Após contemplação deve existir mês positivo por causa do aluguel > parcela.
    expect(cashflows.slice(mesContemplacao - 1, -1).some((cf) => cf > 0)).toBe(true);

    const irrEsperada = calculateIrr(cashflows);
    expect(irrEsperada).not.toBeNull();
    expect(resultado.tirMensal).toBeCloseTo(irrEsperada!, 8);
  });
});



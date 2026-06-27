import { describe, expect, it } from "vitest";
import {
  FINANCIAMENTO_VEICULO_FORMULA_VERSION,
  calcularFinanciamentoVeiculo,
  getDefaultFinanciamentoVeiculoInputs,
  validateFinanciamentoVeiculoInputs,
  type FinanciamentoVeiculoInputs,
} from "./financiamento-veiculo";

function inputs(overrides: Partial<FinanciamentoVeiculoInputs> = {}): FinanciamentoVeiculoInputs {
  return {
    ...getDefaultFinanciamentoVeiculoInputs(),
    ...overrides,
  };
}

describe("calcularFinanciamentoVeiculo", () => {
  it("calculates the Microsoft PMT fixed-rate Price fixture", () => {
    const result = calcularFinanciamentoVeiculo(
      inputs({
        valorVeiculo: 10000,
        entrada: 0,
        custosFinanciados: 0,
        custosAVista: 0,
        taxaJurosMensal: 8 / 12,
        prazoMeses: 10,
        metodo: "price",
        compararMetodos: false,
      })
    );

    expect(result.valorFinanciado).toBe(10000);
    expect(result.primeiraParcela).toBe(1037.03);
    expect(result.totalParcelas).toBeCloseTo(10370.3, 1);
    expect(result.totalJuros).toBeCloseTo(370.3, 1);
    expect(result.parcelas.at(-1)?.saldoFinal).toBe(0);
    expect(result.sourceVersion.formulaVersion).toBe(FINANCIAMENTO_VEICULO_FORMULA_VERSION);
  });

  it("calculates a deterministic SAC schedule", () => {
    const result = calcularFinanciamentoVeiculo(
      inputs({
        valorVeiculo: 1000,
        entrada: 0,
        taxaJurosMensal: 3,
        prazoMeses: 4,
        metodo: "sac",
        compararMetodos: true,
      })
    );

    expect(result.parcelas.map((parcela) => parcela.parcela)).toEqual([280, 272.5, 265, 257.5]);
    expect(result.totalJuros).toBe(75);
    expect(result.totalParcelas).toBe(1075);
    expect(result.parcelas.at(-1)?.saldoFinal).toBe(0);
    expect(result.comparacao?.sac.totalJuros).toBe(75);
    expect(result.comparacao?.price.totalJuros).toBeGreaterThan(0);
  });

  it("handles zero-interest Price and SAC scenarios", () => {
    const price = calcularFinanciamentoVeiculo(
      inputs({
        valorVeiculo: 12000,
        entrada: 0,
        taxaJurosMensal: 0,
        prazoMeses: 12,
        metodo: "price",
        compararMetodos: true,
      })
    );
    const sac = calcularFinanciamentoVeiculo(
      inputs({
        valorVeiculo: 12000,
        entrada: 0,
        taxaJurosMensal: 0,
        prazoMeses: 12,
        metodo: "sac",
        compararMetodos: false,
      })
    );

    expect(price.primeiraParcela).toBe(1000);
    expect(price.ultimaParcela).toBe(1000);
    expect(price.totalJuros).toBe(0);
    expect(price.comparacao?.price.totalParcelas).toBe(12000);
    expect(price.comparacao?.sac.totalParcelas).toBe(12000);
    expect(sac.primeiraParcela).toBe(1000);
    expect(sac.totalJuros).toBe(0);
  });

  it("composes down payment, financed costs, upfront costs, and annual equivalent rate", () => {
    const result = calcularFinanciamentoVeiculo(
      inputs({
        valorVeiculo: 80000,
        entrada: 20000,
        custosFinanciados: 2000,
        custosAVista: 1500,
        taxaJurosMensal: 1.49,
        prazoMeses: 48,
        metodo: "price",
        compararMetodos: false,
      })
    );

    expect(result.valorFinanciado).toBe(62000);
    expect(result.totalEntradaECustosAVista).toBe(21500);
    expect(result.totalGeral).toBe(result.totalEntradaECustosAVista + result.totalParcelas);
    expect(result.taxaEfetivaAnual).toBeCloseTo(0.1942, 4);
    expect(result.warnings).toContain("custosOpcionaisInformados");
  });

  it("warns for high-rate, long-term, low-entry, and high-cost assumptions", () => {
    const result = calcularFinanciamentoVeiculo(
      inputs({
        valorVeiculo: 50000,
        entrada: 0,
        custosFinanciados: 20000,
        custosAVista: 6000,
        taxaJurosMensal: 10.01,
        prazoMeses: 85,
      })
    );

    expect(result.warnings).toEqual(
      expect.arrayContaining(["custosCetNaoAutomaticos", "taxaAlta", "prazoLongo", "entradaBaixa", "custosAltos"])
    );
  });

  it("validates impossible or unsupported inputs", () => {
    expect(validateFinanciamentoVeiculoInputs(inputs({ valorVeiculo: 0 }))).toContain("valorVeiculo");
    expect(validateFinanciamentoVeiculoInputs(inputs({ entrada: -1 }))).toContain("entrada");
    expect(validateFinanciamentoVeiculoInputs(inputs({ custosFinanciados: -1 }))).toContain("custosFinanciados");
    expect(validateFinanciamentoVeiculoInputs(inputs({ custosAVista: -1 }))).toContain("custosAVista");
    expect(validateFinanciamentoVeiculoInputs(inputs({ taxaJurosMensal: -0.1 }))).toContain("taxaJurosMensal");
    expect(validateFinanciamentoVeiculoInputs(inputs({ taxaJurosMensal: 20.01 }))).toContain("taxaJurosMensal");
    expect(validateFinanciamentoVeiculoInputs(inputs({ prazoMeses: 0 }))).toContain("prazoMeses");
    expect(validateFinanciamentoVeiculoInputs(inputs({ prazoMeses: 121 }))).toContain("prazoMeses");
    expect(validateFinanciamentoVeiculoInputs(inputs({ entrada: 80000 }))).toContain("valorFinanciado");
    expect(validateFinanciamentoVeiculoInputs(inputs({ metodo: "foo" as "price" }))).toContain("metodo");
  });
});

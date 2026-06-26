import { describe, expect, it } from "vitest";
import {
  CDB_SOURCE_VERSION,
  calcularCdb,
  calcularDiasUteisEstimados,
  getDefaultCdbInputs,
  getDiasUteisMaximoParaPrazo,
  getIofAliquotaCdb,
  getIrAliquotaCdb,
  validateCdbInputs,
  type CdbInputs,
} from "./cdb";

function inputs(overrides: Partial<CdbInputs> = {}): CdbInputs {
  return {
    ...getDefaultCdbInputs(),
    ...overrides,
  };
}

describe("calcularCdb", () => {
  it("calculates the pre-fixed one-year fixture with 252 business days", () => {
    const result = calcularCdb(inputs({ modo: "pre", taxaPreAnual: 12 }));

    expect(result.valorFinalBruto).toBe(11200);
    expect(result.rendimentoBruto).toBe(1200);
    expect(result.iofAliquota).toBe(0);
    expect(result.iofValor).toBe(0);
    expect(result.irAliquota).toBe(17.5);
    expect(result.baseIr).toBe(1200);
    expect(result.irValor).toBe(210);
    expect(result.valorFinalLiquido).toBe(10990);
    expect(result.rendimentoLiquido).toBe(990);
    expect(result.rentabilidadeLiquidaPercent).toBe(9.9);
    expect(result.diasUteisOrigem).toBe("estimado");
    expect(result.sourceVersion.accessedAt).toBe(CDB_SOURCE_VERSION);
  });

  it("calculates the 100% CDI one-year fixture without fetching current CDI", () => {
    const result = calcularCdb(inputs({ percentualCdi: 100, cdiAnual: 10 }));

    expect(result.valorFinalBruto).toBe(11000);
    expect(result.rendimentoBruto).toBe(1000);
    expect(result.irValor).toBe(175);
    expect(result.valorFinalLiquido).toBe(10825);
    expect(result.rentabilidadeLiquidaPercent).toBe(8.25);
    expect(result.warnings).toContain("semCdiAtual");
    expect(result.warnings).toContain("cdiInformadoUsuario");
  });

  it("scales CDI-linked daily rates by the entered CDI percentage", () => {
    const oneHundred = calcularCdb(inputs({ percentualCdi: 100, cdiAnual: 10 }));
    const oneTen = calcularCdb(inputs({ percentualCdi: 110, cdiAnual: 10 }));

    expect(oneTen.valorFinalBruto).toBeGreaterThan(oneHundred.valorFinalBruto);
    expect(oneTen.valorFinalBruto).toBe(11105.32);
  });

  it("applies IOF before IR for short calendar terms", () => {
    const result = calcularCdb(
      inputs({
        modo: "pre",
        prazoDiasCorridos: 10,
        diasUteis: 7,
        taxaPreAnual: 12,
      })
    );

    expect(result.valorFinalBruto).toBe(10031.53);
    expect(result.iofAliquota).toBe(66);
    expect(result.iofValor).toBe(20.81);
    expect(result.baseIr).toBe(10.72);
    expect(result.irAliquota).toBe(22.5);
    expect(result.irValor).toBe(2.41);
    expect(result.valorFinalLiquido).toBe(10008.31);
    expect(result.diasUteisOrigem).toBe("estimado");
    expect(result.warnings).toContain("iofCurtoPrazo");
  });

  it("keeps IOF and IR at zero when gross yield is zero", () => {
    const result = calcularCdb(inputs({ modo: "pre", taxaPreAnual: 0 }));

    expect(result.rendimentoBruto).toBe(0);
    expect(result.iofValor).toBe(0);
    expect(result.irValor).toBe(0);
    expect(result.valorFinalLiquido).toBe(10000);
    expect(result.warnings).toContain("rendimentoZero");
  });

  it("selects IR brackets at legal calendar-day boundaries", () => {
    expect(getIrAliquotaCdb(180)).toBe(22.5);
    expect(getIrAliquotaCdb(181)).toBe(20);
    expect(getIrAliquotaCdb(360)).toBe(20);
    expect(getIrAliquotaCdb(361)).toBe(17.5);
    expect(getIrAliquotaCdb(720)).toBe(17.5);
    expect(getIrAliquotaCdb(721)).toBe(15);
  });

  it("selects IOF table values from the official annex", () => {
    expect(getIofAliquotaCdb(1)).toBe(96);
    expect(getIofAliquotaCdb(2)).toBe(93);
    expect(getIofAliquotaCdb(29)).toBe(3);
    expect(getIofAliquotaCdb(30)).toBe(0);
    expect(getIofAliquotaCdb(31)).toBe(0);
  });

  it("derives estimated business days from calendar days with a minimum of one", () => {
    expect(calcularDiasUteisEstimados(1)).toBe(1);
    expect(calcularDiasUteisEstimados(365)).toBe(252);
    expect(getDiasUteisMaximoParaPrazo(365)).toBe(265);
  });

  it("validates plan ranges, mode, source version, and business-day ceiling", () => {
    expect(validateCdbInputs(inputs({ valorInicial: 0 }))).toContain("valorInicial");
    expect(validateCdbInputs(inputs({ valorInicial: 100_000_000.01 }))).toContain("valorInicial");
    expect(validateCdbInputs(inputs({ modo: "selic" as "pre" }))).toContain("modo");
    expect(validateCdbInputs(inputs({ prazoDiasCorridos: 0 }))).toContain("prazoDiasCorridos");
    expect(validateCdbInputs(inputs({ prazoDiasCorridos: 3651 }))).toContain("prazoDiasCorridos");
    expect(validateCdbInputs(inputs({ diasUteis: 0 }))).toContain("diasUteis");
    expect(validateCdbInputs(inputs({ prazoDiasCorridos: 365, diasUteis: 266 }))).toContain("diasUteisAcimaPrazo");
    expect(validateCdbInputs(inputs({ percentualCdi: 301 }))).toContain("percentualCdi");
    expect(validateCdbInputs(inputs({ cdiAnual: 101 }))).toContain("cdiAnual");
    expect(validateCdbInputs(inputs({ taxaPreAnual: 101 }))).toContain("taxaPreAnual");
    expect(validateCdbInputs({ ...inputs(), sourceVersion: "2026-06-25" as typeof CDB_SOURCE_VERSION })).toContain(
      "sourceVersion"
    );
  });

  it("rejects calculations that would produce non-finite output", () => {
    const bad = inputs({ valorInicial: Number.POSITIVE_INFINITY });

    expect(validateCdbInputs(bad)).toContain("valorInicial");
    expect(() => calcularCdb(bad)).toThrow(RangeError);
  });
});

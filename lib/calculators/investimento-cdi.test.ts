import { describe, expect, it } from "vitest";
import {
  INVESTIMENTO_CDI_ANNUAL_RATE_PERCENT,
  INVESTIMENTO_CDI_DAILY_RATE_PERCENT,
  INVESTIMENTO_CDI_OBSERVATION_DATE,
  INVESTIMENTO_CDI_SOURCE_VERSION,
  calcularDiasUteisEstimadosInvestimentoCdi,
  calcularInvestimentoCdi,
  getDefaultInvestimentoCdiInputs,
  getDiasUteisMaximoParaPrazoInvestimentoCdi,
  getInvestimentoCdiIofAliquota,
  getInvestimentoCdiIrAliquota,
  validateInvestimentoCdiInputs,
  type InvestimentoCdiInputs,
} from "./investimento-cdi";

function inputs(overrides: Partial<InvestimentoCdiInputs> = {}): InvestimentoCdiInputs {
  return {
    ...getDefaultInvestimentoCdiInputs(),
    ...overrides,
  };
}

describe("calcularInvestimentoCdi", () => {
  it("calculates the default BCB snapshot fixture", () => {
    const result = calcularInvestimentoCdi(inputs());

    expect(result.cdiFonte.sourceVersion).toBe(INVESTIMENTO_CDI_SOURCE_VERSION);
    expect(result.cdiFonte.observationDate).toBe(INVESTIMENTO_CDI_OBSERVATION_DATE);
    expect(result.taxaCdiDiariaPercent).toBe(INVESTIMENTO_CDI_DAILY_RATE_PERCENT);
    expect(result.taxaCdiAnualPercent).toBe(INVESTIMENTO_CDI_ANNUAL_RATE_PERCENT);
    expect(result.valorFinalBruto).toBe(11415);
    expect(result.rendimentoBruto).toBe(1415);
    expect(result.iofAliquota).toBe(0);
    expect(result.iofValor).toBe(0);
    expect(result.irAliquota).toBe(17.5);
    expect(result.irValor).toBe(247.63);
    expect(result.valorFinalLiquido).toBe(11167.37);
    expect(result.rendimentoLiquido).toBe(1167.37);
    expect(result.diasUteisOrigem).toBe("estimado");
    expect(result.warnings).toContain("fonteCdiDatada");
    expect(result.warnings).toContain("semRecomendacao");
  });

  it("scales the BCB daily CDI snapshot by 110% CDI", () => {
    const result = calcularInvestimentoCdi(inputs({ percentualCdi: 110 }));

    expect(result.valorFinalBruto).toBe(11567.03);
    expect(result.rendimentoBruto).toBe(1567.03);
    expect(result.irValor).toBe(274.23);
    expect(result.valorFinalLiquido).toBe(11292.8);
    expect(result.rendimentoLiquido).toBe(1292.8);
  });

  it("applies IOF before IR for the 20-day short-term fixture", () => {
    const result = calcularInvestimentoCdi(
      inputs({
        prazoDiasCorridos: 20,
        diasUteis: 15,
        diasUteisModo: "manual",
      })
    );

    expect(result.rendimentoBruto).toBe(79.09);
    expect(result.iofAliquota).toBe(33);
    expect(result.iofValor).toBe(26.1);
    expect(result.baseIr).toBe(52.99);
    expect(result.irAliquota).toBe(22.5);
    expect(result.irValor).toBe(11.92);
    expect(result.valorFinalLiquido).toBe(10041.07);
    expect(result.warnings).toContain("iofCurtoPrazo");
    expect(result.warnings).toContain("diasUteisInformados");
  });

  it("selects IR brackets at legal calendar-day boundaries", () => {
    expect(getInvestimentoCdiIrAliquota(180)).toBe(22.5);
    expect(getInvestimentoCdiIrAliquota(181)).toBe(20);
    expect(getInvestimentoCdiIrAliquota(360)).toBe(20);
    expect(getInvestimentoCdiIrAliquota(361)).toBe(17.5);
    expect(getInvestimentoCdiIrAliquota(720)).toBe(17.5);
    expect(getInvestimentoCdiIrAliquota(721)).toBe(15);
  });

  it("selects IOF table values from Decreto 6.306/2007", () => {
    expect(getInvestimentoCdiIofAliquota(1)).toBe(96);
    expect(getInvestimentoCdiIofAliquota(2)).toBe(93);
    expect(getInvestimentoCdiIofAliquota(29)).toBe(3);
    expect(getInvestimentoCdiIofAliquota(30)).toBe(0);
    expect(getInvestimentoCdiIofAliquota(31)).toBe(0);
  });

  it("keeps manual annual CDI close to the displayed snapshot annual rate", () => {
    const snapshot = calcularInvestimentoCdi(inputs());
    const manual = calcularInvestimentoCdi(
      inputs({
        cdiModo: "manual",
        cdiAnualManual: INVESTIMENTO_CDI_ANNUAL_RATE_PERCENT,
      })
    );

    expect(manual.valorFinalBruto).toBeCloseTo(snapshot.valorFinalBruto, 1);
    expect(manual.valorFinalLiquido).toBeCloseTo(snapshot.valorFinalLiquido, 1);
    expect(manual.cdiFonte.warningCode).toBe("cdiManualUsuario");
    expect(manual.warnings).toContain("cdiManualUsuario");
  });

  it("keeps taxes at zero when the CDI percentage is zero", () => {
    const result = calcularInvestimentoCdi(inputs({ percentualCdi: 0 }));

    expect(result.rendimentoBruto).toBe(0);
    expect(result.iofValor).toBe(0);
    expect(result.irValor).toBe(0);
    expect(result.valorFinalLiquido).toBe(10000);
    expect(result.warnings).toContain("rendimentoZero");
  });

  it("builds comparison rows for common CDI percentages plus the selected one", () => {
    const result = calcularInvestimentoCdi(inputs({ percentualCdi: 105 }));

    expect(result.comparisonRows.map((row) => row.percentualCdi)).toEqual([90, 100, 105, 110]);
    expect(result.comparisonRows.find((row) => row.percentualCdi === 100)?.valorFinalLiquido).toBe(11167.37);
    expect(result.comparisonRows.find((row) => row.percentualCdi === 110)?.valorFinalLiquido).toBe(11292.8);
  });

  it("derives estimated business days from calendar days with a minimum of one", () => {
    expect(calcularDiasUteisEstimadosInvestimentoCdi(1)).toBe(1);
    expect(calcularDiasUteisEstimadosInvestimentoCdi(365)).toBe(252);
    expect(getDiasUteisMaximoParaPrazoInvestimentoCdi(365)).toBe(265);
  });

  it("validates ranges, modes, source version, and business-day ceiling", () => {
    expect(validateInvestimentoCdiInputs(inputs({ valorInicial: 0 }))).toContain("valorInicial");
    expect(validateInvestimentoCdiInputs(inputs({ valorInicial: 100_000_000.01 }))).toContain("valorInicial");
    expect(validateInvestimentoCdiInputs(inputs({ prazoDiasCorridos: 0 }))).toContain("prazoDiasCorridos");
    expect(validateInvestimentoCdiInputs(inputs({ prazoDiasCorridos: 3651 }))).toContain("prazoDiasCorridos");
    expect(validateInvestimentoCdiInputs(inputs({ diasUteis: 0 }))).toContain("diasUteis");
    expect(validateInvestimentoCdiInputs(inputs({ prazoDiasCorridos: 365, diasUteis: 266 }))).toContain(
      "diasUteisAcimaPrazo"
    );
    expect(validateInvestimentoCdiInputs(inputs({ diasUteisModo: "auto" as "estimado" }))).toContain("diasUteisModo");
    expect(validateInvestimentoCdiInputs(inputs({ cdiModo: "selic" as "snapshot" }))).toContain("cdiModo");
    expect(validateInvestimentoCdiInputs(inputs({ percentualCdi: 301 }))).toContain("percentualCdi");
    expect(validateInvestimentoCdiInputs(inputs({ cdiModo: "manual", cdiAnualManual: 101 }))).toContain(
      "cdiAnualManual"
    );
    expect(
      validateInvestimentoCdiInputs({
        ...inputs(),
        sourceVersion: "2026-07-05" as typeof INVESTIMENTO_CDI_SOURCE_VERSION,
      })
    ).toContain("sourceVersion");
  });

  it("rejects calculations that would produce non-finite output", () => {
    const bad = inputs({ valorInicial: Number.POSITIVE_INFINITY });

    expect(validateInvestimentoCdiInputs(bad)).toContain("valorInicial");
    expect(() => calcularInvestimentoCdi(bad)).toThrow(RangeError);
  });
});

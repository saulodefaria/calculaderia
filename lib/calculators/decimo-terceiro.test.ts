import { describe, expect, it } from "vitest";
import {
  DECIMO_TERCEIRO_IRRF_2026_MONTHLY_REDUCTION_TABLE,
  calcularDecimoTerceiro,
  calcularInssDecimoTerceiro2026,
  calcularIrrfDecimoTerceiro2026,
  calcularReducaoMensalIrrfDecimoTerceiro2026,
  contarAvosDecimoTerceiroAno,
  getDefaultDecimoTerceiroInputs,
  type InputsDecimoTerceiro,
} from "./decimo-terceiro";

const baseInputs: InputsDecimoTerceiro = {
  salarioMensal: 3000,
  mediaVariavelMensal: 0,
  anoReferencia: 2026,
  dataAdmissao: "2026-01-01",
  dataReferencia: "2026-12-31",
  modoCalculo: "projecaoAnual",
  adiantamentoJaRecebido: 0,
  calcularPrimeiraParcela: true,
  dependentesIr: 0,
  pensaoAlimenticia: 0,
  outrosDescontos: 0,
  outrosAcrescimos: 0,
  calcularDescontosLegais: false,
};

describe("calcularDecimoTerceiro", () => {
  it("calculates a full 12/12 gross 13th salary and first installment estimate", () => {
    const result = calcularDecimoTerceiro(baseInputs);

    expect(result.remuneracaoBase).toBe(3000);
    expect(result.avos).toBe(12);
    expect(result.decimoBruto).toBe(3000);
    expect(result.primeiraParcelaEstimada).toBe(1500);
    expect(result.segundaParcelaBrutaAntesDescontos).toBe(3000);
    expect(result.liquidoEstimado).toBe(3000);
    expect(result.monthMemo.every((row) => row.counted)).toBe(true);
    expect(result.warnings).toContain("descontosLegaisDesativados");
  });

  it("counts only months with at least 15 employed days", () => {
    expect(contarAvosDecimoTerceiroAno("2026-03-18", "2026-12-31", 2026)).toBe(9);
    expect(contarAvosDecimoTerceiroAno("2026-03-17", "2026-12-31", 2026)).toBe(10);
    expect(contarAvosDecimoTerceiroAno("2026-03-16", "2026-12-31", 2026)).toBe(10);
    expect(contarAvosDecimoTerceiroAno("2026-01-01", "2026-06-14", 2026)).toBe(5);
    expect(contarAvosDecimoTerceiroAno("2026-01-01", "2026-06-15", 2026)).toBe(6);

    const result = calcularDecimoTerceiro({
      ...baseInputs,
      dataAdmissao: "2026-03-18",
      dataReferencia: "2026-12-31",
    });

    expect(result.avos).toBe(9);
    expect(result.decimoBruto).toBe(2250);
    expect(result.monthMemo[2].daysConsidered).toBe(14);
    expect(result.monthMemo[2].counted).toBe(false);
  });

  it("caps an advance above gross 13th salary and warns", () => {
    const result = calcularDecimoTerceiro({
      ...baseInputs,
      adiantamentoJaRecebido: 4000,
    });

    expect(result.adiantamentoAplicado).toBe(3000);
    expect(result.adiantamentoExcedente).toBe(1000);
    expect(result.segundaParcelaBrutaAntesDescontos).toBe(0);
    expect(result.liquidoEstimado).toBe(0);
    expect(result.warnings).toContain("adiantamentoLimitado");
  });

  it("applies 2026 legal deductions separately from monthly salary", () => {
    const result = calcularDecimoTerceiro({
      ...baseInputs,
      salarioMensal: 6000,
      adiantamentoJaRecebido: 3000,
      calcularDescontosLegais: true,
    });

    expect(result.decimoBruto).toBe(6000);
    expect(result.inssDecimoTerceiro).toBe(641.51);
    expect(result.irrfDecimoTerceiro).toBeCloseTo(385.1, 2);
    expect(result.segundaParcelaBrutaAntesDescontos).toBe(3000);
    expect(result.liquidoEstimado).toBeCloseTo(1973.39, 2);
    expect(result.warnings).toContain("tabelasLegais2026");
    expect(result.warnings).toContain("fontesConsultadas2026");
  });

  it("shows unsupported table years as gross-only when automatic deductions are requested", () => {
    const result = calcularDecimoTerceiro({
      ...baseInputs,
      anoReferencia: 2025,
      dataAdmissao: "2025-01-01",
      dataReferencia: "2025-12-31",
      calcularDescontosLegais: true,
    });

    expect(result.avos).toBe(12);
    expect(result.inssDecimoTerceiro).toBe(0);
    expect(result.irrfDecimoTerceiro).toBe(0);
    expect(result.liquidoEstimado).toBe(3000);
    expect(result.warnings).toContain("anoSemDescontosAutomaticos");
  });

  it("keeps variable pay and manual adjustments outside automatic legal bases", () => {
    const result = calcularDecimoTerceiro({
      ...baseInputs,
      salarioMensal: 3000,
      mediaVariavelMensal: 500,
      adiantamentoJaRecebido: 1750,
      outrosDescontos: 100,
      outrosAcrescimos: 50,
      calcularDescontosLegais: true,
    });

    expect(result.remuneracaoBase).toBe(3500);
    expect(result.decimoBruto).toBe(3500);
    expect(result.segundaParcelaBrutaAntesDescontos).toBe(1750);
    expect(result.liquidoEstimado).toBeCloseTo(
      1750 - result.inssDecimoTerceiro - result.irrfDecimoTerceiro - 100 + 50,
      2
    );
    expect(result.warnings).toContain("mediaVariavelEstimativa");
  });

  it("throws on invalid money, dates, unsupported mode, and ranges", () => {
    expect(() => calcularDecimoTerceiro({ ...baseInputs, salarioMensal: -1 })).toThrow(RangeError);
    expect(() => calcularDecimoTerceiro({ ...baseInputs, dependentesIr: 21 })).toThrow(RangeError);
    expect(() => calcularDecimoTerceiro({ ...baseInputs, dataAdmissao: "2026-02-01", dataReferencia: "2026-01-31" })).toThrow(
      RangeError
    );
    expect(() => calcularDecimoTerceiro({ ...baseInputs, dataReferencia: "2025-12-31" })).toThrow(RangeError);
    expect(() =>
      calcularDecimoTerceiro({ ...baseInputs, modoCalculo: "outro" as InputsDecimoTerceiro["modoCalculo"] })
    ).toThrow(RangeError);
  });
});

describe("2026 decimo terceiro legal deduction helpers", () => {
  it("calculates progressive INSS at bracket boundaries and ceiling", () => {
    expect(calcularInssDecimoTerceiro2026(1621)).toBe(121.58);
    expect(calcularInssDecimoTerceiro2026(8475.55)).toBe(988.09);
    expect(calcularInssDecimoTerceiro2026(10000)).toBe(988.09);
  });

  it("applies IRRF table, dependents, alimony, simplified discount, and monthly reduction", () => {
    const inss = calcularInssDecimoTerceiro2026(6000);
    const withoutDeductions = calcularIrrfDecimoTerceiro2026(6000, inss, 0, 0);
    const withDependent = calcularIrrfDecimoTerceiro2026(6000, inss, 1, 0);
    const withAlimony = calcularIrrfDecimoTerceiro2026(6000, inss, 0, 800);

    expect(withoutDeductions).toBeCloseTo(385.1, 2);
    expect(withDependent).toBeLessThan(withoutDeductions);
    expect(withAlimony).toBeLessThan(withoutDeductions);
    expect(calcularIrrfDecimoTerceiro2026(5000, calcularInssDecimoTerceiro2026(5000), 0, 0)).toBe(0);
  });

  it("pins the 2026 Receita monthly IRRF reduction table", () => {
    expect(DECIMO_TERCEIRO_IRRF_2026_MONTHLY_REDUCTION_TABLE.zeroTaxableEarningsLimit).toBe(5000);
    expect(DECIMO_TERCEIRO_IRRF_2026_MONTHLY_REDUCTION_TABLE.phaseOutTaxableEarningsLimit).toBe(7350);
    expect(DECIMO_TERCEIRO_IRRF_2026_MONTHLY_REDUCTION_TABLE.phaseOutFixedReduction).toBe(978.62);
    expect(DECIMO_TERCEIRO_IRRF_2026_MONTHLY_REDUCTION_TABLE.phaseOutRate).toBe(0.133145);
    expect(calcularReducaoMensalIrrfDecimoTerceiro2026(6000, 564.85)).toBeCloseTo(179.75, 2);
    expect(calcularIrrfDecimoTerceiro2026(8000, calcularInssDecimoTerceiro2026(8000), 0)).toBeCloseTo(1037.85, 2);
  });

  it("keeps deterministic date defaults", () => {
    const defaults = getDefaultDecimoTerceiroInputs(new Date(2026, 5, 18));

    expect(defaults.anoReferencia).toBe(2026);
    expect(defaults.dataAdmissao).toBe("2026-01-01");
    expect(defaults.dataReferencia).toBe("2026-12-31");
    expect(defaults.modoCalculo).toBe("projecaoAnual");
  });
});

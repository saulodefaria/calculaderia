import { describe, expect, it } from "vitest";
import {
  IRRF_2026_MONTHLY_REDUCTION_TABLE,
  calcularAnosCompletos,
  calcularDiasAvisoProporcional,
  calcularInss2026,
  calcularIrrf2026,
  calcularReducaoMensalIrrf2026,
  calcularRescisaoTrabalhista,
  contarAvosDecimoTerceiro,
  getDefaultRescisaoTrabalhistaInputs,
  type InputsRescisaoTrabalhista,
} from "./rescisao-trabalhista";

const baseInputs: InputsRescisaoTrabalhista = {
  salarioMensal: 3000,
  mediaVariavelMensal: 0,
  dataAdmissao: "2025-01-15",
  dataDesligamento: "2026-01-20",
  motivo: "semJustaCausa",
  avisoPrevio: "indenizado",
  diasTrabalhadosMes: 20,
  feriasVencidasPeriodos: 0,
  saldoFgts: 4000,
  saldoFgtsIncluiVerbasRescisorias: false,
  dependentesIr: 0,
  adiantamentoDecimoTerceiro: 0,
  adiantamentoFerias: 0,
  outrosCreditos: 0,
  outrosDescontos: 0,
  calcularDescontosLegais: false,
};

describe("calcularRescisaoTrabalhista", () => {
  it("calculates dismissal without cause with indemnified notice and informed FGTS balance", () => {
    const result = calcularRescisaoTrabalhista(baseInputs);

    expect(result.remuneracaoBase).toBe(3000);
    expect(result.anosCompletos).toBe(1);
    expect(result.diasAvisoProporcional).toBe(33);
    expect(result.saldoSalario).toBe(2000);
    expect(result.avisoCredito).toBe(3300);
    expect(result.avosDecimoTerceiro).toBe(2);
    expect(result.decimoTerceiroBruto).toBe(500);
    expect(result.avosFeriasProporcionais).toBe(2);
    expect(result.feriasProporcionaisBrutas).toBeCloseTo(666.67, 2);
    expect(result.fgtsRescisorioEstimado).toBe(464);
    expect(result.baseMultaFgts).toBe(4464);
    expect(result.multaFgts).toBe(1785.6);
    expect(result.saqueFgts).toBe(4464);
    expect(result.totalBruto).toBeCloseTo(6466.67, 2);
    expect(result.totalDescontos).toBe(0);
    expect(result.totalLiquido).toBeCloseTo(6466.67, 2);
    expect(result.warnings).toContain("descontosLegaisDesativados");
    expect(result.warnings).not.toContain("fgtsEstimado");
  });

  it("calculates resignation with a 30-day notice discount and no FGTS fine or withdrawal", () => {
    const result = calcularRescisaoTrabalhista({
      ...baseInputs,
      dataAdmissao: "2025-01-01",
      dataDesligamento: "2026-03-10",
      motivo: "pedidoDemissao",
      avisoPrevio: "descontado",
      diasTrabalhadosMes: 10,
      saldoFgts: 5000,
    });

    expect(result.saldoSalario).toBe(1000);
    expect(result.avisoCredito).toBe(0);
    expect(result.avisoDesconto).toBe(3000);
    expect(result.avosDecimoTerceiro).toBe(2);
    expect(result.decimoTerceiroBruto).toBe(500);
    expect(result.feriasProporcionaisBrutas).toBeCloseTo(666.67, 2);
    expect(result.multaFgts).toBe(0);
    expect(result.saqueFgts).toBe(0);
    expect(result.totalLiquido).toBeCloseTo(-833.33, 2);
    expect(result.direitosIncluidos).toContain("avisoPrevioDesconto");
  });

  it("limits with-cause dismissal to salary balance and overdue vacation among severance credits", () => {
    const result = calcularRescisaoTrabalhista({
      ...baseInputs,
      motivo: "justaCausa",
      avisoPrevio: "naoSeAplica",
      diasTrabalhadosMes: 15,
      feriasVencidasPeriodos: 1,
      saldoFgts: undefined,
    });

    expect(result.saldoSalario).toBe(1500);
    expect(result.avisoCredito).toBe(0);
    expect(result.avisoDesconto).toBe(0);
    expect(result.decimoTerceiroBruto).toBe(0);
    expect(result.feriasProporcionaisBrutas).toBe(0);
    expect(result.feriasVencidas).toBe(4000);
    expect(result.multaFgts).toBe(0);
    expect(result.saqueFgts).toBe(0);
    expect(result.totalBruto).toBe(5500);
    expect(result.warnings).toContain("fgtsEstimado");
  });

  it("calculates mutual agreement with half indemnified notice, 20% FGTS fine, and 80% withdrawal display", () => {
    const result = calcularRescisaoTrabalhista({
      ...baseInputs,
      dataAdmissao: "2024-01-01",
      dataDesligamento: "2026-01-31",
      motivo: "acordo",
      avisoPrevio: "indenizado",
      diasTrabalhadosMes: 30,
      saldoFgts: 10000,
      saldoFgtsIncluiVerbasRescisorias: true,
    });

    expect(result.diasAvisoProporcional).toBe(36);
    expect(result.avisoCredito).toBe(1800);
    expect(result.fgtsFinePercentual).toBe(0.2);
    expect(result.saqueFgtsPercentual).toBe(0.8);
    expect(result.baseMultaFgts).toBe(10000);
    expect(result.multaFgts).toBe(2000);
    expect(result.saqueFgts).toBe(8000);
  });

  it("flags indirect termination as an estimate with the same monetary family as dismissal without cause", () => {
    const semJusta = calcularRescisaoTrabalhista(baseInputs);
    const indireta = calcularRescisaoTrabalhista({
      ...baseInputs,
      motivo: "rescisaoIndireta",
      avisoPrevio: "indenizado",
    });

    expect(indireta.totalLiquido).toBe(semJusta.totalLiquido);
    expect(indireta.multaFgts).toBe(semJusta.multaFgts);
    expect(indireta.warnings).toContain("rescisaoIndireta");
  });

  it("estimates FGTS history when the current balance is blank", () => {
    const result = calcularRescisaoTrabalhista({
      ...baseInputs,
      saldoFgts: undefined,
    });

    expect(result.fgtsEstimadoPorHistorico).toBe(true);
    expect(result.mesesContrato).toBe(13);
    expect(result.baseMultaFgts).toBe(3584);
    expect(result.warnings).toContain("saldoFgtsAusente");
  });

  it("throws on impossible dates and notice modes", () => {
    expect(() =>
      calcularRescisaoTrabalhista({
        ...baseInputs,
        dataAdmissao: "2026-02-01",
        dataDesligamento: "2026-01-01",
      })
    ).toThrow(RangeError);

    expect(() =>
      calcularRescisaoTrabalhista({
        ...baseInputs,
        motivo: "justaCausa",
        avisoPrevio: "indenizado",
      })
    ).toThrow(RangeError);
  });
});

describe("rescisao trabalhista date helpers", () => {
  it("pins proportional notice anniversary behavior", () => {
    expect(calcularDiasAvisoProporcional("2025-05-31", "2026-05-30")).toBe(30);
    expect(calcularDiasAvisoProporcional("2025-05-31", "2026-05-31")).toBe(33);
    expect(calcularDiasAvisoProporcional("1990-01-01", "2026-01-01")).toBe(90);
  });

  it("treats leap-day admission as completing a year on Feb 28 in non-leap years", () => {
    expect(calcularAnosCompletos("2024-02-29", "2025-02-28")).toBe(1);
    expect(calcularDiasAvisoProporcional("2024-02-29", "2025-02-28")).toBe(33);
  });

  it("counts 13th salary avos only for months with at least 15 employed days", () => {
    expect(contarAvosDecimoTerceiro("2026-05-17", "2026-05-31")).toBe(1);
    expect(contarAvosDecimoTerceiro("2026-05-18", "2026-05-31")).toBe(0);
  });

  it("caps the default salary-balance day at 30 when today is day 31", () => {
    const defaults = getDefaultRescisaoTrabalhistaInputs(new Date(2026, 0, 31));
    expect(defaults.diasTrabalhadosMes).toBe(30);
  });
});

describe("2026 legal deduction helpers", () => {
  it("calculates progressive INSS contribution at bracket boundaries and teto", () => {
    expect(calcularInss2026(1621)).toBe(121.58);
    expect(calcularInss2026(8475.55)).toBe(988.09);
    expect(calcularInss2026(10000)).toBe(988.09);
  });

  it("applies the 2026 IRRF table and monthly reduction after INSS, dependents, and simplified discount", () => {
    const inss = calcularInss2026(6000);
    const withoutDependents = calcularIrrf2026(6000, inss, 0);
    const withDependents = calcularIrrf2026(6000, inss, 2);

    expect(withoutDependents).toBeCloseTo(385.1, 2);
    expect(withDependents).toBeLessThan(withoutDependents);
    expect(calcularIrrf2026(2428.8, 0, 0)).toBe(0);
  });

  it("documents and applies the 2026 Receita monthly IRRF reduction table", () => {
    expect(IRRF_2026_MONTHLY_REDUCTION_TABLE.zeroTaxableEarningsLimit).toBe(5000);
    expect(IRRF_2026_MONTHLY_REDUCTION_TABLE.phaseOutTaxableEarningsLimit).toBe(7350);
    expect(IRRF_2026_MONTHLY_REDUCTION_TABLE.phaseOutFixedReduction).toBe(978.62);
    expect(IRRF_2026_MONTHLY_REDUCTION_TABLE.phaseOutRate).toBe(0.133145);

    expect(calcularIrrf2026(5000, calcularInss2026(5000), 0)).toBe(0);

    const reductionAt6000 =
      IRRF_2026_MONTHLY_REDUCTION_TABLE.phaseOutFixedReduction -
      IRRF_2026_MONTHLY_REDUCTION_TABLE.phaseOutRate * 6000;
    expect(reductionAt6000).toBeCloseTo(179.75, 2);
    expect(calcularReducaoMensalIrrf2026(6000, 564.85)).toBeCloseTo(179.75, 2);
    expect(calcularIrrf2026(6000, calcularInss2026(6000), 0)).toBeCloseTo(385.1, 2);

    expect(calcularReducaoMensalIrrf2026(8000, 1037.85)).toBe(0);
    expect(calcularIrrf2026(8000, calcularInss2026(8000), 0)).toBeCloseTo(1037.85, 2);
  });
});

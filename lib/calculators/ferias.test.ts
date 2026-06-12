import { describe, expect, it } from "vitest";
import {
  FERIAS_IRRF_2026_MONTHLY_REDUCTION_TABLE,
  calcularFerias,
  calcularInssFerias2026,
  calcularIrrfFerias2026,
  calcularReducaoMensalIrrfFerias2026,
  contarAvosFeriasProporcionais,
  getDefaultFeriasInputs,
  getFeriasEntitlement,
  type InputsFerias,
} from "./ferias";

const baseInputs: InputsFerias = {
  salarioMensal: 3000,
  mediaVariavelMensal: 0,
  modo: "gozo",
  dataInicioPeriodoAquisitivo: "2025-06-01",
  dataReferencia: "2026-06-07",
  dataInicioFerias: "2026-07-01",
  faltasInjustificadas: 0,
  diasFerias: 30,
  converterAbono: false,
  diasAbono: 0,
  incluirSalarioDiasVendidos: true,
  dependentesIr: 0,
  pensaoAlimenticia: 0,
  outrosDescontos: 0,
  outrosAcrescimos: 0,
  calcularDescontosLegais: false,
};

describe("getFeriasEntitlement", () => {
  it("maps CLT absence brackets to vacation days", () => {
    expect(getFeriasEntitlement(5).diasDireito).toBe(30);
    expect(getFeriasEntitlement(6).diasDireito).toBe(24);
    expect(getFeriasEntitlement(14).diasDireito).toBe(24);
    expect(getFeriasEntitlement(15).diasDireito).toBe(18);
    expect(getFeriasEntitlement(23).diasDireito).toBe(18);
    expect(getFeriasEntitlement(24).diasDireito).toBe(12);
    expect(getFeriasEntitlement(32).diasDireito).toBe(12);
    expect(getFeriasEntitlement(33).diasDireito).toBe(0);
  });

  it("sets the abono limit to one-third of each entitlement", () => {
    expect(getFeriasEntitlement(0).diasAbonoMax).toBe(10);
    expect(getFeriasEntitlement(6).diasAbonoMax).toBe(8);
    expect(getFeriasEntitlement(15).diasAbonoMax).toBe(6);
    expect(getFeriasEntitlement(24).diasAbonoMax).toBe(4);
    expect(getFeriasEntitlement(33).diasAbonoMax).toBe(0);
  });
});

describe("calcularFerias", () => {
  it("calculates normal 30-day vacation with one-third before legal deductions", () => {
    const result = calcularFerias(baseInputs);

    expect(result.feriasGozadas).toBe(3000);
    expect(result.tercoFeriasGozadas).toBe(1000);
    expect(result.brutoReciboFerias).toBe(4000);
    expect(result.totalDescontos).toBe(0);
    expect(result.liquidoReciboFerias).toBe(4000);
    expect(result.warnings).toContain("deducoesDesativadas");
  });

  it("separates abono pecuniario from ordinary salary on sold worked days", () => {
    const result = calcularFerias({
      ...baseInputs,
      diasFerias: 20,
      converterAbono: true,
      diasAbono: 10,
    });

    expect(result.feriasGozadas).toBe(2000);
    expect(result.tercoFeriasGozadas).toBeCloseTo(666.67, 2);
    expect(result.abonoPecuniario).toBe(1000);
    expect(result.tercoAbono).toBeCloseTo(333.33, 2);
    expect(result.brutoReciboFerias).toBe(4000);
    expect(result.salarioDiasVendidos).toBe(1000);
    expect(result.fluxoCaixaBrutoComDiasVendidos).toBe(5000);
    expect(result.descontosLegais.baseInssFerias).toBeCloseTo(2666.67, 2);
    expect(result.warnings).toContain("abonoSeparado");
  });

  it("counts proportional avos with a 15-day month threshold and absence reduction", () => {
    expect(contarAvosFeriasProporcionais("2026-05-01", "2026-05-14")).toBe(0);
    expect(contarAvosFeriasProporcionais("2026-05-01", "2026-05-15")).toBe(1);
    expect(contarAvosFeriasProporcionais("2025-06-01", "2026-05-31")).toBe(12);
    expect(contarAvosFeriasProporcionais("2025-06-01", "2026-06-30")).toBe(12);

    const result = calcularFerias({
      ...baseInputs,
      modo: "proporcional",
      dataInicioPeriodoAquisitivo: "2026-01-01",
      dataReferencia: "2026-06-14",
      faltasInjustificadas: 6,
      diasFerias: 24,
      calcularDescontosLegais: true,
    });

    expect(result.avosProporcionais).toBe(5);
    expect(result.feriasProporcionais).toBe(1000);
    expect(result.tercoProporcional).toBeCloseTo(333.33, 2);
    expect(result.descontosLegais.total).toBe(0);
    expect(result.warnings).toContain("proporcionalEstimado");
    expect(result.warnings).toContain("deducoesSomenteGozo");
  });

  it("calculates overdue vacation before, on, and after the concession deadline", () => {
    const before = calcularFerias({
      ...baseInputs,
      modo: "vencidas",
      dataInicioPeriodoAquisitivo: "2025-01-01",
      dataInicioFerias: "2026-12-31",
      calcularDescontosLegais: false,
    });
    const onDeadline = calcularFerias({
      ...baseInputs,
      modo: "vencidas",
      dataInicioPeriodoAquisitivo: "2025-01-01",
      dataInicioFerias: "2026-12-31",
      calcularDescontosLegais: false,
    });
    const after = calcularFerias({
      ...baseInputs,
      modo: "vencidas",
      dataInicioPeriodoAquisitivo: "2025-01-01",
      dataInicioFerias: "2027-01-01",
      calcularDescontosLegais: false,
    });

    expect(before.statusPeriodo.dataLimiteConcessivo).toBe("2026-12-31");
    expect(onDeadline.statusPeriodo.emDobro).toBe(true);
    expect(onDeadline.warnings).toContain("periodoUltrapassaLimite");
    expect(after.statusPeriodo.emDobro).toBe(true);
    expect(after.brutoReciboFerias).toBe(8000);
    expect(after.adicionalDobro).toBe(4000);
    expect(after.warnings).toContain("dobroConservador");
  });

  it("does not turn late payment alone into double vacation pay", () => {
    const result = calcularFerias({
      ...baseInputs,
      modo: "vencidas",
      dataInicioPeriodoAquisitivo: "2025-01-01",
      dataInicioFerias: "2026-12-01",
      calcularDescontosLegais: false,
    });

    expect(result.statusPeriodo.emDobro).toBe(false);
    expect(result.brutoReciboFerias).toBe(4000);
  });

  it("excludes abono and one-third on abono from automatic INSS and IRRF bases", () => {
    const result = calcularFerias({
      ...baseInputs,
      diasFerias: 20,
      converterAbono: true,
      diasAbono: 10,
      calcularDescontosLegais: true,
    });

    expect(result.brutoReciboFerias).toBe(4000);
    expect(result.descontosLegais.baseInssFerias).toBeCloseTo(2666.67, 2);
    expect(result.descontosLegais.baseIrrfFerias).toBeCloseTo(2666.67, 2);
    expect(result.descontosLegais.inss).toBeLessThan(calcularInssFerias2026(4000));
  });

  it("throws on impossible ranges and unsupported abono modes", () => {
    expect(() => calcularFerias({ ...baseInputs, salarioMensal: -1 })).toThrow(RangeError);
    expect(() => calcularFerias({ ...baseInputs, dataReferencia: "2025-05-31" })).toThrow(RangeError);
    expect(() => calcularFerias({ ...baseInputs, diasFerias: 31 })).toThrow(RangeError);
    expect(() => calcularFerias({ ...baseInputs, converterAbono: true, diasAbono: 11 })).toThrow(RangeError);
    expect(() =>
      calcularFerias({ ...baseInputs, modo: "proporcional", converterAbono: true, diasAbono: 10 })
    ).toThrow(RangeError);
  });
});

describe("2026 vacation legal deduction helpers", () => {
  it("calculates progressive INSS at bracket boundaries and ceiling", () => {
    expect(calcularInssFerias2026(1621)).toBe(121.58);
    expect(calcularInssFerias2026(8475.55)).toBe(988.09);
    expect(calcularInssFerias2026(10000)).toBe(988.09);
  });

  it("applies the monthly IRRF table, dependents, alimony, simplified discount, and reduction table", () => {
    const inss = calcularInssFerias2026(6000);
    const withoutDeductions = calcularIrrfFerias2026(6000, inss, 0, 0);
    const withDependent = calcularIrrfFerias2026(6000, inss, 1, 0);
    const withAlimony = calcularIrrfFerias2026(6000, inss, 0, 800);

    expect(withoutDeductions).toBeCloseTo(385.1, 2);
    expect(withDependent).toBeLessThan(withoutDeductions);
    expect(withAlimony).toBeLessThan(withoutDeductions);
    expect(calcularIrrfFerias2026(5000, calcularInssFerias2026(5000), 0, 0)).toBe(0);
  });

  it("pins the 2026 Receita monthly IRRF reduction table", () => {
    expect(FERIAS_IRRF_2026_MONTHLY_REDUCTION_TABLE.zeroTaxableEarningsLimit).toBe(5000);
    expect(FERIAS_IRRF_2026_MONTHLY_REDUCTION_TABLE.phaseOutTaxableEarningsLimit).toBe(7350);
    expect(FERIAS_IRRF_2026_MONTHLY_REDUCTION_TABLE.phaseOutFixedReduction).toBe(978.62);
    expect(FERIAS_IRRF_2026_MONTHLY_REDUCTION_TABLE.phaseOutRate).toBe(0.133145);

    const reductionAt6000 =
      FERIAS_IRRF_2026_MONTHLY_REDUCTION_TABLE.phaseOutFixedReduction -
      FERIAS_IRRF_2026_MONTHLY_REDUCTION_TABLE.phaseOutRate * 6000;
    expect(reductionAt6000).toBeCloseTo(179.75, 2);
    expect(calcularReducaoMensalIrrfFerias2026(6000, 564.85)).toBeCloseTo(179.75, 2);
  });

  it("keeps deterministic date defaults", () => {
    const defaults = getDefaultFeriasInputs(new Date(2026, 5, 7));

    expect(defaults.dataInicioPeriodoAquisitivo).toBe("2025-06-07");
    expect(defaults.dataReferencia).toBe("2026-06-07");
    expect(defaults.dataInicioFerias).toBe("2026-07-07");
  });
});

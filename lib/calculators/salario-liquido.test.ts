import { describe, expect, it } from "vitest";
import {
  calcularInssEmpregado2026,
  calcularIrrfMensal2026,
  calcularSalarioLiquido,
  getDefaultSalarioLiquidoInputs,
  validateSalarioLiquidoInputs,
  type SalarioLiquidoInputs,
} from "./salario-liquido";

function inputs(overrides: Partial<SalarioLiquidoInputs> = {}): SalarioLiquidoInputs {
  return {
    ...getDefaultSalarioLiquidoInputs(),
    ...overrides,
  };
}

describe("calcularSalarioLiquido", () => {
  it("calculates the default 2026 net salary example", () => {
    const result = calcularSalarioLiquido(getDefaultSalarioLiquidoInputs());

    expect(result.proventosTributaveis).toBe(3000);
    expect(result.inss).toBe(248.6);
    expect(result.irrf).toBe(0);
    expect(result.totalDescontos).toBe(248.6);
    expect(result.salarioLiquido).toBe(2751.4);
    expect(result.sourceVersion.legalRulesAccessedAt).toBe("2026-06-20");
    expect(result.warnings).toContain("tabelasLegais2026");
    expect(result.warnings).toContain("fontesConsultadas2026");
  });

  it("calculates salary 6000 with INSS, IRRF reduction, and net value", () => {
    const result = calcularSalarioLiquido(inputs({ salarioBruto: 6000 }));

    expect(result.inss).toBe(641.51);
    expect(result.baseIrrfPadrao).toBe(5358.49);
    expect(result.baseIrrfSimplificada).toBe(5392.8);
    expect(result.tipoBaseIrrfUsada).toBe("padrao");
    expect(result.irrfAntesReducao).toBe(564.85);
    expect(result.reducaoIrrfMensal).toBe(179.75);
    expect(result.irrf).toBe(385.1);
    expect(result.salarioLiquido).toBe(4973.39);
  });

  it("caps INSS above the 2026 ceiling and does not apply monthly reduction above 7350", () => {
    const result = calcularSalarioLiquido(inputs({ salarioBruto: 9000 }));

    expect(result.baseInss).toBe(8475.55);
    expect(result.inss).toBe(988.09);
    expect(result.reducaoIrrfMensal).toBe(0);
    expect(result.irrf).toBe(1294.55);
  });

  it("uses progressive INSS brackets at the documented boundaries", () => {
    const cases = [
      [1621, 121.58],
      [1621.01, 121.58],
      [2902.84, 236.94],
      [2902.85, 236.94],
      [4354.27, 411.11],
      [4354.28, 411.11],
      [8475.55, 988.09],
      [12000, 988.09],
    ] as const;

    for (const [salary, expectedInss] of cases) {
      expect(calcularInssEmpregado2026(salary).inss).toBe(expectedInss);
    }
  });

  it("selects the correct IRRF monthly bracket boundaries after simplified discount", () => {
    const cases = [
      [2428.8, 0, 0],
      [2428.81, 0.075, 182.16],
      [2826.65, 0.075, 182.16],
      [2826.66, 0.15, 394.16],
      [3751.05, 0.15, 394.16],
      [3751.06, 0.225, 675.49],
      [4664.68, 0.225, 675.49],
      [4664.69, 0.275, 908.73],
    ] as const;

    for (const [base, expectedRate, expectedDeduction] of cases) {
      const result = calcularIrrfMensal2026({
        rendimentosTributaveis: base + 607.2,
        inss: 0,
        dependentes: 0,
      });

      expect(result.baseIrrfUsada).toBeCloseTo(base, 2);
      expect(result.aliquotaFaixa).toBe(expectedRate);
      expect(result.parcelaDeduzir).toBe(expectedDeduction);
    }
  });

  it("applies dependent deduction and can choose simplified base when it is lower", () => {
    const withDependents = calcularIrrfMensal2026({
      rendimentosTributaveis: 6000,
      inss: 641.51,
      dependentes: 2,
    });
    const simplified = calcularIrrfMensal2026({
      rendimentosTributaveis: 6000,
      inss: 0,
      dependentes: 0,
    });

    expect(withDependents.deducaoDependentes).toBe(379.18);
    expect(withDependents.baseIrrfPadrao).toBe(4979.31);
    expect(withDependents.tipoBaseIrrfUsada).toBe("padrao");
    expect(simplified.tipoBaseIrrfUsada).toBe("simplificada");
    expect(simplified.baseIrrfUsada).toBe(5392.8);
  });

  it("uses alimony only on the standard IRRF base", () => {
    const result = calcularSalarioLiquido(inputs({ salarioBruto: 6000, pensaoAlimenticia: 1000 }));

    expect(result.baseIrrfPadrao).toBe(4358.49);
    expect(result.baseIrrfSimplificada).toBe(5392.8);
    expect(result.tipoBaseIrrfUsada).toBe("padrao");
    expect(result.irrf).toBe(125.42);
  });

  it("floors net salary at zero when manual deductions exceed pay", () => {
    const result = calcularSalarioLiquido(inputs({ descontosManuais: 4000 }));

    expect(result.totalDescontos).toBe(4248.6);
    expect(result.salarioLiquido).toBe(0);
    expect(result.warnings).toContain("descontosExcedemProventos");
  });

  it("disables automatic INSS and IRRF when legal deductions are off", () => {
    const result = calcularSalarioLiquido(
      inputs({ calcularDescontosLegais: false, descontosManuais: 100, adiantamentos: 50 })
    );

    expect(result.inss).toBe(0);
    expect(result.irrf).toBe(0);
    expect(result.totalDescontos).toBe(150);
    expect(result.salarioLiquido).toBe(2850);
    expect(result.warnings).toContain("descontosLegaisDesativados");
  });

  it("warns but still calculates salary below the 2026 reference value", () => {
    const result = calcularSalarioLiquido(inputs({ salarioBruto: 1500 }));

    expect(result.salarioLiquido).toBe(1387.5);
    expect(result.warnings).toContain("salarioAbaixoReferencia");
  });

  it("adds non-taxable earnings to presentation without changing INSS or IRRF bases", () => {
    const result = calcularSalarioLiquido(inputs({ outrosProventosNaoTributaveis: 200 }));

    expect(result.proventosTributaveis).toBe(3000);
    expect(result.totalProventos).toBe(3200);
    expect(result.inss).toBe(248.6);
    expect(result.irrf).toBe(0);
    expect(result.salarioLiquido).toBe(2951.4);
  });

  it("validates money, dependents, and the supported 2026 table", () => {
    expect(validateSalarioLiquidoInputs(inputs({ salarioBruto: 0 }))).toContain("salarioBrutoObrigatorio");
    expect(validateSalarioLiquidoInputs(inputs({ dependentesIr: 21 }))).toContain("dependentesIr");
    expect(validateSalarioLiquidoInputs(inputs({ descontosManuais: -1 }))).toContain("descontosManuais");
    expect(validateSalarioLiquidoInputs({ ...inputs(), tabelaAno: 2027 as 2026 })).toContain("tabelaAno");
  });
});

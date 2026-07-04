import { describe, expect, it } from "vitest";
import {
  calcularSalarioDiasTrabalhados,
  getDaysInMonthForSalarioDiasTrabalhados,
  getDefaultSalarioDiasTrabalhadosInputs,
  validateSalarioDiasTrabalhadosInputs,
  type SalarioDiasTrabalhadosInputs,
} from "./salario-dias-trabalhados";

function inputs(overrides: Partial<SalarioDiasTrabalhadosInputs> = {}): SalarioDiasTrabalhadosInputs {
  return {
    ...getDefaultSalarioDiasTrabalhadosInputs(),
    mesReferencia: "2026-07",
    ...overrides,
  };
}

describe("calcularSalarioDiasTrabalhados", () => {
  it("calculates the default proportional salary example with 2026 deductions", () => {
    const result = calcularSalarioDiasTrabalhados(inputs({ salarioMensal: 3000, diasRemunerados: 15 }));

    expect(result.divisorAplicado).toBe(30);
    expect(result.valorDia).toBe(100);
    expect(result.salarioProporcionalBruto).toBe(1500);
    expect(result.inss).toBe(112.5);
    expect(result.irrf).toBe(0);
    expect(result.salarioLiquidoEstimado).toBe(1387.5);
    expect(result.sourceVersion.legalRulesAccessedAt).toBe("2026-07-03");
    expect(result.warnings).toContain("tabelasLegais2026");
    expect(result.warnings).toContain("divisorComercial30");
  });

  it("matches the 6000 salary and 10-day deterministic fixture", () => {
    const result = calcularSalarioDiasTrabalhados(inputs({ salarioMensal: 6000, diasRemunerados: 10 }));

    expect(result.salarioProporcionalBruto).toBe(2000);
    expect(result.inss).toBe(155.69);
    expect(result.irrf).toBe(0);
    expect(result.salarioLiquidoEstimado).toBe(1844.31);
  });

  it("matches the 9000 salary and 20-day fixture with IRRF", () => {
    const result = calcularSalarioDiasTrabalhados(inputs({ salarioMensal: 9000, diasRemunerados: 20 }));

    expect(result.salarioProporcionalBruto).toBe(6000);
    expect(result.inss).toBe(641.51);
    expect(result.irrf).toBe(385.1);
    expect(result.salarioLiquidoEstimado).toBe(4973.39);
  });

  it("uses actual calendar days mode for February full-month periods", () => {
    const result = calcularSalarioDiasTrabalhados(
      inputs({
        salarioMensal: 3000,
        divisorModo: "diasDoMes",
        mesReferencia: "2026-02",
        usarPeriodo: true,
        dataInicio: "2026-02-01",
        dataFim: "2026-02-28",
      })
    );

    expect(result.divisorAplicado).toBe(28);
    expect(result.diasRemuneradosEfetivos).toBe(28);
    expect(result.salarioProporcionalBruto).toBe(3000);
  });

  it("keeps commercial-30 full 31-day months at one monthly salary", () => {
    const result = calcularSalarioDiasTrabalhados(
      inputs({
        salarioMensal: 3000,
        mesReferencia: "2026-07",
        usarPeriodo: true,
        dataInicio: "2026-07-01",
        dataFim: "2026-07-31",
      })
    );

    expect(result.divisorAplicado).toBe(30);
    expect(result.diasRemuneradosEfetivos).toBe(30);
    expect(result.salarioProporcionalBruto).toBe(3000);
    expect(result.warnings).toContain("mes31ComDivisor30");
  });

  it("clips a cross-month admission period to the selected month inclusively", () => {
    const result = calcularSalarioDiasTrabalhados(
      inputs({
        salarioMensal: 3000,
        usarPeriodo: true,
        dataInicio: "2026-06-25",
        dataFim: "2026-07-10",
      })
    );

    expect(result.periodo.dataInicioRecortada).toBe("2026-07-01");
    expect(result.periodo.dataFimRecortada).toBe("2026-07-10");
    expect(result.diasRemuneradosEfetivos).toBe(10);
    expect(result.salarioProporcionalBruto).toBe(1000);
    expect(result.warnings).toContain("periodoAjustadoAoMes");
  });

  it("derives period days even if the manual day field would exceed divisor 30", () => {
    const result = calcularSalarioDiasTrabalhados(
      inputs({
        diasRemunerados: 31,
        usarPeriodo: true,
        dataInicio: "2026-07-01",
        dataFim: "2026-07-31",
      })
    );

    expect(result.diasRemuneradosInformados).toBe(31);
    expect(result.diasRemuneradosEfetivos).toBe(30);
    expect(result.salarioProporcionalBruto).toBe(3000);
  });

  it("supports manual divisor policies inside the 1..31 range", () => {
    const result = calcularSalarioDiasTrabalhados(
      inputs({ salarioMensal: 3100, diasRemunerados: 15, divisorModo: "manual", divisorManual: 31 })
    );

    expect(result.divisorAplicado).toBe(31);
    expect(result.valorDia).toBe(100);
    expect(result.salarioProporcionalBruto).toBe(1500);
  });

  it("handles zero remunerated days and taxable/non-taxable additions", () => {
    const result = calcularSalarioDiasTrabalhados(
      inputs({
        diasRemunerados: 0,
        outrosProventosTributaveis: 500,
        outrosProventosNaoTributaveis: 100,
      })
    );

    expect(result.salarioProporcionalBruto).toBe(0);
    expect(result.proventosTributaveis).toBe(500);
    expect(result.totalProventos).toBe(600);
    expect(result.inss).toBe(37.5);
    expect(result.salarioLiquidoEstimado).toBe(562.5);
  });

  it("disables legal deductions when requested", () => {
    const result = calcularSalarioDiasTrabalhados(
      inputs({ salarioMensal: 6000, diasRemunerados: 10, calcularDescontosLegais: false, descontosManuais: 100 })
    );

    expect(result.inss).toBe(0);
    expect(result.irrf).toBe(0);
    expect(result.totalDescontos).toBe(100);
    expect(result.salarioLiquidoEstimado).toBe(1900);
    expect(result.warnings).toContain("descontosLegaisDesativados");
  });

  it("floors net estimate at zero when manual deductions exceed proventos", () => {
    const result = calcularSalarioDiasTrabalhados(inputs({ diasRemunerados: 5, descontosManuais: 5000 }));

    expect(result.salarioLiquidoEstimado).toBe(0);
    expect(result.warnings).toContain("descontosExcedemProventos");
  });

  it("applies dependents and alimony to the IRRF estimate", () => {
    const result = calcularSalarioDiasTrabalhados(
      inputs({
        salarioMensal: 9000,
        diasRemunerados: 20,
        dependentesIr: 2,
        pensaoAlimenticia: 500,
      })
    );

    expect(result.deducaoDependentes).toBe(379.18);
    expect(result.baseIrrfPadrao).toBe(4479.31);
    expect(result.irrf).toBe(152.6);
  });

  it("validates month, dates, days, divisor, money, dependents, and table year", () => {
    expect(validateSalarioDiasTrabalhadosInputs(inputs({ mesReferencia: "2026-13" }))).toContain("mesReferencia");
    expect(validateSalarioDiasTrabalhadosInputs(inputs({ diasRemunerados: 31 }))).toContain("diasRemunerados");
    expect(validateSalarioDiasTrabalhadosInputs(inputs({ divisorModo: "manual", divisorManual: 0 }))).toContain(
      "divisorManual"
    );
    expect(validateSalarioDiasTrabalhadosInputs(inputs({ salarioMensal: 0 }))).toContain("salarioMensalObrigatorio");
    expect(validateSalarioDiasTrabalhadosInputs(inputs({ descontosManuais: -1 }))).toContain("descontosManuais");
    expect(validateSalarioDiasTrabalhadosInputs(inputs({ dependentesIr: 21 }))).toContain("dependentesIr");
    expect(
      validateSalarioDiasTrabalhadosInputs(
        inputs({ usarPeriodo: true, dataInicio: "2026-07-10", dataFim: "2026-07-09" })
      )
    ).toContain("periodoOrdem");
    expect(validateSalarioDiasTrabalhadosInputs({ ...inputs(), tabelaAno: 2027 as 2026 })).toContain("tabelaAno");
  });

  it("exposes calendar day helper for supported month references", () => {
    expect(getDaysInMonthForSalarioDiasTrabalhados("2026-02")).toBe(28);
    expect(getDaysInMonthForSalarioDiasTrabalhados("2028-02")).toBe(29);
    expect(getDaysInMonthForSalarioDiasTrabalhados("1899-12")).toBeNull();
  });
});

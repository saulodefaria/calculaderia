import { describe, expect, it } from "vitest";
import {
  calcularSalarioPorHora,
  getDefaultSalarioPorHoraInputs,
  validateSalarioPorHoraInputs,
  type SalarioPorHoraInputs,
} from "./salario-por-hora";

function inputs(overrides: Partial<SalarioPorHoraInputs> = {}): SalarioPorHoraInputs {
  return {
    ...getDefaultSalarioPorHoraInputs(),
    ...overrides,
  };
}

describe("calcularSalarioPorHora", () => {
  it("calculates the default monthly salary to hourly example with divisor 220", () => {
    const result = calcularSalarioPorHora(inputs({ salarioMensal: 3000, jornadaSemanal: 44 }));

    expect(result.divisorMensal).toBe(220);
    expect(result.jornadaMediaDiaria).toBe(7.33);
    expect(result.valorHoraNormal).toBe(13.64);
    expect(result.salarioMensalEquivalente).toBe(3000);
    expect(result.valorPeriodo).toBe(2181.82);
    expect(result.valorHoraComAdicional).toBe(20.45);
    expect(result.valorPeriodoComAdicional).toBe(3272.73);
    expect(result.valorDiaBase).toBe(100);
    expect(result.sourceVersion.legalRulesAccessedAt).toBe("2026-07-05");
    expect(result.warnings).toContain("estimativaBruta");
    expect(result.warnings).toContain("semDescontosLegais");
  });

  it("uses weekly presets through the CLT art. 64 monthly divisor convention", () => {
    expect(calcularSalarioPorHora(inputs({ salarioMensal: 3000, jornadaSemanal: 40 })).divisorMensal).toBe(200);
    expect(calcularSalarioPorHora(inputs({ salarioMensal: 3000, jornadaSemanal: 40 })).valorHoraNormal).toBe(15);
    expect(calcularSalarioPorHora(inputs({ salarioMensal: 3000, jornadaSemanal: 36 })).divisorMensal).toBe(180);
    expect(calcularSalarioPorHora(inputs({ salarioMensal: 3000, jornadaSemanal: 30 })).divisorMensal).toBe(150);
    expect(calcularSalarioPorHora(inputs({ salarioMensal: 3000, jornadaSemanal: 20 })).divisorMensal).toBe(100);
  });

  it("converts an hourly rate to a monthly gross equivalent", () => {
    const result = calcularSalarioPorHora(inputs({ modo: "horaParaMensal", valorHora: 20, jornadaSemanal: 44 }));

    expect(result.divisorMensal).toBe(220);
    expect(result.valorHoraNormal).toBe(20);
    expect(result.salarioMensalEquivalente).toBe(4400);
    expect(result.valorPeriodo).toBe(3200);
    expect(result.valorDiaBase).toBe(146.67);
  });

  it("uses a manual monthly divisor and period hours", () => {
    const result = calcularSalarioPorHora(
      inputs({
        salarioMensal: 5000,
        divisorModo: "manual",
        divisorMensalManual: 180,
        horasPeriodo: 12,
      })
    );

    expect(result.divisorMensal).toBe(180);
    expect(result.jornadaMediaDiaria).toBeNull();
    expect(result.valorHoraNormal).toBe(27.78);
    expect(result.valorPeriodo).toBe(333.33);
    expect(result.warnings).toContain("divisorManual");
  });

  it("keeps zero period hours valid and supports custom additional percentages", () => {
    const noPeriod = calcularSalarioPorHora(inputs({ horasPeriodo: 0, adicionalPercentual: 0 }));
    const custom = calcularSalarioPorHora(inputs({ salarioMensal: 3000, adicionalPercentual: 100, horasPeriodo: 2 }));

    expect(noPeriod.valorPeriodo).toBe(0);
    expect(noPeriod.valorHoraComAdicional).toBe(13.64);
    expect(custom.valorHoraComAdicional).toBe(27.27);
    expect(custom.valorPeriodoComAdicional).toBe(54.55);
  });

  it("warns for weekly hours above the general 44h ceiling but still calculates", () => {
    const result = calcularSalarioPorHora(inputs({ jornadaSemanal: 48 }));

    expect(result.divisorMensal).toBe(240);
    expect(result.valorHoraNormal).toBe(12.5);
    expect(result.warnings).toContain("jornadaAcima44");
  });

  it("omits the additional-multiplier warning when the panel is disabled", () => {
    const result = calcularSalarioPorHora(inputs({ mostrarAdicional: false }));

    expect(result.warnings).not.toContain("adicionalSimples");
    expect(result.breakdown.find((row) => row.id === "valorHoraComAdicional")?.aplicavel).toBe(false);
  });

  it("validates active money, divisor, schedule, period, and additional percent fields", () => {
    expect(validateSalarioPorHoraInputs(inputs({ salarioMensal: 0 }))).toContain("salarioMensalObrigatorio");
    expect(validateSalarioPorHoraInputs(inputs({ salarioMensal: -1 }))).toContain("salarioMensal");
    expect(validateSalarioPorHoraInputs(inputs({ modo: "horaParaMensal", valorHora: 0 }))).toContain(
      "valorHoraObrigatorio"
    );
    expect(validateSalarioPorHoraInputs(inputs({ divisorModo: "manual", divisorMensalManual: 0 }))).toContain(
      "divisorMensalManual"
    );
    expect(validateSalarioPorHoraInputs(inputs({ jornadaSemanal: 61 }))).toContain("jornadaSemanal");
    expect(validateSalarioPorHoraInputs(inputs({ horasPeriodo: 1001 }))).toContain("horasPeriodo");
    expect(validateSalarioPorHoraInputs(inputs({ adicionalPercentual: 301 }))).toContain("adicionalPercentual");
  });

  it("throws on invalid calculator inputs", () => {
    expect(() => calcularSalarioPorHora(inputs({ divisorModo: "manual", divisorMensalManual: 0 }))).toThrow(
      /Invalid salario-por-hora inputs/
    );
  });
});

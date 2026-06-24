import { describe, expect, it } from "vitest";
import {
  INSS_SOURCE_VERSION_2026_06_24,
  calcularInss,
  getDefaultInssInputs,
  validateInssInputs,
  type InssCategoriaSegurado,
  type InssInputs,
} from "./inss";

function inputs(overrides: Partial<InssInputs> = {}): InssInputs {
  return {
    ...getDefaultInssInputs(),
    ...overrides,
  };
}

describe("calcularInss", () => {
  it("calculates the default 2026 employee INSS estimate", () => {
    const result = calcularInss(getDefaultInssInputs());

    expect(result.baseInformada).toBe(3000);
    expect(result.baseInss).toBe(3000);
    expect(result.inss).toBe(248.6);
    expect(result.aliquotaEfetiva).toBe(0.0829);
    expect(result.tetoInss).toBe(8475.55);
    expect(result.margemAteTeto).toBe(5475.55);
    expect(result.sourceVersion).toBe(INSS_SOURCE_VERSION_2026_06_24);
    expect(result.sourceVersion.accessedAt).toBe("2026-06-24");
    expect(result.sourceVersion.effectiveFrom).toBe("2026-01");
    expect(result.warnings).toContain("tabelaInss2026");
    expect(result.warnings).toContain("fontesConsultadas");
    expect(result.slices).toMatchObject([
      { from: 0, to: 1621, rate: 0.075, amount: 1621, contribution: 121.58 },
      { from: 1621, to: 2902.84, rate: 0.09, amount: 1281.84, contribution: 115.37 },
      { from: 2902.84, to: 4354.27, rate: 0.12, amount: 97.16, contribution: 11.66 },
    ]);
  });

  it("calculates salary 6000 with the documented effective rate", () => {
    const result = calcularInss(inputs({ salarioContribuicao: 6000 }));

    expect(result.baseInformada).toBe(6000);
    expect(result.baseInss).toBe(6000);
    expect(result.inss).toBe(641.51);
    expect(result.aliquotaEfetiva).toBe(0.1069);
  });

  it("caps contribution base above the 2026 ceiling", () => {
    const result = calcularInss(inputs({ salarioContribuicao: 9000 }));

    expect(result.baseInformada).toBe(9000);
    expect(result.baseInss).toBe(8475.55);
    expect(result.inss).toBe(988.09);
    expect(result.margemAteTeto).toBe(0);
    expect(result.warnings).toContain("tetoAplicado");
  });

  it("keeps official 2026 progressive boundaries stable", () => {
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

    for (const [salarioContribuicao, expectedInss] of cases) {
      expect(calcularInss(inputs({ salarioContribuicao })).inss).toBe(expectedInss);
    }
  });

  it("warns but still calculates below the 2026 reference salary", () => {
    const result = calcularInss(inputs({ salarioContribuicao: 1500 }));

    expect(result.baseInss).toBe(1500);
    expect(result.inss).toBe(112.5);
    expect(result.warnings).toContain("salarioAbaixoReferencia");
  });

  it("adds other remuneration to the same monthly competence", () => {
    const result = calcularInss(inputs({ salarioContribuicao: 2500, outrasRemuneracoes: 500 }));

    expect(result.baseInformada).toBe(3000);
    expect(result.inss).toBe(248.6);
    expect(result.slices.at(-1)).toMatchObject({ amount: 97.16, contribution: 11.66 });
  });

  it("uses the same table for employee, domestic employee, and avulso categories", () => {
    const categories: InssCategoriaSegurado[] = ["empregado", "domestico", "avulso"];

    for (const categoriaSegurado of categories) {
      const result = calcularInss(inputs({ categoriaSegurado, salarioContribuicao: 6000 }));

      expect(result.categoriaSegurado).toBe(categoriaSegurado);
      expect(result.inss).toBe(641.51);
    }
  });

  it("validates money fields, category, and supported table year", () => {
    expect(validateInssInputs(inputs({ salarioContribuicao: 0 }))).toContain("salarioContribuicaoObrigatorio");
    expect(validateInssInputs(inputs({ salarioContribuicao: -1 }))).toContain("salarioContribuicao");
    expect(validateInssInputs(inputs({ salarioContribuicao: 10_000_000.01 }))).toContain("salarioContribuicao");
    expect(validateInssInputs(inputs({ outrasRemuneracoes: -1 }))).toContain("outrasRemuneracoes");
    expect(
      validateInssInputs(inputs({ categoriaSegurado: "mei" as InssInputs["categoriaSegurado"] }))
    ).toContain("categoriaSegurado");
    expect(validateInssInputs(inputs({ tabelaAno: 2027 as 2026 }))).toContain("tabelaAno");
  });
});

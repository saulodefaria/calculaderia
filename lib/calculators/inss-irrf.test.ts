import { describe, expect, it } from "vitest";
import {
  INSS_IRRF_SOURCE_VERSION_2026_07_07,
  calcularInssIrrf,
  getDefaultInssIrrfInputs,
  validateInssIrrfInputs,
  type InssIrrfCategoriaSegurado,
  type InssIrrfInputs,
} from "./inss-irrf";

function inputs(overrides: Partial<InssIrrfInputs> = {}): InssIrrfInputs {
  return {
    ...getDefaultInssIrrfInputs(),
    ...overrides,
  };
}

describe("calcularInssIrrf", () => {
  it("calculates the default INSS and IRRF deduction estimate", () => {
    const result = calcularInssIrrf(getDefaultInssIrrfInputs());

    expect(result.baseTributavelInformada).toBe(3000);
    expect(result.baseInss).toBe(3000);
    expect(result.inss).toBe(248.6);
    expect(result.irrf).toBe(0);
    expect(result.totalInssIrrf).toBe(248.6);
    expect(result.saldoAposInssIrrf).toBe(2751.4);
    expect(result.aliquotaEfetivaLegal).toBe(0.0829);
    expect(result.sourceVersion).toBe(INSS_IRRF_SOURCE_VERSION_2026_07_07);
    expect(result.sourceVersion.accessedAt).toBe("2026-07-07");
    expect(result.warnings).toContain("tabelasInssIrrf2026");
    expect(result.warnings).toContain("fontesConsultadas");
  });

  it("uses the 2026 monthly reduction to zero IRRF at salary 5000", () => {
    const result = calcularInssIrrf(inputs({ rendimentosTributaveis: 5000 }));

    expect(result.inss).toBe(501.51);
    expect(result.baseIrrfPadrao).toBe(4498.49);
    expect(result.baseIrrfSimplificada).toBe(4392.8);
    expect(result.tipoBaseIrrfUsada).toBe("simplificada");
    expect(result.irrfAntesReducao).toBe(312.89);
    expect(result.reducaoIrrfMensal).toBe(312.89);
    expect(result.irrf).toBe(0);
    expect(result.totalInssIrrf).toBe(501.51);
  });

  it("calculates salary 6000 with INSS, IRRF reduction, and statutory remainder", () => {
    const result = calcularInssIrrf(inputs({ rendimentosTributaveis: 6000 }));

    expect(result.inss).toBe(641.51);
    expect(result.baseIrrfPadrao).toBe(5358.49);
    expect(result.baseIrrfSimplificada).toBe(5392.8);
    expect(result.tipoBaseIrrfUsada).toBe("padrao");
    expect(result.irrfAntesReducao).toBe(564.85);
    expect(result.reducaoIrrfMensal).toBe(179.75);
    expect(result.irrf).toBe(385.1);
    expect(result.totalInssIrrf).toBe(1026.61);
    expect(result.saldoAposInssIrrf).toBe(4973.39);
  });

  it("caps INSS above the 2026 ceiling and emits a ceiling warning", () => {
    const result = calcularInssIrrf(inputs({ rendimentosTributaveis: 9000 }));

    expect(result.baseInss).toBe(8475.55);
    expect(result.inss).toBe(988.09);
    expect(result.reducaoIrrfMensal).toBe(0);
    expect(result.irrf).toBe(1294.55);
    expect(result.warnings).toContain("tetoInssAplicado");
  });

  it("applies dependents and alimony to the standard IRRF base", () => {
    const withDependents = calcularInssIrrf(inputs({ dependentesIr: 2 }));
    const withAlimony = calcularInssIrrf(inputs({ rendimentosTributaveis: 6000, pensaoAlimenticia: 1000 }));

    expect(withDependents.deducaoDependentes).toBe(379.18);
    expect(withDependents.baseIrrfPadrao).toBe(2372.22);
    expect(withDependents.irrf).toBe(0);
    expect(withAlimony.baseIrrfPadrao).toBe(4358.49);
    expect(withAlimony.baseIrrfSimplificada).toBe(5392.8);
    expect(withAlimony.irrf).toBe(125.42);
  });

  it("can disable the Receita simplified monthly discount comparison", () => {
    const result = calcularInssIrrf(
      inputs({ rendimentosTributaveis: 5000, considerarDescontoSimplificado: false })
    );

    expect(result.baseIrrfPadrao).toBe(4498.49);
    expect(result.baseIrrfSimplificada).toBe(4392.8);
    expect(result.baseIrrfUsada).toBe(4498.49);
    expect(result.tipoBaseIrrfUsada).toBe("padrao");
    expect(result.irrfAntesReducao).toBe(336.67);
    expect(result.irrf).toBe(0);
    expect(result.warnings).toContain("descontoSimplificadoDesativado");
  });

  it("adds other taxable remuneration to the same monthly base", () => {
    const result = calcularInssIrrf(inputs({ rendimentosTributaveis: 2500, outrosRendimentosTributaveis: 500 }));

    expect(result.baseTributavelInformada).toBe(3000);
    expect(result.inss).toBe(248.6);
    expect(result.irrf).toBe(0);
  });

  it("uses the same table for employee, domestic employee, and avulso categories", () => {
    const categories: InssIrrfCategoriaSegurado[] = ["empregado", "domestico", "avulso"];

    for (const categoriaSegurado of categories) {
      const result = calcularInssIrrf(inputs({ categoriaSegurado, rendimentosTributaveis: 6000 }));

      expect(result.categoriaSegurado).toBe(categoriaSegurado);
      expect(result.inss).toBe(641.51);
      expect(result.irrf).toBe(385.1);
    }
  });

  it("warns but still calculates below the 2026 reference salary", () => {
    const result = calcularInssIrrf(inputs({ rendimentosTributaveis: 1500 }));

    expect(result.inss).toBe(112.5);
    expect(result.irrf).toBe(0);
    expect(result.warnings).toContain("salarioAbaixoReferencia");
  });

  it("validates money fields, dependents, category, boolean flag, and table year", () => {
    expect(validateInssIrrfInputs(inputs({ rendimentosTributaveis: 0 }))).toContain(
      "rendimentosTributaveisObrigatorio"
    );
    expect(validateInssIrrfInputs(inputs({ rendimentosTributaveis: -1 }))).toContain("rendimentosTributaveis");
    expect(validateInssIrrfInputs(inputs({ rendimentosTributaveis: 10_000_000.01 }))).toContain(
      "rendimentosTributaveis"
    );
    expect(validateInssIrrfInputs(inputs({ outrosRendimentosTributaveis: -1 }))).toContain(
      "outrosRendimentosTributaveis"
    );
    expect(validateInssIrrfInputs(inputs({ dependentesIr: 21 }))).toContain("dependentesIr");
    expect(validateInssIrrfInputs(inputs({ pensaoAlimenticia: -1 }))).toContain("pensaoAlimenticia");
    expect(validateInssIrrfInputs(inputs({ categoriaSegurado: "mei" as InssIrrfInputs["categoriaSegurado"] }))).toContain(
      "categoriaSegurado"
    );
    expect(
      validateInssIrrfInputs(
        inputs({ considerarDescontoSimplificado: "sim" as unknown as InssIrrfInputs["considerarDescontoSimplificado"] })
      )
    ).toContain("considerarDescontoSimplificado");
    expect(validateInssIrrfInputs(inputs({ tabelaAno: 2027 as 2026 }))).toContain("tabelaAno");
  });
});

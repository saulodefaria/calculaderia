import { describe, expect, it } from "vitest";
import {
  calcularSalarioPj,
  getDefaultSalarioPjInputs,
  validateSalarioPjInputs,
  type SalarioPjInputs,
} from "./salario-pj";

function inputs(overrides: Partial<SalarioPjInputs> = {}): SalarioPjInputs {
  return {
    ...getDefaultSalarioPjInputs(),
    ...overrides,
  };
}

describe("calcularSalarioPj", () => {
  it("calculates the default Anexo V factor-R example", () => {
    const result = calcularSalarioPj(getDefaultSalarioPjInputs());

    expect(result.receitaMensal).toBe(10_000);
    expect(result.fatorR).toBe(0.1621);
    expect(result.anexoAplicado).toBe("V");
    expect(result.aliquotaEfetivaSimples).toBe(0.155);
    expect(result.dasEstimado).toBe(1550);
    expect(result.inssPessoaFisica).toBe(324.2);
    expect(result.irrfProLabore).toBe(0);
    expect(result.custosTotais).toBe(2074.2);
    expect(result.liquidoDisponivel).toBe(7925.8);
    expect(result.sourceVersion.accessedAt).toBe("2026-07-03");
    expect(result.warnings).toContain("estimativaEducativa");
  });

  it("switches automatic factor R to Anexo III at or above 28%", () => {
    const result = calcularSalarioPj(inputs({ fs12: 36_000 }));

    expect(result.fatorR).toBe(0.3);
    expect(result.anexoAplicado).toBe("III");
    expect(result.aliquotaEfetivaSimples).toBe(0.06);
    expect(result.dasEstimado).toBe(600);
    expect(result.liquidoDisponivel).toBe(8875.8);

    const boundary = calcularSalarioPj(inputs({ fs12: 33_600 }));
    expect(boundary.fatorR).toBe(0.28);
    expect(boundary.anexoAplicado).toBe("III");
  });

  it("keeps automatic factor R in Anexo V when the raw ratio is just below 28%", () => {
    const result = calcularSalarioPj(inputs({ fs12: 33_595.2, rbt12: 120_000 }));

    expect(33_595.2 / 120_000).toBeCloseTo(0.27996, 8);
    expect(result.fatorR).toBe(0.28);
    expect(result.anexoAplicado).toBe("V");
    expect(result.aliquotaEfetivaSimples).toBe(0.155);
    expect(result.dasEstimado).toBe(1550);
  });

  it("uses the correct Anexo III bracket at RBT12 360000", () => {
    const result = calcularSalarioPj(
      inputs({
        receitaMensal: 30_000,
        rbt12: 360_000,
        anexoMode: "anexoIII",
      })
    );

    expect(result.anexoAplicado).toBe("III");
    expect(result.faixaSimples?.faixa).toBe(2);
    expect(result.aliquotaNominal).toBe(0.112);
    expect(result.parcelaDeduzir).toBe(9360);
    expect(result.aliquotaEfetivaSimples).toBe(0.086);
    expect(result.dasEstimado).toBe(2580);
  });

  it("uses the correct Anexo V bracket at RBT12 360000", () => {
    const result = calcularSalarioPj(
      inputs({
        receitaMensal: 30_000,
        rbt12: 360_000,
        anexoMode: "anexoV",
      })
    );

    expect(result.anexoAplicado).toBe("V");
    expect(result.faixaSimples?.faixa).toBe(2);
    expect(result.aliquotaNominal).toBe(0.18);
    expect(result.parcelaDeduzir).toBe(4500);
    expect(result.aliquotaEfetivaSimples).toBe(0.1675);
    expect(result.dasEstimado).toBe(5025);
  });

  it("uses a manual effective Simples rate with a warning", () => {
    const result = calcularSalarioPj(
      inputs({
        anexoMode: "aliquotaManual",
        aliquotaManualEfetiva: 0.12,
        rbt12: 0,
      })
    );

    expect(result.anexoAplicado).toBe("manual");
    expect(result.faixaSimples).toBeNull();
    expect(result.aliquotaEfetivaSimples).toBe(0.12);
    expect(result.dasEstimado).toBe(1200);
    expect(result.warnings).toContain("aliquotaManual");
  });

  it("calculates the INSS contributor assumption modes", () => {
    expect(calcularSalarioPj(inputs({ inssPessoaFisicaMode: "simplificado11Minimo" })).inssPessoaFisica).toBe(178.31);
    expect(calcularSalarioPj(inputs({ inssPessoaFisicaMode: "mei5Minimo" })).inssPessoaFisica).toBe(81.05);
    expect(calcularSalarioPj(inputs({ inssPessoaFisicaMode: "manual", inssManual: 250 })).inssPessoaFisica).toBe(
      250
    );
    expect(calcularSalarioPj(inputs({ inssPessoaFisicaMode: "none" })).inssPessoaFisica).toBe(0);
  });

  it("calculates IRRF on pro-labore when enabled and removes it when disabled", () => {
    const withIrrf = calcularSalarioPj(inputs({ proLaboreMensal: 6000, fs12: 72_000 }));
    const withoutIrrf = calcularSalarioPj(inputs({ proLaboreMensal: 6000, fs12: 72_000, calcularIrrfProLabore: false }));

    expect(withIrrf.inssPessoaFisica).toBe(1200);
    expect(withIrrf.baseIrrfProLabore).toBe(4800);
    expect(withIrrf.irrfProLabore).toBe(231.52);
    expect(withoutIrrf.irrfProLabore).toBe(0);
    expect(withoutIrrf.warnings).toContain("irrfDesativado");
  });

  it("warns for Simples limit scenarios while preserving estimate-only output", () => {
    const monthlyLimit = calcularSalarioPj(inputs({ receitaMensal: 500_000, fs12: 1_680_000, rbt12: 4_800_000 }));
    const rbtLimit = calcularSalarioPj(inputs({ anexoMode: "anexoIII", rbt12: 5_000_000 }));

    expect(monthlyLimit.warnings).toContain("receitaAcimaLimiteSimples");
    expect(rbtLimit.warnings).toContain("rbt12AcimaLimiteSimples");
    expect(rbtLimit.faixaSimples?.faixa).toBe(6);
  });

  it("validates invalid money, RBT12, dependents, and table year", () => {
    expect(validateSalarioPjInputs(inputs({ receitaMensal: 0 }))).toContain("receitaMensalObrigatoria");
    expect(validateSalarioPjInputs(inputs({ rbt12: 0 }))).toContain("rbt12Obrigatorio");
    expect(validateSalarioPjInputs(inputs({ fs12: -1 }))).toContain("fs12");
    expect(validateSalarioPjInputs(inputs({ aliquotaManualEfetiva: 1.01 }))).toContain("aliquotaManualEfetiva");
    expect(validateSalarioPjInputs(inputs({ dependentesIr: 21 }))).toContain("dependentesIr");
    expect(validateSalarioPjInputs({ ...inputs(), tabelaAno: 2025 as 2026 })).toContain("tabelaAno");
  });
});

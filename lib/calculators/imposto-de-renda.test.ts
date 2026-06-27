import { describe, expect, it } from "vitest";
import {
  calcularImpostoDeRenda,
  getDefaultImpostoDeRendaInputs,
  validateImpostoDeRendaInputs,
  type ImpostoDeRendaInputs,
} from "./imposto-de-renda";

function inputs(overrides: Partial<ImpostoDeRendaInputs> = {}): ImpostoDeRendaInputs {
  return {
    ...getDefaultImpostoDeRendaInputs(),
    ...overrides,
  };
}

describe("calcularImpostoDeRenda", () => {
  it("returns a valid zero-income estimate without negative tax", () => {
    const result = calcularImpostoDeRenda(getDefaultImpostoDeRendaInputs());

    expect(result.anoCalendario).toBe(2025);
    expect(result.exercicio).toBe(2026);
    expect(result.sourceVersion).toBe("2026-06-26");
    expect(result.impostoDevido).toBe(0);
    expect(result.saldo).toBe(0);
    expect(result.metodoUsado).toBe("simplificado");
    expect(result.warnings).toContain("estimativaEducativa");
    expect(result.warnings).toContain("urlSensivel");
  });

  it("uses the documented 2025 annual table boundaries with legal deductions mode", () => {
    const exempt = calcularImpostoDeRenda(
      inputs({ rendimentosTributaveis: 28_467.2, modoDeducao: "legais" })
    );
    const secondBracket = calcularImpostoDeRenda(
      inputs({ rendimentosTributaveis: 33_919.8, modoDeducao: "legais" })
    );
    const topBracket = calcularImpostoDeRenda(inputs({ rendimentosTributaveis: 60_000, modoDeducao: "legais" }));

    expect(exempt.aliquotaFaixa).toBe(0);
    expect(exempt.impostoAntesReducao).toBe(0);
    expect(secondBracket.aliquotaFaixa).toBe(0.075);
    expect(secondBracket.parcelaDeduzir).toBe(2_135.04);
    expect(secondBracket.impostoAntesReducao).toBe(408.95);
    expect(topBracket.aliquotaFaixa).toBe(0.275);
    expect(topBracket.parcelaDeduzir).toBe(10_853.78);
    expect(topBracket.impostoAntesReducao).toBe(5_646.22);
  });

  it("uses the documented 2026 annual table boundaries with legal deductions mode", () => {
    const exempt = calcularImpostoDeRenda(
      inputs({ anoCalendario: 2026, rendimentosTributaveis: 29_145.6, modoDeducao: "legais" })
    );
    const secondBracket = calcularImpostoDeRenda(
      inputs({ anoCalendario: 2026, rendimentosTributaveis: 33_919.8, modoDeducao: "legais" })
    );
    const topBracket = calcularImpostoDeRenda(
      inputs({ anoCalendario: 2026, rendimentosTributaveis: 60_000, modoDeducao: "legais" })
    );

    expect(exempt.aliquotaFaixa).toBe(0);
    expect(exempt.impostoAntesReducao).toBe(0);
    expect(secondBracket.aliquotaFaixa).toBe(0.075);
    expect(secondBracket.parcelaDeduzir).toBe(2_185.92);
    expect(secondBracket.impostoAntesReducao).toBe(358.07);
    expect(topBracket.aliquotaFaixa).toBe(0.275);
    expect(topBracket.parcelaDeduzir).toBe(10_904.66);
    expect(topBracket.impostoAntesReducao).toBe(5_595.34);
    expect(topBracket.reducaoAnual).toBe(2_694.15);
    expect(topBracket.impostoDevido).toBe(2_901.19);
  });

  it("caps simplified discount for 2025 and 2026", () => {
    const result2025 = calcularImpostoDeRenda(inputs({ rendimentosTributaveis: 200_000 }));
    const result2026 = calcularImpostoDeRenda(inputs({ anoCalendario: 2026, rendimentosTributaveis: 200_000 }));

    expect(result2025.descontoSimplificado).toBe(16_754.34);
    expect(result2025.baseSimplificada).toBe(183_245.66);
    expect(result2026.descontoSimplificado).toBe(17_640);
    expect(result2026.baseSimplificada).toBe(182_360);
  });

  it("applies dependent, education, and complementary pension caps", () => {
    const result = calcularImpostoDeRenda(
      inputs({
        rendimentosTributaveis: 100_000,
        dependentes: 2,
        despesasInstrucao: 10_000,
        pessoasInstrucao: 1,
        previdenciaComplementar: 20_000,
        modoDeducao: "legais",
      })
    );

    expect(result.deducaoDependentes).toBe(4_550.16);
    expect(result.despesasInstrucaoDedutivel).toBe(3_561.5);
    expect(result.despesasInstrucaoExcedente).toBe(6_438.5);
    expect(result.previdenciaComplementarDedutivel).toBe(12_000);
    expect(result.previdenciaComplementarExcedente).toBe(8_000);
    expect(result.totalDeducoesLegais).toBe(20_111.66);
    expect(result.warnings).toContain("deducoesNaoValidadas");
  });

  it("chooses the lower final tax automatically and prefers simplified on ties", () => {
    const zero = calcularImpostoDeRenda(inputs({ rendimentosTributaveis: 0, modoDeducao: "auto" }));
    const taxable = calcularImpostoDeRenda(inputs({ rendimentosTributaveis: 60_000, modoDeducao: "auto" }));

    expect(zero.metodoUsado).toBe("simplificado");
    expect(taxable.metodoUsado).toBe("simplificado");
    expect(taxable.impostoDevido).toBe(2_745.03);
    expect(taxable.comparacao.legais.impostoDevido).toBe(5_646.22);
  });

  it("applies 2026 annual reduction tiers by taxable income", () => {
    const belowCap = calcularImpostoDeRenda(
      inputs({ anoCalendario: 2026, rendimentosTributaveis: 60_000, modoDeducao: "simplificado" })
    );
    const midTier = calcularImpostoDeRenda(
      inputs({ anoCalendario: 2026, rendimentosTributaveis: 70_000, modoDeducao: "simplificado" })
    );
    const aboveTier = calcularImpostoDeRenda(
      inputs({ anoCalendario: 2026, rendimentosTributaveis: 90_000, modoDeducao: "simplificado" })
    );

    expect(belowCap.impostoAntesReducao).toBe(2_694.15);
    expect(belowCap.reducaoAnual).toBe(2_694.15);
    expect(belowCap.impostoDevido).toBe(0);
    expect(midTier.reducaoAnual).toBe(1_739.48);
    expect(midTier.impostoDevido).toBe(2_755.86);
    expect(aboveTier.reducaoAnual).toBe(0);
  });

  it("uses rounded taxable income for the 2026 annual reduction tier", () => {
    const result = calcularImpostoDeRenda(
      inputs({ anoCalendario: 2026, rendimentosTributaveis: 60_000.004, modoDeducao: "legais" })
    );

    expect(result.baseUsada).toBe(60_000);
    expect(result.impostoAntesReducao).toBe(5_595.34);
    expect(result.reducaoAnual).toBe(2_694.15);
    expect(result.impostoDevido).toBe(2_901.19);
  });

  it("returns refund or payable balance after paid tax offsets", () => {
    const refund = calcularImpostoDeRenda(
      inputs({ rendimentosTributaveis: 60_000, impostoRetidoFonte: 3_000, modoDeducao: "simplificado" })
    );
    const payable = calcularImpostoDeRenda(
      inputs({ rendimentosTributaveis: 60_000, impostoRetidoFonte: 1_000, modoDeducao: "simplificado" })
    );

    expect(refund.impostoDevido).toBe(2_745.03);
    expect(refund.totalImpostoPago).toBe(3_000);
    expect(refund.saldo).toBe(-254.97);
    expect(payable.saldo).toBe(1_745.03);
  });

  it("keeps exempt and exclusive income informational only", () => {
    const withContext = calcularImpostoDeRenda(
      inputs({
        rendimentosTributaveis: 60_000,
        rendimentosIsentos: 50_000,
        rendimentosExclusivos: 40_000,
        modoDeducao: "simplificado",
      })
    );
    const withoutContext = calcularImpostoDeRenda(
      inputs({ rendimentosTributaveis: 60_000, modoDeducao: "simplificado" })
    );

    expect(withContext.impostoDevido).toBe(withoutContext.impostoDevido);
    expect(withContext.warnings).toContain("rendimentosInformativos");
  });

  it("validates supported years, modes, money fields, and counts", () => {
    expect(validateImpostoDeRendaInputs(inputs({ anoCalendario: 2027 as 2026 }))).toContain("anoCalendario");
    expect(validateImpostoDeRendaInputs(inputs({ modoDeducao: "manual" as "auto" }))).toContain("modoDeducao");
    expect(validateImpostoDeRendaInputs(inputs({ rendimentosTributaveis: -1 }))).toContain(
      "rendimentosTributaveis"
    );
    expect(validateImpostoDeRendaInputs(inputs({ despesasMedicas: Number.POSITIVE_INFINITY }))).toContain(
      "despesasMedicas"
    );
    expect(validateImpostoDeRendaInputs(inputs({ dependentes: 31 }))).toContain("dependentes");
    expect(validateImpostoDeRendaInputs(inputs({ pessoasInstrucao: 1.5 }))).toContain("pessoasInstrucao");
  });

  it("throws a range error for invalid calculations", () => {
    expect(() => calcularImpostoDeRenda(inputs({ rendimentosTributaveis: -1 }))).toThrow(RangeError);
  });
});

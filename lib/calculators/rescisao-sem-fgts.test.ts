import { describe, expect, it } from "vitest";
import {
  RESCISAO_SEM_FGTS_SOURCE_VERSION,
  calcularRescisaoSemFgts,
  getDefaultRescisaoSemFgtsInputs,
  mapRescisaoSemFgtsToCoreInputs,
  validateRescisaoSemFgtsInputs,
  type InputsRescisaoSemFgts,
} from "./rescisao-sem-fgts";

const baseInputs: InputsRescisaoSemFgts = {
  salarioMensal: 3000,
  mediaVariavelMensal: 0,
  dataAdmissao: "2025-01-01",
  dataDesligamento: "2026-03-10",
  cenarioSemFgts: "pedidoDemissao",
  avisoPrevioPedido: "trabalhado",
  diasTrabalhadosMes: 10,
  feriasVencidasPeriodos: 0,
  dependentesIr: 0,
  adiantamentoDecimoTerceiro: 0,
  adiantamentoFerias: 0,
  outrosCreditos: 0,
  outrosDescontos: 0,
  calcularDescontosLegais: false,
  sourceVersion: RESCISAO_SEM_FGTS_SOURCE_VERSION,
};

describe("calcularRescisaoSemFgts", () => {
  it("reuses the core resignation formula with worked notice and zero FGTS fine or withdrawal", () => {
    const result = calcularRescisaoSemFgts(baseInputs);

    expect(result.saldoSalario).toBe(1000);
    expect(result.avisoCredito).toBe(0);
    expect(result.avisoDesconto).toBe(0);
    expect(result.decimoTerceiroBruto).toBe(500);
    expect(result.feriasProporcionaisBrutas).toBeCloseTo(666.67, 2);
    expect(result.baseMultaFgts).toBe(0);
    expect(result.multaFgts).toBe(0);
    expect(result.saqueFgts).toBe(0);
    expect(result.warnings).not.toContain("saldoFgtsAusente");
    expect(result.warnings).not.toContain("fgtsEstimado");
  });

  it("surfaces a resignation notice discount without flooring a negative estimate", () => {
    const result = calcularRescisaoSemFgts({
      ...baseInputs,
      avisoPrevioPedido: "descontado",
    });

    expect(result.avisoDesconto).toBe(3000);
    expect(result.totalLiquido).toBeCloseTo(-833.33, 2);
    expect(result.direitosIncluidos).toContain("avisoPrevioDesconto");
    expect(result.multaFgts).toBe(0);
    expect(result.saqueFgts).toBe(0);
  });

  it("limits with-cause dismissal to salary balance and overdue vacation in the inherited core contract", () => {
    const result = calcularRescisaoSemFgts({
      ...baseInputs,
      cenarioSemFgts: "justaCausa",
      diasTrabalhadosMes: 15,
      feriasVencidasPeriodos: 1,
    });

    expect(result.saldoSalario).toBe(1500);
    expect(result.avisoCredito).toBe(0);
    expect(result.avisoDesconto).toBe(0);
    expect(result.decimoTerceiroBruto).toBe(0);
    expect(result.feriasProporcionaisBrutas).toBe(0);
    expect(result.feriasVencidas).toBe(4000);
    expect(result.totalBruto).toBe(5500);
    expect(result.multaFgts).toBe(0);
    expect(result.saqueFgts).toBe(0);
  });

  it("includes variable remuneration in the mapped core base", () => {
    const result = calcularRescisaoSemFgts({
      ...baseInputs,
      salarioMensal: 3000,
      mediaVariavelMensal: 600,
      diasTrabalhadosMes: 15,
    });

    expect(result.remuneracaoBase).toBe(3600);
    expect(result.saldoSalario).toBe(1800);
  });

  it("keeps legal deductions wired through the shared severance core", () => {
    const result = calcularRescisaoSemFgts({
      ...baseInputs,
      salarioMensal: 6000,
      diasTrabalhadosMes: 30,
      calcularDescontosLegais: true,
    });

    expect(result.descontosLegais.totalInss).toBeGreaterThan(0);
    expect(result.warnings).toContain("tabelasLegais2026");
  });
});

describe("mapRescisaoSemFgtsToCoreInputs", () => {
  it("forces internal FGTS balance settings and coerces with-cause notice to not applicable", () => {
    const coreInputs = mapRescisaoSemFgtsToCoreInputs({
      ...baseInputs,
      cenarioSemFgts: "justaCausa",
      avisoPrevioPedido: "descontado",
    });

    expect(coreInputs.motivo).toBe("justaCausa");
    expect(coreInputs.avisoPrevio).toBe("naoSeAplica");
    expect(coreInputs.saldoFgts).toBe(0);
    expect(coreInputs.saldoFgtsIncluiVerbasRescisorias).toBe(true);
  });
});

describe("validateRescisaoSemFgtsInputs", () => {
  it("rejects forbidden full-severance motives and invalid source versions", () => {
    expect(
      validateRescisaoSemFgtsInputs({
        ...baseInputs,
        cenarioSemFgts: "semJustaCausa" as InputsRescisaoSemFgts["cenarioSemFgts"],
      })
    ).toContain("cenarioSemFgts");

    expect(
      validateRescisaoSemFgtsInputs({
        ...baseInputs,
        sourceVersion: "2026-01-01" as typeof RESCISAO_SEM_FGTS_SOURCE_VERSION,
      })
    ).toContain("sourceVersion");
  });

  it("pins no-FGTS defaults to resignation and the 2026-07-04 source contract", () => {
    const defaults = getDefaultRescisaoSemFgtsInputs(new Date(2026, 6, 4));

    expect(defaults.cenarioSemFgts).toBe("pedidoDemissao");
    expect(defaults.avisoPrevioPedido).toBe("trabalhado");
    expect(defaults.diasTrabalhadosMes).toBe(4);
    expect(defaults.sourceVersion).toBe("2026-07-04");
  });
});

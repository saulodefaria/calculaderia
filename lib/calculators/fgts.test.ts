import { describe, expect, it } from "vitest";
import {
  FGTS_SUPPORTED_SOURCE_VERSION,
  calcularFgts,
  getDefaultFgtsInputs,
  validateFgtsInputs,
  type FgtsInputs,
} from "./fgts";

function inputs(overrides: Partial<FgtsInputs> = {}): FgtsInputs {
  return {
    ...getDefaultFgtsInputs(),
    ...overrides,
  };
}

describe("calcularFgts", () => {
  it("calculates the default 8% monthly FGTS estimate", () => {
    const result = calcularFgts(getDefaultFgtsInputs());

    expect(result.aliquotaDeposito).toBe(0.08);
    expect(result.depositoMensal).toBe(240);
    expect(result.depositosMensaisPeriodo).toBe(2880);
    expect(result.depositoDecimoTerceiro).toBe(240);
    expect(result.totalDepositosEstimados).toBe(3120);
    expect(result.baseMultaFgts).toBe(3120);
    expect(result.multaFgts).toBe(0);
    expect(result.sourceVersion.id).toBe(FGTS_SUPPORTED_SOURCE_VERSION);
    expect(result.warnings).toContain("domesticoForaDoEscopo");
    expect(result.warnings).toContain("semCorrecaoJurosLucro");
    expect(result.warnings).toContain("fontesOficiaisPrevalecem");
  });

  it("calculates a 40% no-cause fine and withdrawal from estimated deposits without balance", () => {
    const result = calcularFgts(inputs({ motivoRescisao: "semJustaCausa" }));

    expect(result.baseMultaFgts).toBe(3120);
    expect(result.aliquotaMulta).toBe(0.4);
    expect(result.multaFgts).toBe(1248);
    expect(result.percentualSaqueExibido).toBe(1);
    expect(result.saqueFgtsExibido).toBe(3120);
    expect(result.warnings).toContain("saldoAusente");
    expect(result.warnings).toContain("baseEstimadaSemCorrecao");
  });

  it("uses an official balance as the fine base when it already includes estimated deposits", () => {
    const result = calcularFgts(
      inputs({
        saldoFgtsInformado: 10000,
        saldoIncluiDepositosEstimados: true,
        motivoRescisao: "acordo484A",
      })
    );

    expect(result.baseMultaFgts).toBe(10000);
    expect(result.aliquotaMulta).toBe(0.2);
    expect(result.multaFgts).toBe(2000);
    expect(result.percentualSaqueExibido).toBe(0.8);
    expect(result.saqueFgtsExibido).toBe(8000);
    expect(result.warnings).not.toContain("saldoAusente");
    expect(result.warnings).not.toContain("baseEstimadaSemCorrecao");
  });

  it("adds estimated deposits to an official balance when the balance does not include them", () => {
    const result = calcularFgts(
      inputs({
        saldoFgtsInformado: 10000,
        saldoIncluiDepositosEstimados: false,
        motivoRescisao: "semJustaCausa",
      })
    );

    expect(result.baseMultaFgts).toBe(13120);
    expect(result.multaFgts).toBe(5248);
    expect(result.saqueFgtsExibido).toBe(13120);
  });

  it("keeps resignation and with-cause scenarios without fine or withdrawal display", () => {
    const resignation = calcularFgts(inputs({ motivoRescisao: "pedidoDemissao" }));
    const withCause = calcularFgts(inputs({ motivoRescisao: "justaCausa" }));

    expect(resignation.aliquotaMulta).toBe(0);
    expect(resignation.multaFgts).toBe(0);
    expect(resignation.saqueFgtsExibido).toBe(0);
    expect(withCause.aliquotaMulta).toBe(0);
    expect(withCause.multaFgts).toBe(0);
    expect(withCause.saqueFgtsExibido).toBe(0);
  });

  it("uses 40% for recognized indirect termination and adds recognition warning", () => {
    const result = calcularFgts(inputs({ motivoRescisao: "rescisaoIndiretaReconhecida" }));

    expect(result.aliquotaMulta).toBe(0.4);
    expect(result.multaFgts).toBe(1248);
    expect(result.saqueFgtsExibido).toBe(3120);
    expect(result.warnings).toContain("rescisaoIndiretaReconhecimento");
  });

  it("uses 20% for culpa reciproca or forca maior and hides withdrawal display", () => {
    const result = calcularFgts(inputs({ motivoRescisao: "culpaReciprocaForcaMaior" }));

    expect(result.aliquotaMulta).toBe(0.2);
    expect(result.multaFgts).toBe(624);
    expect(result.percentualSaqueExibido).toBe(0);
    expect(result.saqueFgtsExibido).toBe(0);
    expect(result.warnings).toContain("culpaReciprocaForcaMaiorReconhecimento");
  });

  it("uses the 2% apprentice deposit rate and warns when fine scenarios are selected", () => {
    const result = calcularFgts(
      inputs({
        baseMensalFgts: 1500,
        meses: 6,
        tipoDeposito: "aprendiz2",
        baseDecimoTerceiro: 0,
        motivoRescisao: "semJustaCausa",
      })
    );

    expect(result.aliquotaDeposito).toBe(0.02);
    expect(result.depositoMensal).toBe(30);
    expect(result.depositosMensaisPeriodo).toBe(180);
    expect(result.depositoDecimoTerceiro).toBe(0);
    expect(result.totalDepositosEstimados).toBe(180);
    expect(result.warnings).toContain("aprendizRevisaoRescisao");
  });

  it("supports zero months while keeping monthly and extra bases visible", () => {
    const result = calcularFgts(inputs({ meses: 0, baseDecimoTerceiro: 3000, baseVerbasRescisoriasFgts: 1000 }));

    expect(result.depositoMensal).toBe(240);
    expect(result.depositosMensaisPeriodo).toBe(0);
    expect(result.depositoDecimoTerceiro).toBe(240);
    expect(result.depositoVerbasRescisorias).toBe(80);
    expect(result.totalDepositosEstimados).toBe(320);
  });

  it("rounds BRL values to cents deterministically", () => {
    const result = calcularFgts(inputs({ baseMensalFgts: 1234.56, meses: 1, baseDecimoTerceiro: 0 }));

    expect(result.depositoMensal).toBe(98.76);
    expect(result.depositosMensaisPeriodo).toBe(98.76);
  });

  it("validates money, month, enum, boolean, and source-version inputs", () => {
    expect(validateFgtsInputs(inputs({ baseMensalFgts: 0 }))).toContain("baseMensalFgtsObrigatoria");
    expect(validateFgtsInputs(inputs({ baseMensalFgts: -1 }))).toContain("baseMensalFgts");
    expect(validateFgtsInputs(inputs({ meses: 601 }))).toContain("meses");
    expect(validateFgtsInputs(inputs({ tipoDeposito: "outro" as FgtsInputs["tipoDeposito"] }))).toContain(
      "tipoDeposito"
    );
    expect(
      validateFgtsInputs(inputs({ motivoRescisao: "outro" as FgtsInputs["motivoRescisao"] }))
    ).toContain("motivoRescisao");
    expect(validateFgtsInputs(inputs({ saldoFgtsInformado: -1 }))).toContain("saldoFgtsInformado");
    expect(
      validateFgtsInputs(inputs({ saldoIncluiDepositosEstimados: "1" as unknown as boolean }))
    ).toContain("saldoIncluiDepositosEstimados");
    expect(validateFgtsInputs(inputs({ sourceVersion: "2027-01-01" as typeof FGTS_SUPPORTED_SOURCE_VERSION }))).toContain(
      "sourceVersion"
    );
  });
});

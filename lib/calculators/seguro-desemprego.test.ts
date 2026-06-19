import { describe, expect, it } from "vitest";
import {
  SEGURO_DESEMPREGO_TABLE_2026,
  calcularSeguroDesemprego,
  calcularSeguroDesempregoParcelas,
  calcularSeguroDesempregoRequestWindow,
  calcularSeguroDesempregoSalarioMedio,
  calcularSeguroDesempregoValorParcela,
  getDefaultSeguroDesempregoInputs,
  type SeguroDesempregoInputs,
  type SeguroDesempregoMotivoDispensa,
} from "./seguro-desemprego";

const baseInputs: SeguroDesempregoInputs = {
  salarioUltimo: 3000,
  salarioPenultimo: 3000,
  salarioAntepenultimo: 3000,
  numeroSolicitacao: "primeira",
  mesesComSalarioElegibilidade: 12,
  mesesTrabalhados36: 12,
  motivoDispensa: "semJustaCausa",
  dataDispensa: "2026-06-01",
  dataRequerimento: "2026-06-08",
  desempregadoNoRequerimento: true,
  semRendaPropriaSuficiente: true,
  semBeneficioContinuadoIncompativel: true,
  tabelaAno: 2026,
};

describe("2026 seguro-desemprego table", () => {
  it("pins MTE 2026 constants from the plan", () => {
    expect(SEGURO_DESEMPREGO_TABLE_2026.effectiveFrom).toBe("2026-01-11");
    expect(SEGURO_DESEMPREGO_TABLE_2026.minimumBenefit).toBe(1621);
    expect(SEGURO_DESEMPREGO_TABLE_2026.firstBandLimit).toBe(2222.17);
    expect(SEGURO_DESEMPREGO_TABLE_2026.secondBandLimit).toBe(3703.99);
    expect(SEGURO_DESEMPREGO_TABLE_2026.secondBandAddend).toBe(1777.74);
    expect(SEGURO_DESEMPREGO_TABLE_2026.benefitCeiling).toBe(2518.65);
  });

  it("calculates all salary bands, floor, rounding, and ceiling", () => {
    expect(calcularSeguroDesempregoValorParcela(1900)).toMatchObject({
      salaryBand: "primeiraFaixa",
      parcelaBruta: 1520,
      valorParcela: 1621,
    });
    expect(calcularSeguroDesempregoValorParcela(2222.17).valorParcela).toBe(1777.74);
    expect(calcularSeguroDesempregoValorParcela(3000)).toMatchObject({
      salaryBand: "segundaFaixa",
      valorParcela: 2166.66,
    });
    expect(calcularSeguroDesempregoValorParcela(3703.99).valorParcela).toBe(2518.65);
    expect(calcularSeguroDesempregoValorParcela(3704).valorParcela).toBe(2518.65);
    expect(calcularSeguroDesempregoValorParcela(10000).valorParcela).toBe(2518.65);
  });

  it("averages one, two, or three positive salaries", () => {
    expect(
      calcularSeguroDesempregoSalarioMedio({
        ...baseInputs,
        salarioUltimo: 2500,
        salarioPenultimo: 0,
        salarioAntepenultimo: 0,
      })
    ).toBe(2500);
    expect(
      calcularSeguroDesempregoSalarioMedio({
        ...baseInputs,
        salarioUltimo: 2500,
        salarioPenultimo: 3000,
        salarioAntepenultimo: 0,
      })
    ).toBe(2750);
    expect(
      calcularSeguroDesempregoSalarioMedio({
        ...baseInputs,
        salarioUltimo: 2500,
        salarioPenultimo: 3000,
        salarioAntepenultimo: 3500,
      })
    ).toBe(3000);
  });
});

describe("parcel and eligibility rules", () => {
  it("calculates first-request parcel thresholds", () => {
    expect(calcularSeguroDesemprego({ ...baseInputs, mesesComSalarioElegibilidade: 11 }).status).toBe(
      "notEligibleByInputs"
    );
    expect(calcularSeguroDesempregoParcelas("primeira", 11).quantidadeParcelas).toBe(0);
    expect(calcularSeguroDesempregoParcelas("primeira", 12).quantidadeParcelas).toBe(4);
    expect(calcularSeguroDesempregoParcelas("primeira", 23).quantidadeParcelas).toBe(4);
    expect(calcularSeguroDesempregoParcelas("primeira", 24).quantidadeParcelas).toBe(5);
  });

  it("calculates second-request parcel thresholds", () => {
    const second = { ...baseInputs, numeroSolicitacao: "segunda" as const, mesesComSalarioElegibilidade: 8 };
    expect(calcularSeguroDesemprego(second).status).toBe("notEligibleByInputs");
    expect(calcularSeguroDesempregoParcelas("segunda", 8).quantidadeParcelas).toBe(0);
    expect(calcularSeguroDesempregoParcelas("segunda", 9).quantidadeParcelas).toBe(3);
    expect(calcularSeguroDesempregoParcelas("segunda", 12).quantidadeParcelas).toBe(4);
    expect(calcularSeguroDesempregoParcelas("segunda", 24).quantidadeParcelas).toBe(5);
  });

  it("calculates third-or-later parcel thresholds", () => {
    const third = {
      ...baseInputs,
      numeroSolicitacao: "terceiraOuMais" as const,
      mesesComSalarioElegibilidade: 5,
    };
    expect(calcularSeguroDesemprego(third).status).toBe("notEligibleByInputs");
    expect(calcularSeguroDesempregoParcelas("terceiraOuMais", 5).quantidadeParcelas).toBe(0);
    expect(calcularSeguroDesempregoParcelas("terceiraOuMais", 6).quantidadeParcelas).toBe(3);
    expect(calcularSeguroDesempregoParcelas("terceiraOuMais", 12).quantidadeParcelas).toBe(4);
    expect(calcularSeguroDesempregoParcelas("terceiraOuMais", 24).quantidadeParcelas).toBe(5);
  });

  it("returns an eligible estimate for a complete first-request case", () => {
    const result = calcularSeguroDesemprego(baseInputs);

    expect(result.status).toBe("eligibleEstimate");
    expect(result.valorParcela).toBe(2166.66);
    expect(result.quantidadeParcelas).toBe(4);
    expect(result.totalEstimado).toBe(8666.64);
    expect(result.totalFormulaReferencia).toBe(8666.64);
    expect(result.warnings).toContain("officialRecords");
  });

  it.each<SeguroDesempregoMotivoDispensa>(["pedidoDemissao", "justaCausa", "acordo", "pdv", "outro"])(
    "marks %s as not eligible by inputs",
    (motivoDispensa) => {
      const result = calcularSeguroDesemprego({ ...baseInputs, motivoDispensa });

      expect(result.status).toBe("notEligibleByInputs");
      expect(result.ineligibilityReasons).toContain("dismissalReasonNotEligible");
      expect(result.totalEstimado).toBe(0);
      expect(result.totalFormulaReferencia).toBe(8666.64);
    }
  );

  it("treats indirect termination as official review with a formula estimate visible", () => {
    const result = calcularSeguroDesemprego({ ...baseInputs, motivoDispensa: "rescisaoIndireta" });

    expect(result.status).toBe("needsOfficialReview");
    expect(result.ineligibilityReasons).toContain("rescisaoIndiretaRecognition");
    expect(result.warnings).toContain("rescisaoIndiretaRecognition");
    expect(result.totalEstimado).toBe(0);
    expect(result.totalFormulaReferencia).toBe(8666.64);
  });

  it("fails declaration flags explicitly", () => {
    expect(calcularSeguroDesemprego({ ...baseInputs, desempregadoNoRequerimento: false }).ineligibilityReasons).toContain(
      "notUnemployed"
    );
    expect(
      calcularSeguroDesemprego({ ...baseInputs, semRendaPropriaSuficiente: false }).ineligibilityReasons
    ).toContain("hasSufficientIncome");
    expect(
      calcularSeguroDesemprego({ ...baseInputs, semBeneficioContinuadoIncompativel: false }).ineligibilityReasons
    ).toContain("hasIncompatibleBenefit");
  });
});

describe("request window and validation", () => {
  it("evaluates request-window boundaries from day 7 through day 120", () => {
    expect(calcularSeguroDesempregoRequestWindow("2026-06-01", "2026-06-07").status).toBe("beforeWindow");
    expect(calcularSeguroDesempregoRequestWindow("2026-06-01", "2026-06-08").status).toBe("inWindow");
    expect(calcularSeguroDesempregoRequestWindow("2026-06-01", "2026-09-29").status).toBe("inWindow");
    expect(calcularSeguroDesempregoRequestWindow("2026-06-01", "2026-09-30").status).toBe("afterWindow");
  });

  it("keeps missing dates as needs official review", () => {
    const result = calcularSeguroDesemprego({ ...baseInputs, dataDispensa: "", dataRequerimento: "" });

    expect(result.status).toBe("needsOfficialReview");
    expect(result.ineligibilityReasons).toContain("missingDate");
    expect(result.warnings).toContain("missingDate");
  });

  it("throws on invalid ranges, unknown table year, and impossible dates", () => {
    expect(() => calcularSeguroDesemprego({ ...baseInputs, salarioUltimo: -1 })).toThrow(RangeError);
    expect(() =>
      calcularSeguroDesemprego({
        ...baseInputs,
        salarioUltimo: 0,
        salarioPenultimo: 0,
        salarioAntepenultimo: 0,
      })
    ).toThrow(RangeError);
    expect(() => calcularSeguroDesemprego({ ...baseInputs, mesesTrabalhados36: 37 })).toThrow(RangeError);
    expect(() => calcularSeguroDesemprego({ ...baseInputs, dataDispensa: "2026-02-31" })).toThrow(RangeError);
    expect(() => calcularSeguroDesemprego({ ...baseInputs, dataRequerimento: "2026-05-31" })).toThrow(RangeError);
    expect(() => calcularSeguroDesemprego({ ...baseInputs, tabelaAno: 2027 as 2026 })).toThrow(RangeError);
  });

  it("keeps deterministic defaults when a date is injected", () => {
    const defaults = getDefaultSeguroDesempregoInputs(new Date(2026, 5, 19));

    expect(defaults.salarioUltimo).toBe(3000);
    expect(defaults.dataDispensa).toBe("");
    expect(defaults.dataRequerimento).toBe("2026-06-19");
    expect(defaults.tabelaAno).toBe(2026);
  });
});

import { describe, expect, it } from "vitest";
import {
  calcularInvestimento,
  futureValueInvestimento,
  getDefaultInvestimentoInputs,
  getTaxaMensalDecimal,
  validateInvestimentoInputs,
  type InvestimentoInputs,
} from "./investimento";

function inputs(overrides: Partial<InvestimentoInputs> = {}): InvestimentoInputs {
  return {
    ...getDefaultInvestimentoInputs(),
    ...overrides,
  };
}

describe("calcularInvestimento", () => {
  it("projects a future value with annual effective rate and end-of-month contributions", () => {
    const result = calcularInvestimento(
      inputs({
        valorInicial: 1000,
        aporteMensal: 500,
        prazoMeses: 120,
        taxa: 8,
        taxaPeriodo: "anualEfetiva",
        aporteTiming: "fim",
      })
    );

    expect(result.valorFinalNominal).toBeCloseTo(92221.06, 2);
    expect(result.totalAportado).toBe(61000);
    expect(result.totalJurosEstimados).toBeCloseTo(31221.06, 2);
    expect(result.projectionSeries).toHaveLength(120);
    expect(result.taxaAnualEquivalente).toBeCloseTo(8, 2);
  });

  it("matches Microsoft FV-style beginning-of-period fixture after sign normalization", () => {
    const result = calcularInvestimento(
      inputs({
        valorInicial: 500,
        aporteMensal: 200,
        prazoMeses: 10,
        taxa: 0.5,
        taxaPeriodo: "mensal",
        aporteTiming: "inicio",
      })
    );

    expect(result.valorFinalNominal).toBeCloseTo(2581.4, 2);
  });

  it("matches Microsoft FV-style end-of-period fixture after sign normalization", () => {
    const result = calcularInvestimento(
      inputs({
        valorInicial: 0,
        aporteMensal: 1000,
        prazoMeses: 12,
        taxa: 1,
        taxaPeriodo: "mensal",
        aporteTiming: "fim",
      })
    );

    expect(result.valorFinalNominal).toBeCloseTo(12682.5, 2);
  });

  it("handles zero and negative rates with finite outputs", () => {
    const zeroRate = calcularInvestimento(inputs({ valorInicial: 1000, aporteMensal: 100, prazoMeses: 3, taxa: 0 }));
    const negativeRate = calcularInvestimento(
      inputs({
        valorInicial: 1000,
        aporteMensal: 100,
        prazoMeses: 3,
        taxa: -1,
        taxaPeriodo: "mensal",
      })
    );

    expect(zeroRate.valorFinalNominal).toBe(1300);
    expect(negativeRate.valorFinalNominal).toBeCloseTo(1267.31, 2);
    expect(negativeRate.warnings).toContain("negativeRate");
  });

  it("solves required monthly contribution and inverts the projection within one cent", () => {
    const target = 100000;
    const result = calcularInvestimento(
      inputs({
        mode: "requiredContribution",
        valorInicial: 10000,
        metaValor: target,
        prazoMeses: 120,
        taxa: 8,
        taxaPeriodo: "anualEfetiva",
      })
    );

    expect(result.aporteMensalNecessario).toBeGreaterThan(0);
    expect(result.valorFinalNominal).toBeCloseTo(target, 2);

    const projected = futureValueInvestimento({
      valorInicial: 10000,
      aporteMensal: result.aporteMensalNecessario ?? 0,
      meses: 120,
      taxaMensal: getTaxaMensalDecimal(8, "anualEfetiva"),
      aporteTiming: "fim",
    });

    expect(projected).toBeCloseTo(target, 2);
  });

  it("returns zero required contribution when starting value grows past the target", () => {
    const result = calcularInvestimento(
      inputs({
        mode: "requiredContribution",
        valorInicial: 100000,
        metaValor: 90000,
        prazoMeses: 12,
      })
    );

    expect(result.aporteMensalNecessario).toBe(0);
    expect(result.valorFinalNominal).toBeGreaterThan(90000);
  });

  it("solves the first whole month that reaches the goal", () => {
    const result = calcularInvestimento(
      inputs({
        mode: "timeToGoal",
        valorInicial: 0,
        aporteMensal: 1350,
        metaValor: 100000,
        taxa: 0.75,
        taxaPeriodo: "mensal",
      })
    );

    expect(result.mesesAteMeta).toBe(60);
    expect(result.tempoAteMeta).toEqual({ anos: 5, meses: 0 });
    expect(result.valorFinalNominal).toBeGreaterThanOrEqual(100000);
  });

  it("returns zero months when the initial value already reaches the target", () => {
    const result = calcularInvestimento(
      inputs({
        mode: "timeToGoal",
        valorInicial: 120000,
        metaValor: 100000,
      })
    );

    expect(result.mesesAteMeta).toBe(0);
    expect(result.projectionSeries).toHaveLength(0);
    expect(result.valorFinalNominal).toBe(120000);
  });

  it("marks a goal unreachable within 600 months", () => {
    const result = calcularInvestimento(
      inputs({
        mode: "timeToGoal",
        valorInicial: 0,
        aporteMensal: 0,
        metaValor: 100000,
        taxa: 0,
      })
    );

    expect(result.mesesAteMeta).toBeNull();
    expect(result.projectionSeries).toHaveLength(600);
    expect(result.warnings).toContain("unreachableGoal");
  });

  it("computes optional real value with user-provided inflation", () => {
    const result = calcularInvestimento(
      inputs({
        valorInicial: 10000,
        aporteMensal: 0,
        prazoMeses: 12,
        taxa: 10,
        taxaPeriodo: "anualEfetiva",
        inflacaoAnual: 4,
      })
    );

    expect(result.valorFinalNominal).toBeCloseTo(11000, 2);
    expect(result.valorFinalReal).toBeCloseTo(10576.92, 2);
  });

  it("validates plan boundaries", () => {
    expect(validateInvestimentoInputs(inputs({ valorInicial: -1 }))).toContain("valorInicial");
    expect(validateInvestimentoInputs(inputs({ mode: "requiredContribution", metaValor: 0 }))).toContain("metaValor");
    expect(validateInvestimentoInputs(inputs({ prazoMeses: 601 }))).toContain("prazoMeses");
    expect(validateInvestimentoInputs(inputs({ taxa: -100 }))).toContain("taxa");
    expect(validateInvestimentoInputs(inputs({ inflacaoAnual: -100 }))).toContain("inflacaoAnual");
  });

  it("rejects rate and horizon combinations that overflow the growth factor", () => {
    expect(
      validateInvestimentoInputs(
        inputs({
          prazoMeses: 600,
          taxa: 1000,
          taxaPeriodo: "mensal",
        })
      )
    ).toContain("taxa");

    expect(() =>
      calcularInvestimento(
        inputs({
          prazoMeses: 600,
          taxa: 1000,
          taxaPeriodo: "mensal",
        })
      )
    ).toThrow(RangeError);
  });

  it("rejects finite growth factors whose projected final value overflows", () => {
    const overflowingFinalValue = inputs({
      valorInicial: 1_000_000_000,
      aporteMensal: 100_000_000,
      prazoMeses: 600,
      taxa: 220,
      taxaPeriodo: "mensal",
    });

    expect(validateInvestimentoInputs(overflowingFinalValue)).toContain("taxa");
    expect(() => calcularInvestimento(overflowingFinalValue)).toThrow(RangeError);
  });

  it("does not use the unused monthly contribution when checking required-contribution overflow", () => {
    expect(
      validateInvestimentoInputs(
        inputs({
          mode: "requiredContribution",
          valorInicial: 0,
          aporteMensal: 100_000_000,
          metaValor: 10_000_000_000,
          prazoMeses: 600,
          taxa: 220,
          taxaPeriodo: "mensal",
        })
      )
    ).not.toContain("taxa");
  });

  it("uses the capped search horizon when checking time-to-goal overflow", () => {
    expect(
      validateInvestimentoInputs(
        inputs({
          mode: "timeToGoal",
          prazoMeses: 1,
          taxa: 1000,
          taxaPeriodo: "mensal",
        })
      )
    ).toContain("taxa");
  });

  it("allows finite high rates and valid negative rates", () => {
    expect(
      validateInvestimentoInputs(
        inputs({
          prazoMeses: 10,
          taxa: 1000,
          taxaPeriodo: "mensal",
        })
      )
    ).not.toContain("taxa");

    expect(
      validateInvestimentoInputs(
        inputs({
          prazoMeses: 600,
          taxa: 10000,
          taxaPeriodo: "anualEfetiva",
        })
      )
    ).not.toContain("taxa");

    expect(
      validateInvestimentoInputs(
        inputs({
          prazoMeses: 600,
          taxa: -99.99,
          taxaPeriodo: "mensal",
        })
      )
    ).not.toContain("taxa");
  });
});

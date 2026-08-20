import { describe, expect, it } from "vitest";
import { calcularFinanciamento, type MetodoAmortizacao } from "./financiamento";
import {
  FINANCIAR_OU_JUNTAR_NEVER_TOLERANCE,
  calcularFinanciarOuJuntarDinheiro,
  calcularSaldoInvestidoFechado,
  getDefaultFinanciarOuJuntarDinheiroInputs,
  validateFinanciarOuJuntarDinheiroInputs,
  type FinanciarOuJuntarDinheiroInputs,
} from "./financiar-ou-juntar-dinheiro";

function inputs(
  overrides: Partial<FinanciarOuJuntarDinheiroInputs> = {}
): FinanciarOuJuntarDinheiroInputs {
  return { ...getDefaultFinanciarOuJuntarDinheiroInputs(), ...overrides };
}

describe("calcularFinanciarOuJuntarDinheiro", () => {
  it("uses month 0 capital and earns before the end-of-month contribution", () => {
    const scenario = inputs({
      valorImovel: 1000,
      capitalInicial: 100,
      valorizacaoAnualImovel: 12,
      aporteMensalLiquido: 50,
      rendimentoAnualInvestimento: 12,
      aluguelMensalInicial: 25,
      crescimentoAnualAluguel: 12,
      horizonteMeses: 1,
    });
    const result = calcularFinanciarOuJuntarDinheiro(scenario);
    const monthlyFactor = Math.pow(1.12, 1 / 12);

    expect(result.waitForCash.linhaDoTempo[0]).toMatchObject({
      mes: 0,
      saldoInvestido: 100,
      precoImovel: 1000,
      aluguelDoMes: 0,
    });
    expect(result.waitForCash.saldoNoHorizonte).toBeCloseTo(100 * monthlyFactor + 50, 10);
    expect(result.waitForCash.precoNoHorizonte).toBeCloseTo(1000 * monthlyFactor, 10);
    expect(result.waitForCash.aluguelPrimeiroMes).toBe(25);
    expect(result.waitForCash.aluguelFinalConsiderado).toBe(25);
  });

  it.each([
    { annualRate: 0, months: 600 },
    { annualRate: 8, months: 1200 },
  ])("matches the closed-form savings recurrence for $annualRate%", ({ annualRate, months }) => {
    const scenario = inputs({
      valorImovel: 1e12,
      capitalInicial: 12345.67,
      aporteMensalLiquido: 987.65,
      rendimentoAnualInvestimento: annualRate,
      valorizacaoAnualImovel: 50,
      horizonteMeses: months,
    });
    const result = calcularFinanciarOuJuntarDinheiro(scenario);
    const factor = Math.pow(1 + annualRate / 100, 1 / 12);
    const closed = calcularSaldoInvestidoFechado(12345.67, 987.65, factor, months);

    expect(result.waitForCash.saldoNoHorizonte).toBeCloseTo(closed, 4);
    expect(Number.isFinite(result.waitForCash.saldoNoHorizonte)).toBe(true);
    expect(Number.isFinite(result.waitForCash.precoNoHorizonte)).toBe(true);
  });

  it("returns already-affordable at month 0 without financing", () => {
    const result = calcularFinanciarOuJuntarDinheiro(
      inputs({ valorImovel: 500000, capitalInicial: 500000 })
    );

    expect(result.waitForCash.status).toBe("already-affordable");
    expect(result.waitForCash.primeiroMesAcessivel).toBe(0);
    expect(result.waitForCash.aluguelAcumuladoConsiderado).toBe(0);
    expect(result.financeNow.necessario).toBe(false);
    expect(result.financeNow.valorFinanciado).toBe(0);
    expect(result.financeNow.desembolsoTotalAquisicao).toBe(500000);
  });

  it("finds the first exact-boundary crossing and sums rent through that month", () => {
    const result = calcularFinanciarOuJuntarDinheiro(
      inputs({
        valorImovel: 1200,
        capitalInicial: 0,
        valorizacaoAnualImovel: 0,
        aporteMensalLiquido: 100,
        rendimentoAnualInvestimento: 0,
        aluguelMensalInicial: 10,
        crescimentoAnualAluguel: 0,
        horizonteMeses: 24,
      })
    );

    expect(result.waitForCash.status).toBe("reached-within-horizon");
    expect(result.waitForCash.primeiroMesAcessivel).toBe(12);
    expect(result.waitForCash.aluguelAcumuladoConsiderado).toBe(120);
    expect(result.waitForCash.linhaDoTempo.find((row) => row.mes === 12)).toMatchObject({
      mes: 12,
      saldoInvestido: 1200,
      precoImovel: 1200,
      aluguelAcumulado: 120,
    });
    expect(result.waitForCash.linhaDoTempo.at(-1)).toMatchObject({
      mes: 24,
      saldoInvestido: 2400,
      precoImovel: 1200,
      aluguelDoMes: 0,
      aluguelAcumulado: 120,
    });
    expect(result.waitForCash.saldoNoHorizonte).toBe(2400);
    expect(result.waitForCash.faltaNoHorizonte).toBe(0);
    expect(result.waitForCash.sobraNoHorizonte).toBe(1200);
  });

  it("does not call an eventual crossing never when investment grows faster than the target", () => {
    const result = calcularFinanciarOuJuntarDinheiro(
      inputs({
        valorImovel: 100000,
        capitalInicial: 0,
        aporteMensalLiquido: 1000,
        rendimentoAnualInvestimento: 10,
        valorizacaoAnualImovel: 0,
        horizonteMeses: 12,
      })
    );

    expect(result.waitForCash.primeiroMesAcessivel).toBeNull();
    expect(result.waitForCash.status).toBe("not-reached-within-horizon");
  });

  it("proves never when the fund remains zero", () => {
    const result = calcularFinanciarOuJuntarDinheiro(
      inputs({ capitalInicial: 0, aporteMensalLiquido: 0, horizonteMeses: 12 })
    );

    expect(result.waitForCash.status).toBe("never-reached-under-assumptions");
  });

  it("proves never for equal positive growth with an upper ratio below one", () => {
    const result = calcularFinanciarOuJuntarDinheiro(
      inputs({
        valorImovel: 1000,
        capitalInicial: 100,
        aporteMensalLiquido: 1,
        rendimentoAnualInvestimento: 12,
        valorizacaoAnualImovel: 12,
        horizonteMeses: 12,
      })
    );

    expect(result.waitForCash.status).toBe("never-reached-under-assumptions");
  });

  it("falls back conservatively when the equal-growth upper ratio is within tolerance of one", () => {
    const monthlyFactor = Math.pow(1.12, 1 / 12);
    const targetRatio = 1 - FINANCIAR_OU_JUNTAR_NEVER_TOLERANCE / 2;
    const result = calcularFinanciarOuJuntarDinheiro(
      inputs({
        valorImovel: 1000,
        capitalInicial: 0,
        aporteMensalLiquido: 1000 * targetRatio * (monthlyFactor - 1),
        rendimentoAnualInvestimento: 12,
        valorizacaoAnualImovel: 12,
        horizonteMeses: 1,
      })
    );

    expect(result.waitForCash.status).toBe("not-reached-within-horizon");
  });

  it("proves never after correcting a future turning point when appreciation grows faster", () => {
    const result = calcularFinanciarOuJuntarDinheiro(
      inputs({
        valorImovel: 1000,
        capitalInicial: 0,
        aporteMensalLiquido: 10,
        rendimentoAnualInvestimento: 0,
        valorizacaoAnualImovel: 12,
        horizonteMeses: 12,
      })
    );

    expect(result.waitForCash.status).toBe("never-reached-under-assumptions");
  });

  it("proves never with positive returns, faster appreciation, positive capital, and no contributions", () => {
    const result = calcularFinanciarOuJuntarDinheiro(
      inputs({
        valorImovel: 1000,
        capitalInicial: 500,
        aporteMensalLiquido: 0,
        rendimentoAnualInvestimento: 8,
        valorizacaoAnualImovel: 12,
        horizonteMeses: 12,
      })
    );

    expect(result.waitForCash.status).toBe("never-reached-under-assumptions");
  });

  it("does not assert never when the future unimodal maximum crosses", () => {
    const result = calcularFinanciarOuJuntarDinheiro(
      inputs({
        valorImovel: 10000,
        capitalInicial: 0,
        aporteMensalLiquido: 100,
        rendimentoAnualInvestimento: 0,
        valorizacaoAnualImovel: 1,
        horizonteMeses: 1,
      })
    );

    expect(result.waitForCash.status).toBe("not-reached-within-horizon");
  });

  it("falls back when the future maximum is numerically near one", () => {
    const G = Math.pow(1.12, 1 / 12);
    const turningMonth = Math.ceil(1 / (G - 1));
    const almostOne = 1 - FINANCIAR_OU_JUNTAR_NEVER_TOLERANCE / 2;
    const aporte = (1000 * Math.pow(G, turningMonth) * almostOne) / turningMonth;
    const result = calcularFinanciarOuJuntarDinheiro(
      inputs({
        valorImovel: 1000,
        capitalInicial: 0,
        aporteMensalLiquido: aporte,
        rendimentoAnualInvestimento: 0,
        valorizacaoAnualImovel: 12,
        horizonteMeses: 1,
      })
    );

    expect(result.waitForCash.status).toBe("not-reached-within-horizon");
  });

  it("keeps rent growth out of the investment balance", () => {
    const withoutGrowth = calcularFinanciarOuJuntarDinheiro(
      inputs({ valorImovel: 1e9, aluguelMensalInicial: 1000, crescimentoAnualAluguel: 0, horizonteMeses: 24 })
    );
    const withGrowth = calcularFinanciarOuJuntarDinheiro(
      inputs({ valorImovel: 1e9, aluguelMensalInicial: 1000, crescimentoAnualAluguel: 20, horizonteMeses: 24 })
    );

    expect(withGrowth.waitForCash.saldoNoHorizonte).toBe(withoutGrowth.waitForCash.saldoNoHorizonte);
    expect(withGrowth.waitForCash.aluguelAcumuladoConsiderado).toBeGreaterThan(
      withoutGrowth.waitForCash.aluguelAcumuladoConsiderado
    );
  });

  it("supports zero rent and rent growth", () => {
    const result = calcularFinanciarOuJuntarDinheiro(
      inputs({ valorImovel: 1e9, aluguelMensalInicial: 0, crescimentoAnualAluguel: 0, horizonteMeses: 24 })
    );

    expect(result.waitForCash.aluguelAcumuladoConsiderado).toBe(0);
    expect(result.waitForCash.aluguelFinalConsiderado).toBe(0);
  });

  it.each(["sac", "price"] as MetodoAmortizacao[])(
    "adapts the shared %s financing result without duplicating its formulas",
    (metodo) => {
      const scenario = inputs({ metodo, horizonteMeses: 12 });
      const direct = calcularFinanciamento(
        {
          valorEmprestimo: scenario.valorImovel,
          valorEntrada: scenario.capitalInicial,
          taxaJurosAnual: scenario.taxaFinanciamentoAnual,
          meses: scenario.prazoFinanciamentoMeses,
          correcaoAnualImovel: scenario.valorizacaoAnualImovel,
        },
        metodo
      );
      const adapted = calcularFinanciarOuJuntarDinheiro(scenario).financeNow;

      expect(adapted.valorFinanciado).toBe(direct.valorFinanciado);
      expect(adapted.primeiraPrestacao).toBe(direct.primeiraPrestacao);
      expect(adapted.ultimaPrestacao).toBe(direct.ultimaPrestacao);
      expect(adapted.totalJuros).toBe(direct.totalJurosPagos);
      expect(adapted.valorImovelFimPrazo).toBe(direct.valorImovelFinal);
    }
  );

  it.each(["sac", "price"] as MetodoAmortizacao[])("supports zero-interest %s", (metodo) => {
    const result = calcularFinanciarOuJuntarDinheiro(
      inputs({ metodo, taxaFinanciamentoAnual: 0 })
    );

    expect(result.financeNow.totalJuros).toBe(0);
    expect(Math.abs(result.financeNow.primeiraPrestacao - result.financeNow.ultimaPrestacao)).toBeLessThanOrEqual(0.01);
    expect(result.financeNow.somaPrestacoes).toBe(400000);
  });
});

describe("validateFinanciarOuJuntarDinheiroInputs", () => {
  it.each([
    ["valorImovel", { valorImovel: 0 }],
    ["valorImovel", { valorImovel: 1e12 + 1 }],
    ["capitalInicial", { capitalInicial: -1 }],
    ["capitalInicial", { capitalInicial: 500001 }],
    ["metodo", { metodo: "other" as MetodoAmortizacao }],
    ["taxaFinanciamentoAnual", { taxaFinanciamentoAnual: 100.01 }],
    ["prazoFinanciamentoMeses", { prazoFinanciamentoMeses: 0 }],
    ["prazoFinanciamentoMeses", { prazoFinanciamentoMeses: 12.5 }],
    ["valorizacaoAnualImovel", { valorizacaoAnualImovel: 50.01 }],
    ["aporteMensalLiquido", { aporteMensalLiquido: 1e9 + 1 }],
    ["rendimentoAnualInvestimento", { rendimentoAnualInvestimento: 100.01 }],
    ["aluguelMensalInicial", { aluguelMensalInicial: -1 }],
    ["crescimentoAnualAluguel", { crescimentoAnualAluguel: 50.01 }],
    ["horizonteMeses", { horizonteMeses: 1201 }],
    ["horizonteMeses", { horizonteMeses: 1.5 }],
  ] as const)("rejects invalid %s", (field, override) => {
    expect(validateFinanciarOuJuntarDinheiroInputs(inputs(override))).toContain(field);
  });

  it("rejects non-finite values and negative zero", () => {
    expect(validateFinanciarOuJuntarDinheiroInputs(inputs({ valorImovel: Number.NaN }))).toContain("valorImovel");
    expect(validateFinanciarOuJuntarDinheiroInputs(inputs({ capitalInicial: Number.POSITIVE_INFINITY }))).toContain(
      "capitalInicial"
    );
    expect(validateFinanciarOuJuntarDinheiroInputs(inputs({ aporteMensalLiquido: -0 }))).toContain(
      "aporteMensalLiquido"
    );
  });

  it("accepts all documented boundaries", () => {
    expect(
      validateFinanciarOuJuntarDinheiroInputs(
        inputs({
          valorImovel: 1e12,
          capitalInicial: 1e12,
          taxaFinanciamentoAnual: 100,
          prazoFinanciamentoMeses: 600,
          valorizacaoAnualImovel: 50,
          aporteMensalLiquido: 1e9,
          rendimentoAnualInvestimento: 100,
          aluguelMensalInicial: 1e9,
          crescimentoAnualAluguel: 50,
          horizonteMeses: 1200,
        })
      )
    ).toEqual([]);
  });
});

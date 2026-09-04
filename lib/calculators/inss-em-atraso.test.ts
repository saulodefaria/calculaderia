import { describe, expect, it } from "vitest";
import {
  calcularInssEmAtraso,
  calculateInssEmAtrasoJurosPercentual,
  estimateInssEmAtrasoDelayDays,
  getDefaultInssEmAtrasoDueDate,
  getDefaultInssEmAtrasoInputs,
  getInssEmAtrasoSelicMonths,
  validateInssEmAtrasoInputs,
  type InssEmAtrasoInputs,
} from "./inss-em-atraso";

function inputs(overrides: Partial<InssEmAtrasoInputs> = {}): InssEmAtrasoInputs {
  return {
    ...getDefaultInssEmAtrasoInputs(),
    ...overrides,
  };
}

describe("calcularInssEmAtraso", () => {
  it("calculates the default Receita/INSS 2026 example with capped multa and Selic juros", () => {
    const result = calcularInssEmAtraso(inputs());

    expect(result.valorPrincipal).toBe(324.2);
    expect(result.diasAtrasoEstimados).toBe(140);
    expect(result.diasAtrasoUsados).toBe(140);
    expect(result.multaPercentual).toBe(0.2);
    expect(result.multa).toBe(64.84);
    expect(result.jurosPercentual).toBe(0.0549);
    expect(result.juros).toBe(17.8);
    expect(result.totalAcrescimos).toBe(82.64);
    expect(result.totalEstimado).toBe(406.84);
    expect(result.statusRegularizacao).toBe("selfServiceLikely");
    expect(result.sourceVersion).toBe("2026-07-06");
    expect(result.latestSelicMonth).toBe("2026-06");
    expect(result.supportedPaymentMonth).toBe("2026-07");
    expect(result.warnings).toContain("principalInformadoUsuario");
    expect(result.warnings).toContain("semEmissaoGuia");
    expect(result.warnings).toContain("semValidacaoBeneficio");
  });

  it("calculates a short delay with 6.93% multa and 1% payment-month juros", () => {
    const result = calcularInssEmAtraso(
      inputs({
        valorPrincipal: 178.31,
        competencia: "2026-05",
        dataVencimento: "2026-06-15",
        dataPagamento: "2026-07-06",
      })
    );

    expect(result.diasAtrasoEstimados).toBe(21);
    expect(result.multaPercentual).toBe(0.0693);
    expect(result.multa).toBe(12.36);
    expect(result.jurosPercentual).toBe(0.01);
    expect(result.juros).toBe(1.78);
    expect(result.totalEstimado).toBe(192.45);
  });

  it("omits Selic juros when payment happens in the same due month", () => {
    const result = calcularInssEmAtraso(
      inputs({
        competencia: "2026-06",
        dataVencimento: "2026-07-15",
        dataPagamento: "2026-07-20",
      })
    );

    expect(result.diasAtrasoEstimados).toBe(5);
    expect(result.multaPercentual).toBe(0.0165);
    expect(result.multa).toBe(5.35);
    expect(result.jurosPercentual).toBe(0);
    expect(result.juros).toBe(0);
    expect(result.totalEstimado).toBe(329.55);
    expect(result.warnings).toContain("semJurosMesmoMes");
  });

  it("uses manual day count only for multa", () => {
    const result = calcularInssEmAtraso(inputs({ diasAtrasoManual: 30 }));

    expect(result.diasAtrasoEstimados).toBe(140);
    expect(result.diasAtrasoUsados).toBe(30);
    expect(result.multaPercentual).toBe(0.099);
    expect(result.multa).toBe(32.1);
    expect(result.jurosPercentual).toBe(0.0549);
    expect(result.warnings).toContain("ajusteDiasManual");
  });

  it("flags CI and facultativo self-service windows without blocking the legal additions estimate", () => {
    const ci = calcularInssEmAtraso(inputs({ competencia: "2021-06", dataVencimento: "2021-07-15" }));
    const facultativo = calcularInssEmAtraso(
      inputs({
        categoriaSegurado: "facultativo",
        competencia: "2025-12",
        dataVencimento: "2026-01-15",
      })
    );

    expect(ci.statusRegularizacao).toBe("requiresInssService");
    expect(ci.totalEstimado).toBeGreaterThan(ci.valorPrincipal);
    expect(ci.warnings).toContain("janelaContribuinteIndividual");
    expect(facultativo.statusRegularizacao).toBe("requiresInssService");
    expect(facultativo.totalEstimado).toBeGreaterThan(facultativo.valorPrincipal);
    expect(facultativo.warnings).toContain("janelaFacultativo");
  });

  it("blocks stale source windows, unsupported historical periods, no-arrears, and missing Selic data", () => {
    const stale = calcularInssEmAtraso(inputs({ dataPagamento: "2026-08-01" }));
    const historical = calcularInssEmAtraso(inputs({ competencia: "2008-11", dataVencimento: "2008-12-15" }));
    const noArrears = calcularInssEmAtraso(inputs({ dataPagamento: "2026-02-10" }));
    const missingSelic = calcularInssEmAtraso(inputs({ competencia: "2008-12", dataVencimento: "2008-12-15" }));

    expect(stale.statusRegularizacao).toBe("staleSource");
    expect(stale.totalEstimado).toBe(324.2);
    expect(stale.warnings).toContain("janelaPagamentoFonte");
    expect(historical.statusRegularizacao).toBe("unsupportedHistoricalPeriod");
    expect(historical.totalEstimado).toBe(324.2);
    expect(noArrears.statusRegularizacao).toBe("noArrears");
    expect(noArrears.warnings).toContain("semAtraso");
    expect(missingSelic.statusRegularizacao).toBe("staleSource");
    expect(missingSelic.warnings).toContain("selicIndisponivel");
  });

  it("validates principal, dates, category, manual days, and acknowledgement", () => {
    expect(validateInssEmAtrasoInputs(inputs({ valorPrincipal: 0 }))).toContain("valorPrincipal");
    expect(validateInssEmAtrasoInputs(inputs({ competencia: "2026-13" }))).toContain("competencia");
    expect(validateInssEmAtrasoInputs(inputs({ categoriaSegurado: "mei" as never }))).toContain("categoriaSegurado");
    expect(validateInssEmAtrasoInputs(inputs({ dataVencimento: "2026-02-31" }))).toContain("dataVencimento");
    expect(validateInssEmAtrasoInputs(inputs({ dataPagamento: "2026-07-32" }))).toContain("dataPagamento");
    expect(validateInssEmAtrasoInputs(inputs({ diasAtrasoManual: 10001 }))).toContain("diasAtrasoManual");
    expect(validateInssEmAtrasoInputs(inputs({ confirmarPrincipalUsuario: false }))).toContain(
      "confirmarPrincipalUsuario"
    );
    expect(validateInssEmAtrasoInputs(inputs({ dataPagamento: "2026-02-10" }))).toContain(
      "pagamentoAntesVencimento"
    );
  });
});

describe("INSS em atraso date and Selic helpers", () => {
  it("derives the editable default due date with weekend-only adjustment", () => {
    expect(getDefaultInssEmAtrasoDueDate("2026-01")).toBe("2026-02-16");
    expect(getDefaultInssEmAtrasoDueDate("2026-05")).toBe("2026-06-15");
    expect(getDefaultInssEmAtrasoDueDate("bad")).toBeNull();
  });

  it("estimates delay days from the day after due through payment date", () => {
    expect(estimateInssEmAtrasoDelayDays("2026-02-16", "2026-07-06")).toBe(140);
    expect(estimateInssEmAtrasoDelayDays("2026-07-15", "2026-07-20")).toBe(5);
    expect(estimateInssEmAtrasoDelayDays("2026-07-15", "2026-07-15")).toBe(0);
    expect(estimateInssEmAtrasoDelayDays("bad", "2026-07-15")).toBeNull();
  });

  it("uses Selic months after due month through the month before payment plus 1%", () => {
    expect(getInssEmAtrasoSelicMonths("2026-02-16", "2026-07-06")).toEqual([
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
    ]);
    expect(calculateInssEmAtrasoJurosPercentual("2026-02-16", "2026-07-06")).toEqual({
      percentual: 0.0549,
      missingMonths: [],
    });
    expect(calculateInssEmAtrasoJurosPercentual("2026-07-15", "2026-07-20")).toEqual({
      percentual: 0,
      missingMonths: [],
    });
  });
});

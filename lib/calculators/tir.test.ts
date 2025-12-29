import { describe, it, expect } from "vitest";
import {
  calcularTir,
  parseCashflowValue,
  parseCashflowsFromText,
  taxaAnualParaPeriodica,
  taxaPeriodicaParaAnual,
  validarCashflows,
} from "./tir";

/**
 * NPV com convenção do projeto: o primeiro fluxo está no período 1 (não no tempo 0).
 * \sum_{t=1..n} CF_t / (1+r)^t
 */
function npvPeriod1(rate: number, cashflows: number[]): number {
  return cashflows.reduce((acc, cf, i) => acc + cf / Math.pow(1 + rate, i + 1), 0);
}

describe("taxaPeriodicaParaAnual / taxaAnualParaPeriodica", () => {
  it("converte taxa periódica -> anual e faz roundtrip para todos os períodos", () => {
    const cases: Array<{ periodo: "mensal" | "trimestral" | "semestral" | "anual"; n: number; r: number }> = [
      { periodo: "mensal", n: 12, r: 0.01 },
      { periodo: "trimestral", n: 4, r: 0.05 },
      { periodo: "semestral", n: 2, r: 0.03 },
      { periodo: "anual", n: 1, r: 0.12 },
    ];

    for (const { periodo, n, r } of cases) {
      const anual = taxaPeriodicaParaAnual(r, periodo);
      expect(anual).toBeCloseTo(Math.pow(1 + r, n) - 1, 12);

      const back = taxaAnualParaPeriodica(anual, periodo);
      expect(back).toBeCloseTo(r, 12);
    }
  });

  it("lida com taxas negativas (ex: -1% a.m.)", () => {
    const anual = taxaPeriodicaParaAnual(-0.01, "mensal");
    expect(anual).toBeCloseTo(Math.pow(0.99, 12) - 1, 12);

    const mensal = taxaAnualParaPeriodica(anual, "mensal");
    expect(mensal).toBeCloseTo(-0.01, 12);
  });
});

describe("parseCashflowValue", () => {
  it("parseia formatos BR e US com símbolo/moeda, inclusive negativo", () => {
    expect(parseCashflowValue("R$ 1.234,56")).toBeCloseTo(1234.56, 10);
    expect(parseCashflowValue("$1,234.56")).toBeCloseTo(1234.56, 10);
    expect(parseCashflowValue("-1.234,56")).toBeCloseTo(-1234.56, 10);
    expect(parseCashflowValue("  - 1.234,56  ")).toBeCloseTo(-1234.56, 10);
    expect(parseCashflowValue("1234")).toBeCloseTo(1234, 10);
  });

  it("interpreta separador único como milhar quando há agrupamento (ex: 1,234 / 1.234)", () => {
    expect(parseCashflowValue("1,234")).toBe(1234);
    expect(parseCashflowValue("1.234")).toBe(1234);
    expect(parseCashflowValue("1,234,567")).toBe(1234567);
    expect(parseCashflowValue("1.234.567")).toBe(1234567);
  });

  it("rejeita strings vazias ou inválidas (parse estrito, sem aceitar parse parcial)", () => {
    expect(parseCashflowValue("")).toBeNull();
    expect(parseCashflowValue("   ")).toBeNull();
    expect(parseCashflowValue("-")).toBeNull();
    expect(parseCashflowValue("abc")).toBeNull();
    expect(parseCashflowValue("1.2.3")).toBeNull();
    expect(parseCashflowValue("1,2,3")).toBeNull();
    expect(parseCashflowValue("1.1,2.2,3.3")).toBeNull(); // lista, não um único número
  });
});

describe("parseCashflowsFromText", () => {
  it("retorna vazio para texto vazio", () => {
    expect(parseCashflowsFromText("")).toEqual({ values: [], errors: [] });
    expect(parseCashflowsFromText("   ")).toEqual({ values: [], errors: [] });
  });

  it("parseia lista por newline / tab / ponto-e-vírgula", () => {
    const byNewline = parseCashflowsFromText("100\n-50\nR$ 25,50");
    expect(byNewline.errors).toEqual([]);
    expect(byNewline.values).toHaveLength(3);
    expect(byNewline.values[0]).toBeCloseTo(100, 10);
    expect(byNewline.values[1]).toBeCloseTo(-50, 10);
    expect(byNewline.values[2]).toBeCloseTo(25.5, 10);

    const byTab = parseCashflowsFromText("100\t-50\t25");
    expect(byTab).toEqual({ values: [100, -50, 25], errors: [] });

    const bySemicolon = parseCashflowsFromText("100; -50; 25");
    expect(bySemicolon).toEqual({ values: [100, -50, 25], errors: [] });
  });

  it("parseia lista por vírgula (inclusive decimais com ponto) quando não for número único", () => {
    const ints = parseCashflowsFromText("100,-50,25");
    expect(ints).toEqual({ values: [100, -50, 25], errors: [] });

    const dotDecimals = parseCashflowsFromText("1.1,2.2,3.3");
    expect(dotDecimals.errors).toEqual([]);
    expect(dotDecimals.values).toHaveLength(3);
    expect(dotDecimals.values[0]).toBeCloseTo(1.1, 10);
    expect(dotDecimals.values[1]).toBeCloseTo(2.2, 10);
    expect(dotDecimals.values[2]).toBeCloseTo(3.3, 10);
  });

  it("não interpreta número único com milhares US como lista (ex: 1,234,567.89)", () => {
    const r = parseCashflowsFromText("1,234,567.89");
    expect(r.errors).toEqual([]);
    expect(r.values).toEqual([1234567.89]);
  });

  it("reporta índices de erro mantendo os valores válidos", () => {
    const r = parseCashflowsFromText("100\nabc\n-50");
    expect(r.values).toEqual([100, -50]);
    expect(r.errors).toEqual([1]);

    const r2 = parseCashflowsFromText("abc,def");
    expect(r2.values).toEqual([]);
    expect(r2.errors).toEqual([0, 1]);
  });
});

describe("validarCashflows", () => {
  it("exige pelo menos 2 fluxos", () => {
    expect(validarCashflows([]).valido).toBe(false);
    expect(validarCashflows([100]).valido).toBe(false);
  });

  it("exige pelo menos um fluxo positivo e um negativo (zeros não contam)", () => {
    expect(validarCashflows([100, 100]).valido).toBe(false);
    expect(validarCashflows([-100, -1]).valido).toBe(false);
    expect(validarCashflows([0, 0, 0]).valido).toBe(false);

    expect(validarCashflows([-100, 0, 50]).valido).toBe(true);
  });
});

describe("calcularTir", () => {
  it("retorna erro e estatísticas quando validação falha (sem mudança de sinal)", () => {
    const r = calcularTir({ cashflows: [100, 100], periodo: "mensal" });
    expect(r.tirPeriodica).toBeNull();
    expect(r.tirAnual).toBeNull();
    expect(r.erro).toBe("Os fluxos devem conter pelo menos um valor positivo e um negativo");
    expect(r.totalFluxos).toBe(200);
    expect(r.totalPositivos).toBe(200);
    expect(r.totalNegativos).toBe(0);
    expect(r.quantidadePeriodos).toBe(2);
  });

  it("retorna erro e estatísticas quando há menos de 2 fluxos", () => {
    const r = calcularTir({ cashflows: [100], periodo: "mensal" });
    expect(r.tirPeriodica).toBeNull();
    expect(r.tirAnual).toBeNull();
    expect(r.erro).toBe("Insira pelo menos 2 fluxos de caixa");
    expect(r.totalFluxos).toBe(100);
    expect(r.totalPositivos).toBe(100);
    expect(r.totalNegativos).toBe(0);
    expect(r.quantidadePeriodos).toBe(1);
  });

  it("calcula uma TIR conhecida (2 períodos): [-100, 110] => 10% por período", () => {
    const cashflows = [-100, 110];
    const r = calcularTir({ cashflows, periodo: "mensal" });

    expect(r.erro).toBeUndefined();
    expect(r.tirPeriodica).not.toBeNull();
    expect(r.tirAnual).not.toBeNull();

    expect(r.tirPeriodica!).toBeCloseTo(0.1, 7);
    expect(r.tirAnual!).toBeCloseTo(Math.pow(1.1, 12) - 1, 5);

    // Propriedade fundamental: NPV(irr) ~ 0 na convenção do projeto (período 1)
    expect(Math.abs(npvPeriod1(r.tirPeriodica!, cashflows))).toBeLessThan(1e-4);

    // Estatísticas
    expect(r.totalFluxos).toBe(10);
    expect(r.totalPositivos).toBe(110);
    expect(r.totalNegativos).toBe(100);
    expect(r.quantidadePeriodos).toBe(2);
  });

  it("converte corretamente a TIR periódica para anual equivalente conforme a periodicidade", () => {
    const cashflows = [-100, 110]; // irr = 10% ao período

    const trimestral = calcularTir({ cashflows, periodo: "trimestral" });
    expect(trimestral.tirPeriodica).not.toBeNull();
    expect(trimestral.tirAnual).not.toBeNull();
    expect(trimestral.tirPeriodica!).toBeCloseTo(0.1, 7);
    expect(trimestral.tirAnual!).toBeCloseTo(Math.pow(1.1, 4) - 1, 6);
  });

  it("calcula TIR em múltiplos períodos com solução analítica: [-100, 0, 110] => sqrt(1.1)-1", () => {
    const cashflows = [-100, 0, 110];
    const expected = Math.sqrt(1.1) - 1;

    const r = calcularTir({ cashflows, periodo: "anual" });
    expect(r.tirPeriodica).not.toBeNull();
    expect(r.tirAnual).not.toBeNull();

    expect(r.tirPeriodica!).toBeCloseTo(expected, 7);
    expect(r.tirAnual!).toBeCloseTo(expected, 7); // anual -> n=1
    expect(Math.abs(npvPeriod1(r.tirPeriodica!, cashflows))).toBeLessThan(1e-4);
  });

  it("calcula TIR negativa quando retorno é insuficiente: [-100, 50] => -50% ao período", () => {
    const cashflows = [-100, 50];
    const r = calcularTir({ cashflows, periodo: "anual" });
    expect(r.tirPeriodica).not.toBeNull();
    expect(r.tirAnual).not.toBeNull();

    expect(r.tirPeriodica!).toBeCloseTo(-0.5, 8);
    expect(r.tirAnual!).toBeCloseTo(-0.5, 8);
    expect(Math.abs(npvPeriod1(r.tirPeriodica!, cashflows))).toBeLessThan(1e-4);
  });

  it("retorna TIR próxima de zero quando NPV zera em r=0: [-100, 100] => 0%", () => {
    const cashflows = [-100, 100];
    const r = calcularTir({ cashflows, periodo: "mensal" });
    expect(r.tirPeriodica).not.toBeNull();
    expect(r.tirAnual).not.toBeNull();

    expect(Math.abs(r.tirPeriodica!)).toBeLessThan(1e-5);
    expect(Math.abs(r.tirAnual!)).toBeLessThan(1e-5);
    expect(Math.abs(npvPeriod1(r.tirPeriodica!, cashflows))).toBeLessThan(1e-4);
  });
});

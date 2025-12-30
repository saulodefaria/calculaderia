import { describe, it, expect } from "vitest";
import {
  calcularComparadorRendaFixa,
  getIrAliquotaRegressiva,
  getIofAliquota,
  annualToDaily,
  type InputsComparadorRendaFixa,
} from "./renda-fixa";

describe("renda-fixa calculator helpers", () => {
  describe("getIrAliquotaRegressiva", () => {
    it("returns 22.5% for <= 180 days", () => {
      expect(getIrAliquotaRegressiva(1)).toBe(22.5);
      expect(getIrAliquotaRegressiva(180)).toBe(22.5);
    });

    it("returns 20% for 181-360 days", () => {
      expect(getIrAliquotaRegressiva(181)).toBe(20);
      expect(getIrAliquotaRegressiva(360)).toBe(20);
    });

    it("returns 17.5% for 361-720 days", () => {
      expect(getIrAliquotaRegressiva(361)).toBe(17.5);
      expect(getIrAliquotaRegressiva(720)).toBe(17.5);
    });

    it("returns 15% for > 720 days", () => {
      expect(getIrAliquotaRegressiva(721)).toBe(15);
      expect(getIrAliquotaRegressiva(1000)).toBe(15);
    });
  });

  describe("getIofAliquota", () => {
    it("returns 0 for day 30", () => {
      expect(getIofAliquota(30)).toBe(0);
    });

    it("returns 0 for >= 30 days", () => {
      expect(getIofAliquota(31)).toBe(0);
      expect(getIofAliquota(100)).toBe(0);
    });

    it("returns correct rate for day 1", () => {
      // Day 1 should have highest IOF rate (96%)
      expect(getIofAliquota(1)).toBe(96);
    });

    it("returns decreasing rates for days 1-29", () => {
      const day1 = getIofAliquota(1);
      const day10 = getIofAliquota(10);
      const day20 = getIofAliquota(20);
      const day29 = getIofAliquota(29);

      expect(day1).toBeGreaterThan(day10);
      expect(day10).toBeGreaterThan(day20);
      expect(day20).toBeGreaterThan(day29);
      expect(day29).toBeGreaterThan(0);
    });
  });

  describe("annualToDaily", () => {
    it("converts annual rate to daily rate correctly", () => {
      const annual = 10; // 10% a.a.
      const daily = annualToDaily(annual);
      // (1.10)^(1/365) - 1 ≈ 0.000261
      expect(daily).toBeCloseTo(0.000261, 6);
    });

    it("handles zero rate", () => {
      expect(annualToDaily(0)).toBe(0);
    });

    it("round-trip conversion is consistent", () => {
      const annual = 12;
      const daily = annualToDaily(annual);
      const backToAnnual = (Math.pow(1 + daily, 365) - 1) * 100;
      expect(backToAnnual).toBeCloseTo(annual, 2);
    });
  });
});

describe("calcularComparadorRendaFixa", () => {
  describe("base calculation without fees/inflation", () => {
    it("calculates correctly for Pré-fixado with 2 years", () => {
      const inputs: InputsComparadorRendaFixa = {
        valor: 10000,
        prazoDias: 730, // 2 years
        preAnual: 10,
        cdiPercent: 100,
        ipcaMaisAnual: 5,
        selicAnual: 10,
        cdiAnual: 10,
        ipcaAnual: 0,
        custodiaAnual: 0,
      };

      const resultado = calcularComparadorRendaFixa(inputs);
      const pre = resultado.opcoes.find((o) => o.tipo === "pre");

      expect(pre).toBeDefined();
      if (!pre) return;

      // Bruto = 10000 * (1.10)^2 = 12100
      expect(pre.valorFinalBruto).toBeCloseTo(12100, 2);
      expect(pre.iof).toBe(0); // >= 30 days
      // Lucro = 12100 - 10000 = 2100
      // IR = 15% (730 days) = 315
      expect(pre.ir).toBeCloseTo(315, 2);
      // Líquido = 10000 + 2100 - 315 = 11785
      expect(pre.valorFinalLiquido).toBeCloseTo(11785, 2);
      expect(pre.rentabilidadeLiquidaPercent).toBeCloseTo(17.85, 2);
    });
  });

  describe("Pré vs CDI equivalence", () => {
    it("produces same results when pre=CDI and cdiPercent=100%", () => {
      const inputs: InputsComparadorRendaFixa = {
        valor: 10000,
        prazoDias: 365,
        preAnual: 10,
        cdiPercent: 100,
        ipcaMaisAnual: 5,
        selicAnual: 10,
        cdiAnual: 10, // Same as preAnual
        ipcaAnual: 0,
        custodiaAnual: 0,
      };

      const resultado = calcularComparadorRendaFixa(inputs);
      const pre = resultado.opcoes.find((o) => o.tipo === "pre");
      const cdi = resultado.opcoes.find((o) => o.tipo === "cdi");

      expect(pre).toBeDefined();
      expect(cdi).toBeDefined();
      if (!pre || !cdi) return;

      // Should have same gross value
      expect(pre.valorFinalBruto).toBeCloseTo(cdi.valorFinalBruto, 2);
      expect(pre.valorFinalLiquido).toBeCloseTo(cdi.valorFinalLiquido, 2);
    });
  });

  describe("IPCA+ real property", () => {
    it("calculates IPCA+ correctly with real return property", () => {
      const inputs: InputsComparadorRendaFixa = {
        valor: 10000,
        prazoDias: 365,
        preAnual: 10,
        cdiPercent: 100,
        ipcaMaisAnual: 5, // 5% real
        selicAnual: 10,
        cdiAnual: 10,
        ipcaAnual: 5, // 5% inflation
        custodiaAnual: 0,
      };

      const resultado = calcularComparadorRendaFixa(inputs);
      const ipca = resultado.opcoes.find((o) => o.tipo === "ipca");

      expect(ipca).toBeDefined();
      if (!ipca) return;

      // Bruto should be approximately P * (1.05) * (1.05) = P * 1.1025
      // Before taxes: 10000 * 1.1025 ≈ 11025
      expect(ipca.valorFinalBruto).toBeCloseTo(11025, 10);

      // Real value before taxes should be approximately P * (1.05) = 10500
      // But we need to account for inflation factor
      const inflFactor = Math.pow(1 + 5 / 100, 365 / 365); // 1.05
      const realBruto = ipca.valorFinalBruto / inflFactor;
      expect(realBruto).toBeCloseTo(10500, 10);
    });
  });

  describe("IOF + IR combination", () => {
    it("applies IOF first, then IR on remaining profit for short term", () => {
      const inputs: InputsComparadorRendaFixa = {
        valor: 10000,
        prazoDias: 10, // < 30 days, so IOF applies
        preAnual: 12, // High rate to ensure profit
        cdiPercent: 100,
        ipcaMaisAnual: 5,
        selicAnual: 10,
        cdiAnual: 10,
        ipcaAnual: 0,
        custodiaAnual: 0,
      };

      const resultado = calcularComparadorRendaFixa(inputs);
      const pre = resultado.opcoes.find((o) => o.tipo === "pre");

      expect(pre).toBeDefined();
      if (!pre) return;

      // Should have IOF > 0
      expect(pre.iof).toBeGreaterThan(0);
      // Should have IR > 0 (22.5% for <= 180 days)
      expect(pre.ir).toBeGreaterThan(0);
      // IOF + IR should be less than gross profit
      const lucroBruto = pre.valorFinalBruto - inputs.valor;
      expect(pre.iof + pre.ir).toBeLessThan(lucroBruto);
    });
  });

  describe("ranking", () => {
    it("ranks options by valorFinalReal (highest first)", () => {
      const inputs: InputsComparadorRendaFixa = {
        valor: 10000,
        prazoDias: 365,
        preAnual: 8, // Lower rate
        cdiPercent: 100,
        ipcaMaisAnual: 6, // Higher real return
        selicAnual: 8,
        cdiAnual: 8,
        ipcaAnual: 5,
        custodiaAnual: 0,
      };

      const resultado = calcularComparadorRendaFixa(inputs);

      // Ranking should be ordered by valorFinalReal descending
      for (let i = 0; i < resultado.ranking.length - 1; i++) {
        const current = resultado.ranking[i];
        const next = resultado.ranking[i + 1];
        const currentOpcao = resultado.opcoes.find((o) => o.tipo === current.tipo);
        const nextOpcao = resultado.opcoes.find((o) => o.tipo === next.tipo);

        expect(currentOpcao?.valorFinalReal).toBeGreaterThanOrEqual(nextOpcao?.valorFinalReal ?? 0);
      }

      // Vencedor should match first in ranking
      expect(resultado.vencedor).toBe(resultado.ranking[0].tipo);
    });

    it("handles tie correctly", () => {
      const inputs: InputsComparadorRendaFixa = {
        valor: 10000,
        prazoDias: 365,
        preAnual: 10,
        cdiPercent: 100,
        ipcaMaisAnual: 0, // No spread, so IPCA+ = IPCA only
        selicAnual: 10, // Same as pre
        cdiAnual: 10, // Same as pre
        ipcaAnual: 0, // No inflation
        custodiaAnual: 0,
      };

      const resultado = calcularComparadorRendaFixa(inputs);

      // If multiple options have same valorFinalReal, should handle gracefully
      expect(resultado.ranking.length).toBe(4);
      // With ipcaAnual=0 and ipcaMaisAnual=0, IPCA+ should also match
      // But since we're comparing real values and there's no inflation, they should be close
      // The winner should be one of the types (or empate if truly equal)
      expect(["pre", "cdi", "selic", "ipca", "empate"]).toContain(resultado.vencedor);
    });
  });

  describe("custodia fees", () => {
    it("reduces final value when custodia > 0", () => {
      const inputsWithoutFee: InputsComparadorRendaFixa = {
        valor: 10000,
        prazoDias: 365,
        preAnual: 10,
        cdiPercent: 100,
        ipcaMaisAnual: 5,
        selicAnual: 10,
        cdiAnual: 10,
        ipcaAnual: 0,
        custodiaAnual: 0,
      };

      const inputsWithFee: InputsComparadorRendaFixa = {
        ...inputsWithoutFee,
        custodiaAnual: 0.5, // 0.5% a.a.
      };

      const resultadoSemFee = calcularComparadorRendaFixa(inputsWithoutFee);
      const resultadoComFee = calcularComparadorRendaFixa(inputsWithFee);

      const preSemFee = resultadoSemFee.opcoes.find((o) => o.tipo === "pre");
      const preComFee = resultadoComFee.opcoes.find((o) => o.tipo === "pre");

      expect(preSemFee).toBeDefined();
      expect(preComFee).toBeDefined();
      if (!preSemFee || !preComFee) return;

      // With fee should have lower final value
      expect(preComFee.valorFinalLiquido).toBeLessThan(preSemFee.valorFinalLiquido);
    });
  });

  describe("evolution series", () => {
    it("generates evolution series for chart", () => {
      const inputs: InputsComparadorRendaFixa = {
        valor: 10000,
        prazoDias: 365,
        preAnual: 10,
        cdiPercent: 100,
        ipcaMaisAnual: 5,
        selicAnual: 10,
        cdiAnual: 10,
        ipcaAnual: 5,
        custodiaAnual: 0,
      };

      const resultado = calcularComparadorRendaFixa(inputs);
      const pre = resultado.opcoes.find((o) => o.tipo === "pre");

      expect(pre).toBeDefined();
      if (!pre) return;

      expect(pre.evolucao).toBeDefined();
      expect(pre.evolucao.length).toBeGreaterThan(0);

      // First entry should be close to initial value
      expect(pre.evolucao[0].valorLiquido).toBeCloseTo(inputs.valor, 2);
      // Last entry should match final value
      const last = pre.evolucao[pre.evolucao.length - 1];
      expect(last.valorLiquido).toBeCloseTo(pre.valorFinalLiquido, 2);
      expect(last.valorReal).toBeCloseTo(pre.valorFinalReal, 2);
    });
  });

  describe("edge cases", () => {
    it("handles zero initial value", () => {
      const inputs: InputsComparadorRendaFixa = {
        valor: 0,
        prazoDias: 365,
        preAnual: 10,
        cdiPercent: 100,
        ipcaMaisAnual: 5,
        selicAnual: 10,
        cdiAnual: 10,
        ipcaAnual: 0,
        custodiaAnual: 0,
      };

      const resultado = calcularComparadorRendaFixa(inputs);

      resultado.opcoes.forEach((opcao) => {
        expect(opcao.valorFinalBruto).toBe(0);
        expect(opcao.valorFinalLiquido).toBe(0);
        expect(opcao.iof).toBe(0);
        expect(opcao.ir).toBe(0);
      });
    });

    it("handles negative profit (loss)", () => {
      // This shouldn't happen with normal rates, but test edge case
      const inputs: InputsComparadorRendaFixa = {
        valor: 10000,
        prazoDias: 1, // Very short term
        preAnual: 0, // Zero rate
        cdiPercent: 100,
        ipcaMaisAnual: 0,
        selicAnual: 0,
        cdiAnual: 0,
        ipcaAnual: 0,
        custodiaAnual: 0.1, // Fee might cause loss
      };

      const resultado = calcularComparadorRendaFixa(inputs);

      // IOF and IR should be 0 if profit is negative
      resultado.opcoes.forEach((opcao) => {
        const lucro = opcao.valorFinalBruto - inputs.valor;
        if (lucro <= 0) {
          expect(opcao.iof).toBe(0);
          expect(opcao.ir).toBe(0);
        }
      });
    });
  });
});

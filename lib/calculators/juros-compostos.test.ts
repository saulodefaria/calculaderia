import { describe, it, expect } from "vitest";
import { round2 } from "../utils";
import { calcularJurosCompostos, type InputsJurosCompostos } from "./juros-compostos";

describe("calcularJurosCompostos", () => {
  describe("basic compound interest without contributions", () => {
    it("calculates simple compound interest for 1 period", () => {
      const inputs: InputsJurosCompostos = {
        valorInicial: 1000,
        taxaJuros: 1, // 1% per period
        periodo: "mensal",
        aportes: 0,
        quantidadePeriodos: 1,
      };

      const resultado = calcularJurosCompostos(inputs);

      expect(resultado.valorInicial).toBe(1000);
      expect(resultado.totalAportes).toBe(0);
      expect(resultado.valorFinal).toBeCloseTo(1010, 2); // 1000 * 1.01
      expect(resultado.totalJuros).toBeCloseTo(10, 2);
      expect(resultado.evolucao).toHaveLength(1);
      expect(resultado.evolucao[0].periodo).toBe(1);
      expect(resultado.evolucao[0].valorInicial).toBe(1000);
      expect(resultado.evolucao[0].aporte).toBe(0);
      expect(resultado.evolucao[0].juros).toBeCloseTo(10, 2);
      expect(resultado.evolucao[0].valorFinal).toBeCloseTo(1010, 2);
    });

    it("calculates compound interest for multiple periods", () => {
      const inputs: InputsJurosCompostos = {
        valorInicial: 1000,
        taxaJuros: 1, // 1% per period
        periodo: "mensal",
        aportes: 0,
        quantidadePeriodos: 12,
      };

      const resultado = calcularJurosCompostos(inputs);

      expect(resultado.valorInicial).toBe(1000);
      expect(resultado.totalAportes).toBe(0);
      // FV = 1000 * (1.01)^12 ≈ 1126.83
      expect(resultado.valorFinal).toBeCloseTo(1126.83, 1);
      expect(resultado.totalJuros).toBeCloseTo(126.83, 1);
      expect(resultado.evolucao).toHaveLength(12);

      // Check first period
      expect(resultado.evolucao[0].periodo).toBe(1);
      expect(resultado.evolucao[0].valorInicial).toBe(1000);
      expect(resultado.evolucao[0].valorFinal).toBeCloseTo(1010, 2);

      // Check last period
      expect(resultado.evolucao[11].periodo).toBe(12);
      expect(resultado.evolucao[11].valorFinal).toBeCloseTo(1126.83, 1);
    });

    it("handles zero interest rate", () => {
      const inputs: InputsJurosCompostos = {
        valorInicial: 1000,
        taxaJuros: 0,
        periodo: "mensal",
        aportes: 0,
        quantidadePeriodos: 12,
      };

      const resultado = calcularJurosCompostos(inputs);

      expect(resultado.valorFinal).toBe(1000);
      expect(resultado.totalJuros).toBe(0);
      expect(resultado.evolucao.every((e) => e.valorFinal === 1000)).toBe(true);
    });
  });

  describe("compound interest with fixed periodic contributions", () => {
    it("calculates with monthly contributions", () => {
      const inputs: InputsJurosCompostos = {
        valorInicial: 1000,
        taxaJuros: 1, // 1% per period
        periodo: "mensal",
        aportes: 100, // 100 per month
        quantidadePeriodos: 3,
      };

      const resultado = calcularJurosCompostos(inputs);

      expect(resultado.valorInicial).toBe(1000);
      expect(resultado.totalAportes).toBe(300); // 3 * 100
      expect(resultado.evolucao).toHaveLength(3);

      // Period 1: (1000 * 1.01) + 100 = 1110
      expect(resultado.evolucao[0].valorInicial).toBe(1000);
      expect(resultado.evolucao[0].aporte).toBe(100);
      expect(resultado.evolucao[0].juros).toBeCloseTo(10, 2);
      expect(resultado.evolucao[0].valorFinal).toBeCloseTo(1110, 2);

      // Period 2: (1110 * 1.01) + 100 = 1221.10
      expect(resultado.evolucao[1].valorInicial).toBeCloseTo(1110, 2);
      expect(resultado.evolucao[1].aporte).toBe(100);
      expect(resultado.evolucao[1].juros).toBeCloseTo(11.1, 2);
      expect(resultado.evolucao[1].valorFinal).toBeCloseTo(1221.1, 2);

      // Period 3: (1221.1 * 1.01) + 100 = 1333.31
      expect(resultado.evolucao[2].valorInicial).toBeCloseTo(1221.1, 2);
      expect(resultado.evolucao[2].aporte).toBe(100);
      expect(resultado.evolucao[2].juros).toBeCloseTo(12.21, 2);
      expect(resultado.evolucao[2].valorFinal).toBeCloseTo(1333.31, 2);

      expect(resultado.valorFinal).toBeCloseTo(1333.31, 2);
      expect(resultado.totalJuros).toBeCloseTo(33.31, 2); // 10 + 11.1 + 12.21
    });

    it("handles zero contributions", () => {
      const inputs: InputsJurosCompostos = {
        valorInicial: 1000,
        taxaJuros: 1,
        periodo: "mensal",
        aportes: 0,
        quantidadePeriodos: 12,
      };

      const resultado = calcularJurosCompostos(inputs);

      expect(resultado.totalAportes).toBe(0);
      expect(resultado.evolucao.every((e) => e.aporte === 0)).toBe(true);
    });
  });

  describe("different period types", () => {
    it("calculates correctly for anual period", () => {
      const inputs: InputsJurosCompostos = {
        valorInicial: 1000,
        taxaJuros: 10, // 10% per year
        periodo: "anual",
        aportes: 0,
        quantidadePeriodos: 3,
      };

      const resultado = calcularJurosCompostos(inputs);

      // FV = 1000 * (1.10)^3 = 1331
      expect(resultado.valorFinal).toBeCloseTo(1331, 2);
      expect(resultado.evolucao).toHaveLength(3);
    });

    it("calculates correctly for anual period with contributions", () => {
      const inputs: InputsJurosCompostos = {
        valorInicial: 10000,
        taxaJuros: 10, // 10% per year
        periodo: "anual",
        aportes: 1000, // 1000 per year
        quantidadePeriodos: 5,
      };

      const resultado = calcularJurosCompostos(inputs);

      expect(resultado.valorInicial).toBe(10000);
      expect(resultado.totalAportes).toBe(5000); // 5 * 1000
      expect(resultado.evolucao).toHaveLength(5);

      // Year 1: (10000 * 1.10) + 1000 = 12000
      expect(resultado.evolucao[0].valorFinal).toBeCloseTo(12000, 2);
    });
  });

  describe("edge cases", () => {
    it("handles zero initial value", () => {
      const inputs: InputsJurosCompostos = {
        valorInicial: 0,
        taxaJuros: 1,
        periodo: "mensal",
        aportes: 100,
        quantidadePeriodos: 3,
      };

      const resultado = calcularJurosCompostos(inputs);

      expect(resultado.valorInicial).toBe(0);
      expect(resultado.totalAportes).toBe(300);
      // Only contributions with interest
      expect(resultado.evolucao[0].valorFinal).toBeCloseTo(100, 2);
      expect(resultado.evolucao[1].valorFinal).toBeCloseTo(201, 2);
      expect(resultado.evolucao[2].valorFinal).toBeCloseTo(303.01, 2);
    });

    it("handles zero periods", () => {
      const inputs: InputsJurosCompostos = {
        valorInicial: 1000,
        taxaJuros: 1,
        periodo: "mensal",
        aportes: 100,
        quantidadePeriodos: 0,
      };

      const resultado = calcularJurosCompostos(inputs);

      expect(resultado.valorFinal).toBe(1000);
      expect(resultado.totalAportes).toBe(0);
      expect(resultado.totalJuros).toBe(0);
      expect(resultado.evolucao).toHaveLength(0);
    });

    it("handles large number of periods", () => {
      const inputs: InputsJurosCompostos = {
        valorInicial: 1000,
        taxaJuros: 0.5, // 0.5% per month
        periodo: "mensal",
        aportes: 0,
        quantidadePeriodos: 120, // 10 years
      };

      const resultado = calcularJurosCompostos(inputs);

      expect(resultado.evolucao).toHaveLength(120);
      expect(resultado.valorFinal).toBeGreaterThan(1000);
      // FV = 1000 * (1.005)^120 ≈ 1819.40
      expect(resultado.valorFinal).toBeCloseTo(1819.4, 1);
    });
  });

  describe("period-by-period evolution", () => {
    it("ensures each period builds on the previous", () => {
      const inputs: InputsJurosCompostos = {
        valorInicial: 1000,
        taxaJuros: 1,
        periodo: "mensal",
        aportes: 100,
        quantidadePeriodos: 5,
      };

      const resultado = calcularJurosCompostos(inputs);

      for (let i = 1; i < resultado.evolucao.length; i++) {
        const prev = resultado.evolucao[i - 1];
        const curr = resultado.evolucao[i];

        // Current period's initial value should equal previous period's final value
        expect(curr.valorInicial).toBeCloseTo(prev.valorFinal, 2);
      }
    });

    it("calculates interest correctly for each period", () => {
      const inputs: InputsJurosCompostos = {
        valorInicial: 1000,
        taxaJuros: 1, // 1%
        periodo: "mensal",
        aportes: 0,
        quantidadePeriodos: 3,
      };

      const resultado = calcularJurosCompostos(inputs);

      // Interest should be calculated on valorInicial of each period
      resultado.evolucao.forEach((periodo) => {
        const expectedJuros = round2(periodo.valorInicial * (inputs.taxaJuros / 100));
        expect(periodo.juros).toBeCloseTo(expectedJuros, 2);
        expect(periodo.valorFinal).toBeCloseTo(periodo.valorInicial + periodo.juros + periodo.aporte, 2);
      });
    });
  });
});

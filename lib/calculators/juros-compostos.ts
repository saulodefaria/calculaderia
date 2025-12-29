import { round2 } from "../utils";

// ==========================
// Types
// ==========================

export type PeriodoJurosCompostos = "mensal" | "anual";

export const PERIODO_JUROS_COMPOSTOS_LABELS: Record<PeriodoJurosCompostos, string> = {
  mensal: "Mensal",
  anual: "Anual",
};

export const PERIODO_JUROS_COMPOSTOS_NAMES: Record<PeriodoJurosCompostos, { singular: string; plural: string }> = {
  mensal: { singular: "mês", plural: "meses" },
  anual: { singular: "ano", plural: "anos" },
};

export interface InputsJurosCompostos {
  valorInicial: number;
  taxaJuros: number; // Percentage (e.g., 1.5 for 1.5%)
  periodo: PeriodoJurosCompostos;
  aportes: number; // Fixed periodic contribution (can be 0)
  quantidadePeriodos: number;
}

export interface PeriodoEvolucao {
  periodo: number;
  valorInicial: number;
  aporte: number;
  juros: number;
  valorFinal: number;
}

export interface ResultadoJurosCompostos {
  valorInicial: number;
  totalAportes: number;
  totalJuros: number;
  valorFinal: number;
  evolucao: PeriodoEvolucao[];
}

// ==========================
// Main Calculation Function
// ==========================

/**
 * Calcula juros compostos com aportes periódicos fixos
 *
 * Fórmula para cada período:
 * - Juros = ValorInicial × (taxaJuros / 100)
 * - ValorFinal = ValorInicial + Juros + Aporte
 * - ValorInicial do próximo período = ValorFinal do período anterior
 *
 * @param inputs Parâmetros de entrada
 * @returns Resultado com evolução período a período
 */
export function calcularJurosCompostos(inputs: InputsJurosCompostos): ResultadoJurosCompostos {
  const { valorInicial, taxaJuros, aportes, quantidadePeriodos } = inputs;

  // Handle edge case: zero periods
  if (quantidadePeriodos <= 0) {
    return {
      valorInicial,
      totalAportes: 0,
      totalJuros: 0,
      valorFinal: valorInicial,
      evolucao: [],
    };
  }

  const evolucao: PeriodoEvolucao[] = [];
  let valorAtual = valorInicial;
  let totalJuros = 0;
  const taxaDecimal = taxaJuros / 100; // Convert percentage to decimal

  for (let periodo = 1; periodo <= quantidadePeriodos; periodo++) {
    const valorInicialPeriodo = valorAtual;
    const juros = round2(valorInicialPeriodo * taxaDecimal);
    const valorFinalPeriodo = round2(valorInicialPeriodo + juros + aportes);

    evolucao.push({
      periodo,
      valorInicial: valorInicialPeriodo,
      aporte: aportes,
      juros,
      valorFinal: valorFinalPeriodo,
    });

    totalJuros = round2(totalJuros + juros);
    valorAtual = valorFinalPeriodo;
  }

  const totalAportes = round2(aportes * quantidadePeriodos);

  return {
    valorInicial,
    totalAportes,
    totalJuros,
    valorFinal: valorAtual,
    evolucao,
  };
}

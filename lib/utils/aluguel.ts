import { round2 } from "./math";

/**
 * Calcula o valor do aluguel corrigido para um mês específico.
 *
 * Usa o modelo de "degraus anuais": o aluguel se mantém constante por 12 meses,
 * e no mês 13, 25, 37... é aplicada a correção anual (IGPM).
 *
 * @param mes - Mês (1-indexado)
 * @param aluguelMensal - Valor do aluguel no mês 1 (sem correção)
 * @param correcaoAnualAluguel - Percentual de correção anual (ex: 6 para 6%)
 * @returns Valor do aluguel corrigido para o mês
 *
 * @example
 * // Aluguel de R$ 2.000 com IGPM de 6% a.a.
 * getAluguelCorrigidoNoMes(1, 2000, 6)   // R$ 2.000,00 (meses 1-12)
 * getAluguelCorrigidoNoMes(13, 2000, 6)  // R$ 2.120,00 (meses 13-24)
 * getAluguelCorrigidoNoMes(25, 2000, 6)  // R$ 2.247,20 (meses 25-36)
 */
export function getAluguelCorrigidoNoMes(
  mes: number,
  aluguelMensal: number,
  correcaoAnualAluguel: number
): number {
  if (mes < 1 || aluguelMensal <= 0) {
    return 0;
  }

  // Calcula quantos anos completos se passaram (0 para meses 1-12, 1 para 13-24, etc.)
  const anoIndex = Math.floor((mes - 1) / 12);

  // Aplica a correção composta para cada ano completo
  const fatorCorrecao = Math.pow(1 + correcaoAnualAluguel / 100, anoIndex);

  return round2(aluguelMensal * fatorCorrecao);
}


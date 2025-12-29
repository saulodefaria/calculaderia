// ==========================
// Math helpers
// ==========================

/**
 * Arredonda valores monetários para 2 casas decimais
 * Usa Number.EPSILON para evitar problemas de ponto flutuante
 */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Converts annual effective rate to monthly equivalent rate.
 */
export function convertAnnualRateToMonthlyRate(annualRate: number): number {
  return Math.pow(1 + annualRate / 100, 1 / 12) - 1;
}

/**
 * Converts monthly effective rate to annual equivalent rate.
 */
export function convertMonthlyRateToAnnualRate(monthlyRate: number): number {
  return Math.pow(1 + monthlyRate, 12) - 1;
}

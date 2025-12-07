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

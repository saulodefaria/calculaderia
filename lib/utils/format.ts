// ==========================
// Currency helpers
// ==========================

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formata um número como moeda brasileira (R$ 1.234,56)
 */
export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return currencyFormatter.format(0);
  // Garante sempre 2 casas decimais na apresentação,
  // mesmo que o número interno venha com mais casas.
  const rounded = Number(value.toFixed(2));
  return currencyFormatter.format(rounded);
}

/**
 * Formata um número como porcentagem (ex: 6 -> "6,00%")
 */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

/**
 * Parseia uma string de moeda digitada pelo usuário para número
 * Aceita formatos como "1.234,56" ou "1234.56"
 */
export function parseCurrencyInput(value: string): number {
  // Remove everything except digits and comma/period
  const cleaned = value.replace(/[^\d,.-]/g, "");
  // Replace comma with period for parsing
  const normalized = cleaned.replace(",", ".");
  return parseFloat(normalized) || 0;
}

/**
 * Formats a free-typed currency input (without prefix) as "1.234,56".
 * Used for controlled text inputs.
 */
export function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";

  const number = parseInt(digits, 10);

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number / 100);
}

/**
 * Formats a number to a pt-BR currency string without prefix (e.g. "1.234,56").
 * Useful to pre-fill inputs from numeric state.
 */
export function formatCurrencyFromNumber(value: number): string {
  if (!value || value <= 0) return "";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Parses a currency string in the format "1.234,56" into a number.
 * Removes thousand separators and converts the decimal comma to a dot.
 */
export function parseCurrencyValue(formatted: string): number {
  if (!formatted) return 0;
  const cleaned = formatted.replace(/\./g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

// ==========================
// Percent helpers
// ==========================

/**
 * Formats a free-typed percent input (no % sign) keeping only digits and a single comma.
 */
export function formatPercentInput(value: string): string {
  const cleaned = value.replace(/[^\d,]/g, "");
  const parts = cleaned.split(",");
  if (parts.length > 2) {
    return parts[0] + "," + parts.slice(1).join("");
  }
  return cleaned;
}

/**
 * Formats a numeric percent value (e.g. 6) into "6,0" style string for inputs.
 */
export function formatPercentFromNumber(value: number): string {
  if (!value || value <= 0) return "";
  return value.toString().replace(".", ",");
}

/**
 * Parses a percent string in the "6,5" style into a number (6.5).
 */
export function parsePercentValue(formatted: string): number {
  if (!formatted) return 0;
  const cleaned = formatted.replace(",", ".");
  return parseFloat(cleaned) || 0;
}

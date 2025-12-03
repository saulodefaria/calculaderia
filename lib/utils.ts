import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ==========================
// Currency helpers
// ==========================

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return currencyFormatter.format(0);
  // Garante sempre 2 casas decimais na apresentação,
  // mesmo que o número interno venha com mais casas.
  const rounded = Number(value.toFixed(2));
  return currencyFormatter.format(rounded);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

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

// ==========================
// Math helpers
// ==========================

/**
 * Arredonda valores monetários para 2 casas decimais
 */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// ==========================
// IRR / TIR helpers
// ==========================

/**
 * Calcula o NPV (Valor Presente Líquido) de uma série de fluxos de caixa
 * para uma taxa de retorno periódica.
 *
 * Observação: assumimos períodos igualmente espaçados (mensais neste projeto)
 * e consideramos o primeiro fluxo no período 1 (mês 1), não no tempo 0.
 */
function npv(rate: number, cashflows: number[]): number {
  let total = 0;
  for (let i = 0; i < cashflows.length; i++) {
    const t = i + 1;
    total += cashflows[i] / Math.pow(1 + rate, t);
  }
  return total;
}

/**
 * Calcula a TIR (IRR) periódica de uma série de fluxos de caixa.
 *
 * - Retorna a taxa por período (no nosso caso, ao mês), como número decimal
 *   (ex: 0.01 = 1% ao mês).
 * - Retorna null se não houver mudança de sinal (todos fluxos positivos ou todos negativos)
 *   ou se não for possível encontrar uma raiz no intervalo pesquisado.
 *
 * Implementação: método da bisseção em um intervalo de taxas razoável.
 */
export function calculateIrr(cashflows: number[]): number | null {
  if (!cashflows.length) return null;

  const minCf = Math.min(...cashflows);
  const maxCf = Math.max(...cashflows);

  // Precisa ter pelo menos um fluxo negativo e um positivo
  if (!(minCf < 0 && maxCf > 0)) {
    return null;
  }

  // Intervalo de busca:
  // - limite inferior: taxa um pouco acima de -100% para evitar divisão por zero
  // - limite superior: taxa muito alta por período (ex: 100% ao mês)
  // Esses limites são suficientes para cenários de consórcio/financiamento.
  let low = -0.9999;
  let high = 1.0;

  // Garante que existe mudança de sinal no intervalo [low, high]
  let npvLow = npv(low, cashflows);
  let npvHigh = npv(high, cashflows);

  // Se não houver mudança de sinal, vamos tentar expandir o intervalo para cima
  if (npvLow * npvHigh > 0) {
    const maxHigh = 5.0; // 500% ao mês, bem acima de qualquer cenário realista
    while (high < maxHigh && npvLow * npvHigh > 0) {
      high *= 1.5;
      npvHigh = npv(high, cashflows);
    }

    // Se ainda assim não houver mudança de sinal, desistimos
    if (npvLow * npvHigh > 0) {
      return null;
    }
  }

  const tolerance = 1e-7;
  const maxIterations = 200;

  for (let i = 0; i < maxIterations; i++) {
    const mid = (low + high) / 2;
    const npvMid = npv(mid, cashflows);

    if (Math.abs(npvMid) < tolerance) {
      return mid;
    }

    // Decide em qual subintervalo está a raiz
    if (npvLow * npvMid < 0) {
      high = mid;
      npvHigh = npvMid;
    } else {
      low = mid;
      npvLow = npvMid;
    }
  }

  // Se não convergiu exatamente, devolve o meio do intervalo como aproximação
  return (low + high) / 2;
}

/**
 * Converte uma taxa mensal em taxa anual equivalente:
 * (1 + r_mensal)^12 - 1
 */
export function irrMonthlyToAnnual(irrMonthly: number): number {
  return Math.pow(1 + irrMonthly, 12) - 1;
}

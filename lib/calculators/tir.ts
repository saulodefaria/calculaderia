import { calculateIrr } from "../utils/irr";

// ==========================
// Types
// ==========================

export type PeriodoTir = "mensal" | "trimestral" | "semestral" | "anual";

export interface InputsTir {
  cashflows: number[];
  periodo: PeriodoTir;
}

export interface ResultadoTir {
  tirPeriodica: number | null; // IRR in the selected period (decimal, e.g., 0.025 = 2.5%)
  tirAnual: number | null; // Equivalent annual IRR (decimal)
  totalFluxos: number; // Sum of all cash flows
  totalPositivos: number; // Sum of positive cash flows
  totalNegativos: number; // Sum of negative cash flows (absolute value)
  quantidadePeriodos: number; // Number of periods
  erroCode?: TirErrorCode; // Error code (for localized display in UI)
}

export type TirErrorCode = "min_cashflows" | "needs_positive_and_negative" | "cannot_calculate";

// ==========================
// Constants
// ==========================

export const PERIODO_LABELS: Record<PeriodoTir, string> = {
  mensal: "Mensal",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};

export const PERIODO_SUFFIX: Record<PeriodoTir, string> = {
  mensal: "a.m.",
  trimestral: "a.t.",
  semestral: "a.s.",
  anual: "a.a.",
};

// Number of periods per year for each type
const PERIODOS_POR_ANO: Record<PeriodoTir, number> = {
  mensal: 12,
  trimestral: 4,
  semestral: 2,
  anual: 1,
};

// ==========================
// Helpers
// ==========================

/**
 * Converts a periodic rate to equivalent annual rate
 * (1 + r_periodo)^n - 1
 */
export function taxaPeriodicaParaAnual(taxaPeriodica: number, periodo: PeriodoTir): number {
  const n = PERIODOS_POR_ANO[periodo];
  return Math.pow(1 + taxaPeriodica, n) - 1;
}

/**
 * Converts an annual rate to equivalent periodic rate
 * (1 + r_anual)^(1/n) - 1
 */
export function taxaAnualParaPeriodica(taxaAnual: number, periodo: PeriodoTir): number {
  const n = PERIODOS_POR_ANO[periodo];
  return Math.pow(1 + taxaAnual, 1 / n) - 1;
}

// ==========================
// Cashflow parsing
// ==========================

/**
 * Detects the decimal separator used in a numeric string.
 * Returns 'comma' for BR format (1.234,56) or 'dot' for US format (1,234.56)
 */
function detectDecimalSeparator(value: string): "comma" | "dot" {
  // Remove spaces
  const cleaned = value.trim();

  // If comma comes after dot, probably BR format (1.234,56)
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  if (lastComma > lastDot && lastComma !== -1) {
    return "comma";
  }
  if (lastDot > lastComma && lastDot !== -1) {
    return "dot";
  }

  // Default to comma (BR format)
  return "comma";
}

/**
 * Parseia uma string numérica para número, detectando automaticamente o formato
 * Aceita: -1234.56, -1234,56, -1.234,56, -1,234.56
 */
export function parseCashflowValue(value: string): number | null {
  if (!value || value.trim() === "") return null;

  let cleaned = value.trim();

  // Detect if negative
  const isNegative = cleaned.startsWith("-");
  if (isNegative) {
    cleaned = cleaned.substring(1);
  }

  // Remove spaces and non-numeric characters except . and ,
  cleaned = cleaned.replace(/[^\d.,]/g, "");

  if (!cleaned) return null;

  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  let numberStr: string;

  if (hasComma && !hasDot) {
    // Could be US format with thousand separator (e.g., 1,234) OR BR format with decimal (e.g., 12,34)
    // Heuristic: if it follows thousand grouping, remove commas; otherwise, treat comma as decimal.
    const isThousandGrouping = /^\d{1,3}(,\d{3})+$/.test(cleaned);
    numberStr = isThousandGrouping ? cleaned.replace(/,/g, "") : cleaned.replace(/,/g, ".");
  } else if (hasDot && !hasComma) {
    // Could be BR format with thousand separator (e.g., 1.234) OR decimal with dot (e.g., 12.34)
    const isThousandGrouping = /^\d{1,3}(\.\d{3})+$/.test(cleaned);
    numberStr = isThousandGrouping ? cleaned.replace(/\./g, "") : cleaned;
  } else {
    // Both present: decide decimal separator based on last separator
    const separator = detectDecimalSeparator(cleaned);
    if (separator === "comma") {
      // BR format: 1.234,56 -> 1234.56
      numberStr = cleaned.replace(/\./g, "").replace(/,/g, ".");
    } else {
      // US format: 1,234.56 -> 1234.56
      numberStr = cleaned.replace(/,/g, "");
    }
  }

  // Parse estrito: rejeita strings que seriam parcialmente interpretadas pelo parseFloat (ex: "1.12.23")
  const isValidNumber = /^(?:\d+|\d*\.\d+)$/.test(numberStr);
  if (!isValidNumber) return null;

  const parsed = Number(numberStr);
  if (!Number.isFinite(parsed)) return null;

  return isNegative ? -parsed : parsed;
}

/**
 * Parses a string with multiple values (pasted from spreadsheet) into array of numbers
 * Accepts separators: newline, tab, comma, semicolon
 */
export function parseCashflowsFromText(text: string): { values: number[]; errors: number[] } {
  if (!text || text.trim() === "") {
    return { values: [], errors: [] };
  }

  const trimmed = text.trim();

  // Detect which separator is being used
  // Priority: newline > tab > semicolon > comma
  let separator: RegExp | null = null;

  if (trimmed.includes("\n")) {
    separator = /\n+/;
  } else if (trimmed.includes("\t")) {
    separator = /\t+/;
  } else if (trimmed.includes(";")) {
    separator = /;+/;
  } else {
    // Without "strong" separator: first try to interpret as a single number
    const single = parseCashflowValue(trimmed);
    if (single !== null) {
      return { values: [single], errors: [] };
    }

    // If not a single number, allow comma-separated list
    if (trimmed.includes(",")) {
      separator = /,+/;
    } else {
      return { values: [], errors: [0] };
    }
  }

  if (!separator) {
    return { values: [], errors: [0] };
  }

  const parts = trimmed
    .split(separator)
    .map((s) => s.trim())
    .filter((s) => s !== "");
  const values: number[] = [];
  const errors: number[] = [];

  parts.forEach((part, index) => {
    const parsed = parseCashflowValue(part);
    if (parsed !== null) {
      values.push(parsed);
    } else {
      errors.push(index);
    }
  });

  return { values, errors };
}

// ==========================
// Validation
// ==========================

export interface ValidacaoCashflows {
  valido: boolean;
  erroCode?: TirErrorCode;
}

export function validarCashflows(cashflows: number[]): ValidacaoCashflows {
  if (cashflows.length < 2) {
    return {
      valido: false,
      erroCode: "min_cashflows",
    };
  }

  const hasPositive = cashflows.some((cf) => cf > 0);
  const hasNegative = cashflows.some((cf) => cf < 0);

  if (!hasPositive || !hasNegative) {
    return {
      valido: false,
      erroCode: "needs_positive_and_negative",
    };
  }

  return { valido: true };
}

// ==========================
// Main calculation
// ==========================

export function calcularTir(inputs: InputsTir): ResultadoTir {
  const { cashflows, periodo } = inputs;

  // Calculate basic statistics
  const totalFluxos = cashflows.reduce((sum, cf) => sum + cf, 0);
  const totalPositivos = cashflows.filter((cf) => cf > 0).reduce((sum, cf) => sum + cf, 0);
  const totalNegativos = Math.abs(cashflows.filter((cf) => cf < 0).reduce((sum, cf) => sum + cf, 0));
  const quantidadePeriodos = cashflows.length;

  // Validate cashflows
  const validacao = validarCashflows(cashflows);
  if (!validacao.valido) {
    return {
      tirPeriodica: null,
      tirAnual: null,
      totalFluxos,
      totalPositivos,
      totalNegativos,
      quantidadePeriodos,
      erroCode: validacao.erroCode,
    };
  }

  // Calculate IRR
  const tirPeriodica = calculateIrr(cashflows);

  if (tirPeriodica === null) {
    return {
      tirPeriodica: null,
      tirAnual: null,
      totalFluxos,
      totalPositivos,
      totalNegativos,
      quantidadePeriodos,
      erroCode: "cannot_calculate",
    };
  }

  // Convert to annual
  const tirAnual = taxaPeriodicaParaAnual(tirPeriodica, periodo);

  return {
    tirPeriodica,
    tirAnual,
    totalFluxos,
    totalPositivos,
    totalNegativos,
    quantidadePeriodos,
  };
}

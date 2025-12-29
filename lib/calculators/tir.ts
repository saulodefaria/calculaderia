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
  tirPeriodica: number | null; // TIR no período selecionado (decimal, ex: 0.025 = 2.5%)
  tirAnual: number | null; // TIR anual equivalente (decimal)
  totalFluxos: number; // Soma de todos os fluxos
  totalPositivos: number; // Soma dos fluxos positivos
  totalNegativos: number; // Soma dos fluxos negativos (valor absoluto)
  quantidadePeriodos: number; // Quantidade de períodos
  erro?: string; // Mensagem de erro se houver
}

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

// Número de períodos por ano para cada tipo
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
 * Converte uma taxa periódica para taxa anual equivalente
 * (1 + r_periodo)^n - 1
 */
export function taxaPeriodicaParaAnual(taxaPeriodica: number, periodo: PeriodoTir): number {
  const n = PERIODOS_POR_ANO[periodo];
  return Math.pow(1 + taxaPeriodica, n) - 1;
}

/**
 * Converte uma taxa anual para taxa periódica equivalente
 * (1 + r_anual)^(1/n) - 1
 */
export function taxaAnualParaPeriodica(taxaAnual: number, periodo: PeriodoTir): number {
  const n = PERIODOS_POR_ANO[periodo];
  return Math.pow(1 + taxaAnual, 1 / n) - 1;
}

// ==========================
// Parsing de cashflows
// ==========================

/**
 * Detecta o separador decimal usado em uma string numérica.
 * Retorna 'comma' para formato BR (1.234,56) ou 'dot' para formato US (1,234.56)
 */
function detectDecimalSeparator(value: string): "comma" | "dot" {
  // Remove espaços
  const cleaned = value.trim();

  // Se tem vírgula após ponto, provavelmente é BR (1.234,56)
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  if (lastComma > lastDot && lastComma !== -1) {
    return "comma";
  }
  if (lastDot > lastComma && lastDot !== -1) {
    return "dot";
  }

  // Default para vírgula (formato BR)
  return "comma";
}

/**
 * Parseia uma string numérica para número, detectando automaticamente o formato
 * Aceita: -1234.56, -1234,56, -1.234,56, -1,234.56
 */
export function parseCashflowValue(value: string): number | null {
  if (!value || value.trim() === "") return null;

  let cleaned = value.trim();

  // Detecta se é negativo
  const isNegative = cleaned.startsWith("-");
  if (isNegative) {
    cleaned = cleaned.substring(1);
  }

  // Remove espaços e caracteres não numéricos exceto . e ,
  cleaned = cleaned.replace(/[^\d.,]/g, "");

  if (!cleaned) return null;

  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  let numberStr: string;

  if (hasComma && !hasDot) {
    // Pode ser formato US com separador de milhar (ex: 1,234) OU formato BR com decimal (ex: 12,34)
    // Heurística: se segue agrupamento de milhar, removemos as vírgulas; caso contrário, tratamos vírgula como decimal.
    const isThousandGrouping = /^\d{1,3}(,\d{3})+$/.test(cleaned);
    numberStr = isThousandGrouping ? cleaned.replace(/,/g, "") : cleaned.replace(/,/g, ".");
  } else if (hasDot && !hasComma) {
    // Pode ser formato BR com separador de milhar (ex: 1.234) OU decimal com ponto (ex: 12.34)
    const isThousandGrouping = /^\d{1,3}(\.\d{3})+$/.test(cleaned);
    numberStr = isThousandGrouping ? cleaned.replace(/\./g, "") : cleaned;
  } else {
    // Ambos presentes: decide pelo separador decimal baseado no último separador
    const separator = detectDecimalSeparator(cleaned);
    if (separator === "comma") {
      // Formato BR: 1.234,56 -> 1234.56
      numberStr = cleaned.replace(/\./g, "").replace(/,/g, ".");
    } else {
      // Formato US: 1,234.56 -> 1234.56
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
 * Parseia uma string com múltiplos valores (colada de planilha) para array de números
 * Aceita separadores: newline, tab, vírgula, ponto-e-vírgula
 */
export function parseCashflowsFromText(text: string): { values: number[]; errors: number[] } {
  if (!text || text.trim() === "") {
    return { values: [], errors: [] };
  }

  const trimmed = text.trim();

  // Detecta qual separador está sendo usado
  // Prioridade: newline > tab > ponto-e-vírgula > vírgula
  let separator: RegExp | null = null;

  if (trimmed.includes("\n")) {
    separator = /\n+/;
  } else if (trimmed.includes("\t")) {
    separator = /\t+/;
  } else if (trimmed.includes(";")) {
    separator = /;+/;
  } else {
    // Sem separador "forte": primeiro tenta interpretar como um único número
    const single = parseCashflowValue(trimmed);
    if (single !== null) {
      return { values: [single], errors: [] };
    }

    // Se não for número único, permite lista separada por vírgulas
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
// Validação
// ==========================

export interface ValidacaoCashflows {
  valido: boolean;
  erro?: string;
}

export function validarCashflows(cashflows: number[]): ValidacaoCashflows {
  if (cashflows.length < 2) {
    return {
      valido: false,
      erro: "Insira pelo menos 2 fluxos de caixa",
    };
  }

  const hasPositive = cashflows.some((cf) => cf > 0);
  const hasNegative = cashflows.some((cf) => cf < 0);

  if (!hasPositive || !hasNegative) {
    return {
      valido: false,
      erro: "Os fluxos devem conter pelo menos um valor positivo e um negativo",
    };
  }

  return { valido: true };
}

// ==========================
// Cálculo principal
// ==========================

export function calcularTir(inputs: InputsTir): ResultadoTir {
  const { cashflows, periodo } = inputs;

  // Calcula estatísticas básicas
  const totalFluxos = cashflows.reduce((sum, cf) => sum + cf, 0);
  const totalPositivos = cashflows.filter((cf) => cf > 0).reduce((sum, cf) => sum + cf, 0);
  const totalNegativos = Math.abs(cashflows.filter((cf) => cf < 0).reduce((sum, cf) => sum + cf, 0));
  const quantidadePeriodos = cashflows.length;

  // Valida os cashflows
  const validacao = validarCashflows(cashflows);
  if (!validacao.valido) {
    return {
      tirPeriodica: null,
      tirAnual: null,
      totalFluxos,
      totalPositivos,
      totalNegativos,
      quantidadePeriodos,
      erro: validacao.erro,
    };
  }

  // Calcula TIR
  const tirPeriodica = calculateIrr(cashflows);

  if (tirPeriodica === null) {
    return {
      tirPeriodica: null,
      tirAnual: null,
      totalFluxos,
      totalPositivos,
      totalNegativos,
      quantidadePeriodos,
      erro: "Não foi possível calcular a TIR para esses fluxos",
    };
  }

  // Converte para anual
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

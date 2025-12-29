import { calculateIrr, npv as calculateNpv } from "@/lib/utils/irr";

// Re-export npv for use in components
export { calculateNpv as npv };

// ==========================
// Types
// ==========================

export type PeriodoTir = "mensal" | "trimestral" | "semestral" | "anual";

export interface InputsTir {
  cashflows: number[];
  periodo: PeriodoTir;
  taxaDesconto?: number; // Taxa de desconto para VPL (em %, no período selecionado)
}

export interface ResultadoTir {
  tirPeriodica: number | null; // TIR no período selecionado (decimal, ex: 0.025 = 2.5%)
  tirAnual: number | null; // TIR anual equivalente (decimal)
  vpl: number | null; // VPL para taxa de desconto customizada
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

  const separator = detectDecimalSeparator(cleaned);

  let numberStr: string;
  if (separator === "comma") {
    // Formato BR: 1.234,56 -> 1234.56
    numberStr = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    // Formato US: 1,234.56 -> 1234.56
    numberStr = cleaned.replace(/,/g, "");
  }

  const parsed = parseFloat(numberStr);

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

  // Detecta qual separador está sendo usado
  // Prioridade: newline > tab > ponto-e-vírgula > vírgula (se não parecer decimal)
  let separator: RegExp;

  if (text.includes("\n")) {
    separator = /\n+/;
  } else if (text.includes("\t")) {
    separator = /\t+/;
  } else if (text.includes(";")) {
    separator = /;+/;
  } else {
    // Para vírgula, precisamos verificar se é separador ou decimal
    // Se tiver múltiplas vírgulas sem outros separadores, assume que é separador de lista
    const commaCount = (text.match(/,/g) || []).length;
    const dotCount = (text.match(/\./g) || []).length;

    // Se tem mais de uma vírgula e os números não parecem ter formato decimal
    // então vírgula é separador de lista
    if (commaCount > 1 && dotCount === 0) {
      separator = /,+/;
    } else {
      // Caso contrário, retorna como valor único
      const parsed = parseCashflowValue(text);
      if (parsed !== null) {
        return { values: [parsed], errors: [] };
      }
      return { values: [], errors: [0] };
    }
  }

  const parts = text
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
  const { cashflows, periodo, taxaDesconto } = inputs;

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
      vpl: null,
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
      vpl: null,
      totalFluxos,
      totalPositivos,
      totalNegativos,
      quantidadePeriodos,
      erro: "Não foi possível calcular a TIR para esses fluxos",
    };
  }

  // Converte para anual
  const tirAnual = taxaPeriodicaParaAnual(tirPeriodica, periodo);

  // Calcula VPL se taxa de desconto foi fornecida
  let vpl: number | null = null;
  if (typeof taxaDesconto === "number" && Number.isFinite(taxaDesconto)) {
    const taxaDecimal = taxaDesconto / 100; // Converte de % para decimal
    vpl = calculateNpv(taxaDecimal, cashflows);
  }

  return {
    tirPeriodica,
    tirAnual,
    vpl,
    totalFluxos,
    totalPositivos,
    totalNegativos,
    quantidadePeriodos,
  };
}

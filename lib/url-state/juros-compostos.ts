import type { InputsJurosCompostos, PeriodoJurosCompostos } from "../calculators/juros-compostos";

// URL Parameter keys for juros compostos calculator
export const JUROS_COMPOSTOS_PARAM_KEYS = {
  valorInicial: "vi",
  taxaJuros: "tj",
  periodo: "p",
  aportes: "ap",
  quantidadePeriodos: "qp",
} as const;

// Compact period codes for juros compostos (only mensal/anual)
const PERIODO_CODES: Record<PeriodoJurosCompostos, string> = {
  mensal: "m",
  anual: "a",
};

const PERIODO_DECODE: Record<string, PeriodoJurosCompostos> = {
  m: "mensal",
  a: "anual",
};

export interface JurosCompostosUrlState {
  inputs: InputsJurosCompostos;
}

/**
 * Encodes juros compostos calculator state into URL search params
 */
export function encodeJurosCompostosState(state: JurosCompostosUrlState): URLSearchParams {
  const params = new URLSearchParams();
  const { inputs } = state;

  params.set(JUROS_COMPOSTOS_PARAM_KEYS.valorInicial, inputs.valorInicial.toString());
  params.set(JUROS_COMPOSTOS_PARAM_KEYS.taxaJuros, inputs.taxaJuros.toString());
  params.set(JUROS_COMPOSTOS_PARAM_KEYS.periodo, PERIODO_CODES[inputs.periodo]);
  params.set(JUROS_COMPOSTOS_PARAM_KEYS.quantidadePeriodos, inputs.quantidadePeriodos.toString());

  // Only encode aportes if > 0
  if (inputs.aportes > 0) {
    params.set(JUROS_COMPOSTOS_PARAM_KEYS.aportes, inputs.aportes.toString());
  }

  return params;
}

/**
 * Decodes URL search params back to juros compostos calculator state
 * Returns null if required params are missing or invalid
 */
export function decodeJurosCompostosState(params: URLSearchParams): JurosCompostosUrlState | null {
  const valorInicial = parseFloat(params.get(JUROS_COMPOSTOS_PARAM_KEYS.valorInicial) ?? "");
  const taxaJuros = parseFloat(params.get(JUROS_COMPOSTOS_PARAM_KEYS.taxaJuros) ?? "");
  const quantidadePeriodos = parseInt(params.get(JUROS_COMPOSTOS_PARAM_KEYS.quantidadePeriodos) ?? "", 10);
  const aportes = parseFloat(params.get(JUROS_COMPOSTOS_PARAM_KEYS.aportes) ?? "") || 0;

  // Parse periodo
  const periodoParam = params.get(JUROS_COMPOSTOS_PARAM_KEYS.periodo);
  const periodo: PeriodoJurosCompostos =
    periodoParam && PERIODO_DECODE[periodoParam] ? PERIODO_DECODE[periodoParam] : "mensal";

  // Validate required fields
  if (!Number.isFinite(valorInicial) || valorInicial < 0) return null;
  if (!Number.isFinite(taxaJuros) || taxaJuros < 0) return null;
  if (!Number.isFinite(quantidadePeriodos) || quantidadePeriodos < 0) return null;
  if (!Number.isFinite(aportes) || aportes < 0) return null;

  return {
    inputs: {
      valorInicial,
      taxaJuros,
      periodo,
      aportes,
      quantidadePeriodos,
    },
  };
}

/**
 * Generates a full shareable URL for juros compostos calculator
 */
export function generateJurosCompostosShareUrl(baseUrl: string, state: JurosCompostosUrlState): string {
  const params = encodeJurosCompostosState(state);
  const url = new URL(baseUrl);
  url.search = params.toString();
  return url.toString();
}

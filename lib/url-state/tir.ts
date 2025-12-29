import type { PeriodoTir } from "../calculators/tir";

// URL Parameter keys for TIR calculator
export const TIR_PARAM_KEYS = {
  cashflows: "cf",
  periodo: "p",
} as const;

// Compact period codes
const PERIODO_CODES: Record<PeriodoTir, string> = {
  mensal: "m",
  trimestral: "t",
  semestral: "s",
  anual: "a",
};

const PERIODO_DECODE: Record<string, PeriodoTir> = {
  m: "mensal",
  t: "trimestral",
  s: "semestral",
  a: "anual",
};

export interface TirUrlState {
  cashflows: number[];
  periodo: PeriodoTir;
}

/**
 * Encodes TIR calculator state into URL search params
 */
export function encodeTirState(state: TirUrlState): URLSearchParams {
  const params = new URLSearchParams();

  // Encode cashflows as comma-separated values
  if (state.cashflows.length > 0) {
    const encoded = state.cashflows.map((cf) => cf.toString()).join(",");
    params.set(TIR_PARAM_KEYS.cashflows, encoded);
  }

  // Encode periodo
  params.set(TIR_PARAM_KEYS.periodo, PERIODO_CODES[state.periodo]);

  return params;
}

/**
 * Decodes URL search params back to TIR calculator state
 * Returns null if required params are missing or invalid
 */
export function decodeTirState(params: URLSearchParams): TirUrlState | null {
  // Parse cashflows
  const cashflowsParam = params.get(TIR_PARAM_KEYS.cashflows);
  if (!cashflowsParam) return null;

  const cashflowStrings = cashflowsParam.split(",");
  const cashflows: number[] = [];

  for (const str of cashflowStrings) {
    const parsed = parseFloat(str);
    if (!Number.isFinite(parsed)) {
      // Invalid cashflow, return null
      return null;
    }
    cashflows.push(parsed);
  }

  if (cashflows.length < 2) return null;

  // Parse periodo
  const periodoParam = params.get(TIR_PARAM_KEYS.periodo);
  const periodo: PeriodoTir = periodoParam && PERIODO_DECODE[periodoParam] 
    ? PERIODO_DECODE[periodoParam] 
    : "mensal";

  return {
    cashflows,
    periodo,
  };
}

/**
 * Generates a full shareable URL for TIR calculator
 */
export function generateTirShareUrl(baseUrl: string, state: TirUrlState): string {
  const params = encodeTirState(state);
  const url = new URL(baseUrl);
  url.search = params.toString();
  return url.toString();
}


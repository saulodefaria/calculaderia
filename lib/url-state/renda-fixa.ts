import type { InputsComparadorRendaFixa } from "../calculators/renda-fixa";

// URL Parameter keys for renda-fixa calculator
export const RENDA_FIXA_PARAM_KEYS = {
  valor: "v",
  prazoDias: "d",
  preAnual: "pr",
  cdiPercent: "cp",
  ipcaMaisAnual: "ia",
  selicAnual: "sa",
  cdiAnual: "cdi",
  ipcaAnual: "ipca",
  custodiaAnual: "fee",
} as const;

export interface RendaFixaUrlState {
  inputs: InputsComparadorRendaFixa;
}

/**
 * Encodes renda-fixa calculator state into URL search params
 */
export function encodeRendaFixaState(state: RendaFixaUrlState): URLSearchParams {
  const params = new URLSearchParams();
  const { inputs } = state;

  params.set(RENDA_FIXA_PARAM_KEYS.valor, inputs.valor.toString());
  params.set(RENDA_FIXA_PARAM_KEYS.prazoDias, inputs.prazoDias.toString());
  params.set(RENDA_FIXA_PARAM_KEYS.preAnual, inputs.preAnual.toString());
  params.set(RENDA_FIXA_PARAM_KEYS.cdiPercent, inputs.cdiPercent.toString());
  params.set(RENDA_FIXA_PARAM_KEYS.ipcaMaisAnual, inputs.ipcaMaisAnual.toString());
  params.set(RENDA_FIXA_PARAM_KEYS.selicAnual, inputs.selicAnual.toString());
  params.set(RENDA_FIXA_PARAM_KEYS.cdiAnual, inputs.cdiAnual.toString());
  params.set(RENDA_FIXA_PARAM_KEYS.ipcaAnual, inputs.ipcaAnual.toString());

  // Only encode custodia if > 0
  if (inputs.custodiaAnual > 0) {
    params.set(RENDA_FIXA_PARAM_KEYS.custodiaAnual, inputs.custodiaAnual.toString());
  }

  return params;
}

/**
 * Decodes URL search params back to renda-fixa calculator state
 * Returns null if required params are missing or invalid
 */
export function decodeRendaFixaState(params: URLSearchParams): RendaFixaUrlState | null {
  const valor = parseFloat(params.get(RENDA_FIXA_PARAM_KEYS.valor) ?? "");
  const prazoDias = parseInt(params.get(RENDA_FIXA_PARAM_KEYS.prazoDias) ?? "", 10);
  const preAnual = parseFloat(params.get(RENDA_FIXA_PARAM_KEYS.preAnual) ?? "");
  const cdiPercent = parseFloat(params.get(RENDA_FIXA_PARAM_KEYS.cdiPercent) ?? "");
  const ipcaMaisAnual = parseFloat(params.get(RENDA_FIXA_PARAM_KEYS.ipcaMaisAnual) ?? "");
  const selicAnual = parseFloat(params.get(RENDA_FIXA_PARAM_KEYS.selicAnual) ?? "");
  const cdiAnual = parseFloat(params.get(RENDA_FIXA_PARAM_KEYS.cdiAnual) ?? "");
  const ipcaAnual = parseFloat(params.get(RENDA_FIXA_PARAM_KEYS.ipcaAnual) ?? "");
  const custodiaAnual = parseFloat(params.get(RENDA_FIXA_PARAM_KEYS.custodiaAnual) ?? "") || 0;

  // Validate required fields
  if (!Number.isFinite(valor) || valor <= 0) return null;
  if (!Number.isFinite(prazoDias) || prazoDias <= 0) return null;
  if (!Number.isFinite(preAnual) || preAnual < 0) return null;
  if (!Number.isFinite(cdiPercent) || cdiPercent < 0) return null;
  if (!Number.isFinite(ipcaMaisAnual) || ipcaMaisAnual < 0) return null;
  if (!Number.isFinite(selicAnual) || selicAnual < 0) return null;
  if (!Number.isFinite(cdiAnual) || cdiAnual < 0) return null;
  if (!Number.isFinite(ipcaAnual) || ipcaAnual < 0) return null;
  if (!Number.isFinite(custodiaAnual) || custodiaAnual < 0) return null;

  return {
    inputs: {
      valor,
      prazoDias,
      preAnual,
      cdiPercent,
      ipcaMaisAnual,
      selicAnual,
      cdiAnual,
      ipcaAnual,
      custodiaAnual,
    },
  };
}

/**
 * Generates a full shareable URL for renda-fixa calculator
 */
export function generateRendaFixaShareUrl(baseUrl: string, state: RendaFixaUrlState): string {
  const params = encodeRendaFixaState(state);
  const url = new URL(baseUrl);
  url.search = params.toString();
  return url.toString();
}

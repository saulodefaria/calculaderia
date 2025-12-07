import type { InputsComparativo } from "../calculators/comparativo";
import type { MetodoAmortizacao } from "../calculators/financiamento";

// URL Parameter keys for comparativo calculator
export const COMPARATIVO_PARAM_KEYS = {
  // Shared
  valorImovel: "vi",
  // Financiamento
  valorEntrada: "ve",
  taxaJurosAnual: "tj",
  mesesFinanciamento: "mf",
  metodo: "mt",
  correcaoAnualImovel: "ci",
  // Consórcio
  mesesConsorcio: "mc",
  taxaAdministracaoTotal: "ta",
  correcaoAnualConsorcio: "cc",
  agioCartaContemplada: "ac",
  // Investimento
  taxaRendimentoAnual: "tr",
} as const;

export interface ComparativoUrlState {
  inputs: InputsComparativo;
}

/**
 * Encodes comparativo calculator state into URL search params
 */
export function encodeComparativoState(state: ComparativoUrlState): URLSearchParams {
  const params = new URLSearchParams();
  const { financiamento, consorcio, taxaRendimentoAnual } = state.inputs;

  // Encode financiamento inputs
  params.set(COMPARATIVO_PARAM_KEYS.valorImovel, financiamento.valorImovel.toString());
  params.set(COMPARATIVO_PARAM_KEYS.valorEntrada, financiamento.valorEntrada.toString());
  params.set(COMPARATIVO_PARAM_KEYS.taxaJurosAnual, financiamento.taxaJurosAnual.toString());
  params.set(COMPARATIVO_PARAM_KEYS.mesesFinanciamento, financiamento.meses.toString());
  params.set(COMPARATIVO_PARAM_KEYS.metodo, financiamento.metodo);
  params.set(COMPARATIVO_PARAM_KEYS.correcaoAnualImovel, financiamento.correcaoAnualImovel.toString());

  // Encode consorcio inputs
  params.set(COMPARATIVO_PARAM_KEYS.mesesConsorcio, consorcio.meses.toString());
  params.set(COMPARATIVO_PARAM_KEYS.taxaAdministracaoTotal, consorcio.taxaAdministracaoTotal.toString());
  params.set(COMPARATIVO_PARAM_KEYS.correcaoAnualConsorcio, consorcio.correcaoAnual.toString());
  if (consorcio.agioCartaContemplada > 0) {
    params.set(COMPARATIVO_PARAM_KEYS.agioCartaContemplada, consorcio.agioCartaContemplada.toString());
  }

  // Encode investment rate
  params.set(COMPARATIVO_PARAM_KEYS.taxaRendimentoAnual, taxaRendimentoAnual.toString());

  return params;
}

/**
 * Decodes URL search params back to comparativo calculator state
 * Returns null if required params are missing or invalid
 */
export function decodeComparativoState(params: URLSearchParams): ComparativoUrlState | null {
  // Parse financiamento inputs
  const valorImovel = parseFloat(params.get(COMPARATIVO_PARAM_KEYS.valorImovel) ?? "");
  const valorEntrada = parseFloat(params.get(COMPARATIVO_PARAM_KEYS.valorEntrada) ?? "") || 0;
  const taxaJurosAnual = parseFloat(params.get(COMPARATIVO_PARAM_KEYS.taxaJurosAnual) ?? "");
  const mesesFinanciamento = parseInt(params.get(COMPARATIVO_PARAM_KEYS.mesesFinanciamento) ?? "", 10);
  const metodoParam = params.get(COMPARATIVO_PARAM_KEYS.metodo);
  const metodo: MetodoAmortizacao = metodoParam === "price" ? "price" : "sac";
  const correcaoAnualImovel = parseFloat(params.get(COMPARATIVO_PARAM_KEYS.correcaoAnualImovel) ?? "") || 6;

  // Parse consorcio inputs
  const mesesConsorcio = parseInt(params.get(COMPARATIVO_PARAM_KEYS.mesesConsorcio) ?? "", 10);
  const taxaAdministracaoTotal = parseFloat(params.get(COMPARATIVO_PARAM_KEYS.taxaAdministracaoTotal) ?? "");
  const correcaoAnualConsorcio = parseFloat(params.get(COMPARATIVO_PARAM_KEYS.correcaoAnualConsorcio) ?? "") || 6;
  const agioCartaContemplada = parseFloat(params.get(COMPARATIVO_PARAM_KEYS.agioCartaContemplada) ?? "") || 0;

  // Parse investment rate
  const taxaRendimentoAnual = parseFloat(params.get(COMPARATIVO_PARAM_KEYS.taxaRendimentoAnual) ?? "") || 10;

  // Validate required fields
  if (!Number.isFinite(valorImovel) || valorImovel <= 0) return null;
  if (!Number.isFinite(taxaJurosAnual) || taxaJurosAnual <= 0) return null;
  if (!Number.isFinite(mesesFinanciamento) || mesesFinanciamento <= 0) return null;
  if (!Number.isFinite(mesesConsorcio) || mesesConsorcio <= 0) return null;
  if (!Number.isFinite(taxaAdministracaoTotal) || taxaAdministracaoTotal <= 0) return null;

  return {
    inputs: {
      financiamento: {
        valorImovel,
        valorEntrada,
        taxaJurosAnual,
        meses: mesesFinanciamento,
        metodo,
        correcaoAnualImovel,
      },
      consorcio: {
        meses: mesesConsorcio,
        taxaAdministracaoTotal,
        correcaoAnual: correcaoAnualConsorcio,
        agioCartaContemplada,
      },
      taxaRendimentoAnual,
    },
  };
}

/**
 * Generates a full shareable URL for comparativo calculator
 */
export function generateComparativoShareUrl(baseUrl: string, state: ComparativoUrlState): string {
  const params = encodeComparativoState(state);
  const url = new URL(baseUrl);
  url.search = params.toString();
  return url.toString();
}


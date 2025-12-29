import type { InputsAluguelVsComprar } from "../calculators/alugar-vs-comprar";
import type { MetodoAmortizacao } from "../calculators/financiamento";

// URL Parameter keys for alugar-vs-comprar calculator
export const ALUGUEL_VS_COMPRAR_PARAM_KEYS = {
  valorImovel: "vi",
  valorEntrada: "ve",
  taxaJurosAnual: "tj",
  meses: "m",
  metodo: "mt",
  correcaoAnualImovel: "ci",
  aluguelMensal: "am",
  correcaoAnualAluguel: "caa",
  taxaRendimentoAnual: "tr",
} as const;

export interface AluguelVsComprarUrlState {
  inputs: InputsAluguelVsComprar;
}

/**
 * Encodes alugar-vs-comprar calculator state into URL search params
 */
export function encodeAluguelVsComprarState(state: AluguelVsComprarUrlState): URLSearchParams {
  const params = new URLSearchParams();

  // Encode form inputs
  params.set(ALUGUEL_VS_COMPRAR_PARAM_KEYS.valorImovel, state.inputs.valorImovel.toString());
  params.set(ALUGUEL_VS_COMPRAR_PARAM_KEYS.valorEntrada, state.inputs.valorEntrada.toString());
  params.set(ALUGUEL_VS_COMPRAR_PARAM_KEYS.taxaJurosAnual, state.inputs.taxaJurosAnual.toString());
  params.set(ALUGUEL_VS_COMPRAR_PARAM_KEYS.meses, state.inputs.meses.toString());
  params.set(ALUGUEL_VS_COMPRAR_PARAM_KEYS.metodo, state.inputs.metodo);
  params.set(ALUGUEL_VS_COMPRAR_PARAM_KEYS.correcaoAnualImovel, state.inputs.correcaoAnualImovel.toString());
  params.set(ALUGUEL_VS_COMPRAR_PARAM_KEYS.aluguelMensal, state.inputs.aluguelMensal.toString());
  params.set(ALUGUEL_VS_COMPRAR_PARAM_KEYS.correcaoAnualAluguel, state.inputs.correcaoAnualAluguel.toString());
  params.set(ALUGUEL_VS_COMPRAR_PARAM_KEYS.taxaRendimentoAnual, state.inputs.taxaRendimentoAnual.toString());

  return params;
}

/**
 * Decodes URL search params back to alugar-vs-comprar calculator state
 * Returns null if required params are missing or invalid
 */
export function decodeAluguelVsComprarState(params: URLSearchParams): AluguelVsComprarUrlState | null {
  // Parse required form inputs
  const valorImovel = parseFloat(params.get(ALUGUEL_VS_COMPRAR_PARAM_KEYS.valorImovel) ?? "");
  const valorEntrada = parseFloat(params.get(ALUGUEL_VS_COMPRAR_PARAM_KEYS.valorEntrada) ?? "") || 0;
  const taxaJurosAnual = parseFloat(params.get(ALUGUEL_VS_COMPRAR_PARAM_KEYS.taxaJurosAnual) ?? "");
  const meses = parseInt(params.get(ALUGUEL_VS_COMPRAR_PARAM_KEYS.meses) ?? "", 10);
  const correcaoParam = params.get(ALUGUEL_VS_COMPRAR_PARAM_KEYS.correcaoAnualImovel);
  let correcaoAnualImovel = 5;
  if (correcaoParam !== null && correcaoParam !== "") {
    const parsed = parseFloat(correcaoParam);
    if (Number.isFinite(parsed)) {
      correcaoAnualImovel = parsed;
    }
  }
  const aluguelMensal = parseFloat(params.get(ALUGUEL_VS_COMPRAR_PARAM_KEYS.aluguelMensal) ?? "") || 0;
  const correcaoAnualAluguelParam = params.get(ALUGUEL_VS_COMPRAR_PARAM_KEYS.correcaoAnualAluguel);
  let correcaoAnualAluguel = 6;
  if (correcaoAnualAluguelParam !== null && correcaoAnualAluguelParam !== "") {
    const parsed = parseFloat(correcaoAnualAluguelParam);
    if (Number.isFinite(parsed)) {
      correcaoAnualAluguel = parsed;
    }
  }
  const taxaRendimentoAnual = parseFloat(params.get(ALUGUEL_VS_COMPRAR_PARAM_KEYS.taxaRendimentoAnual) ?? "");

  // Validate required fields
  if (!Number.isFinite(valorImovel) || valorImovel <= 0) return null;
  if (!Number.isFinite(valorEntrada) || valorEntrada < 0) return null;
  if (valorEntrada >= valorImovel) return null;
  if (!Number.isFinite(taxaJurosAnual) || taxaJurosAnual <= 0) return null;
  if (!Number.isFinite(meses) || meses <= 0) return null;
  if (!Number.isFinite(taxaRendimentoAnual) || taxaRendimentoAnual <= 0) return null;
  if (aluguelMensal <= 0) return null;

  // Parse method (default to "sac" if invalid)
  const metodoParam = params.get(ALUGUEL_VS_COMPRAR_PARAM_KEYS.metodo);
  const metodo: MetodoAmortizacao = metodoParam === "price" ? "price" : "sac";

  return {
    inputs: {
      valorImovel,
      valorEntrada,
      taxaJurosAnual,
      meses,
      metodo,
      correcaoAnualImovel,
      aluguelMensal,
      correcaoAnualAluguel,
      taxaRendimentoAnual,
    },
  };
}

/**
 * Generates a full shareable URL for alugar-vs-comprar calculator
 */
export function generateAluguelVsComprarShareUrl(baseUrl: string, state: AluguelVsComprarUrlState): string {
  const params = encodeAluguelVsComprarState(state);
  const url = new URL(baseUrl);
  url.search = params.toString();
  return url.toString();
}

// Re-export all URL state utilities from the organized url-state folder
// This file is kept for backwards compatibility with existing imports
// Prefer importing from ./url-state/index.ts for new imports

export {
  // Financiamento
  FINANCIAMENTO_PARAM_KEYS,
  type FinanciamentoUrlState,
  encodeFinanciamentoState,
  decodeFinanciamentoState,
  generateFinanciamentoShareUrl,
  // Consórcio
  CONSORCIO_PARAM_KEYS,
  type ConsorcioUrlState,
  encodeConsorcioState,
  decodeConsorcioState,
  generateConsorcioShareUrl,
  // Comparativo
  COMPARATIVO_PARAM_KEYS,
  type ComparativoUrlState,
  encodeComparativoState,
  decodeComparativoState,
  generateComparativoShareUrl,
  // TIR
  TIR_PARAM_KEYS,
  type TirUrlState,
  encodeTirState,
  decodeTirState,
  generateTirShareUrl,
} from "./url-state/index";

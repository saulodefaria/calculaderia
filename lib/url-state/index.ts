// Re-export all URL state utilities from their respective modules

export {
  FINANCIAMENTO_PARAM_KEYS,
  type FinanciamentoUrlState,
  encodeFinanciamentoState,
  decodeFinanciamentoState,
  generateFinanciamentoShareUrl,
} from "./financiamento";

export {
  CONSORCIO_PARAM_KEYS,
  type ConsorcioUrlState,
  encodeConsorcioState,
  decodeConsorcioState,
  generateConsorcioShareUrl,
} from "./consorcio";

export {
  COMPARATIVO_PARAM_KEYS,
  type ComparativoUrlState,
  encodeComparativoState,
  decodeComparativoState,
  generateComparativoShareUrl,
} from "./comparativo";

export { TIR_PARAM_KEYS, type TirUrlState, encodeTirState, decodeTirState, generateTirShareUrl } from "./tir";

export {
  ALUGUEL_VS_COMPRAR_PARAM_KEYS,
  type AluguelVsComprarUrlState,
  encodeAluguelVsComprarState,
  decodeAluguelVsComprarState,
  generateAluguelVsComprarShareUrl,
} from "./alugar-vs-comprar";

export {
  JUROS_COMPOSTOS_PARAM_KEYS,
  type JurosCompostosUrlState,
  encodeJurosCompostosState,
  decodeJurosCompostosState,
  generateJurosCompostosShareUrl,
} from "./juros-compostos";

export {
  RENDA_FIXA_PARAM_KEYS,
  type RendaFixaUrlState,
  encodeRendaFixaState,
  decodeRendaFixaState,
  generateRendaFixaShareUrl,
} from "./renda-fixa";

export {
  RESCISAO_TRABALHISTA_PARAM_KEYS,
  type RescisaoTrabalhistaUrlState,
  encodeRescisaoTrabalhistaState,
  decodeRescisaoTrabalhistaState,
  generateRescisaoTrabalhistaShareUrl,
} from "./rescisao-trabalhista";

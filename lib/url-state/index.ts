// Re-export all URL state utilities from their respective modules

export {
  FINANCIAMENTO_PARAM_KEYS,
  type FinanciamentoUrlState,
  encodeFinanciamentoState,
  decodeFinanciamentoState,
  generateFinanciamentoShareUrl,
} from "./financiamento";

export {
  FINANCIAMENTO_VEICULO_PARAM_KEYS,
  type FinanciamentoVeiculoUrlState,
  encodeFinanciamentoVeiculoState,
  decodeFinanciamentoVeiculoState,
  generateFinanciamentoVeiculoShareUrl,
} from "./financiamento-veiculo";

export {
  FINANCIAMENTO_MCMV_PARAM_KEYS,
  type FinanciamentoMcmvUrlState,
  encodeFinanciamentoMcmvState,
  decodeFinanciamentoMcmvState,
  generateFinanciamentoMcmvShareUrl,
} from "./financiamento-minha-casa-minha-vida";

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
  FINANCIAR_OU_JUNTAR_PARAM_KEYS,
  type FinanciarOuJuntarDinheiroUrlState,
  encodeFinanciarOuJuntarDinheiroState,
  decodeFinanciarOuJuntarDinheiroState,
  generateFinanciarOuJuntarDinheiroShareUrl,
} from "./financiar-ou-juntar-dinheiro";

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
  CDB_PARAM_KEYS,
  type CdbUrlState,
  type CdbUrlWarningCode,
  encodeCdbState,
  decodeCdbState,
  generateCdbShareUrl,
} from "./cdb";

export {
  RESCISAO_TRABALHISTA_PARAM_KEYS,
  type RescisaoTrabalhistaUrlState,
  encodeRescisaoTrabalhistaState,
  decodeRescisaoTrabalhistaState,
  generateRescisaoTrabalhistaShareUrl,
} from "./rescisao-trabalhista";

export {
  RESCISAO_SEM_FGTS_PARAM_KEYS,
  type RescisaoSemFgtsUrlState,
  encodeRescisaoSemFgtsState,
  decodeRescisaoSemFgtsState,
  generateRescisaoSemFgtsShareUrl,
} from "./rescisao-sem-fgts";

export {
  FERIAS_PARAM_KEYS,
  type FeriasUrlState,
  encodeFeriasState,
  decodeFeriasState,
  generateFeriasShareUrl,
} from "./ferias";

export {
  DECIMO_TERCEIRO_PARAM_KEYS,
  type DecimoTerceiroUrlState,
  encodeDecimoTerceiroState,
  decodeDecimoTerceiroState,
  generateDecimoTerceiroShareUrl,
} from "./decimo-terceiro";

export {
  SEGURO_DESEMPREGO_PARAM_KEYS,
  type SeguroDesempregoUrlState,
  encodeSeguroDesempregoState,
  decodeSeguroDesempregoState,
  generateSeguroDesempregoShareUrl,
} from "./seguro-desemprego";

export {
  SALARIO_LIQUIDO_PARAM_KEYS,
  type SalarioLiquidoUrlState,
  encodeSalarioLiquidoState,
  decodeSalarioLiquidoState,
  generateSalarioLiquidoShareUrl,
} from "./salario-liquido";

export {
  SALARIO_DIAS_TRABALHADOS_PARAM_KEYS,
  type SalarioDiasTrabalhadosUrlState,
  encodeSalarioDiasTrabalhadosState,
  decodeSalarioDiasTrabalhadosState,
  generateSalarioDiasTrabalhadosShareUrl,
} from "./salario-dias-trabalhados";

export {
  SALARIO_POR_HORA_PARAM_KEYS,
  type SalarioPorHoraUrlState,
  encodeSalarioPorHoraState,
  decodeSalarioPorHoraState,
  generateSalarioPorHoraShareUrl,
} from "./salario-por-hora";

export {
  SALARIO_PJ_PARAM_KEYS,
  type SalarioPjUrlState,
  encodeSalarioPjState,
  decodeSalarioPjState,
  generateSalarioPjShareUrl,
} from "./salario-pj";

export {
  IMPOSTO_DE_RENDA_PARAM_KEYS,
  type ImpostoDeRendaUrlState,
  encodeImpostoDeRendaState,
  decodeImpostoDeRendaState,
  generateImpostoDeRendaShareUrl,
} from "./imposto-de-renda";

export {
  INSS_PARAM_KEYS,
  type InssUrlState,
  encodeInssState,
  decodeInssState,
  generateInssShareUrl,
} from "./inss";

export {
  INSS_EM_ATRASO_PARAM_KEYS,
  type InssEmAtrasoUrlState,
  encodeInssEmAtrasoState,
  decodeInssEmAtrasoState,
  generateInssEmAtrasoShareUrl,
} from "./inss-em-atraso";

export {
  FGTS_PARAM_KEYS,
  type FgtsUrlState,
  encodeFgtsState,
  decodeFgtsState,
  generateFgtsShareUrl,
} from "./fgts";

export {
  INVESTIMENTO_PARAM_KEYS,
  type InvestimentoUrlState,
  type InvestimentoUrlWarningCode,
  encodeInvestimentoState,
  decodeInvestimentoState,
  generateInvestimentoShareUrl,
} from "./investimento";

export {
  INVESTIMENTO_CDI_PARAM_KEYS,
  type InvestimentoCdiUrlState,
  type InvestimentoCdiUrlWarningCode,
  encodeInvestimentoCdiState,
  decodeInvestimentoCdiState,
  generateInvestimentoCdiShareUrl,
} from "./investimento-cdi";

export {
  CALCULADORA_FINANCEIRA_ONLINE_PARAM_KEYS,
  type CalculadoraFinanceiraOnlineUrlState,
  encodeCalculadoraFinanceiraOnlineState,
  decodeCalculadoraFinanceiraOnlineState,
  generateCalculadoraFinanceiraOnlineShareUrl,
} from "./calculadora-financeira-online";

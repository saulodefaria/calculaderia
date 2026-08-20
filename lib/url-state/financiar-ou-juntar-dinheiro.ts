import {
  FINANCIAR_OU_JUNTAR_SUPPORTED_STATE_VERSION,
  validateFinanciarOuJuntarDinheiroInputs,
  type FinanciarOuJuntarDinheiroInputs,
} from "../calculators/financiar-ou-juntar-dinheiro";

export const FINANCIAR_OU_JUNTAR_PARAM_KEYS = {
  sourceVersion: "sv",
  valorImovel: "vi",
  capitalInicial: "cp",
  metodo: "mt",
  taxaFinanciamentoAnual: "jf",
  prazoFinanciamentoMeses: "pf",
  valorizacaoAnualImovel: "ai",
  aporteMensalLiquido: "ap",
  rendimentoAnualInvestimento: "ri",
  aluguelMensalInicial: "al",
  crescimentoAnualAluguel: "ra",
  horizonteMeses: "h",
} as const;

export interface FinanciarOuJuntarDinheiroUrlState {
  inputs: FinanciarOuJuntarDinheiroInputs;
}

const KNOWN_KEYS = Object.values(FINANCIAR_OU_JUNTAR_PARAM_KEYS);
const PLAIN_NON_NEGATIVE_NUMBER = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
const PLAIN_POSITIVE_INTEGER = /^[1-9]\d*$/;

function hasExactlyOne(params: URLSearchParams, key: string): boolean {
  return params.getAll(key).length === 1;
}

function parseNumber(params: URLSearchParams, key: string): number | null {
  const raw = params.get(key);
  if (raw === null || !PLAIN_NON_NEGATIVE_NUMBER.test(raw)) return null;
  const value = Number(raw);
  return Number.isFinite(value) && !Object.is(value, -0) ? value : null;
}

function parseInteger(params: URLSearchParams, key: string): number | null {
  const raw = params.get(key);
  if (raw === null || !PLAIN_POSITIVE_INTEGER.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) ? value : null;
}

export function encodeFinanciarOuJuntarDinheiroState(
  state: FinanciarOuJuntarDinheiroUrlState
): URLSearchParams {
  const { inputs } = state;
  const params = new URLSearchParams();

  params.set(FINANCIAR_OU_JUNTAR_PARAM_KEYS.sourceVersion, FINANCIAR_OU_JUNTAR_SUPPORTED_STATE_VERSION);
  params.set(FINANCIAR_OU_JUNTAR_PARAM_KEYS.valorImovel, inputs.valorImovel.toString());
  params.set(FINANCIAR_OU_JUNTAR_PARAM_KEYS.capitalInicial, inputs.capitalInicial.toString());
  params.set(FINANCIAR_OU_JUNTAR_PARAM_KEYS.metodo, inputs.metodo === "sac" ? "s" : "p");
  params.set(FINANCIAR_OU_JUNTAR_PARAM_KEYS.taxaFinanciamentoAnual, inputs.taxaFinanciamentoAnual.toString());
  params.set(
    FINANCIAR_OU_JUNTAR_PARAM_KEYS.prazoFinanciamentoMeses,
    inputs.prazoFinanciamentoMeses.toString()
  );
  params.set(FINANCIAR_OU_JUNTAR_PARAM_KEYS.valorizacaoAnualImovel, inputs.valorizacaoAnualImovel.toString());
  params.set(FINANCIAR_OU_JUNTAR_PARAM_KEYS.aporteMensalLiquido, inputs.aporteMensalLiquido.toString());
  params.set(
    FINANCIAR_OU_JUNTAR_PARAM_KEYS.rendimentoAnualInvestimento,
    inputs.rendimentoAnualInvestimento.toString()
  );
  params.set(FINANCIAR_OU_JUNTAR_PARAM_KEYS.aluguelMensalInicial, inputs.aluguelMensalInicial.toString());
  params.set(FINANCIAR_OU_JUNTAR_PARAM_KEYS.crescimentoAnualAluguel, inputs.crescimentoAnualAluguel.toString());
  params.set(FINANCIAR_OU_JUNTAR_PARAM_KEYS.horizonteMeses, inputs.horizonteMeses.toString());

  return params;
}

export function decodeFinanciarOuJuntarDinheiroState(
  params: URLSearchParams
): FinanciarOuJuntarDinheiroUrlState | null {
  if (!params.toString() || KNOWN_KEYS.some((key) => !hasExactlyOne(params, key))) return null;
  if (params.get(FINANCIAR_OU_JUNTAR_PARAM_KEYS.sourceVersion) !== FINANCIAR_OU_JUNTAR_SUPPORTED_STATE_VERSION) {
    return null;
  }

  const rawMetodo = params.get(FINANCIAR_OU_JUNTAR_PARAM_KEYS.metodo);
  const metodo = rawMetodo === "s" ? "sac" : rawMetodo === "p" ? "price" : null;
  const valorImovel = parseNumber(params, FINANCIAR_OU_JUNTAR_PARAM_KEYS.valorImovel);
  const capitalInicial = parseNumber(params, FINANCIAR_OU_JUNTAR_PARAM_KEYS.capitalInicial);
  const taxaFinanciamentoAnual = parseNumber(params, FINANCIAR_OU_JUNTAR_PARAM_KEYS.taxaFinanciamentoAnual);
  const prazoFinanciamentoMeses = parseInteger(params, FINANCIAR_OU_JUNTAR_PARAM_KEYS.prazoFinanciamentoMeses);
  const valorizacaoAnualImovel = parseNumber(params, FINANCIAR_OU_JUNTAR_PARAM_KEYS.valorizacaoAnualImovel);
  const aporteMensalLiquido = parseNumber(params, FINANCIAR_OU_JUNTAR_PARAM_KEYS.aporteMensalLiquido);
  const rendimentoAnualInvestimento = parseNumber(
    params,
    FINANCIAR_OU_JUNTAR_PARAM_KEYS.rendimentoAnualInvestimento
  );
  const aluguelMensalInicial = parseNumber(params, FINANCIAR_OU_JUNTAR_PARAM_KEYS.aluguelMensalInicial);
  const crescimentoAnualAluguel = parseNumber(params, FINANCIAR_OU_JUNTAR_PARAM_KEYS.crescimentoAnualAluguel);
  const horizonteMeses = parseInteger(params, FINANCIAR_OU_JUNTAR_PARAM_KEYS.horizonteMeses);

  if (
    metodo === null ||
    valorImovel === null ||
    capitalInicial === null ||
    taxaFinanciamentoAnual === null ||
    prazoFinanciamentoMeses === null ||
    valorizacaoAnualImovel === null ||
    aporteMensalLiquido === null ||
    rendimentoAnualInvestimento === null ||
    aluguelMensalInicial === null ||
    crescimentoAnualAluguel === null ||
    horizonteMeses === null
  ) {
    return null;
  }

  const inputs: FinanciarOuJuntarDinheiroInputs = {
    valorImovel,
    capitalInicial,
    metodo,
    taxaFinanciamentoAnual,
    prazoFinanciamentoMeses,
    valorizacaoAnualImovel,
    aporteMensalLiquido,
    rendimentoAnualInvestimento,
    aluguelMensalInicial,
    crescimentoAnualAluguel,
    horizonteMeses,
  };

  return validateFinanciarOuJuntarDinheiroInputs(inputs).length === 0 ? { inputs } : null;
}

export function generateFinanciarOuJuntarDinheiroShareUrl(
  baseUrl: string,
  state: FinanciarOuJuntarDinheiroUrlState
): string {
  const url = new URL(baseUrl);
  url.search = encodeFinanciarOuJuntarDinheiroState(state).toString();
  return url.toString();
}

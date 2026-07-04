import {
  MCMV_SOURCE_VERSION,
  getDefaultMinhaCasaMinhaVidaInputs,
  isMcmvMetodo,
  isMcmvRegiao,
  isMcmvTipoImovel,
  validateMinhaCasaMinhaVidaInputs,
  type McmvInputs,
  type McmvRegiao,
  type McmvTipoImovel,
} from "../calculators/financiamento-minha-casa-minha-vida";

export const FINANCIAMENTO_MCMV_PARAM_KEYS = {
  sourceVersion: "sv",
  rendaMensalBruta: "rb",
  regiao: "rg",
  cotistaFgts: "ct",
  tipoImovel: "ti",
  valorImovel: "vi",
  limiteLocalFaixa12: "ll",
  entradaRecursosProprios: "en",
  fgtsEntrada: "fg",
  subsidioInformado: "sd",
  prazoMeses: "pm",
  metodo: "mt",
  usarTaxaOficial: "uo",
  taxaNominalAnualManual: "ta",
  compararMetodos: "cmp",
} as const;

export interface FinanciamentoMcmvUrlState {
  inputs: McmvInputs;
}

const REGIAO_CODES: Record<McmvRegiao, string> = {
  "norte-nordeste": "nne",
  "sul-sudeste-centro-oeste": "sseco",
};

const REGIAO_DECODE: Record<string, McmvRegiao> = {
  nne: "norte-nordeste",
  sseco: "sul-sudeste-centro-oeste",
};

const TIPO_IMOVEL_CODES: Record<McmvTipoImovel, string> = {
  novo: "n",
  usado: "u",
  construcao: "c",
  "terreno-construcao": "tc",
};

const TIPO_IMOVEL_DECODE: Record<string, McmvTipoImovel> = {
  n: "novo",
  u: "usado",
  c: "construcao",
  tc: "terreno-construcao",
};

function parseRequiredNumber(params: URLSearchParams, key: string): number | null {
  const raw = params.get(key);
  if (raw === null || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function parseRequiredInteger(params: URLSearchParams, key: string): number | null {
  const value = parseRequiredNumber(params, key);
  if (value === null || !Number.isInteger(value)) return null;
  return value;
}

function parseRequiredBoolean(params: URLSearchParams, key: string): boolean | null {
  const raw = params.get(key);
  if (raw === "1") return true;
  if (raw === "0") return false;
  return null;
}

function parseOptionalLocalCap(params: URLSearchParams): number | null | "invalid" {
  const value = parseRequiredNumber(params, FINANCIAMENTO_MCMV_PARAM_KEYS.limiteLocalFaixa12);
  if (value === null) return "invalid";
  return value === 0 ? null : value;
}

function parseManualRate(params: URLSearchParams, usarTaxaOficial: boolean): number | null | "invalid" {
  const raw = params.get(FINANCIAMENTO_MCMV_PARAM_KEYS.taxaNominalAnualManual);
  if (usarTaxaOficial) return raw === null || raw === "" ? null : Number(raw);
  if (raw === null || raw === "") return "invalid";

  const value = Number(raw);
  return Number.isFinite(value) ? value : "invalid";
}

export function encodeFinanciamentoMcmvState(state: FinanciamentoMcmvUrlState): URLSearchParams {
  const params = new URLSearchParams();
  const { inputs } = state;

  params.set(FINANCIAMENTO_MCMV_PARAM_KEYS.sourceVersion, MCMV_SOURCE_VERSION);
  params.set(FINANCIAMENTO_MCMV_PARAM_KEYS.rendaMensalBruta, inputs.rendaMensalBruta.toString());
  params.set(FINANCIAMENTO_MCMV_PARAM_KEYS.regiao, REGIAO_CODES[inputs.regiao]);
  params.set(FINANCIAMENTO_MCMV_PARAM_KEYS.cotistaFgts, inputs.cotistaFgts ? "1" : "0");
  params.set(FINANCIAMENTO_MCMV_PARAM_KEYS.tipoImovel, TIPO_IMOVEL_CODES[inputs.tipoImovel]);
  params.set(FINANCIAMENTO_MCMV_PARAM_KEYS.valorImovel, inputs.valorImovel.toString());
  params.set(FINANCIAMENTO_MCMV_PARAM_KEYS.limiteLocalFaixa12, (inputs.limiteLocalFaixa12 ?? 0).toString());
  params.set(FINANCIAMENTO_MCMV_PARAM_KEYS.entradaRecursosProprios, inputs.entradaRecursosProprios.toString());
  params.set(FINANCIAMENTO_MCMV_PARAM_KEYS.fgtsEntrada, inputs.fgtsEntrada.toString());
  params.set(FINANCIAMENTO_MCMV_PARAM_KEYS.subsidioInformado, inputs.subsidioInformado.toString());
  params.set(FINANCIAMENTO_MCMV_PARAM_KEYS.prazoMeses, inputs.prazoMeses.toString());
  params.set(FINANCIAMENTO_MCMV_PARAM_KEYS.metodo, inputs.metodo);
  params.set(FINANCIAMENTO_MCMV_PARAM_KEYS.usarTaxaOficial, inputs.usarTaxaOficial ? "1" : "0");
  if (!inputs.usarTaxaOficial) {
    params.set(FINANCIAMENTO_MCMV_PARAM_KEYS.taxaNominalAnualManual, (inputs.taxaNominalAnualManual ?? 0).toString());
  }
  params.set(FINANCIAMENTO_MCMV_PARAM_KEYS.compararMetodos, inputs.compararMetodos ? "1" : "0");

  return params;
}

export function decodeFinanciamentoMcmvState(params: URLSearchParams): FinanciamentoMcmvUrlState | null {
  if (!params.toString()) return null;
  if (params.get(FINANCIAMENTO_MCMV_PARAM_KEYS.sourceVersion) !== MCMV_SOURCE_VERSION) {
    return null;
  }

  const rendaMensalBruta = parseRequiredNumber(params, FINANCIAMENTO_MCMV_PARAM_KEYS.rendaMensalBruta);
  const regiaoCode = params.get(FINANCIAMENTO_MCMV_PARAM_KEYS.regiao) ?? "";
  const regiao = REGIAO_DECODE[regiaoCode];
  const cotistaFgts = parseRequiredBoolean(params, FINANCIAMENTO_MCMV_PARAM_KEYS.cotistaFgts);
  const tipoCode = params.get(FINANCIAMENTO_MCMV_PARAM_KEYS.tipoImovel) ?? "";
  const tipoImovel = TIPO_IMOVEL_DECODE[tipoCode];
  const valorImovel = parseRequiredNumber(params, FINANCIAMENTO_MCMV_PARAM_KEYS.valorImovel);
  const limiteLocalFaixa12 = parseOptionalLocalCap(params);
  const entradaRecursosProprios = parseRequiredNumber(params, FINANCIAMENTO_MCMV_PARAM_KEYS.entradaRecursosProprios);
  const fgtsEntrada = parseRequiredNumber(params, FINANCIAMENTO_MCMV_PARAM_KEYS.fgtsEntrada);
  const subsidioInformado = parseRequiredNumber(params, FINANCIAMENTO_MCMV_PARAM_KEYS.subsidioInformado);
  const prazoMeses = parseRequiredInteger(params, FINANCIAMENTO_MCMV_PARAM_KEYS.prazoMeses);
  const metodo = params.get(FINANCIAMENTO_MCMV_PARAM_KEYS.metodo);
  const usarTaxaOficial = parseRequiredBoolean(params, FINANCIAMENTO_MCMV_PARAM_KEYS.usarTaxaOficial);
  const compararMetodos = parseRequiredBoolean(params, FINANCIAMENTO_MCMV_PARAM_KEYS.compararMetodos);

  if (
    rendaMensalBruta === null ||
    !regiao ||
    !isMcmvRegiao(regiao) ||
    cotistaFgts === null ||
    !tipoImovel ||
    !isMcmvTipoImovel(tipoImovel) ||
    valorImovel === null ||
    limiteLocalFaixa12 === "invalid" ||
    entradaRecursosProprios === null ||
    fgtsEntrada === null ||
    subsidioInformado === null ||
    prazoMeses === null ||
    !metodo ||
    !isMcmvMetodo(metodo) ||
    usarTaxaOficial === null ||
    compararMetodos === null
  ) {
    return null;
  }

  const taxaNominalAnualManual = parseManualRate(params, usarTaxaOficial);
  if (taxaNominalAnualManual === "invalid") return null;

  const inputs: McmvInputs = {
    ...getDefaultMinhaCasaMinhaVidaInputs(),
    rendaMensalBruta,
    regiao,
    cotistaFgts,
    tipoImovel,
    valorImovel,
    limiteLocalFaixa12,
    entradaRecursosProprios,
    fgtsEntrada,
    subsidioInformado,
    prazoMeses,
    metodo,
    usarTaxaOficial,
    taxaNominalAnualManual,
    compararMetodos,
  };

  return validateMinhaCasaMinhaVidaInputs(inputs).length === 0 ? { inputs } : null;
}

export function generateFinanciamentoMcmvShareUrl(baseUrl: string, state: FinanciamentoMcmvUrlState): string {
  const params = encodeFinanciamentoMcmvState(state);
  const url = new URL(baseUrl);
  url.search = params.toString();
  return url.toString();
}

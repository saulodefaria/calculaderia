import {
  FINANCIAMENTO_VEICULO_FORMULA_VERSION,
  getDefaultFinanciamentoVeiculoInputs,
  isFinanciamentoVeiculoMetodo,
  validateFinanciamentoVeiculoInputs,
  type FinanciamentoVeiculoInputs,
} from "../calculators/financiamento-veiculo";

export const FINANCIAMENTO_VEICULO_PARAM_KEYS = {
  sourceVersion: "sv",
  valorVeiculo: "vv",
  entrada: "en",
  custosFinanciados: "cf",
  custosAVista: "ca",
  taxaJurosMensal: "tm",
  prazoMeses: "pm",
  metodo: "mt",
  compararMetodos: "cmp",
} as const;

export interface FinanciamentoVeiculoUrlState {
  inputs: FinanciamentoVeiculoInputs;
}

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

function parseComparisonFlag(params: URLSearchParams): boolean | null {
  const raw = params.get(FINANCIAMENTO_VEICULO_PARAM_KEYS.compararMetodos);
  if (raw === null || raw === "") return getDefaultFinanciamentoVeiculoInputs().compararMetodos;
  if (raw === "1") return true;
  if (raw === "0") return false;
  return null;
}

export function encodeFinanciamentoVeiculoState(state: FinanciamentoVeiculoUrlState): URLSearchParams {
  const params = new URLSearchParams();
  const { inputs } = state;

  params.set(FINANCIAMENTO_VEICULO_PARAM_KEYS.sourceVersion, FINANCIAMENTO_VEICULO_FORMULA_VERSION);
  params.set(FINANCIAMENTO_VEICULO_PARAM_KEYS.valorVeiculo, inputs.valorVeiculo.toString());
  params.set(FINANCIAMENTO_VEICULO_PARAM_KEYS.entrada, inputs.entrada.toString());
  params.set(FINANCIAMENTO_VEICULO_PARAM_KEYS.custosFinanciados, inputs.custosFinanciados.toString());
  params.set(FINANCIAMENTO_VEICULO_PARAM_KEYS.custosAVista, inputs.custosAVista.toString());
  params.set(FINANCIAMENTO_VEICULO_PARAM_KEYS.taxaJurosMensal, inputs.taxaJurosMensal.toString());
  params.set(FINANCIAMENTO_VEICULO_PARAM_KEYS.prazoMeses, inputs.prazoMeses.toString());
  params.set(FINANCIAMENTO_VEICULO_PARAM_KEYS.metodo, inputs.metodo);
  params.set(FINANCIAMENTO_VEICULO_PARAM_KEYS.compararMetodos, inputs.compararMetodos ? "1" : "0");

  return params;
}

export function decodeFinanciamentoVeiculoState(params: URLSearchParams): FinanciamentoVeiculoUrlState | null {
  if (!params.toString()) return null;
  if (params.get(FINANCIAMENTO_VEICULO_PARAM_KEYS.sourceVersion) !== FINANCIAMENTO_VEICULO_FORMULA_VERSION) {
    return null;
  }

  const valorVeiculo = parseRequiredNumber(params, FINANCIAMENTO_VEICULO_PARAM_KEYS.valorVeiculo);
  const entrada = parseRequiredNumber(params, FINANCIAMENTO_VEICULO_PARAM_KEYS.entrada);
  const custosFinanciados = parseRequiredNumber(params, FINANCIAMENTO_VEICULO_PARAM_KEYS.custosFinanciados);
  const custosAVista = parseRequiredNumber(params, FINANCIAMENTO_VEICULO_PARAM_KEYS.custosAVista);
  const taxaJurosMensal = parseRequiredNumber(params, FINANCIAMENTO_VEICULO_PARAM_KEYS.taxaJurosMensal);
  const prazoMeses = parseRequiredInteger(params, FINANCIAMENTO_VEICULO_PARAM_KEYS.prazoMeses);
  const metodo = params.get(FINANCIAMENTO_VEICULO_PARAM_KEYS.metodo);
  const compararMetodos = parseComparisonFlag(params);

  if (
    valorVeiculo === null ||
    entrada === null ||
    custosFinanciados === null ||
    custosAVista === null ||
    taxaJurosMensal === null ||
    prazoMeses === null ||
    !metodo ||
    !isFinanciamentoVeiculoMetodo(metodo) ||
    compararMetodos === null
  ) {
    return null;
  }

  const inputs: FinanciamentoVeiculoInputs = {
    valorVeiculo,
    entrada,
    custosFinanciados,
    custosAVista,
    taxaJurosMensal,
    prazoMeses,
    metodo,
    compararMetodos,
  };

  return validateFinanciamentoVeiculoInputs(inputs).length === 0 ? { inputs } : null;
}

export function generateFinanciamentoVeiculoShareUrl(
  baseUrl: string,
  state: FinanciamentoVeiculoUrlState
): string {
  const params = encodeFinanciamentoVeiculoState(state);
  const url = new URL(baseUrl);
  url.search = params.toString();
  return url.toString();
}

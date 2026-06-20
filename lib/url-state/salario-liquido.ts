import {
  getDefaultSalarioLiquidoInputs,
  validateSalarioLiquidoInputs,
  type SalarioLiquidoInputs,
} from "../calculators/salario-liquido";

export const SALARIO_LIQUIDO_PARAM_KEYS = {
  salarioBruto: "s",
  outrosProventosTributaveis: "ot",
  outrosProventosNaoTributaveis: "on",
  dependentesIr: "dep",
  pensaoAlimenticia: "pa",
  descontosManuais: "dm",
  adiantamentos: "ad",
  calcularDescontosLegais: "dl",
  tabelaAno: "tb",
} as const;

export interface SalarioLiquidoUrlState {
  inputs: SalarioLiquidoInputs;
}

function parseOptionalNumber(params: URLSearchParams, key: string, fallback: number): number | null {
  const raw = params.get(key);
  if (raw === null || raw === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function parseOptionalInteger(params: URLSearchParams, key: string, fallback: number): number | null {
  const raw = params.get(key);
  if (raw === null || raw === "") return fallback;
  if (!/^-?\d+$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isInteger(value) ? value : null;
}

function parseBoolean(params: URLSearchParams, key: string, fallback: boolean): boolean | null {
  const raw = params.get(key);
  if (raw === null || raw === "") return fallback;
  if (raw === "1" || raw === "true") return true;
  if (raw === "0" || raw === "false") return false;
  return null;
}

function setNumberIfChanged(params: URLSearchParams, key: string, value: number, defaultValue: number) {
  if (value !== defaultValue) {
    params.set(key, value.toString());
  }
}

function setBooleanIfChanged(params: URLSearchParams, key: string, value: boolean, defaultValue: boolean) {
  if (value !== defaultValue) {
    params.set(key, value ? "1" : "0");
  }
}

export function encodeSalarioLiquidoState(state: SalarioLiquidoUrlState): URLSearchParams {
  const params = new URLSearchParams();
  const defaults = getDefaultSalarioLiquidoInputs();
  const { inputs } = state;

  params.set(SALARIO_LIQUIDO_PARAM_KEYS.tabelaAno, "2026");
  setNumberIfChanged(params, SALARIO_LIQUIDO_PARAM_KEYS.salarioBruto, inputs.salarioBruto, defaults.salarioBruto);
  setNumberIfChanged(
    params,
    SALARIO_LIQUIDO_PARAM_KEYS.outrosProventosTributaveis,
    inputs.outrosProventosTributaveis,
    defaults.outrosProventosTributaveis
  );
  setNumberIfChanged(
    params,
    SALARIO_LIQUIDO_PARAM_KEYS.outrosProventosNaoTributaveis,
    inputs.outrosProventosNaoTributaveis,
    defaults.outrosProventosNaoTributaveis
  );
  setNumberIfChanged(
    params,
    SALARIO_LIQUIDO_PARAM_KEYS.dependentesIr,
    inputs.dependentesIr,
    defaults.dependentesIr
  );
  setNumberIfChanged(
    params,
    SALARIO_LIQUIDO_PARAM_KEYS.pensaoAlimenticia,
    inputs.pensaoAlimenticia,
    defaults.pensaoAlimenticia
  );
  setNumberIfChanged(
    params,
    SALARIO_LIQUIDO_PARAM_KEYS.descontosManuais,
    inputs.descontosManuais,
    defaults.descontosManuais
  );
  setNumberIfChanged(
    params,
    SALARIO_LIQUIDO_PARAM_KEYS.adiantamentos,
    inputs.adiantamentos,
    defaults.adiantamentos
  );
  setBooleanIfChanged(
    params,
    SALARIO_LIQUIDO_PARAM_KEYS.calcularDescontosLegais,
    inputs.calcularDescontosLegais,
    defaults.calcularDescontosLegais
  );

  return params;
}

export function decodeSalarioLiquidoState(params: URLSearchParams): SalarioLiquidoUrlState | null {
  if (!params.toString()) return null;
  if (params.get(SALARIO_LIQUIDO_PARAM_KEYS.tabelaAno) !== "2026") return null;

  const defaults = getDefaultSalarioLiquidoInputs();
  const salarioBruto = parseOptionalNumber(params, SALARIO_LIQUIDO_PARAM_KEYS.salarioBruto, defaults.salarioBruto);
  const outrosProventosTributaveis = parseOptionalNumber(
    params,
    SALARIO_LIQUIDO_PARAM_KEYS.outrosProventosTributaveis,
    defaults.outrosProventosTributaveis
  );
  const outrosProventosNaoTributaveis = parseOptionalNumber(
    params,
    SALARIO_LIQUIDO_PARAM_KEYS.outrosProventosNaoTributaveis,
    defaults.outrosProventosNaoTributaveis
  );
  const dependentesIr = parseOptionalInteger(
    params,
    SALARIO_LIQUIDO_PARAM_KEYS.dependentesIr,
    defaults.dependentesIr
  );
  const pensaoAlimenticia = parseOptionalNumber(
    params,
    SALARIO_LIQUIDO_PARAM_KEYS.pensaoAlimenticia,
    defaults.pensaoAlimenticia
  );
  const descontosManuais = parseOptionalNumber(
    params,
    SALARIO_LIQUIDO_PARAM_KEYS.descontosManuais,
    defaults.descontosManuais
  );
  const adiantamentos = parseOptionalNumber(
    params,
    SALARIO_LIQUIDO_PARAM_KEYS.adiantamentos,
    defaults.adiantamentos
  );
  const calcularDescontosLegais = parseBoolean(
    params,
    SALARIO_LIQUIDO_PARAM_KEYS.calcularDescontosLegais,
    defaults.calcularDescontosLegais
  );

  if (
    salarioBruto === null ||
    outrosProventosTributaveis === null ||
    outrosProventosNaoTributaveis === null ||
    dependentesIr === null ||
    pensaoAlimenticia === null ||
    descontosManuais === null ||
    adiantamentos === null ||
    calcularDescontosLegais === null
  ) {
    return null;
  }

  const inputs: SalarioLiquidoInputs = {
    salarioBruto,
    outrosProventosTributaveis,
    outrosProventosNaoTributaveis,
    dependentesIr,
    pensaoAlimenticia,
    descontosManuais,
    adiantamentos,
    calcularDescontosLegais,
    tabelaAno: 2026,
  };

  return validateSalarioLiquidoInputs(inputs).length === 0 ? { inputs } : null;
}

export function generateSalarioLiquidoShareUrl(baseUrl: string, state: SalarioLiquidoUrlState): string {
  const params = encodeSalarioLiquidoState(state);
  const url = new URL(baseUrl);
  url.search = params.toString();
  return url.toString();
}

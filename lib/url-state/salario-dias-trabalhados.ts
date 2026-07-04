import {
  getDefaultSalarioDiasTrabalhadosInputs,
  validateSalarioDiasTrabalhadosInputs,
  type SalarioDiasTrabalhadosInputs,
  type SalarioDiasTrabalhadosWarningCode,
  type SalarioDiasTrabalhadosDivisorModo,
} from "../calculators/salario-dias-trabalhados";

export const SALARIO_DIAS_TRABALHADOS_PARAM_KEYS = {
  salarioMensal: "s",
  diasRemunerados: "d",
  divisorModo: "dm",
  divisorManual: "dv",
  mesReferencia: "m",
  dataInicio: "pi",
  dataFim: "pf",
  usarPeriodo: "up",
  outrosProventosTributaveis: "ot",
  outrosProventosNaoTributaveis: "on",
  descontosManuais: "desc",
  dependentesIr: "dep",
  pensaoAlimenticia: "pa",
  calcularDescontosLegais: "dl",
  tabelaAno: "tb",
} as const;

export interface SalarioDiasTrabalhadosUrlState {
  inputs: SalarioDiasTrabalhadosInputs;
  warnings?: SalarioDiasTrabalhadosWarningCode[];
}

const DIVISOR_MODE_TO_PARAM: Record<SalarioDiasTrabalhadosDivisorModo, string> = {
  comercial30: "30",
  diasDoMes: "mes",
  manual: "man",
};

const PARAM_TO_DIVISOR_MODE: Record<string, SalarioDiasTrabalhadosDivisorModo> = {
  "30": "comercial30",
  mes: "diasDoMes",
  man: "manual",
};

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

function parseOptionalDate(params: URLSearchParams, key: string, fallback: string): string | null {
  const raw = params.get(key);
  if (raw === null || raw === "") return fallback;
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

function parseOptionalMonth(params: URLSearchParams, key: string, fallback: string): string | null {
  const raw = params.get(key);
  if (raw === null || raw === "") return fallback;
  return /^\d{4}-\d{2}$/.test(raw) ? raw : null;
}

function parseDivisorMode(params: URLSearchParams, fallback: SalarioDiasTrabalhadosDivisorModo) {
  const raw = params.get(SALARIO_DIAS_TRABALHADOS_PARAM_KEYS.divisorModo);
  if (raw === null || raw === "") return fallback;
  return PARAM_TO_DIVISOR_MODE[raw] ?? null;
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

function setStringIfPresent(params: URLSearchParams, key: string, value: string, defaultValue = "") {
  if (value !== defaultValue) {
    params.set(key, value);
  }
}

export function encodeSalarioDiasTrabalhadosState(state: SalarioDiasTrabalhadosUrlState): URLSearchParams {
  const params = new URLSearchParams();
  const defaults = getDefaultSalarioDiasTrabalhadosInputs();
  const { inputs } = state;

  params.set(SALARIO_DIAS_TRABALHADOS_PARAM_KEYS.tabelaAno, "2026");
  params.set(SALARIO_DIAS_TRABALHADOS_PARAM_KEYS.divisorModo, DIVISOR_MODE_TO_PARAM[inputs.divisorModo]);
  params.set(SALARIO_DIAS_TRABALHADOS_PARAM_KEYS.mesReferencia, inputs.mesReferencia);
  setNumberIfChanged(params, SALARIO_DIAS_TRABALHADOS_PARAM_KEYS.salarioMensal, inputs.salarioMensal, defaults.salarioMensal);
  setNumberIfChanged(
    params,
    SALARIO_DIAS_TRABALHADOS_PARAM_KEYS.diasRemunerados,
    inputs.diasRemunerados,
    defaults.diasRemunerados
  );
  setNumberIfChanged(
    params,
    SALARIO_DIAS_TRABALHADOS_PARAM_KEYS.divisorManual,
    inputs.divisorManual,
    defaults.divisorManual
  );
  setStringIfPresent(params, SALARIO_DIAS_TRABALHADOS_PARAM_KEYS.dataInicio, inputs.dataInicio);
  setStringIfPresent(params, SALARIO_DIAS_TRABALHADOS_PARAM_KEYS.dataFim, inputs.dataFim);
  setBooleanIfChanged(
    params,
    SALARIO_DIAS_TRABALHADOS_PARAM_KEYS.usarPeriodo,
    inputs.usarPeriodo,
    defaults.usarPeriodo
  );
  setNumberIfChanged(
    params,
    SALARIO_DIAS_TRABALHADOS_PARAM_KEYS.outrosProventosTributaveis,
    inputs.outrosProventosTributaveis,
    defaults.outrosProventosTributaveis
  );
  setNumberIfChanged(
    params,
    SALARIO_DIAS_TRABALHADOS_PARAM_KEYS.outrosProventosNaoTributaveis,
    inputs.outrosProventosNaoTributaveis,
    defaults.outrosProventosNaoTributaveis
  );
  setNumberIfChanged(
    params,
    SALARIO_DIAS_TRABALHADOS_PARAM_KEYS.descontosManuais,
    inputs.descontosManuais,
    defaults.descontosManuais
  );
  setNumberIfChanged(
    params,
    SALARIO_DIAS_TRABALHADOS_PARAM_KEYS.dependentesIr,
    inputs.dependentesIr,
    defaults.dependentesIr
  );
  setNumberIfChanged(
    params,
    SALARIO_DIAS_TRABALHADOS_PARAM_KEYS.pensaoAlimenticia,
    inputs.pensaoAlimenticia,
    defaults.pensaoAlimenticia
  );
  setBooleanIfChanged(
    params,
    SALARIO_DIAS_TRABALHADOS_PARAM_KEYS.calcularDescontosLegais,
    inputs.calcularDescontosLegais,
    defaults.calcularDescontosLegais
  );

  return params;
}

export function decodeSalarioDiasTrabalhadosState(params: URLSearchParams): SalarioDiasTrabalhadosUrlState | null {
  if (!params.toString()) return null;

  const defaults = getDefaultSalarioDiasTrabalhadosInputs();
  const tableYearIsSupported = params.get(SALARIO_DIAS_TRABALHADOS_PARAM_KEYS.tabelaAno) === "2026";
  const salarioMensal = parseOptionalNumber(params, SALARIO_DIAS_TRABALHADOS_PARAM_KEYS.salarioMensal, defaults.salarioMensal);
  const diasRemunerados = parseOptionalInteger(
    params,
    SALARIO_DIAS_TRABALHADOS_PARAM_KEYS.diasRemunerados,
    defaults.diasRemunerados
  );
  const divisorModo = parseDivisorMode(params, defaults.divisorModo);
  const divisorManual = parseOptionalNumber(
    params,
    SALARIO_DIAS_TRABALHADOS_PARAM_KEYS.divisorManual,
    defaults.divisorManual
  );
  const mesReferencia = parseOptionalMonth(
    params,
    SALARIO_DIAS_TRABALHADOS_PARAM_KEYS.mesReferencia,
    defaults.mesReferencia
  );
  const dataInicio = parseOptionalDate(params, SALARIO_DIAS_TRABALHADOS_PARAM_KEYS.dataInicio, defaults.dataInicio);
  const dataFim = parseOptionalDate(params, SALARIO_DIAS_TRABALHADOS_PARAM_KEYS.dataFim, defaults.dataFim);
  const usarPeriodo = parseBoolean(params, SALARIO_DIAS_TRABALHADOS_PARAM_KEYS.usarPeriodo, defaults.usarPeriodo);
  const outrosProventosTributaveis = parseOptionalNumber(
    params,
    SALARIO_DIAS_TRABALHADOS_PARAM_KEYS.outrosProventosTributaveis,
    defaults.outrosProventosTributaveis
  );
  const outrosProventosNaoTributaveis = parseOptionalNumber(
    params,
    SALARIO_DIAS_TRABALHADOS_PARAM_KEYS.outrosProventosNaoTributaveis,
    defaults.outrosProventosNaoTributaveis
  );
  const descontosManuais = parseOptionalNumber(
    params,
    SALARIO_DIAS_TRABALHADOS_PARAM_KEYS.descontosManuais,
    defaults.descontosManuais
  );
  const dependentesIr = parseOptionalInteger(
    params,
    SALARIO_DIAS_TRABALHADOS_PARAM_KEYS.dependentesIr,
    defaults.dependentesIr
  );
  const pensaoAlimenticia = parseOptionalNumber(
    params,
    SALARIO_DIAS_TRABALHADOS_PARAM_KEYS.pensaoAlimenticia,
    defaults.pensaoAlimenticia
  );
  const calcularDescontosLegais = parseBoolean(
    params,
    SALARIO_DIAS_TRABALHADOS_PARAM_KEYS.calcularDescontosLegais,
    defaults.calcularDescontosLegais
  );

  if (
    salarioMensal === null ||
    diasRemunerados === null ||
    divisorModo === null ||
    divisorManual === null ||
    mesReferencia === null ||
    dataInicio === null ||
    dataFim === null ||
    usarPeriodo === null ||
    outrosProventosTributaveis === null ||
    outrosProventosNaoTributaveis === null ||
    descontosManuais === null ||
    dependentesIr === null ||
    pensaoAlimenticia === null ||
    calcularDescontosLegais === null
  ) {
    return null;
  }

  const inputs: SalarioDiasTrabalhadosInputs = {
    salarioMensal,
    diasRemunerados,
    divisorModo,
    divisorManual,
    mesReferencia,
    dataInicio,
    dataFim,
    usarPeriodo,
    outrosProventosTributaveis,
    outrosProventosNaoTributaveis,
    descontosManuais,
    dependentesIr,
    pensaoAlimenticia,
    calcularDescontosLegais: tableYearIsSupported ? calcularDescontosLegais : false,
    tabelaAno: 2026,
  };

  if (validateSalarioDiasTrabalhadosInputs(inputs).length > 0) return null;

  return {
    inputs,
    warnings: tableYearIsSupported ? undefined : ["fonteUrlNaoSuportada"],
  };
}

export function generateSalarioDiasTrabalhadosShareUrl(
  baseUrl: string,
  state: SalarioDiasTrabalhadosUrlState
): string {
  const params = encodeSalarioDiasTrabalhadosState(state);
  const url = new URL(baseUrl);
  url.search = params.toString();
  return url.toString();
}

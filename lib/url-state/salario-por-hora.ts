import {
  getDefaultSalarioPorHoraInputs,
  validateSalarioPorHoraInputs,
  type SalarioPorHoraDivisorModo,
  type SalarioPorHoraInputs,
  type SalarioPorHoraModo,
  type SalarioPorHoraWarningCode,
} from "../calculators/salario-por-hora";

export const SALARIO_POR_HORA_PARAM_KEYS = {
  modo: "md",
  salarioMensal: "s",
  valorHora: "vh",
  divisorModo: "dm",
  jornadaSemanal: "js",
  divisorMensalManual: "hmn",
  horasPeriodo: "hp",
  adicionalPercentual: "ap",
  mostrarAdicional: "ma",
  sourceVersion: "sv",
} as const;

export const SALARIO_POR_HORA_SUPPORTED_SOURCE_VERSION = "2026-07-05";

export interface SalarioPorHoraUrlState {
  inputs: SalarioPorHoraInputs;
  warnings?: SalarioPorHoraWarningCode[];
}

const MODE_TO_PARAM: Record<SalarioPorHoraModo, string> = {
  mensalParaHora: "mh",
  horaParaMensal: "hm",
};

const PARAM_TO_MODE: Record<string, SalarioPorHoraModo> = {
  mh: "mensalParaHora",
  hm: "horaParaMensal",
};

const DIVISOR_MODE_TO_PARAM: Record<SalarioPorHoraDivisorModo, string> = {
  jornadaSemanal: "sem",
  manual: "man",
};

const PARAM_TO_DIVISOR_MODE: Record<string, SalarioPorHoraDivisorModo> = {
  sem: "jornadaSemanal",
  man: "manual",
};

function parseOptionalNumber(params: URLSearchParams, key: string, fallback: number): number | null {
  const raw = params.get(key);
  if (raw === null || raw === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function parseBoolean(params: URLSearchParams, key: string, fallback: boolean): boolean | null {
  const raw = params.get(key);
  if (raw === null || raw === "") return fallback;
  if (raw === "1" || raw === "true") return true;
  if (raw === "0" || raw === "false") return false;
  return null;
}

function parseMode(params: URLSearchParams, fallback: SalarioPorHoraModo): SalarioPorHoraModo | null {
  const raw = params.get(SALARIO_POR_HORA_PARAM_KEYS.modo);
  if (raw === null || raw === "") return fallback;
  return PARAM_TO_MODE[raw] ?? null;
}

function parseDivisorMode(
  params: URLSearchParams,
  fallback: SalarioPorHoraDivisorModo
): SalarioPorHoraDivisorModo | null {
  const raw = params.get(SALARIO_POR_HORA_PARAM_KEYS.divisorModo);
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

export function encodeSalarioPorHoraState(state: SalarioPorHoraUrlState): URLSearchParams {
  const params = new URLSearchParams();
  const defaults = getDefaultSalarioPorHoraInputs();
  const { inputs } = state;

  params.set(SALARIO_POR_HORA_PARAM_KEYS.sourceVersion, SALARIO_POR_HORA_SUPPORTED_SOURCE_VERSION);
  params.set(SALARIO_POR_HORA_PARAM_KEYS.modo, MODE_TO_PARAM[inputs.modo]);
  params.set(SALARIO_POR_HORA_PARAM_KEYS.divisorModo, DIVISOR_MODE_TO_PARAM[inputs.divisorModo]);

  if (inputs.divisorModo === "jornadaSemanal") {
    params.set(SALARIO_POR_HORA_PARAM_KEYS.jornadaSemanal, inputs.jornadaSemanal.toString());
    setNumberIfChanged(
      params,
      SALARIO_POR_HORA_PARAM_KEYS.divisorMensalManual,
      inputs.divisorMensalManual,
      defaults.divisorMensalManual
    );
  } else {
    params.set(SALARIO_POR_HORA_PARAM_KEYS.divisorMensalManual, inputs.divisorMensalManual.toString());
    setNumberIfChanged(
      params,
      SALARIO_POR_HORA_PARAM_KEYS.jornadaSemanal,
      inputs.jornadaSemanal,
      defaults.jornadaSemanal
    );
  }

  setNumberIfChanged(params, SALARIO_POR_HORA_PARAM_KEYS.salarioMensal, inputs.salarioMensal, defaults.salarioMensal);
  setNumberIfChanged(params, SALARIO_POR_HORA_PARAM_KEYS.valorHora, inputs.valorHora, defaults.valorHora);
  setNumberIfChanged(params, SALARIO_POR_HORA_PARAM_KEYS.horasPeriodo, inputs.horasPeriodo, defaults.horasPeriodo);
  setNumberIfChanged(
    params,
    SALARIO_POR_HORA_PARAM_KEYS.adicionalPercentual,
    inputs.adicionalPercentual,
    defaults.adicionalPercentual
  );
  setBooleanIfChanged(
    params,
    SALARIO_POR_HORA_PARAM_KEYS.mostrarAdicional,
    inputs.mostrarAdicional,
    defaults.mostrarAdicional
  );

  return params;
}

export function decodeSalarioPorHoraState(params: URLSearchParams): SalarioPorHoraUrlState | null {
  if (!params.toString()) return null;

  const defaults = getDefaultSalarioPorHoraInputs();
  const sourceVersionIsSupported =
    params.get(SALARIO_POR_HORA_PARAM_KEYS.sourceVersion) === SALARIO_POR_HORA_SUPPORTED_SOURCE_VERSION;
  const modo = parseMode(params, defaults.modo);
  const salarioMensal = parseOptionalNumber(params, SALARIO_POR_HORA_PARAM_KEYS.salarioMensal, defaults.salarioMensal);
  const valorHora = parseOptionalNumber(params, SALARIO_POR_HORA_PARAM_KEYS.valorHora, defaults.valorHora);
  const divisorModo = parseDivisorMode(params, defaults.divisorModo);
  const jornadaSemanal = parseOptionalNumber(
    params,
    SALARIO_POR_HORA_PARAM_KEYS.jornadaSemanal,
    defaults.jornadaSemanal
  );
  const divisorMensalManual = parseOptionalNumber(
    params,
    SALARIO_POR_HORA_PARAM_KEYS.divisorMensalManual,
    defaults.divisorMensalManual
  );
  const horasPeriodo = parseOptionalNumber(params, SALARIO_POR_HORA_PARAM_KEYS.horasPeriodo, defaults.horasPeriodo);
  const adicionalPercentual = parseOptionalNumber(
    params,
    SALARIO_POR_HORA_PARAM_KEYS.adicionalPercentual,
    defaults.adicionalPercentual
  );
  const mostrarAdicional = parseBoolean(
    params,
    SALARIO_POR_HORA_PARAM_KEYS.mostrarAdicional,
    defaults.mostrarAdicional
  );

  if (
    modo === null ||
    salarioMensal === null ||
    valorHora === null ||
    divisorModo === null ||
    jornadaSemanal === null ||
    divisorMensalManual === null ||
    horasPeriodo === null ||
    adicionalPercentual === null ||
    mostrarAdicional === null
  ) {
    return null;
  }

  const inputs: SalarioPorHoraInputs = {
    modo,
    salarioMensal,
    valorHora,
    divisorModo,
    jornadaSemanal,
    divisorMensalManual,
    horasPeriodo,
    adicionalPercentual,
    mostrarAdicional,
  };

  if (validateSalarioPorHoraInputs(inputs).length > 0) return null;

  return {
    inputs,
    warnings: sourceVersionIsSupported ? undefined : ["fonteUrlNaoSuportada"],
  };
}

export function generateSalarioPorHoraShareUrl(baseUrl: string, state: SalarioPorHoraUrlState): string {
  const params = encodeSalarioPorHoraState(state);
  const url = new URL(baseUrl);
  url.search = params.toString();
  return url.toString();
}

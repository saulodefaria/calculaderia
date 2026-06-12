import { validateFeriasInputs, type InputsFerias, type ModoFerias } from "../calculators/ferias";

export const FERIAS_PARAM_KEYS = {
  salarioMensal: "s",
  mediaVariavelMensal: "mv",
  modo: "m",
  dataInicioPeriodoAquisitivo: "ai",
  dataReferencia: "ref",
  dataInicioFerias: "fi",
  faltasInjustificadas: "fa",
  diasFerias: "df",
  converterAbono: "ab",
  diasAbono: "da",
  incluirSalarioDiasVendidos: "sv",
  dependentesIr: "dep",
  pensaoAlimenticia: "pa",
  outrosDescontos: "od",
  outrosAcrescimos: "oc",
  calcularDescontosLegais: "dl",
} as const;

const MODE_CODES: Record<ModoFerias, string> = {
  gozo: "g",
  proporcional: "p",
  vencidas: "v",
};

const MODE_DECODE: Record<string, ModoFerias> = {
  g: "gozo",
  p: "proporcional",
  v: "vencidas",
};

export interface FeriasUrlState {
  inputs: InputsFerias;
}

function parseRequiredNumber(params: URLSearchParams, key: string): number | null {
  const raw = params.get(key);
  if (raw === null || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function parseOptionalNumber(params: URLSearchParams, key: string, fallback = 0): number | null {
  const raw = params.get(key);
  if (raw === null || raw === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function parseRequiredInteger(params: URLSearchParams, key: string): number | null {
  const raw = params.get(key);
  if (raw === null || raw === "") return null;
  if (!/^-?\d+$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isInteger(value) ? value : null;
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

export function encodeFeriasState(state: FeriasUrlState): URLSearchParams {
  const params = new URLSearchParams();
  const { inputs } = state;

  params.set(FERIAS_PARAM_KEYS.salarioMensal, inputs.salarioMensal.toString());
  if (inputs.mediaVariavelMensal > 0) {
    params.set(FERIAS_PARAM_KEYS.mediaVariavelMensal, inputs.mediaVariavelMensal.toString());
  }
  params.set(FERIAS_PARAM_KEYS.modo, MODE_CODES[inputs.modo]);
  params.set(FERIAS_PARAM_KEYS.dataInicioPeriodoAquisitivo, inputs.dataInicioPeriodoAquisitivo);
  params.set(FERIAS_PARAM_KEYS.dataReferencia, inputs.dataReferencia);
  params.set(FERIAS_PARAM_KEYS.dataInicioFerias, inputs.dataInicioFerias);
  params.set(FERIAS_PARAM_KEYS.faltasInjustificadas, inputs.faltasInjustificadas.toString());
  params.set(FERIAS_PARAM_KEYS.diasFerias, inputs.diasFerias.toString());
  params.set(FERIAS_PARAM_KEYS.converterAbono, inputs.converterAbono ? "1" : "0");
  if (inputs.converterAbono && inputs.diasAbono > 0) {
    params.set(FERIAS_PARAM_KEYS.diasAbono, inputs.diasAbono.toString());
  }
  if (inputs.converterAbono) {
    params.set(FERIAS_PARAM_KEYS.incluirSalarioDiasVendidos, inputs.incluirSalarioDiasVendidos ? "1" : "0");
  }
  if (inputs.dependentesIr > 0) {
    params.set(FERIAS_PARAM_KEYS.dependentesIr, inputs.dependentesIr.toString());
  }
  if (inputs.pensaoAlimenticia > 0) {
    params.set(FERIAS_PARAM_KEYS.pensaoAlimenticia, inputs.pensaoAlimenticia.toString());
  }
  if (inputs.outrosDescontos > 0) {
    params.set(FERIAS_PARAM_KEYS.outrosDescontos, inputs.outrosDescontos.toString());
  }
  if (inputs.outrosAcrescimos > 0) {
    params.set(FERIAS_PARAM_KEYS.outrosAcrescimos, inputs.outrosAcrescimos.toString());
  }
  params.set(FERIAS_PARAM_KEYS.calcularDescontosLegais, inputs.calcularDescontosLegais ? "1" : "0");

  return params;
}

export function decodeFeriasState(params: URLSearchParams): FeriasUrlState | null {
  const salarioMensal = parseRequiredNumber(params, FERIAS_PARAM_KEYS.salarioMensal);
  const modo = MODE_DECODE[params.get(FERIAS_PARAM_KEYS.modo) ?? ""];
  const dataInicioPeriodoAquisitivo = params.get(FERIAS_PARAM_KEYS.dataInicioPeriodoAquisitivo);
  const dataReferencia = params.get(FERIAS_PARAM_KEYS.dataReferencia);
  const dataInicioFerias = params.get(FERIAS_PARAM_KEYS.dataInicioFerias);
  const faltasInjustificadas = parseRequiredInteger(params, FERIAS_PARAM_KEYS.faltasInjustificadas);
  const diasFerias = parseRequiredInteger(params, FERIAS_PARAM_KEYS.diasFerias);

  if (
    salarioMensal === null ||
    !modo ||
    !dataInicioPeriodoAquisitivo ||
    !dataReferencia ||
    !dataInicioFerias ||
    faltasInjustificadas === null ||
    diasFerias === null
  ) {
    return null;
  }

  const mediaVariavelMensal = parseOptionalNumber(params, FERIAS_PARAM_KEYS.mediaVariavelMensal);
  const converterAbono = parseBoolean(params, FERIAS_PARAM_KEYS.converterAbono, false);
  const diasAbono = parseOptionalInteger(params, FERIAS_PARAM_KEYS.diasAbono, 0);
  const incluirSalarioDiasVendidos = parseBoolean(params, FERIAS_PARAM_KEYS.incluirSalarioDiasVendidos, true);
  const dependentesIr = parseOptionalInteger(params, FERIAS_PARAM_KEYS.dependentesIr, 0);
  const pensaoAlimenticia = parseOptionalNumber(params, FERIAS_PARAM_KEYS.pensaoAlimenticia);
  const outrosDescontos = parseOptionalNumber(params, FERIAS_PARAM_KEYS.outrosDescontos);
  const outrosAcrescimos = parseOptionalNumber(params, FERIAS_PARAM_KEYS.outrosAcrescimos);
  const calcularDescontosLegais = parseBoolean(params, FERIAS_PARAM_KEYS.calcularDescontosLegais, true);

  if (
    mediaVariavelMensal === null ||
    converterAbono === null ||
    diasAbono === null ||
    incluirSalarioDiasVendidos === null ||
    dependentesIr === null ||
    pensaoAlimenticia === null ||
    outrosDescontos === null ||
    outrosAcrescimos === null ||
    calcularDescontosLegais === null
  ) {
    return null;
  }

  const inputs: InputsFerias = {
    salarioMensal,
    mediaVariavelMensal,
    modo,
    dataInicioPeriodoAquisitivo,
    dataReferencia,
    dataInicioFerias,
    faltasInjustificadas,
    diasFerias,
    converterAbono,
    diasAbono,
    incluirSalarioDiasVendidos,
    dependentesIr,
    pensaoAlimenticia,
    outrosDescontos,
    outrosAcrescimos,
    calcularDescontosLegais,
  };

  return validateFeriasInputs(inputs).length === 0 ? { inputs } : null;
}

export function generateFeriasShareUrl(baseUrl: string, state: FeriasUrlState): string {
  const params = encodeFeriasState(state);
  const url = new URL(baseUrl);
  url.search = params.toString();
  return url.toString();
}

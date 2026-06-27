import {
  CDB_SOURCE_VERSION,
  getDefaultCdbInputs,
  isCdbModo,
  validateCdbInputs,
  type CdbInputs,
  type CdbModo,
} from "../calculators/cdb";

export const CDB_PARAM_KEYS = {
  sourceVersion: "sv",
  modo: "m",
  valorInicial: "v",
  prazoDiasCorridos: "dc",
  diasUteis: "du",
  percentualCdi: "pc",
  cdiAnual: "cdi",
  taxaPreAnual: "pre",
} as const;

export type CdbUrlWarningCode = "staleSourceVersion";

export interface CdbUrlState {
  inputs: CdbInputs;
  warnings: CdbUrlWarningCode[];
}

function parseRequiredNumber(params: URLSearchParams, key: string): number | null {
  const raw = params.get(key);
  if (raw === null || raw === "") return null;
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

function parseModo(params: URLSearchParams): CdbModo | null {
  const raw = params.get(CDB_PARAM_KEYS.modo);
  if (raw === "cdi") return "pos-cdi";
  if (raw === "pre") return "pre";
  if (isCdbModo(raw)) return raw;
  return null;
}

function encodeModo(modo: CdbModo): string {
  return modo === "pos-cdi" ? "cdi" : "pre";
}

export function encodeCdbState(state: CdbUrlState | { inputs: CdbInputs }): URLSearchParams {
  const params = new URLSearchParams();
  const { inputs } = state;

  params.set(CDB_PARAM_KEYS.sourceVersion, CDB_SOURCE_VERSION);
  params.set(CDB_PARAM_KEYS.modo, encodeModo(inputs.modo));
  params.set(CDB_PARAM_KEYS.valorInicial, inputs.valorInicial.toString());
  params.set(CDB_PARAM_KEYS.prazoDiasCorridos, inputs.prazoDiasCorridos.toString());
  params.set(CDB_PARAM_KEYS.diasUteis, inputs.diasUteis.toString());

  if (inputs.modo === "pos-cdi") {
    params.set(CDB_PARAM_KEYS.percentualCdi, inputs.percentualCdi.toString());
    params.set(CDB_PARAM_KEYS.cdiAnual, inputs.cdiAnual.toString());
  } else {
    params.set(CDB_PARAM_KEYS.taxaPreAnual, inputs.taxaPreAnual.toString());
  }

  return params;
}

export function decodeCdbState(params: URLSearchParams): CdbUrlState | null {
  if (!params.toString()) return null;

  const rawSourceVersion = params.get(CDB_PARAM_KEYS.sourceVersion);
  if (rawSourceVersion !== CDB_SOURCE_VERSION) {
    return {
      inputs: getDefaultCdbInputs(),
      warnings: ["staleSourceVersion"],
    };
  }

  const defaults = getDefaultCdbInputs();
  const modo = parseModo(params);
  const valorInicial = parseRequiredNumber(params, CDB_PARAM_KEYS.valorInicial);
  const prazoDiasCorridos = parseRequiredInteger(params, CDB_PARAM_KEYS.prazoDiasCorridos);
  const diasUteis = parseRequiredInteger(params, CDB_PARAM_KEYS.diasUteis);

  if (modo === null || valorInicial === null || prazoDiasCorridos === null || diasUteis === null) {
    return null;
  }

  const percentualCdi =
    modo === "pos-cdi" ? parseRequiredNumber(params, CDB_PARAM_KEYS.percentualCdi) : defaults.percentualCdi;
  const cdiAnual = modo === "pos-cdi" ? parseRequiredNumber(params, CDB_PARAM_KEYS.cdiAnual) : defaults.cdiAnual;
  const taxaPreAnual = modo === "pre" ? parseRequiredNumber(params, CDB_PARAM_KEYS.taxaPreAnual) : defaults.taxaPreAnual;

  if (percentualCdi === null || cdiAnual === null || taxaPreAnual === null) {
    return null;
  }

  const inputs: CdbInputs = {
    modo,
    valorInicial,
    prazoDiasCorridos,
    diasUteis,
    percentualCdi,
    cdiAnual,
    taxaPreAnual,
    sourceVersion: CDB_SOURCE_VERSION,
  };

  return validateCdbInputs(inputs).length === 0 ? { inputs, warnings: [] } : null;
}

export function generateCdbShareUrl(baseUrl: string, state: CdbUrlState | { inputs: CdbInputs }): string {
  const params = encodeCdbState(state);
  const url = new URL(baseUrl);
  url.search = params.toString();
  return url.toString();
}

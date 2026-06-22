import {
  FGTS_SUPPORTED_SOURCE_VERSION,
  getDefaultFgtsInputs,
  validateFgtsInputs,
  type FgtsInputs,
  type FgtsMotivoRescisao,
  type FgtsTipoDeposito,
} from "../calculators/fgts";

export const FGTS_PARAM_KEYS = {
  sourceVersion: "sv",
  baseMensalFgts: "s",
  meses: "m",
  tipoDeposito: "tp",
  baseDecimoTerceiro: "d13",
  baseVerbasRescisoriasFgts: "vr",
  depositosExtrasInformados: "ex",
  saldoFgtsInformado: "fg",
  saldoIncluiDepositosEstimados: "fi",
  motivoRescisao: "mt",
  mostrarSaqueEstimado: "sq",
} as const;

const DEPOSIT_TYPE_CODES: Record<FgtsTipoDeposito, string> = {
  padrao8: "p8",
  aprendiz2: "a2",
};

const DEPOSIT_TYPE_DECODE: Record<string, FgtsTipoDeposito> = {
  p8: "padrao8",
  a2: "aprendiz2",
};

const TERMINATION_CODES: Record<FgtsMotivoRescisao, string> = {
  semRescisao: "none",
  semJustaCausa: "sjc",
  rescisaoIndiretaReconhecida: "ri",
  acordo484A: "ac",
  culpaReciprocaForcaMaior: "cfm",
  pedidoDemissao: "pd",
  justaCausa: "jc",
};

const TERMINATION_DECODE: Record<string, FgtsMotivoRescisao> = {
  none: "semRescisao",
  sjc: "semJustaCausa",
  ri: "rescisaoIndiretaReconhecida",
  ac: "acordo484A",
  cfm: "culpaReciprocaForcaMaior",
  pd: "pedidoDemissao",
  jc: "justaCausa",
};

export interface FgtsUrlState {
  inputs: FgtsInputs;
}

function parseOptionalNumber(params: URLSearchParams, key: string, fallback: number): number | null {
  const raw = params.get(key);
  if (raw === null || raw === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function parseOptionalNullableNumber(params: URLSearchParams, key: string): number | null | "invalid" {
  const raw = params.get(key);
  if (raw === null || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : "invalid";
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
  if (value !== defaultValue) params.set(key, value.toString());
}

function setBooleanIfChanged(params: URLSearchParams, key: string, value: boolean, defaultValue: boolean) {
  if (value !== defaultValue) params.set(key, value ? "1" : "0");
}

export function encodeFgtsState(state: FgtsUrlState): URLSearchParams {
  const params = new URLSearchParams();
  const defaults = getDefaultFgtsInputs();
  const { inputs } = state;

  params.set(FGTS_PARAM_KEYS.sourceVersion, FGTS_SUPPORTED_SOURCE_VERSION);
  setNumberIfChanged(params, FGTS_PARAM_KEYS.baseMensalFgts, inputs.baseMensalFgts, defaults.baseMensalFgts);
  setNumberIfChanged(params, FGTS_PARAM_KEYS.meses, inputs.meses, defaults.meses);
  if (inputs.tipoDeposito !== defaults.tipoDeposito) {
    params.set(FGTS_PARAM_KEYS.tipoDeposito, DEPOSIT_TYPE_CODES[inputs.tipoDeposito]);
  }
  setNumberIfChanged(params, FGTS_PARAM_KEYS.baseDecimoTerceiro, inputs.baseDecimoTerceiro, defaults.baseDecimoTerceiro);
  setNumberIfChanged(
    params,
    FGTS_PARAM_KEYS.baseVerbasRescisoriasFgts,
    inputs.baseVerbasRescisoriasFgts,
    defaults.baseVerbasRescisoriasFgts
  );
  setNumberIfChanged(
    params,
    FGTS_PARAM_KEYS.depositosExtrasInformados,
    inputs.depositosExtrasInformados,
    defaults.depositosExtrasInformados
  );
  if (inputs.saldoFgtsInformado !== null) {
    params.set(FGTS_PARAM_KEYS.saldoFgtsInformado, inputs.saldoFgtsInformado.toString());
  }
  setBooleanIfChanged(
    params,
    FGTS_PARAM_KEYS.saldoIncluiDepositosEstimados,
    inputs.saldoIncluiDepositosEstimados,
    defaults.saldoIncluiDepositosEstimados
  );
  if (inputs.motivoRescisao !== defaults.motivoRescisao) {
    params.set(FGTS_PARAM_KEYS.motivoRescisao, TERMINATION_CODES[inputs.motivoRescisao]);
  }
  setBooleanIfChanged(
    params,
    FGTS_PARAM_KEYS.mostrarSaqueEstimado,
    inputs.mostrarSaqueEstimado,
    defaults.mostrarSaqueEstimado
  );

  return params;
}

export function decodeFgtsState(params: URLSearchParams): FgtsUrlState | null {
  if (!params.toString()) return null;
  if (params.get(FGTS_PARAM_KEYS.sourceVersion) !== FGTS_SUPPORTED_SOURCE_VERSION) return null;

  const defaults = getDefaultFgtsInputs();
  const baseMensalFgts = parseOptionalNumber(params, FGTS_PARAM_KEYS.baseMensalFgts, defaults.baseMensalFgts);
  const meses = parseOptionalInteger(params, FGTS_PARAM_KEYS.meses, defaults.meses);
  const tipoDepositoRaw = params.get(FGTS_PARAM_KEYS.tipoDeposito);
  const tipoDeposito = tipoDepositoRaw ? DEPOSIT_TYPE_DECODE[tipoDepositoRaw] : defaults.tipoDeposito;
  const baseDecimoTerceiro = parseOptionalNumber(
    params,
    FGTS_PARAM_KEYS.baseDecimoTerceiro,
    defaults.baseDecimoTerceiro
  );
  const baseVerbasRescisoriasFgts = parseOptionalNumber(
    params,
    FGTS_PARAM_KEYS.baseVerbasRescisoriasFgts,
    defaults.baseVerbasRescisoriasFgts
  );
  const depositosExtrasInformados = parseOptionalNumber(
    params,
    FGTS_PARAM_KEYS.depositosExtrasInformados,
    defaults.depositosExtrasInformados
  );
  const saldoFgtsInformado = parseOptionalNullableNumber(params, FGTS_PARAM_KEYS.saldoFgtsInformado);
  const saldoIncluiDepositosEstimados = parseBoolean(
    params,
    FGTS_PARAM_KEYS.saldoIncluiDepositosEstimados,
    defaults.saldoIncluiDepositosEstimados
  );
  const motivoRescisaoRaw = params.get(FGTS_PARAM_KEYS.motivoRescisao);
  const motivoRescisao = motivoRescisaoRaw
    ? TERMINATION_DECODE[motivoRescisaoRaw]
    : defaults.motivoRescisao;
  const mostrarSaqueEstimado = parseBoolean(
    params,
    FGTS_PARAM_KEYS.mostrarSaqueEstimado,
    defaults.mostrarSaqueEstimado
  );

  if (
    baseMensalFgts === null ||
    meses === null ||
    !tipoDeposito ||
    baseDecimoTerceiro === null ||
    baseVerbasRescisoriasFgts === null ||
    depositosExtrasInformados === null ||
    saldoFgtsInformado === "invalid" ||
    saldoIncluiDepositosEstimados === null ||
    !motivoRescisao ||
    mostrarSaqueEstimado === null
  ) {
    return null;
  }

  const inputs: FgtsInputs = {
    baseMensalFgts,
    meses,
    tipoDeposito,
    baseDecimoTerceiro,
    baseVerbasRescisoriasFgts,
    depositosExtrasInformados,
    saldoFgtsInformado,
    saldoIncluiDepositosEstimados,
    motivoRescisao,
    mostrarSaqueEstimado,
    sourceVersion: FGTS_SUPPORTED_SOURCE_VERSION,
  };

  return validateFgtsInputs(inputs).length === 0 ? { inputs } : null;
}

export function generateFgtsShareUrl(baseUrl: string, state: FgtsUrlState): string {
  const params = encodeFgtsState(state);
  const url = new URL(baseUrl);
  url.search = params.toString();
  return url.toString();
}

import {
  getDefaultDecimoTerceiroInputs,
  validateDecimoTerceiroInputs,
  type InputsDecimoTerceiro,
  type ModoDecimoTerceiro,
} from "../calculators/decimo-terceiro";

export const DECIMO_TERCEIRO_PARAM_KEYS = {
  salarioMensal: "s",
  mediaVariavelMensal: "mv",
  anoReferencia: "y",
  dataAdmissao: "ad",
  dataReferencia: "rd",
  modoCalculo: "m",
  adiantamentoJaRecebido: "aa",
  calcularPrimeiraParcela: "pp",
  dependentesIr: "dep",
  pensaoAlimenticia: "pa",
  outrosDescontos: "od",
  outrosAcrescimos: "oa",
  calcularDescontosLegais: "dl",
} as const;

const MODE_CODES: Record<ModoDecimoTerceiro, string> = {
  projecaoAnual: "pa",
  proporcionalAteData: "pd",
};

const MODE_DECODE: Record<string, ModoDecimoTerceiro> = {
  pa: "projecaoAnual",
  pd: "proporcionalAteData",
};

export interface DecimoTerceiroUrlState {
  inputs: InputsDecimoTerceiro;
}

function defaultsForYear(year: number): InputsDecimoTerceiro {
  return getDefaultDecimoTerceiroInputs(new Date(year, 0, 1));
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

function setStringIfChanged(params: URLSearchParams, key: string, value: string, defaultValue: string) {
  if (value !== defaultValue) {
    params.set(key, value);
  }
}

function setBooleanIfChanged(params: URLSearchParams, key: string, value: boolean, defaultValue: boolean) {
  if (value !== defaultValue) {
    params.set(key, value ? "1" : "0");
  }
}

export function encodeDecimoTerceiroState(state: DecimoTerceiroUrlState, _today = new Date()): URLSearchParams {
  // Kept for compatibility with callers that inject runtime defaults; this share state now always pins `y`.
  void _today;

  const params = new URLSearchParams();
  const { inputs } = state;
  const selectedYearDefaults = defaultsForYear(inputs.anoReferencia);

  params.set(DECIMO_TERCEIRO_PARAM_KEYS.anoReferencia, inputs.anoReferencia.toString());
  setNumberIfChanged(
    params,
    DECIMO_TERCEIRO_PARAM_KEYS.salarioMensal,
    inputs.salarioMensal,
    selectedYearDefaults.salarioMensal
  );
  setNumberIfChanged(
    params,
    DECIMO_TERCEIRO_PARAM_KEYS.mediaVariavelMensal,
    inputs.mediaVariavelMensal,
    selectedYearDefaults.mediaVariavelMensal
  );
  setStringIfChanged(
    params,
    DECIMO_TERCEIRO_PARAM_KEYS.dataAdmissao,
    inputs.dataAdmissao,
    selectedYearDefaults.dataAdmissao
  );
  setStringIfChanged(
    params,
    DECIMO_TERCEIRO_PARAM_KEYS.dataReferencia,
    inputs.dataReferencia,
    selectedYearDefaults.dataReferencia
  );
  if (inputs.modoCalculo !== selectedYearDefaults.modoCalculo) {
    params.set(DECIMO_TERCEIRO_PARAM_KEYS.modoCalculo, MODE_CODES[inputs.modoCalculo]);
  }
  setNumberIfChanged(
    params,
    DECIMO_TERCEIRO_PARAM_KEYS.adiantamentoJaRecebido,
    inputs.adiantamentoJaRecebido,
    selectedYearDefaults.adiantamentoJaRecebido
  );
  setBooleanIfChanged(
    params,
    DECIMO_TERCEIRO_PARAM_KEYS.calcularPrimeiraParcela,
    inputs.calcularPrimeiraParcela,
    selectedYearDefaults.calcularPrimeiraParcela
  );
  setNumberIfChanged(
    params,
    DECIMO_TERCEIRO_PARAM_KEYS.dependentesIr,
    inputs.dependentesIr,
    selectedYearDefaults.dependentesIr
  );
  setNumberIfChanged(
    params,
    DECIMO_TERCEIRO_PARAM_KEYS.pensaoAlimenticia,
    inputs.pensaoAlimenticia,
    selectedYearDefaults.pensaoAlimenticia
  );
  setNumberIfChanged(
    params,
    DECIMO_TERCEIRO_PARAM_KEYS.outrosDescontos,
    inputs.outrosDescontos,
    selectedYearDefaults.outrosDescontos
  );
  setNumberIfChanged(
    params,
    DECIMO_TERCEIRO_PARAM_KEYS.outrosAcrescimos,
    inputs.outrosAcrescimos,
    selectedYearDefaults.outrosAcrescimos
  );
  setBooleanIfChanged(
    params,
    DECIMO_TERCEIRO_PARAM_KEYS.calcularDescontosLegais,
    inputs.calcularDescontosLegais,
    selectedYearDefaults.calcularDescontosLegais
  );

  return params;
}

export function decodeDecimoTerceiroState(
  params: URLSearchParams,
  today = new Date()
): DecimoTerceiroUrlState | null {
  const currentDefaults = getDefaultDecimoTerceiroInputs(today);
  const anoReferencia = parseOptionalInteger(
    params,
    DECIMO_TERCEIRO_PARAM_KEYS.anoReferencia,
    currentDefaults.anoReferencia
  );
  if (anoReferencia === null) return null;

  const defaults = defaultsForYear(anoReferencia);
  const salarioMensal = parseOptionalNumber(params, DECIMO_TERCEIRO_PARAM_KEYS.salarioMensal, defaults.salarioMensal);
  const mediaVariavelMensal = parseOptionalNumber(
    params,
    DECIMO_TERCEIRO_PARAM_KEYS.mediaVariavelMensal,
    defaults.mediaVariavelMensal
  );
  const modeRaw = params.get(DECIMO_TERCEIRO_PARAM_KEYS.modoCalculo);
  const modoCalculo = modeRaw === null || modeRaw === "" ? defaults.modoCalculo : MODE_DECODE[modeRaw];
  const adiantamentoJaRecebido = parseOptionalNumber(
    params,
    DECIMO_TERCEIRO_PARAM_KEYS.adiantamentoJaRecebido,
    defaults.adiantamentoJaRecebido
  );
  const calcularPrimeiraParcela = parseBoolean(
    params,
    DECIMO_TERCEIRO_PARAM_KEYS.calcularPrimeiraParcela,
    defaults.calcularPrimeiraParcela
  );
  const dependentesIr = parseOptionalInteger(params, DECIMO_TERCEIRO_PARAM_KEYS.dependentesIr, defaults.dependentesIr);
  const pensaoAlimenticia = parseOptionalNumber(
    params,
    DECIMO_TERCEIRO_PARAM_KEYS.pensaoAlimenticia,
    defaults.pensaoAlimenticia
  );
  const outrosDescontos = parseOptionalNumber(
    params,
    DECIMO_TERCEIRO_PARAM_KEYS.outrosDescontos,
    defaults.outrosDescontos
  );
  const outrosAcrescimos = parseOptionalNumber(
    params,
    DECIMO_TERCEIRO_PARAM_KEYS.outrosAcrescimos,
    defaults.outrosAcrescimos
  );
  const calcularDescontosLegais = parseBoolean(
    params,
    DECIMO_TERCEIRO_PARAM_KEYS.calcularDescontosLegais,
    defaults.calcularDescontosLegais
  );

  if (
    salarioMensal === null ||
    mediaVariavelMensal === null ||
    !modoCalculo ||
    adiantamentoJaRecebido === null ||
    calcularPrimeiraParcela === null ||
    dependentesIr === null ||
    pensaoAlimenticia === null ||
    outrosDescontos === null ||
    outrosAcrescimos === null ||
    calcularDescontosLegais === null
  ) {
    return null;
  }

  const inputs: InputsDecimoTerceiro = {
    salarioMensal,
    mediaVariavelMensal,
    anoReferencia,
    dataAdmissao: params.get(DECIMO_TERCEIRO_PARAM_KEYS.dataAdmissao) || defaults.dataAdmissao,
    dataReferencia: params.get(DECIMO_TERCEIRO_PARAM_KEYS.dataReferencia) || defaults.dataReferencia,
    modoCalculo,
    adiantamentoJaRecebido,
    calcularPrimeiraParcela,
    dependentesIr,
    pensaoAlimenticia,
    outrosDescontos,
    outrosAcrescimos,
    calcularDescontosLegais,
  };

  return validateDecimoTerceiroInputs(inputs).length === 0 ? { inputs } : null;
}

export function generateDecimoTerceiroShareUrl(
  baseUrl: string,
  state: DecimoTerceiroUrlState,
  today = new Date()
): string {
  const params = encodeDecimoTerceiroState(state, today);
  const url = new URL(baseUrl);
  url.search = params.toString();
  return url.toString();
}

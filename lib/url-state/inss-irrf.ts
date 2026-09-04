import {
  INSS_IRRF_SUPPORTED_SOURCE_VERSION,
  INSS_IRRF_SUPPORTED_TABLE_YEAR,
  getDefaultInssIrrfInputs,
  validateInssIrrfInputs,
  type InssIrrfCategoriaSegurado,
  type InssIrrfInputs,
} from "../calculators/inss-irrf";

export const INSS_IRRF_PARAM_KEYS = {
  tabelaAno: "tb",
  sourceVersion: "sv",
  rendimentosTributaveis: "r",
  outrosRendimentosTributaveis: "o",
  categoriaSegurado: "cat",
  dependentesIr: "dep",
  pensaoAlimenticia: "pa",
  considerarDescontoSimplificado: "ds",
} as const;

const CATEGORY_CODES: Record<InssIrrfCategoriaSegurado, string> = {
  empregado: "e",
  domestico: "d",
  avulso: "a",
};

const CATEGORY_DECODE: Record<string, InssIrrfCategoriaSegurado> = {
  e: "empregado",
  d: "domestico",
  a: "avulso",
};

export type InssIrrfUrlWarningCode = "staleSourceVersion";

export interface InssIrrfUrlState {
  inputs: InssIrrfInputs;
  warnings: InssIrrfUrlWarningCode[];
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
  if (!/^\d+$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isInteger(value) ? value : null;
}

function parseOptionalBoolean(params: URLSearchParams, key: string, fallback: boolean): boolean | null {
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

export function encodeInssIrrfState(state: InssIrrfUrlState): URLSearchParams {
  const params = new URLSearchParams();
  const defaults = getDefaultInssIrrfInputs();
  const { inputs } = state;

  params.set(INSS_IRRF_PARAM_KEYS.tabelaAno, INSS_IRRF_SUPPORTED_TABLE_YEAR.toString());
  params.set(INSS_IRRF_PARAM_KEYS.sourceVersion, INSS_IRRF_SUPPORTED_SOURCE_VERSION);
  setNumberIfChanged(
    params,
    INSS_IRRF_PARAM_KEYS.rendimentosTributaveis,
    inputs.rendimentosTributaveis,
    defaults.rendimentosTributaveis
  );
  setNumberIfChanged(
    params,
    INSS_IRRF_PARAM_KEYS.outrosRendimentosTributaveis,
    inputs.outrosRendimentosTributaveis,
    defaults.outrosRendimentosTributaveis
  );
  if (inputs.categoriaSegurado !== defaults.categoriaSegurado) {
    params.set(INSS_IRRF_PARAM_KEYS.categoriaSegurado, CATEGORY_CODES[inputs.categoriaSegurado]);
  }
  setNumberIfChanged(params, INSS_IRRF_PARAM_KEYS.dependentesIr, inputs.dependentesIr, defaults.dependentesIr);
  setNumberIfChanged(
    params,
    INSS_IRRF_PARAM_KEYS.pensaoAlimenticia,
    inputs.pensaoAlimenticia,
    defaults.pensaoAlimenticia
  );
  setBooleanIfChanged(
    params,
    INSS_IRRF_PARAM_KEYS.considerarDescontoSimplificado,
    inputs.considerarDescontoSimplificado,
    defaults.considerarDescontoSimplificado
  );

  return params;
}

export function decodeInssIrrfState(params: URLSearchParams): InssIrrfUrlState | null {
  if (!params.toString()) return null;
  if (params.get(INSS_IRRF_PARAM_KEYS.tabelaAno) !== INSS_IRRF_SUPPORTED_TABLE_YEAR.toString()) return null;

  const defaults = getDefaultInssIrrfInputs();
  const sourceVersion = params.get(INSS_IRRF_PARAM_KEYS.sourceVersion);
  const warnings: InssIrrfUrlWarningCode[] =
    sourceVersion === INSS_IRRF_SUPPORTED_SOURCE_VERSION ? [] : ["staleSourceVersion"];
  const rendimentosTributaveis = parseOptionalNumber(
    params,
    INSS_IRRF_PARAM_KEYS.rendimentosTributaveis,
    defaults.rendimentosTributaveis
  );
  const outrosRendimentosTributaveis = parseOptionalNumber(
    params,
    INSS_IRRF_PARAM_KEYS.outrosRendimentosTributaveis,
    defaults.outrosRendimentosTributaveis
  );
  const categoriaRaw = params.get(INSS_IRRF_PARAM_KEYS.categoriaSegurado);
  const categoriaSegurado = categoriaRaw ? CATEGORY_DECODE[categoriaRaw] : defaults.categoriaSegurado;
  const dependentesIr = parseOptionalInteger(params, INSS_IRRF_PARAM_KEYS.dependentesIr, defaults.dependentesIr);
  const pensaoAlimenticia = parseOptionalNumber(
    params,
    INSS_IRRF_PARAM_KEYS.pensaoAlimenticia,
    defaults.pensaoAlimenticia
  );
  const considerarDescontoSimplificado = parseOptionalBoolean(
    params,
    INSS_IRRF_PARAM_KEYS.considerarDescontoSimplificado,
    defaults.considerarDescontoSimplificado
  );

  if (
    rendimentosTributaveis === null ||
    outrosRendimentosTributaveis === null ||
    !categoriaSegurado ||
    dependentesIr === null ||
    pensaoAlimenticia === null ||
    considerarDescontoSimplificado === null
  ) {
    return null;
  }

  const inputs: InssIrrfInputs = {
    rendimentosTributaveis,
    outrosRendimentosTributaveis,
    categoriaSegurado,
    dependentesIr,
    pensaoAlimenticia,
    considerarDescontoSimplificado,
    tabelaAno: INSS_IRRF_SUPPORTED_TABLE_YEAR,
  };

  return validateInssIrrfInputs(inputs).length === 0 ? { inputs, warnings } : null;
}

export function generateInssIrrfShareUrl(baseUrl: string, state: InssIrrfUrlState): string {
  const params = encodeInssIrrfState(state);
  const url = new URL(baseUrl);
  url.search = params.toString();
  return url.toString();
}

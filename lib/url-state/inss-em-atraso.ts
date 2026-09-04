import {
  INSS_EM_ATRASO_SOURCE_VERSION,
  getDefaultInssEmAtrasoInputs,
  validateInssEmAtrasoInputs,
  type InssEmAtrasoCategoriaSegurado,
  type InssEmAtrasoInputs,
  type InssEmAtrasoWarningCode,
} from "../calculators/inss-em-atraso";

export const INSS_EM_ATRASO_PARAM_KEYS = {
  sourceVersion: "sv",
  valorPrincipal: "v",
  competencia: "comp",
  dataVencimento: "due",
  dataPagamento: "pay",
  categoriaSegurado: "cat",
  diasAtrasoManual: "days",
} as const;

export interface InssEmAtrasoUrlState {
  inputs: InssEmAtrasoInputs;
  warnings?: InssEmAtrasoWarningCode[];
}

const CATEGORY_TO_PARAM: Record<InssEmAtrasoCategoriaSegurado, string> = {
  contribuinteIndividual: "ci",
  facultativo: "fac",
};

const PARAM_TO_CATEGORY: Record<string, InssEmAtrasoCategoriaSegurado> = {
  ci: "contribuinteIndividual",
  fac: "facultativo",
};

function parseOptionalNumber(params: URLSearchParams, key: string, fallback: number): number | null {
  const raw = params.get(key);
  if (raw === null || raw === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function parseOptionalInteger(params: URLSearchParams, key: string): number | null {
  const raw = params.get(key);
  if (raw === null || raw === "") return null;
  if (!/^\d+$/.test(raw)) return Number.NaN;
  return Number(raw);
}

function parseOptionalString(params: URLSearchParams, key: string, fallback: string): string {
  const raw = params.get(key);
  return raw === null || raw === "" ? fallback : raw;
}

function parseCategory(
  params: URLSearchParams,
  fallback: InssEmAtrasoCategoriaSegurado
): InssEmAtrasoCategoriaSegurado | null {
  const raw = params.get(INSS_EM_ATRASO_PARAM_KEYS.categoriaSegurado);
  if (raw === null || raw === "") return fallback;
  return PARAM_TO_CATEGORY[raw] ?? null;
}

export function encodeInssEmAtrasoState(state: InssEmAtrasoUrlState): URLSearchParams {
  const params = new URLSearchParams();
  const { inputs } = state;

  params.set(INSS_EM_ATRASO_PARAM_KEYS.sourceVersion, INSS_EM_ATRASO_SOURCE_VERSION);
  params.set(INSS_EM_ATRASO_PARAM_KEYS.valorPrincipal, inputs.valorPrincipal.toString());
  params.set(INSS_EM_ATRASO_PARAM_KEYS.competencia, inputs.competencia);
  params.set(INSS_EM_ATRASO_PARAM_KEYS.dataVencimento, inputs.dataVencimento);
  params.set(INSS_EM_ATRASO_PARAM_KEYS.dataPagamento, inputs.dataPagamento);
  params.set(INSS_EM_ATRASO_PARAM_KEYS.categoriaSegurado, CATEGORY_TO_PARAM[inputs.categoriaSegurado]);

  if (inputs.diasAtrasoManual !== null) {
    params.set(INSS_EM_ATRASO_PARAM_KEYS.diasAtrasoManual, inputs.diasAtrasoManual.toString());
  }

  return params;
}

export function decodeInssEmAtrasoState(params: URLSearchParams): InssEmAtrasoUrlState | null {
  if (!params.toString()) return null;

  const defaults = getDefaultInssEmAtrasoInputs();
  const sourceVersionIsSupported =
    params.get(INSS_EM_ATRASO_PARAM_KEYS.sourceVersion) === INSS_EM_ATRASO_SOURCE_VERSION;
  const valorPrincipal = parseOptionalNumber(
    params,
    INSS_EM_ATRASO_PARAM_KEYS.valorPrincipal,
    defaults.valorPrincipal
  );
  const competencia = parseOptionalString(params, INSS_EM_ATRASO_PARAM_KEYS.competencia, defaults.competencia);
  const dataVencimento = parseOptionalString(
    params,
    INSS_EM_ATRASO_PARAM_KEYS.dataVencimento,
    defaults.dataVencimento
  );
  const dataPagamento = parseOptionalString(params, INSS_EM_ATRASO_PARAM_KEYS.dataPagamento, defaults.dataPagamento);
  const categoriaSegurado = parseCategory(params, defaults.categoriaSegurado);
  const diasAtrasoManual = parseOptionalInteger(params, INSS_EM_ATRASO_PARAM_KEYS.diasAtrasoManual);

  if (
    valorPrincipal === null ||
    categoriaSegurado === null ||
    Number.isNaN(diasAtrasoManual)
  ) {
    return null;
  }

  const inputs: InssEmAtrasoInputs = {
    valorPrincipal,
    competencia,
    categoriaSegurado,
    dataVencimento,
    dataPagamento,
    diasAtrasoManual,
    confirmarPrincipalUsuario: true,
  };

  if (validateInssEmAtrasoInputs(inputs).some((error) => error !== "pagamentoAntesVencimento")) return null;

  return {
    inputs,
    warnings: sourceVersionIsSupported ? undefined : ["fonteUrlNaoSuportada"],
  };
}

export function generateInssEmAtrasoShareUrl(baseUrl: string, state: InssEmAtrasoUrlState): string {
  const params = encodeInssEmAtrasoState(state);
  const url = new URL(baseUrl);
  url.search = params.toString();
  return url.toString();
}

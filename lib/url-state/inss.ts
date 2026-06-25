import {
  INSS_SUPPORTED_TABLE_YEAR,
  getDefaultInssInputs,
  validateInssInputs,
  type InssCategoriaSegurado,
  type InssInputs,
} from "../calculators/inss";

export const INSS_PARAM_KEYS = {
  tabelaAno: "tb",
  salarioContribuicao: "s",
  outrasRemuneracoes: "o",
  categoriaSegurado: "cat",
} as const;

const CATEGORY_CODES: Record<InssCategoriaSegurado, string> = {
  empregado: "e",
  domestico: "d",
  avulso: "a",
};

const CATEGORY_DECODE: Record<string, InssCategoriaSegurado> = {
  e: "empregado",
  d: "domestico",
  a: "avulso",
};

export interface InssUrlState {
  inputs: InssInputs;
}

function parseOptionalNumber(params: URLSearchParams, key: string, fallback: number): number | null {
  const raw = params.get(key);
  if (raw === null || raw === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function setNumberIfChanged(params: URLSearchParams, key: string, value: number, defaultValue: number) {
  if (value !== defaultValue) params.set(key, value.toString());
}

export function encodeInssState(state: InssUrlState): URLSearchParams {
  const params = new URLSearchParams();
  const defaults = getDefaultInssInputs();
  const { inputs } = state;

  params.set(INSS_PARAM_KEYS.tabelaAno, INSS_SUPPORTED_TABLE_YEAR.toString());
  setNumberIfChanged(
    params,
    INSS_PARAM_KEYS.salarioContribuicao,
    inputs.salarioContribuicao,
    defaults.salarioContribuicao
  );
  setNumberIfChanged(
    params,
    INSS_PARAM_KEYS.outrasRemuneracoes,
    inputs.outrasRemuneracoes,
    defaults.outrasRemuneracoes
  );
  if (inputs.categoriaSegurado !== defaults.categoriaSegurado) {
    params.set(INSS_PARAM_KEYS.categoriaSegurado, CATEGORY_CODES[inputs.categoriaSegurado]);
  }

  return params;
}

export function decodeInssState(params: URLSearchParams): InssUrlState | null {
  if (!params.toString()) return null;
  if (params.get(INSS_PARAM_KEYS.tabelaAno) !== INSS_SUPPORTED_TABLE_YEAR.toString()) return null;

  const defaults = getDefaultInssInputs();
  const salarioContribuicao = parseOptionalNumber(
    params,
    INSS_PARAM_KEYS.salarioContribuicao,
    defaults.salarioContribuicao
  );
  const outrasRemuneracoes = parseOptionalNumber(
    params,
    INSS_PARAM_KEYS.outrasRemuneracoes,
    defaults.outrasRemuneracoes
  );
  const categoriaRaw = params.get(INSS_PARAM_KEYS.categoriaSegurado);
  const categoriaSegurado = categoriaRaw ? CATEGORY_DECODE[categoriaRaw] : defaults.categoriaSegurado;

  if (salarioContribuicao === null || outrasRemuneracoes === null || !categoriaSegurado) return null;

  const inputs: InssInputs = {
    salarioContribuicao,
    outrasRemuneracoes,
    categoriaSegurado,
    tabelaAno: INSS_SUPPORTED_TABLE_YEAR,
  };

  return validateInssInputs(inputs).length === 0 ? { inputs } : null;
}

export function generateInssShareUrl(baseUrl: string, state: InssUrlState): string {
  const params = encodeInssState(state);
  const url = new URL(baseUrl);
  url.search = params.toString();
  return url.toString();
}

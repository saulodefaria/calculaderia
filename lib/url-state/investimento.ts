import {
  INVESTIMENTO_SUPPORTED_SOURCE_VERSION,
  getDefaultInvestimentoInputs,
  validateInvestimentoInputs,
  type InvestimentoAporteTiming,
  type InvestimentoInputs,
  type InvestimentoMode,
  type InvestimentoTaxaPeriodo,
} from "../calculators/investimento";

export const INVESTIMENTO_PARAM_KEYS = {
  sourceVersion: "sv",
  mode: "m",
  valorInicial: "vi",
  aporteMensal: "am",
  metaValor: "mv",
  prazoMeses: "pm",
  taxa: "tx",
  taxaPeriodo: "tp",
  aporteTiming: "at",
  inflacaoAnual: "ia",
} as const;

const MODE_CODES: Record<InvestimentoMode, string> = {
  projection: "p",
  requiredContribution: "a",
  timeToGoal: "t",
};

const MODE_DECODE: Record<string, InvestimentoMode> = {
  p: "projection",
  a: "requiredContribution",
  t: "timeToGoal",
};

const TAXA_PERIODO_CODES: Record<InvestimentoTaxaPeriodo, string> = {
  anualEfetiva: "a",
  mensal: "m",
};

const TAXA_PERIODO_DECODE: Record<string, InvestimentoTaxaPeriodo> = {
  a: "anualEfetiva",
  m: "mensal",
};

const APORTE_TIMING_CODES: Record<InvestimentoAporteTiming, string> = {
  fim: "f",
  inicio: "i",
};

const APORTE_TIMING_DECODE: Record<string, InvestimentoAporteTiming> = {
  f: "fim",
  i: "inicio",
};

export type InvestimentoUrlWarningCode = "staleSourceVersion";

export interface InvestimentoUrlState {
  inputs: InvestimentoInputs;
  warnings: InvestimentoUrlWarningCode[];
}

function parseNumber(params: URLSearchParams, key: string, fallback: number): number | null {
  const raw = params.get(key);
  if (raw === null || raw === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function parseNullableNumber(params: URLSearchParams, key: string, fallback: number | null): number | null | undefined {
  const raw = params.get(key);
  if (raw === null || raw === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function parseInteger(params: URLSearchParams, key: string, fallback: number): number | null {
  const raw = params.get(key);
  if (raw === null || raw === "") return fallback;
  if (!/^\d+$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isInteger(value) ? value : null;
}

export function encodeInvestimentoState(state: InvestimentoUrlState): URLSearchParams {
  const params = new URLSearchParams();
  const { inputs } = state;

  params.set(INVESTIMENTO_PARAM_KEYS.sourceVersion, INVESTIMENTO_SUPPORTED_SOURCE_VERSION);
  params.set(INVESTIMENTO_PARAM_KEYS.mode, MODE_CODES[inputs.mode]);
  params.set(INVESTIMENTO_PARAM_KEYS.valorInicial, inputs.valorInicial.toString());
  params.set(INVESTIMENTO_PARAM_KEYS.aporteMensal, inputs.aporteMensal.toString());
  params.set(INVESTIMENTO_PARAM_KEYS.metaValor, inputs.metaValor.toString());
  params.set(INVESTIMENTO_PARAM_KEYS.prazoMeses, inputs.prazoMeses.toString());
  params.set(INVESTIMENTO_PARAM_KEYS.taxa, inputs.taxa.toString());
  params.set(INVESTIMENTO_PARAM_KEYS.taxaPeriodo, TAXA_PERIODO_CODES[inputs.taxaPeriodo]);
  params.set(INVESTIMENTO_PARAM_KEYS.aporteTiming, APORTE_TIMING_CODES[inputs.aporteTiming]);
  if (inputs.inflacaoAnual !== null) {
    params.set(INVESTIMENTO_PARAM_KEYS.inflacaoAnual, inputs.inflacaoAnual.toString());
  }

  return params;
}

export function decodeInvestimentoState(params: URLSearchParams): InvestimentoUrlState | null {
  if (!params.toString()) return null;

  const sourceVersion = params.get(INVESTIMENTO_PARAM_KEYS.sourceVersion);
  if (sourceVersion !== INVESTIMENTO_SUPPORTED_SOURCE_VERSION) {
    return {
      inputs: getDefaultInvestimentoInputs(),
      warnings: ["staleSourceVersion"],
    };
  }

  const defaults = getDefaultInvestimentoInputs();
  const rawMode = params.get(INVESTIMENTO_PARAM_KEYS.mode);
  const rawTaxaPeriodo = params.get(INVESTIMENTO_PARAM_KEYS.taxaPeriodo);
  const rawAporteTiming = params.get(INVESTIMENTO_PARAM_KEYS.aporteTiming);
  const mode = rawMode ? MODE_DECODE[rawMode] : defaults.mode;
  const taxaPeriodo = rawTaxaPeriodo ? TAXA_PERIODO_DECODE[rawTaxaPeriodo] : defaults.taxaPeriodo;
  const aporteTiming = rawAporteTiming ? APORTE_TIMING_DECODE[rawAporteTiming] : defaults.aporteTiming;
  const valorInicial = parseNumber(params, INVESTIMENTO_PARAM_KEYS.valorInicial, defaults.valorInicial);
  const aporteMensal = parseNumber(params, INVESTIMENTO_PARAM_KEYS.aporteMensal, defaults.aporteMensal);
  const metaValor = parseNumber(params, INVESTIMENTO_PARAM_KEYS.metaValor, defaults.metaValor);
  const prazoMeses = parseInteger(params, INVESTIMENTO_PARAM_KEYS.prazoMeses, defaults.prazoMeses);
  const taxa = parseNumber(params, INVESTIMENTO_PARAM_KEYS.taxa, defaults.taxa);
  const inflacaoAnual = parseNullableNumber(
    params,
    INVESTIMENTO_PARAM_KEYS.inflacaoAnual,
    defaults.inflacaoAnual
  );

  if (
    !mode ||
    !taxaPeriodo ||
    !aporteTiming ||
    valorInicial === null ||
    aporteMensal === null ||
    metaValor === null ||
    prazoMeses === null ||
    taxa === null ||
    inflacaoAnual === undefined
  ) {
    return null;
  }

  const inputs: InvestimentoInputs = {
    mode,
    valorInicial,
    aporteMensal,
    metaValor,
    prazoMeses,
    taxa,
    taxaPeriodo,
    aporteTiming,
    inflacaoAnual,
  };

  return validateInvestimentoInputs(inputs).length === 0 ? { inputs, warnings: [] } : null;
}

export function generateInvestimentoShareUrl(baseUrl: string, state: InvestimentoUrlState): string {
  const params = encodeInvestimentoState(state);
  const url = new URL(baseUrl);
  url.search = params.toString();
  return url.toString();
}

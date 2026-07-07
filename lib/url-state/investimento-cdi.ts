import {
  INVESTIMENTO_CDI_SOURCE_VERSION,
  getDefaultInvestimentoCdiInputs,
  isInvestimentoCdiDiasUteisModo,
  isInvestimentoCdiModo,
  validateInvestimentoCdiInputs,
  type InvestimentoCdiDiasUteisModo,
  type InvestimentoCdiInputs,
  type InvestimentoCdiModo,
} from "../calculators/investimento-cdi";

export const INVESTIMENTO_CDI_PARAM_KEYS = {
  sourceVersion: "sv",
  valorInicial: "v",
  prazoDiasCorridos: "dc",
  diasUteis: "du",
  diasUteisModo: "dum",
  percentualCdi: "pc",
  cdiModo: "cm",
  cdiAnualManual: "cdi",
} as const;

export type InvestimentoCdiUrlWarningCode = "staleSourceVersion";

export interface InvestimentoCdiUrlState {
  inputs: InvestimentoCdiInputs;
  warnings: InvestimentoCdiUrlWarningCode[];
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

function parseDiasUteisModo(params: URLSearchParams): InvestimentoCdiDiasUteisModo | null {
  const raw = params.get(INVESTIMENTO_CDI_PARAM_KEYS.diasUteisModo);
  if (raw === "e") return "estimado";
  if (raw === "m") return "manual";
  if (isInvestimentoCdiDiasUteisModo(raw)) return raw;
  return null;
}

function parseCdiModo(params: URLSearchParams): InvestimentoCdiModo | null {
  const raw = params.get(INVESTIMENTO_CDI_PARAM_KEYS.cdiModo);
  if (raw === "s") return "snapshot";
  if (raw === "m") return "manual";
  if (isInvestimentoCdiModo(raw)) return raw;
  return null;
}

function encodeDiasUteisModo(modo: InvestimentoCdiDiasUteisModo): string {
  return modo === "estimado" ? "e" : "m";
}

function encodeCdiModo(modo: InvestimentoCdiModo): string {
  return modo === "snapshot" ? "s" : "m";
}

export function encodeInvestimentoCdiState(
  state: InvestimentoCdiUrlState | { inputs: InvestimentoCdiInputs }
): URLSearchParams {
  const params = new URLSearchParams();
  const { inputs } = state;

  params.set(INVESTIMENTO_CDI_PARAM_KEYS.sourceVersion, INVESTIMENTO_CDI_SOURCE_VERSION);
  params.set(INVESTIMENTO_CDI_PARAM_KEYS.valorInicial, inputs.valorInicial.toString());
  params.set(INVESTIMENTO_CDI_PARAM_KEYS.prazoDiasCorridos, inputs.prazoDiasCorridos.toString());
  params.set(INVESTIMENTO_CDI_PARAM_KEYS.diasUteis, inputs.diasUteis.toString());
  params.set(INVESTIMENTO_CDI_PARAM_KEYS.diasUteisModo, encodeDiasUteisModo(inputs.diasUteisModo));
  params.set(INVESTIMENTO_CDI_PARAM_KEYS.percentualCdi, inputs.percentualCdi.toString());
  params.set(INVESTIMENTO_CDI_PARAM_KEYS.cdiModo, encodeCdiModo(inputs.cdiModo));

  if (inputs.cdiModo === "manual") {
    params.set(INVESTIMENTO_CDI_PARAM_KEYS.cdiAnualManual, inputs.cdiAnualManual.toString());
  }

  return params;
}

export function decodeInvestimentoCdiState(params: URLSearchParams): InvestimentoCdiUrlState | null {
  if (!params.toString()) return null;

  if (params.get(INVESTIMENTO_CDI_PARAM_KEYS.sourceVersion) !== INVESTIMENTO_CDI_SOURCE_VERSION) {
    return {
      inputs: getDefaultInvestimentoCdiInputs(),
      warnings: ["staleSourceVersion"],
    };
  }

  const defaults = getDefaultInvestimentoCdiInputs();
  const valorInicial = parseRequiredNumber(params, INVESTIMENTO_CDI_PARAM_KEYS.valorInicial);
  const prazoDiasCorridos = parseRequiredInteger(params, INVESTIMENTO_CDI_PARAM_KEYS.prazoDiasCorridos);
  const diasUteis = parseRequiredInteger(params, INVESTIMENTO_CDI_PARAM_KEYS.diasUteis);
  const diasUteisModo = parseDiasUteisModo(params);
  const percentualCdi = parseRequiredNumber(params, INVESTIMENTO_CDI_PARAM_KEYS.percentualCdi);
  const cdiModo = parseCdiModo(params);

  if (
    valorInicial === null ||
    prazoDiasCorridos === null ||
    diasUteis === null ||
    diasUteisModo === null ||
    percentualCdi === null ||
    cdiModo === null
  ) {
    return null;
  }

  const cdiAnualManual =
    cdiModo === "manual"
      ? parseRequiredNumber(params, INVESTIMENTO_CDI_PARAM_KEYS.cdiAnualManual)
      : defaults.cdiAnualManual;

  if (cdiAnualManual === null) return null;

  const inputs: InvestimentoCdiInputs = {
    valorInicial,
    prazoDiasCorridos,
    diasUteis,
    diasUteisModo,
    percentualCdi,
    cdiModo,
    cdiAnualManual,
    sourceVersion: INVESTIMENTO_CDI_SOURCE_VERSION,
  };

  return validateInvestimentoCdiInputs(inputs).length === 0 ? { inputs, warnings: [] } : null;
}

export function generateInvestimentoCdiShareUrl(
  baseUrl: string,
  state: InvestimentoCdiUrlState | { inputs: InvestimentoCdiInputs }
): string {
  const params = encodeInvestimentoCdiState(state);
  const url = new URL(baseUrl);
  url.search = params.toString();
  return url.toString();
}

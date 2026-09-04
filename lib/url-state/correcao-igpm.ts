import {
  CORRECAO_IGPM_FORMULA_VERSION,
  CORRECAO_IGPM_LATEST_MONTH,
  getDefaultCorrecaoIgpmInputs,
  validateCorrecaoIgpmInputs,
  type CorrecaoIgpmInputs,
} from "../calculators/correcao-igpm";

export const CORRECAO_IGPM_PARAM_KEYS = {
  formulaVersion: "sv",
  valorOriginal: "v",
  mesInicial: "i",
  mesFinal: "f",
} as const;

export type CorrecaoIgpmUrlWarningCode = "invalidLink" | "formulaVersion" | "newerDataAvailable";

export interface CorrecaoIgpmUrlState {
  inputs: CorrecaoIgpmInputs;
  warnings: CorrecaoIgpmUrlWarningCode[];
}

function defaultsWith(warning: CorrecaoIgpmUrlWarningCode): CorrecaoIgpmUrlState {
  return { inputs: getDefaultCorrecaoIgpmInputs(), warnings: [warning] };
}

export function encodeCorrecaoIgpmState(
  state: CorrecaoIgpmUrlState | { inputs: CorrecaoIgpmInputs }
): URLSearchParams {
  const params = new URLSearchParams();
  params.set(CORRECAO_IGPM_PARAM_KEYS.formulaVersion, String(CORRECAO_IGPM_FORMULA_VERSION));
  params.set(CORRECAO_IGPM_PARAM_KEYS.valorOriginal, state.inputs.valorOriginal.toString());
  params.set(CORRECAO_IGPM_PARAM_KEYS.mesInicial, state.inputs.mesInicial);
  params.set(CORRECAO_IGPM_PARAM_KEYS.mesFinal, state.inputs.mesFinal);
  return params;
}

export function decodeCorrecaoIgpmState(params: URLSearchParams): CorrecaoIgpmUrlState | null {
  const ownedKeys = Object.values(CORRECAO_IGPM_PARAM_KEYS);
  const hasOwnedParams = ownedKeys.some((key) => params.has(key));
  if (!hasOwnedParams) return null;

  const formulaVersion = params.get(CORRECAO_IGPM_PARAM_KEYS.formulaVersion);
  if (formulaVersion === null) return defaultsWith("invalidLink");
  if (formulaVersion !== String(CORRECAO_IGPM_FORMULA_VERSION)) {
    return defaultsWith("formulaVersion");
  }

  const rawValue = params.get(CORRECAO_IGPM_PARAM_KEYS.valorOriginal);
  const mesInicial = params.get(CORRECAO_IGPM_PARAM_KEYS.mesInicial);
  const mesFinal = params.get(CORRECAO_IGPM_PARAM_KEYS.mesFinal);
  if (rawValue === null || rawValue.trim() === "" || mesInicial === null || mesFinal === null) {
    return defaultsWith("invalidLink");
  }
  if (!/^(?:\d+\.?\d*|\.\d+)$/.test(rawValue)) return defaultsWith("invalidLink");

  const inputs: CorrecaoIgpmInputs = {
    valorOriginal: Number(rawValue),
    mesInicial,
    mesFinal,
    formulaVersion: CORRECAO_IGPM_FORMULA_VERSION,
  };
  if (validateCorrecaoIgpmInputs(inputs).length > 0) return defaultsWith("invalidLink");

  return {
    inputs,
    warnings: mesFinal < CORRECAO_IGPM_LATEST_MONTH ? ["newerDataAvailable"] : [],
  };
}

export function generateCorrecaoIgpmShareUrl(
  baseUrl: string,
  state: CorrecaoIgpmUrlState | { inputs: CorrecaoIgpmInputs }
): string {
  const url = new URL(baseUrl);
  url.search = encodeCorrecaoIgpmState(state).toString();
  return url.toString();
}

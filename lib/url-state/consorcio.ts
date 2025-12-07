import type {
  InputsConsorcio,
  AmortizacaoAdicionalConsorcio,
  TipoAmortizacaoAdicional,
} from "../calculators/consorcio";

// URL Parameter keys for consorcio calculator
export const CONSORCIO_PARAM_KEYS = {
  valorBem: "vb",
  meses: "m",
  taxaAdministracaoTotal: "ta",
  correcaoAnual: "ca",
  amortizacoesAdicionais: "aa",
} as const;

// Compact type codes for consorcio amortization types
const TIPO_CODES: Record<TipoAmortizacaoAdicional, string> = {
  prazo: "p",
  parcela: "z",
};

const TIPO_DECODE: Record<string, TipoAmortizacaoAdicional> = {
  p: "prazo",
  z: "parcela",
};

export interface ConsorcioUrlState {
  inputs: InputsConsorcio;
  amortizacoesAdicionais: AmortizacaoAdicionalConsorcio[];
}

/**
 * Encodes consorcio calculator state into URL search params
 */
export function encodeConsorcioState(state: ConsorcioUrlState): URLSearchParams {
  const params = new URLSearchParams();

  // Encode form inputs
  params.set(CONSORCIO_PARAM_KEYS.valorBem, state.inputs.valorBem.toString());
  params.set(CONSORCIO_PARAM_KEYS.meses, state.inputs.meses.toString());
  params.set(CONSORCIO_PARAM_KEYS.taxaAdministracaoTotal, state.inputs.taxaAdministracaoTotal.toString());
  params.set(CONSORCIO_PARAM_KEYS.correcaoAnual, state.inputs.correcaoAnual.toString());

  // Encode additional amortizations in compact format: mes:valor:tipo,mes:valor:tipo
  if (state.amortizacoesAdicionais.length > 0) {
    const encoded = state.amortizacoesAdicionais
      .filter((a) => a.valor > 0)
      .map((a) => `${a.mes}:${a.valor}:${TIPO_CODES[a.tipo]}`)
      .join(",");
    if (encoded) {
      params.set(CONSORCIO_PARAM_KEYS.amortizacoesAdicionais, encoded);
    }
  }

  return params;
}

/**
 * Decodes URL search params back to consorcio calculator state
 * Returns null if required params are missing or invalid
 */
export function decodeConsorcioState(params: URLSearchParams): ConsorcioUrlState | null {
  // Parse required form inputs
  const valorBem = parseFloat(params.get(CONSORCIO_PARAM_KEYS.valorBem) ?? "");
  const meses = parseInt(params.get(CONSORCIO_PARAM_KEYS.meses) ?? "", 10);
  const taxaAdministracaoTotal = parseFloat(params.get(CONSORCIO_PARAM_KEYS.taxaAdministracaoTotal) ?? "");
  const correcaoAnual = parseFloat(params.get(CONSORCIO_PARAM_KEYS.correcaoAnual) ?? "") || 6; // Default to 6%

  // Validate required fields
  if (!Number.isFinite(valorBem) || valorBem <= 0) return null;
  if (!Number.isFinite(meses) || meses <= 0) return null;
  if (!Number.isFinite(taxaAdministracaoTotal) || taxaAdministracaoTotal <= 0) return null;

  // Parse additional amortizations
  const amortizacoesAdicionais: AmortizacaoAdicionalConsorcio[] = [];
  const aaParam = params.get(CONSORCIO_PARAM_KEYS.amortizacoesAdicionais);

  if (aaParam) {
    const entries = aaParam.split(",");
    for (const entry of entries) {
      const [mesStr, valorStr, tipoCode] = entry.split(":");
      const mes = parseInt(mesStr, 10);
      const valor = parseFloat(valorStr);
      const tipo = TIPO_DECODE[tipoCode];

      if (Number.isFinite(mes) && mes > 0 && Number.isFinite(valor) && valor > 0 && tipo) {
        amortizacoesAdicionais.push({ mes, valor, tipo });
      }
    }
  }

  return {
    inputs: {
      valorBem,
      meses,
      taxaAdministracaoTotal,
      correcaoAnual,
    },
    amortizacoesAdicionais,
  };
}

/**
 * Generates a full shareable URL for consorcio calculator
 */
export function generateConsorcioShareUrl(baseUrl: string, state: ConsorcioUrlState): string {
  const params = encodeConsorcioState(state);
  const url = new URL(baseUrl);
  url.search = params.toString();
  return url.toString();
}


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
  agio: "ag",
  lanceMes: "lm",
  lanceValor: "lv",
  amortizacoesAdicionais: "aa",
  mesContemplacao: "ct",
  aluguelMensal: "am",
  correcaoAnualAluguel: "ig",
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

  // Encode ágio if present
  if (state.inputs.agio && state.inputs.agio > 0) {
    params.set(CONSORCIO_PARAM_KEYS.agio, state.inputs.agio.toString());
  }

  // Encode lance if present
  if (state.inputs.lance && state.inputs.lance.valor > 0) {
    params.set(CONSORCIO_PARAM_KEYS.lanceMes, state.inputs.lance.mes.toString());
    params.set(CONSORCIO_PARAM_KEYS.lanceValor, state.inputs.lance.valor.toString());
  }

  // Encode mesContemplacao if not default (and different from lance.mes)
  const mesContemplacao = state.inputs.mesContemplacao ?? state.inputs.lance?.mes ?? 1;
  if (mesContemplacao > 1 && (!state.inputs.lance || state.inputs.lance.mes !== mesContemplacao)) {
    params.set(CONSORCIO_PARAM_KEYS.mesContemplacao, mesContemplacao.toString());
  }

  // Encode aluguel if configured
  if (state.inputs.aluguelMensal && state.inputs.aluguelMensal > 0) {
    params.set(CONSORCIO_PARAM_KEYS.aluguelMensal, state.inputs.aluguelMensal.toString());
  }
  if (state.inputs.correcaoAnualAluguel && state.inputs.correcaoAnualAluguel > 0 && state.inputs.aluguelMensal && state.inputs.aluguelMensal > 0) {
    params.set(CONSORCIO_PARAM_KEYS.correcaoAnualAluguel, state.inputs.correcaoAnualAluguel.toString());
  }

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
  const agio = parseFloat(params.get(CONSORCIO_PARAM_KEYS.agio) ?? "") || 0;
  const lanceMes = parseInt(params.get(CONSORCIO_PARAM_KEYS.lanceMes) ?? "", 10) || 0;
  const lanceValor = parseFloat(params.get(CONSORCIO_PARAM_KEYS.lanceValor) ?? "") || 0;
  const mesContemplacaoParam = parseInt(params.get(CONSORCIO_PARAM_KEYS.mesContemplacao) ?? "", 10) || 0;
  const aluguelMensal = parseFloat(params.get(CONSORCIO_PARAM_KEYS.aluguelMensal) ?? "") || 0;
  const correcaoAnualAluguel = parseFloat(params.get(CONSORCIO_PARAM_KEYS.correcaoAnualAluguel) ?? "") || 6;

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

  // Determine mesContemplacao: explicit param > lanceMes > default 1
  const mesContemplacao = mesContemplacaoParam > 0 ? mesContemplacaoParam : lanceMes > 0 ? lanceMes : 1;

  return {
    inputs: {
      valorBem,
      meses,
      taxaAdministracaoTotal,
      correcaoAnual,
      agio,
      lance: lanceValor > 0 ? { mes: lanceMes || 1, valor: lanceValor } : undefined,
      mesContemplacao,
      aluguelMensal,
      correcaoAnualAluguel,
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

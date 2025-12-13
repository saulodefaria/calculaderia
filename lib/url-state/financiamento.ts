import type {
  InputsFinanciamento,
  MetodoAmortizacao,
  AmortizacaoAdicional,
  TipoAmortizacaoAdicional,
} from "../calculators/financiamento";

// URL Parameter keys for financiamento calculator
export const FINANCIAMENTO_PARAM_KEYS = {
  valorEmprestimo: "ve",
  valorEntrada: "vn",
  taxaJurosAnual: "tj",
  meses: "m",
  correcaoAnualImovel: "ci",
  metodo: "mt",
  amortizacoesAdicionais: "aa",
  aluguelMensal: "am",
  correcaoAnualAluguel: "caa",
} as const;

// Compact type codes for amortization types
const TIPO_CODES: Record<TipoAmortizacaoAdicional, string> = {
  prazo: "p",
  parcela: "z",
};

const TIPO_DECODE: Record<string, TipoAmortizacaoAdicional> = {
  p: "prazo",
  z: "parcela",
};

export interface FinanciamentoUrlState {
  inputs: InputsFinanciamento;
  metodo: MetodoAmortizacao;
  amortizacoesAdicionais: AmortizacaoAdicional[];
}

/**
 * Encodes financiamento calculator state into URL search params
 */
export function encodeFinanciamentoState(state: FinanciamentoUrlState): URLSearchParams {
  const params = new URLSearchParams();

  // Encode form inputs
  params.set(FINANCIAMENTO_PARAM_KEYS.valorEmprestimo, state.inputs.valorEmprestimo.toString());
  params.set(FINANCIAMENTO_PARAM_KEYS.valorEntrada, state.inputs.valorEntrada.toString());
  params.set(FINANCIAMENTO_PARAM_KEYS.taxaJurosAnual, state.inputs.taxaJurosAnual.toString());
  params.set(FINANCIAMENTO_PARAM_KEYS.meses, state.inputs.meses.toString());
  params.set(FINANCIAMENTO_PARAM_KEYS.correcaoAnualImovel, state.inputs.correcaoAnualImovel.toString());

  // Encode rent fields (optional)
  if (state.inputs.aluguelMensal && state.inputs.aluguelMensal > 0) {
    params.set(FINANCIAMENTO_PARAM_KEYS.aluguelMensal, state.inputs.aluguelMensal.toString());
  }
  if (state.inputs.correcaoAnualAluguel && state.inputs.correcaoAnualAluguel > 0) {
    params.set(FINANCIAMENTO_PARAM_KEYS.correcaoAnualAluguel, state.inputs.correcaoAnualAluguel.toString());
  }

  // Encode method
  params.set(FINANCIAMENTO_PARAM_KEYS.metodo, state.metodo);

  // Encode additional amortizations in compact format: mes:valor:tipo,mes:valor:tipo
  if (state.amortizacoesAdicionais.length > 0) {
    const encoded = state.amortizacoesAdicionais
      .filter((a) => a.valor > 0)
      .map((a) => `${a.mes}:${a.valor}:${TIPO_CODES[a.tipo]}`)
      .join(",");
    if (encoded) {
      params.set(FINANCIAMENTO_PARAM_KEYS.amortizacoesAdicionais, encoded);
    }
  }

  return params;
}

/**
 * Decodes URL search params back to financiamento calculator state
 * Returns null if required params are missing or invalid
 */
export function decodeFinanciamentoState(params: URLSearchParams): FinanciamentoUrlState | null {
  // Parse required form inputs
  const valorEmprestimo = parseFloat(params.get(FINANCIAMENTO_PARAM_KEYS.valorEmprestimo) ?? "");
  const valorEntrada = parseFloat(params.get(FINANCIAMENTO_PARAM_KEYS.valorEntrada) ?? "") || 0;
  const taxaJurosAnual = parseFloat(params.get(FINANCIAMENTO_PARAM_KEYS.taxaJurosAnual) ?? "");
  const meses = parseInt(params.get(FINANCIAMENTO_PARAM_KEYS.meses) ?? "", 10);
  const correcaoParam = params.get(FINANCIAMENTO_PARAM_KEYS.correcaoAnualImovel);
  let correcaoAnualImovel = 6;
  if (correcaoParam !== null && correcaoParam !== "") {
    const parsed = parseFloat(correcaoParam);
    if (Number.isFinite(parsed)) {
      correcaoAnualImovel = parsed;
    }
  }

  // Parse rent fields (optional)
  const aluguelMensal = parseFloat(params.get(FINANCIAMENTO_PARAM_KEYS.aluguelMensal) ?? "") || 0;
  const correcaoAnualAluguel = parseFloat(params.get(FINANCIAMENTO_PARAM_KEYS.correcaoAnualAluguel) ?? "") || 0;

  // Validate required fields
  if (!Number.isFinite(valorEmprestimo) || valorEmprestimo <= 0) return null;
  if (!Number.isFinite(taxaJurosAnual) || taxaJurosAnual <= 0) return null;
  if (!Number.isFinite(meses) || meses <= 0) return null;

  // Parse method (default to "sac" if invalid)
  const metodoParam = params.get(FINANCIAMENTO_PARAM_KEYS.metodo);
  const metodo: MetodoAmortizacao = metodoParam === "price" ? "price" : "sac";

  // Parse additional amortizations
  const amortizacoesAdicionais: AmortizacaoAdicional[] = [];
  const aaParam = params.get(FINANCIAMENTO_PARAM_KEYS.amortizacoesAdicionais);

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
      valorEmprestimo,
      valorEntrada,
      taxaJurosAnual,
      meses,
      correcaoAnualImovel,
      aluguelMensal,
      correcaoAnualAluguel,
    },
    metodo,
    amortizacoesAdicionais,
  };
}

/**
 * Generates a full shareable URL for financiamento calculator
 */
export function generateFinanciamentoShareUrl(baseUrl: string, state: FinanciamentoUrlState): string {
  const params = encodeFinanciamentoState(state);
  const url = new URL(baseUrl);
  url.search = params.toString();
  return url.toString();
}


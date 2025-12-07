import type {
  InputsFinanciamento,
  MetodoAmortizacao,
  AmortizacaoAdicional,
  TipoAmortizacaoAdicional,
} from "./calculators/financiamento";
import type {
  InputsConsorcio,
  AmortizacaoAdicionalConsorcio,
  TipoAmortizacaoAdicional as TipoConsorcio,
} from "./calculators/consorcio";
import type { InputsComparativo } from "./calculators/comparativo";

// URL Parameter keys for financiamento calculator
const PARAM_KEYS = {
  valorEmprestimo: "ve",
  valorEntrada: "vn",
  taxaJurosAnual: "tj",
  meses: "m",
  correcaoAnualImovel: "ci",
  metodo: "mt",
  amortizacoesAdicionais: "aa",
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
  params.set(PARAM_KEYS.valorEmprestimo, state.inputs.valorEmprestimo.toString());
  params.set(PARAM_KEYS.valorEntrada, state.inputs.valorEntrada.toString());
  params.set(PARAM_KEYS.taxaJurosAnual, state.inputs.taxaJurosAnual.toString());
  params.set(PARAM_KEYS.meses, state.inputs.meses.toString());
  params.set(PARAM_KEYS.correcaoAnualImovel, state.inputs.correcaoAnualImovel.toString());

  // Encode method
  params.set(PARAM_KEYS.metodo, state.metodo);

  // Encode additional amortizations in compact format: mes:valor:tipo,mes:valor:tipo
  if (state.amortizacoesAdicionais.length > 0) {
    const encoded = state.amortizacoesAdicionais
      .filter((a) => a.valor > 0)
      .map((a) => `${a.mes}:${a.valor}:${TIPO_CODES[a.tipo]}`)
      .join(",");
    if (encoded) {
      params.set(PARAM_KEYS.amortizacoesAdicionais, encoded);
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
  const valorEmprestimo = parseFloat(params.get(PARAM_KEYS.valorEmprestimo) ?? "");
  const valorEntrada = parseFloat(params.get(PARAM_KEYS.valorEntrada) ?? "") || 0;
  const taxaJurosAnual = parseFloat(params.get(PARAM_KEYS.taxaJurosAnual) ?? "");
  const meses = parseInt(params.get(PARAM_KEYS.meses) ?? "", 10);
  const correcaoParam = params.get(PARAM_KEYS.correcaoAnualImovel);
  let correcaoAnualImovel = 6;
  if (correcaoParam !== null && correcaoParam !== "") {
    const parsed = parseFloat(correcaoParam);
    if (Number.isFinite(parsed)) {
      correcaoAnualImovel = parsed;
    }
  }

  // Validate required fields
  if (!Number.isFinite(valorEmprestimo) || valorEmprestimo <= 0) return null;
  if (!Number.isFinite(taxaJurosAnual) || taxaJurosAnual <= 0) return null;
  if (!Number.isFinite(meses) || meses <= 0) return null;

  // Parse method (default to "sac" if invalid)
  const metodoParam = params.get(PARAM_KEYS.metodo);
  const metodo: MetodoAmortizacao = metodoParam === "price" ? "price" : "sac";

  // Parse additional amortizations
  const amortizacoesAdicionais: AmortizacaoAdicional[] = [];
  const aaParam = params.get(PARAM_KEYS.amortizacoesAdicionais);

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

// ============================================================
// CONSÓRCIO CALCULATOR URL STATE
// ============================================================

// URL Parameter keys for consorcio calculator
const CONSORCIO_PARAM_KEYS = {
  valorBem: "vb",
  meses: "m",
  taxaAdministracaoTotal: "ta",
  correcaoAnual: "ca",
  amortizacoesAdicionais: "aa",
} as const;

// Reuse the same type codes for consorcio amortizations
const CONSORCIO_TIPO_CODES: Record<TipoConsorcio, string> = {
  prazo: "p",
  parcela: "z",
};

const CONSORCIO_TIPO_DECODE: Record<string, TipoConsorcio> = {
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
      .map((a) => `${a.mes}:${a.valor}:${CONSORCIO_TIPO_CODES[a.tipo]}`)
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
      const tipo = CONSORCIO_TIPO_DECODE[tipoCode];

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

// ============================================================
// COMPARATIVO CALCULATOR URL STATE
// ============================================================

// URL Parameter keys for comparativo calculator
const COMPARATIVO_PARAM_KEYS = {
  // Shared
  valorImovel: "vi",
  // Financiamento
  valorEntrada: "ve",
  taxaJurosAnual: "tj",
  mesesFinanciamento: "mf",
  metodo: "mt",
  correcaoAnualImovel: "ci",
  // Consórcio
  mesesConsorcio: "mc",
  taxaAdministracaoTotal: "ta",
  correcaoAnualConsorcio: "cc",
  agioCartaContemplada: "ac",
  // Investimento
  taxaRendimentoAnual: "tr",
} as const;

export interface ComparativoUrlState {
  inputs: InputsComparativo;
}

/**
 * Encodes comparativo calculator state into URL search params
 */
export function encodeComparativoState(state: ComparativoUrlState): URLSearchParams {
  const params = new URLSearchParams();
  const { financiamento, consorcio, taxaRendimentoAnual } = state.inputs;

  // Encode financiamento inputs
  params.set(COMPARATIVO_PARAM_KEYS.valorImovel, financiamento.valorImovel.toString());
  params.set(COMPARATIVO_PARAM_KEYS.valorEntrada, financiamento.valorEntrada.toString());
  params.set(COMPARATIVO_PARAM_KEYS.taxaJurosAnual, financiamento.taxaJurosAnual.toString());
  params.set(COMPARATIVO_PARAM_KEYS.mesesFinanciamento, financiamento.meses.toString());
  params.set(COMPARATIVO_PARAM_KEYS.metodo, financiamento.metodo);
  params.set(COMPARATIVO_PARAM_KEYS.correcaoAnualImovel, financiamento.correcaoAnualImovel.toString());

  // Encode consorcio inputs
  params.set(COMPARATIVO_PARAM_KEYS.mesesConsorcio, consorcio.meses.toString());
  params.set(COMPARATIVO_PARAM_KEYS.taxaAdministracaoTotal, consorcio.taxaAdministracaoTotal.toString());
  params.set(COMPARATIVO_PARAM_KEYS.correcaoAnualConsorcio, consorcio.correcaoAnual.toString());
  if (consorcio.agioCartaContemplada > 0) {
    params.set(COMPARATIVO_PARAM_KEYS.agioCartaContemplada, consorcio.agioCartaContemplada.toString());
  }

  // Encode investment rate
  params.set(COMPARATIVO_PARAM_KEYS.taxaRendimentoAnual, taxaRendimentoAnual.toString());

  return params;
}

/**
 * Decodes URL search params back to comparativo calculator state
 * Returns null if required params are missing or invalid
 */
export function decodeComparativoState(params: URLSearchParams): ComparativoUrlState | null {
  // Parse financiamento inputs
  const valorImovel = parseFloat(params.get(COMPARATIVO_PARAM_KEYS.valorImovel) ?? "");
  const valorEntrada = parseFloat(params.get(COMPARATIVO_PARAM_KEYS.valorEntrada) ?? "") || 0;
  const taxaJurosAnual = parseFloat(params.get(COMPARATIVO_PARAM_KEYS.taxaJurosAnual) ?? "");
  const mesesFinanciamento = parseInt(params.get(COMPARATIVO_PARAM_KEYS.mesesFinanciamento) ?? "", 10);
  const metodoParam = params.get(COMPARATIVO_PARAM_KEYS.metodo);
  const metodo: MetodoAmortizacao = metodoParam === "price" ? "price" : "sac";
  const correcaoAnualImovel = parseFloat(params.get(COMPARATIVO_PARAM_KEYS.correcaoAnualImovel) ?? "") || 6;

  // Parse consorcio inputs
  const mesesConsorcio = parseInt(params.get(COMPARATIVO_PARAM_KEYS.mesesConsorcio) ?? "", 10);
  const taxaAdministracaoTotal = parseFloat(params.get(COMPARATIVO_PARAM_KEYS.taxaAdministracaoTotal) ?? "");
  const correcaoAnualConsorcio = parseFloat(params.get(COMPARATIVO_PARAM_KEYS.correcaoAnualConsorcio) ?? "") || 6;
  const agioCartaContemplada = parseFloat(params.get(COMPARATIVO_PARAM_KEYS.agioCartaContemplada) ?? "") || 0;

  // Parse investment rate
  const taxaRendimentoAnual = parseFloat(params.get(COMPARATIVO_PARAM_KEYS.taxaRendimentoAnual) ?? "") || 10;

  // Validate required fields
  if (!Number.isFinite(valorImovel) || valorImovel <= 0) return null;
  if (!Number.isFinite(taxaJurosAnual) || taxaJurosAnual <= 0) return null;
  if (!Number.isFinite(mesesFinanciamento) || mesesFinanciamento <= 0) return null;
  if (!Number.isFinite(mesesConsorcio) || mesesConsorcio <= 0) return null;
  if (!Number.isFinite(taxaAdministracaoTotal) || taxaAdministracaoTotal <= 0) return null;

  return {
    inputs: {
      financiamento: {
        valorImovel,
        valorEntrada,
        taxaJurosAnual,
        meses: mesesFinanciamento,
        metodo,
        correcaoAnualImovel,
      },
      consorcio: {
        meses: mesesConsorcio,
        taxaAdministracaoTotal,
        correcaoAnual: correcaoAnualConsorcio,
        agioCartaContemplada,
      },
      taxaRendimentoAnual,
    },
  };
}

/**
 * Generates a full shareable URL for comparativo calculator
 */
export function generateComparativoShareUrl(baseUrl: string, state: ComparativoUrlState): string {
  const params = encodeComparativoState(state);
  const url = new URL(baseUrl);
  url.search = params.toString();
  return url.toString();
}

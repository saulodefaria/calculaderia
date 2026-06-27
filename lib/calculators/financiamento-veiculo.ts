import { round2 } from "../utils";

export const FINANCIAMENTO_VEICULO_FORMULA_VERSION = "2026-06-25" as const;

export const FINANCIAMENTO_VEICULO_SOURCE_VERSION = {
  formulaVersion: FINANCIAMENTO_VEICULO_FORMULA_VERSION,
  accessedAt: "2026-06-25",
  paymentTiming: "end-of-period monthly payments",
  sources: [
    {
      label: "Microsoft Support PMT function",
      url: "https://support.microsoft.com/en-us/excel/functions/pmt-function",
    },
    {
      label: "Microsoft Support IPMT function",
      url: "https://support.microsoft.com/en-us/excel/functions/ipmt-function",
    },
    {
      label: "Microsoft Support PPMT function",
      url: "https://support.microsoft.com/en-us/excel/functions/ppmt-function",
    },
    {
      label: "Banco Central do Brasil - Calculadora do Cidadao",
      url: "https://www.bcb.gov.br/meubc/calculadoradocidadao",
    },
    {
      label: "Banco Central do Brasil - Taxas de juros",
      url: "https://www.bcb.gov.br/estatisticas/txjuros",
    },
  ],
} as const;

export type FinanciamentoVeiculoMetodo = "price" | "sac";

export type FinanciamentoVeiculoWarningCode =
  | "estimativaEducativa"
  | "custosCetNaoAutomaticos"
  | "custosOpcionaisInformados"
  | "taxaAlta"
  | "prazoLongo"
  | "entradaBaixa"
  | "custosAltos";

export type FinanciamentoVeiculoValidationError =
  | "valorVeiculo"
  | "entrada"
  | "custosFinanciados"
  | "custosAVista"
  | "taxaJurosMensal"
  | "prazoMeses"
  | "valorFinanciado"
  | "metodo";

export interface FinanciamentoVeiculoInputs {
  valorVeiculo: number;
  entrada: number;
  custosFinanciados: number;
  custosAVista: number;
  taxaJurosMensal: number;
  prazoMeses: number;
  metodo: FinanciamentoVeiculoMetodo;
  compararMetodos: boolean;
}

export interface FinanciamentoVeiculoParcela {
  mes: number;
  saldoInicial: number;
  juros: number;
  amortizacao: number;
  parcela: number;
  saldoFinal: number;
}

export interface FinanciamentoVeiculoResumoMetodo {
  metodo: FinanciamentoVeiculoMetodo;
  primeiraParcela: number;
  ultimaParcela: number;
  totalJuros: number;
  totalParcelas: number;
  totalGeral: number;
}

export interface FinanciamentoVeiculoComparacao {
  price: FinanciamentoVeiculoResumoMetodo;
  sac: FinanciamentoVeiculoResumoMetodo;
  diferencaJuros: number;
  diferencaTotalParcelas: number;
}

export interface ResultadoFinanciamentoVeiculo extends FinanciamentoVeiculoResumoMetodo {
  inputs: FinanciamentoVeiculoInputs;
  valorFinanciado: number;
  totalEntradaECustosAVista: number;
  taxaMensalDecimal: number;
  taxaEfetivaAnual: number;
  parcelas: FinanciamentoVeiculoParcela[];
  comparacao: FinanciamentoVeiculoComparacao | null;
  warnings: FinanciamentoVeiculoWarningCode[];
  sourceVersion: typeof FINANCIAMENTO_VEICULO_SOURCE_VERSION;
}

const MONEY_MAX = 100_000_000;
const HIGH_MONTHLY_RATE = 10;
const MAX_MONTHLY_RATE = 20;
const LONG_TERM_MONTHS = 84;
const MAX_TERM_MONTHS = 120;

export function getDefaultFinanciamentoVeiculoInputs(): FinanciamentoVeiculoInputs {
  return {
    valorVeiculo: 80000,
    entrada: 20000,
    custosFinanciados: 0,
    custosAVista: 0,
    taxaJurosMensal: 1.49,
    prazoMeses: 48,
    metodo: "price",
    compararMetodos: true,
  };
}

export function isFinanciamentoVeiculoMetodo(value: string): value is FinanciamentoVeiculoMetodo {
  return value === "price" || value === "sac";
}

function isMoney(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= MONEY_MAX;
}

function isIntegerInRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

export function validateFinanciamentoVeiculoInputs(
  inputs: FinanciamentoVeiculoInputs
): FinanciamentoVeiculoValidationError[] {
  const errors: FinanciamentoVeiculoValidationError[] = [];

  if (!isMoney(inputs.valorVeiculo) || inputs.valorVeiculo <= 0) errors.push("valorVeiculo");
  if (!isMoney(inputs.entrada)) errors.push("entrada");
  if (!isMoney(inputs.custosFinanciados)) errors.push("custosFinanciados");
  if (!isMoney(inputs.custosAVista)) errors.push("custosAVista");
  if (!Number.isFinite(inputs.taxaJurosMensal) || inputs.taxaJurosMensal < 0 || inputs.taxaJurosMensal > MAX_MONTHLY_RATE) {
    errors.push("taxaJurosMensal");
  }
  if (!isIntegerInRange(inputs.prazoMeses, 1, MAX_TERM_MONTHS)) errors.push("prazoMeses");
  if (!isFinanciamentoVeiculoMetodo(inputs.metodo)) errors.push("metodo");

  const baseFinanciavel = inputs.valorVeiculo + inputs.custosFinanciados;
  if (Number.isFinite(baseFinanciavel) && inputs.entrada >= baseFinanciavel) {
    errors.push("valorFinanciado");
  }

  return errors;
}

function normalizarInputs(inputs: FinanciamentoVeiculoInputs): FinanciamentoVeiculoInputs {
  return {
    valorVeiculo: round2(inputs.valorVeiculo),
    entrada: round2(inputs.entrada),
    custosFinanciados: round2(inputs.custosFinanciados),
    custosAVista: round2(inputs.custosAVista),
    taxaJurosMensal: inputs.taxaJurosMensal,
    prazoMeses: inputs.prazoMeses,
    metodo: inputs.metodo,
    compararMetodos: inputs.compararMetodos,
  };
}

function calcularParcelaPrice(valorFinanciado: number, taxaMensalDecimal: number, prazoMeses: number): number {
  if (taxaMensalDecimal === 0) {
    return valorFinanciado / prazoMeses;
  }

  return valorFinanciado * (taxaMensalDecimal / (1 - Math.pow(1 + taxaMensalDecimal, -prazoMeses)));
}

function buildSchedule(params: {
  valorFinanciado: number;
  taxaMensalDecimal: number;
  prazoMeses: number;
  metodo: FinanciamentoVeiculoMetodo;
}): {
  parcelas: FinanciamentoVeiculoParcela[];
  resumo: Omit<FinanciamentoVeiculoResumoMetodo, "totalGeral">;
} {
  const { valorFinanciado, taxaMensalDecimal, prazoMeses, metodo } = params;
  const parcelas: FinanciamentoVeiculoParcela[] = [];
  const parcelaPrice = metodo === "price" ? round2(calcularParcelaPrice(valorFinanciado, taxaMensalDecimal, prazoMeses)) : 0;
  const amortizacaoSac = metodo === "sac" ? round2(valorFinanciado / prazoMeses) : 0;
  let saldo = round2(valorFinanciado);
  let totalJuros = 0;
  let totalParcelas = 0;

  for (let mes = 1; mes <= prazoMeses; mes++) {
    const saldoInicial = saldo;
    const juros = round2(saldoInicial * taxaMensalDecimal);
    const ultimaParcela = mes === prazoMeses;
    const amortizacao =
      ultimaParcela || saldoInicial <= 0
        ? round2(saldoInicial)
        : metodo === "sac"
          ? round2(Math.min(amortizacaoSac, saldoInicial))
          : round2(Math.min(parcelaPrice - juros, saldoInicial));
    const parcela = round2(amortizacao + juros);
    const saldoFinal = ultimaParcela ? 0 : round2(Math.max(0, saldoInicial - amortizacao));

    parcelas.push({
      mes,
      saldoInicial,
      juros,
      amortizacao,
      parcela,
      saldoFinal,
    });

    saldo = saldoFinal;
    totalJuros = round2(totalJuros + juros);
    totalParcelas = round2(totalParcelas + parcela);
  }

  return {
    parcelas,
    resumo: {
      metodo,
      primeiraParcela: parcelas[0]?.parcela ?? 0,
      ultimaParcela: parcelas[parcelas.length - 1]?.parcela ?? 0,
      totalJuros,
      totalParcelas,
    },
  };
}

function buildWarnings(inputs: FinanciamentoVeiculoInputs): FinanciamentoVeiculoWarningCode[] {
  const warnings: FinanciamentoVeiculoWarningCode[] = ["estimativaEducativa", "custosCetNaoAutomaticos"];
  const custosTotais = round2(inputs.custosFinanciados + inputs.custosAVista);

  if (custosTotais > 0) warnings.push("custosOpcionaisInformados");
  if (inputs.taxaJurosMensal > HIGH_MONTHLY_RATE) warnings.push("taxaAlta");
  if (inputs.prazoMeses > LONG_TERM_MONTHS) warnings.push("prazoLongo");
  if (inputs.entrada === 0 || inputs.entrada / inputs.valorVeiculo < 0.1) warnings.push("entradaBaixa");
  if (custosTotais > inputs.valorVeiculo * 0.5) warnings.push("custosAltos");

  return warnings;
}

function toResumoMetodo(
  resumo: Omit<FinanciamentoVeiculoResumoMetodo, "totalGeral">,
  totalEntradaECustosAVista: number
): FinanciamentoVeiculoResumoMetodo {
  return {
    ...resumo,
    totalGeral: round2(totalEntradaECustosAVista + resumo.totalParcelas),
  };
}

export function calcularFinanciamentoVeiculo(inputs: FinanciamentoVeiculoInputs): ResultadoFinanciamentoVeiculo {
  const validationErrors = validateFinanciamentoVeiculoInputs(inputs);
  if (validationErrors.length > 0) {
    throw new RangeError(`Invalid vehicle financing inputs: ${validationErrors.join(", ")}`);
  }

  const normalized = normalizarInputs(inputs);
  const valorFinanciado = round2(normalized.valorVeiculo + normalized.custosFinanciados - normalized.entrada);
  const totalEntradaECustosAVista = round2(normalized.entrada + normalized.custosAVista);
  const taxaMensalDecimal = normalized.taxaJurosMensal / 100;
  const taxaEfetivaAnual = Math.pow(1 + taxaMensalDecimal, 12) - 1;
  const mainSchedule = buildSchedule({
    valorFinanciado,
    taxaMensalDecimal,
    prazoMeses: normalized.prazoMeses,
    metodo: normalized.metodo,
  });
  const mainResumo = toResumoMetodo(mainSchedule.resumo, totalEntradaECustosAVista);

  let comparacao: FinanciamentoVeiculoComparacao | null = null;
  if (normalized.compararMetodos) {
    const price = toResumoMetodo(
      buildSchedule({
        valorFinanciado,
        taxaMensalDecimal,
        prazoMeses: normalized.prazoMeses,
        metodo: "price",
      }).resumo,
      totalEntradaECustosAVista
    );
    const sac = toResumoMetodo(
      buildSchedule({
        valorFinanciado,
        taxaMensalDecimal,
        prazoMeses: normalized.prazoMeses,
        metodo: "sac",
      }).resumo,
      totalEntradaECustosAVista
    );

    comparacao = {
      price,
      sac,
      diferencaJuros: round2(price.totalJuros - sac.totalJuros),
      diferencaTotalParcelas: round2(price.totalParcelas - sac.totalParcelas),
    };
  }

  return {
    ...mainResumo,
    inputs: normalized,
    valorFinanciado,
    totalEntradaECustosAVista,
    taxaMensalDecimal,
    taxaEfetivaAnual,
    parcelas: mainSchedule.parcelas,
    comparacao,
    warnings: buildWarnings(normalized),
    sourceVersion: FINANCIAMENTO_VEICULO_SOURCE_VERSION,
  };
}

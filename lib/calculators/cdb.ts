import { round2 } from "../utils";

export const CDB_SOURCE_VERSION = "2026-06-26" as const;
export const CDB_MONEY_MAX = 100_000_000;
export const CDB_PRAZO_DIAS_CORRIDOS_MAX = 3_650;
export const CDB_DIAS_UTEIS_MAX = 2_520;

export const CDB_SOURCE_REFERENCES = {
  accessedAt: CDB_SOURCE_VERSION,
  lei11033: "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l11033.htm",
  decreto6306: "https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2007/decreto/d6306.htm",
  bcbSgs12: "https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/3?formato=json",
  bcbSgs: "https://www.bcb.gov.br/estatisticas/sgs",
  fgcGarantia: "https://www.fgc.org.br/sobre-garantia-fgc",
  fgcFaq: "https://www.fgc.org.br/faq",
} as const;

export type CdbSourceVersion = typeof CDB_SOURCE_VERSION;
export type CdbModo = "pos-cdi" | "pre";
export type CdbDiasUteisOrigem = "estimado" | "informado";

export type CdbValidationErrorCode =
  | "sourceVersion"
  | "modo"
  | "valorInicial"
  | "prazoDiasCorridos"
  | "diasUteis"
  | "diasUteisAcimaPrazo"
  | "percentualCdi"
  | "cdiAnual"
  | "taxaPreAnual"
  | "resultadoNaoFinito";

export type CdbWarningCode =
  | "sourceVersion20260626"
  | "estimativaEducativa"
  | "semCdiAtual"
  | "cdiInformadoUsuario"
  | "taxaPreInformadaUsuario"
  | "diasUteisEstimados"
  | "diasUteisInformados"
  | "iofCurtoPrazo"
  | "rendimentoZero"
  | "fgcLimites";

export type CdbBreakdownCategory = "entrada" | "rendimento" | "impostos" | "liquido" | "premissas";

export type CdbBreakdownId =
  | "valorInicial"
  | "valorFinalBruto"
  | "rendimentoBruto"
  | "iof"
  | "baseIr"
  | "ir"
  | "rendimentoLiquido"
  | "valorFinalLiquido"
  | "modo"
  | "prazoDiasCorridos"
  | "diasUteis"
  | "taxaEfetivaDiaria"
  | "sourceVersion";

export interface CdbInputs {
  modo: CdbModo;
  valorInicial: number;
  prazoDiasCorridos: number;
  diasUteis: number;
  percentualCdi: number;
  cdiAnual: number;
  taxaPreAnual: number;
  sourceVersion: CdbSourceVersion;
}

export interface CdbBreakdownRow {
  id: CdbBreakdownId;
  categoria: CdbBreakdownCategory;
  aplicavel: boolean;
  valor?: number;
  percent?: number;
  texto?: string;
}

export interface CdbResultado {
  inputs: CdbInputs;
  valorFinalBruto: number;
  rendimentoBruto: number;
  iofAliquota: number;
  iofValor: number;
  irAliquota: number;
  baseIr: number;
  irValor: number;
  valorFinalLiquido: number;
  rendimentoLiquido: number;
  rentabilidadeBrutaPercent: number;
  rentabilidadeLiquidaPercent: number;
  taxaEfetivaLiquidaAnualPercent: number;
  taxaEfetivaDiariaPercent: number;
  diasUteisEstimados: number;
  diasUteisUsados: number;
  diasUteisOrigem: CdbDiasUteisOrigem;
  warnings: CdbWarningCode[];
  breakdown: CdbBreakdownRow[];
  sourceVersion: typeof CDB_SOURCE_REFERENCES;
}

export const CDB_IOF_TABLE: Record<number, number> = {
  1: 96,
  2: 93,
  3: 90,
  4: 86,
  5: 83,
  6: 80,
  7: 76,
  8: 73,
  9: 70,
  10: 66,
  11: 63,
  12: 60,
  13: 56,
  14: 53,
  15: 50,
  16: 46,
  17: 43,
  18: 40,
  19: 36,
  20: 33,
  21: 30,
  22: 26,
  23: 23,
  24: 20,
  25: 16,
  26: 13,
  27: 10,
  28: 6,
  29: 3,
  30: 0,
};

function roundRate(value: number): number {
  return Math.round((value + Number.EPSILON) * 10_000) / 10_000;
}

function isIntegerRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

function isPercent(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max;
}

function isMoney(value: number): boolean {
  return Number.isFinite(value) && value >= 0.01 && value <= CDB_MONEY_MAX;
}

export function isCdbModo(value: unknown): value is CdbModo {
  return value === "pos-cdi" || value === "pre";
}

export function calcularDiasUteisEstimados(prazoDiasCorridos: number): number {
  if (!Number.isFinite(prazoDiasCorridos)) return 1;
  return Math.max(1, Math.round(prazoDiasCorridos * 252 / 365));
}

export function getDiasUteisMaximoParaPrazo(prazoDiasCorridos: number): number {
  if (!Number.isFinite(prazoDiasCorridos)) return CDB_DIAS_UTEIS_MAX;
  return Math.min(CDB_DIAS_UTEIS_MAX, Math.ceil(prazoDiasCorridos * 260 / 365) + 5);
}

export function getDefaultCdbInputs(): CdbInputs {
  const prazoDiasCorridos = 365;

  return {
    modo: "pos-cdi",
    valorInicial: 10_000,
    prazoDiasCorridos,
    diasUteis: calcularDiasUteisEstimados(prazoDiasCorridos),
    percentualCdi: 100,
    cdiAnual: 10,
    taxaPreAnual: 12,
    sourceVersion: CDB_SOURCE_VERSION,
  };
}

export function annualToBusinessDayRate(annualPercent: number): number {
  if (annualPercent === 0) return 0;
  return Math.pow(1 + annualPercent / 100, 1 / 252) - 1;
}

export function calcularTaxaEfetivaDiariaCdb(inputs: CdbInputs): number {
  if (inputs.modo === "pos-cdi") {
    const taxaCdiDia = annualToBusinessDayRate(inputs.cdiAnual);
    return taxaCdiDia * (inputs.percentualCdi / 100);
  }

  return annualToBusinessDayRate(inputs.taxaPreAnual);
}

export function getIofAliquotaCdb(prazoDiasCorridos: number): number {
  if (prazoDiasCorridos > 30) return 0;
  return CDB_IOF_TABLE[prazoDiasCorridos] ?? 0;
}

export function getIrAliquotaCdb(prazoDiasCorridos: number): number {
  if (prazoDiasCorridos <= 180) return 22.5;
  if (prazoDiasCorridos <= 360) return 20;
  if (prazoDiasCorridos <= 720) return 17.5;
  return 15;
}

function getValorFinalBrutoRaw(inputs: CdbInputs): number {
  const taxaDia = calcularTaxaEfetivaDiariaCdb(inputs);
  return inputs.valorInicial * Math.pow(1 + taxaDia, inputs.diasUteis);
}

function hasFiniteOutput(inputs: CdbInputs): boolean {
  const taxaDia = calcularTaxaEfetivaDiariaCdb(inputs);
  const valorFinalBruto = getValorFinalBrutoRaw(inputs);

  return (
    Number.isFinite(taxaDia) &&
    Number.isFinite(valorFinalBruto) &&
    Number.isFinite(valorFinalBruto - inputs.valorInicial)
  );
}

export function validateCdbInputs(inputs: CdbInputs): CdbValidationErrorCode[] {
  const errors: CdbValidationErrorCode[] = [];

  if (inputs.sourceVersion !== CDB_SOURCE_VERSION) errors.push("sourceVersion");
  if (!isCdbModo(inputs.modo)) errors.push("modo");
  if (!isMoney(inputs.valorInicial)) errors.push("valorInicial");
  if (!isIntegerRange(inputs.prazoDiasCorridos, 1, CDB_PRAZO_DIAS_CORRIDOS_MAX)) {
    errors.push("prazoDiasCorridos");
  }
  if (!isIntegerRange(inputs.diasUteis, 1, CDB_DIAS_UTEIS_MAX)) errors.push("diasUteis");
  if (
    Number.isFinite(inputs.prazoDiasCorridos) &&
    Number.isFinite(inputs.diasUteis) &&
    inputs.diasUteis > getDiasUteisMaximoParaPrazo(inputs.prazoDiasCorridos)
  ) {
    errors.push("diasUteisAcimaPrazo");
  }
  if (!isPercent(inputs.percentualCdi, 0, 300)) errors.push("percentualCdi");
  if (!isPercent(inputs.cdiAnual, 0, 100)) errors.push("cdiAnual");
  if (!isPercent(inputs.taxaPreAnual, 0, 100)) errors.push("taxaPreAnual");
  if (errors.length === 0 && !hasFiniteOutput(inputs)) errors.push("resultadoNaoFinito");

  return errors;
}

function buildWarnings(inputs: CdbInputs, rendimentoBruto: number, diasUteisOrigem: CdbDiasUteisOrigem): CdbWarningCode[] {
  const warnings: CdbWarningCode[] = ["sourceVersion20260626", "estimativaEducativa", "fgcLimites"];

  if (inputs.modo === "pos-cdi") {
    warnings.push("semCdiAtual", "cdiInformadoUsuario");
  } else {
    warnings.push("taxaPreInformadaUsuario");
  }

  warnings.push(diasUteisOrigem === "estimado" ? "diasUteisEstimados" : "diasUteisInformados");
  if (inputs.prazoDiasCorridos <= 30) warnings.push("iofCurtoPrazo");
  if (rendimentoBruto <= 0) warnings.push("rendimentoZero");

  return warnings;
}

function buildBreakdown(result: Omit<CdbResultado, "breakdown">): CdbBreakdownRow[] {
  return [
    {
      id: "valorInicial",
      categoria: "entrada",
      aplicavel: true,
      valor: result.inputs.valorInicial,
    },
    {
      id: "valorFinalBruto",
      categoria: "rendimento",
      aplicavel: true,
      valor: result.valorFinalBruto,
    },
    {
      id: "rendimentoBruto",
      categoria: "rendimento",
      aplicavel: true,
      valor: result.rendimentoBruto,
    },
    {
      id: "iof",
      categoria: "impostos",
      aplicavel: true,
      valor: result.iofValor,
      percent: result.iofAliquota,
    },
    {
      id: "baseIr",
      categoria: "impostos",
      aplicavel: true,
      valor: result.baseIr,
    },
    {
      id: "ir",
      categoria: "impostos",
      aplicavel: true,
      valor: result.irValor,
      percent: result.irAliquota,
    },
    {
      id: "rendimentoLiquido",
      categoria: "liquido",
      aplicavel: true,
      valor: result.rendimentoLiquido,
    },
    {
      id: "valorFinalLiquido",
      categoria: "liquido",
      aplicavel: true,
      valor: result.valorFinalLiquido,
    },
    {
      id: "modo",
      categoria: "premissas",
      aplicavel: true,
      texto: result.inputs.modo,
    },
    {
      id: "prazoDiasCorridos",
      categoria: "premissas",
      aplicavel: true,
      texto: result.inputs.prazoDiasCorridos.toString(),
    },
    {
      id: "diasUteis",
      categoria: "premissas",
      aplicavel: true,
      texto: result.diasUteisUsados.toString(),
    },
    {
      id: "taxaEfetivaDiaria",
      categoria: "premissas",
      aplicavel: true,
      percent: result.taxaEfetivaDiariaPercent,
    },
    {
      id: "sourceVersion",
      categoria: "premissas",
      aplicavel: true,
      texto: result.inputs.sourceVersion,
    },
  ];
}

export function calcularCdb(inputs: CdbInputs): CdbResultado {
  const validationErrors = validateCdbInputs(inputs);
  if (validationErrors.length > 0) {
    throw new RangeError(`Invalid CDB inputs: ${validationErrors.join(", ")}`);
  }

  const valorFinalBrutoRaw = getValorFinalBrutoRaw(inputs);
  const rendimentoBrutoRaw = Math.max(0, valorFinalBrutoRaw - inputs.valorInicial);
  const iofAliquota = getIofAliquotaCdb(inputs.prazoDiasCorridos);
  const iofValor = rendimentoBrutoRaw > 0 ? round2((rendimentoBrutoRaw * iofAliquota) / 100) : 0;
  const baseIrRaw = Math.max(0, rendimentoBrutoRaw - iofValor);
  const baseIr = round2(baseIrRaw);
  const irAliquota = getIrAliquotaCdb(inputs.prazoDiasCorridos);
  const irValor = baseIrRaw > 0 ? round2((baseIrRaw * irAliquota) / 100) : 0;
  const rendimentoLiquido = round2(rendimentoBrutoRaw - iofValor - irValor);
  const valorFinalLiquido = round2(inputs.valorInicial + rendimentoLiquido);
  const valorFinalBruto = round2(valorFinalBrutoRaw);
  const rendimentoBruto = round2(rendimentoBrutoRaw);
  const diasUteisEstimados = calcularDiasUteisEstimados(inputs.prazoDiasCorridos);
  const diasUteisOrigem: CdbDiasUteisOrigem = inputs.diasUteis === diasUteisEstimados ? "estimado" : "informado";
  const taxaEfetivaDiaria = calcularTaxaEfetivaDiariaCdb(inputs);

  const resultWithoutBreakdown: Omit<CdbResultado, "breakdown"> = {
    inputs,
    valorFinalBruto,
    rendimentoBruto,
    iofAliquota,
    iofValor,
    irAliquota,
    baseIr,
    irValor,
    valorFinalLiquido,
    rendimentoLiquido,
    rentabilidadeBrutaPercent: roundRate((rendimentoBrutoRaw / inputs.valorInicial) * 100),
    rentabilidadeLiquidaPercent: roundRate((rendimentoLiquido / inputs.valorInicial) * 100),
    taxaEfetivaLiquidaAnualPercent: roundRate(
      (Math.pow(valorFinalLiquido / inputs.valorInicial, 365 / inputs.prazoDiasCorridos) - 1) * 100
    ),
    taxaEfetivaDiariaPercent: roundRate(taxaEfetivaDiaria * 100),
    diasUteisEstimados,
    diasUteisUsados: inputs.diasUteis,
    diasUteisOrigem,
    warnings: buildWarnings(inputs, rendimentoBruto, diasUteisOrigem),
    sourceVersion: CDB_SOURCE_REFERENCES,
  };

  return {
    ...resultWithoutBreakdown,
    breakdown: buildBreakdown(resultWithoutBreakdown),
  };
}

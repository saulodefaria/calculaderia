import { round2 } from "../utils";

export const INVESTIMENTO_CDI_SOURCE_VERSION = "2026-07-06" as const;
export const INVESTIMENTO_CDI_OBSERVATION_DATE = "2026-07-02" as const;
export const INVESTIMENTO_CDI_DAILY_RATE_PERCENT = 0.052531;
export const INVESTIMENTO_CDI_ANNUAL_RATE_PERCENT = 14.15;
export const INVESTIMENTO_CDI_SOURCE_STALE_AFTER = "2026-07-31" as const;
export const INVESTIMENTO_CDI_MONEY_MAX = 100_000_000;
export const INVESTIMENTO_CDI_PRAZO_DIAS_CORRIDOS_MAX = 3_650;
export const INVESTIMENTO_CDI_DIAS_UTEIS_MAX = 2_520;

export const INVESTIMENTO_CDI_SOURCE_REFERENCES = {
  sourceVersion: INVESTIMENTO_CDI_SOURCE_VERSION,
  bcbObservationDate: INVESTIMENTO_CDI_OBSERVATION_DATE,
  bcbDailyRatePercent: INVESTIMENTO_CDI_DAILY_RATE_PERCENT,
  bcbAnnualRatePercent: INVESTIMENTO_CDI_ANNUAL_RATE_PERCENT,
  staleAfter: INVESTIMENTO_CDI_SOURCE_STALE_AFTER,
  bcbSgs12: "https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/10?formato=json",
  bcbSgs4389: "https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/5?formato=json",
  bcbSgs: "https://www.bcb.gov.br/estatisticas/sgs",
  lei11033: "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l11033.htm",
  decreto6306: "https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2007/decreto/d6306.htm",
} as const;

export type InvestimentoCdiSourceVersion = typeof INVESTIMENTO_CDI_SOURCE_VERSION;
export type InvestimentoCdiDiasUteisModo = "estimado" | "manual";
export type InvestimentoCdiModo = "snapshot" | "manual";
export type InvestimentoCdiDiasUteisOrigem = "estimado" | "informado";
export type InvestimentoCdiFonteWarningCode = "snapshotDatado" | "cdiManualUsuario";

export type InvestimentoCdiValidationErrorCode =
  | "sourceVersion"
  | "diasUteisModo"
  | "cdiModo"
  | "valorInicial"
  | "prazoDiasCorridos"
  | "diasUteis"
  | "diasUteisAcimaPrazo"
  | "percentualCdi"
  | "cdiAnualManual"
  | "resultadoNaoFinito";

export type InvestimentoCdiWarningCode =
  | "sourceVersion20260706"
  | "estimativaEducativa"
  | "fonteCdiDatada"
  | "cdiManualUsuario"
  | "diasUteisEstimados"
  | "diasUteisInformados"
  | "iofCurtoPrazo"
  | "rendimentoZero"
  | "semGarantiaOuContrato"
  | "semRecomendacao";

export type InvestimentoCdiBreakdownCategory = "entrada" | "rendimento" | "impostos" | "liquido" | "premissas";

export type InvestimentoCdiBreakdownId =
  | "valorInicial"
  | "valorFinalBruto"
  | "rendimentoBruto"
  | "iof"
  | "baseIr"
  | "ir"
  | "rendimentoLiquido"
  | "valorFinalLiquido"
  | "percentualCdi"
  | "prazoDiasCorridos"
  | "diasUteis"
  | "taxaCdiDiaria"
  | "taxaCdiAnual"
  | "sourceVersion";

export interface InvestimentoCdiInputs {
  valorInicial: number;
  prazoDiasCorridos: number;
  diasUteis: number;
  diasUteisModo: InvestimentoCdiDiasUteisModo;
  percentualCdi: number;
  cdiModo: InvestimentoCdiModo;
  cdiAnualManual: number;
  sourceVersion: InvestimentoCdiSourceVersion;
}

export interface InvestimentoCdiFonte {
  modo: InvestimentoCdiModo;
  sourceVersion: InvestimentoCdiSourceVersion;
  observationDate: typeof INVESTIMENTO_CDI_OBSERVATION_DATE;
  dailyRatePercent: number;
  annualRatePercent: number;
  staleAfter: typeof INVESTIMENTO_CDI_SOURCE_STALE_AFTER;
  warningCode: InvestimentoCdiFonteWarningCode;
}

export interface InvestimentoCdiBreakdownRow {
  id: InvestimentoCdiBreakdownId;
  categoria: InvestimentoCdiBreakdownCategory;
  valor?: number;
  percent?: number;
  texto?: string;
}

export interface InvestimentoCdiScenarioRow {
  percentualCdi: number;
  valorFinalBruto: number;
  rendimentoBruto: number;
  valorFinalLiquido: number;
  rendimentoLiquido: number;
  rentabilidadeLiquidaPercent: number;
}

interface InvestimentoCdiCoreResult {
  valorFinalBrutoRaw: number;
  rendimentoBrutoRaw: number;
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
  taxaEfetivaBrutaAnualPercent: number;
  taxaEfetivaLiquidaAnualPercent: number;
}

export interface InvestimentoCdiResultado extends InvestimentoCdiCoreResult {
  inputs: InvestimentoCdiInputs;
  taxaCdiDiariaPercent: number;
  taxaCdiAnualPercent: number;
  taxaInvestimentoDiariaPercent: number;
  diasUteisEstimados: number;
  diasUteisUsados: number;
  diasUteisOrigem: InvestimentoCdiDiasUteisOrigem;
  cdiFonte: InvestimentoCdiFonte;
  warnings: InvestimentoCdiWarningCode[];
  comparisonRows: InvestimentoCdiScenarioRow[];
  breakdown: InvestimentoCdiBreakdownRow[];
  sourceReferences: typeof INVESTIMENTO_CDI_SOURCE_REFERENCES;
}

export const INVESTIMENTO_CDI_IOF_TABLE: Record<number, number> = {
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

function roundSourceRate(value: number): number {
  return Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000;
}

function isIntegerRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

function isPercent(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max;
}

function isMoney(value: number): boolean {
  return Number.isFinite(value) && value >= 0.01 && value <= INVESTIMENTO_CDI_MONEY_MAX;
}

export function isInvestimentoCdiDiasUteisModo(value: unknown): value is InvestimentoCdiDiasUteisModo {
  return value === "estimado" || value === "manual";
}

export function isInvestimentoCdiModo(value: unknown): value is InvestimentoCdiModo {
  return value === "snapshot" || value === "manual";
}

export function calcularDiasUteisEstimadosInvestimentoCdi(prazoDiasCorridos: number): number {
  if (!Number.isFinite(prazoDiasCorridos)) return 1;
  return Math.max(1, Math.round((prazoDiasCorridos * 252) / 365));
}

export function getDiasUteisMaximoParaPrazoInvestimentoCdi(prazoDiasCorridos: number): number {
  if (!Number.isFinite(prazoDiasCorridos)) return INVESTIMENTO_CDI_DIAS_UTEIS_MAX;
  return Math.min(INVESTIMENTO_CDI_DIAS_UTEIS_MAX, Math.ceil((prazoDiasCorridos * 260) / 365) + 5);
}

export function getDefaultInvestimentoCdiInputs(): InvestimentoCdiInputs {
  const prazoDiasCorridos = 365;

  return {
    valorInicial: 10_000,
    prazoDiasCorridos,
    diasUteis: calcularDiasUteisEstimadosInvestimentoCdi(prazoDiasCorridos),
    diasUteisModo: "estimado",
    percentualCdi: 100,
    cdiModo: "snapshot",
    cdiAnualManual: INVESTIMENTO_CDI_ANNUAL_RATE_PERCENT,
    sourceVersion: INVESTIMENTO_CDI_SOURCE_VERSION,
  };
}

export function annualToBusinessDayRateInvestimentoCdi(annualPercent: number): number {
  if (annualPercent === 0) return 0;
  return Math.pow(1 + annualPercent / 100, 1 / 252) - 1;
}

export function getInvestimentoCdiDailyRate(inputs: InvestimentoCdiInputs): number {
  if (inputs.cdiModo === "snapshot") {
    return INVESTIMENTO_CDI_DAILY_RATE_PERCENT / 100;
  }

  return annualToBusinessDayRateInvestimentoCdi(inputs.cdiAnualManual);
}

export function getInvestimentoCdiIofAliquota(prazoDiasCorridos: number): number {
  if (prazoDiasCorridos > 30) return 0;
  return INVESTIMENTO_CDI_IOF_TABLE[prazoDiasCorridos] ?? 0;
}

export function getInvestimentoCdiIrAliquota(prazoDiasCorridos: number): number {
  if (prazoDiasCorridos <= 180) return 22.5;
  if (prazoDiasCorridos <= 360) return 20;
  if (prazoDiasCorridos <= 720) return 17.5;
  return 15;
}

function getDiasUteisUsados(inputs: InvestimentoCdiInputs): number {
  if (inputs.diasUteisModo === "manual") return inputs.diasUteis;
  return calcularDiasUteisEstimadosInvestimentoCdi(inputs.prazoDiasCorridos);
}

function calculateCore(inputs: InvestimentoCdiInputs): InvestimentoCdiCoreResult {
  const diasUteisUsados = getDiasUteisUsados(inputs);
  const taxaCdiDia = getInvestimentoCdiDailyRate(inputs);
  const taxaInvestimentoDia = taxaCdiDia * (inputs.percentualCdi / 100);
  const valorFinalBrutoRaw = inputs.valorInicial * Math.pow(1 + taxaInvestimentoDia, diasUteisUsados);
  const rendimentoBrutoRaw = Math.max(0, valorFinalBrutoRaw - inputs.valorInicial);
  const iofAliquota = getInvestimentoCdiIofAliquota(inputs.prazoDiasCorridos);
  const iofValor = rendimentoBrutoRaw > 0 ? round2((rendimentoBrutoRaw * iofAliquota) / 100) : 0;
  const baseIrRaw = Math.max(0, rendimentoBrutoRaw - iofValor);
  const baseIr = round2(baseIrRaw);
  const irAliquota = getInvestimentoCdiIrAliquota(inputs.prazoDiasCorridos);
  const irValor = baseIrRaw > 0 ? round2((baseIrRaw * irAliquota) / 100) : 0;
  const rendimentoLiquido = round2(rendimentoBrutoRaw - iofValor - irValor);
  const valorFinalLiquido = round2(inputs.valorInicial + rendimentoLiquido);
  const valorFinalBruto = round2(valorFinalBrutoRaw);
  const rendimentoBruto = round2(rendimentoBrutoRaw);

  return {
    valorFinalBrutoRaw,
    rendimentoBrutoRaw,
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
    taxaEfetivaBrutaAnualPercent: roundRate(
      (Math.pow(valorFinalBrutoRaw / inputs.valorInicial, 365 / inputs.prazoDiasCorridos) - 1) * 100
    ),
    taxaEfetivaLiquidaAnualPercent: roundRate(
      (Math.pow(valorFinalLiquido / inputs.valorInicial, 365 / inputs.prazoDiasCorridos) - 1) * 100
    ),
  };
}

function hasFiniteOutput(inputs: InvestimentoCdiInputs): boolean {
  const core = calculateCore(inputs);
  const taxaCdiDia = getInvestimentoCdiDailyRate(inputs);

  return (
    Number.isFinite(taxaCdiDia) &&
    Number.isFinite(core.valorFinalBrutoRaw) &&
    Number.isFinite(core.rendimentoBrutoRaw) &&
    Number.isFinite(core.valorFinalLiquido)
  );
}

export function validateInvestimentoCdiInputs(inputs: InvestimentoCdiInputs): InvestimentoCdiValidationErrorCode[] {
  const errors: InvestimentoCdiValidationErrorCode[] = [];

  if (inputs.sourceVersion !== INVESTIMENTO_CDI_SOURCE_VERSION) errors.push("sourceVersion");
  if (!isInvestimentoCdiDiasUteisModo(inputs.diasUteisModo)) errors.push("diasUteisModo");
  if (!isInvestimentoCdiModo(inputs.cdiModo)) errors.push("cdiModo");
  if (!isMoney(inputs.valorInicial)) errors.push("valorInicial");
  if (!isIntegerRange(inputs.prazoDiasCorridos, 1, INVESTIMENTO_CDI_PRAZO_DIAS_CORRIDOS_MAX)) {
    errors.push("prazoDiasCorridos");
  }
  if (!isIntegerRange(inputs.diasUteis, 1, INVESTIMENTO_CDI_DIAS_UTEIS_MAX)) errors.push("diasUteis");
  if (
    Number.isFinite(inputs.prazoDiasCorridos) &&
    Number.isFinite(inputs.diasUteis) &&
    inputs.diasUteis > getDiasUteisMaximoParaPrazoInvestimentoCdi(inputs.prazoDiasCorridos)
  ) {
    errors.push("diasUteisAcimaPrazo");
  }
  if (!isPercent(inputs.percentualCdi, 0, 300)) errors.push("percentualCdi");
  if (inputs.cdiModo === "manual" && !isPercent(inputs.cdiAnualManual, 0, 100)) errors.push("cdiAnualManual");
  if (errors.length === 0 && !hasFiniteOutput(inputs)) errors.push("resultadoNaoFinito");

  return errors;
}

function buildCdiFonte(inputs: InvestimentoCdiInputs, taxaCdiDiariaPercent: number): InvestimentoCdiFonte {
  return {
    modo: inputs.cdiModo,
    sourceVersion: INVESTIMENTO_CDI_SOURCE_VERSION,
    observationDate: INVESTIMENTO_CDI_OBSERVATION_DATE,
    dailyRatePercent: taxaCdiDiariaPercent,
    annualRatePercent: inputs.cdiModo === "snapshot" ? INVESTIMENTO_CDI_ANNUAL_RATE_PERCENT : roundRate(inputs.cdiAnualManual),
    staleAfter: INVESTIMENTO_CDI_SOURCE_STALE_AFTER,
    warningCode: inputs.cdiModo === "snapshot" ? "snapshotDatado" : "cdiManualUsuario",
  };
}

function buildWarnings(
  inputs: InvestimentoCdiInputs,
  rendimentoBruto: number,
  diasUteisOrigem: InvestimentoCdiDiasUteisOrigem
): InvestimentoCdiWarningCode[] {
  const warnings: InvestimentoCdiWarningCode[] = [
    "sourceVersion20260706",
    "estimativaEducativa",
    "semGarantiaOuContrato",
    "semRecomendacao",
  ];

  warnings.push(inputs.cdiModo === "snapshot" ? "fonteCdiDatada" : "cdiManualUsuario");
  warnings.push(diasUteisOrigem === "estimado" ? "diasUteisEstimados" : "diasUteisInformados");
  if (inputs.prazoDiasCorridos <= 30) warnings.push("iofCurtoPrazo");
  if (rendimentoBruto <= 0) warnings.push("rendimentoZero");

  return warnings;
}

function buildComparisonRows(inputs: InvestimentoCdiInputs): InvestimentoCdiScenarioRow[] {
  const percentages = Array.from(new Set([90, 100, 110, inputs.percentualCdi])).sort((a, b) => a - b);

  return percentages.map((percentualCdi) => {
    const core = calculateCore({ ...inputs, percentualCdi });

    return {
      percentualCdi,
      valorFinalBruto: core.valorFinalBruto,
      rendimentoBruto: core.rendimentoBruto,
      valorFinalLiquido: core.valorFinalLiquido,
      rendimentoLiquido: core.rendimentoLiquido,
      rentabilidadeLiquidaPercent: core.rentabilidadeLiquidaPercent,
    };
  });
}

function buildBreakdown(result: Omit<InvestimentoCdiResultado, "breakdown">): InvestimentoCdiBreakdownRow[] {
  return [
    {
      id: "valorInicial",
      categoria: "entrada",
      valor: result.inputs.valorInicial,
    },
    {
      id: "valorFinalBruto",
      categoria: "rendimento",
      valor: result.valorFinalBruto,
    },
    {
      id: "rendimentoBruto",
      categoria: "rendimento",
      valor: result.rendimentoBruto,
    },
    {
      id: "iof",
      categoria: "impostos",
      valor: result.iofValor,
      percent: result.iofAliquota,
    },
    {
      id: "baseIr",
      categoria: "impostos",
      valor: result.baseIr,
    },
    {
      id: "ir",
      categoria: "impostos",
      valor: result.irValor,
      percent: result.irAliquota,
    },
    {
      id: "rendimentoLiquido",
      categoria: "liquido",
      valor: result.rendimentoLiquido,
    },
    {
      id: "valorFinalLiquido",
      categoria: "liquido",
      valor: result.valorFinalLiquido,
    },
    {
      id: "percentualCdi",
      categoria: "premissas",
      percent: result.inputs.percentualCdi,
    },
    {
      id: "prazoDiasCorridos",
      categoria: "premissas",
      texto: result.inputs.prazoDiasCorridos.toString(),
    },
    {
      id: "diasUteis",
      categoria: "premissas",
      texto: result.diasUteisUsados.toString(),
    },
    {
      id: "taxaCdiDiaria",
      categoria: "premissas",
      percent: result.taxaCdiDiariaPercent,
    },
    {
      id: "taxaCdiAnual",
      categoria: "premissas",
      percent: result.taxaCdiAnualPercent,
    },
    {
      id: "sourceVersion",
      categoria: "premissas",
      texto: result.inputs.sourceVersion,
    },
  ];
}

export function calcularInvestimentoCdi(inputs: InvestimentoCdiInputs): InvestimentoCdiResultado {
  const validationErrors = validateInvestimentoCdiInputs(inputs);
  if (validationErrors.length > 0) {
    throw new RangeError(`Invalid investimento CDI inputs: ${validationErrors.join(", ")}`);
  }

  const core = calculateCore(inputs);
  const diasUteisEstimados = calcularDiasUteisEstimadosInvestimentoCdi(inputs.prazoDiasCorridos);
  const diasUteisUsados = getDiasUteisUsados(inputs);
  const diasUteisOrigem: InvestimentoCdiDiasUteisOrigem =
    inputs.diasUteisModo === "manual" ? "informado" : "estimado";
  const taxaCdiDiaria = getInvestimentoCdiDailyRate(inputs);
  const taxaCdiDiariaPercent = roundSourceRate(taxaCdiDiaria * 100);
  const taxaInvestimentoDiariaPercent = roundSourceRate(taxaCdiDiaria * (inputs.percentualCdi / 100) * 100);

  const resultWithoutBreakdown: Omit<InvestimentoCdiResultado, "breakdown"> = {
    inputs,
    ...core,
    taxaCdiDiariaPercent,
    taxaCdiAnualPercent: inputs.cdiModo === "snapshot" ? INVESTIMENTO_CDI_ANNUAL_RATE_PERCENT : roundRate(inputs.cdiAnualManual),
    taxaInvestimentoDiariaPercent,
    diasUteisEstimados,
    diasUteisUsados,
    diasUteisOrigem,
    cdiFonte: buildCdiFonte(inputs, taxaCdiDiariaPercent),
    warnings: buildWarnings(inputs, core.rendimentoBruto, diasUteisOrigem),
    comparisonRows: buildComparisonRows(inputs),
    sourceReferences: INVESTIMENTO_CDI_SOURCE_REFERENCES,
  };

  return {
    ...resultWithoutBreakdown,
    breakdown: buildBreakdown(resultWithoutBreakdown),
  };
}

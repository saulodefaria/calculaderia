import { round2 } from "../utils";

export const INVESTIMENTO_SOURCE_VERSION = {
  id: "2026-06-26",
  accessedAt: "2026-06-26",
  formulaSources: ["Microsoft FV", "Microsoft PMT", "Microsoft NPER", "Microsoft EFFECT", "Banco Central"],
} as const;

export const INVESTIMENTO_SUPPORTED_SOURCE_VERSION = INVESTIMENTO_SOURCE_VERSION.id;
export const INVESTIMENTO_MAX_HORIZON_MONTHS = 600;

export type InvestimentoMode = "projection" | "requiredContribution" | "timeToGoal";
export type InvestimentoTaxaPeriodo = "anualEfetiva" | "mensal";
export type InvestimentoAporteTiming = "fim" | "inicio";

export interface InvestimentoInputs {
  mode: InvestimentoMode;
  valorInicial: number;
  aporteMensal: number;
  metaValor: number;
  prazoMeses: number;
  taxa: number;
  taxaPeriodo: InvestimentoTaxaPeriodo;
  aporteTiming: InvestimentoAporteTiming;
  inflacaoAnual: number | null;
}

export type InvestimentoValidationCode =
  | "valorInicial"
  | "aporteMensal"
  | "metaValor"
  | "prazoMeses"
  | "taxa"
  | "inflacaoAnual"
  | "mode"
  | "taxaPeriodo"
  | "aporteTiming";

export type InvestimentoWarningCode =
  | "constantReturn"
  | "noTaxesFees"
  | "noCurrentRates"
  | "notAdvice"
  | "negativeRate"
  | "highRate"
  | "unreachableGoal";

export interface InvestimentoProjectionRow {
  periodo: number;
  saldoInicial: number;
  aporte: number;
  jurosEstimados: number;
  saldoFinalNominal: number;
  saldoFinalReal: number | null;
  totalAportado: number;
}

export interface InvestimentoYearsMonths {
  anos: number;
  meses: number;
}

export interface InvestimentoResult {
  mode: InvestimentoMode;
  valorFinalNominal: number;
  valorFinalReal: number | null;
  totalAportado: number;
  totalJurosEstimados: number;
  percentualJuros: number;
  aporteMensalUsado: number;
  aporteMensalNecessario: number | null;
  mesesAteMeta: number | null;
  tempoAteMeta: InvestimentoYearsMonths | null;
  taxaMensalEquivalente: number;
  taxaAnualEquivalente: number;
  aporteTiming: InvestimentoAporteTiming;
  projectionSeries: InvestimentoProjectionRow[];
  warnings: InvestimentoWarningCode[];
  sourceVersion: typeof INVESTIMENTO_SOURCE_VERSION;
}

function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value);
}

function isMoneyInRange(value: number, min: number, max: number): boolean {
  return isFiniteNumber(value) && value >= min && value <= max;
}

function isIntegerInRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

export function getDefaultInvestimentoInputs(): InvestimentoInputs {
  return {
    mode: "projection",
    valorInicial: 1000,
    aporteMensal: 500,
    metaValor: 100000,
    prazoMeses: 120,
    taxa: 8,
    taxaPeriodo: "anualEfetiva",
    aporteTiming: "fim",
    inflacaoAnual: null,
  };
}

export function validateInvestimentoInputs(inputs: InvestimentoInputs): InvestimentoValidationCode[] {
  const errors: InvestimentoValidationCode[] = [];

  if (!["projection", "requiredContribution", "timeToGoal"].includes(inputs.mode)) errors.push("mode");
  if (!["anualEfetiva", "mensal"].includes(inputs.taxaPeriodo)) errors.push("taxaPeriodo");
  if (!["fim", "inicio"].includes(inputs.aporteTiming)) errors.push("aporteTiming");
  if (!isMoneyInRange(inputs.valorInicial, 0, 1_000_000_000)) errors.push("valorInicial");
  if (!isMoneyInRange(inputs.aporteMensal, 0, 100_000_000)) errors.push("aporteMensal");
  if ((inputs.mode === "requiredContribution" || inputs.mode === "timeToGoal") && !isMoneyInRange(inputs.metaValor, 0.01, 10_000_000_000)) {
    errors.push("metaValor");
  }
  if ((inputs.mode === "projection" || inputs.mode === "requiredContribution") && !isIntegerInRange(inputs.prazoMeses, 1, INVESTIMENTO_MAX_HORIZON_MONTHS)) {
    errors.push("prazoMeses");
  }

  const taxaMax = inputs.taxaPeriodo === "mensal" ? 1000 : 10000;
  const hasTaxaError = !isFiniteNumber(inputs.taxa) || inputs.taxa <= -100 || inputs.taxa > taxaMax;
  if (hasTaxaError) errors.push("taxa");

  const hasTaxaPeriodoError = !["anualEfetiva", "mensal"].includes(inputs.taxaPeriodo);
  const hasAporteTimingError = !["fim", "inicio"].includes(inputs.aporteTiming);
  const monthsForOverflow = inputs.mode === "timeToGoal" ? INVESTIMENTO_MAX_HORIZON_MONTHS : inputs.prazoMeses;
  const aporteMensalForOverflow = inputs.mode === "requiredContribution" ? 0 : inputs.aporteMensal;
  if (
    !hasTaxaError &&
    !hasTaxaPeriodoError &&
    !hasAporteTimingError &&
    isMoneyInRange(inputs.valorInicial, 0, 1_000_000_000) &&
    isMoneyInRange(aporteMensalForOverflow, 0, 100_000_000) &&
    isIntegerInRange(monthsForOverflow, 1, INVESTIMENTO_MAX_HORIZON_MONTHS)
  ) {
    const taxaMensal = getTaxaMensalDecimal(inputs.taxa, inputs.taxaPeriodo);
    const factor = Math.pow(1 + taxaMensal, monthsForOverflow);
    const finalValue = futureValueInvestimento({
      valorInicial: inputs.valorInicial,
      aporteMensal: aporteMensalForOverflow,
      meses: monthsForOverflow,
      taxaMensal,
      aporteTiming: inputs.aporteTiming,
    });

    if (!Number.isFinite(factor) || !Number.isFinite(finalValue)) errors.push("taxa");
  }

  if (
    inputs.inflacaoAnual !== null &&
    (!isFiniteNumber(inputs.inflacaoAnual) || inputs.inflacaoAnual <= -100 || inputs.inflacaoAnual > 1000)
  ) {
    errors.push("inflacaoAnual");
  }

  return errors;
}

export function getTaxaMensalDecimal(taxa: number, taxaPeriodo: InvestimentoTaxaPeriodo): number {
  if (taxaPeriodo === "mensal") return taxa / 100;
  return Math.pow(1 + taxa / 100, 1 / 12) - 1;
}

export function getTaxaAnualEquivalenteDecimal(taxaMensal: number): number {
  return Math.pow(1 + taxaMensal, 12) - 1;
}

export function getInflacaoMensalDecimal(inflacaoAnual: number | null): number | null {
  if (inflacaoAnual === null) return null;
  return Math.pow(1 + inflacaoAnual / 100, 1 / 12) - 1;
}

export function futureValueInvestimento({
  valorInicial,
  aporteMensal,
  meses,
  taxaMensal,
  aporteTiming,
}: {
  valorInicial: number;
  aporteMensal: number;
  meses: number;
  taxaMensal: number;
  aporteTiming: InvestimentoAporteTiming;
}): number {
  if (meses <= 0) return valorInicial;
  if (taxaMensal === 0) return valorInicial + aporteMensal * meses;

  const factor = Math.pow(1 + taxaMensal, meses);
  const due = aporteTiming === "inicio" ? 1 + taxaMensal : 1;
  return valorInicial * factor + aporteMensal * due * ((factor - 1) / taxaMensal);
}

function buildProjectionSeries({
  valorInicial,
  aporteMensal,
  meses,
  taxaMensal,
  inflacaoMensal,
  aporteTiming,
}: {
  valorInicial: number;
  aporteMensal: number;
  meses: number;
  taxaMensal: number;
  inflacaoMensal: number | null;
  aporteTiming: InvestimentoAporteTiming;
}): InvestimentoProjectionRow[] {
  const rows: InvestimentoProjectionRow[] = [];
  let saldo = valorInicial;

  for (let periodo = 1; periodo <= meses; periodo++) {
    const saldoInicial = saldo;
    const baseJuros = aporteTiming === "inicio" ? saldoInicial + aporteMensal : saldoInicial;
    const jurosEstimados = baseJuros * taxaMensal;
    saldo = aporteTiming === "inicio"
      ? saldoInicial + aporteMensal + jurosEstimados
      : saldoInicial + jurosEstimados + aporteMensal;

    const saldoFinalReal =
      inflacaoMensal === null ? null : saldo / Math.pow(1 + inflacaoMensal, periodo);

    rows.push({
      periodo,
      saldoInicial: round2(saldoInicial),
      aporte: round2(aporteMensal),
      jurosEstimados: round2(jurosEstimados),
      saldoFinalNominal: round2(saldo),
      saldoFinalReal: saldoFinalReal === null ? null : round2(saldoFinalReal),
      totalAportado: round2(valorInicial + aporteMensal * periodo),
    });
  }

  return rows;
}

function requiredMonthlyContribution({
  valorInicial,
  metaValor,
  prazoMeses,
  taxaMensal,
  aporteTiming,
}: {
  valorInicial: number;
  metaValor: number;
  prazoMeses: number;
  taxaMensal: number;
  aporteTiming: InvestimentoAporteTiming;
}): number | null {
  const capitalGrowth = valorInicial * Math.pow(1 + taxaMensal, prazoMeses);
  const gap = metaValor - capitalGrowth;

  if (gap <= 0) return 0;
  if (taxaMensal === 0) return gap / prazoMeses;

  const factor = Math.pow(1 + taxaMensal, prazoMeses);
  const due = aporteTiming === "inicio" ? 1 + taxaMensal : 1;
  const denominator = due * ((factor - 1) / taxaMensal);

  if (!Number.isFinite(denominator) || denominator <= 0) return null;
  return gap / denominator;
}

function findMonthsToGoal({
  valorInicial,
  aporteMensal,
  metaValor,
  taxaMensal,
  aporteTiming,
}: {
  valorInicial: number;
  aporteMensal: number;
  metaValor: number;
  taxaMensal: number;
  aporteTiming: InvestimentoAporteTiming;
}): number | null {
  if (valorInicial >= metaValor) return 0;

  for (let mes = 1; mes <= INVESTIMENTO_MAX_HORIZON_MONTHS; mes++) {
    const value = futureValueInvestimento({
      valorInicial,
      aporteMensal,
      meses: mes,
      taxaMensal,
      aporteTiming,
    });

    if (Number.isFinite(value) && value >= metaValor) return mes;
  }

  return null;
}

function yearsMonths(totalMonths: number): InvestimentoYearsMonths {
  return {
    anos: Math.floor(totalMonths / 12),
    meses: totalMonths % 12,
  };
}

function buildWarnings(inputs: InvestimentoInputs, unreachable: boolean): InvestimentoWarningCode[] {
  const warnings: InvestimentoWarningCode[] = ["constantReturn", "noTaxesFees", "noCurrentRates", "notAdvice"];

  if (inputs.taxa < 0) warnings.push("negativeRate");
  if ((inputs.taxaPeriodo === "mensal" && inputs.taxa > 10) || (inputs.taxaPeriodo === "anualEfetiva" && inputs.taxa > 100)) {
    warnings.push("highRate");
  }
  if (unreachable) warnings.push("unreachableGoal");

  return warnings;
}

export function calcularInvestimento(inputs: InvestimentoInputs): InvestimentoResult {
  const validationErrors = validateInvestimentoInputs(inputs);
  if (validationErrors.length > 0) {
    throw new RangeError(`Invalid investimento inputs: ${validationErrors.join(", ")}`);
  }

  const taxaMensalDecimal = getTaxaMensalDecimal(inputs.taxa, inputs.taxaPeriodo);
  const inflacaoMensalDecimal = getInflacaoMensalDecimal(inputs.inflacaoAnual);
  let aporteMensalUsado = inputs.aporteMensal;
  let aporteMensalNecessario: number | null = null;
  let mesesResultado = inputs.prazoMeses;
  let mesesAteMeta: number | null = null;
  let unreachable = false;

  if (inputs.mode === "requiredContribution") {
    aporteMensalNecessario = requiredMonthlyContribution({
      valorInicial: inputs.valorInicial,
      metaValor: inputs.metaValor,
      prazoMeses: inputs.prazoMeses,
      taxaMensal: taxaMensalDecimal,
      aporteTiming: inputs.aporteTiming,
    });

    if (aporteMensalNecessario === null || !Number.isFinite(aporteMensalNecessario)) {
      aporteMensalUsado = 0;
      unreachable = true;
    } else {
      aporteMensalUsado = Math.max(0, aporteMensalNecessario);
    }
  }

  if (inputs.mode === "timeToGoal") {
    mesesAteMeta = findMonthsToGoal({
      valorInicial: inputs.valorInicial,
      aporteMensal: inputs.aporteMensal,
      metaValor: inputs.metaValor,
      taxaMensal: taxaMensalDecimal,
      aporteTiming: inputs.aporteTiming,
    });
    unreachable = mesesAteMeta === null;
    mesesResultado = mesesAteMeta ?? INVESTIMENTO_MAX_HORIZON_MONTHS;
  }

  const projectionSeries = buildProjectionSeries({
    valorInicial: inputs.valorInicial,
    aporteMensal: aporteMensalUsado,
    meses: mesesResultado,
    taxaMensal: taxaMensalDecimal,
    inflacaoMensal: inflacaoMensalDecimal,
    aporteTiming: inputs.aporteTiming,
  });

  const lastRow = projectionSeries[projectionSeries.length - 1];
  const valorFinalNominal = lastRow ? lastRow.saldoFinalNominal : round2(inputs.valorInicial);
  const valorFinalReal = lastRow?.saldoFinalReal ?? (inputs.inflacaoAnual === null ? null : round2(inputs.valorInicial));
  const totalAportado = lastRow ? lastRow.totalAportado : round2(inputs.valorInicial);
  const totalJurosEstimados = round2(valorFinalNominal - totalAportado);
  const percentualJuros = totalAportado > 0 ? round2((totalJurosEstimados / totalAportado) * 100) : 0;

  return {
    mode: inputs.mode,
    valorFinalNominal,
    valorFinalReal,
    totalAportado,
    totalJurosEstimados,
    percentualJuros,
    aporteMensalUsado,
    aporteMensalNecessario,
    mesesAteMeta,
    tempoAteMeta: mesesAteMeta === null ? null : yearsMonths(mesesAteMeta),
    taxaMensalEquivalente: round2(taxaMensalDecimal * 100),
    taxaAnualEquivalente: round2(getTaxaAnualEquivalenteDecimal(taxaMensalDecimal) * 100),
    aporteTiming: inputs.aporteTiming,
    projectionSeries,
    warnings: buildWarnings(inputs, unreachable),
    sourceVersion: INVESTIMENTO_SOURCE_VERSION,
  };
}

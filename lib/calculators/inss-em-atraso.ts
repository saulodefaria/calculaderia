export const INSS_EM_ATRASO_SOURCE_VERSION = "2026-07-06" as const;
export const INSS_EM_ATRASO_SUPPORTED_PAYMENT_MAX_DATE = "2026-07-31" as const;
export const INSS_EM_ATRASO_LATEST_SELIC_MONTH = "2026-06" as const;
export const INSS_EM_ATRASO_SUPPORTED_PAYMENT_MONTH = "2026-07" as const;
export const INSS_EM_ATRASO_MONEY_MAX = 10_000_000;
export const INSS_EM_ATRASO_MAX_MANUAL_DAYS = 10_000;

export type InssEmAtrasoCategoriaSegurado = "contribuinteIndividual" | "facultativo";

export type InssEmAtrasoStatusRegularizacao =
  | "selfServiceLikely"
  | "requiresInssService"
  | "unsupportedHistoricalPeriod"
  | "staleSource"
  | "noArrears";

export type InssEmAtrasoWarningCode =
  | "estimativaEducativa"
  | "fonteReceitaInss2026"
  | "principalInformadoUsuario"
  | "sistemasOficiaisPrevalecem"
  | "semEmissaoGuia"
  | "semValidacaoBeneficio"
  | "ajusteDiasManual"
  | "janelaPagamentoFonte"
  | "janelaContribuinteIndividual"
  | "janelaFacultativo"
  | "periodoHistoricoNaoSuportado"
  | "semJurosMesmoMes"
  | "semAtraso"
  | "selicIndisponivel"
  | "fonteUrlNaoSuportada";

export type InssEmAtrasoBreakdownCategory = "principal" | "multa" | "juros" | "total";

export type InssEmAtrasoBreakdownId =
  | "valorPrincipal"
  | "multaPercentual"
  | "multa"
  | "jurosPercentual"
  | "juros"
  | "totalAcrescimos"
  | "totalEstimado";

export interface InssEmAtrasoInputs {
  valorPrincipal: number;
  competencia: string;
  categoriaSegurado: InssEmAtrasoCategoriaSegurado;
  dataVencimento: string;
  dataPagamento: string;
  diasAtrasoManual: number | null;
  confirmarPrincipalUsuario: boolean;
}

export interface InssEmAtrasoBreakdownRow {
  id: InssEmAtrasoBreakdownId;
  categoria: InssEmAtrasoBreakdownCategory;
  valor: number;
  aplicavel: boolean;
  detalhe?: string;
}

export interface ResultadoInssEmAtraso {
  valorPrincipal: number;
  competencia: string;
  categoriaSegurado: InssEmAtrasoCategoriaSegurado;
  dataVencimento: string;
  dataPagamento: string;
  diasAtrasoEstimados: number;
  diasAtrasoUsados: number;
  diasAtrasoManual: number | null;
  multaPercentual: number;
  multa: number;
  jurosPercentual: number;
  juros: number;
  totalAcrescimos: number;
  totalEstimado: number;
  statusRegularizacao: InssEmAtrasoStatusRegularizacao;
  mesesEntreCompetenciaEPagamento: number;
  breakdown: InssEmAtrasoBreakdownRow[];
  warnings: InssEmAtrasoWarningCode[];
  validationErrors: string[];
  sourceVersion: typeof INSS_EM_ATRASO_SOURCE_VERSION;
  sourceAccessDate: "2026-07-06 America/Sao_Paulo";
  latestSelicMonth: typeof INSS_EM_ATRASO_LATEST_SELIC_MONTH;
  supportedPaymentMonth: typeof INSS_EM_ATRASO_SUPPORTED_PAYMENT_MONTH;
}

interface DateParts {
  year: number;
  month: number;
  day: number;
}

export const INSS_EM_ATRASO_SOURCE_VERSION_2026_07_06 = {
  sourceVersion: INSS_EM_ATRASO_SOURCE_VERSION,
  sourceAccessDate: "2026-07-06 America/Sao_Paulo",
  latestSelicMonth: INSS_EM_ATRASO_LATEST_SELIC_MONTH,
  supportedPaymentMonth: INSS_EM_ATRASO_SUPPORTED_PAYMENT_MONTH,
  supportedPaymentMaxDate: INSS_EM_ATRASO_SUPPORTED_PAYMENT_MAX_DATE,
  multaMoraDiaria: 0.0033,
  multaMoraMaxima: 0.2,
  jurosMesPagamentoPercentual: 1,
} as const;

// Receita/Sicalc monthly Selic snapshot derived from accumulated rows queried on 2026-07-06.
export const INSS_EM_ATRASO_SELIC_MENSAL_PERCENTUAL_2026_07_06: Record<string, number> = {
  "2009-02": 0.86,
  "2009-03": 0.97,
  "2009-04": 0.84,
  "2009-05": 0.77,
  "2009-06": 0.76,
  "2009-07": 0.79,
  "2009-08": 0.69,
  "2009-09": 0.69,
  "2009-10": 0.69,
  "2009-11": 0.66,
  "2009-12": 0.73,
  "2010-01": 0.66,
  "2010-02": 0.59,
  "2010-03": 0.76,
  "2010-04": 0.67,
  "2010-05": 0.75,
  "2010-06": 0.79,
  "2010-07": 0.86,
  "2010-08": 0.89,
  "2010-09": 0.85,
  "2010-10": 0.81,
  "2010-11": 0.81,
  "2010-12": 0.93,
  "2011-01": 0.86,
  "2011-02": 0.84,
  "2011-03": 0.92,
  "2011-04": 0.84,
  "2011-05": 0.99,
  "2011-06": 0.96,
  "2011-07": 0.97,
  "2011-08": 1.07,
  "2011-09": 0.94,
  "2011-10": 0.88,
  "2011-11": 0.86,
  "2011-12": 0.91,
  "2012-01": 0.89,
  "2012-02": 0.75,
  "2012-03": 0.82,
  "2012-04": 0.71,
  "2012-05": 0.74,
  "2012-06": 0.64,
  "2012-07": 0.68,
  "2012-08": 0.69,
  "2012-09": 0.54,
  "2012-10": 0.61,
  "2012-11": 0.55,
  "2012-12": 0.55,
  "2013-01": 0.6,
  "2013-02": 0.49,
  "2013-03": 0.55,
  "2013-04": 0.61,
  "2013-05": 0.6,
  "2013-06": 0.61,
  "2013-07": 0.72,
  "2013-08": 0.71,
  "2013-09": 0.71,
  "2013-10": 0.81,
  "2013-11": 0.72,
  "2013-12": 0.79,
  "2014-01": 0.85,
  "2014-02": 0.79,
  "2014-03": 0.77,
  "2014-04": 0.82,
  "2014-05": 0.87,
  "2014-06": 0.82,
  "2014-07": 0.95,
  "2014-08": 0.87,
  "2014-09": 0.91,
  "2014-10": 0.95,
  "2014-11": 0.84,
  "2014-12": 0.96,
  "2015-01": 0.94,
  "2015-02": 0.82,
  "2015-03": 1.04,
  "2015-04": 0.95,
  "2015-05": 0.99,
  "2015-06": 1.07,
  "2015-07": 1.18,
  "2015-08": 1.11,
  "2015-09": 1.11,
  "2015-10": 1.11,
  "2015-11": 1.06,
  "2015-12": 1.16,
  "2016-01": 1.06,
  "2016-02": 1,
  "2016-03": 1.16,
  "2016-04": 1.06,
  "2016-05": 1.11,
  "2016-06": 1.16,
  "2016-07": 1.11,
  "2016-08": 1.22,
  "2016-09": 1.11,
  "2016-10": 1.05,
  "2016-11": 1.04,
  "2016-12": 1.12,
  "2017-01": 1.09,
  "2017-02": 0.87,
  "2017-03": 1.05,
  "2017-04": 0.79,
  "2017-05": 0.93,
  "2017-06": 0.81,
  "2017-07": 0.8,
  "2017-08": 0.8,
  "2017-09": 0.64,
  "2017-10": 0.64,
  "2017-11": 0.57,
  "2017-12": 0.54,
  "2018-01": 0.58,
  "2018-02": 0.47,
  "2018-03": 0.53,
  "2018-04": 0.52,
  "2018-05": 0.52,
  "2018-06": 0.52,
  "2018-07": 0.54,
  "2018-08": 0.57,
  "2018-09": 0.47,
  "2018-10": 0.54,
  "2018-11": 0.49,
  "2018-12": 0.49,
  "2019-01": 0.54,
  "2019-02": 0.49,
  "2019-03": 0.47,
  "2019-04": 0.52,
  "2019-05": 0.54,
  "2019-06": 0.47,
  "2019-07": 0.57,
  "2019-08": 0.5,
  "2019-09": 0.46,
  "2019-10": 0.48,
  "2019-11": 0.38,
  "2019-12": 0.37,
  "2020-01": 0.38,
  "2020-02": 0.29,
  "2020-03": 0.34,
  "2020-04": 0.28,
  "2020-05": 0.24,
  "2020-06": 0.21,
  "2020-07": 0.19,
  "2020-08": 0.16,
  "2020-09": 0.16,
  "2020-10": 0.16,
  "2020-11": 0.15,
  "2020-12": 0.16,
  "2021-01": 0.15,
  "2021-02": 0.13,
  "2021-03": 0.2,
  "2021-04": 0.21,
  "2021-05": 0.27,
  "2021-06": 0.31,
  "2021-07": 0.36,
  "2021-08": 0.43,
  "2021-09": 0.44,
  "2021-10": 0.49,
  "2021-11": 0.59,
  "2021-12": 0.77,
  "2022-01": 0.73,
  "2022-02": 0.76,
  "2022-03": 0.93,
  "2022-04": 0.83,
  "2022-05": 1.03,
  "2022-06": 1.02,
  "2022-07": 1.03,
  "2022-08": 1.17,
  "2022-09": 1.07,
  "2022-10": 1.02,
  "2022-11": 1.02,
  "2022-12": 1.12,
  "2023-01": 1.12,
  "2023-02": 0.92,
  "2023-03": 1.17,
  "2023-04": 0.92,
  "2023-05": 1.12,
  "2023-06": 1.07,
  "2023-07": 1.07,
  "2023-08": 1.14,
  "2023-09": 0.97,
  "2023-10": 1,
  "2023-11": 0.92,
  "2023-12": 0.89,
  "2024-01": 0.97,
  "2024-02": 0.8,
  "2024-03": 0.83,
  "2024-04": 0.89,
  "2024-05": 0.83,
  "2024-06": 0.79,
  "2024-07": 0.91,
  "2024-08": 0.87,
  "2024-09": 0.84,
  "2024-10": 0.93,
  "2024-11": 0.79,
  "2024-12": 0.93,
  "2025-01": 1.01,
  "2025-02": 0.99,
  "2025-03": 0.96,
  "2025-04": 1.06,
  "2025-05": 1.14,
  "2025-06": 1.1,
  "2025-07": 1.28,
  "2025-08": 1.16,
  "2025-09": 1.22,
  "2025-10": 1.28,
  "2025-11": 1.05,
  "2025-12": 1.22,
  "2026-01": 1.16,
  "2026-02": 1,
  "2026-03": 1.21,
  "2026-04": 1.09,
  "2026-05": 1.07,
  "2026-06": 1.12,
} as const;

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundRate(value: number): number {
  return Math.round((value + Number.EPSILON) * 10_000) / 10_000;
}

function isSupportedCategoria(value: string): value is InssEmAtrasoCategoriaSegurado {
  return value === "contribuinteIndividual" || value === "facultativo";
}

function parseDateParts(value: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }

  return { year, month, day };
}

function parseMonthParts(value: string): Pick<DateParts, "year" | "month"> | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return null;

  return { year, month };
}

function toUtcDate(parts: DateParts): Date {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

function monthKey(year: number, month: number): string {
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}`;
}

function addMonths(year: number, month: number, delta: number): Pick<DateParts, "year" | "month"> {
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

function compareDates(a: string, b: string): number {
  return a.localeCompare(b);
}

function getMonthIndex(year: number, month: number): number {
  return year * 12 + month - 1;
}

function monthsBetween(startMonth: string, endMonth: string): number {
  const start = parseMonthParts(startMonth);
  const end = parseMonthParts(endMonth);
  if (!start || !end) return Number.NaN;
  return getMonthIndex(end.year, end.month) - getMonthIndex(start.year, start.month);
}

function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildWarnings(
  inputs: InssEmAtrasoInputs,
  statusRegularizacao: InssEmAtrasoStatusRegularizacao,
  missingSelic: boolean,
  sameMonthNoInterest: boolean
): InssEmAtrasoWarningCode[] {
  const warnings: InssEmAtrasoWarningCode[] = [
    "estimativaEducativa",
    "fonteReceitaInss2026",
    "principalInformadoUsuario",
    "sistemasOficiaisPrevalecem",
    "semEmissaoGuia",
    "semValidacaoBeneficio",
  ];

  if (inputs.diasAtrasoManual !== null) warnings.push("ajusteDiasManual");
  if (statusRegularizacao === "staleSource") warnings.push("janelaPagamentoFonte");
  if (statusRegularizacao === "unsupportedHistoricalPeriod") warnings.push("periodoHistoricoNaoSuportado");
  if (statusRegularizacao === "noArrears") warnings.push("semAtraso");
  if (inputs.categoriaSegurado === "contribuinteIndividual" && statusRegularizacao === "requiresInssService") {
    warnings.push("janelaContribuinteIndividual");
  }
  if (inputs.categoriaSegurado === "facultativo" && statusRegularizacao === "requiresInssService") {
    warnings.push("janelaFacultativo");
  }
  if (missingSelic) warnings.push("selicIndisponivel");
  if (sameMonthNoInterest) warnings.push("semJurosMesmoMes");

  return [...new Set(warnings)];
}

function buildBreakdown(result: {
  valorPrincipal: number;
  multaPercentual: number;
  multa: number;
  jurosPercentual: number;
  juros: number;
  totalAcrescimos: number;
  totalEstimado: number;
  calculoAplicavel: boolean;
}): InssEmAtrasoBreakdownRow[] {
  return [
    {
      id: "valorPrincipal",
      categoria: "principal",
      valor: result.valorPrincipal,
      aplicavel: true,
      detalhe: "campo6",
    },
    {
      id: "multaPercentual",
      categoria: "multa",
      valor: result.multaPercentual * 100,
      aplicavel: result.calculoAplicavel,
      detalhe: "diaria033",
    },
    {
      id: "multa",
      categoria: "multa",
      valor: result.multa,
      aplicavel: result.calculoAplicavel,
      detalhe: "limite20",
    },
    {
      id: "jurosPercentual",
      categoria: "juros",
      valor: result.jurosPercentual * 100,
      aplicavel: result.calculoAplicavel,
      detalhe: "selicMais1",
    },
    {
      id: "juros",
      categoria: "juros",
      valor: result.juros,
      aplicavel: result.calculoAplicavel,
      detalhe: "receita",
    },
    {
      id: "totalAcrescimos",
      categoria: "total",
      valor: result.totalAcrescimos,
      aplicavel: result.calculoAplicavel,
    },
    {
      id: "totalEstimado",
      categoria: "total",
      valor: result.totalEstimado,
      aplicavel: true,
    },
  ];
}

export function getDefaultInssEmAtrasoInputs(): InssEmAtrasoInputs {
  return {
    valorPrincipal: 324.2,
    competencia: "2026-01",
    categoriaSegurado: "contribuinteIndividual",
    dataVencimento: "2026-02-16",
    dataPagamento: "2026-07-06",
    diasAtrasoManual: null,
    confirmarPrincipalUsuario: true,
  };
}

export function getDefaultInssEmAtrasoDueDate(competencia: string): string | null {
  const month = parseMonthParts(competencia);
  if (!month) return null;

  const nextMonth = addMonths(month.year, month.month, 1);
  const dueDate = new Date(Date.UTC(nextMonth.year, nextMonth.month - 1, 15));
  while (isWeekend(dueDate)) {
    dueDate.setUTCDate(dueDate.getUTCDate() + 1);
  }

  return toIsoDate(dueDate);
}

export function estimateInssEmAtrasoDelayDays(dataVencimento: string, dataPagamento: string): number | null {
  const dueParts = parseDateParts(dataVencimento);
  const paymentParts = parseDateParts(dataPagamento);
  if (!dueParts || !paymentParts) return null;

  const dueDate = toUtcDate(dueParts);
  const paymentDate = toUtcDate(paymentParts);
  const diffDays = Math.floor((paymentDate.getTime() - dueDate.getTime()) / 86_400_000);
  return Math.max(0, diffDays);
}

export function getInssEmAtrasoSelicMonths(dataVencimento: string, dataPagamento: string): string[] | null {
  const dueParts = parseDateParts(dataVencimento);
  const paymentParts = parseDateParts(dataPagamento);
  if (!dueParts || !paymentParts) return null;

  const dueMonthIndex = getMonthIndex(dueParts.year, dueParts.month);
  const paymentMonthIndex = getMonthIndex(paymentParts.year, paymentParts.month);
  if (paymentMonthIndex <= dueMonthIndex) return [];

  const months: string[] = [];
  for (let index = dueMonthIndex + 1; index <= paymentMonthIndex - 1; index += 1) {
    const year = Math.floor(index / 12);
    const month = (index % 12) + 1;
    months.push(monthKey(year, month));
  }

  return months;
}

export function calculateInssEmAtrasoJurosPercentual(
  dataVencimento: string,
  dataPagamento: string
): { percentual: number; missingMonths: string[] } {
  const dueParts = parseDateParts(dataVencimento);
  const paymentParts = parseDateParts(dataPagamento);
  if (!dueParts || !paymentParts) return { percentual: 0, missingMonths: [] };

  if (dueParts.year === paymentParts.year && dueParts.month === paymentParts.month) {
    return { percentual: 0, missingMonths: [] };
  }

  const months = getInssEmAtrasoSelicMonths(dataVencimento, dataPagamento);
  if (!months) return { percentual: 0, missingMonths: [] };

  const missingMonths = months.filter((month) => INSS_EM_ATRASO_SELIC_MENSAL_PERCENTUAL_2026_07_06[month] === undefined);
  if (missingMonths.length > 0) return { percentual: 0, missingMonths };

  const selicPercent = months.reduce(
    (sum, month) => sum + INSS_EM_ATRASO_SELIC_MENSAL_PERCENTUAL_2026_07_06[month],
    0
  );

  return {
    percentual: roundRate((selicPercent + INSS_EM_ATRASO_SOURCE_VERSION_2026_07_06.jurosMesPagamentoPercentual) / 100),
    missingMonths,
  };
}

export function validateInssEmAtrasoInputs(inputs: InssEmAtrasoInputs): string[] {
  const errors: string[] = [];
  const competencia = parseMonthParts(inputs.competencia);
  const due = parseDateParts(inputs.dataVencimento);
  const payment = parseDateParts(inputs.dataPagamento);

  if (!Number.isFinite(inputs.valorPrincipal) || inputs.valorPrincipal <= 0 || inputs.valorPrincipal > INSS_EM_ATRASO_MONEY_MAX) {
    errors.push("valorPrincipal");
  }
  if (!competencia) errors.push("competencia");
  if (!isSupportedCategoria(inputs.categoriaSegurado)) errors.push("categoriaSegurado");
  if (!due) errors.push("dataVencimento");
  if (!payment) errors.push("dataPagamento");
  if (inputs.diasAtrasoManual !== null) {
    if (
      !Number.isInteger(inputs.diasAtrasoManual) ||
      inputs.diasAtrasoManual < 0 ||
      inputs.diasAtrasoManual > INSS_EM_ATRASO_MAX_MANUAL_DAYS
    ) {
      errors.push("diasAtrasoManual");
    }
  }
  if (!inputs.confirmarPrincipalUsuario) errors.push("confirmarPrincipalUsuario");

  if (due && payment && compareDates(inputs.dataPagamento, inputs.dataVencimento) < 0) {
    errors.push("pagamentoAntesVencimento");
  }

  return errors;
}

export function calcularInssEmAtraso(inputs: InssEmAtrasoInputs): ResultadoInssEmAtraso {
  const validationErrors = validateInssEmAtrasoInputs(inputs);
  const competencia = parseMonthParts(inputs.competencia);
  const due = parseDateParts(inputs.dataVencimento);
  const payment = parseDateParts(inputs.dataPagamento);
  const principal = roundMoney(inputs.valorPrincipal);
  const paymentMonth = payment ? monthKey(payment.year, payment.month) : "";
  const mesesEntreCompetenciaEPagamento = payment ? monthsBetween(inputs.competencia, paymentMonth) : Number.NaN;

  let statusRegularizacao: InssEmAtrasoStatusRegularizacao = "selfServiceLikely";
  if (competencia && inputs.competencia < "2008-12") {
    statusRegularizacao = "unsupportedHistoricalPeriod";
  } else if (payment && compareDates(inputs.dataPagamento, INSS_EM_ATRASO_SUPPORTED_PAYMENT_MAX_DATE) > 0) {
    statusRegularizacao = "staleSource";
  } else if (validationErrors.includes("pagamentoAntesVencimento")) {
    statusRegularizacao = "noArrears";
  } else if (Number.isFinite(mesesEntreCompetenciaEPagamento)) {
    const selfServiceLimit = inputs.categoriaSegurado === "facultativo" ? 6 : 60;
    if (mesesEntreCompetenciaEPagamento > selfServiceLimit) statusRegularizacao = "requiresInssService";
  }

  const diasAtrasoEstimados = due && payment ? (estimateInssEmAtrasoDelayDays(inputs.dataVencimento, inputs.dataPagamento) ?? 0) : 0;
  const diasAtrasoUsados = inputs.diasAtrasoManual ?? diasAtrasoEstimados;
  const sameMonthNoInterest = Boolean(due && payment && due.year === payment.year && due.month === payment.month);
  const jurosResult = calculateInssEmAtrasoJurosPercentual(inputs.dataVencimento, inputs.dataPagamento);
  const missingSelic = jurosResult.missingMonths.length > 0;

  if (
    missingSelic &&
    statusRegularizacao !== "unsupportedHistoricalPeriod" &&
    statusRegularizacao !== "noArrears"
  ) {
    statusRegularizacao = "staleSource";
  }

  const calculationBlocked =
    validationErrors.length > 0 ||
    statusRegularizacao === "unsupportedHistoricalPeriod" ||
    statusRegularizacao === "staleSource" ||
    statusRegularizacao === "noArrears" ||
    missingSelic;

  const multaPercentual = calculationBlocked
    ? 0
    : roundRate(Math.min(INSS_EM_ATRASO_SOURCE_VERSION_2026_07_06.multaMoraMaxima, diasAtrasoUsados * INSS_EM_ATRASO_SOURCE_VERSION_2026_07_06.multaMoraDiaria));
  const multa = calculationBlocked ? 0 : roundMoney(principal * multaPercentual);
  const jurosPercentual = calculationBlocked ? 0 : jurosResult.percentual;
  const juros = calculationBlocked ? 0 : roundMoney(principal * jurosPercentual);
  const totalAcrescimos = roundMoney(multa + juros);
  const totalEstimado = roundMoney(principal + totalAcrescimos);
  const warnings = buildWarnings(inputs, statusRegularizacao, missingSelic, sameMonthNoInterest);

  return {
    valorPrincipal: principal,
    competencia: inputs.competencia,
    categoriaSegurado: inputs.categoriaSegurado,
    dataVencimento: inputs.dataVencimento,
    dataPagamento: inputs.dataPagamento,
    diasAtrasoEstimados,
    diasAtrasoUsados,
    diasAtrasoManual: inputs.diasAtrasoManual,
    multaPercentual,
    multa,
    jurosPercentual,
    juros,
    totalAcrescimos,
    totalEstimado,
    statusRegularizacao,
    mesesEntreCompetenciaEPagamento,
    breakdown: buildBreakdown({
      valorPrincipal: principal,
      multaPercentual,
      multa,
      jurosPercentual,
      juros,
      totalAcrescimos,
      totalEstimado,
      calculoAplicavel: !calculationBlocked,
    }),
    warnings,
    validationErrors,
    sourceVersion: INSS_EM_ATRASO_SOURCE_VERSION,
    sourceAccessDate: "2026-07-06 America/Sao_Paulo",
    latestSelicMonth: INSS_EM_ATRASO_LATEST_SELIC_MONTH,
    supportedPaymentMonth: INSS_EM_ATRASO_SUPPORTED_PAYMENT_MONTH,
  };
}

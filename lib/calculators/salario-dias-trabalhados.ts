import {
  PAYROLL_SOURCE_VERSION_2026_06_20,
  PAYROLL_TABLE_YEAR_2026,
  calcularInssEmpregado2026,
  calcularIrrfMensal2026,
  isPayrollMoney,
  roundPayrollMoney,
  roundPayrollRate,
  type PayrollInssResult,
  type PayrollIrrfBaseType,
  type PayrollIrrfResult,
} from "./payroll-2026";

export const SALARIO_DIAS_TRABALHADOS_DEFAULT_DIVISOR = 30;
export const SALARIO_DIAS_TRABALHADOS_SUPPORTED_TABLE_YEAR = PAYROLL_TABLE_YEAR_2026;
export const SALARIO_DIAS_TRABALHADOS_SOURCE_VERSION_2026_07_03 = {
  legalRulesAccessedAt: "2026-07-03",
  proportionalFormula: "2026-07-03",
  payrollTables: PAYROLL_SOURCE_VERSION_2026_06_20,
  inss: "2026",
  irrf: "2026",
  defaultDivisor: SALARIO_DIAS_TRABALHADOS_DEFAULT_DIVISOR,
} as const;

export type SalarioDiasTrabalhadosDivisorModo = "comercial30" | "diasDoMes" | "manual";

export interface SalarioDiasTrabalhadosInputs {
  salarioMensal: number;
  diasRemunerados: number;
  divisorModo: SalarioDiasTrabalhadosDivisorModo;
  divisorManual: number;
  mesReferencia: string;
  dataInicio: string;
  dataFim: string;
  usarPeriodo: boolean;
  outrosProventosTributaveis: number;
  outrosProventosNaoTributaveis: number;
  descontosManuais: number;
  dependentesIr: number;
  pensaoAlimenticia: number;
  calcularDescontosLegais: boolean;
  tabelaAno: typeof SALARIO_DIAS_TRABALHADOS_SUPPORTED_TABLE_YEAR;
}

export type SalarioDiasTrabalhadosBreakdownCategory =
  | "formula"
  | "proventos"
  | "descontosLegais"
  | "descontosManuais"
  | "liquido";

export type SalarioDiasTrabalhadosBreakdownId =
  | "salarioMensal"
  | "divisor"
  | "valorDia"
  | "diasRemunerados"
  | "salarioProporcionalBruto"
  | "outrosProventosTributaveis"
  | "outrosProventosNaoTributaveis"
  | "inss"
  | "irrf"
  | "descontosManuais"
  | "salarioLiquidoEstimado";

export type SalarioDiasTrabalhadosWarningCode =
  | "estimativaHolerite"
  | "divisorComercial30"
  | "outrosRendimentosCompetencia"
  | "tabelasLegais2026"
  | "fontesConsultadas2026"
  | "descontosLegaisDesativados"
  | "descontosExcedemProventos"
  | "periodoAjustadoAoMes"
  | "diasLimitadosAoDivisor"
  | "mes31ComDivisor30"
  | "mesMenorQue30Integral"
  | "fonteUrlNaoSuportada";

export interface SalarioDiasTrabalhadosBreakdownRow {
  id: SalarioDiasTrabalhadosBreakdownId;
  categoria: SalarioDiasTrabalhadosBreakdownCategory;
  valor: number;
  aplicavel: boolean;
  detalhe?: string;
  base?: number;
}

export interface SalarioDiasTrabalhadosPeriodo {
  mesReferencia: string;
  diasNoMes: number;
  dataInicioOriginal?: string;
  dataFimOriginal?: string;
  dataInicioRecortada?: string;
  dataFimRecortada?: string;
  diasCalendarioInclusivos: number;
  cobriuMesInteiro: boolean;
  periodoRecortado: boolean;
  diasLimitadosAoDivisor: boolean;
}

export interface SalarioDiasTrabalhadosDescontosLegais {
  baseInss: number;
  inss: number;
  aliquotaEfetivaInss: number;
  deducaoDependentes: number;
  baseIrrfPadrao: number;
  baseIrrfSimplificada: number;
  baseIrrfUsada: number;
  tipoBaseIrrfUsada: PayrollIrrfBaseType;
  irrfAntesReducao: number;
  reducaoIrrfMensal: number;
  irrf: number;
  aliquotaFaixaIrrf: number;
  parcelaDeduzirIrrf: number;
  versao: typeof SALARIO_DIAS_TRABALHADOS_SUPPORTED_TABLE_YEAR;
}

export interface ResultadoSalarioDiasTrabalhados {
  salarioMensal: number;
  divisorModo: SalarioDiasTrabalhadosDivisorModo;
  divisorAplicado: number;
  diasNoMes: number;
  diasRemuneradosInformados: number;
  diasRemuneradosEfetivos: number;
  percentualMes: number;
  valorDia: number;
  salarioProporcionalBruto: number;
  outrosProventosTributaveis: number;
  outrosProventosNaoTributaveis: number;
  proventosTributaveis: number;
  totalProventos: number;
  descontosLegais: SalarioDiasTrabalhadosDescontosLegais;
  baseInss: number;
  inss: number;
  deducaoDependentes: number;
  baseIrrfPadrao: number;
  baseIrrfSimplificada: number;
  baseIrrfUsada: number;
  tipoBaseIrrfUsada: PayrollIrrfBaseType;
  irrfAntesReducao: number;
  reducaoIrrfMensal: number;
  irrf: number;
  descontosManuais: number;
  totalDescontos: number;
  salarioLiquidoEstimado: number;
  aliquotaEfetivaLegal: number;
  periodo: SalarioDiasTrabalhadosPeriodo;
  inssMemo: PayrollInssResult;
  irrfMemo: PayrollIrrfResult;
  breakdown: SalarioDiasTrabalhadosBreakdownRow[];
  warnings: SalarioDiasTrabalhadosWarningCode[];
  sourceVersion: typeof SALARIO_DIAS_TRABALHADOS_SOURCE_VERSION_2026_07_03;
}

interface MonthInfo {
  year: number;
  month: number;
  start: Date;
  end: Date;
  daysInMonth: number;
}

interface PeriodCalculation {
  effectiveDays: number;
  info: SalarioDiasTrabalhadosPeriodo;
}

function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function isIntegerRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

function parseMonthReference(month: string): MonthInfo | null {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return null;

  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(monthNumber) || year < 1900 || year > 2100) return null;
  if (monthNumber < 1 || monthNumber > 12) return null;

  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 0));

  return {
    year,
    month: monthNumber,
    start,
    end,
    daysInMonth: end.getUTCDate(),
  };
}

function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }

  return date;
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function inclusiveDays(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

function getDivisorAplicado(inputs: SalarioDiasTrabalhadosInputs, monthInfo: MonthInfo): number {
  if (inputs.divisorModo === "diasDoMes") return monthInfo.daysInMonth;
  if (inputs.divisorModo === "manual") return inputs.divisorManual;
  return SALARIO_DIAS_TRABALHADOS_DEFAULT_DIVISOR;
}

function buildEmptyPeriodInfo(inputs: SalarioDiasTrabalhadosInputs, monthInfo: MonthInfo): SalarioDiasTrabalhadosPeriodo {
  return {
    mesReferencia: inputs.mesReferencia,
    diasNoMes: monthInfo.daysInMonth,
    diasCalendarioInclusivos: inputs.diasRemunerados,
    cobriuMesInteiro: false,
    periodoRecortado: false,
    diasLimitadosAoDivisor: false,
  };
}

function derivePeriodDays(
  inputs: SalarioDiasTrabalhadosInputs,
  monthInfo: MonthInfo,
  divisorAplicado: number
): PeriodCalculation {
  if (!inputs.usarPeriodo) {
    return {
      effectiveDays: inputs.diasRemunerados,
      info: buildEmptyPeriodInfo(inputs, monthInfo),
    };
  }

  const start = parseIsoDate(inputs.dataInicio);
  const end = parseIsoDate(inputs.dataFim);
  if (!start || !end) {
    return {
      effectiveDays: 0,
      info: buildEmptyPeriodInfo(inputs, monthInfo),
    };
  }

  const clippedStart = start < monthInfo.start ? monthInfo.start : start;
  const clippedEnd = end > monthInfo.end ? monthInfo.end : end;
  const hasOverlap = clippedStart <= clippedEnd;
  const calendarDays = hasOverlap ? inclusiveDays(clippedStart, clippedEnd) : 0;
  const fullMonth =
    hasOverlap &&
    clippedStart.getTime() === monthInfo.start.getTime() &&
    clippedEnd.getTime() === monthInfo.end.getTime();
  const cappedDays = fullMonth
    ? divisorAplicado
    : Math.min(calendarDays, inputs.divisorModo === "comercial30" ? SALARIO_DIAS_TRABALHADOS_DEFAULT_DIVISOR : divisorAplicado);

  return {
    effectiveDays: cappedDays,
    info: {
      mesReferencia: inputs.mesReferencia,
      diasNoMes: monthInfo.daysInMonth,
      dataInicioOriginal: inputs.dataInicio,
      dataFimOriginal: inputs.dataFim,
      dataInicioRecortada: hasOverlap ? formatIsoDate(clippedStart) : undefined,
      dataFimRecortada: hasOverlap ? formatIsoDate(clippedEnd) : undefined,
      diasCalendarioInclusivos: calendarDays,
      cobriuMesInteiro: fullMonth,
      periodoRecortado: start < monthInfo.start || end > monthInfo.end || !hasOverlap,
      diasLimitadosAoDivisor: !fullMonth && calendarDays > cappedDays,
    },
  };
}

export function getDefaultSalarioDiasTrabalhadosInputs(): SalarioDiasTrabalhadosInputs {
  return {
    salarioMensal: 3000,
    diasRemunerados: 15,
    divisorModo: "comercial30",
    divisorManual: SALARIO_DIAS_TRABALHADOS_DEFAULT_DIVISOR,
    mesReferencia: currentYearMonth(),
    dataInicio: "",
    dataFim: "",
    usarPeriodo: false,
    outrosProventosTributaveis: 0,
    outrosProventosNaoTributaveis: 0,
    descontosManuais: 0,
    dependentesIr: 0,
    pensaoAlimenticia: 0,
    calcularDescontosLegais: true,
    tabelaAno: SALARIO_DIAS_TRABALHADOS_SUPPORTED_TABLE_YEAR,
  };
}

export function getDaysInMonthForSalarioDiasTrabalhados(mesReferencia: string): number | null {
  return parseMonthReference(mesReferencia)?.daysInMonth ?? null;
}

export function validateSalarioDiasTrabalhadosInputs(inputs: SalarioDiasTrabalhadosInputs): string[] {
  const errors: string[] = [];
  const moneyFields: Array<[keyof SalarioDiasTrabalhadosInputs, number]> = [
    ["salarioMensal", inputs.salarioMensal],
    ["outrosProventosTributaveis", inputs.outrosProventosTributaveis],
    ["outrosProventosNaoTributaveis", inputs.outrosProventosNaoTributaveis],
    ["descontosManuais", inputs.descontosManuais],
    ["pensaoAlimenticia", inputs.pensaoAlimenticia],
  ];

  for (const [field, value] of moneyFields) {
    if (!isPayrollMoney(value)) errors.push(String(field));
  }

  const monthInfo = parseMonthReference(inputs.mesReferencia);
  if (!monthInfo) errors.push("mesReferencia");

  if (inputs.salarioMensal <= 0) errors.push("salarioMensalObrigatorio");
  if (!["comercial30", "diasDoMes", "manual"].includes(inputs.divisorModo)) errors.push("divisorModo");
  if (!Number.isFinite(inputs.divisorManual) || inputs.divisorManual < 1 || inputs.divisorManual > 31) {
    errors.push("divisorManual");
  }
  if (!isIntegerRange(inputs.dependentesIr, 0, 20)) errors.push("dependentesIr");
  if (inputs.tabelaAno !== SALARIO_DIAS_TRABALHADOS_SUPPORTED_TABLE_YEAR) errors.push("tabelaAno");

  if (monthInfo && !inputs.usarPeriodo) {
    const divisorAplicado = getDivisorAplicado(inputs, monthInfo);
    if (!Number.isInteger(inputs.diasRemunerados) || inputs.diasRemunerados < 0 || inputs.diasRemunerados > divisorAplicado) {
      errors.push("diasRemunerados");
    }
  }

  if (inputs.usarPeriodo) {
    const start = parseIsoDate(inputs.dataInicio);
    const end = parseIsoDate(inputs.dataFim);
    if (!start) errors.push("dataInicio");
    if (!end) errors.push("dataFim");
    if (start && end && end < start) errors.push("periodoOrdem");
  } else {
    if (inputs.dataInicio && !parseIsoDate(inputs.dataInicio)) errors.push("dataInicio");
    if (inputs.dataFim && !parseIsoDate(inputs.dataFim)) errors.push("dataFim");
  }

  return errors;
}

function buildLegalDeductions(
  inputs: SalarioDiasTrabalhadosInputs,
  proventosTributaveis: number
): SalarioDiasTrabalhadosDescontosLegais & {
  inssMemo: PayrollInssResult;
  irrfMemo: PayrollIrrfResult;
} {
  if (!inputs.calcularDescontosLegais) {
    const inssMemo = calcularInssEmpregado2026(0);
    const irrfMemo = calcularIrrfMensal2026({
      rendimentosTributaveis: 0,
      inss: 0,
      dependentes: 0,
      pensaoAlimenticia: 0,
    });

    return {
      baseInss: 0,
      inss: 0,
      aliquotaEfetivaInss: 0,
      deducaoDependentes: 0,
      baseIrrfPadrao: 0,
      baseIrrfSimplificada: 0,
      baseIrrfUsada: 0,
      tipoBaseIrrfUsada: "padrao",
      irrfAntesReducao: 0,
      reducaoIrrfMensal: 0,
      irrf: 0,
      aliquotaFaixaIrrf: 0,
      parcelaDeduzirIrrf: 0,
      versao: SALARIO_DIAS_TRABALHADOS_SUPPORTED_TABLE_YEAR,
      inssMemo,
      irrfMemo,
    };
  }

  const inssMemo = calcularInssEmpregado2026(proventosTributaveis);
  const irrfMemo = calcularIrrfMensal2026({
    rendimentosTributaveis: proventosTributaveis,
    inss: inssMemo.inss,
    dependentes: inputs.dependentesIr,
    pensaoAlimenticia: inputs.pensaoAlimenticia,
  });

  return {
    baseInss: inssMemo.baseInss,
    inss: inssMemo.inss,
    aliquotaEfetivaInss: inssMemo.aliquotaEfetivaInss,
    deducaoDependentes: irrfMemo.deducaoDependentes,
    baseIrrfPadrao: irrfMemo.baseIrrfPadrao,
    baseIrrfSimplificada: irrfMemo.baseIrrfSimplificada,
    baseIrrfUsada: irrfMemo.baseIrrfUsada,
    tipoBaseIrrfUsada: irrfMemo.tipoBaseIrrfUsada,
    irrfAntesReducao: irrfMemo.irrfAntesReducao,
    reducaoIrrfMensal: irrfMemo.reducaoIrrfMensal,
    irrf: irrfMemo.irrf,
    aliquotaFaixaIrrf: irrfMemo.aliquotaFaixa,
    parcelaDeduzirIrrf: irrfMemo.parcelaDeduzir,
    versao: SALARIO_DIAS_TRABALHADOS_SUPPORTED_TABLE_YEAR,
    inssMemo,
    irrfMemo,
  };
}

function buildWarnings(
  inputs: SalarioDiasTrabalhadosInputs,
  monthInfo: MonthInfo,
  divisorAplicado: number,
  periodo: SalarioDiasTrabalhadosPeriodo,
  totalProventos: number,
  totalDescontos: number
): SalarioDiasTrabalhadosWarningCode[] {
  const warnings: SalarioDiasTrabalhadosWarningCode[] = [
    "estimativaHolerite",
    "outrosRendimentosCompetencia",
    "fontesConsultadas2026",
  ];

  if (inputs.divisorModo === "comercial30") warnings.push("divisorComercial30");
  if (inputs.calcularDescontosLegais) warnings.push("tabelasLegais2026");
  if (!inputs.calcularDescontosLegais) warnings.push("descontosLegaisDesativados");
  if (totalDescontos > totalProventos) warnings.push("descontosExcedemProventos");
  if (periodo.periodoRecortado) warnings.push("periodoAjustadoAoMes");
  if (periodo.diasLimitadosAoDivisor) warnings.push("diasLimitadosAoDivisor");
  if (inputs.divisorModo === "comercial30" && monthInfo.daysInMonth === 31) warnings.push("mes31ComDivisor30");
  if (periodo.cobriuMesInteiro && monthInfo.daysInMonth < divisorAplicado) warnings.push("mesMenorQue30Integral");

  return [...new Set(warnings)];
}

export function calcularSalarioDiasTrabalhados(
  inputs: SalarioDiasTrabalhadosInputs
): ResultadoSalarioDiasTrabalhados {
  const validationErrors = validateSalarioDiasTrabalhadosInputs(inputs);
  if (validationErrors.length > 0) {
    throw new RangeError(`Invalid salario-dias-trabalhados inputs: ${validationErrors.join(", ")}`);
  }

  const monthInfo = parseMonthReference(inputs.mesReferencia);
  if (!monthInfo) throw new RangeError("Invalid salario-dias-trabalhados month");

  const divisorAplicado = getDivisorAplicado(inputs, monthInfo);
  const periodCalculation = derivePeriodDays(inputs, monthInfo, divisorAplicado);
  const salarioMensal = roundPayrollMoney(inputs.salarioMensal);
  const diasRemuneradosInformados = inputs.diasRemunerados;
  const diasRemuneradosEfetivos = periodCalculation.effectiveDays;
  const valorDiaRaw = salarioMensal / divisorAplicado;
  const valorDia = roundPayrollMoney(valorDiaRaw);
  const salarioProporcionalBruto = roundPayrollMoney(valorDiaRaw * diasRemuneradosEfetivos);
  const outrosProventosTributaveis = roundPayrollMoney(inputs.outrosProventosTributaveis);
  const outrosProventosNaoTributaveis = roundPayrollMoney(inputs.outrosProventosNaoTributaveis);
  const proventosTributaveis = roundPayrollMoney(salarioProporcionalBruto + outrosProventosTributaveis);
  const totalProventos = roundPayrollMoney(proventosTributaveis + outrosProventosNaoTributaveis);
  const descontosLegais = buildLegalDeductions(inputs, proventosTributaveis);
  const descontosManuais = roundPayrollMoney(inputs.descontosManuais);
  const totalDescontos = roundPayrollMoney(descontosLegais.inss + descontosLegais.irrf + descontosManuais);
  const salarioLiquidoEstimado = roundPayrollMoney(Math.max(0, totalProventos - totalDescontos));
  const aliquotaEfetivaLegal =
    proventosTributaveis > 0
      ? roundPayrollRate((descontosLegais.inss + descontosLegais.irrf) / proventosTributaveis)
      : 0;
  const percentualMes = roundPayrollRate(diasRemuneradosEfetivos / divisorAplicado);
  const warnings = buildWarnings(
    inputs,
    monthInfo,
    divisorAplicado,
    periodCalculation.info,
    totalProventos,
    totalDescontos
  );

  const breakdown: SalarioDiasTrabalhadosBreakdownRow[] = [
    {
      id: "salarioMensal",
      categoria: "formula",
      valor: salarioMensal,
      aplicavel: true,
    },
    {
      id: "divisor",
      categoria: "formula",
      valor: divisorAplicado,
      aplicavel: true,
      detalhe: inputs.divisorModo,
    },
    {
      id: "valorDia",
      categoria: "formula",
      valor: valorDia,
      aplicavel: true,
    },
    {
      id: "diasRemunerados",
      categoria: "formula",
      valor: diasRemuneradosEfetivos,
      aplicavel: true,
      detalhe: inputs.usarPeriodo ? "periodo" : "manual",
    },
    {
      id: "salarioProporcionalBruto",
      categoria: "proventos",
      valor: salarioProporcionalBruto,
      aplicavel: true,
      base: salarioMensal,
    },
    {
      id: "outrosProventosTributaveis",
      categoria: "proventos",
      valor: outrosProventosTributaveis,
      aplicavel: outrosProventosTributaveis > 0,
      base: proventosTributaveis,
    },
    {
      id: "outrosProventosNaoTributaveis",
      categoria: "proventos",
      valor: outrosProventosNaoTributaveis,
      aplicavel: outrosProventosNaoTributaveis > 0,
      base: totalProventos,
    },
    {
      id: "inss",
      categoria: "descontosLegais",
      valor: descontosLegais.inss,
      aplicavel: inputs.calcularDescontosLegais,
      base: descontosLegais.baseInss,
    },
    {
      id: "irrf",
      categoria: "descontosLegais",
      valor: descontosLegais.irrf,
      aplicavel: inputs.calcularDescontosLegais,
      base: descontosLegais.baseIrrfUsada,
      detalhe: descontosLegais.tipoBaseIrrfUsada,
    },
    {
      id: "descontosManuais",
      categoria: "descontosManuais",
      valor: descontosManuais,
      aplicavel: descontosManuais > 0,
    },
    {
      id: "salarioLiquidoEstimado",
      categoria: "liquido",
      valor: salarioLiquidoEstimado,
      aplicavel: true,
      base: totalProventos,
    },
  ];

  return {
    salarioMensal,
    divisorModo: inputs.divisorModo,
    divisorAplicado,
    diasNoMes: monthInfo.daysInMonth,
    diasRemuneradosInformados,
    diasRemuneradosEfetivos,
    percentualMes,
    valorDia,
    salarioProporcionalBruto,
    outrosProventosTributaveis,
    outrosProventosNaoTributaveis,
    proventosTributaveis,
    totalProventos,
    descontosLegais,
    baseInss: descontosLegais.baseInss,
    inss: descontosLegais.inss,
    deducaoDependentes: descontosLegais.deducaoDependentes,
    baseIrrfPadrao: descontosLegais.baseIrrfPadrao,
    baseIrrfSimplificada: descontosLegais.baseIrrfSimplificada,
    baseIrrfUsada: descontosLegais.baseIrrfUsada,
    tipoBaseIrrfUsada: descontosLegais.tipoBaseIrrfUsada,
    irrfAntesReducao: descontosLegais.irrfAntesReducao,
    reducaoIrrfMensal: descontosLegais.reducaoIrrfMensal,
    irrf: descontosLegais.irrf,
    descontosManuais,
    totalDescontos,
    salarioLiquidoEstimado,
    aliquotaEfetivaLegal,
    periodo: periodCalculation.info,
    inssMemo: descontosLegais.inssMemo,
    irrfMemo: descontosLegais.irrfMemo,
    breakdown,
    warnings,
    sourceVersion: SALARIO_DIAS_TRABALHADOS_SOURCE_VERSION_2026_07_03,
  };
}

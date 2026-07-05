export const SALARIO_POR_HORA_SOURCE_VERSION_2026_07_05 = {
  legalRulesAccessedAt: "2026-07-05",
  cltHourlyFormula: "CLT art. 64",
  constitutionWorkingTime: "Constituicao art. 7 XIII/XVI",
  divisorConvention: "jornadaSemanal * 5",
} as const;

export const SALARIO_POR_HORA_DEFAULT_WEEKLY_HOURS = 44;
export const SALARIO_POR_HORA_DEFAULT_MONTHLY_DIVISOR = 220;
export const SALARIO_POR_HORA_MONEY_MAX = 10_000_000;
export const SALARIO_POR_HORA_WEEKLY_HOURS_MAX = 60;
export const SALARIO_POR_HORA_MONTHLY_DIVISOR_MAX = 400;
export const SALARIO_POR_HORA_PERIOD_HOURS_MAX = 1_000;
export const SALARIO_POR_HORA_ADDITIONAL_PERCENT_MAX = 300;

export type SalarioPorHoraModo = "mensalParaHora" | "horaParaMensal";
export type SalarioPorHoraDivisorModo = "jornadaSemanal" | "manual";

export interface SalarioPorHoraInputs {
  modo: SalarioPorHoraModo;
  salarioMensal: number;
  valorHora: number;
  divisorModo: SalarioPorHoraDivisorModo;
  jornadaSemanal: number;
  divisorMensalManual: number;
  horasPeriodo: number;
  adicionalPercentual: number;
  mostrarAdicional: boolean;
}

export type SalarioPorHoraWarningCode =
  | "estimativaBruta"
  | "semDescontosLegais"
  | "fontesConsultadas2026"
  | "divisorManual"
  | "jornadaAcima44"
  | "categoriaEspecial"
  | "adicionalSimples"
  | "fonteUrlNaoSuportada";

export type SalarioPorHoraBreakdownCategory = "divisor" | "formula" | "periodo" | "adicional";

export type SalarioPorHoraBreakdownId =
  | "salarioMensal"
  | "valorHora"
  | "jornadaSemanal"
  | "jornadaMediaDiaria"
  | "divisorMensal"
  | "valorHoraNormal"
  | "salarioMensalEquivalente"
  | "valorPeriodo"
  | "valorDiaBase"
  | "adicionalPercentual"
  | "valorHoraComAdicional"
  | "valorPeriodoComAdicional";

export interface SalarioPorHoraBreakdownRow {
  id: SalarioPorHoraBreakdownId;
  categoria: SalarioPorHoraBreakdownCategory;
  valor: number;
  aplicavel: boolean;
  detalhe?: string;
}

export interface ResultadoSalarioPorHora {
  modo: SalarioPorHoraModo;
  divisorModo: SalarioPorHoraDivisorModo;
  salarioMensal: number;
  valorHoraInformado: number;
  jornadaSemanal: number;
  jornadaMediaDiaria: number | null;
  divisorMensal: number;
  divisorMensalManual: number;
  horasPeriodo: number;
  valorHoraNormal: number;
  salarioMensalEquivalente: number;
  valorPeriodo: number;
  valorDiaBase: number;
  adicionalPercentual: number;
  mostrarAdicional: boolean;
  valorHoraComAdicional: number;
  valorPeriodoComAdicional: number;
  breakdown: SalarioPorHoraBreakdownRow[];
  warnings: SalarioPorHoraWarningCode[];
  sourceVersion: typeof SALARIO_POR_HORA_SOURCE_VERSION_2026_07_05;
}

function roundMoney(value: number): number {
  return Math.round((value + 1e-9) * 100) / 100;
}

function roundHours(value: number): number {
  return Math.round((value + 1e-12) * 100) / 100;
}

function isMoney(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= SALARIO_POR_HORA_MONEY_MAX;
}

function isFiniteRange(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max;
}

function isModo(value: string): value is SalarioPorHoraModo {
  return value === "mensalParaHora" || value === "horaParaMensal";
}

function isDivisorModo(value: string): value is SalarioPorHoraDivisorModo {
  return value === "jornadaSemanal" || value === "manual";
}

export function getDefaultSalarioPorHoraInputs(): SalarioPorHoraInputs {
  return {
    modo: "mensalParaHora",
    salarioMensal: 3000,
    valorHora: 20,
    divisorModo: "jornadaSemanal",
    jornadaSemanal: SALARIO_POR_HORA_DEFAULT_WEEKLY_HOURS,
    divisorMensalManual: SALARIO_POR_HORA_DEFAULT_MONTHLY_DIVISOR,
    horasPeriodo: 160,
    adicionalPercentual: 50,
    mostrarAdicional: true,
  };
}

export function validateSalarioPorHoraInputs(inputs: SalarioPorHoraInputs): string[] {
  const errors: string[] = [];

  if (!isModo(inputs.modo)) errors.push("modo");
  if (!isDivisorModo(inputs.divisorModo)) errors.push("divisorModo");
  if (!isMoney(inputs.salarioMensal)) errors.push("salarioMensal");
  if (!isMoney(inputs.valorHora)) errors.push("valorHora");
  if (inputs.modo === "mensalParaHora" && inputs.salarioMensal <= 0) errors.push("salarioMensalObrigatorio");
  if (inputs.modo === "horaParaMensal" && inputs.valorHora <= 0) errors.push("valorHoraObrigatorio");
  if (!isFiniteRange(inputs.jornadaSemanal, 0.01, SALARIO_POR_HORA_WEEKLY_HOURS_MAX)) errors.push("jornadaSemanal");
  if (!isFiniteRange(inputs.divisorMensalManual, 0.01, SALARIO_POR_HORA_MONTHLY_DIVISOR_MAX)) {
    errors.push("divisorMensalManual");
  }
  if (!isFiniteRange(inputs.horasPeriodo, 0, SALARIO_POR_HORA_PERIOD_HOURS_MAX)) errors.push("horasPeriodo");
  if (!isFiniteRange(inputs.adicionalPercentual, 0, SALARIO_POR_HORA_ADDITIONAL_PERCENT_MAX)) {
    errors.push("adicionalPercentual");
  }

  return errors;
}

export function getSalarioPorHoraMonthlyDivisor(inputs: SalarioPorHoraInputs): number {
  if (inputs.divisorModo === "manual") {
    return inputs.divisorMensalManual;
  }

  return inputs.jornadaSemanal * 5;
}

function buildWarnings(inputs: SalarioPorHoraInputs): SalarioPorHoraWarningCode[] {
  const warnings: SalarioPorHoraWarningCode[] = [
    "estimativaBruta",
    "semDescontosLegais",
    "fontesConsultadas2026",
    "categoriaEspecial",
  ];

  if (inputs.divisorModo === "manual") warnings.push("divisorManual");
  if (inputs.divisorModo === "jornadaSemanal" && inputs.jornadaSemanal > SALARIO_POR_HORA_DEFAULT_WEEKLY_HOURS) {
    warnings.push("jornadaAcima44");
  }
  if (inputs.mostrarAdicional) warnings.push("adicionalSimples");

  return [...new Set(warnings)];
}

export function calcularSalarioPorHora(inputs: SalarioPorHoraInputs): ResultadoSalarioPorHora {
  const validationErrors = validateSalarioPorHoraInputs(inputs);
  if (validationErrors.length > 0) {
    throw new RangeError(`Invalid salario-por-hora inputs: ${validationErrors.join(", ")}`);
  }

  const salarioMensal = roundMoney(inputs.salarioMensal);
  const valorHoraInformado = roundMoney(inputs.valorHora);
  const divisorMensalRaw = getSalarioPorHoraMonthlyDivisor(inputs);
  const divisorMensal = roundHours(divisorMensalRaw);
  const jornadaMediaDiaria =
    inputs.divisorModo === "jornadaSemanal" ? roundHours(inputs.jornadaSemanal / 6) : null;
  const horasPeriodo = roundHours(inputs.horasPeriodo);

  const valorHoraNormalRaw =
    inputs.modo === "mensalParaHora" ? salarioMensal / divisorMensalRaw : valorHoraInformado;
  const valorHoraNormal = roundMoney(valorHoraNormalRaw);
  const salarioMensalEquivalente =
    inputs.modo === "mensalParaHora" ? salarioMensal : roundMoney(valorHoraNormalRaw * divisorMensalRaw);
  const valorPeriodo = roundMoney(valorHoraNormalRaw * horasPeriodo);
  const valorDiaBase = roundMoney(salarioMensalEquivalente / 30);
  const adicionalMultiplicador = 1 + inputs.adicionalPercentual / 100;
  const valorHoraComAdicional = roundMoney(valorHoraNormalRaw * adicionalMultiplicador);
  const valorPeriodoComAdicional = roundMoney(valorHoraNormalRaw * adicionalMultiplicador * horasPeriodo);

  const breakdown: SalarioPorHoraBreakdownRow[] = [
    {
      id: "jornadaSemanal",
      categoria: "divisor",
      valor: inputs.jornadaSemanal,
      aplicavel: inputs.divisorModo === "jornadaSemanal",
    },
    {
      id: "jornadaMediaDiaria",
      categoria: "divisor",
      valor: jornadaMediaDiaria ?? 0,
      aplicavel: inputs.divisorModo === "jornadaSemanal",
      detalhe: "clt64",
    },
    {
      id: "divisorMensal",
      categoria: "divisor",
      valor: divisorMensal,
      aplicavel: true,
      detalhe: inputs.divisorModo,
    },
    {
      id: "salarioMensal",
      categoria: "formula",
      valor: salarioMensal,
      aplicavel: inputs.modo === "mensalParaHora",
    },
    {
      id: "valorHora",
      categoria: "formula",
      valor: valorHoraInformado,
      aplicavel: inputs.modo === "horaParaMensal",
    },
    {
      id: "valorHoraNormal",
      categoria: "formula",
      valor: valorHoraNormal,
      aplicavel: true,
    },
    {
      id: "salarioMensalEquivalente",
      categoria: "formula",
      valor: salarioMensalEquivalente,
      aplicavel: true,
    },
    {
      id: "valorDiaBase",
      categoria: "formula",
      valor: valorDiaBase,
      aplicavel: true,
    },
    {
      id: "valorPeriodo",
      categoria: "periodo",
      valor: valorPeriodo,
      aplicavel: true,
      detalhe: "horasPeriodo",
    },
    {
      id: "adicionalPercentual",
      categoria: "adicional",
      valor: inputs.adicionalPercentual,
      aplicavel: inputs.mostrarAdicional,
    },
    {
      id: "valorHoraComAdicional",
      categoria: "adicional",
      valor: valorHoraComAdicional,
      aplicavel: inputs.mostrarAdicional,
    },
    {
      id: "valorPeriodoComAdicional",
      categoria: "adicional",
      valor: valorPeriodoComAdicional,
      aplicavel: inputs.mostrarAdicional,
      detalhe: "horasPeriodo",
    },
  ];

  return {
    modo: inputs.modo,
    divisorModo: inputs.divisorModo,
    salarioMensal,
    valorHoraInformado,
    jornadaSemanal: inputs.jornadaSemanal,
    jornadaMediaDiaria,
    divisorMensal,
    divisorMensalManual: inputs.divisorMensalManual,
    horasPeriodo,
    valorHoraNormal,
    salarioMensalEquivalente,
    valorPeriodo,
    valorDiaBase,
    adicionalPercentual: inputs.adicionalPercentual,
    mostrarAdicional: inputs.mostrarAdicional,
    valorHoraComAdicional,
    valorPeriodoComAdicional,
    breakdown,
    warnings: buildWarnings(inputs),
    sourceVersion: SALARIO_POR_HORA_SOURCE_VERSION_2026_07_05,
  };
}

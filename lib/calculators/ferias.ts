function roundMoney(value: number): number {
  return Math.round((value + 1e-9) * 100) / 100;
}

export type ModoFerias = "gozo" | "proporcional" | "vencidas";

export type FeriasBreakdownCategory = "recibo" | "desconto" | "fluxoSeparado";

export type FeriasBreakdownId =
  | "feriasGozadas"
  | "tercoFeriasGozadas"
  | "abonoPecuniario"
  | "tercoAbono"
  | "feriasProporcionais"
  | "tercoProporcional"
  | "feriasVencidas"
  | "tercoVencidas"
  | "dobroFerias"
  | "outrosAcrescimos"
  | "inss"
  | "irrf"
  | "outrosDescontos"
  | "salarioDiasVendidos";

export type FeriasWarningCode =
  | "abonoSeparado"
  | "proporcionalEstimado"
  | "vencidasEstimado"
  | "dobroConservador"
  | "periodoUltrapassaLimite"
  | "deducoesSomenteGozo"
  | "deducoesDesativadas"
  | "tabelasLegais2026"
  | "semDireitoFerias";

export type FeriasAbsenceBracketCode = "ate5" | "de6a14" | "de15a23" | "de24a32" | "maisDe32";

export interface InputsFerias {
  salarioMensal: number;
  mediaVariavelMensal: number;
  modo: ModoFerias;
  dataInicioPeriodoAquisitivo: string;
  dataReferencia: string;
  dataInicioFerias: string;
  faltasInjustificadas: number;
  diasFerias: number;
  converterAbono: boolean;
  diasAbono: number;
  incluirSalarioDiasVendidos: boolean;
  dependentesIr: number;
  pensaoAlimenticia: number;
  outrosDescontos: number;
  outrosAcrescimos: number;
  calcularDescontosLegais: boolean;
}

export interface FeriasEntitlement {
  bracket: FeriasAbsenceBracketCode;
  faltasMin: number;
  faltasMax: number | null;
  diasDireito: number;
  diasAbonoMax: number;
}

export interface FeriasBreakdownRow {
  id: FeriasBreakdownId;
  categoria: FeriasBreakdownCategory;
  valor: number;
  aplicavel: boolean;
  dias?: number;
  base?: number;
  detalhe?: string;
}

export interface FeriasDescontosLegais {
  inss: number;
  irrf: number;
  total: number;
  baseInssFerias: number;
  baseIrrfFerias: number;
  baseIrrfPadrao: number;
  baseIrrfSimplificada: number;
  baseIrrfUsada: number;
  versao: "2026";
}

export interface FeriasStatusPeriodo {
  dataFimAquisitivo: string;
  dataLimiteConcessivo: string;
  dataFimFerias: string | null;
  emDobro: boolean;
  periodoUltrapassaLimite: boolean;
}

export interface ResultadoFerias {
  remuneracaoBase: number;
  valorDia: number;
  modo: ModoFerias;
  entitlement: FeriasEntitlement;
  diasGozados: number;
  diasAbono: number;
  avosProporcionais: number;
  statusPeriodo: FeriasStatusPeriodo;
  feriasGozadas: number;
  tercoFeriasGozadas: number;
  abonoPecuniario: number;
  tercoAbono: number;
  feriasProporcionais: number;
  tercoProporcional: number;
  feriasVencidas: number;
  tercoVencidas: number;
  adicionalDobro: number;
  totalTercoConstitucional: number;
  brutoReciboFerias: number;
  salarioDiasVendidos: number;
  fluxoCaixaBrutoComDiasVendidos: number;
  descontosLegais: FeriasDescontosLegais;
  totalDescontos: number;
  liquidoReciboFerias: number;
  breakdown: FeriasBreakdownRow[];
  warnings: FeriasWarningCode[];
  sourceVersion: typeof FERIAS_SOURCE_VERSION_2026_06_07;
}

export const FERIAS_SOURCE_VERSION_2026_06_07 = {
  label: "CLT/Constituicao e tabelas INSS/IRRF 2026 consultadas em 2026-06-07",
  inss: "2026",
  irrf: "2026",
  accessedAt: "2026-06-07",
} as const;

export const FERIAS_MONEY_MAX = 10_000_000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const FERIAS_INSS_EMPREGADO_2026 = [
  { limit: 1621.0, rate: 0.075 },
  { limit: 2902.84, rate: 0.09 },
  { limit: 4354.27, rate: 0.12 },
  { limit: 8475.55, rate: 0.14 },
] as const;

export const FERIAS_IRRF_MENSAL_2026 = [
  { limit: 2428.8, rate: 0, deduction: 0 },
  { limit: 2826.65, rate: 0.075, deduction: 182.16 },
  { limit: 3751.05, rate: 0.15, deduction: 394.16 },
  { limit: 4664.68, rate: 0.225, deduction: 675.49 },
  { limit: Infinity, rate: 0.275, deduction: 908.73 },
] as const;

export const FERIAS_IRRF_2026_DEPENDENT_DEDUCTION = 189.59;
export const FERIAS_IRRF_2026_SIMPLIFIED_DISCOUNT_LIMIT = 607.2;
export const FERIAS_IRRF_2026_MONTHLY_REDUCTION_TABLE = {
  zeroTaxableEarningsLimit: 5_000,
  phaseOutTaxableEarningsLimit: 7_350,
  phaseOutFixedReduction: 978.62,
  phaseOutRate: 0.133145,
} as const;

interface LocalDate {
  year: number;
  month: number;
  day: number;
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

export function formatIsoDateFromDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dateToIso(date: LocalDate): string {
  return `${date.year}-${pad(date.month)}-${pad(date.day)}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function parseFeriasIsoDate(value: string): LocalDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;

  return { year, month, day };
}

function parseDateOrThrow(value: string, field: string): LocalDate {
  const parsed = parseFeriasIsoDate(value);
  if (!parsed) {
    throw new RangeError(`Invalid date for ${field}`);
  }
  return parsed;
}

function toEpochDay(date: LocalDate): number {
  return Math.floor(Date.UTC(date.year, date.month - 1, date.day) / MS_PER_DAY);
}

function fromEpochDay(epochDay: number): LocalDate {
  const date = new Date(epochDay * MS_PER_DAY);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function compareDates(a: LocalDate, b: LocalDate): number {
  return toEpochDay(a) - toEpochDay(b);
}

function minDate(a: LocalDate, b: LocalDate): LocalDate {
  return compareDates(a, b) <= 0 ? a : b;
}

function maxDate(a: LocalDate, b: LocalDate): LocalDate {
  return compareDates(a, b) >= 0 ? a : b;
}

function addDays(date: LocalDate, days: number): LocalDate {
  return fromEpochDay(toEpochDay(date) + days);
}

export function addMonthsToFeriasDate(date: LocalDate, months: number): LocalDate {
  const totalMonths = date.year * 12 + (date.month - 1) + months;
  const year = Math.floor(totalMonths / 12);
  const month = totalMonths - year * 12 + 1;
  return {
    year,
    month,
    day: Math.min(date.day, daysInMonth(year, month)),
  };
}

function isMoney(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= FERIAS_MONEY_MAX;
}

function isIntegerRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

export function getDefaultFeriasInputs(today = new Date()): InputsFerias {
  const todayIso = formatIsoDateFromDate(today);
  const acquisitionStart = addMonthsToFeriasDate(
    { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() },
    -12
  );
  const vacationStart = addDays(
    { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() },
    30
  );

  return {
    salarioMensal: 3000,
    mediaVariavelMensal: 0,
    modo: "gozo",
    dataInicioPeriodoAquisitivo: dateToIso(acquisitionStart),
    dataReferencia: todayIso,
    dataInicioFerias: dateToIso(vacationStart),
    faltasInjustificadas: 0,
    diasFerias: 30,
    converterAbono: false,
    diasAbono: 0,
    incluirSalarioDiasVendidos: true,
    dependentesIr: 0,
    pensaoAlimenticia: 0,
    outrosDescontos: 0,
    outrosAcrescimos: 0,
    calcularDescontosLegais: true,
  };
}

export function getFeriasEntitlement(faltasInjustificadas: number): FeriasEntitlement {
  if (!Number.isInteger(faltasInjustificadas) || faltasInjustificadas < 0) {
    throw new RangeError("Invalid faltasInjustificadas");
  }

  if (faltasInjustificadas <= 5) {
    return { bracket: "ate5", faltasMin: 0, faltasMax: 5, diasDireito: 30, diasAbonoMax: 10 };
  }
  if (faltasInjustificadas <= 14) {
    return { bracket: "de6a14", faltasMin: 6, faltasMax: 14, diasDireito: 24, diasAbonoMax: 8 };
  }
  if (faltasInjustificadas <= 23) {
    return { bracket: "de15a23", faltasMin: 15, faltasMax: 23, diasDireito: 18, diasAbonoMax: 6 };
  }
  if (faltasInjustificadas <= 32) {
    return { bracket: "de24a32", faltasMin: 24, faltasMax: 32, diasDireito: 12, diasAbonoMax: 4 };
  }

  return { bracket: "maisDe32", faltasMin: 33, faltasMax: null, diasDireito: 0, diasAbonoMax: 0 };
}

function countMonthsWithAtLeast15Days(start: LocalDate, end: LocalDate): number {
  if (compareDates(end, start) < 0) return 0;

  let count = 0;
  let year = start.year;
  let month = start.month;

  while (year < end.year || (year === end.year && month <= end.month)) {
    const monthStart: LocalDate = { year, month, day: 1 };
    const monthEnd: LocalDate = { year, month, day: daysInMonth(year, month) };
    const overlapStart = maxDate(start, monthStart);
    const overlapEnd = minDate(end, monthEnd);

    if (compareDates(overlapEnd, overlapStart) >= 0) {
      const days = toEpochDay(overlapEnd) - toEpochDay(overlapStart) + 1;
      if (days >= 15) count += 1;
    }

    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return count;
}

export function contarAvosFeriasProporcionais(dataInicioPeriodoAquisitivo: string, dataReferencia: string): number {
  const inicio = parseDateOrThrow(dataInicioPeriodoAquisitivo, "dataInicioPeriodoAquisitivo");
  const referencia = parseDateOrThrow(dataReferencia, "dataReferencia");
  const fimAquisitivo = addDays(addMonthsToFeriasDate(inicio, 12), -1);
  const fimContagem = minDate(referencia, fimAquisitivo);

  return Math.min(12, countMonthsWithAtLeast15Days(inicio, fimContagem));
}

export function calcularInssFerias2026(base: number): number {
  const cappedBase = Math.max(
    0,
    Math.min(base, FERIAS_INSS_EMPREGADO_2026[FERIAS_INSS_EMPREGADO_2026.length - 1].limit)
  );
  let previousLimit = 0;
  let contribution = 0;

  for (const bracket of FERIAS_INSS_EMPREGADO_2026) {
    if (cappedBase <= previousLimit) break;
    const taxable = Math.min(cappedBase, bracket.limit) - previousLimit;
    contribution += taxable * bracket.rate;
    previousLimit = bracket.limit;
  }

  return roundMoney(contribution);
}

export function calcularReducaoMensalIrrfFerias2026(
  rendimentosTributaveisMensais: number,
  impostoAntesReducao: number
): number {
  const rendimentos = Math.max(0, rendimentosTributaveisMensais);
  const imposto = Math.max(0, impostoAntesReducao);

  if (rendimentos <= FERIAS_IRRF_2026_MONTHLY_REDUCTION_TABLE.zeroTaxableEarningsLimit) {
    return roundMoney(imposto);
  }

  if (rendimentos <= FERIAS_IRRF_2026_MONTHLY_REDUCTION_TABLE.phaseOutTaxableEarningsLimit) {
    const reducao =
      FERIAS_IRRF_2026_MONTHLY_REDUCTION_TABLE.phaseOutFixedReduction -
      FERIAS_IRRF_2026_MONTHLY_REDUCTION_TABLE.phaseOutRate * rendimentos;
    return roundMoney(Math.min(imposto, Math.max(0, reducao)));
  }

  return 0;
}

function calcularIrrfFerias2026Details(
  baseBruta: number,
  inss: number,
  dependentes: number,
  pensaoAlimenticia: number
): Pick<FeriasDescontosLegais, "irrf" | "baseIrrfFerias" | "baseIrrfPadrao" | "baseIrrfSimplificada" | "baseIrrfUsada"> {
  if (baseBruta <= 0) {
    return {
      irrf: 0,
      baseIrrfFerias: 0,
      baseIrrfPadrao: 0,
      baseIrrfSimplificada: 0,
      baseIrrfUsada: 0,
    };
  }

  const deducaoDependentes = Math.max(0, dependentes) * FERIAS_IRRF_2026_DEPENDENT_DEDUCTION;
  const basePadrao = Math.max(0, baseBruta - inss - deducaoDependentes - Math.max(0, pensaoAlimenticia));
  const baseSimplificada = Math.max(0, baseBruta - FERIAS_IRRF_2026_SIMPLIFIED_DISCOUNT_LIMIT);
  const baseCalculo = Math.min(basePadrao, baseSimplificada);
  const bracket = FERIAS_IRRF_MENSAL_2026.find((entry) => baseCalculo <= entry.limit) ?? FERIAS_IRRF_MENSAL_2026[0];
  const impostoAntesReducao = Math.max(0, baseCalculo * bracket.rate - bracket.deduction);
  const reducaoMensal = calcularReducaoMensalIrrfFerias2026(baseBruta, impostoAntesReducao);

  return {
    irrf: roundMoney(Math.max(0, impostoAntesReducao - reducaoMensal)),
    baseIrrfFerias: roundMoney(baseBruta),
    baseIrrfPadrao: roundMoney(basePadrao),
    baseIrrfSimplificada: roundMoney(baseSimplificada),
    baseIrrfUsada: roundMoney(baseCalculo),
  };
}

export function calcularIrrfFerias2026(
  baseBruta: number,
  inss: number,
  dependentes: number,
  pensaoAlimenticia = 0
): number {
  return calcularIrrfFerias2026Details(baseBruta, inss, dependentes, pensaoAlimenticia).irrf;
}

export function validateFeriasInputs(inputs: InputsFerias): string[] {
  const errors: string[] = [];
  const moneyFields: Array<[keyof InputsFerias, number]> = [
    ["salarioMensal", inputs.salarioMensal],
    ["mediaVariavelMensal", inputs.mediaVariavelMensal],
    ["pensaoAlimenticia", inputs.pensaoAlimenticia],
    ["outrosDescontos", inputs.outrosDescontos],
    ["outrosAcrescimos", inputs.outrosAcrescimos],
  ];

  for (const [field, value] of moneyFields) {
    if (!isMoney(value)) errors.push(String(field));
  }

  if (inputs.salarioMensal <= 0) errors.push("salarioMensal");
  if (!["gozo", "proporcional", "vencidas"].includes(inputs.modo)) errors.push("modo");

  const inicio = parseFeriasIsoDate(inputs.dataInicioPeriodoAquisitivo);
  const referencia = parseFeriasIsoDate(inputs.dataReferencia);
  const inicioFerias = parseFeriasIsoDate(inputs.dataInicioFerias);
  if (!inicio) errors.push("dataInicioPeriodoAquisitivo");
  if (!referencia) errors.push("dataReferencia");
  if (!inicioFerias) errors.push("dataInicioFerias");

  if (inicio && referencia && compareDates(referencia, inicio) < 0) errors.push("dataReferenciaPeriodo");
  if (inicio && inicioFerias && compareDates(inicioFerias, inicio) < 0) errors.push("dataInicioFeriasPeriodo");

  if (!isIntegerRange(inputs.faltasInjustificadas, 0, 33)) errors.push("faltasInjustificadas");
  if (!isIntegerRange(inputs.dependentesIr, 0, 20)) errors.push("dependentesIr");

  if (errors.includes("faltasInjustificadas")) return errors;

  const entitlement = getFeriasEntitlement(inputs.faltasInjustificadas);
  const diasAbonoMax = entitlement.diasAbonoMax;
  const diasAbono = inputs.converterAbono ? inputs.diasAbono : 0;

  if (!isIntegerRange(inputs.diasAbono, 0, diasAbonoMax)) errors.push("diasAbono");
  if (!inputs.converterAbono && inputs.diasAbono > 0) errors.push("diasAbono");
  if (!isIntegerRange(inputs.diasFerias, 0, Math.max(0, entitlement.diasDireito - diasAbono))) {
    errors.push("diasFerias");
  }
  if (inputs.modo !== "gozo" && (inputs.converterAbono || inputs.diasAbono > 0)) {
    errors.push("converterAbono");
  }
  if (entitlement.diasDireito === 0 && (inputs.diasFerias > 0 || inputs.diasAbono > 0)) {
    errors.push("semDireitoFerias");
  }

  return errors;
}

function getStatusPeriodo(inputs: InputsFerias, entitlement: FeriasEntitlement): FeriasStatusPeriodo {
  const inicio = parseDateOrThrow(inputs.dataInicioPeriodoAquisitivo, "dataInicioPeriodoAquisitivo");
  const inicioFerias = parseDateOrThrow(inputs.dataInicioFerias, "dataInicioFerias");
  const fimAquisitivo = addDays(addMonthsToFeriasDate(inicio, 12), -1);
  const limiteConcessivo = addMonthsToFeriasDate(fimAquisitivo, 12);
  const diasPeriodo = inputs.modo === "vencidas" ? entitlement.diasDireito : inputs.diasFerias;
  const fimFerias = diasPeriodo > 0 ? addDays(inicioFerias, diasPeriodo - 1) : null;
  const inicioAposLimite = compareDates(inicioFerias, limiteConcessivo) > 0;
  const periodoUltrapassaLimite =
    Boolean(fimFerias) && compareDates(inicioFerias, limiteConcessivo) <= 0 && compareDates(fimFerias!, limiteConcessivo) > 0;

  return {
    dataFimAquisitivo: dateToIso(fimAquisitivo),
    dataLimiteConcessivo: dateToIso(limiteConcessivo),
    dataFimFerias: fimFerias ? dateToIso(fimFerias) : null,
    emDobro: inputs.modo === "vencidas" && (inicioAposLimite || periodoUltrapassaLimite),
    periodoUltrapassaLimite: inputs.modo === "vencidas" && periodoUltrapassaLimite,
  };
}

function buildDescontos(inputs: InputsFerias, baseInssFerias: number): FeriasDescontosLegais {
  if (!inputs.calcularDescontosLegais || inputs.modo !== "gozo") {
    return {
      inss: 0,
      irrf: 0,
      total: 0,
      baseInssFerias: roundMoney(baseInssFerias),
      baseIrrfFerias: roundMoney(baseInssFerias),
      baseIrrfPadrao: 0,
      baseIrrfSimplificada: 0,
      baseIrrfUsada: 0,
      versao: "2026",
    };
  }

  const inss = calcularInssFerias2026(baseInssFerias);
  const irrfDetails = calcularIrrfFerias2026Details(
    baseInssFerias,
    inss,
    inputs.dependentesIr,
    inputs.pensaoAlimenticia
  );
  const irrf = irrfDetails.irrf;

  return {
    inss,
    total: roundMoney(inss + irrf),
    baseInssFerias: roundMoney(baseInssFerias),
    ...irrfDetails,
    versao: "2026",
  };
}

export function calcularFerias(inputs: InputsFerias): ResultadoFerias {
  const errors = validateFeriasInputs(inputs);
  if (errors.length > 0) {
    throw new RangeError(`Invalid ferias inputs: ${errors.join(", ")}`);
  }

  const entitlement = getFeriasEntitlement(inputs.faltasInjustificadas);
  const remuneracaoBase = roundMoney(inputs.salarioMensal + inputs.mediaVariavelMensal);
  const valorDia = remuneracaoBase / 30;
  const diasAbono = inputs.modo === "gozo" && inputs.converterAbono ? inputs.diasAbono : 0;
  const diasGozados = inputs.modo === "gozo" ? inputs.diasFerias : 0;
  const statusPeriodo = getStatusPeriodo(inputs, entitlement);
  const avosProporcionais =
    inputs.modo === "proporcional"
      ? contarAvosFeriasProporcionais(inputs.dataInicioPeriodoAquisitivo, inputs.dataReferencia)
      : 0;

  const feriasGozadas = inputs.modo === "gozo" ? roundMoney(valorDia * diasGozados) : 0;
  const tercoFeriasGozadas = roundMoney(feriasGozadas / 3);
  const abonoPecuniario = inputs.modo === "gozo" ? roundMoney(valorDia * diasAbono) : 0;
  const tercoAbono = roundMoney(abonoPecuniario / 3);

  const proporcaoFaltas = entitlement.diasDireito / 30;
  const feriasProporcionais =
    inputs.modo === "proporcional" ? roundMoney((remuneracaoBase * avosProporcionais * proporcaoFaltas) / 12) : 0;
  const tercoProporcional = roundMoney(feriasProporcionais / 3);

  const feriasVencidas = inputs.modo === "vencidas" ? roundMoney(valorDia * entitlement.diasDireito) : 0;
  const tercoVencidas = roundMoney(feriasVencidas / 3);
  const baseVencidas = roundMoney(feriasVencidas + tercoVencidas);
  const adicionalDobro = inputs.modo === "vencidas" && statusPeriodo.emDobro ? baseVencidas : 0;

  const totalTercoConstitucional = roundMoney(tercoFeriasGozadas + tercoAbono + tercoProporcional + tercoVencidas);
  const brutoSemAjustes = roundMoney(
    feriasGozadas +
      tercoFeriasGozadas +
      abonoPecuniario +
      tercoAbono +
      feriasProporcionais +
      tercoProporcional +
      feriasVencidas +
      tercoVencidas +
      adicionalDobro
  );
  const brutoReciboFerias = roundMoney(brutoSemAjustes + inputs.outrosAcrescimos);
  const salarioDiasVendidos =
    inputs.modo === "gozo" && inputs.incluirSalarioDiasVendidos ? roundMoney(valorDia * diasAbono) : 0;
  const fluxoCaixaBrutoComDiasVendidos = roundMoney(brutoReciboFerias + salarioDiasVendidos);

  const baseInssFerias = roundMoney(feriasGozadas + tercoFeriasGozadas);
  const descontosLegais = buildDescontos(inputs, baseInssFerias);
  const totalDescontos = roundMoney(descontosLegais.total + inputs.outrosDescontos);
  const liquidoReciboFerias = roundMoney(brutoReciboFerias - totalDescontos);

  const breakdown: FeriasBreakdownRow[] = [];
  if (inputs.modo === "gozo") {
    breakdown.push(
      { id: "feriasGozadas", categoria: "recibo", valor: feriasGozadas, aplicavel: true, dias: diasGozados, base: remuneracaoBase },
      { id: "tercoFeriasGozadas", categoria: "recibo", valor: tercoFeriasGozadas, aplicavel: true, base: feriasGozadas }
    );
    if (diasAbono > 0) {
      breakdown.push(
        { id: "abonoPecuniario", categoria: "recibo", valor: abonoPecuniario, aplicavel: true, dias: diasAbono, base: remuneracaoBase },
        { id: "tercoAbono", categoria: "recibo", valor: tercoAbono, aplicavel: true, base: abonoPecuniario }
      );
    }
  }
  if (inputs.modo === "proporcional") {
    breakdown.push(
      {
        id: "feriasProporcionais",
        categoria: "recibo",
        valor: feriasProporcionais,
        aplicavel: true,
        detalhe: `${avosProporcionais}/12`,
        base: remuneracaoBase,
      },
      { id: "tercoProporcional", categoria: "recibo", valor: tercoProporcional, aplicavel: true, base: feriasProporcionais }
    );
  }
  if (inputs.modo === "vencidas") {
    breakdown.push(
      { id: "feriasVencidas", categoria: "recibo", valor: feriasVencidas, aplicavel: true, dias: entitlement.diasDireito, base: remuneracaoBase },
      { id: "tercoVencidas", categoria: "recibo", valor: tercoVencidas, aplicavel: true, base: feriasVencidas }
    );
    if (adicionalDobro > 0) {
      breakdown.push({ id: "dobroFerias", categoria: "recibo", valor: adicionalDobro, aplicavel: true, base: baseVencidas });
    }
  }
  if (inputs.outrosAcrescimos > 0) {
    breakdown.push({ id: "outrosAcrescimos", categoria: "recibo", valor: roundMoney(inputs.outrosAcrescimos), aplicavel: true });
  }
  if (descontosLegais.inss > 0) {
    breakdown.push({ id: "inss", categoria: "desconto", valor: descontosLegais.inss, aplicavel: true, base: descontosLegais.baseInssFerias });
  }
  if (descontosLegais.irrf > 0) {
    breakdown.push({ id: "irrf", categoria: "desconto", valor: descontosLegais.irrf, aplicavel: true, base: descontosLegais.baseIrrfUsada });
  }
  if (inputs.outrosDescontos > 0) {
    breakdown.push({ id: "outrosDescontos", categoria: "desconto", valor: roundMoney(inputs.outrosDescontos), aplicavel: true });
  }
  if (salarioDiasVendidos > 0) {
    breakdown.push({
      id: "salarioDiasVendidos",
      categoria: "fluxoSeparado",
      valor: salarioDiasVendidos,
      aplicavel: true,
      dias: diasAbono,
      base: remuneracaoBase,
    });
  }

  const warnings = new Set<FeriasWarningCode>();
  if (diasAbono > 0) warnings.add("abonoSeparado");
  if (inputs.modo === "proporcional") warnings.add("proporcionalEstimado");
  if (inputs.modo === "vencidas") warnings.add("vencidasEstimado");
  if (statusPeriodo.periodoUltrapassaLimite) warnings.add("periodoUltrapassaLimite");
  if (statusPeriodo.emDobro) warnings.add("dobroConservador");
  if (inputs.calcularDescontosLegais && inputs.modo === "gozo") warnings.add("tabelasLegais2026");
  if (inputs.calcularDescontosLegais && inputs.modo !== "gozo") warnings.add("deducoesSomenteGozo");
  if (!inputs.calcularDescontosLegais) warnings.add("deducoesDesativadas");
  if (entitlement.diasDireito === 0) warnings.add("semDireitoFerias");

  return {
    remuneracaoBase,
    valorDia: roundMoney(valorDia),
    modo: inputs.modo,
    entitlement,
    diasGozados,
    diasAbono,
    avosProporcionais,
    statusPeriodo,
    feriasGozadas,
    tercoFeriasGozadas,
    abonoPecuniario,
    tercoAbono,
    feriasProporcionais,
    tercoProporcional,
    feriasVencidas,
    tercoVencidas,
    adicionalDobro,
    totalTercoConstitucional,
    brutoReciboFerias,
    salarioDiasVendidos,
    fluxoCaixaBrutoComDiasVendidos,
    descontosLegais,
    totalDescontos,
    liquidoReciboFerias,
    breakdown,
    warnings: Array.from(warnings),
    sourceVersion: FERIAS_SOURCE_VERSION_2026_06_07,
  };
}

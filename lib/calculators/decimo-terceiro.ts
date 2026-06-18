function roundMoney(value: number): number {
  return Math.round((value + 1e-9) * 100) / 100;
}

export type ModoDecimoTerceiro = "projecaoAnual" | "proporcionalAteData";

export type DecimoTerceiroBreakdownCategory = "base" | "parcelas" | "descontos" | "liquido";

export type DecimoTerceiroBreakdownId =
  | "remuneracaoBase"
  | "avos"
  | "decimoBruto"
  | "primeiraParcela"
  | "adiantamento"
  | "segundaParcelaBruta"
  | "inss"
  | "irrf"
  | "outrosDescontos"
  | "outrosAcrescimos"
  | "liquidoEstimado";

export type DecimoTerceiroWarningCode =
  | "tabelasLegais2026"
  | "anoSemDescontosAutomaticos"
  | "adiantamentoLimitado"
  | "mediaVariavelEstimativa"
  | "descontosLegaisDesativados"
  | "fontesConsultadas2026";

export interface InputsDecimoTerceiro {
  salarioMensal: number;
  mediaVariavelMensal: number;
  anoReferencia: number;
  dataAdmissao: string;
  dataReferencia: string;
  modoCalculo: ModoDecimoTerceiro;
  adiantamentoJaRecebido: number;
  calcularPrimeiraParcela: boolean;
  dependentesIr: number;
  pensaoAlimenticia: number;
  outrosDescontos: number;
  outrosAcrescimos: number;
  calcularDescontosLegais: boolean;
}

export interface DecimoTerceiroMonthMemoRow {
  month: number;
  monthStart: string;
  monthEnd: string;
  overlapStart: string | null;
  overlapEnd: string | null;
  daysConsidered: number;
  counted: boolean;
}

export interface DecimoTerceiroBreakdownRow {
  id: DecimoTerceiroBreakdownId;
  categoria: DecimoTerceiroBreakdownCategory;
  valor: number;
  aplicavel: boolean;
  detalhe?: string;
  base?: number;
}

export interface DecimoTerceiroDescontosLegais {
  inssDecimoTerceiro: number;
  irrfDecimoTerceiro: number;
  total: number;
  baseInssDecimoTerceiro: number;
  baseIrrfPadrao: number;
  baseIrrfSimplificada: number;
  baseIrrfUsada: number;
  reducaoMensal: number;
  versao: typeof DECIMO_TERCEIRO_SUPPORTED_LEGAL_TABLE_YEAR;
}

export interface ResultadoDecimoTerceiro {
  remuneracaoBase: number;
  avos: number;
  decimoBruto: number;
  primeiraParcelaEstimada: number;
  adiantamentoAplicado: number;
  adiantamentoExcedente: number;
  segundaParcelaBrutaAntesDescontos: number;
  descontosLegais: DecimoTerceiroDescontosLegais;
  inssDecimoTerceiro: number;
  irrfDecimoTerceiro: number;
  outrosDescontos: number;
  outrosAcrescimos: number;
  liquidoEstimado: number;
  monthMemo: DecimoTerceiroMonthMemoRow[];
  breakdown: DecimoTerceiroBreakdownRow[];
  warnings: DecimoTerceiroWarningCode[];
  sourceVersion: typeof DECIMO_TERCEIRO_SOURCE_VERSION_2026_06_18;
}

export const DECIMO_TERCEIRO_SUPPORTED_LEGAL_TABLE_YEAR = "2026";

export const DECIMO_TERCEIRO_SOURCE_VERSION_2026_06_18 = {
  legalRulesAccessedAt: "2026-06-18",
  inss: "2026",
  irrf: "2026",
  inssEffectiveFrom: "2026-01",
  irrfEffectiveFrom: "2026-01",
} as const;

export const DECIMO_TERCEIRO_MONEY_MAX = 10_000_000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const DECIMO_TERCEIRO_INSS_EMPREGADO_2026 = [
  { limit: 1621.0, rate: 0.075 },
  { limit: 2902.84, rate: 0.09 },
  { limit: 4354.27, rate: 0.12 },
  { limit: 8475.55, rate: 0.14 },
] as const;

export const DECIMO_TERCEIRO_IRRF_MENSAL_2026 = [
  { limit: 2428.8, rate: 0, deduction: 0 },
  { limit: 2826.65, rate: 0.075, deduction: 182.16 },
  { limit: 3751.05, rate: 0.15, deduction: 394.16 },
  { limit: 4664.68, rate: 0.225, deduction: 675.49 },
  { limit: Infinity, rate: 0.275, deduction: 908.73 },
] as const;

export const DECIMO_TERCEIRO_IRRF_2026_DEPENDENT_DEDUCTION = 189.59;
export const DECIMO_TERCEIRO_IRRF_2026_SIMPLIFIED_DISCOUNT_LIMIT = 607.2;
export const DECIMO_TERCEIRO_IRRF_2026_MONTHLY_REDUCTION_TABLE = {
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

export function formatDecimoTerceiroIsoDateFromDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dateToIso(date: LocalDate): string {
  return `${date.year}-${pad(date.month)}-${pad(date.day)}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function parseDecimoTerceiroIsoDate(value: string): LocalDate | null {
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
  const parsed = parseDecimoTerceiroIsoDate(value);
  if (!parsed) {
    throw new RangeError(`Invalid date for ${field}`);
  }
  return parsed;
}

function toEpochDay(date: LocalDate): number {
  return Math.floor(Date.UTC(date.year, date.month - 1, date.day) / MS_PER_DAY);
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

function isMoney(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= DECIMO_TERCEIRO_MONEY_MAX;
}

function isIntegerRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

export function isSupportedDecimoTerceiroLegalTableYear(year: number): boolean {
  return year.toString() === DECIMO_TERCEIRO_SUPPORTED_LEGAL_TABLE_YEAR;
}

export function getDefaultDecimoTerceiroInputs(today = new Date()): InputsDecimoTerceiro {
  const year = today.getFullYear();

  return {
    salarioMensal: 3000,
    mediaVariavelMensal: 0,
    anoReferencia: year,
    dataAdmissao: `${year}-01-01`,
    dataReferencia: `${year}-12-31`,
    modoCalculo: "projecaoAnual",
    adiantamentoJaRecebido: 0,
    calcularPrimeiraParcela: true,
    dependentesIr: 0,
    pensaoAlimenticia: 0,
    outrosDescontos: 0,
    outrosAcrescimos: 0,
    calcularDescontosLegais: true,
  };
}

export function validateDecimoTerceiroInputs(inputs: InputsDecimoTerceiro): string[] {
  const errors: string[] = [];
  const moneyFields: Array<[keyof InputsDecimoTerceiro, number]> = [
    ["salarioMensal", inputs.salarioMensal],
    ["mediaVariavelMensal", inputs.mediaVariavelMensal],
    ["adiantamentoJaRecebido", inputs.adiantamentoJaRecebido],
    ["pensaoAlimenticia", inputs.pensaoAlimenticia],
    ["outrosDescontos", inputs.outrosDescontos],
    ["outrosAcrescimos", inputs.outrosAcrescimos],
  ];

  for (const [field, value] of moneyFields) {
    if (!isMoney(value)) errors.push(String(field));
  }

  if (inputs.salarioMensal <= 0) errors.push("salarioMensal");
  if (!isIntegerRange(inputs.anoReferencia, 1900, 9999)) errors.push("anoReferencia");
  if (!["projecaoAnual", "proporcionalAteData"].includes(inputs.modoCalculo)) errors.push("modoCalculo");
  if (!isIntegerRange(inputs.dependentesIr, 0, 20)) errors.push("dependentesIr");

  const dataAdmissao = parseDecimoTerceiroIsoDate(inputs.dataAdmissao);
  const dataReferencia = parseDecimoTerceiroIsoDate(inputs.dataReferencia);
  if (!dataAdmissao) errors.push("dataAdmissao");
  if (!dataReferencia) errors.push("dataReferencia");

  if (dataAdmissao && dataReferencia && compareDates(dataAdmissao, dataReferencia) > 0) {
    errors.push("periodoContrato");
  }
  if (dataReferencia && dataReferencia.year !== inputs.anoReferencia) {
    errors.push("dataReferenciaAno");
  }

  return errors;
}

export function buildDecimoTerceiroMonthMemo(
  dataAdmissao: string,
  dataReferencia: string,
  anoReferencia: number
): DecimoTerceiroMonthMemoRow[] {
  const admissao = parseDateOrThrow(dataAdmissao, "dataAdmissao");
  const referencia = parseDateOrThrow(dataReferencia, "dataReferencia");
  const yearStart: LocalDate = { year: anoReferencia, month: 1, day: 1 };
  const yearEnd: LocalDate = { year: anoReferencia, month: 12, day: 31 };
  const start = maxDate(admissao, yearStart);
  const end = minDate(referencia, yearEnd);

  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const monthStart: LocalDate = { year: anoReferencia, month, day: 1 };
    const monthEnd: LocalDate = { year: anoReferencia, month, day: daysInMonth(anoReferencia, month) };
    const overlapStart = maxDate(start, monthStart);
    const overlapEnd = minDate(end, monthEnd);
    const hasOverlap = compareDates(overlapEnd, overlapStart) >= 0;
    const daysConsidered = hasOverlap ? toEpochDay(overlapEnd) - toEpochDay(overlapStart) + 1 : 0;

    return {
      month,
      monthStart: dateToIso(monthStart),
      monthEnd: dateToIso(monthEnd),
      overlapStart: hasOverlap ? dateToIso(overlapStart) : null,
      overlapEnd: hasOverlap ? dateToIso(overlapEnd) : null,
      daysConsidered,
      counted: daysConsidered >= 15,
    };
  });
}

export function contarAvosDecimoTerceiroAno(
  dataAdmissao: string,
  dataReferencia: string,
  anoReferencia: number
): number {
  return buildDecimoTerceiroMonthMemo(dataAdmissao, dataReferencia, anoReferencia).filter((row) => row.counted)
    .length;
}

export function calcularInssDecimoTerceiro2026(base: number): number {
  const cappedBase = Math.max(
    0,
    Math.min(base, DECIMO_TERCEIRO_INSS_EMPREGADO_2026[DECIMO_TERCEIRO_INSS_EMPREGADO_2026.length - 1].limit)
  );
  let previousLimit = 0;
  let contribution = 0;

  for (const bracket of DECIMO_TERCEIRO_INSS_EMPREGADO_2026) {
    if (cappedBase <= previousLimit) break;
    const taxable = Math.min(cappedBase, bracket.limit) - previousLimit;
    contribution += taxable * bracket.rate;
    previousLimit = bracket.limit;
  }

  return roundMoney(contribution);
}

export function calcularReducaoMensalIrrfDecimoTerceiro2026(
  rendimentosTributaveisMensais: number,
  impostoAntesReducao: number
): number {
  const rendimentos = Math.max(0, rendimentosTributaveisMensais);
  const imposto = Math.max(0, impostoAntesReducao);

  if (rendimentos <= DECIMO_TERCEIRO_IRRF_2026_MONTHLY_REDUCTION_TABLE.zeroTaxableEarningsLimit) {
    return roundMoney(imposto);
  }

  if (rendimentos <= DECIMO_TERCEIRO_IRRF_2026_MONTHLY_REDUCTION_TABLE.phaseOutTaxableEarningsLimit) {
    const reducao =
      DECIMO_TERCEIRO_IRRF_2026_MONTHLY_REDUCTION_TABLE.phaseOutFixedReduction -
      DECIMO_TERCEIRO_IRRF_2026_MONTHLY_REDUCTION_TABLE.phaseOutRate * rendimentos;
    return roundMoney(Math.min(imposto, Math.max(0, reducao)));
  }

  return 0;
}

function calcularIrrfDecimoTerceiro2026Details(
  baseBruta: number,
  inss: number,
  dependentes: number,
  pensaoAlimenticia: number
): Pick<
  DecimoTerceiroDescontosLegais,
  "irrfDecimoTerceiro" | "baseIrrfPadrao" | "baseIrrfSimplificada" | "baseIrrfUsada" | "reducaoMensal"
> {
  if (baseBruta <= 0) {
    return {
      irrfDecimoTerceiro: 0,
      baseIrrfPadrao: 0,
      baseIrrfSimplificada: 0,
      baseIrrfUsada: 0,
      reducaoMensal: 0,
    };
  }

  const deducaoDependentes = Math.max(0, dependentes) * DECIMO_TERCEIRO_IRRF_2026_DEPENDENT_DEDUCTION;
  const basePadrao = Math.max(0, baseBruta - inss - deducaoDependentes - Math.max(0, pensaoAlimenticia));
  const baseSimplificada = Math.max(0, baseBruta - DECIMO_TERCEIRO_IRRF_2026_SIMPLIFIED_DISCOUNT_LIMIT);
  const baseCalculo = Math.min(basePadrao, baseSimplificada);
  const bracket =
    DECIMO_TERCEIRO_IRRF_MENSAL_2026.find((entry) => baseCalculo <= entry.limit) ??
    DECIMO_TERCEIRO_IRRF_MENSAL_2026[0];
  const impostoAntesReducao = Math.max(0, baseCalculo * bracket.rate - bracket.deduction);
  const reducaoMensal = calcularReducaoMensalIrrfDecimoTerceiro2026(baseBruta, impostoAntesReducao);

  return {
    irrfDecimoTerceiro: roundMoney(Math.max(0, impostoAntesReducao - reducaoMensal)),
    baseIrrfPadrao: roundMoney(basePadrao),
    baseIrrfSimplificada: roundMoney(baseSimplificada),
    baseIrrfUsada: roundMoney(baseCalculo),
    reducaoMensal,
  };
}

export function calcularIrrfDecimoTerceiro2026(
  baseBruta: number,
  inss: number,
  dependentes: number,
  pensaoAlimenticia = 0
): number {
  return calcularIrrfDecimoTerceiro2026Details(baseBruta, inss, dependentes, pensaoAlimenticia)
    .irrfDecimoTerceiro;
}

function buildDescontosLegais(
  inputs: InputsDecimoTerceiro,
  decimoBruto: number
): DecimoTerceiroDescontosLegais {
  if (!inputs.calcularDescontosLegais || !isSupportedDecimoTerceiroLegalTableYear(inputs.anoReferencia)) {
    return {
      inssDecimoTerceiro: 0,
      irrfDecimoTerceiro: 0,
      total: 0,
      baseInssDecimoTerceiro: roundMoney(decimoBruto),
      baseIrrfPadrao: 0,
      baseIrrfSimplificada: 0,
      baseIrrfUsada: 0,
      reducaoMensal: 0,
      versao: DECIMO_TERCEIRO_SUPPORTED_LEGAL_TABLE_YEAR,
    };
  }

  const inss = calcularInssDecimoTerceiro2026(decimoBruto);
  const irrfDetails = calcularIrrfDecimoTerceiro2026Details(
    decimoBruto,
    inss,
    inputs.dependentesIr,
    inputs.pensaoAlimenticia
  );
  const irrf = irrfDetails.irrfDecimoTerceiro;

  return {
    inssDecimoTerceiro: inss,
    total: roundMoney(inss + irrf),
    baseInssDecimoTerceiro: roundMoney(decimoBruto),
    ...irrfDetails,
    versao: DECIMO_TERCEIRO_SUPPORTED_LEGAL_TABLE_YEAR,
  };
}

export function calcularDecimoTerceiro(inputs: InputsDecimoTerceiro): ResultadoDecimoTerceiro {
  const errors = validateDecimoTerceiroInputs(inputs);
  if (errors.length > 0) {
    throw new RangeError(`Invalid decimo terceiro inputs: ${errors.join(", ")}`);
  }

  const monthMemo = buildDecimoTerceiroMonthMemo(inputs.dataAdmissao, inputs.dataReferencia, inputs.anoReferencia);
  const avos = monthMemo.filter((row) => row.counted).length;
  const remuneracaoBase = roundMoney(inputs.salarioMensal + inputs.mediaVariavelMensal);
  const decimoBruto = roundMoney((remuneracaoBase * avos) / 12);
  const primeiraParcelaEstimada = inputs.calcularPrimeiraParcela ? roundMoney(decimoBruto / 2) : 0;
  const adiantamentoAplicado = roundMoney(Math.min(inputs.adiantamentoJaRecebido, decimoBruto));
  const adiantamentoExcedente = roundMoney(Math.max(0, inputs.adiantamentoJaRecebido - decimoBruto));
  const segundaParcelaBrutaAntesDescontos = roundMoney(Math.max(0, decimoBruto - adiantamentoAplicado));
  const descontosLegais = buildDescontosLegais(inputs, decimoBruto);
  const outrosDescontos = roundMoney(inputs.outrosDescontos);
  const outrosAcrescimos = roundMoney(inputs.outrosAcrescimos);
  const liquidoEstimado = roundMoney(
    Math.max(
      0,
      segundaParcelaBrutaAntesDescontos -
        descontosLegais.inssDecimoTerceiro -
        descontosLegais.irrfDecimoTerceiro -
        outrosDescontos +
        outrosAcrescimos
    )
  );

  const breakdown: DecimoTerceiroBreakdownRow[] = [
    {
      id: "remuneracaoBase",
      categoria: "base",
      valor: remuneracaoBase,
      aplicavel: true,
    },
    { id: "avos", categoria: "base", valor: avos, aplicavel: true, detalhe: `${avos}/12` },
    { id: "decimoBruto", categoria: "base", valor: decimoBruto, aplicavel: true, base: remuneracaoBase, detalhe: `${avos}/12` },
    { id: "primeiraParcela", categoria: "parcelas", valor: primeiraParcelaEstimada, aplicavel: inputs.calcularPrimeiraParcela },
    { id: "adiantamento", categoria: "parcelas", valor: adiantamentoAplicado, aplicavel: adiantamentoAplicado > 0 },
    {
      id: "segundaParcelaBruta",
      categoria: "parcelas",
      valor: segundaParcelaBrutaAntesDescontos,
      aplicavel: true,
      base: decimoBruto,
    },
    {
      id: "inss",
      categoria: "descontos",
      valor: descontosLegais.inssDecimoTerceiro,
      aplicavel: inputs.calcularDescontosLegais && isSupportedDecimoTerceiroLegalTableYear(inputs.anoReferencia),
      base: descontosLegais.baseInssDecimoTerceiro,
    },
    {
      id: "irrf",
      categoria: "descontos",
      valor: descontosLegais.irrfDecimoTerceiro,
      aplicavel: inputs.calcularDescontosLegais && isSupportedDecimoTerceiroLegalTableYear(inputs.anoReferencia),
      base: descontosLegais.baseIrrfUsada,
    },
    { id: "outrosDescontos", categoria: "descontos", valor: outrosDescontos, aplicavel: outrosDescontos > 0 },
    { id: "outrosAcrescimos", categoria: "liquido", valor: outrosAcrescimos, aplicavel: outrosAcrescimos > 0 },
    { id: "liquidoEstimado", categoria: "liquido", valor: liquidoEstimado, aplicavel: true },
  ];

  const warnings: DecimoTerceiroWarningCode[] = [];
  if (inputs.calcularDescontosLegais && isSupportedDecimoTerceiroLegalTableYear(inputs.anoReferencia)) {
    warnings.push("tabelasLegais2026", "fontesConsultadas2026");
  }
  if (inputs.calcularDescontosLegais && !isSupportedDecimoTerceiroLegalTableYear(inputs.anoReferencia)) {
    warnings.push("anoSemDescontosAutomaticos");
  }
  if (!inputs.calcularDescontosLegais) warnings.push("descontosLegaisDesativados");
  if (adiantamentoExcedente > 0) warnings.push("adiantamentoLimitado");
  if (inputs.mediaVariavelMensal > 0) warnings.push("mediaVariavelEstimativa");

  return {
    remuneracaoBase,
    avos,
    decimoBruto,
    primeiraParcelaEstimada,
    adiantamentoAplicado,
    adiantamentoExcedente,
    segundaParcelaBrutaAntesDescontos,
    descontosLegais,
    inssDecimoTerceiro: descontosLegais.inssDecimoTerceiro,
    irrfDecimoTerceiro: descontosLegais.irrfDecimoTerceiro,
    outrosDescontos,
    outrosAcrescimos,
    liquidoEstimado,
    monthMemo,
    breakdown,
    warnings,
    sourceVersion: DECIMO_TERCEIRO_SOURCE_VERSION_2026_06_18,
  };
}

import { round2 } from "../utils";

export type MotivoRescisao =
  | "semJustaCausa"
  | "pedidoDemissao"
  | "justaCausa"
  | "acordo"
  | "rescisaoIndireta";

export type AvisoPrevio = "trabalhado" | "indenizado" | "dispensado" | "descontado" | "naoSeAplica";

export type RescisaoCategoria = "provento" | "fgts" | "desconto";

export type RescisaoBreakdownId =
  | "saldoSalario"
  | "avisoPrevio"
  | "decimoTerceiro"
  | "feriasVencidas"
  | "feriasProporcionais"
  | "outrosCreditos"
  | "fgtsRescisorio"
  | "multaFgts"
  | "saqueFgts"
  | "avisoPrevioDesconto"
  | "adiantamentoDecimoTerceiro"
  | "adiantamentoFerias"
  | "inss"
  | "irrf"
  | "outrosDescontos";

export type RescisaoWarningCode =
  | "saldoFgtsAusente"
  | "fgtsEstimado"
  | "rescisaoIndireta"
  | "tabelasLegais2026"
  | "descontosLegaisDesativados";

export type RescisaoDireitoCode =
  | "saldoSalario"
  | "avisoPrevioIndenizado"
  | "avisoPrevioDesconto"
  | "decimoTerceiroProporcional"
  | "feriasVencidas"
  | "feriasProporcionais"
  | "multaFgts"
  | "saqueFgts";

export interface InputsRescisaoTrabalhista {
  salarioMensal: number;
  mediaVariavelMensal: number;
  dataAdmissao: string;
  dataDesligamento: string;
  motivo: MotivoRescisao;
  avisoPrevio: AvisoPrevio;
  diasTrabalhadosMes: number;
  feriasVencidasPeriodos: number;
  saldoFgts?: number;
  saldoFgtsIncluiVerbasRescisorias: boolean;
  dependentesIr: number;
  adiantamentoDecimoTerceiro: number;
  adiantamentoFerias: number;
  outrosCreditos: number;
  outrosDescontos: number;
  calcularDescontosLegais: boolean;
}

export interface RescisaoBreakdownRow {
  id: RescisaoBreakdownId;
  categoria: RescisaoCategoria;
  valor: number;
  aplicavel: boolean;
  base?: number;
  detalhe?: string;
}

export interface RescisaoDescontosLegais {
  inssMensal: number;
  inssDecimoTerceiro: number;
  irrfMensal: number;
  irrfDecimoTerceiro: number;
  totalInss: number;
  totalIrrf: number;
  total: number;
  versao: "2026";
}

export interface ResultadoRescisaoTrabalhista {
  remuneracaoBase: number;
  anosCompletos: number;
  mesesContrato: number;
  diasAvisoProporcional: number;
  diasAvisoConsiderados: number;
  avosDecimoTerceiro: number;
  avosFeriasProporcionais: number;
  saldoSalario: number;
  avisoCredito: number;
  avisoDesconto: number;
  decimoTerceiroBruto: number;
  feriasVencidas: number;
  feriasProporcionaisBrutas: number;
  fgtsRescisorioEstimado: number;
  baseMultaFgts: number;
  multaFgts: number;
  saqueFgts: number;
  saqueFgtsPercentual: number;
  fgtsFinePercentual: number;
  fgtsEstimadoPorHistorico: boolean;
  descontosLegais: RescisaoDescontosLegais;
  totalBruto: number;
  totalDescontos: number;
  totalLiquido: number;
  breakdown: RescisaoBreakdownRow[];
  warnings: RescisaoWarningCode[];
  direitosIncluidos: RescisaoDireitoCode[];
  direitosExcluidos: RescisaoDireitoCode[];
}

export const RESCISAO_TRABALHISTA_TABLE_VERSION = "2026";
export const MONEY_MAX = 10_000_000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const INSS_2026_BRACKETS = [
  { limit: 1621.0, rate: 0.075 },
  { limit: 2902.84, rate: 0.09 },
  { limit: 4354.27, rate: 0.12 },
  { limit: 8475.55, rate: 0.14 },
] as const;

export const IRRF_2026_BRACKETS = [
  { limit: 2428.8, rate: 0, deduction: 0 },
  { limit: 2826.65, rate: 0.075, deduction: 182.16 },
  { limit: 3751.05, rate: 0.15, deduction: 394.16 },
  { limit: 4664.68, rate: 0.225, deduction: 675.49 },
  { limit: Infinity, rate: 0.275, deduction: 908.73 },
] as const;

export const IRRF_2026_DEPENDENT_DEDUCTION = 189.59;
export const IRRF_2026_SIMPLIFIED_DISCOUNT_LIMIT = 607.2;
export const IRRF_2026_MONTHLY_REDUCTION_TABLE = {
  zeroTaxableEarningsLimit: 5_000,
  phaseOutTaxableEarningsLimit: 7_350,
  phaseOutFixedReduction: 978.62,
  phaseOutRate: 0.133145,
} as const;

function roundMoney(value: number): number {
  return Math.round((value + 1e-9) * 100) / 100;
}

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

export function getDefaultRescisaoTrabalhistaInputs(today = new Date()): InputsRescisaoTrabalhista {
  const desligamento = formatIsoDateFromDate(today);
  const admissaoDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
  const admissao = formatIsoDateFromDate(admissaoDate);

  return {
    salarioMensal: 3000,
    mediaVariavelMensal: 0,
    dataAdmissao: admissao,
    dataDesligamento: desligamento,
    motivo: "semJustaCausa",
    avisoPrevio: "indenizado",
    diasTrabalhadosMes: Math.min(today.getDate(), 30),
    feriasVencidasPeriodos: 0,
    saldoFgts: undefined,
    saldoFgtsIncluiVerbasRescisorias: false,
    dependentesIr: 0,
    adiantamentoDecimoTerceiro: 0,
    adiantamentoFerias: 0,
    outrosCreditos: 0,
    outrosDescontos: 0,
    calcularDescontosLegais: true,
  };
}

export function parseIsoDate(value: string): LocalDate | null {
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
  const parsed = parseIsoDate(value);
  if (!parsed) {
    throw new RangeError(`Invalid date for ${field}`);
  }
  return parsed;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
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

function maxDate(a: LocalDate, b: LocalDate): LocalDate {
  return compareDates(a, b) >= 0 ? a : b;
}

function minDate(a: LocalDate, b: LocalDate): LocalDate {
  return compareDates(a, b) <= 0 ? a : b;
}

function addDays(date: LocalDate, days: number): LocalDate {
  return fromEpochDay(toEpochDay(date) + days);
}

function anniversaryForYear(admission: LocalDate, year: number): LocalDate {
  return {
    year,
    month: admission.month,
    day: Math.min(admission.day, daysInMonth(year, admission.month)),
  };
}

export function calcularAnosCompletos(dataAdmissao: string, dataDesligamento: string): number {
  const admissao = parseDateOrThrow(dataAdmissao, "dataAdmissao");
  const desligamento = parseDateOrThrow(dataDesligamento, "dataDesligamento");
  let years = desligamento.year - admissao.year;
  const anniversary = anniversaryForYear(admissao, desligamento.year);

  if (compareDates(desligamento, anniversary) < 0) {
    years -= 1;
  }

  return Math.max(0, years);
}

export function calcularDiasAvisoProporcional(dataAdmissao: string, dataDesligamento: string): number {
  const anosCompletos = calcularAnosCompletos(dataAdmissao, dataDesligamento);
  return Math.min(90, 30 + anosCompletos * 3);
}

export function getAvisosPermitidos(motivo: MotivoRescisao): AvisoPrevio[] {
  switch (motivo) {
    case "pedidoDemissao":
      return ["trabalhado", "dispensado", "descontado"];
    case "justaCausa":
      return ["naoSeAplica"];
    case "acordo":
      return ["indenizado", "trabalhado"];
    case "semJustaCausa":
    case "rescisaoIndireta":
      return ["indenizado", "trabalhado", "dispensado"];
  }
}

export function getDefaultAvisoPrevio(motivo: MotivoRescisao): AvisoPrevio {
  switch (motivo) {
    case "pedidoDemissao":
      return "trabalhado";
    case "justaCausa":
      return "naoSeAplica";
    case "acordo":
    case "semJustaCausa":
    case "rescisaoIndireta":
      return "indenizado";
  }
}

function hasIndemnifiedNoticeProjection(motivo: MotivoRescisao, avisoPrevio: AvisoPrevio): boolean {
  return avisoPrevio === "indenizado" && ["semJustaCausa", "rescisaoIndireta", "acordo"].includes(motivo);
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

function getProjectedEndDate(inputs: InputsRescisaoTrabalhista, diasAvisoProporcional: number): LocalDate {
  const desligamento = parseDateOrThrow(inputs.dataDesligamento, "dataDesligamento");
  if (!hasIndemnifiedNoticeProjection(inputs.motivo, inputs.avisoPrevio)) return desligamento;
  return addDays(desligamento, diasAvisoProporcional);
}

export function contarAvosDecimoTerceiro(
  dataAdmissao: string,
  dataDesligamento: string,
  dataFimProjetada = dataDesligamento
): number {
  const admissao = parseDateOrThrow(dataAdmissao, "dataAdmissao");
  const desligamento = parseDateOrThrow(dataDesligamento, "dataDesligamento");
  const fimProjetado = parseDateOrThrow(dataFimProjetada, "dataFimProjetada");
  const year = desligamento.year;
  const start = maxDate(admissao, { year, month: 1, day: 1 });
  const end = minDate(fimProjetado, { year, month: 12, day: 31 });

  return countMonthsWithAtLeast15Days(start, end);
}

export function contarAvosFeriasProporcionais(dataAdmissao: string, dataFimProjetada: string): number {
  const admissao = parseDateOrThrow(dataAdmissao, "dataAdmissao");
  const fimProjetado = parseDateOrThrow(dataFimProjetada, "dataFimProjetada");

  let acquisitionStart = anniversaryForYear(admissao, fimProjetado.year);
  if (compareDates(acquisitionStart, fimProjetado) > 0) {
    acquisitionStart = anniversaryForYear(admissao, fimProjetado.year - 1);
  }
  if (compareDates(acquisitionStart, admissao) < 0) {
    acquisitionStart = admissao;
  }

  return Math.min(11, countMonthsWithAtLeast15Days(acquisitionStart, fimProjetado));
}

export function calcularInss2026(base: number): number {
  const cappedBase = Math.max(0, Math.min(base, INSS_2026_BRACKETS[INSS_2026_BRACKETS.length - 1].limit));
  let previousLimit = 0;
  let contribution = 0;

  for (const bracket of INSS_2026_BRACKETS) {
    if (cappedBase <= previousLimit) break;
    const taxable = Math.min(cappedBase, bracket.limit) - previousLimit;
    contribution += taxable * bracket.rate;
    previousLimit = bracket.limit;
  }

  return roundMoney(contribution);
}

export function calcularIrrf2026(
  baseBruta: number,
  inss: number,
  dependentes: number,
  usarDescontoSimplificado = true
): number {
  if (baseBruta <= 0) return 0;

  const deducaoDependentes = Math.max(0, dependentes) * IRRF_2026_DEPENDENT_DEDUCTION;
  const basePadrao = Math.max(0, baseBruta - inss - deducaoDependentes);
  const baseSimplificada = Math.max(0, baseBruta - IRRF_2026_SIMPLIFIED_DISCOUNT_LIMIT);
  const baseCalculo = usarDescontoSimplificado ? Math.min(basePadrao, baseSimplificada) : basePadrao;
  const bracket = IRRF_2026_BRACKETS.find((entry) => baseCalculo <= entry.limit) ?? IRRF_2026_BRACKETS[0];
  const impostoAntesReducao = Math.max(0, baseCalculo * bracket.rate - bracket.deduction);
  const reducaoMensal = calcularReducaoMensalIrrf2026(baseBruta, impostoAntesReducao);

  return roundMoney(Math.max(0, impostoAntesReducao - reducaoMensal));
}

export function calcularReducaoMensalIrrf2026(
  rendimentosTributaveisMensais: number,
  impostoAntesReducao: number
): number {
  const rendimentos = Math.max(0, rendimentosTributaveisMensais);
  const imposto = Math.max(0, impostoAntesReducao);

  if (rendimentos <= IRRF_2026_MONTHLY_REDUCTION_TABLE.zeroTaxableEarningsLimit) {
    return roundMoney(imposto);
  }

  if (rendimentos <= IRRF_2026_MONTHLY_REDUCTION_TABLE.phaseOutTaxableEarningsLimit) {
    const reducao =
      IRRF_2026_MONTHLY_REDUCTION_TABLE.phaseOutFixedReduction -
      IRRF_2026_MONTHLY_REDUCTION_TABLE.phaseOutRate * rendimentos;
    return roundMoney(Math.min(imposto, Math.max(0, reducao)));
  }

  return 0;
}

function isMoney(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= MONEY_MAX;
}

export function validateRescisaoTrabalhistaInputs(inputs: InputsRescisaoTrabalhista): string[] {
  const errors: string[] = [];
  const moneyFields: Array<[keyof InputsRescisaoTrabalhista, number | undefined]> = [
    ["salarioMensal", inputs.salarioMensal],
    ["mediaVariavelMensal", inputs.mediaVariavelMensal],
    ["saldoFgts", inputs.saldoFgts],
    ["adiantamentoDecimoTerceiro", inputs.adiantamentoDecimoTerceiro],
    ["adiantamentoFerias", inputs.adiantamentoFerias],
    ["outrosCreditos", inputs.outrosCreditos],
    ["outrosDescontos", inputs.outrosDescontos],
  ];

  for (const [field, value] of moneyFields) {
    if (value !== undefined && !isMoney(value)) {
      errors.push(String(field));
    }
  }

  const admissao = parseIsoDate(inputs.dataAdmissao);
  const desligamento = parseIsoDate(inputs.dataDesligamento);
  if (!admissao) errors.push("dataAdmissao");
  if (!desligamento) errors.push("dataDesligamento");

  if (admissao && desligamento) {
    if (compareDates(desligamento, admissao) < 0) {
      errors.push("periodoContrato");
    }
    if (calcularAnosCompletos(inputs.dataAdmissao, inputs.dataDesligamento) > 50) {
      errors.push("duracaoContrato");
    }
  }

  if (!Number.isInteger(inputs.diasTrabalhadosMes) || inputs.diasTrabalhadosMes < 0 || inputs.diasTrabalhadosMes > 30) {
    errors.push("diasTrabalhadosMes");
  }

  if (
    !Number.isInteger(inputs.feriasVencidasPeriodos) ||
    inputs.feriasVencidasPeriodos < 0 ||
    inputs.feriasVencidasPeriodos > 5
  ) {
    errors.push("feriasVencidasPeriodos");
  }

  if (!Number.isInteger(inputs.dependentesIr) || inputs.dependentesIr < 0 || inputs.dependentesIr > 20) {
    errors.push("dependentesIr");
  }

  if (!getAvisosPermitidos(inputs.motivo).includes(inputs.avisoPrevio)) {
    errors.push("avisoPrevio");
  }

  return errors;
}

function getDireitos(motivo: MotivoRescisao, avisoPrevio: AvisoPrevio): {
  incluidos: RescisaoDireitoCode[];
  excluidos: RescisaoDireitoCode[];
} {
  const incluidos: RescisaoDireitoCode[] = ["saldoSalario", "feriasVencidas"];
  const excluidos: RescisaoDireitoCode[] = [];

  if (motivo !== "justaCausa") {
    incluidos.push("decimoTerceiroProporcional", "feriasProporcionais");
  } else {
    excluidos.push("decimoTerceiroProporcional", "feriasProporcionais");
  }

  if (motivo === "pedidoDemissao" && avisoPrevio === "descontado") {
    incluidos.push("avisoPrevioDesconto");
  } else if (["semJustaCausa", "rescisaoIndireta", "acordo"].includes(motivo) && avisoPrevio === "indenizado") {
    incluidos.push("avisoPrevioIndenizado");
  } else {
    excluidos.push("avisoPrevioIndenizado", "avisoPrevioDesconto");
  }

  if (["semJustaCausa", "rescisaoIndireta", "acordo"].includes(motivo)) {
    incluidos.push("multaFgts", "saqueFgts");
  } else {
    excluidos.push("multaFgts", "saqueFgts");
  }

  return { incluidos, excluidos };
}

export function calcularRescisaoTrabalhista(inputs: InputsRescisaoTrabalhista): ResultadoRescisaoTrabalhista {
  const errors = validateRescisaoTrabalhistaInputs(inputs);
  if (errors.length > 0) {
    throw new RangeError(`Invalid rescisao trabalhista inputs: ${errors.join(", ")}`);
  }

  const admissao = parseDateOrThrow(inputs.dataAdmissao, "dataAdmissao");
  const desligamento = parseDateOrThrow(inputs.dataDesligamento, "dataDesligamento");
  const remuneracaoBase = round2(inputs.salarioMensal + inputs.mediaVariavelMensal);
  const anosCompletos = calcularAnosCompletos(inputs.dataAdmissao, inputs.dataDesligamento);
  const diasAvisoProporcional = calcularDiasAvisoProporcional(inputs.dataAdmissao, inputs.dataDesligamento);
  const projectedEnd = getProjectedEndDate(inputs, diasAvisoProporcional);
  const projectedEndIso = dateToIso(projectedEnd);

  const diasAvisoConsiderados =
    inputs.motivo === "justaCausa"
      ? 0
      : inputs.motivo === "pedidoDemissao"
      ? inputs.avisoPrevio === "naoSeAplica"
        ? 0
        : 30
      : diasAvisoProporcional;

  const saldoSalario = round2((remuneracaoBase / 30) * inputs.diasTrabalhadosMes);
  const avisoBase = round2((remuneracaoBase / 30) * diasAvisoProporcional);
  const avisoCredito =
    inputs.avisoPrevio === "indenizado" && ["semJustaCausa", "rescisaoIndireta"].includes(inputs.motivo)
      ? avisoBase
      : inputs.avisoPrevio === "indenizado" && inputs.motivo === "acordo"
      ? round2(avisoBase * 0.5)
      : 0;
  const avisoDesconto =
    inputs.motivo === "pedidoDemissao" && inputs.avisoPrevio === "descontado"
      ? round2((remuneracaoBase / 30) * 30)
      : 0;

  const avosDecimoTerceiro =
    inputs.motivo === "justaCausa"
      ? 0
      : contarAvosDecimoTerceiro(inputs.dataAdmissao, inputs.dataDesligamento, projectedEndIso);
  const decimoTerceiroBruto = round2((remuneracaoBase * avosDecimoTerceiro) / 12);
  const adiantamentoDecimoAplicado = round2(Math.min(inputs.adiantamentoDecimoTerceiro, decimoTerceiroBruto));

  const feriasVencidas = round2(inputs.feriasVencidasPeriodos * remuneracaoBase * (4 / 3));
  const avosFeriasProporcionais =
    inputs.motivo === "justaCausa" ? 0 : contarAvosFeriasProporcionais(inputs.dataAdmissao, projectedEndIso);
  const feriasProporcionaisBrutas = round2((remuneracaoBase * avosFeriasProporcionais * (4 / 3)) / 12);
  const adiantamentoFeriasAplicado = round2(
    Math.min(inputs.adiantamentoFerias, feriasVencidas + feriasProporcionaisBrutas)
  );

  const decimoParaFgts = Math.max(0, decimoTerceiroBruto - adiantamentoDecimoAplicado);
  const avisoIndenizadoParaFgts = hasIndemnifiedNoticeProjection(inputs.motivo, inputs.avisoPrevio) ? avisoCredito : 0;
  const fgtsRescisorioEstimado = round2(0.08 * (saldoSalario + decimoParaFgts + avisoIndenizadoParaFgts));
  const mesesContrato = countMonthsWithAtLeast15Days(admissao, desligamento);
  const saldoFgtsFoiInformado = inputs.saldoFgts !== undefined;
  const fgtsHistoricoEstimado = round2(0.08 * remuneracaoBase * mesesContrato);
  const baseMultaFgts = saldoFgtsFoiInformado
    ? round2((inputs.saldoFgts ?? 0) + (inputs.saldoFgtsIncluiVerbasRescisorias ? 0 : fgtsRescisorioEstimado))
    : round2(fgtsHistoricoEstimado + fgtsRescisorioEstimado);

  const fgtsFinePercentual =
    inputs.motivo === "semJustaCausa" || inputs.motivo === "rescisaoIndireta" ? 0.4 : inputs.motivo === "acordo" ? 0.2 : 0;
  const saqueFgtsPercentual =
    inputs.motivo === "semJustaCausa" || inputs.motivo === "rescisaoIndireta" ? 1 : inputs.motivo === "acordo" ? 0.8 : 0;
  const multaFgts = round2(baseMultaFgts * fgtsFinePercentual);
  const saqueFgts = round2(baseMultaFgts * saqueFgtsPercentual);

  const inssMensal = inputs.calcularDescontosLegais ? calcularInss2026(saldoSalario) : 0;
  const inssDecimoTerceiro = inputs.calcularDescontosLegais ? calcularInss2026(decimoTerceiroBruto) : 0;
  const irrfMensal = inputs.calcularDescontosLegais
    ? calcularIrrf2026(saldoSalario, inssMensal, inputs.dependentesIr)
    : 0;
  const irrfDecimoTerceiro = inputs.calcularDescontosLegais
    ? calcularIrrf2026(decimoTerceiroBruto, inssDecimoTerceiro, inputs.dependentesIr)
    : 0;
  const totalInss = round2(inssMensal + inssDecimoTerceiro);
  const totalIrrf = round2(irrfMensal + irrfDecimoTerceiro);
  const descontosLegais: RescisaoDescontosLegais = {
    inssMensal,
    inssDecimoTerceiro,
    irrfMensal,
    irrfDecimoTerceiro,
    totalInss,
    totalIrrf,
    total: round2(totalInss + totalIrrf),
    versao: RESCISAO_TRABALHISTA_TABLE_VERSION,
  };

  const totalBruto = round2(
    saldoSalario +
      avisoCredito +
      decimoTerceiroBruto +
      feriasVencidas +
      feriasProporcionaisBrutas +
      inputs.outrosCreditos
  );
  const totalDescontos = round2(
    avisoDesconto +
      adiantamentoDecimoAplicado +
      adiantamentoFeriasAplicado +
      descontosLegais.total +
      inputs.outrosDescontos
  );
  const totalLiquido = round2(totalBruto - totalDescontos);

  const breakdown: RescisaoBreakdownRow[] = [
    { id: "saldoSalario", categoria: "provento", valor: saldoSalario, aplicavel: true, base: remuneracaoBase },
    {
      id: "avisoPrevio",
      categoria: "provento",
      valor: avisoCredito,
      aplicavel: avisoCredito > 0,
      base: avisoBase,
      detalhe: `${diasAvisoProporcional}`,
    },
    {
      id: "decimoTerceiro",
      categoria: "provento",
      valor: decimoTerceiroBruto,
      aplicavel: inputs.motivo !== "justaCausa",
      detalhe: `${avosDecimoTerceiro}/12`,
    },
    { id: "feriasVencidas", categoria: "provento", valor: feriasVencidas, aplicavel: true },
    {
      id: "feriasProporcionais",
      categoria: "provento",
      valor: feriasProporcionaisBrutas,
      aplicavel: inputs.motivo !== "justaCausa",
      detalhe: `${avosFeriasProporcionais}/12`,
    },
    { id: "outrosCreditos", categoria: "provento", valor: round2(inputs.outrosCreditos), aplicavel: inputs.outrosCreditos > 0 },
    { id: "fgtsRescisorio", categoria: "fgts", valor: fgtsRescisorioEstimado, aplicavel: fgtsRescisorioEstimado > 0 },
    { id: "multaFgts", categoria: "fgts", valor: multaFgts, aplicavel: fgtsFinePercentual > 0, base: baseMultaFgts },
    { id: "saqueFgts", categoria: "fgts", valor: saqueFgts, aplicavel: saqueFgtsPercentual > 0, base: baseMultaFgts },
    { id: "avisoPrevioDesconto", categoria: "desconto", valor: avisoDesconto, aplicavel: avisoDesconto > 0 },
    {
      id: "adiantamentoDecimoTerceiro",
      categoria: "desconto",
      valor: adiantamentoDecimoAplicado,
      aplicavel: adiantamentoDecimoAplicado > 0,
    },
    {
      id: "adiantamentoFerias",
      categoria: "desconto",
      valor: adiantamentoFeriasAplicado,
      aplicavel: adiantamentoFeriasAplicado > 0,
    },
    { id: "inss", categoria: "desconto", valor: totalInss, aplicavel: inputs.calcularDescontosLegais },
    { id: "irrf", categoria: "desconto", valor: totalIrrf, aplicavel: inputs.calcularDescontosLegais },
    { id: "outrosDescontos", categoria: "desconto", valor: round2(inputs.outrosDescontos), aplicavel: inputs.outrosDescontos > 0 },
  ];

  const warnings: RescisaoWarningCode[] = [];
  if (!saldoFgtsFoiInformado) warnings.push("saldoFgtsAusente", "fgtsEstimado");
  if (inputs.motivo === "rescisaoIndireta") warnings.push("rescisaoIndireta");
  if (inputs.calcularDescontosLegais) warnings.push("tabelasLegais2026");
  if (!inputs.calcularDescontosLegais) warnings.push("descontosLegaisDesativados");

  const direitos = getDireitos(inputs.motivo, inputs.avisoPrevio);

  return {
    remuneracaoBase,
    anosCompletos,
    mesesContrato,
    diasAvisoProporcional,
    diasAvisoConsiderados,
    avosDecimoTerceiro,
    avosFeriasProporcionais,
    saldoSalario,
    avisoCredito,
    avisoDesconto,
    decimoTerceiroBruto,
    feriasVencidas,
    feriasProporcionaisBrutas,
    fgtsRescisorioEstimado,
    baseMultaFgts,
    multaFgts,
    saqueFgts,
    saqueFgtsPercentual,
    fgtsFinePercentual,
    fgtsEstimadoPorHistorico: !saldoFgtsFoiInformado,
    descontosLegais,
    totalBruto,
    totalDescontos,
    totalLiquido,
    breakdown,
    warnings,
    direitosIncluidos: direitos.incluidos,
    direitosExcluidos: direitos.excluidos,
  };
}

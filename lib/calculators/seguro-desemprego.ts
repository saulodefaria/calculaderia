function roundMoney(value: number): number {
  return Math.round((value + 1e-9) * 100) / 100;
}

export type SeguroDesempregoNumeroSolicitacao = "primeira" | "segunda" | "terceiraOuMais";

export type SeguroDesempregoMotivoDispensa =
  | "semJustaCausa"
  | "rescisaoIndireta"
  | "pedidoDemissao"
  | "justaCausa"
  | "acordo"
  | "pdv"
  | "outro";

export type SeguroDesempregoStatus = "eligibleEstimate" | "notEligibleByInputs" | "needsOfficialReview";

export type SeguroDesempregoSalaryBand = "primeiraFaixa" | "segundaFaixa" | "teto";

export type SeguroDesempregoRequestWindowStatus = "missingDate" | "beforeWindow" | "inWindow" | "afterWindow";

export type SeguroDesempregoWarningCode =
  | "estimateOnly"
  | "officialRecords"
  | "staleMteFormalPage"
  | "missingDate"
  | "requestBeforeWindow"
  | "requestAfterWindow"
  | "rescisaoIndiretaRecognition";

export type SeguroDesempregoReasonCode =
  | "dismissalReasonNotEligible"
  | "salaryMonthsBelowThreshold"
  | "parcelMonthsBelowThreshold"
  | "requestBeforeWindow"
  | "requestAfterWindow"
  | "notUnemployed"
  | "hasSufficientIncome"
  | "hasIncompatibleBenefit"
  | "missingDate"
  | "rescisaoIndiretaRecognition";

export type SeguroDesempregoValidationError =
  | "salarioInvalido"
  | "salarioObrigatorio"
  | "numeroSolicitacaoInvalido"
  | "mesesElegibilidadeInvalidos"
  | "mesesTrabalhadosInvalidos"
  | "motivoDispensaInvalido"
  | "dataDispensaInvalida"
  | "dataRequerimentoInvalida"
  | "requerimentoAntesDispensa"
  | "tabelaAnoInvalida";

export type SeguroDesempregoChecklistStatus = "pass" | "fail" | "warning";

export type SeguroDesempregoChecklistId =
  | "motivoDispensa"
  | "mesesSalario"
  | "mesesTrabalhados36"
  | "janelaRequerimento"
  | "desempregado"
  | "rendaPropria"
  | "beneficioIncompativel"
  | "validacaoOficial";

export interface SeguroDesempregoInputs {
  salarioUltimo: number;
  salarioPenultimo: number;
  salarioAntepenultimo: number;
  numeroSolicitacao: SeguroDesempregoNumeroSolicitacao;
  mesesComSalarioElegibilidade: number;
  mesesTrabalhados36: number;
  motivoDispensa: SeguroDesempregoMotivoDispensa;
  dataDispensa: string;
  dataRequerimento: string;
  desempregadoNoRequerimento: boolean;
  semRendaPropriaSuficiente: boolean;
  semBeneficioContinuadoIncompativel: boolean;
  tabelaAno: 2026;
}

export interface SeguroDesempregoEligibilityThreshold {
  requiredMonths: number;
  windowMonths: number;
  consecutive: boolean;
}

export interface SeguroDesempregoParcelRule {
  quantidadeParcelas: number;
  minMonths: number;
  maxMonths: number | null;
}

export interface SeguroDesempregoRequestWindow {
  status: SeguroDesempregoRequestWindowStatus;
  diasAposDispensa: number | null;
  dataInicio: string | null;
  dataFim: string | null;
}

export interface SeguroDesempregoChecklistItem {
  id: SeguroDesempregoChecklistId;
  status: SeguroDesempregoChecklistStatus;
  reason?: SeguroDesempregoReasonCode;
  value?: string | number | boolean | null;
}

export interface ResultadoSeguroDesemprego {
  status: SeguroDesempregoStatus;
  salarioMedio: number;
  salariosConsiderados: number[];
  salaryBand: SeguroDesempregoSalaryBand;
  parcelaBruta: number;
  valorParcela: number;
  quantidadeParcelas: number;
  totalEstimado: number;
  totalFormulaReferencia: number;
  eligibilityThreshold: SeguroDesempregoEligibilityThreshold;
  parcelRule: SeguroDesempregoParcelRule | null;
  requestWindow: SeguroDesempregoRequestWindow;
  checklist: SeguroDesempregoChecklistItem[];
  ineligibilityReasons: SeguroDesempregoReasonCode[];
  warnings: SeguroDesempregoWarningCode[];
  sourceVersion: typeof SEGURO_DESEMPREGO_SOURCE_VERSION_2026_06_19;
}

export const SEGURO_DESEMPREGO_MONEY_MAX = 10_000_000;

export const SEGURO_DESEMPREGO_TABLE_2026 = {
  year: 2026,
  effectiveFrom: "2026-01-11",
  minimumBenefit: 1621,
  firstBandLimit: 2222.17,
  secondBandLimit: 3703.99,
  secondBandAddend: 1777.74,
  benefitCeiling: 2518.65,
  firstBandRate: 0.8,
  secondBandRate: 0.5,
} as const;

export const SEGURO_DESEMPREGO_SOURCE_VERSION_2026_06_19 = {
  tableYear: 2026,
  effectiveFrom: "2026-01-11",
  accessedAt: "2026-06-19",
  mteArticlePublishedAt: "2026-01-12",
  formalPageUpdatedAt: "2024-03-25",
} as const;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface LocalDate {
  year: number;
  month: number;
  day: number;
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

export function formatSeguroDesempregoIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dateToIso(date: LocalDate): string {
  return `${date.year}-${pad(date.month)}-${pad(date.day)}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function parseSeguroDesempregoIsoDate(value: string): LocalDate | null {
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

function addDays(date: LocalDate, days: number): LocalDate {
  return fromEpochDay(toEpochDay(date) + days);
}

function isMoney(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= SEGURO_DESEMPREGO_MONEY_MAX;
}

function isIntegerRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

function isNumeroSolicitacao(value: string): value is SeguroDesempregoNumeroSolicitacao {
  return value === "primeira" || value === "segunda" || value === "terceiraOuMais";
}

function isMotivoDispensa(value: string): value is SeguroDesempregoMotivoDispensa {
  return (
    value === "semJustaCausa" ||
    value === "rescisaoIndireta" ||
    value === "pedidoDemissao" ||
    value === "justaCausa" ||
    value === "acordo" ||
    value === "pdv" ||
    value === "outro"
  );
}

export function getDefaultSeguroDesempregoInputs(today = new Date()): SeguroDesempregoInputs {
  return {
    salarioUltimo: 3000,
    salarioPenultimo: 3000,
    salarioAntepenultimo: 3000,
    numeroSolicitacao: "primeira",
    mesesComSalarioElegibilidade: 12,
    mesesTrabalhados36: 12,
    motivoDispensa: "semJustaCausa",
    dataDispensa: "",
    dataRequerimento: formatSeguroDesempregoIsoDate(today),
    desempregadoNoRequerimento: true,
    semRendaPropriaSuficiente: true,
    semBeneficioContinuadoIncompativel: true,
    tabelaAno: 2026,
  };
}

export function validateSeguroDesempregoInputs(
  inputs: SeguroDesempregoInputs
): SeguroDesempregoValidationError[] {
  const errors: SeguroDesempregoValidationError[] = [];
  const salaries = [inputs.salarioUltimo, inputs.salarioPenultimo, inputs.salarioAntepenultimo];

  if (salaries.some((salary) => !isMoney(salary))) {
    errors.push("salarioInvalido");
  }

  if (salaries.every((salary) => salary <= 0)) {
    errors.push("salarioObrigatorio");
  }

  if (!isNumeroSolicitacao(inputs.numeroSolicitacao)) {
    errors.push("numeroSolicitacaoInvalido");
  }

  if (!isIntegerRange(inputs.mesesComSalarioElegibilidade, 0, 36)) {
    errors.push("mesesElegibilidadeInvalidos");
  }

  if (!isIntegerRange(inputs.mesesTrabalhados36, 0, 36)) {
    errors.push("mesesTrabalhadosInvalidos");
  }

  if (!isMotivoDispensa(inputs.motivoDispensa)) {
    errors.push("motivoDispensaInvalido");
  }

  const dataDispensa = inputs.dataDispensa ? parseSeguroDesempregoIsoDate(inputs.dataDispensa) : null;
  const dataRequerimento = inputs.dataRequerimento ? parseSeguroDesempregoIsoDate(inputs.dataRequerimento) : null;

  if (inputs.dataDispensa && !dataDispensa) {
    errors.push("dataDispensaInvalida");
  }

  if (inputs.dataRequerimento && !dataRequerimento) {
    errors.push("dataRequerimentoInvalida");
  }

  if (dataDispensa && dataRequerimento && toEpochDay(dataRequerimento) < toEpochDay(dataDispensa)) {
    errors.push("requerimentoAntesDispensa");
  }

  if (inputs.tabelaAno !== 2026) {
    errors.push("tabelaAnoInvalida");
  }

  return errors;
}

export function getSeguroDesempregoEligibilityThreshold(
  numeroSolicitacao: SeguroDesempregoNumeroSolicitacao
): SeguroDesempregoEligibilityThreshold {
  if (numeroSolicitacao === "primeira") {
    return { requiredMonths: 12, windowMonths: 18, consecutive: false };
  }

  if (numeroSolicitacao === "segunda") {
    return { requiredMonths: 9, windowMonths: 12, consecutive: false };
  }

  return { requiredMonths: 6, windowMonths: 6, consecutive: true };
}

export function calcularSeguroDesempregoSalarioMedio(inputs: SeguroDesempregoInputs): number {
  const salariosValidos = [inputs.salarioUltimo, inputs.salarioPenultimo, inputs.salarioAntepenultimo].filter(
    (salary) => salary > 0
  );

  if (salariosValidos.length === 0) {
    throw new RangeError("At least one positive salary is required");
  }

  return roundMoney(salariosValidos.reduce((total, salary) => total + salary, 0) / salariosValidos.length);
}

export function calcularSeguroDesempregoValorParcela(salarioMedio: number): {
  salaryBand: SeguroDesempregoSalaryBand;
  parcelaBruta: number;
  valorParcela: number;
} {
  if (!isMoney(salarioMedio) || salarioMedio <= 0) {
    throw new RangeError("Invalid average salary");
  }

  const table = SEGURO_DESEMPREGO_TABLE_2026;
  let salaryBand: SeguroDesempregoSalaryBand;
  let parcelaBruta: number;

  if (salarioMedio <= table.firstBandLimit) {
    salaryBand = "primeiraFaixa";
    parcelaBruta = salarioMedio * table.firstBandRate;
  } else if (salarioMedio <= table.secondBandLimit) {
    salaryBand = "segundaFaixa";
    parcelaBruta = (salarioMedio - table.firstBandLimit) * table.secondBandRate + table.secondBandAddend;
  } else {
    salaryBand = "teto";
    parcelaBruta = table.benefitCeiling;
  }

  const valorParcela = Math.min(table.benefitCeiling, Math.max(table.minimumBenefit, roundMoney(parcelaBruta)));

  return {
    salaryBand,
    parcelaBruta: roundMoney(parcelaBruta),
    valorParcela,
  };
}

export function calcularSeguroDesempregoParcelas(
  numeroSolicitacao: SeguroDesempregoNumeroSolicitacao,
  mesesTrabalhados36: number
): SeguroDesempregoParcelRule {
  const rules: Record<SeguroDesempregoNumeroSolicitacao, SeguroDesempregoParcelRule[]> = {
    primeira: [
      { minMonths: 24, maxMonths: null, quantidadeParcelas: 5 },
      { minMonths: 12, maxMonths: 23, quantidadeParcelas: 4 },
    ],
    segunda: [
      { minMonths: 24, maxMonths: null, quantidadeParcelas: 5 },
      { minMonths: 12, maxMonths: 23, quantidadeParcelas: 4 },
      { minMonths: 9, maxMonths: 11, quantidadeParcelas: 3 },
    ],
    terceiraOuMais: [
      { minMonths: 24, maxMonths: null, quantidadeParcelas: 5 },
      { minMonths: 12, maxMonths: 23, quantidadeParcelas: 4 },
      { minMonths: 6, maxMonths: 11, quantidadeParcelas: 3 },
    ],
  };

  return (
    rules[numeroSolicitacao].find(
      (rule) => mesesTrabalhados36 >= rule.minMonths && (rule.maxMonths === null || mesesTrabalhados36 <= rule.maxMonths)
    ) ?? { minMonths: getSeguroDesempregoEligibilityThreshold(numeroSolicitacao).requiredMonths, maxMonths: null, quantidadeParcelas: 0 }
  );
}

export function calcularSeguroDesempregoRequestWindow(
  dataDispensa: string,
  dataRequerimento: string
): SeguroDesempregoRequestWindow {
  const dispensa = dataDispensa ? parseSeguroDesempregoIsoDate(dataDispensa) : null;
  const requerimento = dataRequerimento ? parseSeguroDesempregoIsoDate(dataRequerimento) : null;

  if (!dispensa || !requerimento) {
    return {
      status: "missingDate",
      diasAposDispensa: null,
      dataInicio: dispensa ? dateToIso(addDays(dispensa, 7)) : null,
      dataFim: dispensa ? dateToIso(addDays(dispensa, 120)) : null,
    };
  }

  const diasAposDispensa = toEpochDay(requerimento) - toEpochDay(dispensa);
  const dataInicio = dateToIso(addDays(dispensa, 7));
  const dataFim = dateToIso(addDays(dispensa, 120));

  if (diasAposDispensa < 7) {
    return { status: "beforeWindow", diasAposDispensa, dataInicio, dataFim };
  }

  if (diasAposDispensa > 120) {
    return { status: "afterWindow", diasAposDispensa, dataInicio, dataFim };
  }

  return { status: "inWindow", diasAposDispensa, dataInicio, dataFim };
}

function pushReason(reasons: SeguroDesempregoReasonCode[], reason: SeguroDesempregoReasonCode) {
  if (!reasons.includes(reason)) reasons.push(reason);
}

export function calcularSeguroDesemprego(inputs: SeguroDesempregoInputs): ResultadoSeguroDesemprego {
  const validationErrors = validateSeguroDesempregoInputs(inputs);
  if (validationErrors.length > 0) {
    throw new RangeError(`Invalid seguro-desemprego inputs: ${validationErrors.join(", ")}`);
  }

  const salariosConsiderados = [inputs.salarioUltimo, inputs.salarioPenultimo, inputs.salarioAntepenultimo].filter(
    (salary) => salary > 0
  );
  const salarioMedio = calcularSeguroDesempregoSalarioMedio(inputs);
  const benefit = calcularSeguroDesempregoValorParcela(salarioMedio);
  const eligibilityThreshold = getSeguroDesempregoEligibilityThreshold(inputs.numeroSolicitacao);
  const parcelRule = calcularSeguroDesempregoParcelas(inputs.numeroSolicitacao, inputs.mesesTrabalhados36);
  const requestWindow = calcularSeguroDesempregoRequestWindow(inputs.dataDispensa, inputs.dataRequerimento);
  const ineligibilityReasons: SeguroDesempregoReasonCode[] = [];
  const warnings: SeguroDesempregoWarningCode[] = ["estimateOnly", "officialRecords", "staleMteFormalPage"];
  const checklist: SeguroDesempregoChecklistItem[] = [];

  if (inputs.motivoDispensa === "semJustaCausa") {
    checklist.push({ id: "motivoDispensa", status: "pass", value: inputs.motivoDispensa });
  } else if (inputs.motivoDispensa === "rescisaoIndireta") {
    pushReason(ineligibilityReasons, "rescisaoIndiretaRecognition");
    warnings.push("rescisaoIndiretaRecognition");
    checklist.push({
      id: "motivoDispensa",
      status: "warning",
      reason: "rescisaoIndiretaRecognition",
      value: inputs.motivoDispensa,
    });
  } else {
    pushReason(ineligibilityReasons, "dismissalReasonNotEligible");
    checklist.push({
      id: "motivoDispensa",
      status: "fail",
      reason: "dismissalReasonNotEligible",
      value: inputs.motivoDispensa,
    });
  }

  if (inputs.mesesComSalarioElegibilidade >= eligibilityThreshold.requiredMonths) {
    checklist.push({ id: "mesesSalario", status: "pass", value: inputs.mesesComSalarioElegibilidade });
  } else {
    pushReason(ineligibilityReasons, "salaryMonthsBelowThreshold");
    checklist.push({
      id: "mesesSalario",
      status: "fail",
      reason: "salaryMonthsBelowThreshold",
      value: inputs.mesesComSalarioElegibilidade,
    });
  }

  if (parcelRule.quantidadeParcelas > 0) {
    checklist.push({ id: "mesesTrabalhados36", status: "pass", value: inputs.mesesTrabalhados36 });
  } else {
    pushReason(ineligibilityReasons, "parcelMonthsBelowThreshold");
    checklist.push({
      id: "mesesTrabalhados36",
      status: "fail",
      reason: "parcelMonthsBelowThreshold",
      value: inputs.mesesTrabalhados36,
    });
  }

  if (requestWindow.status === "inWindow") {
    checklist.push({ id: "janelaRequerimento", status: "pass", value: requestWindow.diasAposDispensa });
  } else if (requestWindow.status === "missingDate") {
    pushReason(ineligibilityReasons, "missingDate");
    warnings.push("missingDate");
    checklist.push({ id: "janelaRequerimento", status: "warning", reason: "missingDate", value: null });
  } else if (requestWindow.status === "beforeWindow") {
    pushReason(ineligibilityReasons, "requestBeforeWindow");
    warnings.push("requestBeforeWindow");
    checklist.push({
      id: "janelaRequerimento",
      status: "fail",
      reason: "requestBeforeWindow",
      value: requestWindow.diasAposDispensa,
    });
  } else {
    pushReason(ineligibilityReasons, "requestAfterWindow");
    warnings.push("requestAfterWindow");
    checklist.push({
      id: "janelaRequerimento",
      status: "fail",
      reason: "requestAfterWindow",
      value: requestWindow.diasAposDispensa,
    });
  }

  if (inputs.desempregadoNoRequerimento) {
    checklist.push({ id: "desempregado", status: "pass", value: true });
  } else {
    pushReason(ineligibilityReasons, "notUnemployed");
    checklist.push({ id: "desempregado", status: "fail", reason: "notUnemployed", value: false });
  }

  if (inputs.semRendaPropriaSuficiente) {
    checklist.push({ id: "rendaPropria", status: "pass", value: true });
  } else {
    pushReason(ineligibilityReasons, "hasSufficientIncome");
    checklist.push({ id: "rendaPropria", status: "fail", reason: "hasSufficientIncome", value: false });
  }

  if (inputs.semBeneficioContinuadoIncompativel) {
    checklist.push({ id: "beneficioIncompativel", status: "pass", value: true });
  } else {
    pushReason(ineligibilityReasons, "hasIncompatibleBenefit");
    checklist.push({
      id: "beneficioIncompativel",
      status: "fail",
      reason: "hasIncompatibleBenefit",
      value: false,
    });
  }

  checklist.push({ id: "validacaoOficial", status: "warning", value: null });

  const hardFailReasons: SeguroDesempregoReasonCode[] = [
    "dismissalReasonNotEligible",
    "salaryMonthsBelowThreshold",
    "parcelMonthsBelowThreshold",
    "requestBeforeWindow",
    "requestAfterWindow",
    "notUnemployed",
    "hasSufficientIncome",
    "hasIncompatibleBenefit",
  ];
  const hasHardFail = ineligibilityReasons.some((reason) => hardFailReasons.includes(reason));
  const needsOfficialReview = ineligibilityReasons.some(
    (reason) => reason === "missingDate" || reason === "rescisaoIndiretaRecognition"
  );
  const status: SeguroDesempregoStatus = hasHardFail
    ? "notEligibleByInputs"
    : needsOfficialReview
      ? "needsOfficialReview"
      : "eligibleEstimate";
  const totalFormulaReferencia = roundMoney(benefit.valorParcela * parcelRule.quantidadeParcelas);

  return {
    status,
    salarioMedio,
    salariosConsiderados,
    salaryBand: benefit.salaryBand,
    parcelaBruta: benefit.parcelaBruta,
    valorParcela: benefit.valorParcela,
    quantidadeParcelas: parcelRule.quantidadeParcelas,
    totalEstimado: status === "eligibleEstimate" ? totalFormulaReferencia : 0,
    totalFormulaReferencia,
    eligibilityThreshold,
    parcelRule: parcelRule.quantidadeParcelas > 0 ? parcelRule : null,
    requestWindow,
    checklist,
    ineligibilityReasons,
    warnings,
    sourceVersion: SEGURO_DESEMPREGO_SOURCE_VERSION_2026_06_19,
  };
}

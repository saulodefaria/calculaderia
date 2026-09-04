import snapshotJson from "../../data/indices/igpm.json";

export const CORRECAO_IGPM_FORMULA_VERSION = 1 as const;
export const CORRECAO_IGPM_MIN_MONTH = "1994-07" as const;
export const CORRECAO_IGPM_MONEY_MIN = 0.01;
export const CORRECAO_IGPM_MONEY_MAX = 1_000_000_000_000;
export const CORRECAO_IGPM_STALE_AFTER_DAYS = 45;
export const IGPM_KNOWN_FIRST_MONTH = "1989-06" as const;
export const IGPM_KNOWN_MINIMUM_LAST_MONTH = "2026-08" as const;
export const IGPM_KNOWN_MINIMUM_OBSERVATION_COUNT = 447;

export const CORRECAO_IGPM_SOURCE_REFERENCES = {
  methodology:
    "https://www3.bcb.gov.br/CALCIDADAO/publico/metodologiaCorrigirIndice.do?method=metodologiaCorrigirIndice",
  faq: "https://www.bcb.gov.br/meubc/faqs/p/qual-o-objetivo-do-calculo-de-correcao-de-valores",
  bcbSgs:
    "https://www3.bcb.gov.br/sgspub/consultarvalores/consultarValoresSeries.do?hdOidSeriesSelecionadas=28655&method=consultarGraficoPorId",
  fgvMethodology: "https://portalibre.fgv.br/metodologia/metodologia-igp-m-1",
  fgvIgp: "https://portalibre.fgv.br/igp",
} as const;

export interface IgpmObservation {
  month: string;
  ratePercent: string;
}

export interface IgpmSnapshot {
  seriesCode: number;
  seriesName: string;
  unit: string;
  source: string;
  sourceUrl: string;
  retrievedAt: string;
  firstObservation: string;
  lastObservation: string;
  observations: IgpmObservation[];
}

export interface CorrecaoIgpmInputs {
  valorOriginal: number;
  mesInicial: string;
  mesFinal: string;
  formulaVersion: typeof CORRECAO_IGPM_FORMULA_VERSION;
}

export type CorrecaoIgpmValidationErrorCode =
  | "formulaVersion"
  | "valorOriginal"
  | "mesInicial"
  | "mesFinal"
  | "mesInicialAntesPlanoReal"
  | "intervalo"
  | "mesInicialIndisponivel"
  | "mesFinalIndisponivel"
  | "observacaoAusente"
  | "fatorMensal"
  | "resultadoNaoFinito";

export type CorrecaoIgpmFreshnessStatus = "current" | "stale";

export interface CorrecaoIgpmYearSummary {
  year: number;
  firstMonth: string;
  lastMonth: string;
  monthsApplied: number;
  factor: number;
  variationPercent: number;
}

export interface CorrecaoIgpmResult {
  inputs: CorrecaoIgpmInputs;
  valorCorrigido: number;
  diferencaNominal: number;
  fatorAcumulado: number;
  variacaoAcumuladaPercentual: number;
  quantidadeMeses: number;
  mesInicialUsado: string;
  mesFinalUsado: string;
  latestSourceMonth: string;
  hasNewerData: boolean;
  freshnessStatus: CorrecaoIgpmFreshnessStatus;
  seriesCode: number;
  retrievedAt: string;
  resumoAnual: CorrecaoIgpmYearSummary[];
  sourceReferences: typeof CORRECAO_IGPM_SOURCE_REFERENCES;
}

function isMonth(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function addOneMonthIgpm(month: string): string {
  if (!isMonth(month)) throw new Error(`Invalid month: ${month}`);
  const [year, monthNumber] = month.split("-").map(Number);
  if (monthNumber === 12) return `${year + 1}-01`;
  return `${year}-${String(monthNumber + 1).padStart(2, "0")}`;
}

export function enumerateIgpmMonths(startMonth: string, endMonth: string): string[] {
  if (!isMonth(startMonth) || !isMonth(endMonth) || startMonth > endMonth) return [];
  const months: string[] = [];
  let month = startMonth;
  while (month <= endMonth) {
    months.push(month);
    month = addOneMonthIgpm(month);
  }
  return months;
}

export function validateIgpmSnapshot(value: unknown): IgpmSnapshot {
  if (!value || typeof value !== "object") throw new TypeError("IGP-M snapshot must be an object.");
  const snapshot = value as Partial<IgpmSnapshot>;
  if (snapshot.seriesCode !== 28655) throw new Error("IGP-M snapshot must use BCB SGS series 28655.");
  if (snapshot.unit !== "percentPerMonth") throw new Error("IGP-M snapshot has an invalid unit.");
  if (typeof snapshot.seriesName !== "string" || snapshot.seriesName.trim() === "") {
    throw new Error("IGP-M snapshot must include a series name.");
  }
  if (typeof snapshot.source !== "string" || snapshot.source.trim() === "") {
    throw new Error("IGP-M snapshot must include source provenance.");
  }
  if (typeof snapshot.sourceUrl !== "string" || snapshot.sourceUrl.trim() === "") {
    throw new Error("IGP-M snapshot must include an official source URL.");
  }
  let sourceUrl: URL;
  try {
    sourceUrl = new URL(snapshot.sourceUrl);
  } catch {
    throw new Error("IGP-M snapshot has an invalid source URL.");
  }
  if (
    sourceUrl.protocol !== "https:" ||
    sourceUrl.hostname !== "api.bcb.gov.br" ||
    sourceUrl.pathname !== "/dados/serie/bcdata.sgs.28655/dados"
  ) {
    throw new Error("IGP-M snapshot source URL must use the official BCB SGS 28655 HTTPS API.");
  }
  if (!isMonth(snapshot.firstObservation) || !isMonth(snapshot.lastObservation)) {
    throw new Error("IGP-M snapshot has invalid range metadata.");
  }
  if (snapshot.firstObservation !== IGPM_KNOWN_FIRST_MONTH) {
    throw new Error(`IGP-M snapshot must start at ${IGPM_KNOWN_FIRST_MONTH}.`);
  }
  if (snapshot.lastObservation < IGPM_KNOWN_MINIMUM_LAST_MONTH) {
    throw new Error(`IGP-M snapshot must include at least ${IGPM_KNOWN_MINIMUM_LAST_MONTH}.`);
  }
  if (!Array.isArray(snapshot.observations) || snapshot.observations.length === 0) {
    throw new Error("IGP-M snapshot has no observations.");
  }
  if (snapshot.observations.length < IGPM_KNOWN_MINIMUM_OBSERVATION_COUNT) {
    throw new Error(
      `IGP-M snapshot must contain at least ${IGPM_KNOWN_MINIMUM_OBSERVATION_COUNT} observations.`
    );
  }

  const seen = new Set<string>();
  let expected = snapshot.observations[0]?.month;
  for (const [index, observation] of snapshot.observations.entries()) {
    if (!observation || !isMonth(observation.month) || typeof observation.ratePercent !== "string") {
      throw new Error(`IGP-M observation ${index} is invalid.`);
    }
    if (seen.has(observation.month)) throw new Error(`Duplicate IGP-M month: ${observation.month}`);
    if (observation.month !== expected) {
      throw new Error(`Discontinuous IGP-M snapshot: expected ${expected}, received ${observation.month}`);
    }
    if (!/^-?\d+(?:\.\d+)?$/.test(observation.ratePercent)) {
      throw new Error(`Invalid IGP-M rate for ${observation.month}`);
    }
    const rate = Number(observation.ratePercent);
    if (!Number.isFinite(rate) || rate <= -100) {
      throw new Error(`IGP-M rate must be finite and greater than -100% for ${observation.month}`);
    }
    seen.add(observation.month);
    expected = addOneMonthIgpm(observation.month);
  }

  if (snapshot.firstObservation !== snapshot.observations[0].month) {
    throw new Error("IGP-M first observation metadata does not match the data.");
  }
  if (snapshot.lastObservation !== snapshot.observations.at(-1)?.month) {
    throw new Error("IGP-M last observation metadata does not match the data.");
  }
  if (typeof snapshot.retrievedAt !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(snapshot.retrievedAt)) {
    throw new Error("IGP-M snapshot has an invalid retrieval date.");
  }

  return snapshot as IgpmSnapshot;
}

export const IGPM_SNAPSHOT = validateIgpmSnapshot(snapshotJson);
export const CORRECAO_IGPM_LATEST_MONTH = IGPM_SNAPSHOT.lastObservation;

export function getDefaultCorrecaoIgpmInputs(): CorrecaoIgpmInputs {
  return {
    valorOriginal: 500_000,
    mesInicial: "2020-01",
    mesFinal: CORRECAO_IGPM_LATEST_MONTH,
    formulaVersion: CORRECAO_IGPM_FORMULA_VERSION,
  };
}

export function getIgpmFreshnessStatus(
  retrievedAt: string,
  now: Date = new Date()
): CorrecaoIgpmFreshnessStatus {
  const retrieved = new Date(`${retrievedAt}T00:00:00Z`).getTime();
  const current = now.getTime();
  if (!Number.isFinite(retrieved) || !Number.isFinite(current)) return "stale";
  const ageDays = (current - retrieved) / 86_400_000;
  return ageDays > CORRECAO_IGPM_STALE_AFTER_DAYS ? "stale" : "current";
}

export function validateCorrecaoIgpmInputs(
  inputs: CorrecaoIgpmInputs,
  snapshot: IgpmSnapshot = IGPM_SNAPSHOT
): CorrecaoIgpmValidationErrorCode[] {
  const errors: CorrecaoIgpmValidationErrorCode[] = [];
  if (inputs.formulaVersion !== CORRECAO_IGPM_FORMULA_VERSION) errors.push("formulaVersion");
  if (
    !Number.isFinite(inputs.valorOriginal) ||
    inputs.valorOriginal < CORRECAO_IGPM_MONEY_MIN ||
    inputs.valorOriginal > CORRECAO_IGPM_MONEY_MAX
  ) {
    errors.push("valorOriginal");
  }
  if (!isMonth(inputs.mesInicial)) errors.push("mesInicial");
  if (!isMonth(inputs.mesFinal)) errors.push("mesFinal");
  if (isMonth(inputs.mesInicial) && inputs.mesInicial < CORRECAO_IGPM_MIN_MONTH) {
    errors.push("mesInicialAntesPlanoReal");
  }
  if (isMonth(inputs.mesInicial) && isMonth(inputs.mesFinal) && inputs.mesInicial > inputs.mesFinal) {
    errors.push("intervalo");
  }

  const observations = new Map(snapshot.observations.map((observation) => [observation.month, observation]));
  if (isMonth(inputs.mesInicial) && !observations.has(inputs.mesInicial)) errors.push("mesInicialIndisponivel");
  if (isMonth(inputs.mesFinal) && !observations.has(inputs.mesFinal)) errors.push("mesFinalIndisponivel");

  if (errors.length === 0) {
    const months = enumerateIgpmMonths(inputs.mesInicial, inputs.mesFinal);
    if (months.some((month) => !observations.has(month))) errors.push("observacaoAusente");
    for (const month of months) {
      const rate = Number(observations.get(month)?.ratePercent);
      const factor = 1 + rate / 100;
      if (!Number.isFinite(factor) || factor <= 0) {
        errors.push("fatorMensal");
        break;
      }
    }
  }
  return Array.from(new Set(errors));
}

export function calcularCorrecaoIgpm(
  inputs: CorrecaoIgpmInputs,
  snapshot: IgpmSnapshot = IGPM_SNAPSHOT,
  now: Date = new Date()
): CorrecaoIgpmResult {
  validateIgpmSnapshot(snapshot);
  const errors = validateCorrecaoIgpmInputs(inputs, snapshot);
  if (errors.length > 0) throw new RangeError(`Invalid IGP-M inputs: ${errors.join(", ")}`);

  const byMonth = new Map(snapshot.observations.map((observation) => [observation.month, observation]));
  const months = enumerateIgpmMonths(inputs.mesInicial, inputs.mesFinal);
  let fatorAcumulado = 1;
  const yearly = new Map<number, { months: string[]; factor: number }>();

  for (const month of months) {
    const rate = Number(byMonth.get(month)?.ratePercent);
    const monthlyFactor = 1 + rate / 100;
    fatorAcumulado *= monthlyFactor;
    const year = Number(month.slice(0, 4));
    const entry = yearly.get(year) ?? { months: [], factor: 1 };
    entry.months.push(month);
    entry.factor *= monthlyFactor;
    yearly.set(year, entry);
  }

  const valorCorrigido = inputs.valorOriginal * fatorAcumulado;
  const diferencaNominal = valorCorrigido - inputs.valorOriginal;
  const variacaoAcumuladaPercentual = (fatorAcumulado - 1) * 100;
  if (![fatorAcumulado, valorCorrigido, diferencaNominal, variacaoAcumuladaPercentual].every(Number.isFinite)) {
    throw new RangeError("Invalid IGP-M inputs: resultadoNaoFinito");
  }

  const resumoAnual: CorrecaoIgpmYearSummary[] = Array.from(yearly.entries()).map(([year, entry]) => ({
    year,
    firstMonth: entry.months[0],
    lastMonth: entry.months.at(-1)!,
    monthsApplied: entry.months.length,
    factor: entry.factor,
    variationPercent: (entry.factor - 1) * 100,
  }));

  return {
    inputs,
    valorCorrigido,
    diferencaNominal,
    fatorAcumulado,
    variacaoAcumuladaPercentual,
    quantidadeMeses: months.length,
    mesInicialUsado: inputs.mesInicial,
    mesFinalUsado: inputs.mesFinal,
    latestSourceMonth: snapshot.lastObservation,
    hasNewerData: inputs.mesFinal < snapshot.lastObservation,
    freshnessStatus: getIgpmFreshnessStatus(snapshot.retrievedAt, now),
    seriesCode: snapshot.seriesCode,
    retrievedAt: snapshot.retrievedAt,
    resumoAnual,
    sourceReferences: CORRECAO_IGPM_SOURCE_REFERENCES,
  };
}

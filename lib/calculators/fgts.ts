export const FGTS_MONEY_MAX = 10_000_000;
export const FGTS_SUPPORTED_SOURCE_VERSION = "2026-06-22";
export const FGTS_STANDARD_RATE_2026_06_22 = 0.08;
export const FGTS_APPRENTICE_RATE_2026_06_22 = 0.02;

export const FGTS_SOURCE_VERSION_2026_06_22 = {
  id: FGTS_SUPPORTED_SOURCE_VERSION,
  accessedAt: "2026-06-22",
  mteFgtsOverviewUpdatedAt: "2025-04-10",
  mteFgtsDigitalRescisoryBaseUpdatedAt: "2024-04-26",
  standardRate: FGTS_STANDARD_RATE_2026_06_22,
  apprenticeRate: FGTS_APPRENTICE_RATE_2026_06_22,
} as const;

export type FgtsTipoDeposito = "padrao8" | "aprendiz2";

export type FgtsMotivoRescisao =
  | "semRescisao"
  | "semJustaCausa"
  | "rescisaoIndiretaReconhecida"
  | "acordo484A"
  | "culpaReciprocaForcaMaior"
  | "pedidoDemissao"
  | "justaCausa";

export type FgtsWarningCode =
  | "domesticoForaDoEscopo"
  | "semCorrecaoJurosLucro"
  | "fontesOficiaisPrevalecem"
  | "baseEstimadaSemCorrecao"
  | "saldoAusente"
  | "aprendizRevisaoRescisao"
  | "rescisaoIndiretaReconhecimento"
  | "culpaReciprocaForcaMaiorReconhecimento";

export type FgtsValidationError =
  | "baseMensalFgts"
  | "baseMensalFgtsObrigatoria"
  | "meses"
  | "tipoDeposito"
  | "baseDecimoTerceiro"
  | "baseVerbasRescisoriasFgts"
  | "depositosExtrasInformados"
  | "saldoFgtsInformado"
  | "saldoIncluiDepositosEstimados"
  | "motivoRescisao"
  | "mostrarSaqueEstimado"
  | "sourceVersion";

export type FgtsBreakdownCategory = "depositos" | "saldoBase" | "rescisao" | "saque";

export type FgtsBreakdownId =
  | "depositoMensal"
  | "depositosMensaisPeriodo"
  | "depositoDecimoTerceiro"
  | "depositoVerbasRescisorias"
  | "depositosExtrasInformados"
  | "saldoFgtsInformado"
  | "baseMultaFgts"
  | "multaFgts"
  | "saqueFgtsExibido";

export interface FgtsInputs {
  baseMensalFgts: number;
  meses: number;
  tipoDeposito: FgtsTipoDeposito;
  baseDecimoTerceiro: number;
  baseVerbasRescisoriasFgts: number;
  depositosExtrasInformados: number;
  saldoFgtsInformado: number | null;
  saldoIncluiDepositosEstimados: boolean;
  motivoRescisao: FgtsMotivoRescisao;
  mostrarSaqueEstimado: boolean;
  sourceVersion: typeof FGTS_SUPPORTED_SOURCE_VERSION;
}

export interface FgtsBreakdownRow {
  id: FgtsBreakdownId;
  categoria: FgtsBreakdownCategory;
  valor: number;
  aplicavel: boolean;
  base?: number;
  aliquota?: number;
  detalhe?: "saldoIncluiEstimativa" | "saldoMaisEstimativa" | "estimadoSemSaldo" | "saqueOculto";
}

export interface ResultadoFgts {
  baseMensalFgts: number;
  meses: number;
  tipoDeposito: FgtsTipoDeposito;
  aliquotaDeposito: number;
  depositoMensal: number;
  depositosMensaisPeriodo: number;
  depositoDecimoTerceiro: number;
  depositoVerbasRescisorias: number;
  depositosExtrasInformados: number;
  totalDepositosEstimados: number;
  saldoFgtsInformado: number | null;
  saldoIncluiDepositosEstimados: boolean;
  motivoRescisao: FgtsMotivoRescisao;
  baseMultaFgts: number;
  aliquotaMulta: number;
  multaFgts: number;
  percentualSaqueExibido: number;
  saqueFgtsExibido: number;
  mostrarSaqueEstimado: boolean;
  breakdown: FgtsBreakdownRow[];
  warnings: FgtsWarningCode[];
  sourceVersion: typeof FGTS_SOURCE_VERSION_2026_06_22;
}

function roundMoney(value: number): number {
  return Math.round((value + 1e-9) * 100) / 100;
}

function isMoney(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= FGTS_MONEY_MAX;
}

function isIntegerRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

function isTipoDeposito(value: string): value is FgtsTipoDeposito {
  return value === "padrao8" || value === "aprendiz2";
}

function isMotivoRescisao(value: string): value is FgtsMotivoRescisao {
  return (
    value === "semRescisao" ||
    value === "semJustaCausa" ||
    value === "rescisaoIndiretaReconhecida" ||
    value === "acordo484A" ||
    value === "culpaReciprocaForcaMaior" ||
    value === "pedidoDemissao" ||
    value === "justaCausa"
  );
}

export function getDefaultFgtsInputs(): FgtsInputs {
  return {
    baseMensalFgts: 3000,
    meses: 12,
    tipoDeposito: "padrao8",
    baseDecimoTerceiro: 3000,
    baseVerbasRescisoriasFgts: 0,
    depositosExtrasInformados: 0,
    saldoFgtsInformado: null,
    saldoIncluiDepositosEstimados: false,
    motivoRescisao: "semRescisao",
    mostrarSaqueEstimado: true,
    sourceVersion: FGTS_SUPPORTED_SOURCE_VERSION,
  };
}

export function getFgtsDepositRate(tipoDeposito: FgtsTipoDeposito): number {
  return tipoDeposito === "aprendiz2" ? FGTS_APPRENTICE_RATE_2026_06_22 : FGTS_STANDARD_RATE_2026_06_22;
}

export function getFgtsFineRate(motivoRescisao: FgtsMotivoRescisao): number {
  if (motivoRescisao === "semJustaCausa" || motivoRescisao === "rescisaoIndiretaReconhecida") return 0.4;
  if (motivoRescisao === "acordo484A" || motivoRescisao === "culpaReciprocaForcaMaior") return 0.2;
  return 0;
}

export function getFgtsWithdrawalDisplayRate(motivoRescisao: FgtsMotivoRescisao): number {
  if (motivoRescisao === "semJustaCausa" || motivoRescisao === "rescisaoIndiretaReconhecida") return 1;
  if (motivoRescisao === "acordo484A") return 0.8;
  return 0;
}

export function validateFgtsInputs(inputs: FgtsInputs): FgtsValidationError[] {
  const errors: FgtsValidationError[] = [];

  if (!isMoney(inputs.baseMensalFgts)) errors.push("baseMensalFgts");
  if (inputs.baseMensalFgts <= 0) errors.push("baseMensalFgtsObrigatoria");
  if (!isIntegerRange(inputs.meses, 0, 600)) errors.push("meses");
  if (!isTipoDeposito(inputs.tipoDeposito)) errors.push("tipoDeposito");
  if (!isMoney(inputs.baseDecimoTerceiro)) errors.push("baseDecimoTerceiro");
  if (!isMoney(inputs.baseVerbasRescisoriasFgts)) errors.push("baseVerbasRescisoriasFgts");
  if (!isMoney(inputs.depositosExtrasInformados)) errors.push("depositosExtrasInformados");
  if (inputs.saldoFgtsInformado !== null && !isMoney(inputs.saldoFgtsInformado)) errors.push("saldoFgtsInformado");
  if (typeof inputs.saldoIncluiDepositosEstimados !== "boolean") errors.push("saldoIncluiDepositosEstimados");
  if (!isMotivoRescisao(inputs.motivoRescisao)) errors.push("motivoRescisao");
  if (typeof inputs.mostrarSaqueEstimado !== "boolean") errors.push("mostrarSaqueEstimado");
  if (inputs.sourceVersion !== FGTS_SUPPORTED_SOURCE_VERSION) errors.push("sourceVersion");

  return errors;
}

function buildWarnings(inputs: FgtsInputs, hasFineScenario: boolean): FgtsWarningCode[] {
  const warnings: FgtsWarningCode[] = [
    "domesticoForaDoEscopo",
    "semCorrecaoJurosLucro",
    "fontesOficiaisPrevalecem",
  ];

  if (inputs.saldoFgtsInformado === null) {
    warnings.push("baseEstimadaSemCorrecao");
    if (hasFineScenario) warnings.push("saldoAusente");
  }

  if (inputs.tipoDeposito === "aprendiz2" && hasFineScenario) warnings.push("aprendizRevisaoRescisao");
  if (inputs.motivoRescisao === "rescisaoIndiretaReconhecida") warnings.push("rescisaoIndiretaReconhecimento");
  if (inputs.motivoRescisao === "culpaReciprocaForcaMaior") {
    warnings.push("culpaReciprocaForcaMaiorReconhecimento");
  }

  return warnings;
}

export function calcularFgts(inputs: FgtsInputs): ResultadoFgts {
  const validationErrors = validateFgtsInputs(inputs);
  if (validationErrors.length > 0) {
    throw new RangeError(`Invalid fgts inputs: ${validationErrors.join(", ")}`);
  }

  const baseMensalFgts = roundMoney(inputs.baseMensalFgts);
  const baseDecimoTerceiro = roundMoney(inputs.baseDecimoTerceiro);
  const baseVerbasRescisoriasFgts = roundMoney(inputs.baseVerbasRescisoriasFgts);
  const depositosExtrasInformados = roundMoney(inputs.depositosExtrasInformados);
  const saldoFgtsInformado = inputs.saldoFgtsInformado === null ? null : roundMoney(inputs.saldoFgtsInformado);
  const aliquotaDeposito = getFgtsDepositRate(inputs.tipoDeposito);
  const depositoMensal = roundMoney(baseMensalFgts * aliquotaDeposito);
  const depositosMensaisPeriodo = roundMoney(depositoMensal * inputs.meses);
  const depositoDecimoTerceiro = roundMoney(baseDecimoTerceiro * aliquotaDeposito);
  const depositoVerbasRescisorias = roundMoney(baseVerbasRescisoriasFgts * aliquotaDeposito);
  const totalDepositosEstimados = roundMoney(
    depositosMensaisPeriodo + depositoDecimoTerceiro + depositoVerbasRescisorias + depositosExtrasInformados
  );
  const baseMultaFgts =
    saldoFgtsInformado === null
      ? totalDepositosEstimados
      : roundMoney(saldoFgtsInformado + (inputs.saldoIncluiDepositosEstimados ? 0 : totalDepositosEstimados));
  const aliquotaMulta = getFgtsFineRate(inputs.motivoRescisao);
  const multaFgts = roundMoney(baseMultaFgts * aliquotaMulta);
  const percentualSaqueExibido = getFgtsWithdrawalDisplayRate(inputs.motivoRescisao);
  const saqueFgtsExibido = inputs.mostrarSaqueEstimado ? roundMoney(baseMultaFgts * percentualSaqueExibido) : 0;
  const hasFineScenario = aliquotaMulta > 0;
  const warnings = buildWarnings(inputs, hasFineScenario);

  const breakdown: FgtsBreakdownRow[] = [
    {
      id: "depositoMensal",
      categoria: "depositos",
      valor: depositoMensal,
      aplicavel: true,
      base: baseMensalFgts,
      aliquota: aliquotaDeposito,
    },
    {
      id: "depositosMensaisPeriodo",
      categoria: "depositos",
      valor: depositosMensaisPeriodo,
      aplicavel: inputs.meses > 0,
      base: depositoMensal,
    },
    {
      id: "depositoDecimoTerceiro",
      categoria: "depositos",
      valor: depositoDecimoTerceiro,
      aplicavel: baseDecimoTerceiro > 0,
      base: baseDecimoTerceiro,
      aliquota: aliquotaDeposito,
    },
    {
      id: "depositoVerbasRescisorias",
      categoria: "depositos",
      valor: depositoVerbasRescisorias,
      aplicavel: baseVerbasRescisoriasFgts > 0,
      base: baseVerbasRescisoriasFgts,
      aliquota: aliquotaDeposito,
    },
    {
      id: "depositosExtrasInformados",
      categoria: "depositos",
      valor: depositosExtrasInformados,
      aplicavel: depositosExtrasInformados > 0,
    },
    {
      id: "saldoFgtsInformado",
      categoria: "saldoBase",
      valor: saldoFgtsInformado ?? 0,
      aplicavel: saldoFgtsInformado !== null,
      detalhe: inputs.saldoIncluiDepositosEstimados ? "saldoIncluiEstimativa" : "saldoMaisEstimativa",
    },
    {
      id: "baseMultaFgts",
      categoria: "rescisao",
      valor: baseMultaFgts,
      aplicavel: true,
      base: totalDepositosEstimados,
      detalhe: saldoFgtsInformado === null ? "estimadoSemSaldo" : undefined,
    },
    {
      id: "multaFgts",
      categoria: "rescisao",
      valor: multaFgts,
      aplicavel: hasFineScenario,
      base: baseMultaFgts,
      aliquota: aliquotaMulta,
    },
    {
      id: "saqueFgtsExibido",
      categoria: "saque",
      valor: saqueFgtsExibido,
      aplicavel: inputs.mostrarSaqueEstimado && percentualSaqueExibido > 0,
      base: baseMultaFgts,
      aliquota: percentualSaqueExibido,
      detalhe: inputs.mostrarSaqueEstimado ? undefined : "saqueOculto",
    },
  ];

  return {
    baseMensalFgts,
    meses: inputs.meses,
    tipoDeposito: inputs.tipoDeposito,
    aliquotaDeposito,
    depositoMensal,
    depositosMensaisPeriodo,
    depositoDecimoTerceiro,
    depositoVerbasRescisorias,
    depositosExtrasInformados,
    totalDepositosEstimados,
    saldoFgtsInformado,
    saldoIncluiDepositosEstimados: inputs.saldoIncluiDepositosEstimados,
    motivoRescisao: inputs.motivoRescisao,
    baseMultaFgts,
    aliquotaMulta,
    multaFgts,
    percentualSaqueExibido,
    saqueFgtsExibido,
    mostrarSaqueEstimado: inputs.mostrarSaqueEstimado,
    breakdown,
    warnings,
    sourceVersion: FGTS_SOURCE_VERSION_2026_06_22,
  };
}

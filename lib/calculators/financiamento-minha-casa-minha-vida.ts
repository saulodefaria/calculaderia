import { round2 } from "../utils";

export const MCMV_SOURCE_VERSION = "2026-07-03" as const;

export const MCMV_SOURCE_METADATA = {
  sourceVersion: MCMV_SOURCE_VERSION,
  accessedAt: "2026-07-03",
  paymentTiming: "end-of-period monthly payments",
  rateConversion: "monthlyRate = nominalAnnualRate / 12 / 100",
  sources: [
    {
      label: "Ministry of Cities - Sobre o Minha Casa, Minha Vida",
      url: "https://www.gov.br/cidades/pt-br/acesso-a-informacao/acoes-e-programas/habitacao/programa-minha-casa-minha-vida/sobre-o-minha-casa-minha-vida-1",
      updatedAt: "2026-04-23",
    },
    {
      label: "Ministry of Cities - Minha Casa, Minha Vida - Linha Financiada",
      url: "https://www.gov.br/cidades/pt-br/acesso-a-informacao/acoes-e-programas/habitacao/programa-minha-casa-minha-vida/mcmv-fgts",
      updatedAt: "2026-06-28",
    },
    {
      label: "Ministry of Cities - Minha Casa, Minha Vida - Classe Media",
      url: "https://www.gov.br/cidades/pt-br/acesso-a-informacao/acoes-e-programas/habitacao/programa-minha-casa-minha-vida/minha-casa-minha-vida-classe-media/minha-casa-minha-vida-classe-media-1",
      updatedAt: "2026-04-17",
    },
    {
      label: "Microsoft Support PMT function",
      url: "https://support.microsoft.com/en-us/excel/functions/pmt-function",
    },
  ],
} as const;

export const MCMV_LIMITS = {
  maxRendaMensal: 100_000,
  maxRendaMcmv: 13_000,
  maxValorImovelInput: 10_000_000,
  faixa12PropertyMin: 210_000,
  faixa12PropertyMax: 275_000,
  faixa3PropertyMax: 400_000,
  classeMediaPropertyMax: 600_000,
  subsidioMaxNorteNordeste: 65_000,
  subsidioMaxOutrasRegioes: 55_000,
  subsidioIncomeCap: 5_000,
  maxPrazoMeses: 420,
  standardWarningPrazoMeses: 360,
  maxTaxaNominalAnualManual: 30,
} as const;

export type McmvRegiao = "norte-nordeste" | "sul-sudeste-centro-oeste";
export type McmvTipoImovel = "novo" | "usado" | "construcao" | "terreno-construcao";
export type McmvMetodo = "sac" | "price";
export type McmvFaixaPrograma = "faixa1" | "faixa2" | "faixa3" | "classeMedia" | "foraMcmv";

export type McmvRateSelectionMode = "four-cell" | "lower-standard" | "single" | "manual" | "unavailable";

export type McmvPropertyCapStatusCode =
  | "withinNationalLowerBound"
  | "verifyLocalCap"
  | "withinLocalCap"
  | "aboveLocalCap"
  | "aboveSourceRange"
  | "withinNationalCap"
  | "aboveSourceCap"
  | "withinClasseMediaCap"
  | "aboveClasseMediaCap"
  | "outsideProgram";

export type McmvWarningCode =
  | "estimativaEducativa"
  | "fonteVersionada"
  | "subsidioNaoCalculado"
  | "creditoBancarioNecessario"
  | "cetNaoIncluido"
  | "taxaManual"
  | "taxaOficialIndisponivel"
  | "foraMcmv"
  | "limiteMunicipalNecessario"
  | "imovelAcimaLimite"
  | "subsidioAcimaTetoFonte"
  | "subsidioForaFaixaFonte"
  | "prazoAcima360"
  | "cotaUsadoClasseMedia";

export type McmvValidationError =
  | "rendaMensalBruta"
  | "regiao"
  | "tipoImovel"
  | "valorImovel"
  | "limiteLocalFaixa12"
  | "entradaRecursosProprios"
  | "fgtsEntrada"
  | "subsidioInformado"
  | "valorFinanciadoEstimado"
  | "prazoMeses"
  | "metodo"
  | "taxaNominalAnualManual";

export interface McmvInputs {
  rendaMensalBruta: number;
  regiao: McmvRegiao;
  cotistaFgts: boolean;
  tipoImovel: McmvTipoImovel;
  valorImovel: number;
  limiteLocalFaixa12: number | null;
  entradaRecursosProprios: number;
  fgtsEntrada: number;
  subsidioInformado: number;
  prazoMeses: number;
  metodo: McmvMetodo;
  usarTaxaOficial: boolean;
  taxaNominalAnualManual: number | null;
  compararMetodos: boolean;
}

export interface McmvRateSelection {
  rowId: string;
  faixaPrograma: McmvFaixaPrograma;
  label: string;
  rendaMinExclusive: number;
  rendaMax: number;
  selectionMode: McmvRateSelectionMode;
  selectedColumn: string;
  taxaNominalAnual: number;
}

export interface McmvPropertyCapStatus {
  code: McmvPropertyCapStatusCode;
  faixaPrograma: McmvFaixaPrograma;
  limiteMinimoFonte: number | null;
  limiteMaximoFonte: number | null;
  limiteLocalUsado: number | null;
}

export interface McmvSubsidyWarning {
  code: Extract<McmvWarningCode, "subsidioAcimaTetoFonte" | "subsidioForaFaixaFonte">;
  sourceCap: number | null;
}

export interface McmvParcela {
  mes: number;
  saldoInicial: number;
  juros: number;
  amortizacao: number;
  parcela: number;
  saldoFinal: number;
}

export interface McmvResumoMetodo {
  metodo: McmvMetodo;
  primeiraParcela: number;
  ultimaParcela: number;
  totalJuros: number;
  totalParcelas: number;
  totalPagoUsuario: number;
  totalRecursosAplicados: number;
  saldoFinal: number;
}

export interface McmvComparacao {
  price: McmvResumoMetodo;
  sac: McmvResumoMetodo;
  diferencaJuros: number;
  diferencaTotalParcelas: number;
}

export interface ResultadoMinhaCasaMinhaVida extends McmvResumoMetodo {
  inputs: McmvInputs;
  calculoDisponivel: boolean;
  faixaPrograma: McmvFaixaPrograma;
  subfaixaRendaTaxa: McmvRateSelection | null;
  taxaNominalAnualSelecionada: number | null;
  taxaMensalParaSimulacao: number | null;
  taxaEfetivaAnualEquivalente: number | null;
  valorBaseImovel: number;
  totalEntradaInformada: number;
  valorSubsidioInformado: number;
  valorFinanciadoEstimado: number;
  ltvEstimado: number;
  propertyCapStatus: McmvPropertyCapStatus;
  subsidyWarnings: McmvSubsidyWarning[];
  parcelas: McmvParcela[];
  comparacao: McmvComparacao | null;
  eligibilityWarnings: McmvWarningCode[];
  sourceVersion: typeof MCMV_SOURCE_METADATA;
}

interface FourCellRates {
  cotistaNorteNordeste: number;
  cotistaSulSudesteCentroOeste: number;
  naoCotistaNorteNordeste: number;
  naoCotistaSulSudesteCentroOeste: number;
}

interface LowerStandardRates {
  lower: number;
  standard: number;
}

type RateRow =
  | {
      id: string;
      faixaPrograma: Exclude<McmvFaixaPrograma, "foraMcmv">;
      label: string;
      rendaMinExclusive: number;
      rendaMax: number;
      mode: "four-cell";
      rates: FourCellRates;
    }
  | {
      id: string;
      faixaPrograma: Exclude<McmvFaixaPrograma, "foraMcmv">;
      label: string;
      rendaMinExclusive: number;
      rendaMax: number;
      mode: "lower-standard";
      rates: LowerStandardRates;
    }
  | {
      id: string;
      faixaPrograma: Exclude<McmvFaixaPrograma, "foraMcmv">;
      label: string;
      rendaMinExclusive: number;
      rendaMax: number;
      mode: "single";
      rate: number;
    };

const RATE_ROWS: RateRow[] = [
  {
    id: "faixa1-ate-2160",
    faixaPrograma: "faixa1",
    label: "Faixa 1, renda ate R$ 2.160,00",
    rendaMinExclusive: 0,
    rendaMax: 2160,
    mode: "four-cell",
    rates: {
      cotistaNorteNordeste: 4,
      cotistaSulSudesteCentroOeste: 4.25,
      naoCotistaNorteNordeste: 4.5,
      naoCotistaSulSudesteCentroOeste: 4.75,
    },
  },
  {
    id: "faixa1-2160-2850",
    faixaPrograma: "faixa1",
    label: "Faixa 1, R$ 2.160,01 a R$ 2.850,00",
    rendaMinExclusive: 2160,
    rendaMax: 2850,
    mode: "four-cell",
    rates: {
      cotistaNorteNordeste: 4.25,
      cotistaSulSudesteCentroOeste: 4.5,
      naoCotistaNorteNordeste: 4.75,
      naoCotistaSulSudesteCentroOeste: 5,
    },
  },
  {
    id: "faixa1-2850-3200",
    faixaPrograma: "faixa1",
    label: "Faixa 1, R$ 2.850,01 a R$ 3.200,00",
    rendaMinExclusive: 2850,
    rendaMax: 3200,
    mode: "four-cell",
    rates: {
      cotistaNorteNordeste: 4.5,
      cotistaSulSudesteCentroOeste: 4.75,
      naoCotistaNorteNordeste: 5,
      naoCotistaSulSudesteCentroOeste: 5.25,
    },
  },
  {
    id: "faixa2-3200-3500",
    faixaPrograma: "faixa2",
    label: "Faixa 2, R$ 3.200,01 a R$ 3.500,00",
    rendaMinExclusive: 3200,
    rendaMax: 3500,
    mode: "four-cell",
    rates: {
      cotistaNorteNordeste: 4.75,
      cotistaSulSudesteCentroOeste: 5,
      naoCotistaNorteNordeste: 5.25,
      naoCotistaSulSudesteCentroOeste: 5.5,
    },
  },
  {
    id: "faixa2-3500-4000",
    faixaPrograma: "faixa2",
    label: "Faixa 2, R$ 3.500,01 a R$ 4.000,00",
    rendaMinExclusive: 3500,
    rendaMax: 4000,
    mode: "lower-standard",
    rates: {
      lower: 5.5,
      standard: 6,
    },
  },
  {
    id: "faixa2-4000-5000",
    faixaPrograma: "faixa2",
    label: "Faixa 2, R$ 4.000,01 a R$ 5.000,00",
    rendaMinExclusive: 4000,
    rendaMax: 5000,
    mode: "lower-standard",
    rates: {
      lower: 6.5,
      standard: 7,
    },
  },
  {
    id: "faixa3-5000-9600",
    faixaPrograma: "faixa3",
    label: "Faixa 3, R$ 5.000,01 a R$ 9.600,00",
    rendaMinExclusive: 5000,
    rendaMax: 9600,
    mode: "lower-standard",
    rates: {
      lower: 7.66,
      standard: 8.16,
    },
  },
  {
    id: "classe-media-ate-13000",
    faixaPrograma: "classeMedia",
    label: "Classe Media, renda ate R$ 13.000,00",
    rendaMinExclusive: 9600,
    rendaMax: 13000,
    mode: "single",
    rate: 10,
  },
];

export function getDefaultMinhaCasaMinhaVidaInputs(): McmvInputs {
  return {
    rendaMensalBruta: 4500,
    regiao: "sul-sudeste-centro-oeste",
    cotistaFgts: false,
    tipoImovel: "novo",
    valorImovel: 250000,
    limiteLocalFaixa12: null,
    entradaRecursosProprios: 20000,
    fgtsEntrada: 0,
    subsidioInformado: 0,
    prazoMeses: 360,
    metodo: "sac",
    usarTaxaOficial: true,
    taxaNominalAnualManual: null,
    compararMetodos: true,
  };
}

export function isMcmvRegiao(value: string): value is McmvRegiao {
  return value === "norte-nordeste" || value === "sul-sudeste-centro-oeste";
}

export function isMcmvTipoImovel(value: string): value is McmvTipoImovel {
  return value === "novo" || value === "usado" || value === "construcao" || value === "terreno-construcao";
}

export function isMcmvMetodo(value: string): value is McmvMetodo {
  return value === "sac" || value === "price";
}

export function classificarFaixaMinhaCasaMinhaVida(rendaMensalBruta: number): McmvFaixaPrograma {
  if (rendaMensalBruta <= 3200) return "faixa1";
  if (rendaMensalBruta <= 5000) return "faixa2";
  if (rendaMensalBruta <= 9600) return "faixa3";
  if (rendaMensalBruta <= MCMV_LIMITS.maxRendaMcmv) return "classeMedia";
  return "foraMcmv";
}

function isMoney(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= MCMV_LIMITS.maxValorImovelInput;
}

function isIntegerInRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

function normalizeOptionalMoney(value: number | null | undefined): number | null {
  if (value === null || value === undefined || value === 0) return null;
  return round2(value);
}

export function validateMinhaCasaMinhaVidaInputs(inputs: McmvInputs): McmvValidationError[] {
  const errors: McmvValidationError[] = [];

  if (!Number.isFinite(inputs.rendaMensalBruta) || inputs.rendaMensalBruta <= 0 || inputs.rendaMensalBruta > MCMV_LIMITS.maxRendaMensal) {
    errors.push("rendaMensalBruta");
  }
  if (!isMcmvRegiao(inputs.regiao)) errors.push("regiao");
  if (!isMcmvTipoImovel(inputs.tipoImovel)) errors.push("tipoImovel");
  if (!isMoney(inputs.valorImovel) || inputs.valorImovel <= 0) errors.push("valorImovel");
  if (!isMoney(inputs.entradaRecursosProprios)) errors.push("entradaRecursosProprios");
  if (!isMoney(inputs.fgtsEntrada)) errors.push("fgtsEntrada");
  if (!isMoney(inputs.subsidioInformado)) errors.push("subsidioInformado");
  if (inputs.subsidioInformado > inputs.valorImovel) errors.push("subsidioInformado");
  if (!isIntegerInRange(inputs.prazoMeses, 1, MCMV_LIMITS.maxPrazoMeses)) errors.push("prazoMeses");
  if (!isMcmvMetodo(inputs.metodo)) errors.push("metodo");

  if (
    inputs.limiteLocalFaixa12 !== null &&
    inputs.limiteLocalFaixa12 !== 0 &&
    (!Number.isFinite(inputs.limiteLocalFaixa12) ||
      inputs.limiteLocalFaixa12 < MCMV_LIMITS.faixa12PropertyMin ||
      inputs.limiteLocalFaixa12 > MCMV_LIMITS.faixa12PropertyMax)
  ) {
    errors.push("limiteLocalFaixa12");
  }

  if (
    inputs.taxaNominalAnualManual !== null &&
    (!Number.isFinite(inputs.taxaNominalAnualManual) ||
      inputs.taxaNominalAnualManual < 0 ||
      inputs.taxaNominalAnualManual > MCMV_LIMITS.maxTaxaNominalAnualManual)
  ) {
    errors.push("taxaNominalAnualManual");
  }
  if (!inputs.usarTaxaOficial && inputs.taxaNominalAnualManual === null) {
    errors.push("taxaNominalAnualManual");
  }

  const valorFinanciado = inputs.valorImovel - inputs.entradaRecursosProprios - inputs.fgtsEntrada - inputs.subsidioInformado;
  if (Number.isFinite(valorFinanciado) && valorFinanciado <= 0) {
    errors.push("valorFinanciadoEstimado");
  }

  return errors;
}

function normalizarInputs(inputs: McmvInputs): McmvInputs {
  return {
    rendaMensalBruta: round2(inputs.rendaMensalBruta),
    regiao: inputs.regiao,
    cotistaFgts: inputs.cotistaFgts,
    tipoImovel: inputs.tipoImovel,
    valorImovel: round2(inputs.valorImovel),
    limiteLocalFaixa12: normalizeOptionalMoney(inputs.limiteLocalFaixa12),
    entradaRecursosProprios: round2(inputs.entradaRecursosProprios),
    fgtsEntrada: round2(inputs.fgtsEntrada),
    subsidioInformado: round2(inputs.subsidioInformado),
    prazoMeses: inputs.prazoMeses,
    metodo: inputs.metodo,
    usarTaxaOficial: inputs.usarTaxaOficial,
    taxaNominalAnualManual:
      inputs.taxaNominalAnualManual === null ? null : round2(inputs.taxaNominalAnualManual),
    compararMetodos: inputs.compararMetodos,
  };
}

function findRateRow(rendaMensalBruta: number): RateRow | null {
  return RATE_ROWS.find((row) => rendaMensalBruta > row.rendaMinExclusive && rendaMensalBruta <= row.rendaMax) ?? null;
}

export function selecionarTaxaOficialMinhaCasaMinhaVida(params: {
  rendaMensalBruta: number;
  regiao: McmvRegiao;
  cotistaFgts: boolean;
}): McmvRateSelection | null {
  const faixaPrograma = classificarFaixaMinhaCasaMinhaVida(params.rendaMensalBruta);
  if (faixaPrograma === "foraMcmv") return null;

  const row = findRateRow(params.rendaMensalBruta);
  if (!row) return null;

  if (row.mode === "single") {
    return {
      rowId: row.id,
      faixaPrograma: row.faixaPrograma,
      label: row.label,
      rendaMinExclusive: row.rendaMinExclusive,
      rendaMax: row.rendaMax,
      selectionMode: "single",
      selectedColumn: "single",
      taxaNominalAnual: row.rate,
    };
  }

  if (row.mode === "lower-standard") {
    const useLowerRate = params.cotistaFgts || params.regiao === "norte-nordeste";
    return {
      rowId: row.id,
      faixaPrograma: row.faixaPrograma,
      label: row.label,
      rendaMinExclusive: row.rendaMinExclusive,
      rendaMax: row.rendaMax,
      selectionMode: "lower-standard",
      selectedColumn: useLowerRate ? "taxaReduzida" : "taxaPadrao",
      taxaNominalAnual: useLowerRate ? row.rates.lower : row.rates.standard,
    };
  }

  const selectedColumn = params.cotistaFgts
    ? params.regiao === "norte-nordeste"
      ? "cotistaNorteNordeste"
      : "cotistaSulSudesteCentroOeste"
    : params.regiao === "norte-nordeste"
      ? "naoCotistaNorteNordeste"
      : "naoCotistaSulSudesteCentroOeste";

  return {
    rowId: row.id,
    faixaPrograma: row.faixaPrograma,
    label: row.label,
    rendaMinExclusive: row.rendaMinExclusive,
    rendaMax: row.rendaMax,
    selectionMode: "four-cell",
    selectedColumn,
    taxaNominalAnual: row.rates[selectedColumn],
  };
}

export function avaliarLimiteImovelMinhaCasaMinhaVida(inputs: Pick<McmvInputs, "valorImovel" | "limiteLocalFaixa12"> & {
  faixaPrograma: McmvFaixaPrograma;
}): McmvPropertyCapStatus {
  const limiteLocal = normalizeOptionalMoney(inputs.limiteLocalFaixa12);

  if (inputs.faixaPrograma === "faixa1" || inputs.faixaPrograma === "faixa2") {
    if (limiteLocal !== null) {
      return {
        code: inputs.valorImovel <= limiteLocal ? "withinLocalCap" : "aboveLocalCap",
        faixaPrograma: inputs.faixaPrograma,
        limiteMinimoFonte: MCMV_LIMITS.faixa12PropertyMin,
        limiteMaximoFonte: MCMV_LIMITS.faixa12PropertyMax,
        limiteLocalUsado: limiteLocal,
      };
    }

    const code =
      inputs.valorImovel <= MCMV_LIMITS.faixa12PropertyMin
        ? "withinNationalLowerBound"
        : inputs.valorImovel <= MCMV_LIMITS.faixa12PropertyMax
          ? "verifyLocalCap"
          : "aboveSourceRange";

    return {
      code,
      faixaPrograma: inputs.faixaPrograma,
      limiteMinimoFonte: MCMV_LIMITS.faixa12PropertyMin,
      limiteMaximoFonte: MCMV_LIMITS.faixa12PropertyMax,
      limiteLocalUsado: null,
    };
  }

  if (inputs.faixaPrograma === "faixa3") {
    return {
      code: inputs.valorImovel <= MCMV_LIMITS.faixa3PropertyMax ? "withinNationalCap" : "aboveSourceCap",
      faixaPrograma: inputs.faixaPrograma,
      limiteMinimoFonte: null,
      limiteMaximoFonte: MCMV_LIMITS.faixa3PropertyMax,
      limiteLocalUsado: null,
    };
  }

  if (inputs.faixaPrograma === "classeMedia") {
    return {
      code:
        inputs.valorImovel <= MCMV_LIMITS.classeMediaPropertyMax
          ? "withinClasseMediaCap"
          : "aboveClasseMediaCap",
      faixaPrograma: inputs.faixaPrograma,
      limiteMinimoFonte: null,
      limiteMaximoFonte: MCMV_LIMITS.classeMediaPropertyMax,
      limiteLocalUsado: null,
    };
  }

  return {
    code: "outsideProgram",
    faixaPrograma: inputs.faixaPrograma,
    limiteMinimoFonte: null,
    limiteMaximoFonte: null,
    limiteLocalUsado: null,
  };
}

export function avaliarSubsidioMinhaCasaMinhaVida(inputs: Pick<McmvInputs, "rendaMensalBruta" | "regiao" | "subsidioInformado">): McmvSubsidyWarning[] {
  if (inputs.subsidioInformado <= 0) return [];

  if (inputs.rendaMensalBruta <= MCMV_LIMITS.subsidioIncomeCap) {
    const sourceCap =
      inputs.regiao === "norte-nordeste"
        ? MCMV_LIMITS.subsidioMaxNorteNordeste
        : MCMV_LIMITS.subsidioMaxOutrasRegioes;

    return inputs.subsidioInformado > sourceCap ? [{ code: "subsidioAcimaTetoFonte", sourceCap }] : [];
  }

  return [{ code: "subsidioForaFaixaFonte", sourceCap: null }];
}

function calcularParcelaPrice(valorFinanciado: number, taxaMensalDecimal: number, prazoMeses: number): number {
  if (taxaMensalDecimal === 0) return valorFinanciado / prazoMeses;
  return valorFinanciado * (taxaMensalDecimal / (1 - Math.pow(1 + taxaMensalDecimal, -prazoMeses)));
}

function buildSchedule(params: {
  valorFinanciado: number;
  taxaMensalDecimal: number;
  prazoMeses: number;
  metodo: McmvMetodo;
}): {
  parcelas: McmvParcela[];
  resumo: Omit<McmvResumoMetodo, "totalPagoUsuario" | "totalRecursosAplicados">;
} {
  const { valorFinanciado, taxaMensalDecimal, prazoMeses, metodo } = params;
  const parcelas: McmvParcela[] = [];
  const parcelaPrice = metodo === "price" ? round2(calcularParcelaPrice(valorFinanciado, taxaMensalDecimal, prazoMeses)) : 0;
  const amortizacaoSac = metodo === "sac" ? round2(valorFinanciado / prazoMeses) : 0;
  let saldo = round2(valorFinanciado);
  let totalJuros = 0;
  let totalParcelas = 0;

  for (let mes = 1; mes <= prazoMeses; mes++) {
    const saldoInicial = saldo;
    const juros = round2(saldoInicial * taxaMensalDecimal);
    const ultimaParcela = mes === prazoMeses;
    const amortizacao =
      ultimaParcela || saldoInicial <= 0
        ? round2(saldoInicial)
        : metodo === "sac"
          ? round2(Math.min(amortizacaoSac, saldoInicial))
          : round2(Math.min(parcelaPrice - juros, saldoInicial));
    const parcela = round2(amortizacao + juros);
    const saldoFinal = ultimaParcela ? 0 : round2(Math.max(0, saldoInicial - amortizacao));

    parcelas.push({
      mes,
      saldoInicial,
      juros,
      amortizacao,
      parcela,
      saldoFinal,
    });

    saldo = saldoFinal;
    totalJuros = round2(totalJuros + juros);
    totalParcelas = round2(totalParcelas + parcela);
  }

  return {
    parcelas,
    resumo: {
      metodo,
      primeiraParcela: parcelas[0]?.parcela ?? 0,
      ultimaParcela: parcelas[parcelas.length - 1]?.parcela ?? 0,
      totalJuros,
      totalParcelas,
      saldoFinal: parcelas[parcelas.length - 1]?.saldoFinal ?? 0,
    },
  };
}

export function calcularCronogramaMinhaCasaMinhaVida(params: {
  valorFinanciado: number;
  taxaNominalAnual: number;
  prazoMeses: number;
  metodo: McmvMetodo;
}): {
  parcelas: McmvParcela[];
  resumo: Omit<McmvResumoMetodo, "totalPagoUsuario" | "totalRecursosAplicados">;
} {
  return buildSchedule({
    valorFinanciado: params.valorFinanciado,
    taxaMensalDecimal: params.taxaNominalAnual / 12 / 100,
    prazoMeses: params.prazoMeses,
    metodo: params.metodo,
  });
}

function toResumoMetodo(
  resumo: Omit<McmvResumoMetodo, "totalPagoUsuario" | "totalRecursosAplicados">,
  totalEntradaInformada: number,
  subsidioInformado: number
): McmvResumoMetodo {
  const totalPagoUsuario = round2(totalEntradaInformada + resumo.totalParcelas);

  return {
    ...resumo,
    totalPagoUsuario,
    totalRecursosAplicados: round2(totalPagoUsuario + subsidioInformado),
  };
}

function buildUnavailableResumo(metodo: McmvMetodo): McmvResumoMetodo {
  return {
    metodo,
    primeiraParcela: 0,
    ultimaParcela: 0,
    totalJuros: 0,
    totalParcelas: 0,
    totalPagoUsuario: 0,
    totalRecursosAplicados: 0,
    saldoFinal: 0,
  };
}

function buildWarnings(params: {
  inputs: McmvInputs;
  faixaPrograma: McmvFaixaPrograma;
  rateSelection: McmvRateSelection | null;
  propertyCapStatus: McmvPropertyCapStatus;
  subsidyWarnings: McmvSubsidyWarning[];
  ltvEstimado: number;
}): McmvWarningCode[] {
  const warnings = new Set<McmvWarningCode>([
    "estimativaEducativa",
    "fonteVersionada",
    "subsidioNaoCalculado",
    "creditoBancarioNecessario",
    "cetNaoIncluido",
  ]);

  if (!params.inputs.usarTaxaOficial) warnings.add("taxaManual");
  if (params.inputs.usarTaxaOficial && !params.rateSelection) warnings.add("taxaOficialIndisponivel");
  if (params.faixaPrograma === "foraMcmv") warnings.add("foraMcmv");
  if (params.propertyCapStatus.code === "verifyLocalCap") warnings.add("limiteMunicipalNecessario");
  if (
    params.propertyCapStatus.code === "aboveLocalCap" ||
    params.propertyCapStatus.code === "aboveSourceRange" ||
    params.propertyCapStatus.code === "aboveSourceCap" ||
    params.propertyCapStatus.code === "aboveClasseMediaCap"
  ) {
    warnings.add("imovelAcimaLimite");
  }
  if (params.subsidyWarnings.some((warning) => warning.code === "subsidioAcimaTetoFonte")) {
    warnings.add("subsidioAcimaTetoFonte");
  }
  if (params.subsidyWarnings.some((warning) => warning.code === "subsidioForaFaixaFonte")) {
    warnings.add("subsidioForaFaixaFonte");
  }
  if (params.inputs.prazoMeses > MCMV_LIMITS.standardWarningPrazoMeses) warnings.add("prazoAcima360");
  if (
    params.faixaPrograma === "classeMedia" &&
    params.inputs.tipoImovel === "usado" &&
    params.inputs.regiao === "sul-sudeste-centro-oeste" &&
    params.ltvEstimado > 0.6
  ) {
    warnings.add("cotaUsadoClasseMedia");
  }

  return [...warnings];
}

export function calcularFinanciamentoMinhaCasaMinhaVida(inputs: McmvInputs): ResultadoMinhaCasaMinhaVida {
  const validationErrors = validateMinhaCasaMinhaVidaInputs(inputs);
  if (validationErrors.length > 0) {
    throw new RangeError(`Invalid MCMV financing inputs: ${validationErrors.join(", ")}`);
  }

  const normalized = normalizarInputs(inputs);
  const faixaPrograma = classificarFaixaMinhaCasaMinhaVida(normalized.rendaMensalBruta);
  const officialRateSelection = normalized.usarTaxaOficial
    ? selecionarTaxaOficialMinhaCasaMinhaVida({
        rendaMensalBruta: normalized.rendaMensalBruta,
        regiao: normalized.regiao,
        cotistaFgts: normalized.cotistaFgts,
      })
    : null;
  const manualRateSelection: McmvRateSelection | null =
    !normalized.usarTaxaOficial && normalized.taxaNominalAnualManual !== null
      ? {
          rowId: "manual",
          faixaPrograma,
          label: "Taxa nominal anual manual",
          rendaMinExclusive: 0,
          rendaMax: Number.POSITIVE_INFINITY,
          selectionMode: "manual",
          selectedColumn: "manual",
          taxaNominalAnual: normalized.taxaNominalAnualManual,
        }
      : null;
  const rateSelection = officialRateSelection ?? manualRateSelection;
  const taxaNominalAnualSelecionada = rateSelection?.taxaNominalAnual ?? null;
  const taxaMensalParaSimulacao =
    taxaNominalAnualSelecionada === null ? null : taxaNominalAnualSelecionada / 12 / 100;
  const taxaEfetivaAnualEquivalente =
    taxaMensalParaSimulacao === null ? null : Math.pow(1 + taxaMensalParaSimulacao, 12) - 1;

  const totalEntradaInformada = round2(normalized.entradaRecursosProprios + normalized.fgtsEntrada);
  const valorFinanciadoEstimado = round2(normalized.valorImovel - totalEntradaInformada - normalized.subsidioInformado);
  const ltvEstimado = valorFinanciadoEstimado / normalized.valorImovel;
  const propertyCapStatus = avaliarLimiteImovelMinhaCasaMinhaVida({
    faixaPrograma,
    valorImovel: normalized.valorImovel,
    limiteLocalFaixa12: normalized.limiteLocalFaixa12,
  });
  const subsidyWarnings = avaliarSubsidioMinhaCasaMinhaVida(normalized);

  let parcelas: McmvParcela[] = [];
  let mainResumo = buildUnavailableResumo(normalized.metodo);
  let comparacao: McmvComparacao | null = null;
  const calculoDisponivel = taxaMensalParaSimulacao !== null;

  if (calculoDisponivel) {
    const mainSchedule = buildSchedule({
      valorFinanciado: valorFinanciadoEstimado,
      taxaMensalDecimal: taxaMensalParaSimulacao,
      prazoMeses: normalized.prazoMeses,
      metodo: normalized.metodo,
    });
    parcelas = mainSchedule.parcelas;
    mainResumo = toResumoMetodo(mainSchedule.resumo, totalEntradaInformada, normalized.subsidioInformado);

    if (normalized.compararMetodos) {
      const price = toResumoMetodo(
        buildSchedule({
          valorFinanciado: valorFinanciadoEstimado,
          taxaMensalDecimal: taxaMensalParaSimulacao,
          prazoMeses: normalized.prazoMeses,
          metodo: "price",
        }).resumo,
        totalEntradaInformada,
        normalized.subsidioInformado
      );
      const sac = toResumoMetodo(
        buildSchedule({
          valorFinanciado: valorFinanciadoEstimado,
          taxaMensalDecimal: taxaMensalParaSimulacao,
          prazoMeses: normalized.prazoMeses,
          metodo: "sac",
        }).resumo,
        totalEntradaInformada,
        normalized.subsidioInformado
      );

      comparacao = {
        price,
        sac,
        diferencaJuros: round2(price.totalJuros - sac.totalJuros),
        diferencaTotalParcelas: round2(price.totalParcelas - sac.totalParcelas),
      };
    }
  }

  const eligibilityWarnings = buildWarnings({
    inputs: normalized,
    faixaPrograma,
    rateSelection,
    propertyCapStatus,
    subsidyWarnings,
    ltvEstimado,
  });

  return {
    ...mainResumo,
    inputs: normalized,
    calculoDisponivel,
    faixaPrograma,
    subfaixaRendaTaxa: rateSelection,
    taxaNominalAnualSelecionada,
    taxaMensalParaSimulacao,
    taxaEfetivaAnualEquivalente,
    valorBaseImovel: normalized.valorImovel,
    totalEntradaInformada,
    valorSubsidioInformado: normalized.subsidioInformado,
    valorFinanciadoEstimado,
    ltvEstimado,
    propertyCapStatus,
    subsidyWarnings,
    parcelas,
    comparacao,
    eligibilityWarnings,
    sourceVersion: MCMV_SOURCE_METADATA,
  };
}

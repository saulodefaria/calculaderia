import {
  PAYROLL_INSS_EMPREGADO_2026,
  PAYROLL_SALARIO_MINIMO_REFERENCIA_2026,
  PAYROLL_TABLE_YEAR_2026,
  calcularIrrfMensal2026,
  roundPayrollMoney,
  roundPayrollRate,
  type PayrollIrrfResult,
} from "./payroll-2026";

export const SALARIO_PJ_SUPPORTED_TABLE_YEAR = PAYROLL_TABLE_YEAR_2026;
export const SALARIO_PJ_MONEY_MAX = 100_000_000;
export const SALARIO_PJ_SIMPLES_RECEITA_MAX = 4_800_000;
export const SALARIO_PJ_FATOR_R_THRESHOLD = 0.28;
export const SALARIO_PJ_SOURCE_VERSION_2026_07_03 = {
  tableYear: SALARIO_PJ_SUPPORTED_TABLE_YEAR,
  accessedAt: "2026-07-03",
  simplesEffectiveFrom: "2018-01",
  simplesPerguntaoUpdatedAt: "2025-11-21",
  inssEffectiveFrom: "2026-01",
  irrfEffectiveFrom: "2026-01",
  salarioMinimoReferencia: PAYROLL_SALARIO_MINIMO_REFERENCIA_2026,
  inssCeiling: PAYROLL_INSS_EMPREGADO_2026[PAYROLL_INSS_EMPREGADO_2026.length - 1].limit,
} as const;

export type SalarioPjAnexo = "III" | "V";
export type SalarioPjAnexoAplicado = SalarioPjAnexo | "manual";
export type SalarioPjAnexoMode = "autoFatorR" | "anexoIII" | "anexoV" | "aliquotaManual";
export type SalarioPjInssPessoaFisicaMode =
  | "contribuinteIndividual20"
  | "simplificado11Minimo"
  | "mei5Minimo"
  | "manual"
  | "none";

export type SalarioPjWarningCode =
  | "estimativaEducativa"
  | "fontesConsultadas"
  | "urlSensivel"
  | "rbt12Fs12Aproximados"
  | "fatorRAproximado"
  | "aliquotaManual"
  | "receitaAcimaLimiteSimples"
  | "rbt12AcimaLimiteSimples"
  | "atividadeMistaForaEscopo"
  | "anexoIvForaEscopo"
  | "proLaboreAssumido"
  | "inssSimplificado"
  | "inssMeiReferencia"
  | "inssManual"
  | "inssNaoCalculado"
  | "irrfDesativado"
  | "meiNaoModelado"
  | "lucroDistribuivelNaoValidado";

export type SalarioPjValidationError =
  | "receitaMensal"
  | "receitaMensalObrigatoria"
  | "rbt12"
  | "rbt12Obrigatorio"
  | "fs12"
  | "anexoMode"
  | "aliquotaManualEfetiva"
  | "proLaboreMensal"
  | "inssPessoaFisicaMode"
  | "inssManual"
  | "dependentesIr"
  | "pensaoAlimenticia"
  | "contabilidadeMensal"
  | "custosOperacionais"
  | "beneficiosPessoais"
  | "outrasRetencoes"
  | "tabelaAno";

export interface SalarioPjInputs {
  receitaMensal: number;
  rbt12: number;
  fs12: number;
  anexoMode: SalarioPjAnexoMode;
  aliquotaManualEfetiva: number;
  proLaboreMensal: number;
  inssPessoaFisicaMode: SalarioPjInssPessoaFisicaMode;
  inssManual: number;
  calcularIrrfProLabore: boolean;
  dependentesIr: number;
  pensaoAlimenticia: number;
  contabilidadeMensal: number;
  custosOperacionais: number;
  beneficiosPessoais: number;
  outrasRetencoes: number;
  tabelaAno: typeof SALARIO_PJ_SUPPORTED_TABLE_YEAR;
}

export interface SalarioPjSimplesBracket {
  anexo: SalarioPjAnexo;
  faixa: 1 | 2 | 3 | 4 | 5 | 6;
  minExclusive: number;
  max: number;
  aliquotaNominal: number;
  parcelaDeduzir: number;
}

export interface SalarioPjInssPessoaFisicaResult {
  mode: SalarioPjInssPessoaFisicaMode;
  baseContribuicaoPf: number;
  inssPessoaFisica: number;
  aliquota: number;
  tetoAplicado: number;
}

export type SalarioPjBreakdownCategory = "receita" | "empresa" | "pessoal" | "custos" | "liquido";

export type SalarioPjBreakdownId =
  | "receitaMensal"
  | "dasEstimado"
  | "inssPessoaFisica"
  | "irrfProLabore"
  | "contabilidadeMensal"
  | "custosOperacionais"
  | "beneficiosPessoais"
  | "outrasRetencoes"
  | "liquidoDisponivel";

export interface SalarioPjBreakdownRow {
  id: SalarioPjBreakdownId;
  categoria: SalarioPjBreakdownCategory;
  valor: number;
  aplicavel: boolean;
  detalhe?: string;
  base?: number;
}

export interface ResultadoSalarioPj {
  inputs: SalarioPjInputs;
  receitaMensal: number;
  rbt12: number;
  fs12: number;
  fatorR: number | null;
  anexoAplicado: SalarioPjAnexoAplicado;
  faixaSimples: SalarioPjSimplesBracket | null;
  aliquotaNominal: number;
  parcelaDeduzir: number;
  aliquotaEfetivaSimples: number;
  dasEstimado: number;
  inssPessoaFisica: number;
  inssPessoaFisicaMemo: SalarioPjInssPessoaFisicaResult;
  baseContribuicaoPf: number;
  calcularIrrfProLabore: boolean;
  baseIrrfProLabore: number;
  baseIrrfPadrao: number;
  baseIrrfSimplificada: number;
  tipoBaseIrrfUsada: PayrollIrrfResult["tipoBaseIrrfUsada"];
  deducaoDependentes: number;
  irrfAntesReducao: number;
  reducaoIrrfMensal: number;
  irrfProLabore: number;
  irrfMemo: PayrollIrrfResult;
  contabilidadeMensal: number;
  custosOperacionais: number;
  beneficiosPessoais: number;
  outrasRetencoes: number;
  custosTotais: number;
  liquidoDisponivel: number;
  taxaEfetivaTotal: number;
  proLaboreLiquidoEstimado: number;
  saldoEmpresarialAposCustos: number;
  valorDisponivelAlemProLabore: number;
  breakdown: SalarioPjBreakdownRow[];
  warnings: SalarioPjWarningCode[];
  sourceVersion: typeof SALARIO_PJ_SOURCE_VERSION_2026_07_03;
}

export const SALARIO_PJ_ANEXO_III_TABLE_2018_PLUS: SalarioPjSimplesBracket[] = [
  { anexo: "III", faixa: 1, minExclusive: 0, max: 180_000, aliquotaNominal: 0.06, parcelaDeduzir: 0 },
  { anexo: "III", faixa: 2, minExclusive: 180_000, max: 360_000, aliquotaNominal: 0.112, parcelaDeduzir: 9_360 },
  { anexo: "III", faixa: 3, minExclusive: 360_000, max: 720_000, aliquotaNominal: 0.135, parcelaDeduzir: 17_640 },
  { anexo: "III", faixa: 4, minExclusive: 720_000, max: 1_800_000, aliquotaNominal: 0.16, parcelaDeduzir: 35_640 },
  { anexo: "III", faixa: 5, minExclusive: 1_800_000, max: 3_600_000, aliquotaNominal: 0.21, parcelaDeduzir: 125_640 },
  { anexo: "III", faixa: 6, minExclusive: 3_600_000, max: 4_800_000, aliquotaNominal: 0.33, parcelaDeduzir: 648_000 },
];

export const SALARIO_PJ_ANEXO_V_TABLE_2018_PLUS: SalarioPjSimplesBracket[] = [
  { anexo: "V", faixa: 1, minExclusive: 0, max: 180_000, aliquotaNominal: 0.155, parcelaDeduzir: 0 },
  { anexo: "V", faixa: 2, minExclusive: 180_000, max: 360_000, aliquotaNominal: 0.18, parcelaDeduzir: 4_500 },
  { anexo: "V", faixa: 3, minExclusive: 360_000, max: 720_000, aliquotaNominal: 0.195, parcelaDeduzir: 9_900 },
  { anexo: "V", faixa: 4, minExclusive: 720_000, max: 1_800_000, aliquotaNominal: 0.205, parcelaDeduzir: 17_100 },
  { anexo: "V", faixa: 5, minExclusive: 1_800_000, max: 3_600_000, aliquotaNominal: 0.23, parcelaDeduzir: 62_100 },
  { anexo: "V", faixa: 6, minExclusive: 3_600_000, max: 4_800_000, aliquotaNominal: 0.305, parcelaDeduzir: 540_000 },
];

function isMoney(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= SALARIO_PJ_MONEY_MAX;
}

function isIntegerRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

export function isSalarioPjAnexoMode(value: string): value is SalarioPjAnexoMode {
  return value === "autoFatorR" || value === "anexoIII" || value === "anexoV" || value === "aliquotaManual";
}

export function isSalarioPjInssPessoaFisicaMode(value: string): value is SalarioPjInssPessoaFisicaMode {
  return (
    value === "contribuinteIndividual20" ||
    value === "simplificado11Minimo" ||
    value === "mei5Minimo" ||
    value === "manual" ||
    value === "none"
  );
}

export function getDefaultSalarioPjInputs(): SalarioPjInputs {
  return {
    receitaMensal: 10_000,
    rbt12: 120_000,
    fs12: PAYROLL_SALARIO_MINIMO_REFERENCIA_2026 * 12,
    anexoMode: "autoFatorR",
    aliquotaManualEfetiva: 0,
    proLaboreMensal: PAYROLL_SALARIO_MINIMO_REFERENCIA_2026,
    inssPessoaFisicaMode: "contribuinteIndividual20",
    inssManual: 324.2,
    calcularIrrfProLabore: true,
    dependentesIr: 0,
    pensaoAlimenticia: 0,
    contabilidadeMensal: 200,
    custosOperacionais: 0,
    beneficiosPessoais: 0,
    outrasRetencoes: 0,
    tabelaAno: SALARIO_PJ_SUPPORTED_TABLE_YEAR,
  };
}

export function validateSalarioPjInputs(inputs: SalarioPjInputs): SalarioPjValidationError[] {
  const errors: SalarioPjValidationError[] = [];
  const moneyFields: Array<[SalarioPjValidationError, number]> = [
    ["receitaMensal", inputs.receitaMensal],
    ["rbt12", inputs.rbt12],
    ["fs12", inputs.fs12],
    ["proLaboreMensal", inputs.proLaboreMensal],
    ["inssManual", inputs.inssManual],
    ["pensaoAlimenticia", inputs.pensaoAlimenticia],
    ["contabilidadeMensal", inputs.contabilidadeMensal],
    ["custosOperacionais", inputs.custosOperacionais],
    ["beneficiosPessoais", inputs.beneficiosPessoais],
    ["outrasRetencoes", inputs.outrasRetencoes],
  ];

  for (const [field, value] of moneyFields) {
    if (!isMoney(value)) errors.push(field);
  }

  if (inputs.receitaMensal <= 0) errors.push("receitaMensalObrigatoria");
  if (inputs.anexoMode !== "aliquotaManual" && inputs.rbt12 <= 0) errors.push("rbt12Obrigatorio");
  if (!isSalarioPjAnexoMode(inputs.anexoMode)) errors.push("anexoMode");
  if (!isSalarioPjInssPessoaFisicaMode(inputs.inssPessoaFisicaMode)) errors.push("inssPessoaFisicaMode");
  if (!Number.isFinite(inputs.aliquotaManualEfetiva) || inputs.aliquotaManualEfetiva < 0 || inputs.aliquotaManualEfetiva > 1) {
    errors.push("aliquotaManualEfetiva");
  }
  if (!isIntegerRange(inputs.dependentesIr, 0, 20)) errors.push("dependentesIr");
  if (inputs.tabelaAno !== SALARIO_PJ_SUPPORTED_TABLE_YEAR) errors.push("tabelaAno");

  return errors;
}

function getTableForAnexo(anexo: SalarioPjAnexo): SalarioPjSimplesBracket[] {
  return anexo === "III" ? SALARIO_PJ_ANEXO_III_TABLE_2018_PLUS : SALARIO_PJ_ANEXO_V_TABLE_2018_PLUS;
}

export function selectSalarioPjSimplesBracket(anexo: SalarioPjAnexo, rbt12: number): SalarioPjSimplesBracket {
  const table = getTableForAnexo(anexo);
  return table.find((bracket) => rbt12 <= bracket.max) ?? table[table.length - 1];
}

export function calcularSalarioPjFatorR(fs12: number, rbt12: number): number | null {
  const fatorRRaw = calcularSalarioPjFatorRRaw(fs12, rbt12);
  return fatorRRaw === null ? null : roundPayrollRate(fatorRRaw);
}

function calcularSalarioPjFatorRRaw(fs12: number, rbt12: number): number | null {
  if (rbt12 <= 0) return null;
  return fs12 / rbt12;
}

function resolveAnexoAplicado(inputs: SalarioPjInputs, fatorRRaw: number | null): SalarioPjAnexoAplicado {
  if (inputs.anexoMode === "aliquotaManual") return "manual";
  if (inputs.anexoMode === "anexoIII") return "III";
  if (inputs.anexoMode === "anexoV") return "V";
  return fatorRRaw !== null && fatorRRaw >= SALARIO_PJ_FATOR_R_THRESHOLD ? "III" : "V";
}

function calcularSimples(inputs: SalarioPjInputs, anexoAplicado: SalarioPjAnexoAplicado) {
  if (anexoAplicado === "manual") {
    const aliquotaEfetivaSimples = roundPayrollRate(inputs.aliquotaManualEfetiva);
    return {
      faixaSimples: null,
      aliquotaNominal: 0,
      parcelaDeduzir: 0,
      aliquotaEfetivaSimples,
      dasEstimado: roundPayrollMoney(inputs.receitaMensal * aliquotaEfetivaSimples),
    };
  }

  const faixaSimples = selectSalarioPjSimplesBracket(anexoAplicado, inputs.rbt12);
  const aliquotaEfetivaRaw = Math.max(
    0,
    (inputs.rbt12 * faixaSimples.aliquotaNominal - faixaSimples.parcelaDeduzir) / inputs.rbt12
  );
  const aliquotaEfetivaSimples = roundPayrollRate(aliquotaEfetivaRaw);

  return {
    faixaSimples,
    aliquotaNominal: faixaSimples.aliquotaNominal,
    parcelaDeduzir: faixaSimples.parcelaDeduzir,
    aliquotaEfetivaSimples,
    dasEstimado: roundPayrollMoney(inputs.receitaMensal * aliquotaEfetivaRaw),
  };
}

function calcularInssPessoaFisica(inputs: SalarioPjInputs): SalarioPjInssPessoaFisicaResult {
  const tetoAplicado = SALARIO_PJ_SOURCE_VERSION_2026_07_03.inssCeiling;

  if (inputs.inssPessoaFisicaMode === "contribuinteIndividual20") {
    const baseContribuicaoPf = roundPayrollMoney(
      Math.min(Math.max(inputs.proLaboreMensal, PAYROLL_SALARIO_MINIMO_REFERENCIA_2026), tetoAplicado)
    );
    return {
      mode: inputs.inssPessoaFisicaMode,
      baseContribuicaoPf,
      inssPessoaFisica: roundPayrollMoney(baseContribuicaoPf * 0.2),
      aliquota: 0.2,
      tetoAplicado,
    };
  }

  if (inputs.inssPessoaFisicaMode === "simplificado11Minimo") {
    return {
      mode: inputs.inssPessoaFisicaMode,
      baseContribuicaoPf: PAYROLL_SALARIO_MINIMO_REFERENCIA_2026,
      inssPessoaFisica: roundPayrollMoney(PAYROLL_SALARIO_MINIMO_REFERENCIA_2026 * 0.11),
      aliquota: 0.11,
      tetoAplicado,
    };
  }

  if (inputs.inssPessoaFisicaMode === "mei5Minimo") {
    return {
      mode: inputs.inssPessoaFisicaMode,
      baseContribuicaoPf: PAYROLL_SALARIO_MINIMO_REFERENCIA_2026,
      inssPessoaFisica: roundPayrollMoney(PAYROLL_SALARIO_MINIMO_REFERENCIA_2026 * 0.05),
      aliquota: 0.05,
      tetoAplicado,
    };
  }

  if (inputs.inssPessoaFisicaMode === "manual") {
    return {
      mode: inputs.inssPessoaFisicaMode,
      baseContribuicaoPf: roundPayrollMoney(inputs.proLaboreMensal),
      inssPessoaFisica: roundPayrollMoney(inputs.inssManual),
      aliquota: inputs.proLaboreMensal > 0 ? roundPayrollRate(inputs.inssManual / inputs.proLaboreMensal) : 0,
      tetoAplicado,
    };
  }

  return {
    mode: inputs.inssPessoaFisicaMode,
    baseContribuicaoPf: 0,
    inssPessoaFisica: 0,
    aliquota: 0,
    tetoAplicado,
  };
}

function calcularIrrfProLabore(inputs: SalarioPjInputs, inssPessoaFisica: number): PayrollIrrfResult {
  if (!inputs.calcularIrrfProLabore) {
    return calcularIrrfMensal2026({
      rendimentosTributaveis: 0,
      inss: 0,
      dependentes: 0,
      pensaoAlimenticia: 0,
    });
  }

  return calcularIrrfMensal2026({
    rendimentosTributaveis: inputs.proLaboreMensal,
    inss: inssPessoaFisica,
    dependentes: inputs.dependentesIr,
    pensaoAlimenticia: inputs.pensaoAlimenticia,
  });
}

function buildWarnings(inputs: SalarioPjInputs, anexoAplicado: SalarioPjAnexoAplicado): SalarioPjWarningCode[] {
  const warnings: SalarioPjWarningCode[] = [
    "estimativaEducativa",
    "fontesConsultadas",
    "urlSensivel",
    "rbt12Fs12Aproximados",
    "atividadeMistaForaEscopo",
    "anexoIvForaEscopo",
    "proLaboreAssumido",
    "meiNaoModelado",
    "lucroDistribuivelNaoValidado",
  ];

  if (inputs.anexoMode === "autoFatorR") warnings.push("fatorRAproximado");
  if (anexoAplicado === "manual") warnings.push("aliquotaManual");
  if (inputs.receitaMensal * 12 > SALARIO_PJ_SIMPLES_RECEITA_MAX) warnings.push("receitaAcimaLimiteSimples");
  if (inputs.rbt12 > SALARIO_PJ_SIMPLES_RECEITA_MAX) warnings.push("rbt12AcimaLimiteSimples");
  if (inputs.inssPessoaFisicaMode === "simplificado11Minimo") warnings.push("inssSimplificado");
  if (inputs.inssPessoaFisicaMode === "mei5Minimo") warnings.push("inssMeiReferencia");
  if (inputs.inssPessoaFisicaMode === "manual") warnings.push("inssManual");
  if (inputs.inssPessoaFisicaMode === "none") warnings.push("inssNaoCalculado");
  if (!inputs.calcularIrrfProLabore) warnings.push("irrfDesativado");

  return warnings;
}

export function calcularSalarioPj(inputs: SalarioPjInputs): ResultadoSalarioPj {
  const validationErrors = validateSalarioPjInputs(inputs);
  if (validationErrors.length > 0) {
    throw new RangeError(`Invalid salario-pj inputs: ${validationErrors.join(", ")}`);
  }

  const normalizedInputs: SalarioPjInputs = {
    ...inputs,
    receitaMensal: roundPayrollMoney(inputs.receitaMensal),
    rbt12: roundPayrollMoney(inputs.rbt12),
    fs12: roundPayrollMoney(inputs.fs12),
    aliquotaManualEfetiva: roundPayrollRate(inputs.aliquotaManualEfetiva),
    proLaboreMensal: roundPayrollMoney(inputs.proLaboreMensal),
    inssManual: roundPayrollMoney(inputs.inssManual),
    pensaoAlimenticia: roundPayrollMoney(inputs.pensaoAlimenticia),
    contabilidadeMensal: roundPayrollMoney(inputs.contabilidadeMensal),
    custosOperacionais: roundPayrollMoney(inputs.custosOperacionais),
    beneficiosPessoais: roundPayrollMoney(inputs.beneficiosPessoais),
    outrasRetencoes: roundPayrollMoney(inputs.outrasRetencoes),
    tabelaAno: SALARIO_PJ_SUPPORTED_TABLE_YEAR,
  };
  const fatorRRaw = calcularSalarioPjFatorRRaw(normalizedInputs.fs12, normalizedInputs.rbt12);
  const fatorR = fatorRRaw === null ? null : roundPayrollRate(fatorRRaw);
  const anexoAplicado = resolveAnexoAplicado(normalizedInputs, fatorRRaw);
  const simples = calcularSimples(normalizedInputs, anexoAplicado);
  const inssPessoaFisicaMemo = calcularInssPessoaFisica(normalizedInputs);
  const irrfMemo = calcularIrrfProLabore(normalizedInputs, inssPessoaFisicaMemo.inssPessoaFisica);
  const irrfProLabore = normalizedInputs.calcularIrrfProLabore ? irrfMemo.irrf : 0;
  const custosTotais = roundPayrollMoney(
    simples.dasEstimado +
      inssPessoaFisicaMemo.inssPessoaFisica +
      irrfProLabore +
      normalizedInputs.contabilidadeMensal +
      normalizedInputs.custosOperacionais +
      normalizedInputs.beneficiosPessoais +
      normalizedInputs.outrasRetencoes
  );
  const liquidoDisponivel = roundPayrollMoney(Math.max(0, normalizedInputs.receitaMensal - custosTotais));
  const proLaboreLiquidoEstimado = roundPayrollMoney(
    Math.max(0, normalizedInputs.proLaboreMensal - inssPessoaFisicaMemo.inssPessoaFisica - irrfProLabore)
  );
  const saldoEmpresarialAposCustos = roundPayrollMoney(
    Math.max(
      0,
      normalizedInputs.receitaMensal -
        simples.dasEstimado -
        normalizedInputs.contabilidadeMensal -
        normalizedInputs.custosOperacionais -
        normalizedInputs.outrasRetencoes
    )
  );
  const valorDisponivelAlemProLabore = roundPayrollMoney(
    Math.max(0, liquidoDisponivel - proLaboreLiquidoEstimado)
  );
  const warnings = buildWarnings(normalizedInputs, anexoAplicado);
  const taxaEfetivaTotal =
    normalizedInputs.receitaMensal > 0 ? roundPayrollRate(custosTotais / normalizedInputs.receitaMensal) : 0;

  const breakdown: SalarioPjBreakdownRow[] = [
    {
      id: "receitaMensal",
      categoria: "receita",
      valor: normalizedInputs.receitaMensal,
      aplicavel: true,
    },
    {
      id: "dasEstimado",
      categoria: "empresa",
      valor: simples.dasEstimado,
      aplicavel: true,
      detalhe: anexoAplicado === "manual" ? "manual" : `anexo${anexoAplicado}`,
      base: normalizedInputs.rbt12,
    },
    {
      id: "inssPessoaFisica",
      categoria: "pessoal",
      valor: inssPessoaFisicaMemo.inssPessoaFisica,
      aplicavel: normalizedInputs.inssPessoaFisicaMode !== "none",
      detalhe: normalizedInputs.inssPessoaFisicaMode,
      base: inssPessoaFisicaMemo.baseContribuicaoPf,
    },
    {
      id: "irrfProLabore",
      categoria: "pessoal",
      valor: irrfProLabore,
      aplicavel: normalizedInputs.calcularIrrfProLabore,
      detalhe: irrfMemo.tipoBaseIrrfUsada,
      base: irrfMemo.baseIrrfUsada,
    },
    {
      id: "contabilidadeMensal",
      categoria: "custos",
      valor: normalizedInputs.contabilidadeMensal,
      aplicavel: normalizedInputs.contabilidadeMensal > 0,
    },
    {
      id: "custosOperacionais",
      categoria: "custos",
      valor: normalizedInputs.custosOperacionais,
      aplicavel: normalizedInputs.custosOperacionais > 0,
    },
    {
      id: "beneficiosPessoais",
      categoria: "custos",
      valor: normalizedInputs.beneficiosPessoais,
      aplicavel: normalizedInputs.beneficiosPessoais > 0,
    },
    {
      id: "outrasRetencoes",
      categoria: "custos",
      valor: normalizedInputs.outrasRetencoes,
      aplicavel: normalizedInputs.outrasRetencoes > 0,
    },
    {
      id: "liquidoDisponivel",
      categoria: "liquido",
      valor: liquidoDisponivel,
      aplicavel: true,
    },
  ];

  return {
    inputs: normalizedInputs,
    receitaMensal: normalizedInputs.receitaMensal,
    rbt12: normalizedInputs.rbt12,
    fs12: normalizedInputs.fs12,
    fatorR,
    anexoAplicado,
    faixaSimples: simples.faixaSimples,
    aliquotaNominal: simples.aliquotaNominal,
    parcelaDeduzir: simples.parcelaDeduzir,
    aliquotaEfetivaSimples: simples.aliquotaEfetivaSimples,
    dasEstimado: simples.dasEstimado,
    inssPessoaFisica: inssPessoaFisicaMemo.inssPessoaFisica,
    inssPessoaFisicaMemo,
    baseContribuicaoPf: inssPessoaFisicaMemo.baseContribuicaoPf,
    calcularIrrfProLabore: normalizedInputs.calcularIrrfProLabore,
    baseIrrfProLabore: normalizedInputs.calcularIrrfProLabore ? irrfMemo.baseIrrfUsada : 0,
    baseIrrfPadrao: normalizedInputs.calcularIrrfProLabore ? irrfMemo.baseIrrfPadrao : 0,
    baseIrrfSimplificada: normalizedInputs.calcularIrrfProLabore ? irrfMemo.baseIrrfSimplificada : 0,
    tipoBaseIrrfUsada: irrfMemo.tipoBaseIrrfUsada,
    deducaoDependentes: normalizedInputs.calcularIrrfProLabore ? irrfMemo.deducaoDependentes : 0,
    irrfAntesReducao: normalizedInputs.calcularIrrfProLabore ? irrfMemo.irrfAntesReducao : 0,
    reducaoIrrfMensal: normalizedInputs.calcularIrrfProLabore ? irrfMemo.reducaoIrrfMensal : 0,
    irrfProLabore,
    irrfMemo,
    contabilidadeMensal: normalizedInputs.contabilidadeMensal,
    custosOperacionais: normalizedInputs.custosOperacionais,
    beneficiosPessoais: normalizedInputs.beneficiosPessoais,
    outrasRetencoes: normalizedInputs.outrasRetencoes,
    custosTotais,
    liquidoDisponivel,
    taxaEfetivaTotal,
    proLaboreLiquidoEstimado,
    saldoEmpresarialAposCustos,
    valorDisponivelAlemProLabore,
    breakdown,
    warnings,
    sourceVersion: SALARIO_PJ_SOURCE_VERSION_2026_07_03,
  };
}

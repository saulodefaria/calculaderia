import {
  PAYROLL_INSS_EMPREGADO_2026,
  PAYROLL_IRRF_2026_DEPENDENT_DEDUCTION,
  PAYROLL_IRRF_2026_SIMPLIFIED_DISCOUNT_LIMIT,
  PAYROLL_IRRF_MENSAL_2026,
  PAYROLL_MONEY_MAX,
  PAYROLL_SALARIO_MINIMO_REFERENCIA_2026,
  PAYROLL_TABLE_YEAR_2026,
  calcularInssEmpregado2026,
  calcularIrrfMensal2026,
  calcularReducaoMensalIrrf2026,
  isPayrollMoney,
  roundPayrollMoney,
  roundPayrollRate,
  type PayrollInssResult,
  type PayrollIrrfBaseType,
  type PayrollIrrfResult,
} from "./payroll-2026";

export const INSS_IRRF_SUPPORTED_TABLE_YEAR = PAYROLL_TABLE_YEAR_2026;
export const INSS_IRRF_SUPPORTED_SOURCE_VERSION = "2026-07-07" as const;

export const INSS_IRRF_SOURCE_VERSION_2026_07_07 = {
  tableYear: INSS_IRRF_SUPPORTED_TABLE_YEAR,
  sourceVersion: INSS_IRRF_SUPPORTED_SOURCE_VERSION,
  accessedAt: INSS_IRRF_SUPPORTED_SOURCE_VERSION,
  inssEffectiveFrom: "2026-01",
  irrfEffectiveFrom: "2026-01",
  minimumReferenceSalary: PAYROLL_SALARIO_MINIMO_REFERENCIA_2026,
  inssCeiling: PAYROLL_INSS_EMPREGADO_2026[PAYROLL_INSS_EMPREGADO_2026.length - 1].limit,
} as const;

export type InssIrrfCategoriaSegurado = "empregado" | "domestico" | "avulso";

export type InssIrrfWarningCode =
  | "tabelasInssIrrf2026"
  | "salarioAbaixoReferencia"
  | "tetoInssAplicado"
  | "multiplosVinculosFontes"
  | "descontoSimplificadoComparado"
  | "descontoSimplificadoDesativado"
  | "naoHolerite"
  | "estimativaEducativa"
  | "fontesConsultadas";

export type InssIrrfValidationError =
  | "rendimentosTributaveis"
  | "rendimentosTributaveisObrigatorio"
  | "outrosRendimentosTributaveis"
  | "categoriaSegurado"
  | "dependentesIr"
  | "pensaoAlimenticia"
  | "considerarDescontoSimplificado"
  | "tabelaAno";

export interface InssIrrfInputs {
  rendimentosTributaveis: number;
  outrosRendimentosTributaveis: number;
  categoriaSegurado: InssIrrfCategoriaSegurado;
  dependentesIr: number;
  pensaoAlimenticia: number;
  considerarDescontoSimplificado: boolean;
  tabelaAno: typeof INSS_IRRF_SUPPORTED_TABLE_YEAR;
}

export interface ResultadoInssIrrf {
  rendimentosTributaveis: number;
  outrosRendimentosTributaveis: number;
  categoriaSegurado: InssIrrfCategoriaSegurado;
  dependentesIr: number;
  pensaoAlimenticia: number;
  considerarDescontoSimplificado: boolean;
  tabelaAno: typeof INSS_IRRF_SUPPORTED_TABLE_YEAR;
  baseTributavelInformada: number;
  baseInss: number;
  inss: number;
  aliquotaEfetivaInss: number;
  tetoInss: number;
  deducaoDependentes: number;
  baseIrrfPadrao: number;
  baseIrrfSimplificada: number;
  baseIrrfUsada: number;
  tipoBaseIrrfUsada: PayrollIrrfBaseType;
  aliquotaFaixaIrrf: number;
  parcelaDeduzirIrrf: number;
  irrfAntesReducao: number;
  reducaoIrrfMensal: number;
  irrf: number;
  totalInssIrrf: number;
  saldoAposInssIrrf: number;
  aliquotaEfetivaLegal: number;
  inssMemo: PayrollInssResult;
  irrfMemo: PayrollIrrfResult;
  warnings: InssIrrfWarningCode[];
  sourceVersion: typeof INSS_IRRF_SOURCE_VERSION_2026_07_07;
}

export function getDefaultInssIrrfInputs(): InssIrrfInputs {
  return {
    rendimentosTributaveis: 3000,
    outrosRendimentosTributaveis: 0,
    categoriaSegurado: "empregado",
    dependentesIr: 0,
    pensaoAlimenticia: 0,
    considerarDescontoSimplificado: true,
    tabelaAno: INSS_IRRF_SUPPORTED_TABLE_YEAR,
  };
}

export function isInssIrrfCategoriaSegurado(value: string): value is InssIrrfCategoriaSegurado {
  return value === "empregado" || value === "domestico" || value === "avulso";
}

function isIntegerRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

export function validateInssIrrfInputs(inputs: InssIrrfInputs): InssIrrfValidationError[] {
  const errors: InssIrrfValidationError[] = [];

  if (!isPayrollMoney(inputs.rendimentosTributaveis)) errors.push("rendimentosTributaveis");
  if (inputs.rendimentosTributaveis <= 0) errors.push("rendimentosTributaveisObrigatorio");
  if (!isPayrollMoney(inputs.outrosRendimentosTributaveis)) errors.push("outrosRendimentosTributaveis");
  if (!isInssIrrfCategoriaSegurado(inputs.categoriaSegurado)) errors.push("categoriaSegurado");
  if (!isIntegerRange(inputs.dependentesIr, 0, 20)) errors.push("dependentesIr");
  if (!isPayrollMoney(inputs.pensaoAlimenticia)) errors.push("pensaoAlimenticia");
  if (typeof inputs.considerarDescontoSimplificado !== "boolean") errors.push("considerarDescontoSimplificado");
  if (inputs.tabelaAno !== INSS_IRRF_SUPPORTED_TABLE_YEAR) errors.push("tabelaAno");

  return errors;
}

function calcularIrrfMensalPadrao2026(input: {
  rendimentosTributaveis: number;
  inss: number;
  dependentes: number;
  pensaoAlimenticia: number;
}): PayrollIrrfResult {
  const rendimentosTributaveis = Math.max(0, input.rendimentosTributaveis);
  const inss = Math.max(0, input.inss);
  const dependentes = Math.max(0, input.dependentes);
  const pensaoAlimenticia = Math.max(0, input.pensaoAlimenticia);
  const deducaoDependentes = roundPayrollMoney(dependentes * PAYROLL_IRRF_2026_DEPENDENT_DEDUCTION);
  const baseIrrfPadrao = roundPayrollMoney(
    Math.max(0, rendimentosTributaveis - inss - deducaoDependentes - pensaoAlimenticia)
  );
  const baseIrrfSimplificada = roundPayrollMoney(
    Math.max(0, rendimentosTributaveis - PAYROLL_IRRF_2026_SIMPLIFIED_DISCOUNT_LIMIT)
  );
  const bracket = PAYROLL_IRRF_MENSAL_2026.find((entry) => baseIrrfPadrao <= entry.limit) ?? PAYROLL_IRRF_MENSAL_2026[0];
  const irrfAntesReducaoRaw = Math.max(0, baseIrrfPadrao * bracket.rate - bracket.deduction);
  const reducaoIrrfMensal = calcularReducaoMensalIrrf2026(rendimentosTributaveis, irrfAntesReducaoRaw);

  return {
    deducaoDependentes,
    baseIrrfPadrao,
    baseIrrfSimplificada,
    baseIrrfUsada: baseIrrfPadrao,
    tipoBaseIrrfUsada: "padrao",
    aliquotaFaixa: bracket.rate,
    parcelaDeduzir: bracket.deduction,
    irrfAntesReducao: roundPayrollMoney(irrfAntesReducaoRaw),
    reducaoIrrfMensal,
    irrf: roundPayrollMoney(Math.max(0, irrfAntesReducaoRaw - reducaoIrrfMensal)),
  };
}

function buildWarnings(inputs: InssIrrfInputs, baseTributavelInformada: number, tetoInss: number): InssIrrfWarningCode[] {
  const warnings: InssIrrfWarningCode[] = [
    "tabelasInssIrrf2026",
    "multiplosVinculosFontes",
    "naoHolerite",
    "estimativaEducativa",
    "fontesConsultadas",
  ];

  if (baseTributavelInformada < PAYROLL_SALARIO_MINIMO_REFERENCIA_2026) warnings.push("salarioAbaixoReferencia");
  if (baseTributavelInformada > tetoInss) warnings.push("tetoInssAplicado");
  if (inputs.considerarDescontoSimplificado) warnings.push("descontoSimplificadoComparado");
  if (!inputs.considerarDescontoSimplificado) warnings.push("descontoSimplificadoDesativado");

  return warnings;
}

export function calcularInssIrrf(inputs: InssIrrfInputs): ResultadoInssIrrf {
  const validationErrors = validateInssIrrfInputs(inputs);
  if (validationErrors.length > 0) {
    throw new RangeError(`Invalid inss-irrf inputs: ${validationErrors.join(", ")}`);
  }

  const rendimentosTributaveis = roundPayrollMoney(inputs.rendimentosTributaveis);
  const outrosRendimentosTributaveis = roundPayrollMoney(inputs.outrosRendimentosTributaveis);
  const pensaoAlimenticia = roundPayrollMoney(inputs.pensaoAlimenticia);
  const baseTributavelInformada = roundPayrollMoney(
    Math.max(0, rendimentosTributaveis) + Math.max(0, outrosRendimentosTributaveis)
  );
  const inssMemo = calcularInssEmpregado2026(baseTributavelInformada);
  const irrfMemo = inputs.considerarDescontoSimplificado
    ? calcularIrrfMensal2026({
        rendimentosTributaveis: baseTributavelInformada,
        inss: inssMemo.inss,
        dependentes: inputs.dependentesIr,
        pensaoAlimenticia,
      })
    : calcularIrrfMensalPadrao2026({
        rendimentosTributaveis: baseTributavelInformada,
        inss: inssMemo.inss,
        dependentes: inputs.dependentesIr,
        pensaoAlimenticia,
      });
  const totalInssIrrf = roundPayrollMoney(inssMemo.inss + irrfMemo.irrf);
  const saldoAposInssIrrf = roundPayrollMoney(Math.max(0, baseTributavelInformada - totalInssIrrf));
  const aliquotaEfetivaLegal =
    baseTributavelInformada > 0 ? roundPayrollRate(totalInssIrrf / baseTributavelInformada) : 0;
  const warnings = buildWarnings(inputs, baseTributavelInformada, inssMemo.tetoInss);

  return {
    rendimentosTributaveis,
    outrosRendimentosTributaveis,
    categoriaSegurado: inputs.categoriaSegurado,
    dependentesIr: inputs.dependentesIr,
    pensaoAlimenticia,
    considerarDescontoSimplificado: inputs.considerarDescontoSimplificado,
    tabelaAno: INSS_IRRF_SUPPORTED_TABLE_YEAR,
    baseTributavelInformada,
    baseInss: inssMemo.baseInss,
    inss: inssMemo.inss,
    aliquotaEfetivaInss: inssMemo.aliquotaEfetivaInss,
    tetoInss: inssMemo.tetoInss,
    deducaoDependentes: irrfMemo.deducaoDependentes,
    baseIrrfPadrao: irrfMemo.baseIrrfPadrao,
    baseIrrfSimplificada: irrfMemo.baseIrrfSimplificada,
    baseIrrfUsada: irrfMemo.baseIrrfUsada,
    tipoBaseIrrfUsada: irrfMemo.tipoBaseIrrfUsada,
    aliquotaFaixaIrrf: irrfMemo.aliquotaFaixa,
    parcelaDeduzirIrrf: irrfMemo.parcelaDeduzir,
    irrfAntesReducao: irrfMemo.irrfAntesReducao,
    reducaoIrrfMensal: irrfMemo.reducaoIrrfMensal,
    irrf: irrfMemo.irrf,
    totalInssIrrf,
    saldoAposInssIrrf,
    aliquotaEfetivaLegal,
    inssMemo,
    irrfMemo,
    warnings,
    sourceVersion: INSS_IRRF_SOURCE_VERSION_2026_07_07,
  };
}

export {
  PAYROLL_INSS_EMPREGADO_2026 as INSS_IRRF_INSS_EMPREGADO_DOMESTICO_AVULSO_2026,
  PAYROLL_IRRF_MENSAL_2026 as INSS_IRRF_IRRF_MENSAL_2026,
  PAYROLL_IRRF_2026_DEPENDENT_DEDUCTION as INSS_IRRF_IRRF_2026_DEPENDENT_DEDUCTION,
  PAYROLL_IRRF_2026_SIMPLIFIED_DISCOUNT_LIMIT as INSS_IRRF_IRRF_2026_SIMPLIFIED_DISCOUNT_LIMIT,
  PAYROLL_MONEY_MAX as INSS_IRRF_MONEY_MAX,
  PAYROLL_SALARIO_MINIMO_REFERENCIA_2026 as INSS_IRRF_SALARIO_MINIMO_REFERENCIA_2026,
};

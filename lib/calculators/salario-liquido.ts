import {
  PAYROLL_SOURCE_VERSION_2026_06_20,
  PAYROLL_TABLE_YEAR_2026,
  PAYROLL_SALARIO_MINIMO_REFERENCIA_2026,
  calcularInssEmpregado2026,
  calcularIrrfMensal2026,
  isPayrollMoney,
  roundPayrollMoney,
  roundPayrollRate,
  type PayrollInssResult,
  type PayrollIrrfBaseType,
  type PayrollIrrfResult,
} from "./payroll-2026";

export {
  PAYROLL_INSS_EMPREGADO_2026 as SALARIO_LIQUIDO_INSS_EMPREGADO_2026,
  PAYROLL_IRRF_MENSAL_2026 as SALARIO_LIQUIDO_IRRF_MENSAL_2026,
  PAYROLL_IRRF_2026_DEPENDENT_DEDUCTION as SALARIO_LIQUIDO_IRRF_2026_DEPENDENT_DEDUCTION,
  PAYROLL_IRRF_2026_MONTHLY_REDUCTION_TABLE as SALARIO_LIQUIDO_IRRF_2026_MONTHLY_REDUCTION_TABLE,
  PAYROLL_IRRF_2026_SIMPLIFIED_DISCOUNT_LIMIT as SALARIO_LIQUIDO_IRRF_2026_SIMPLIFIED_DISCOUNT_LIMIT,
  PAYROLL_MONEY_MAX as SALARIO_LIQUIDO_MONEY_MAX,
  PAYROLL_SALARIO_MINIMO_REFERENCIA_2026 as SALARIO_LIQUIDO_SALARIO_MINIMO_REFERENCIA_2026,
  PAYROLL_SOURCE_VERSION_2026_06_20 as SALARIO_LIQUIDO_SOURCE_VERSION_2026_06_20,
  calcularInssEmpregado2026,
  calcularIrrfMensal2026,
} from "./payroll-2026";

export const SALARIO_LIQUIDO_SUPPORTED_TABLE_YEAR = PAYROLL_TABLE_YEAR_2026;

export interface SalarioLiquidoInputs {
  salarioBruto: number;
  outrosProventosTributaveis: number;
  outrosProventosNaoTributaveis: number;
  dependentesIr: number;
  pensaoAlimenticia: number;
  descontosManuais: number;
  adiantamentos: number;
  calcularDescontosLegais: boolean;
  tabelaAno: typeof SALARIO_LIQUIDO_SUPPORTED_TABLE_YEAR;
}

export type SalarioLiquidoBreakdownCategory = "proventos" | "descontosLegais" | "descontosManuais" | "liquido";

export type SalarioLiquidoBreakdownId =
  | "salarioBruto"
  | "outrosProventosTributaveis"
  | "outrosProventosNaoTributaveis"
  | "inss"
  | "irrf"
  | "descontosManuais"
  | "adiantamentos"
  | "salarioLiquido";

export type SalarioLiquidoWarningCode =
  | "tabelasLegais2026"
  | "descontosLegaisDesativados"
  | "salarioAbaixoReferencia"
  | "descontosExcedemProventos"
  | "multiplosVinculosNaoConsiderados"
  | "estimativaHolerite"
  | "fontesConsultadas2026";

export interface SalarioLiquidoBreakdownRow {
  id: SalarioLiquidoBreakdownId;
  categoria: SalarioLiquidoBreakdownCategory;
  valor: number;
  aplicavel: boolean;
  detalhe?: string;
  base?: number;
}

export interface SalarioLiquidoDescontosLegais {
  baseInss: number;
  inss: number;
  aliquotaEfetivaInss: number;
  deducaoDependentes: number;
  baseIrrfPadrao: number;
  baseIrrfSimplificada: number;
  baseIrrfUsada: number;
  tipoBaseIrrfUsada: PayrollIrrfBaseType;
  irrfAntesReducao: number;
  reducaoIrrfMensal: number;
  irrf: number;
  aliquotaFaixaIrrf: number;
  parcelaDeduzirIrrf: number;
  versao: typeof SALARIO_LIQUIDO_SUPPORTED_TABLE_YEAR;
}

export interface ResultadoSalarioLiquido {
  salarioBruto: number;
  outrosProventosTributaveis: number;
  outrosProventosNaoTributaveis: number;
  proventosTributaveis: number;
  totalProventos: number;
  descontosLegais: SalarioLiquidoDescontosLegais;
  baseInss: number;
  inss: number;
  deducaoDependentes: number;
  baseIrrfPadrao: number;
  baseIrrfSimplificada: number;
  baseIrrfUsada: number;
  tipoBaseIrrfUsada: PayrollIrrfBaseType;
  irrfAntesReducao: number;
  reducaoIrrfMensal: number;
  irrf: number;
  descontosManuais: number;
  adiantamentos: number;
  totalDescontos: number;
  salarioLiquido: number;
  aliquotaEfetivaLegal: number;
  inssMemo: PayrollInssResult;
  irrfMemo: PayrollIrrfResult;
  breakdown: SalarioLiquidoBreakdownRow[];
  warnings: SalarioLiquidoWarningCode[];
  sourceVersion: typeof PAYROLL_SOURCE_VERSION_2026_06_20;
}

function isIntegerRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

export function getDefaultSalarioLiquidoInputs(): SalarioLiquidoInputs {
  return {
    salarioBruto: 3000,
    outrosProventosTributaveis: 0,
    outrosProventosNaoTributaveis: 0,
    dependentesIr: 0,
    pensaoAlimenticia: 0,
    descontosManuais: 0,
    adiantamentos: 0,
    calcularDescontosLegais: true,
    tabelaAno: SALARIO_LIQUIDO_SUPPORTED_TABLE_YEAR,
  };
}

export function validateSalarioLiquidoInputs(inputs: SalarioLiquidoInputs): string[] {
  const errors: string[] = [];
  const moneyFields: Array<[keyof SalarioLiquidoInputs, number]> = [
    ["salarioBruto", inputs.salarioBruto],
    ["outrosProventosTributaveis", inputs.outrosProventosTributaveis],
    ["outrosProventosNaoTributaveis", inputs.outrosProventosNaoTributaveis],
    ["pensaoAlimenticia", inputs.pensaoAlimenticia],
    ["descontosManuais", inputs.descontosManuais],
    ["adiantamentos", inputs.adiantamentos],
  ];

  for (const [field, value] of moneyFields) {
    if (!isPayrollMoney(value)) errors.push(String(field));
  }

  if (inputs.salarioBruto <= 0) errors.push("salarioBrutoObrigatorio");
  if (!isIntegerRange(inputs.dependentesIr, 0, 20)) errors.push("dependentesIr");
  if (inputs.tabelaAno !== SALARIO_LIQUIDO_SUPPORTED_TABLE_YEAR) errors.push("tabelaAno");

  return errors;
}

function buildLegalDeductions(inputs: SalarioLiquidoInputs, proventosTributaveis: number): SalarioLiquidoDescontosLegais & {
  inssMemo: PayrollInssResult;
  irrfMemo: PayrollIrrfResult;
} {
  if (!inputs.calcularDescontosLegais) {
    const inssMemo = calcularInssEmpregado2026(0);
    const irrfMemo = calcularIrrfMensal2026({
      rendimentosTributaveis: 0,
      inss: 0,
      dependentes: 0,
      pensaoAlimenticia: 0,
    });

    return {
      baseInss: 0,
      inss: 0,
      aliquotaEfetivaInss: 0,
      deducaoDependentes: 0,
      baseIrrfPadrao: 0,
      baseIrrfSimplificada: 0,
      baseIrrfUsada: 0,
      tipoBaseIrrfUsada: "padrao",
      irrfAntesReducao: 0,
      reducaoIrrfMensal: 0,
      irrf: 0,
      aliquotaFaixaIrrf: 0,
      parcelaDeduzirIrrf: 0,
      versao: SALARIO_LIQUIDO_SUPPORTED_TABLE_YEAR,
      inssMemo,
      irrfMemo,
    };
  }

  const inssMemo = calcularInssEmpregado2026(proventosTributaveis);
  const irrfMemo = calcularIrrfMensal2026({
    rendimentosTributaveis: proventosTributaveis,
    inss: inssMemo.inss,
    dependentes: inputs.dependentesIr,
    pensaoAlimenticia: inputs.pensaoAlimenticia,
  });

  return {
    baseInss: inssMemo.baseInss,
    inss: inssMemo.inss,
    aliquotaEfetivaInss: inssMemo.aliquotaEfetivaInss,
    deducaoDependentes: irrfMemo.deducaoDependentes,
    baseIrrfPadrao: irrfMemo.baseIrrfPadrao,
    baseIrrfSimplificada: irrfMemo.baseIrrfSimplificada,
    baseIrrfUsada: irrfMemo.baseIrrfUsada,
    tipoBaseIrrfUsada: irrfMemo.tipoBaseIrrfUsada,
    irrfAntesReducao: irrfMemo.irrfAntesReducao,
    reducaoIrrfMensal: irrfMemo.reducaoIrrfMensal,
    irrf: irrfMemo.irrf,
    aliquotaFaixaIrrf: irrfMemo.aliquotaFaixa,
    parcelaDeduzirIrrf: irrfMemo.parcelaDeduzir,
    versao: SALARIO_LIQUIDO_SUPPORTED_TABLE_YEAR,
    inssMemo,
    irrfMemo,
  };
}

function buildWarnings(inputs: SalarioLiquidoInputs, totalProventos: number, totalDescontos: number): SalarioLiquidoWarningCode[] {
  const warnings: SalarioLiquidoWarningCode[] = [
    "tabelasLegais2026",
    "multiplosVinculosNaoConsiderados",
    "estimativaHolerite",
    "fontesConsultadas2026",
  ];

  if (!inputs.calcularDescontosLegais) warnings.push("descontosLegaisDesativados");
  if (inputs.salarioBruto < PAYROLL_SALARIO_MINIMO_REFERENCIA_2026) warnings.push("salarioAbaixoReferencia");
  if (totalDescontos > totalProventos) warnings.push("descontosExcedemProventos");

  return warnings;
}

export function calcularSalarioLiquido(inputs: SalarioLiquidoInputs): ResultadoSalarioLiquido {
  const validationErrors = validateSalarioLiquidoInputs(inputs);
  if (validationErrors.length > 0) {
    throw new RangeError(`Invalid salario-liquido inputs: ${validationErrors.join(", ")}`);
  }

  const salarioBruto = roundPayrollMoney(inputs.salarioBruto);
  const outrosProventosTributaveis = roundPayrollMoney(inputs.outrosProventosTributaveis);
  const outrosProventosNaoTributaveis = roundPayrollMoney(inputs.outrosProventosNaoTributaveis);
  const proventosTributaveis = roundPayrollMoney(Math.max(0, salarioBruto + outrosProventosTributaveis));
  const totalProventos = roundPayrollMoney(proventosTributaveis + outrosProventosNaoTributaveis);
  const descontosLegais = buildLegalDeductions(inputs, proventosTributaveis);
  const descontosManuais = roundPayrollMoney(inputs.descontosManuais);
  const adiantamentos = roundPayrollMoney(inputs.adiantamentos);
  const totalDescontos = roundPayrollMoney(descontosLegais.inss + descontosLegais.irrf + descontosManuais + adiantamentos);
  const salarioLiquido = roundPayrollMoney(Math.max(0, totalProventos - totalDescontos));
  const aliquotaEfetivaLegal =
    proventosTributaveis > 0
      ? roundPayrollRate((descontosLegais.inss + descontosLegais.irrf) / proventosTributaveis)
      : 0;
  const warnings = buildWarnings(inputs, totalProventos, totalDescontos);

  const breakdown: SalarioLiquidoBreakdownRow[] = [
    {
      id: "salarioBruto",
      categoria: "proventos",
      valor: salarioBruto,
      aplicavel: true,
    },
    {
      id: "outrosProventosTributaveis",
      categoria: "proventos",
      valor: outrosProventosTributaveis,
      aplicavel: outrosProventosTributaveis > 0,
      base: proventosTributaveis,
    },
    {
      id: "outrosProventosNaoTributaveis",
      categoria: "proventos",
      valor: outrosProventosNaoTributaveis,
      aplicavel: outrosProventosNaoTributaveis > 0,
      base: totalProventos,
    },
    {
      id: "inss",
      categoria: "descontosLegais",
      valor: descontosLegais.inss,
      aplicavel: inputs.calcularDescontosLegais,
      base: descontosLegais.baseInss,
    },
    {
      id: "irrf",
      categoria: "descontosLegais",
      valor: descontosLegais.irrf,
      aplicavel: inputs.calcularDescontosLegais,
      base: descontosLegais.baseIrrfUsada,
      detalhe: descontosLegais.tipoBaseIrrfUsada,
    },
    {
      id: "descontosManuais",
      categoria: "descontosManuais",
      valor: descontosManuais,
      aplicavel: descontosManuais > 0,
    },
    {
      id: "adiantamentos",
      categoria: "descontosManuais",
      valor: adiantamentos,
      aplicavel: adiantamentos > 0,
    },
    {
      id: "salarioLiquido",
      categoria: "liquido",
      valor: salarioLiquido,
      aplicavel: true,
      base: totalProventos,
    },
  ];

  return {
    salarioBruto,
    outrosProventosTributaveis,
    outrosProventosNaoTributaveis,
    proventosTributaveis,
    totalProventos,
    descontosLegais,
    baseInss: descontosLegais.baseInss,
    inss: descontosLegais.inss,
    deducaoDependentes: descontosLegais.deducaoDependentes,
    baseIrrfPadrao: descontosLegais.baseIrrfPadrao,
    baseIrrfSimplificada: descontosLegais.baseIrrfSimplificada,
    baseIrrfUsada: descontosLegais.baseIrrfUsada,
    tipoBaseIrrfUsada: descontosLegais.tipoBaseIrrfUsada,
    irrfAntesReducao: descontosLegais.irrfAntesReducao,
    reducaoIrrfMensal: descontosLegais.reducaoIrrfMensal,
    irrf: descontosLegais.irrf,
    descontosManuais,
    adiantamentos,
    totalDescontos,
    salarioLiquido,
    aliquotaEfetivaLegal,
    inssMemo: descontosLegais.inssMemo,
    irrfMemo: descontosLegais.irrfMemo,
    breakdown,
    warnings,
    sourceVersion: PAYROLL_SOURCE_VERSION_2026_06_20,
  };
}

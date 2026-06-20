export const PAYROLL_TABLE_YEAR_2026 = 2026 as const;

export const PAYROLL_SOURCE_VERSION_2026_06_20 = {
  legalRulesAccessedAt: "2026-06-20",
  inss: "2026",
  irrf: "2026",
  salarioMinimoReferencia: "2026",
  inssEffectiveFrom: "2026-01",
  irrfEffectiveFrom: "2026-01",
} as const;

export const PAYROLL_MONEY_MAX = 10_000_000;
export const PAYROLL_SALARIO_MINIMO_REFERENCIA_2026 = 1621;

export const PAYROLL_INSS_EMPREGADO_2026 = [
  { limit: 1621.0, rate: 0.075 },
  { limit: 2902.84, rate: 0.09 },
  { limit: 4354.27, rate: 0.12 },
  { limit: 8475.55, rate: 0.14 },
] as const;

export const PAYROLL_IRRF_MENSAL_2026 = [
  { limit: 2428.8, rate: 0, deduction: 0 },
  { limit: 2826.65, rate: 0.075, deduction: 182.16 },
  { limit: 3751.05, rate: 0.15, deduction: 394.16 },
  { limit: 4664.68, rate: 0.225, deduction: 675.49 },
  { limit: Infinity, rate: 0.275, deduction: 908.73 },
] as const;

export const PAYROLL_IRRF_2026_DEPENDENT_DEDUCTION = 189.59;
export const PAYROLL_IRRF_2026_SIMPLIFIED_DISCOUNT_LIMIT = 607.2;
export const PAYROLL_IRRF_2026_MONTHLY_REDUCTION_TABLE = {
  zeroTaxableEarningsLimit: 5_000,
  phaseOutTaxableEarningsLimit: 7_350,
  phaseOutFixedReduction: 978.62,
  phaseOutRate: 0.133145,
} as const;

export type PayrollIrrfBaseType = "padrao" | "simplificada";

export interface PayrollInssSlice {
  from: number;
  to: number;
  rate: number;
  amount: number;
  contribution: number;
}

export interface PayrollInssResult {
  baseInss: number;
  inss: number;
  aliquotaEfetivaInss: number;
  tetoInss: number;
  slices: PayrollInssSlice[];
}

export interface PayrollIrrfInput {
  rendimentosTributaveis: number;
  inss: number;
  dependentes: number;
  pensaoAlimenticia?: number;
}

export interface PayrollIrrfResult {
  deducaoDependentes: number;
  baseIrrfPadrao: number;
  baseIrrfSimplificada: number;
  baseIrrfUsada: number;
  tipoBaseIrrfUsada: PayrollIrrfBaseType;
  aliquotaFaixa: number;
  parcelaDeduzir: number;
  irrfAntesReducao: number;
  reducaoIrrfMensal: number;
  irrf: number;
}

export function roundPayrollMoney(value: number): number {
  return Math.round((value + 1e-9) * 100) / 100;
}

export function roundPayrollRate(value: number): number {
  return Math.round((value + 1e-12) * 10000) / 10000;
}

export function isPayrollMoney(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= PAYROLL_MONEY_MAX;
}

export function calcularInssEmpregado2026(base: number): PayrollInssResult {
  const tetoInss = PAYROLL_INSS_EMPREGADO_2026[PAYROLL_INSS_EMPREGADO_2026.length - 1].limit;
  const baseInss = roundPayrollMoney(Math.max(0, Math.min(base, tetoInss)));
  const slices: PayrollInssSlice[] = [];
  let previousLimit = 0;
  let contribution = 0;

  for (const bracket of PAYROLL_INSS_EMPREGADO_2026) {
    if (baseInss <= previousLimit) break;

    const amount = Math.max(0, Math.min(baseInss, bracket.limit) - previousLimit);
    const sliceContribution = amount * bracket.rate;
    contribution += sliceContribution;
    slices.push({
      from: previousLimit,
      to: bracket.limit,
      rate: bracket.rate,
      amount: roundPayrollMoney(amount),
      contribution: roundPayrollMoney(sliceContribution),
    });
    previousLimit = bracket.limit;
  }

  const inss = roundPayrollMoney(contribution);

  return {
    baseInss,
    inss,
    aliquotaEfetivaInss: base > 0 ? roundPayrollRate(inss / base) : 0,
    tetoInss,
    slices,
  };
}

export function calcularReducaoMensalIrrf2026(
  rendimentosTributaveisMensais: number,
  impostoAntesReducao: number
): number {
  const rendimentos = Math.max(0, rendimentosTributaveisMensais);
  const imposto = Math.max(0, impostoAntesReducao);

  if (rendimentos <= PAYROLL_IRRF_2026_MONTHLY_REDUCTION_TABLE.zeroTaxableEarningsLimit) {
    return roundPayrollMoney(imposto);
  }

  if (rendimentos <= PAYROLL_IRRF_2026_MONTHLY_REDUCTION_TABLE.phaseOutTaxableEarningsLimit) {
    const reducao =
      PAYROLL_IRRF_2026_MONTHLY_REDUCTION_TABLE.phaseOutFixedReduction -
      PAYROLL_IRRF_2026_MONTHLY_REDUCTION_TABLE.phaseOutRate * rendimentos;
    return roundPayrollMoney(Math.min(imposto, Math.max(0, reducao)));
  }

  return 0;
}

export function calcularIrrfMensal2026(input: PayrollIrrfInput): PayrollIrrfResult {
  const rendimentosTributaveis = Math.max(0, input.rendimentosTributaveis);
  const inss = Math.max(0, input.inss);
  const dependentes = Math.max(0, input.dependentes);
  const pensaoAlimenticia = Math.max(0, input.pensaoAlimenticia ?? 0);
  const deducaoDependentes = roundPayrollMoney(dependentes * PAYROLL_IRRF_2026_DEPENDENT_DEDUCTION);
  const baseIrrfPadrao = roundPayrollMoney(
    Math.max(0, rendimentosTributaveis - inss - deducaoDependentes - pensaoAlimenticia)
  );
  const baseIrrfSimplificada = roundPayrollMoney(
    Math.max(0, rendimentosTributaveis - PAYROLL_IRRF_2026_SIMPLIFIED_DISCOUNT_LIMIT)
  );
  const tipoBaseIrrfUsada: PayrollIrrfBaseType =
    baseIrrfPadrao <= baseIrrfSimplificada ? "padrao" : "simplificada";
  const baseIrrfUsada = Math.min(baseIrrfPadrao, baseIrrfSimplificada);
  const bracket = PAYROLL_IRRF_MENSAL_2026.find((entry) => baseIrrfUsada <= entry.limit) ?? PAYROLL_IRRF_MENSAL_2026[0];
  const irrfAntesReducaoRaw = Math.max(0, baseIrrfUsada * bracket.rate - bracket.deduction);
  const reducaoIrrfMensal = calcularReducaoMensalIrrf2026(rendimentosTributaveis, irrfAntesReducaoRaw);

  return {
    deducaoDependentes,
    baseIrrfPadrao,
    baseIrrfSimplificada,
    baseIrrfUsada,
    tipoBaseIrrfUsada,
    aliquotaFaixa: bracket.rate,
    parcelaDeduzir: bracket.deduction,
    irrfAntesReducao: roundPayrollMoney(irrfAntesReducaoRaw),
    reducaoIrrfMensal,
    irrf: roundPayrollMoney(Math.max(0, irrfAntesReducaoRaw - reducaoIrrfMensal)),
  };
}

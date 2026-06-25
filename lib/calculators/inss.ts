import {
  PAYROLL_INSS_EMPREGADO_2026,
  PAYROLL_MONEY_MAX,
  PAYROLL_SALARIO_MINIMO_REFERENCIA_2026,
  PAYROLL_TABLE_YEAR_2026,
  calcularInssEmpregado2026,
  isPayrollMoney,
  roundPayrollMoney,
  type PayrollInssSlice,
} from "./payroll-2026";

export const INSS_SUPPORTED_TABLE_YEAR = PAYROLL_TABLE_YEAR_2026;
export const INSS_SOURCE_VERSION_2026_06_24 = {
  tableYear: INSS_SUPPORTED_TABLE_YEAR,
  accessedAt: "2026-06-24",
  effectiveFrom: "2026-01",
  portaria: "Portaria Interministerial MPS/MF No. 13, 2026-01-09",
  minimumReferenceSalary: PAYROLL_SALARIO_MINIMO_REFERENCIA_2026,
  ceiling: PAYROLL_INSS_EMPREGADO_2026[PAYROLL_INSS_EMPREGADO_2026.length - 1].limit,
} as const;

export type InssCategoriaSegurado = "empregado" | "domestico" | "avulso";

export type InssWarningCode =
  | "tabelaInss2026"
  | "salarioAbaixoReferencia"
  | "tetoAplicado"
  | "multiplosVinculos"
  | "decimoTerceiroSeparado"
  | "estimativaEducativa"
  | "fontesConsultadas";

export type InssValidationError =
  | "salarioContribuicao"
  | "salarioContribuicaoObrigatorio"
  | "outrasRemuneracoes"
  | "categoriaSegurado"
  | "tabelaAno";

export interface InssInputs {
  salarioContribuicao: number;
  outrasRemuneracoes: number;
  categoriaSegurado: InssCategoriaSegurado;
  tabelaAno: typeof INSS_SUPPORTED_TABLE_YEAR;
}

export interface ResultadoInss {
  salarioContribuicao: number;
  outrasRemuneracoes: number;
  categoriaSegurado: InssCategoriaSegurado;
  tabelaAno: typeof INSS_SUPPORTED_TABLE_YEAR;
  baseInformada: number;
  baseInss: number;
  inss: number;
  aliquotaEfetiva: number;
  tetoInss: number;
  margemAteTeto: number;
  slices: PayrollInssSlice[];
  warnings: InssWarningCode[];
  sourceVersion: typeof INSS_SOURCE_VERSION_2026_06_24;
}

export function getDefaultInssInputs(): InssInputs {
  return {
    salarioContribuicao: 3000,
    outrasRemuneracoes: 0,
    categoriaSegurado: "empregado",
    tabelaAno: INSS_SUPPORTED_TABLE_YEAR,
  };
}

export function isInssCategoriaSegurado(value: string): value is InssCategoriaSegurado {
  return value === "empregado" || value === "domestico" || value === "avulso";
}

export function validateInssInputs(inputs: InssInputs): InssValidationError[] {
  const errors: InssValidationError[] = [];

  if (!isPayrollMoney(inputs.salarioContribuicao)) errors.push("salarioContribuicao");
  if (inputs.salarioContribuicao <= 0) errors.push("salarioContribuicaoObrigatorio");
  if (!isPayrollMoney(inputs.outrasRemuneracoes)) errors.push("outrasRemuneracoes");
  if (!isInssCategoriaSegurado(inputs.categoriaSegurado)) errors.push("categoriaSegurado");
  if (inputs.tabelaAno !== INSS_SUPPORTED_TABLE_YEAR) errors.push("tabelaAno");

  return errors;
}

function buildWarnings(baseInformada: number, tetoInss: number): InssWarningCode[] {
  const warnings: InssWarningCode[] = [
    "tabelaInss2026",
    "multiplosVinculos",
    "decimoTerceiroSeparado",
    "estimativaEducativa",
    "fontesConsultadas",
  ];

  if (baseInformada < PAYROLL_SALARIO_MINIMO_REFERENCIA_2026) warnings.push("salarioAbaixoReferencia");
  if (baseInformada > tetoInss) warnings.push("tetoAplicado");

  return warnings;
}

export function calcularInss(inputs: InssInputs): ResultadoInss {
  const validationErrors = validateInssInputs(inputs);
  if (validationErrors.length > 0) {
    throw new RangeError(`Invalid inss inputs: ${validationErrors.join(", ")}`);
  }

  const salarioContribuicao = roundPayrollMoney(inputs.salarioContribuicao);
  const outrasRemuneracoes = roundPayrollMoney(inputs.outrasRemuneracoes);
  const baseInformada = roundPayrollMoney(Math.max(0, salarioContribuicao) + Math.max(0, outrasRemuneracoes));
  const inssMemo = calcularInssEmpregado2026(baseInformada);
  const margemAteTeto = roundPayrollMoney(Math.max(0, inssMemo.tetoInss - baseInformada));
  const warnings = buildWarnings(baseInformada, inssMemo.tetoInss);

  return {
    salarioContribuicao,
    outrasRemuneracoes,
    categoriaSegurado: inputs.categoriaSegurado,
    tabelaAno: INSS_SUPPORTED_TABLE_YEAR,
    baseInformada,
    baseInss: inssMemo.baseInss,
    inss: inssMemo.inss,
    aliquotaEfetiva: inssMemo.aliquotaEfetivaInss,
    tetoInss: inssMemo.tetoInss,
    margemAteTeto,
    slices: inssMemo.slices,
    warnings,
    sourceVersion: INSS_SOURCE_VERSION_2026_06_24,
  };
}

export { PAYROLL_INSS_EMPREGADO_2026 as INSS_EMPREGADO_DOMESTICO_AVULSO_2026, PAYROLL_MONEY_MAX as INSS_MONEY_MAX };

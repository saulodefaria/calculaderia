import { calculateIrr } from "../utils/irr";

export const CALCULADORA_FINANCEIRA_ONLINE_SUPPORTED_SOURCE_VERSION = "2026-06-25";
export const FINANCIAL_CALCULATOR_MONEY_MAX = 1_000_000_000_000;
export const FINANCIAL_CALCULATOR_RATE_MIN_PERCENT = -99.999999;
export const FINANCIAL_CALCULATOR_RATE_MAX_PERCENT = 10000;
export const FINANCIAL_CALCULATOR_MAX_PERIODS = 1200;
export const FINANCIAL_CALCULATOR_MAX_CASHFLOWS = 100;

export const CALCULADORA_FINANCEIRA_ONLINE_SOURCE_VERSION = {
  id: CALCULADORA_FINANCEIRA_ONLINE_SUPPORTED_SOURCE_VERSION,
  formulasAccessedAt: "2026-06-25",
  sourceFamily: "TVM, NPV, IRR",
} as const;

export type FinancialCalculatorMode = "tvm" | "cashflows";
export type TvmSolveFor = "n" | "i" | "pv" | "pmt" | "fv";
export type PaymentTiming = "end" | "begin";
export type FinancialPeriodLabel = "periodic" | "monthly" | "annual";

export type FinancialValidationError =
  | "mode"
  | "sourceVersion"
  | "solveFor"
  | "paymentTiming"
  | "periods"
  | "periodsInteger"
  | "rate"
  | "presentValue"
  | "payment"
  | "futureValue"
  | "signConvention"
  | "cashflowDiscountRate"
  | "cashflowCount"
  | "cashflowValue";

export type FinancialCalculationError =
  | FinancialValidationError
  | "divisionByZero"
  | "invalidLogarithm"
  | "nonConvergence"
  | "fractionalPeriodsUnsupported"
  | "cashflowSigns"
  | "irrNonConvergence";

export type FinancialWarningCode =
  | "educationalEstimate"
  | "periodicRatesOnly"
  | "notAffiliated"
  | "zeroRate"
  | "multipleSignChanges";

export interface FinancialTvmInputs {
  solveFor: TvmSolveFor;
  n: number;
  i: number;
  pv: number;
  pmt: number;
  fv: number;
  paymentTiming: PaymentTiming;
}

export interface FinancialCashflowInputs {
  discountRate: number;
  cashflows: number[];
  periodLabel: FinancialPeriodLabel;
}

export interface CalculadoraFinanceiraOnlineInputs {
  mode: FinancialCalculatorMode;
  tvm: FinancialTvmInputs;
  cashflows: FinancialCashflowInputs;
  sourceVersion: typeof CALCULADORA_FINANCEIRA_ONLINE_SUPPORTED_SOURCE_VERSION;
}

export interface FinancialTvmResult {
  mode: "tvm";
  ok: boolean;
  solveFor: TvmSolveFor;
  solvedValue: number | null;
  roundedSolvedValue: number | null;
  normalizedInputs: FinancialTvmInputs | null;
  residual: number | null;
  totalPayments: number | null;
  paymentTiming: PaymentTiming;
  errors: FinancialCalculationError[];
  warnings: FinancialWarningCode[];
  sourceVersion: typeof CALCULADORA_FINANCEIRA_ONLINE_SOURCE_VERSION;
}

export interface FinancialCashflowResult {
  mode: "cashflows";
  ok: boolean;
  npv: number | null;
  roundedNpv: number | null;
  irrPerPeriod: number | null;
  irrPerPeriodPercent: number | null;
  annualizedIrr: number | null;
  annualizedIrrPercent: number | null;
  totalInflows: number;
  totalOutflows: number;
  netCashflow: number;
  cashflowCount: number;
  signChanges: number;
  periodLabel: FinancialPeriodLabel;
  errors: FinancialCalculationError[];
  warnings: FinancialWarningCode[];
  sourceVersion: typeof CALCULADORA_FINANCEIRA_ONLINE_SOURCE_VERSION;
}

export type CalculadoraFinanceiraOnlineResult = FinancialTvmResult | FinancialCashflowResult;

const EPSILON = 1e-10;

export function getDefaultCalculadoraFinanceiraOnlineInputs(): CalculadoraFinanceiraOnlineInputs {
  return {
    mode: "tvm",
    tvm: {
      solveFor: "pmt",
      n: 12,
      i: 1,
      pv: 100000,
      pmt: 0,
      fv: 0,
      paymentTiming: "end",
    },
    cashflows: {
      discountRate: 10,
      cashflows: [-1000, 400, 400, 400],
      periodLabel: "periodic",
    },
    sourceVersion: CALCULADORA_FINANCEIRA_ONLINE_SUPPORTED_SOURCE_VERSION,
  };
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function roundMoney(value: number): number {
  return roundTo(value, 2);
}

function roundSolvedValue(solveFor: TvmSolveFor, value: number): number {
  if (solveFor === "i") return roundTo(value, 6);
  if (solveFor === "n") return roundTo(value, 6);
  return roundMoney(value);
}

function isFiniteMoney(value: number): boolean {
  return Number.isFinite(value) && Math.abs(value) <= FINANCIAL_CALCULATOR_MONEY_MAX;
}

function isRatePercent(value: number): boolean {
  return (
    Number.isFinite(value) &&
    value > FINANCIAL_CALCULATOR_RATE_MIN_PERCENT &&
    value <= FINANCIAL_CALCULATOR_RATE_MAX_PERCENT
  );
}

function isSolveFor(value: string): value is TvmSolveFor {
  return value === "n" || value === "i" || value === "pv" || value === "pmt" || value === "fv";
}

function isPaymentTiming(value: string): value is PaymentTiming {
  return value === "end" || value === "begin";
}

function hasPositiveAndNegative(values: number[]): boolean {
  const nonZero = values.filter((value) => Math.abs(value) > EPSILON);
  return nonZero.some((value) => value > 0) && nonZero.some((value) => value < 0);
}

function getPaymentTimingTau(paymentTiming: PaymentTiming): 0 | 1 {
  return paymentTiming === "begin" ? 1 : 0;
}

function tvmFactor(rate: number, n: number): number {
  if (Math.abs(rate) < EPSILON) return n;
  return (Math.pow(1 + rate, n) - 1) / rate;
}

function evaluateTvmEquation(inputs: FinancialTvmInputs, rateOverride?: number): number {
  const rate = rateOverride ?? inputs.i / 100;
  const tau = getPaymentTimingTau(inputs.paymentTiming);

  if (Math.abs(rate) < EPSILON) {
    return inputs.pv + inputs.pmt * inputs.n + inputs.fv;
  }

  const compound = Math.pow(1 + rate, inputs.n);
  const factor = tvmFactor(rate, inputs.n);
  return inputs.pv * compound + inputs.pmt * (1 + rate * tau) * factor + inputs.fv;
}

export function calculateFinancialNpv(discountRatePercent: number, cashflows: number[]): number {
  const rate = discountRatePercent / 100;
  return cashflows.reduce((total, cashflow, index) => {
    const discountFactor = Math.pow(1 + rate, index);
    return total + cashflow / discountFactor;
  }, 0);
}

export function countCashflowSignChanges(cashflows: number[]): number {
  const signs = cashflows
    .filter((cashflow) => Math.abs(cashflow) > EPSILON)
    .map((cashflow) => (cashflow > 0 ? 1 : -1));

  return signs.reduce((changes, sign, index) => {
    if (index === 0) return changes;
    return sign !== signs[index - 1] ? changes + 1 : changes;
  }, 0);
}

export function validateCalculadoraFinanceiraOnlineInputs(
  inputs: CalculadoraFinanceiraOnlineInputs
): FinancialValidationError[] {
  const errors: FinancialValidationError[] = [];

  if (inputs.sourceVersion !== CALCULADORA_FINANCEIRA_ONLINE_SUPPORTED_SOURCE_VERSION) {
    errors.push("sourceVersion");
  }

  if (inputs.mode !== "tvm" && inputs.mode !== "cashflows") {
    errors.push("mode");
    return errors;
  }

  if (inputs.mode === "tvm") {
    errors.push(...validateFinancialTvmInputs(inputs.tvm));
  } else {
    errors.push(...validateFinancialCashflowInputs(inputs.cashflows));
  }

  return errors;
}

export function validateFinancialTvmInputs(inputs: FinancialTvmInputs): FinancialValidationError[] {
  const errors: FinancialValidationError[] = [];

  if (!isSolveFor(inputs.solveFor)) errors.push("solveFor");
  if (!isPaymentTiming(inputs.paymentTiming)) errors.push("paymentTiming");

  if (inputs.solveFor !== "n") {
    if (!Number.isFinite(inputs.n) || inputs.n <= 0 || inputs.n > FINANCIAL_CALCULATOR_MAX_PERIODS) {
      errors.push("periods");
    } else if ((inputs.solveFor === "pmt" || Math.abs(inputs.pmt) > EPSILON) && !Number.isInteger(inputs.n)) {
      errors.push("periodsInteger");
    }
  }

  if (inputs.solveFor !== "i" && !isRatePercent(inputs.i)) errors.push("rate");
  if (inputs.solveFor !== "pv" && !isFiniteMoney(inputs.pv)) errors.push("presentValue");
  if (inputs.solveFor !== "pmt" && !isFiniteMoney(inputs.pmt)) errors.push("payment");
  if (inputs.solveFor !== "fv" && !isFiniteMoney(inputs.fv)) errors.push("futureValue");

  if ((inputs.solveFor === "n" || inputs.solveFor === "i") && !hasPositiveAndNegative([inputs.pv, inputs.pmt, inputs.fv])) {
    errors.push("signConvention");
  }

  return errors;
}

export function validateFinancialCashflowInputs(inputs: FinancialCashflowInputs): FinancialValidationError[] {
  const errors: FinancialValidationError[] = [];

  if (!isRatePercent(inputs.discountRate)) errors.push("cashflowDiscountRate");
  if (inputs.cashflows.length < 2 || inputs.cashflows.length > FINANCIAL_CALCULATOR_MAX_CASHFLOWS) {
    errors.push("cashflowCount");
  }
  if (inputs.cashflows.some((cashflow) => !isFiniteMoney(cashflow))) {
    errors.push("cashflowValue");
  }

  return errors;
}

function buildTvmErrorResult(
  solveFor: TvmSolveFor,
  paymentTiming: PaymentTiming,
  errors: FinancialCalculationError[],
  warnings: FinancialWarningCode[] = defaultWarnings()
): FinancialTvmResult {
  return {
    mode: "tvm",
    ok: false,
    solveFor,
    solvedValue: null,
    roundedSolvedValue: null,
    normalizedInputs: null,
    residual: null,
    totalPayments: null,
    paymentTiming,
    errors,
    warnings,
    sourceVersion: CALCULADORA_FINANCEIRA_ONLINE_SOURCE_VERSION,
  };
}

function defaultWarnings(): FinancialWarningCode[] {
  return ["educationalEstimate", "periodicRatesOnly", "notAffiliated"];
}

function solveTvmValue(inputs: FinancialTvmInputs): number | null {
  const rate = inputs.i / 100;
  const tau = getPaymentTimingTau(inputs.paymentTiming);

  if (inputs.solveFor === "fv") {
    if (Math.abs(rate) < EPSILON) return -(inputs.pv + inputs.pmt * inputs.n);
    const compound = Math.pow(1 + rate, inputs.n);
    return -(inputs.pv * compound + inputs.pmt * (1 + rate * tau) * tvmFactor(rate, inputs.n));
  }

  if (inputs.solveFor === "pv") {
    if (Math.abs(rate) < EPSILON) return -(inputs.pmt * inputs.n + inputs.fv);
    const compound = Math.pow(1 + rate, inputs.n);
    return -(inputs.pmt * (1 + rate * tau) * tvmFactor(rate, inputs.n) + inputs.fv) / compound;
  }

  if (inputs.solveFor === "pmt") {
    if (Math.abs(rate) < EPSILON) {
      if (Math.abs(inputs.n) < EPSILON) return null;
      return -(inputs.pv + inputs.fv) / inputs.n;
    }
    const denominator = (1 + rate * tau) * tvmFactor(rate, inputs.n);
    if (Math.abs(denominator) < EPSILON) return null;
    const compound = Math.pow(1 + rate, inputs.n);
    return -(inputs.pv * compound + inputs.fv) / denominator;
  }

  if (inputs.solveFor === "n") {
    if (Math.abs(rate) < EPSILON) {
      if (Math.abs(inputs.pmt) < EPSILON) return null;
      return -(inputs.pv + inputs.fv) / inputs.pmt;
    }
    const b = (inputs.pmt * (1 + rate * tau)) / rate;
    const denominator = inputs.pv + b;
    const numerator = b - inputs.fv;
    if (Math.abs(denominator) < EPSILON) return null;
    const ratio = numerator / denominator;
    if (ratio <= 0 || Math.abs(1 + rate) < EPSILON) return null;
    return Math.log(ratio) / Math.log(1 + rate);
  }

  return solveTvmRate(inputs);
}

function solveTvmRate(inputs: FinancialTvmInputs): number | null {
  const minRate = FINANCIAL_CALCULATOR_RATE_MIN_PERCENT / 100 + 1e-10;
  const maxRate = FINANCIAL_CALCULATOR_RATE_MAX_PERCENT / 100;
  const minLog = Math.log(1 + minRate);
  const maxLog = Math.log(1 + maxRate);
  const sampleCount = 600;
  const tolerance = Math.max(1, Math.max(Math.abs(inputs.pv), Math.abs(inputs.pmt), Math.abs(inputs.fv))) * 1e-12;

  let previousRate: number | null = null;
  let previousValue: number | null = null;

  for (let index = 0; index <= sampleCount; index++) {
    const rate = Math.exp(minLog + ((maxLog - minLog) * index) / sampleCount) - 1;
    const value = evaluateTvmEquation(inputs, rate);
    if (!Number.isFinite(value)) continue;
    if (Math.abs(value) <= tolerance) return rate;

    if (previousRate !== null && previousValue !== null && previousValue * value < 0) {
      return bisectTvmRate(inputs, previousRate, rate, previousValue, value, tolerance);
    }

    previousRate = rate;
    previousValue = value;
  }

  return null;
}

function bisectTvmRate(
  inputs: FinancialTvmInputs,
  lowStart: number,
  highStart: number,
  lowValueStart: number,
  highValueStart: number,
  tolerance: number
): number | null {
  let low = lowStart;
  let high = highStart;
  let lowValue = lowValueStart;
  let highValue = highValueStart;

  for (let iteration = 0; iteration < 300; iteration++) {
    const mid = (low + high) / 2;
    const midValue = evaluateTvmEquation(inputs, mid);
    if (!Number.isFinite(midValue)) return null;
    if (Math.abs(midValue) <= tolerance || Math.abs(high - low) < 1e-12) return mid;

    if (lowValue * midValue <= 0) {
      high = mid;
      highValue = midValue;
    } else {
      low = mid;
      lowValue = midValue;
    }

    if (Math.abs(highValue) <= tolerance) return high;
  }

  return (low + high) / 2;
}

function withSolvedInput(inputs: FinancialTvmInputs, solvedValue: number): FinancialTvmInputs {
  return {
    ...inputs,
    [inputs.solveFor]: inputs.solveFor === "i" ? solvedValue : solvedValue,
  } as FinancialTvmInputs;
}

export function calculateFinancialTvm(inputs: FinancialTvmInputs): FinancialTvmResult {
  const validationErrors = validateFinancialTvmInputs(inputs);
  const warnings = defaultWarnings();

  if (inputs.solveFor !== "i" && Math.abs(inputs.i) < EPSILON) {
    warnings.push("zeroRate");
  }

  if (validationErrors.length > 0) {
    return buildTvmErrorResult(inputs.solveFor, inputs.paymentTiming, validationErrors, warnings);
  }

  const solvedRaw = solveTvmValue(inputs);
  if (solvedRaw === null || !Number.isFinite(solvedRaw)) {
    return buildTvmErrorResult(
      inputs.solveFor,
      inputs.paymentTiming,
      [inputs.solveFor === "n" ? "invalidLogarithm" : "nonConvergence"],
      warnings
    );
  }

  if (inputs.solveFor === "n") {
    if (solvedRaw <= 0 || solvedRaw > FINANCIAL_CALCULATOR_MAX_PERIODS) {
      return buildTvmErrorResult(inputs.solveFor, inputs.paymentTiming, ["periods"], warnings);
    }
    if (Math.abs(solvedRaw - Math.round(solvedRaw)) > 1e-7) {
      return buildTvmErrorResult(inputs.solveFor, inputs.paymentTiming, ["fractionalPeriodsUnsupported"], warnings);
    }
  }

  const solvedValue = inputs.solveFor === "i" ? solvedRaw * 100 : solvedRaw;
  const normalizedInputs =
    inputs.solveFor === "i"
      ? { ...inputs, i: solvedValue }
      : withSolvedInput(inputs, solvedValue);
  const residual = roundTo(evaluateTvmEquation(normalizedInputs), 8);
  const totalPayments = Number.isFinite(normalizedInputs.n) ? roundMoney(normalizedInputs.pmt * normalizedInputs.n) : null;

  return {
    mode: "tvm",
    ok: true,
    solveFor: inputs.solveFor,
    solvedValue,
    roundedSolvedValue: roundSolvedValue(inputs.solveFor, solvedValue),
    normalizedInputs,
    residual,
    totalPayments,
    paymentTiming: inputs.paymentTiming,
    errors: [],
    warnings,
    sourceVersion: CALCULADORA_FINANCEIRA_ONLINE_SOURCE_VERSION,
  };
}

export function calculateFinancialCashflows(inputs: FinancialCashflowInputs): FinancialCashflowResult {
  const validationErrors = validateFinancialCashflowInputs(inputs);
  const warnings = defaultWarnings();

  if (validationErrors.length > 0) {
    return {
      mode: "cashflows",
      ok: false,
      npv: null,
      roundedNpv: null,
      irrPerPeriod: null,
      irrPerPeriodPercent: null,
      annualizedIrr: null,
      annualizedIrrPercent: null,
      totalInflows: 0,
      totalOutflows: 0,
      netCashflow: 0,
      cashflowCount: inputs.cashflows.length,
      signChanges: 0,
      periodLabel: inputs.periodLabel,
      errors: validationErrors,
      warnings,
      sourceVersion: CALCULADORA_FINANCEIRA_ONLINE_SOURCE_VERSION,
    };
  }

  const totalInflows = roundMoney(inputs.cashflows.filter((cashflow) => cashflow > 0).reduce((sum, value) => sum + value, 0));
  const totalOutflows = roundMoney(
    Math.abs(inputs.cashflows.filter((cashflow) => cashflow < 0).reduce((sum, value) => sum + value, 0))
  );
  const netCashflow = roundMoney(inputs.cashflows.reduce((sum, value) => sum + value, 0));
  const signChanges = countCashflowSignChanges(inputs.cashflows);

  if (signChanges > 1) {
    warnings.push("multipleSignChanges");
  }

  const npv = calculateFinancialNpv(inputs.discountRate, inputs.cashflows);
  const errors: FinancialCalculationError[] = [];
  let irrPerPeriod: number | null = null;

  if (!hasPositiveAndNegative(inputs.cashflows)) {
    errors.push("cashflowSigns");
  } else {
    irrPerPeriod = calculateIrr(inputs.cashflows);
    if (irrPerPeriod === null) errors.push("irrNonConvergence");
  }

  let annualizedIrr: number | null = null;
  if (irrPerPeriod !== null) {
    if (inputs.periodLabel === "monthly") annualizedIrr = Math.pow(1 + irrPerPeriod, 12) - 1;
    if (inputs.periodLabel === "annual") annualizedIrr = irrPerPeriod;
  }

  return {
    mode: "cashflows",
    ok: errors.length === 0,
    npv,
    roundedNpv: roundMoney(npv),
    irrPerPeriod,
    irrPerPeriodPercent: irrPerPeriod === null ? null : roundTo(irrPerPeriod * 100, 6),
    annualizedIrr,
    annualizedIrrPercent: annualizedIrr === null ? null : roundTo(annualizedIrr * 100, 6),
    totalInflows,
    totalOutflows,
    netCashflow,
    cashflowCount: inputs.cashflows.length,
    signChanges,
    periodLabel: inputs.periodLabel,
    errors,
    warnings,
    sourceVersion: CALCULADORA_FINANCEIRA_ONLINE_SOURCE_VERSION,
  };
}

export function calcularCalculadoraFinanceiraOnline(
  inputs: CalculadoraFinanceiraOnlineInputs
): CalculadoraFinanceiraOnlineResult {
  const validationErrors = validateCalculadoraFinanceiraOnlineInputs(inputs);
  const sharedErrors = validationErrors.filter((error) => error === "mode" || error === "sourceVersion");

  if (sharedErrors.length > 0) {
    if (inputs.mode === "cashflows") {
      return {
        mode: "cashflows",
        ok: false,
        npv: null,
        roundedNpv: null,
        irrPerPeriod: null,
        irrPerPeriodPercent: null,
        annualizedIrr: null,
        annualizedIrrPercent: null,
        totalInflows: 0,
        totalOutflows: 0,
        netCashflow: 0,
        cashflowCount: inputs.cashflows.cashflows.length,
        signChanges: 0,
        periodLabel: inputs.cashflows.periodLabel,
        errors: sharedErrors,
        warnings: defaultWarnings(),
        sourceVersion: CALCULADORA_FINANCEIRA_ONLINE_SOURCE_VERSION,
      };
    }
    return buildTvmErrorResult(inputs.tvm.solveFor, inputs.tvm.paymentTiming, sharedErrors);
  }

  return inputs.mode === "cashflows" ? calculateFinancialCashflows(inputs.cashflows) : calculateFinancialTvm(inputs.tvm);
}

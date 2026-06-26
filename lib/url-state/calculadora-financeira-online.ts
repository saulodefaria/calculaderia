import {
  CALCULADORA_FINANCEIRA_ONLINE_SUPPORTED_SOURCE_VERSION,
  getDefaultCalculadoraFinanceiraOnlineInputs,
  validateCalculadoraFinanceiraOnlineInputs,
  type CalculadoraFinanceiraOnlineInputs,
  type FinancialCalculatorMode,
  type FinancialPeriodLabel,
  type PaymentTiming,
  type TvmSolveFor,
} from "../calculators/calculadora-financeira-online";

export const CALCULADORA_FINANCEIRA_ONLINE_PARAM_KEYS = {
  mode: "m",
  solveFor: "sf",
  periods: "n",
  periodicRate: "i",
  presentValue: "pv",
  payment: "pmt",
  futureValue: "fv",
  paymentTiming: "due",
  discountRate: "dr",
  cashflows: "cf",
  periodLabel: "pl",
  sourceVersion: "sv",
} as const;

const MODE_CODES: Record<FinancialCalculatorMode, string> = {
  tvm: "t",
  cashflows: "c",
};

const MODE_DECODE: Record<string, FinancialCalculatorMode> = {
  t: "tvm",
  c: "cashflows",
};

const SOLVE_FOR_CODES: Record<TvmSolveFor, string> = {
  n: "n",
  i: "i",
  pv: "pv",
  pmt: "pmt",
  fv: "fv",
};

const SOLVE_FOR_DECODE: Record<string, TvmSolveFor> = {
  n: "n",
  i: "i",
  pv: "pv",
  pmt: "pmt",
  fv: "fv",
};

const PAYMENT_TIMING_CODES: Record<PaymentTiming, string> = {
  end: "0",
  begin: "1",
};

const PAYMENT_TIMING_DECODE: Record<string, PaymentTiming> = {
  "0": "end",
  "1": "begin",
};

const PERIOD_LABEL_CODES: Record<FinancialPeriodLabel, string> = {
  periodic: "p",
  monthly: "m",
  annual: "a",
};

const PERIOD_LABEL_DECODE: Record<string, FinancialPeriodLabel> = {
  p: "periodic",
  m: "monthly",
  a: "annual",
};

export interface CalculadoraFinanceiraOnlineUrlState {
  inputs: CalculadoraFinanceiraOnlineInputs;
}

function parseOptionalNumber(params: URLSearchParams, key: string, fallback: number): number | null {
  const raw = params.get(key);
  if (raw === null || raw === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function parseRequiredNumber(params: URLSearchParams, key: string): number | null {
  const raw = params.get(key);
  if (raw === null || raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function setNumberIfChanged(params: URLSearchParams, key: string, value: number, defaultValue: number) {
  if (value !== defaultValue) params.set(key, value.toString());
}

function parseCashflows(raw: string | null): number[] | null {
  if (!raw) return null;

  const parts = raw.split(",");
  if (parts.length < 2 || parts.length > 100) return null;

  const values: number[] = [];
  for (const part of parts) {
    if (part.trim() === "") return null;
    const value = Number(part);
    if (!Number.isFinite(value)) return null;
    values.push(value);
  }
  return values;
}

export function encodeCalculadoraFinanceiraOnlineState(
  state: CalculadoraFinanceiraOnlineUrlState
): URLSearchParams {
  const params = new URLSearchParams();
  const defaults = getDefaultCalculadoraFinanceiraOnlineInputs();
  const { inputs } = state;

  params.set(CALCULADORA_FINANCEIRA_ONLINE_PARAM_KEYS.mode, MODE_CODES[inputs.mode]);
  params.set(CALCULADORA_FINANCEIRA_ONLINE_PARAM_KEYS.sourceVersion, CALCULADORA_FINANCEIRA_ONLINE_SUPPORTED_SOURCE_VERSION);

  if (inputs.mode === "tvm") {
    params.set(CALCULADORA_FINANCEIRA_ONLINE_PARAM_KEYS.solveFor, SOLVE_FOR_CODES[inputs.tvm.solveFor]);
    setNumberIfChanged(params, CALCULADORA_FINANCEIRA_ONLINE_PARAM_KEYS.periods, inputs.tvm.n, defaults.tvm.n);
    setNumberIfChanged(params, CALCULADORA_FINANCEIRA_ONLINE_PARAM_KEYS.periodicRate, inputs.tvm.i, defaults.tvm.i);
    setNumberIfChanged(params, CALCULADORA_FINANCEIRA_ONLINE_PARAM_KEYS.presentValue, inputs.tvm.pv, defaults.tvm.pv);
    setNumberIfChanged(params, CALCULADORA_FINANCEIRA_ONLINE_PARAM_KEYS.payment, inputs.tvm.pmt, defaults.tvm.pmt);
    setNumberIfChanged(params, CALCULADORA_FINANCEIRA_ONLINE_PARAM_KEYS.futureValue, inputs.tvm.fv, defaults.tvm.fv);
    if (inputs.tvm.paymentTiming !== defaults.tvm.paymentTiming) {
      params.set(CALCULADORA_FINANCEIRA_ONLINE_PARAM_KEYS.paymentTiming, PAYMENT_TIMING_CODES[inputs.tvm.paymentTiming]);
    }
  } else {
    params.set(CALCULADORA_FINANCEIRA_ONLINE_PARAM_KEYS.discountRate, inputs.cashflows.discountRate.toString());
    params.set(CALCULADORA_FINANCEIRA_ONLINE_PARAM_KEYS.cashflows, inputs.cashflows.cashflows.join(","));
    if (inputs.cashflows.periodLabel !== defaults.cashflows.periodLabel) {
      params.set(CALCULADORA_FINANCEIRA_ONLINE_PARAM_KEYS.periodLabel, PERIOD_LABEL_CODES[inputs.cashflows.periodLabel]);
    }
  }

  return params;
}

export function decodeCalculadoraFinanceiraOnlineState(
  params: URLSearchParams
): CalculadoraFinanceiraOnlineUrlState | null {
  if (!params.toString()) return null;
  if (
    params.get(CALCULADORA_FINANCEIRA_ONLINE_PARAM_KEYS.sourceVersion) !==
    CALCULADORA_FINANCEIRA_ONLINE_SUPPORTED_SOURCE_VERSION
  ) {
    return null;
  }

  const defaults = getDefaultCalculadoraFinanceiraOnlineInputs();
  const modeRaw = params.get(CALCULADORA_FINANCEIRA_ONLINE_PARAM_KEYS.mode);
  const mode = modeRaw ? MODE_DECODE[modeRaw] : null;
  if (!mode) return null;

  const inputs: CalculadoraFinanceiraOnlineInputs = {
    ...defaults,
    mode,
  };

  if (mode === "tvm") {
    const solveForRaw = params.get(CALCULADORA_FINANCEIRA_ONLINE_PARAM_KEYS.solveFor);
    const solveFor = solveForRaw ? SOLVE_FOR_DECODE[solveForRaw] : null;
    const n = parseOptionalNumber(params, CALCULADORA_FINANCEIRA_ONLINE_PARAM_KEYS.periods, defaults.tvm.n);
    const i = parseOptionalNumber(params, CALCULADORA_FINANCEIRA_ONLINE_PARAM_KEYS.periodicRate, defaults.tvm.i);
    const pv = parseOptionalNumber(params, CALCULADORA_FINANCEIRA_ONLINE_PARAM_KEYS.presentValue, defaults.tvm.pv);
    const pmt = parseOptionalNumber(params, CALCULADORA_FINANCEIRA_ONLINE_PARAM_KEYS.payment, defaults.tvm.pmt);
    const fv = parseOptionalNumber(params, CALCULADORA_FINANCEIRA_ONLINE_PARAM_KEYS.futureValue, defaults.tvm.fv);
    const paymentTimingRaw = params.get(CALCULADORA_FINANCEIRA_ONLINE_PARAM_KEYS.paymentTiming);
    const paymentTiming = paymentTimingRaw
      ? PAYMENT_TIMING_DECODE[paymentTimingRaw]
      : defaults.tvm.paymentTiming;

    if (!solveFor || n === null || i === null || pv === null || pmt === null || fv === null || !paymentTiming) {
      return null;
    }

    inputs.tvm = {
      solveFor,
      n,
      i,
      pv,
      pmt,
      fv,
      paymentTiming,
    };
  } else {
    const discountRate = parseRequiredNumber(params, CALCULADORA_FINANCEIRA_ONLINE_PARAM_KEYS.discountRate);
    const cashflows = parseCashflows(params.get(CALCULADORA_FINANCEIRA_ONLINE_PARAM_KEYS.cashflows));
    const periodLabelRaw = params.get(CALCULADORA_FINANCEIRA_ONLINE_PARAM_KEYS.periodLabel);
    const periodLabel = periodLabelRaw ? PERIOD_LABEL_DECODE[periodLabelRaw] : defaults.cashflows.periodLabel;

    if (discountRate === null || cashflows === null || !periodLabel) return null;

    inputs.cashflows = {
      discountRate,
      cashflows,
      periodLabel,
    };
  }

  return validateCalculadoraFinanceiraOnlineInputs(inputs).length === 0 ? { inputs } : null;
}

export function generateCalculadoraFinanceiraOnlineShareUrl(
  baseUrl: string,
  state: CalculadoraFinanceiraOnlineUrlState
): string {
  const params = encodeCalculadoraFinanceiraOnlineState(state);
  const url = new URL(baseUrl);
  url.search = params.toString();
  return url.toString();
}

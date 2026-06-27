"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Calculator, Landmark, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CALCULADORA_FINANCEIRA_ONLINE_SUPPORTED_SOURCE_VERSION,
  getDefaultCalculadoraFinanceiraOnlineInputs,
  validateCalculadoraFinanceiraOnlineInputs,
  type CalculadoraFinanceiraOnlineInputs,
  type FinancialCalculatorMode,
  type FinancialPeriodLabel,
  type PaymentTiming,
  type TvmSolveFor,
} from "@/lib/calculators/calculadora-financeira-online";
import { parseCashflowValue } from "@/lib/calculators/tir";

interface CalculatorFormProps {
  onCalculate: (inputs: CalculadoraFinanceiraOnlineInputs) => void;
  initialValues?: CalculadoraFinanceiraOnlineInputs | null;
}

function formatInputNumber(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toString().replace(".", ",");
}

function parseNumberInput(value: string): number | null {
  if (value.trim() === "") return null;
  return parseCashflowValue(value);
}

function parseCashflowsText(text: string): number[] | null {
  const separator = text.includes("\n") ? /\n+/ : /[;\t]+/;
  const parts = text
    .split(separator)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) return null;

  const values: number[] = [];
  for (const part of parts) {
    const parsed = parseCashflowValue(part);
    if (parsed === null) return null;
    values.push(parsed);
  }

  return values;
}

function cashflowsToText(values: number[]): string {
  return values.map(formatInputNumber).join("\n");
}

export function CalculatorForm({ onCalculate, initialValues }: CalculatorFormProps) {
  const t = useTranslations("calculators.calculadora-financeira-online.form");
  const defaults = useMemo(() => initialValues ?? getDefaultCalculadoraFinanceiraOnlineInputs(), [initialValues]);

  const [mode, setMode] = useState<FinancialCalculatorMode>(defaults.mode);
  const [solveFor, setSolveFor] = useState<TvmSolveFor>(defaults.tvm.solveFor);
  const [periods, setPeriods] = useState(() => formatInputNumber(defaults.tvm.n));
  const [periodicRate, setPeriodicRate] = useState(() => formatInputNumber(defaults.tvm.i));
  const [presentValue, setPresentValue] = useState(() => formatInputNumber(defaults.tvm.pv));
  const [payment, setPayment] = useState(() => formatInputNumber(defaults.tvm.pmt));
  const [futureValue, setFutureValue] = useState(() => formatInputNumber(defaults.tvm.fv));
  const [paymentTiming, setPaymentTiming] = useState<PaymentTiming>(defaults.tvm.paymentTiming);
  const [discountRate, setDiscountRate] = useState(() => formatInputNumber(defaults.cashflows.discountRate));
  const [cashflows, setCashflows] = useState(() => cashflowsToText(defaults.cashflows.cashflows));
  const [periodLabel, setPeriodLabel] = useState<FinancialPeriodLabel>(defaults.cashflows.periodLabel);
  const [error, setError] = useState<string | null>(null);

  const parseTvmField = (field: TvmSolveFor, rawValue: string): number | null => {
    const parsed = parseNumberInput(rawValue);
    if (parsed !== null) return parsed;
    return solveFor === field ? 0 : null;
  };

  const buildInputs = (): CalculadoraFinanceiraOnlineInputs | null => {
    const n = parseTvmField("n", periods);
    const i = parseTvmField("i", periodicRate);
    const pv = parseTvmField("pv", presentValue);
    const pmt = parseTvmField("pmt", payment);
    const fv = parseTvmField("fv", futureValue);
    const dr = parseNumberInput(discountRate);
    const parsedCashflows = parseCashflowsText(cashflows);

    if (mode === "tvm" && (n === null || i === null || pv === null || pmt === null || fv === null)) {
      setError(t("validation.number"));
      return null;
    }

    if (mode === "cashflows" && (dr === null || parsedCashflows === null)) {
      setError(t("validation.cashflows"));
      return null;
    }

    return {
      mode,
      tvm: {
        solveFor,
        n: n ?? defaults.tvm.n,
        i: i ?? defaults.tvm.i,
        pv: pv ?? defaults.tvm.pv,
        pmt: pmt ?? defaults.tvm.pmt,
        fv: fv ?? defaults.tvm.fv,
        paymentTiming,
      },
      cashflows: {
        discountRate: dr ?? defaults.cashflows.discountRate,
        cashflows: parsedCashflows ?? defaults.cashflows.cashflows,
        periodLabel,
      },
      sourceVersion: CALCULADORA_FINANCEIRA_ONLINE_SUPPORTED_SOURCE_VERSION,
    };
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextInputs = buildInputs();
    if (!nextInputs) return;

    const validationErrors = validateCalculadoraFinanceiraOnlineInputs(nextInputs);
    if (validationErrors.length > 0) {
      setError(t(`validation.${validationErrors[0]}`));
      return;
    }

    setError(null);
    onCalculate(nextInputs);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-5 w-5" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={mode} onValueChange={(value) => setMode(value as FinancialCalculatorMode)}>
            <TabsList className="grid h-auto w-full grid-cols-2">
              <TabsTrigger id="financial-mode-tvm" value="tvm" data-testid="financial-mode-tvm">
                <Landmark className="h-4 w-4" />
                {t("modes.tvm")}
              </TabsTrigger>
              <TabsTrigger id="financial-mode-cashflows" value="cashflows" data-testid="financial-mode-cashflows">
                <LineChart className="h-4 w-4" />
                {t("modes.cashflows")}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {mode === "tvm" ? (
            <section className="space-y-5" aria-labelledby="financial-tvm-section">
              <div>
                <h2
                  id="financial-tvm-section"
                  className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("sections.tvm")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("helpers.tvm")}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="financialSolveFor">{t("fields.solveFor.label")}</Label>
                  <Select value={solveFor} onValueChange={(value) => setSolveFor(value as TvmSolveFor)}>
                    <SelectTrigger id="financialSolveFor" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["pmt", "fv", "pv", "i", "n"] as TvmSolveFor[]).map((value) => (
                        <SelectItem key={value} value={value}>
                          {t(`fields.solveFor.options.${value}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="financialPeriods">{t("fields.periods.label")}</Label>
                  <Input
                    id="financialPeriods"
                    inputMode="decimal"
                    value={periods}
                    onChange={(event) => setPeriods(event.target.value)}
                    placeholder="12"
                    aria-describedby="financial-period-help"
                  />
                  <p id="financial-period-help" className="text-xs text-muted-foreground">
                    {t("fields.periods.help")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="financialPeriodicRate">{t("fields.periodicRate.label")}</Label>
                  <Input
                    id="financialPeriodicRate"
                    inputMode="decimal"
                    value={periodicRate}
                    onChange={(event) => setPeriodicRate(event.target.value)}
                    placeholder="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="financialPresentValue">{t("fields.presentValue.label")}</Label>
                  <Input
                    id="financialPresentValue"
                    inputMode="decimal"
                    value={presentValue}
                    onChange={(event) => setPresentValue(event.target.value)}
                    placeholder="100000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="financialPayment">{t("fields.payment.label")}</Label>
                  <Input
                    id="financialPayment"
                    inputMode="decimal"
                    value={payment}
                    onChange={(event) => setPayment(event.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="financialFutureValue">{t("fields.futureValue.label")}</Label>
                  <Input
                    id="financialFutureValue"
                    inputMode="decimal"
                    value={futureValue}
                    onChange={(event) => setFutureValue(event.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                  <Label htmlFor="financialPaymentTiming">{t("fields.paymentTiming.label")}</Label>
                  <Select value={paymentTiming} onValueChange={(value) => setPaymentTiming(value as PaymentTiming)}>
                    <SelectTrigger id="financialPaymentTiming" className="w-full sm:w-80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="end">{t("fields.paymentTiming.options.end")}</SelectItem>
                      <SelectItem value="begin">{t("fields.paymentTiming.options.begin")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>
          ) : (
            <section className="space-y-5" aria-labelledby="financial-cashflows-section">
              <div>
                <h2
                  id="financial-cashflows-section"
                  className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("sections.cashflows")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("helpers.cashflows")}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="financialDiscountRate">{t("fields.discountRate.label")}</Label>
                    <Input
                      id="financialDiscountRate"
                      inputMode="decimal"
                      value={discountRate}
                      onChange={(event) => setDiscountRate(event.target.value)}
                      placeholder="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="financialPeriodLabel">{t("fields.periodLabel.label")}</Label>
                    <Select value={periodLabel} onValueChange={(value) => setPeriodLabel(value as FinancialPeriodLabel)}>
                      <SelectTrigger id="financialPeriodLabel" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="periodic">{t("fields.periodLabel.options.periodic")}</SelectItem>
                        <SelectItem value="monthly">{t("fields.periodLabel.options.monthly")}</SelectItem>
                        <SelectItem value="annual">{t("fields.periodLabel.options.annual")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="financialCashflows">{t("fields.cashflows.label")}</Label>
                  <textarea
                    id="financialCashflows"
                    value={cashflows}
                    onChange={(event) => setCashflows(event.target.value)}
                    rows={7}
                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-36 w-full rounded-md border px-3 py-2 font-mono text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder={"-1000\n400\n400\n400"}
                  />
                  <p className="text-xs text-muted-foreground">{t("fields.cashflows.help")}</p>
                </div>
              </div>
            </section>
          )}

          <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            {t("helpers.signConvention")}
          </div>

          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full sm:w-auto">
            {t("submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

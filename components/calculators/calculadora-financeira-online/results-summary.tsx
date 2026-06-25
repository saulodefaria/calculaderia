"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, BadgeDollarSign, Calculator, FileText, LineChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils/index";
import type {
  CalculadoraFinanceiraOnlineResult,
  FinancialCashflowResult,
  FinancialTvmResult,
  TvmSolveFor,
} from "@/lib/calculators/calculadora-financeira-online";

interface ResultsSummaryProps {
  resultado: CalculadoraFinanceiraOnlineResult;
}

function SummaryCard({
  label,
  value,
  helper,
  tone = "default",
  testId,
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: "default" | "positive" | "warning";
  testId?: string;
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : "";

  return (
    <div className="flex min-h-28 flex-col justify-center rounded-lg border p-4" data-testid={testId}>
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`mt-1 break-words font-mono text-xl font-bold ${toneClass}`}>{value}</span>
      {helper && <span className="mt-1 text-xs text-muted-foreground">{helper}</span>}
    </div>
  );
}

function formatSolvedValue(solveFor: TvmSolveFor, value: number | null): string {
  if (value === null) return "-";
  if (solveFor === "i") return formatPercent(value);
  if (solveFor === "n") return value.toLocaleString("pt-BR", { maximumFractionDigits: 6 });
  return formatCurrency(value);
}

function ErrorPanel({ errors }: { errors: string[] }) {
  const t = useTranslations("calculators.calculadora-financeira-online.results");
  if (errors.length === 0) return null;

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <AlertTriangle className="h-4 w-4" />
        {t("errors.title")}
      </h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {errors.map((error) => (
          <li key={error}>{t(`errors.items.${error}`)}</li>
        ))}
      </ul>
    </div>
  );
}

function WarningPanel({ warnings }: { warnings: string[] }) {
  const t = useTranslations("calculators.calculadora-financeira-online.results");

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <AlertTriangle className="h-4 w-4" />
        {t("warnings.title")}
      </h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {warnings.map((warning) => (
          <li key={warning}>{t(`warnings.items.${warning}`)}</li>
        ))}
      </ul>
    </div>
  );
}

function TvmResults({ resultado }: { resultado: FinancialTvmResult }) {
  const t = useTranslations("calculators.calculadora-financeira-online.results");

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label={t("cards.solvedValue", { variable: t(`variables.${resultado.solveFor}`) })}
          value={formatSolvedValue(resultado.solveFor, resultado.roundedSolvedValue)}
          helper={t(`timing.${resultado.paymentTiming}`)}
          tone={resultado.ok ? "positive" : "warning"}
          testId="financial-tvm-solved-result"
        />
        <SummaryCard
          label={t("cards.residual")}
          value={resultado.residual === null ? "-" : resultado.residual.toLocaleString("pt-BR", { maximumFractionDigits: 8 })}
          helper={t("cards.residualHelper")}
          testId="financial-tvm-residual-result"
        />
        <SummaryCard
          label={t("cards.totalPayments")}
          value={resultado.totalPayments === null ? "-" : formatCurrency(resultado.totalPayments)}
          testId="financial-tvm-total-payments-result"
        />
        <SummaryCard
          label={t("cards.sourceVersion")}
          value={resultado.sourceVersion.id}
          helper={resultado.sourceVersion.formulasAccessedAt}
          testId="financial-source-version"
        />
      </div>

      {resultado.normalizedInputs && (
        <div className="rounded-lg border bg-muted/20 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Calculator className="h-4 w-4" />
            {t("equation.title")}
          </h3>
          <p className="mt-2 font-mono text-sm text-muted-foreground">{t("equation.tvm")}</p>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">n</dt>
              <dd className="font-mono font-semibold">{resultado.normalizedInputs.n}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">i</dt>
              <dd className="font-mono font-semibold">{formatPercent(resultado.normalizedInputs.i)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">PV</dt>
              <dd className="font-mono font-semibold">{formatCurrency(resultado.normalizedInputs.pv)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">PMT</dt>
              <dd className="font-mono font-semibold">{formatCurrency(resultado.normalizedInputs.pmt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">FV</dt>
              <dd className="font-mono font-semibold">{formatCurrency(resultado.normalizedInputs.fv)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("equation.timing")}</dt>
              <dd className="font-semibold">{t(`timing.${resultado.normalizedInputs.paymentTiming}`)}</dd>
            </div>
          </dl>
        </div>
      )}
    </>
  );
}

function CashflowResults({ resultado }: { resultado: FinancialCashflowResult }) {
  const t = useTranslations("calculators.calculadora-financeira-online.results");

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard
          label={t("cards.npv")}
          value={resultado.roundedNpv === null ? "-" : formatCurrency(resultado.roundedNpv)}
          helper={t("cards.npvHelper")}
          tone={resultado.roundedNpv !== null && resultado.roundedNpv >= 0 ? "positive" : "warning"}
          testId="financial-cashflow-npv-result"
        />
        <SummaryCard
          label={t("cards.irr")}
          value={resultado.irrPerPeriodPercent === null ? "-" : formatPercent(resultado.irrPerPeriodPercent)}
          helper={t(`periodLabel.${resultado.periodLabel}`)}
          tone={resultado.irrPerPeriodPercent !== null ? "positive" : "warning"}
          testId="financial-cashflow-irr-result"
        />
        <SummaryCard
          label={t("cards.annualizedIrr")}
          value={resultado.annualizedIrrPercent === null ? "-" : formatPercent(resultado.annualizedIrrPercent)}
          helper={resultado.annualizedIrrPercent === null ? t("cards.notAnnualized") : undefined}
          testId="financial-cashflow-annual-irr-result"
        />
        <SummaryCard label={t("cards.inflows")} value={formatCurrency(resultado.totalInflows)} />
        <SummaryCard label={t("cards.outflows")} value={formatCurrency(resultado.totalOutflows)} />
      </div>

      <div className="rounded-lg border bg-muted/20 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <LineChart className="h-4 w-4" />
          {t("cashflowMemo.title")}
        </h3>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-muted-foreground">{t("cashflowMemo.count")}</dt>
            <dd className="font-mono font-semibold">{resultado.cashflowCount}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("cashflowMemo.net")}</dt>
            <dd className="font-mono font-semibold">{formatCurrency(resultado.netCashflow)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("cashflowMemo.signChanges")}</dt>
            <dd className="font-mono font-semibold">{resultado.signChanges}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("cashflowMemo.period")}</dt>
            <dd className="font-semibold">{t(`periodLabel.${resultado.periodLabel}`)}</dd>
          </div>
        </dl>
      </div>
    </>
  );
}

export function ResultsSummary({ resultado }: ResultsSummaryProps) {
  const t = useTranslations("calculators.calculadora-financeira-online.results");

  return (
    <Card data-testid="financial-results">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BadgeDollarSign className="h-5 w-5" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t(`badges.${resultado.mode}`)}
          </span>
          <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("badges.source", { version: resultado.sourceVersion.id })}
          </span>
        </div>

        <ErrorPanel errors={resultado.errors} />

        {resultado.mode === "tvm" ? <TvmResults resultado={resultado} /> : <CashflowResults resultado={resultado} />}

        <WarningPanel warnings={resultado.warnings} />

        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <FileText className="mt-0.5 h-4 w-4 flex-none" />
            <span>
              <strong className="text-foreground">{t("method.title")}</strong> {t("method.text")}
            </span>
          </p>
          <p className="mt-2">{t("method.privacy")}</p>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, BadgeDollarSign, CalendarClock, Database, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CorrecaoIgpmResult } from "@/lib/calculators/correcao-igpm";
import { formatCurrency } from "@/lib/utils/index";

interface ResultsSummaryProps {
  result: CorrecaoIgpmResult;
  onUseLatest: () => void;
}

function monthLabel(month: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${month}-01T00:00:00Z`)
  );
}

function SummaryCard({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div className="min-w-0 rounded-lg border p-4" data-testid={testId}>
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words font-mono text-lg font-bold">{value}</dd>
    </div>
  );
}

export function ResultsSummary({ result, onUseLatest }: ResultsSummaryProps) {
  const t = useTranslations("calculators.correcao-igpm.results");
  const locale = useLocale();
  const finalMonth = monthLabel(result.mesFinalUsado, locale);
  const latestMonth = monthLabel(result.latestSourceMonth, locale);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BadgeDollarSign className="h-5 w-5" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-xl border bg-primary/5 p-5" data-testid="correcao-igpm-corrected-value">
          <p className="text-sm font-medium text-muted-foreground">{t("primaryLabel", { month: finalMonth })}</p>
          <p className="mt-2 break-words font-mono text-3xl font-bold tracking-tight text-primary">
            {formatCurrency(result.valorCorrigido)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground" data-testid="correcao-igpm-period">
            {t("period", {
              start: monthLabel(result.mesInicialUsado, locale),
              end: finalMonth,
            })}
          </p>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label={t("cards.difference")} value={formatCurrency(result.diferencaNominal)} />
          <SummaryCard
            label={t("cards.accumulated")}
            value={`${result.variacaoAcumuladaPercentual.toLocaleString(locale, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}%`}
            testId="correcao-igpm-accumulated-percent"
          />
          <SummaryCard
            label={t("cards.factor")}
            value={result.fatorAcumulado.toFixed(8)}
            testId="correcao-igpm-factor"
          />
          <SummaryCard label={t("cards.months")} value={t("monthCount", { count: result.quantidadeMeses })} />
        </dl>

        <div
          className="rounded-lg border bg-muted/20 p-4 text-sm"
          data-testid="correcao-igpm-source-badge">
          <h3 className="flex items-center gap-2 font-semibold">
            <Database className="h-4 w-4" />
            {t("source.title")}
          </h3>
          <p className="mt-2 text-muted-foreground">
            {t("source.text", {
              series: result.seriesCode,
              latest: latestMonth,
              retrieved: result.retrievedAt,
            })}
          </p>
          {result.freshnessStatus === "stale" && (
            <p className="mt-2 flex items-start gap-2 text-amber-700 dark:text-amber-300">
              <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
              {t("source.stale")}
            </p>
          )}
        </div>

        {result.hasNewerData && (
          <div className="flex flex-col gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100 sm:flex-row sm:items-center sm:justify-between">
            <p>{t("newerData", { month: latestMonth })}</p>
            <Button type="button" variant="outline" size="sm" onClick={onUseLatest} data-testid="correcao-igpm-stale-data-action">
              <TrendingUp className="h-4 w-4" />
              {t("useLatest")}
            </Button>
          </div>
        )}

        <div
          className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
          data-testid="correcao-igpm-disclaimer">
          <h3 className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" />
            {t("marketNotice.title")}
          </h3>
          <p className="mt-2">{t("marketNotice.text")}</p>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, BadgeDollarSign, Clock, FileText, Percent, WalletCards } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils/index";
import type { InvestimentoResult, InvestimentoWarningCode } from "@/lib/calculators/investimento";
import type { InvestimentoUrlWarningCode } from "@/lib/url-state/investimento";

interface ResultsSummaryProps {
  resultado: InvestimentoResult;
  urlWarnings: InvestimentoUrlWarningCode[];
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

function uniqueWarnings(
  warnings: InvestimentoWarningCode[],
  urlWarnings: InvestimentoUrlWarningCode[]
): Array<InvestimentoWarningCode | InvestimentoUrlWarningCode> {
  return Array.from(new Set([...urlWarnings, ...warnings]));
}

export function ResultsSummary({ resultado, urlWarnings }: ResultsSummaryProps) {
  const t = useTranslations("calculators.investimento.results");
  const warnings = useMemo(() => uniqueWarnings(resultado.warnings, urlWarnings), [resultado.warnings, urlWarnings]);
  const primaryCard =
    resultado.mode === "requiredContribution"
      ? {
          label: t("cards.requiredContribution"),
          value: formatCurrency(resultado.aporteMensalNecessario ?? 0),
          helper: t("helpers.requiredContribution"),
          testId: "investimento-required-contribution-result",
        }
      : resultado.mode === "timeToGoal"
        ? {
            label: t("cards.timeToGoal"),
            value:
              resultado.mesesAteMeta === null || resultado.tempoAteMeta === null
                ? t("time.unreachable")
                : t("time.yearsMonths", {
                    years: resultado.tempoAteMeta.anos,
                    months: resultado.tempoAteMeta.meses,
                    total: resultado.mesesAteMeta,
                  }),
            helper: t("helpers.timeToGoal"),
            testId: "investimento-time-to-goal-result",
          }
        : {
            label: t("cards.finalNominal"),
            value: formatCurrency(resultado.valorFinalNominal),
            helper: t("helpers.finalNominal"),
            testId: "investimento-final-result",
          };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BadgeDollarSign className="h-5 w-5" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("badges.monthlyRate", { rate: formatPercent(resultado.taxaMensalEquivalente) })}
            </span>
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("badges.annualRate", { rate: formatPercent(resultado.taxaAnualEquivalente) })}
            </span>
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t(`badges.timing.${resultado.aporteTiming}`)}
            </span>
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("badges.sourceVersion", { version: resultado.sourceVersion.id })}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard {...primaryCard} tone={resultado.mode === "timeToGoal" && resultado.mesesAteMeta === null ? "warning" : "positive"} />
            {resultado.mode !== "projection" && (
              <SummaryCard
                label={t("cards.finalNominal")}
                value={formatCurrency(resultado.valorFinalNominal)}
                helper={t("helpers.finalNominal")}
                testId="investimento-final-result"
              />
            )}
            <SummaryCard label={t("cards.totalContributed")} value={formatCurrency(resultado.totalAportado)} />
            <SummaryCard
              label={t("cards.estimatedEarnings")}
              value={formatCurrency(resultado.totalJurosEstimados)}
              helper={formatPercent(resultado.percentualJuros)}
              tone={resultado.totalJurosEstimados >= 0 ? "positive" : "warning"}
            />
            {resultado.valorFinalReal !== null && (
              <SummaryCard
                label={t("cards.realValue")}
                value={formatCurrency(resultado.valorFinalReal)}
                helper={t("helpers.realValue")}
              />
            )}
          </div>

          {warnings.length > 0 && (
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
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Percent className="h-4 w-4" />
                {t("method.rates.title")}
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">{t("method.rates.monthly")}</dt>
                  <dd className="font-mono font-semibold">{formatPercent(resultado.taxaMensalEquivalente)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("method.rates.annual")}</dt>
                  <dd className="font-mono font-semibold">{formatPercent(resultado.taxaAnualEquivalente)}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <WalletCards className="h-4 w-4" />
                {t("method.contributions.title")}
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">{t("method.contributions.monthly")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.aporteMensalUsado)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("method.contributions.months")}</dt>
                  <dd className="font-mono font-semibold">{resultado.projectionSeries.length}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <FileText className="mt-0.5 h-4 w-4 flex-none" />
              <span>
                <strong className="text-foreground">{t("method.source.title")}</strong> {t("method.source.text")}
              </span>
            </p>
            <p className="mt-2 flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 flex-none" />
              <span>{t("method.source.accessDate", { date: resultado.sourceVersion.accessedAt })}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

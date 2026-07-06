"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, BadgeDollarSign, CalendarClock, FileText, Landmark, ReceiptText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils/index";
import type { ResultadoInssEmAtraso } from "@/lib/calculators/inss-em-atraso";

interface ResultsSummaryProps {
  resultado: ResultadoInssEmAtraso;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 0,
  }).format(value);
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
      <span className="text-xs font-medium uppercase text-muted-foreground">{label}</span>
      <span className={`mt-1 break-words font-mono text-xl font-bold ${toneClass}`}>{value}</span>
      {helper && <span className="mt-1 text-xs text-muted-foreground">{helper}</span>}
    </div>
  );
}

export function ResultsSummary({ resultado }: ResultsSummaryProps) {
  const t = useTranslations("calculators.inss-em-atraso.results");

  const calculationBlocked =
    resultado.statusRegularizacao === "staleSource" ||
    resultado.statusRegularizacao === "unsupportedHistoricalPeriod" ||
    resultado.statusRegularizacao === "noArrears" ||
    resultado.warnings.includes("selicIndisponivel");

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
            <span
              className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase text-muted-foreground"
              data-testid="inss-em-atraso-source-badge">
              {t("badges.source", {
                date: resultado.sourceVersion,
                selic: resultado.latestSelicMonth,
                payment: resultado.supportedPaymentMonth,
              })}
            </span>
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase text-muted-foreground">
              {t(`badges.category.${resultado.categoriaSegurado}`)}
            </span>
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase text-muted-foreground">
              {t(`badges.status.${resultado.statusRegularizacao}`)}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label={t("cards.total")}
              value={formatCurrency(resultado.totalEstimado)}
              helper={calculationBlocked ? t("cards.totalBlockedHelper") : t("cards.totalHelper")}
              tone={calculationBlocked ? "warning" : "positive"}
              testId="inss-em-atraso-total-result"
            />
            <SummaryCard
              label={t("cards.principal")}
              value={formatCurrency(resultado.valorPrincipal)}
              helper={t("cards.principalHelper")}
              testId="inss-em-atraso-principal-result"
            />
            <SummaryCard
              label={t("cards.additions")}
              value={formatCurrency(resultado.totalAcrescimos)}
              helper={`${formatPercent(resultado.multaPercentual * 100)} + ${formatPercent(
                resultado.jurosPercentual * 100
              )}`}
              testId="inss-em-atraso-acrescimos-result"
            />
            <SummaryCard
              label={t("cards.status")}
              value={t(`status.${resultado.statusRegularizacao}.short`)}
              helper={t(`status.${resultado.statusRegularizacao}.helper`)}
              tone={resultado.statusRegularizacao === "selfServiceLikely" ? "positive" : "warning"}
              testId="inss-em-atraso-status-result"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <ReceiptText className="h-4 w-4" />
                {t("formula.title")}
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">{t("formula.daysEstimated")}</dt>
                  <dd className="font-mono font-semibold">{formatNumber(resultado.diasAtrasoEstimados)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("formula.daysUsed")}</dt>
                  <dd className="font-mono font-semibold">{formatNumber(resultado.diasAtrasoUsados)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("formula.multa")}</dt>
                  <dd className="font-mono font-semibold">
                    {formatPercent(resultado.multaPercentual * 100)} / {formatCurrency(resultado.multa)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("formula.juros")}</dt>
                  <dd className="font-mono font-semibold">
                    {formatPercent(resultado.jurosPercentual * 100)} / {formatCurrency(resultado.juros)}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">{t("formula.helper")}</p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <CalendarClock className="h-4 w-4" />
                {t("dates.title")}
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">{t("dates.competence")}</dt>
                  <dd className="font-mono font-semibold">{resultado.competencia}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("dates.monthsWindow")}</dt>
                  <dd className="font-mono font-semibold">
                    {Number.isFinite(resultado.mesesEntreCompetenciaEPagamento)
                      ? formatNumber(resultado.mesesEntreCompetenciaEPagamento)
                      : "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("dates.due")}</dt>
                  <dd className="font-mono font-semibold">{resultado.dataVencimento}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("dates.payment")}</dt>
                  <dd className="font-mono font-semibold">{resultado.dataPagamento}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">{t(`status.${resultado.statusRegularizacao}.text`)}</p>
            </div>
          </div>

          {resultado.warnings.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="h-4 w-4" />
                {t("warnings.title")}
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {resultado.warnings.map((warning) => (
                  <li key={warning}>{t(`warnings.items.${warning}`)}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <Landmark className="mt-0.5 h-4 w-4 flex-none" />
              <span>
                <strong className="text-foreground">{t("source.title")}</strong> {t("source.text")}
              </span>
            </p>
            <p className="mt-2 flex items-start gap-2">
              <FileText className="mt-0.5 h-4 w-4 flex-none" />
              <span>{t("source.disclaimer")}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

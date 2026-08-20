"use client";

import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, Home, Landmark, PiggyBank, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResultadoFinanciarOuJuntarDinheiro } from "@/lib/calculators/financiar-ou-juntar-dinheiro";

interface ResultsSummaryProps {
  resultado: ResultadoFinanciarOuJuntarDinheiro;
  invalidUrl: boolean;
}

function formatCurrency(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === "pt-br" ? "pt-BR" : locale, {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function Metric({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div className="min-w-0 rounded-lg border bg-muted/20 p-3" data-testid={testId}>
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words font-mono text-lg font-bold">{value}</dd>
    </div>
  );
}

export function ResultsSummary({ resultado, invalidUrl }: ResultsSummaryProps) {
  const t = useTranslations("calculators.financiar-ou-juntar-dinheiro.results");
  const locale = useLocale();
  const { financeNow, waitForCash } = resultado;
  const firstMonth = waitForCash.primeiroMesAcessivel;
  const duration = firstMonth === null
    ? null
    : t("duration", { years: Math.floor(firstMonth / 12), months: firstMonth % 12 });
  const statusText =
    waitForCash.status === "already-affordable"
      ? t("status.already")
      : waitForCash.status === "reached-within-horizon"
        ? t("status.reached", { months: firstMonth ?? 0, duration: duration ?? "" })
        : waitForCash.status === "never-reached-under-assumptions"
          ? t("status.never")
          : t("status.notReached", { months: waitForCash.mesFinalConsiderado });
  const statusTone =
    waitForCash.status === "already-affordable" || waitForCash.status === "reached-within-horizon"
      ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20"
      : waitForCash.status === "never-reached-under-assumptions"
        ? "border-amber-500 bg-amber-50/60 dark:bg-amber-950/20"
        : "border-blue-500 bg-blue-50/60 dark:bg-blue-950/20";

  return (
    <div className="space-y-6">
      {invalidUrl && (
        <div
          role="status"
          data-testid="financiar-invalid-url"
          className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          {t("invalidUrl")}
        </div>
      )}

      <Card className={`border-2 ${statusTone}`}>
        <CardContent className="flex items-start gap-4 pt-6" aria-live="polite">
          <Home className="mt-1 h-8 w-8 flex-none" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t("status.eyebrow")}</p>
            <h2 className="mt-1 text-xl font-bold" data-testid="financiar-status">
              {statusText}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("status.helper")}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Landmark className="h-5 w-5" />
              {t("finance.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!financeNow.necessario ? (
              <p className="rounded-lg border bg-muted/30 p-4 text-sm">{t("finance.unnecessary")}</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Metric label={t("finance.principal")} value={formatCurrency(financeNow.valorFinanciado, locale)} />
                <Metric label={t("finance.method")} value={financeNow.metodo === "sac" ? "SAC" : "Price"} />
                <Metric
                  label={t("finance.term")}
                  value={t("finance.termValue", { count: financeNow.prazoMeses })}
                  testId="financiar-loan-term"
                />
                <Metric
                  label={t("finance.firstPayment")}
                  value={formatCurrency(financeNow.primeiraPrestacao, locale)}
                  testId="financiar-first-payment"
                />
                <Metric label={t("finance.lastPayment")} value={formatCurrency(financeNow.ultimaPrestacao, locale)} />
                <Metric label={t("finance.interest")} value={formatCurrency(financeNow.totalJuros, locale)} />
                <Metric label={t("finance.installments")} value={formatCurrency(financeNow.somaPrestacoes, locale)} />
                <Metric
                  label={t("finance.totalOutflow")}
                  value={formatCurrency(financeNow.desembolsoTotalAquisicao, locale)}
                />
                <Metric
                  label={t("finance.futureProperty")}
                  value={formatCurrency(financeNow.valorImovelFimPrazo, locale)}
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground">{t("finance.limits")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PiggyBank className="h-5 w-5" />
              {t("wait.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric
                label={t("wait.horizonBalance")}
                value={formatCurrency(waitForCash.saldoNoHorizonte, locale)}
                testId="financiar-horizon-balance"
              />
              <Metric label={t("wait.horizonPrice")} value={formatCurrency(waitForCash.precoNoHorizonte, locale)} />
              <Metric label={t("wait.shortfall")} value={formatCurrency(waitForCash.faltaNoHorizonte, locale)} />
              <Metric label={t("wait.surplus")} value={formatCurrency(waitForCash.sobraNoHorizonte, locale)} />
              <Metric
                label={t("wait.rentTotal")}
                value={formatCurrency(waitForCash.aluguelAcumuladoConsiderado, locale)}
              />
              <Metric
                label={t("wait.firstRent")}
                value={formatCurrency(waitForCash.aluguelPrimeiroMes, locale)}
              />
              <Metric
                label={t("wait.finalRent")}
                value={formatCurrency(waitForCash.aluguelFinalConsiderado, locale)}
              />
            </div>
            <p className="text-xs text-muted-foreground">{t("wait.rentHelper")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex items-start gap-3 pt-6 text-sm text-muted-foreground">
          <Scale className="mt-0.5 h-5 w-5 flex-none text-foreground" />
          <p>{t("tradeoff")}</p>
        </CardContent>
      </Card>
    </div>
  );
}

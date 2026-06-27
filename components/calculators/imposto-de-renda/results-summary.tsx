"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, BadgeDollarSign, FileText, Landmark, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils/index";
import type { ImpostoDeRendaMetodoUsado, ResultadoImpostoDeRenda } from "@/lib/calculators/imposto-de-renda";

interface ResultsSummaryProps {
  resultado: ResultadoImpostoDeRenda;
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

function getBalanceTone(saldo: number): "default" | "positive" | "warning" {
  if (saldo < 0) return "positive";
  if (saldo > 0) return "warning";
  return "default";
}

function getBalanceKey(saldo: number): "payable" | "refund" | "zero" {
  if (saldo > 0) return "payable";
  if (saldo < 0) return "refund";
  return "zero";
}

export function ResultsSummary({ resultado }: ResultsSummaryProps) {
  const t = useTranslations("calculators.imposto-de-renda.results");
  const balanceKey = getBalanceKey(resultado.saldo);
  const balanceValue = balanceKey === "zero" ? formatCurrency(0) : formatCurrency(Math.abs(resultado.saldo));
  const otherMethod: ImpostoDeRendaMetodoUsado = resultado.metodoUsado === "legais" ? "simplificado" : "legais";
  const selectedComparison = resultado.comparacao[resultado.metodoUsado];
  const otherComparison = resultado.comparacao[otherMethod];

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
              {t(`badges.year.${resultado.anoCalendario}`, { exercicio: resultado.exercicio })}
            </span>
            <span
              className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              data-testid="imposto-de-renda-source-badge">
              {t("badges.source", { version: resultado.sourceVersion, date: resultado.sourceAccessDate })}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label={t(`cards.balance.${balanceKey}`)}
              value={balanceValue}
              helper={t("cards.balance.helper")}
              tone={getBalanceTone(resultado.saldo)}
              testId="imposto-de-renda-balance-result"
            />
            <SummaryCard label={t("cards.taxDue")} value={formatCurrency(resultado.impostoDevido)} />
            <SummaryCard label={t("cards.taxPaid")} value={formatCurrency(resultado.totalImpostoPago)} />
            <SummaryCard
              label={t("cards.baseUsed")}
              value={formatCurrency(resultado.baseUsada)}
              helper={t(`method.names.${resultado.metodoUsado}`)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Scale className="h-4 w-4" />
                {t("comparison.title")}
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">{t("comparison.legal")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.comparacao.legais.impostoDevido)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("comparison.simplified")}</dt>
                  <dd className="font-mono font-semibold">
                    {formatCurrency(resultado.comparacao.simplificado.impostoDevido)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("comparison.legalBase")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.baseLegal)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("comparison.simplifiedBase")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.baseSimplificada)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                {resultado.metodoSolicitado === "auto"
                  ? t("comparison.autoChoice", {
                      selected: t(`method.names.${resultado.metodoUsado}`),
                      other: t(`method.names.${otherMethod}`),
                      selectedTax: formatCurrency(selectedComparison.impostoDevido),
                      otherTax: formatCurrency(otherComparison.impostoDevido),
                    })
                  : t("comparison.forcedChoice", { selected: t(`method.names.${resultado.metodoUsado}`) })}
              </p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Landmark className="h-4 w-4" />
                {t("tax.title")}
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">{t("tax.bracketRate")}</dt>
                  <dd className="font-mono font-semibold">{formatPercent(resultado.aliquotaFaixa * 100)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("tax.deduction")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.parcelaDeduzir)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("tax.beforeReduction")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.impostoAntesReducao)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("tax.annualReduction")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.reducaoAnual)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("tax.effectiveRate")}</dt>
                  <dd className="font-mono font-semibold">
                    {formatPercent(resultado.aliquotaEfetivaSobreRendimentos * 100)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("tax.exercicio")}</dt>
                  <dd className="font-mono font-semibold">{resultado.exercicio}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <FileText className="mt-0.5 h-4 w-4 flex-none" />
              <span>
                <strong className="text-foreground">{t("method.title")}</strong> {t("method.text")}
              </span>
            </p>
            <p className="mt-2">
              {t("method.sourceNote", {
                accessDate: resultado.sourceAccessDate,
                sourceVersion: resultado.sourceVersion,
              })}
            </p>
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
        </CardContent>
      </Card>
    </div>
  );
}

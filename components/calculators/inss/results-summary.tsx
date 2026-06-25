"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, BadgeDollarSign, FileText, Landmark, ReceiptText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils/index";
import type { ResultadoInss } from "@/lib/calculators/inss";

interface ResultsSummaryProps {
  resultado: ResultadoInss;
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
  const t = useTranslations("calculators.inss.results");

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
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase text-muted-foreground">
              {t("badges.table", { year: resultado.sourceVersion.tableYear })}
            </span>
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase text-muted-foreground">
              {t("badges.effectiveFrom", { date: resultado.sourceVersion.effectiveFrom })}
            </span>
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase text-muted-foreground">
              {t("badges.accessDate", { date: resultado.sourceVersion.accessedAt })}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label={t("cards.inss")}
              value={formatCurrency(resultado.inss)}
              helper={t(`categories.${resultado.categoriaSegurado}`)}
              tone="warning"
              testId="inss-contribution-result"
            />
            <SummaryCard
              label={t("cards.baseUsed")}
              value={formatCurrency(resultado.baseInss)}
              helper={t("cards.baseInformed", { value: formatCurrency(resultado.baseInformada) })}
              testId="inss-base-result"
            />
            <SummaryCard
              label={t("cards.effectiveRate")}
              value={formatPercent(resultado.aliquotaEfetiva * 100)}
              helper={t("cards.effectiveRateHelper")}
              testId="inss-effective-rate-result"
            />
            <SummaryCard
              label={t("cards.ceiling")}
              value={formatCurrency(resultado.tetoInss)}
              helper={
                resultado.margemAteTeto > 0
                  ? t("cards.marginToCeiling", { value: formatCurrency(resultado.margemAteTeto) })
                  : t("cards.ceilingReached")
              }
              tone={resultado.margemAteTeto === 0 ? "warning" : "default"}
              testId="inss-ceiling-result"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <ReceiptText className="h-4 w-4" />
                {t("memo.title")}
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">{t("memo.salary")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.salarioContribuicao)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("memo.otherPay")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.outrasRemuneracoes)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("memo.category")}</dt>
                  <dd className="font-semibold">{t(`categories.${resultado.categoriaSegurado}`)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("memo.slices")}</dt>
                  <dd className="font-mono font-semibold">{resultado.slices.length}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">{t("memo.helper")}</p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Landmark className="h-4 w-4" />
                {t("source.title")}
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">
                {t("source.text", {
                  accessDate: resultado.sourceVersion.accessedAt,
                  effectiveFrom: resultado.sourceVersion.effectiveFrom,
                })}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">{resultado.sourceVersion.portaria}</p>
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
              <FileText className="mt-0.5 h-4 w-4 flex-none" />
              <span>
                <strong className="text-foreground">{t("method.title")}</strong> {t("method.text")}
              </span>
            </p>
            <p className="mt-2">{t("method.disclaimer")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

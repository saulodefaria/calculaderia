"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, BadgeDollarSign, FileText, Landmark, ReceiptText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils/index";
import type { ResultadoFgts } from "@/lib/calculators/fgts";

interface ResultsSummaryProps {
  resultado: ResultadoFgts;
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

export function ResultsSummary({ resultado }: ResultsSummaryProps) {
  const t = useTranslations("calculators.fgts.results");

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
              {t("badges.sourceVersion", { version: resultado.sourceVersion.id })}
            </span>
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("badges.accessDate", { date: resultado.sourceVersion.accessedAt })}
            </span>
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {formatPercent(resultado.aliquotaDeposito * 100)}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <SummaryCard
              label={t("cards.monthlyDeposit")}
              value={formatCurrency(resultado.depositoMensal)}
              helper={t(`depositTypes.${resultado.tipoDeposito}`)}
              tone="positive"
              testId="fgts-monthly-deposit-result"
            />
            <SummaryCard
              label={t("cards.totalDeposits")}
              value={formatCurrency(resultado.totalDepositosEstimados)}
              helper={t("cards.totalDepositsHelper", { months: resultado.meses })}
              tone="positive"
              testId="fgts-total-deposits-result"
            />
            <SummaryCard
              label={t("cards.fineBase")}
              value={formatCurrency(resultado.baseMultaFgts)}
              helper={resultado.saldoFgtsInformado === null ? t("cards.estimatedBase") : t("cards.officialBase")}
              testId="fgts-fine-base-result"
            />
            <SummaryCard
              label={t("cards.fine")}
              value={formatCurrency(resultado.multaFgts)}
              helper={formatPercent(resultado.aliquotaMulta * 100)}
              tone={resultado.multaFgts > 0 ? "warning" : "default"}
              testId="fgts-fine-result"
            />
            <SummaryCard
              label={t("cards.withdrawal")}
              value={formatCurrency(resultado.saqueFgtsExibido)}
              helper={formatPercent(resultado.percentualSaqueExibido * 100)}
              testId="fgts-withdrawal-result"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <ReceiptText className="h-4 w-4" />
                {t("depositMemo.title")}
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">{t("depositMemo.monthlyBase")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.baseMensalFgts)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("depositMemo.depositRate")}</dt>
                  <dd className="font-mono font-semibold">{formatPercent(resultado.aliquotaDeposito * 100)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("depositMemo.months")}</dt>
                  <dd className="font-mono font-semibold">{resultado.meses}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("depositMemo.thirteenth")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.depositoDecimoTerceiro)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">{t("depositMemo.helper")}</p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Landmark className="h-4 w-4" />
                {t("fineMemo.title")}
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">{t("fineMemo.scenario")}</dt>
                  <dd className="font-semibold">{t(`terminationScenarios.${resultado.motivoRescisao}`)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("fineMemo.fineRate")}</dt>
                  <dd className="font-mono font-semibold">{formatPercent(resultado.aliquotaMulta * 100)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("fineMemo.balance")}</dt>
                  <dd className="font-mono font-semibold">
                    {resultado.saldoFgtsInformado === null ? "-" : formatCurrency(resultado.saldoFgtsInformado)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("fineMemo.withdrawalRate")}</dt>
                  <dd className="font-mono font-semibold">{formatPercent(resultado.percentualSaqueExibido * 100)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">{t("fineMemo.helper")}</p>
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
            <p className="mt-2">
              {t("method.sourceNote", {
                accessDate: resultado.sourceVersion.accessedAt,
                mteUpdate: resultado.sourceVersion.mteFgtsOverviewUpdatedAt,
                digitalUpdate: resultado.sourceVersion.mteFgtsDigitalRescisoryBaseUpdatedAt,
              })}
            </p>
            <p className="mt-2">{t("method.disclaimer")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

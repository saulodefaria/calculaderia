"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, BadgeDollarSign, Calculator, Landmark } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils/index";
import type { CdbResultado } from "@/lib/calculators/cdb";

interface ResultsSummaryProps {
  resultado: CdbResultado;
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
  const t = useTranslations("calculators.cdb.results");
  const totalTaxes = resultado.iofValor + resultado.irValor;

  return (
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
            {t("badges.sourceVersion", { version: resultado.inputs.sourceVersion })}
          </span>
          <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("badges.accessDate", { date: resultado.sourceVersion.accessedAt })}
          </span>
          <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t(`badges.businessDays.${resultado.diasUteisOrigem}`, { days: resultado.diasUteisUsados })}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label={t("cards.netValue")}
            value={formatCurrency(resultado.valorFinalLiquido)}
            tone="positive"
            testId="cdb-net-value"
          />
          <SummaryCard
            label={t("cards.netYield")}
            value={formatCurrency(resultado.rendimentoLiquido)}
            helper={formatPercent(resultado.rentabilidadeLiquidaPercent)}
            tone="positive"
            testId="cdb-net-yield"
          />
          <SummaryCard
            label={t("cards.grossYield")}
            value={formatCurrency(resultado.rendimentoBruto)}
            helper={formatPercent(resultado.rentabilidadeBrutaPercent)}
          />
          <SummaryCard label={t("cards.totalTaxes")} value={formatCurrency(totalTaxes)} tone="warning" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-muted/20 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Landmark className="h-4 w-4" />
              {t("taxes.title")}
            </h3>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">{t("taxes.iofRate")}</dt>
                <dd className="font-mono font-semibold">{formatPercent(resultado.iofAliquota)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("taxes.iof")}</dt>
                <dd className="font-mono font-semibold">{formatCurrency(resultado.iofValor)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("taxes.irRate")}</dt>
                <dd className="font-mono font-semibold">{formatPercent(resultado.irAliquota)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("taxes.ir")}</dt>
                <dd className="font-mono font-semibold">{formatCurrency(resultado.irValor)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">{t("taxes.helper")}</p>
          </div>

          <div className="rounded-lg border bg-muted/20 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Calculator className="h-4 w-4" />
              {t("rates.title")}
            </h3>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">{t("rates.gross")}</dt>
                <dd className="font-mono font-semibold">{formatPercent(resultado.rentabilidadeBrutaPercent)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("rates.net")}</dt>
                <dd className="font-mono font-semibold">{formatPercent(resultado.rentabilidadeLiquidaPercent)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("rates.annualizedNet")}</dt>
                <dd className="font-mono font-semibold">
                  {formatPercent(resultado.taxaEfetivaLiquidaAnualPercent)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("rates.daily")}</dt>
                <dd className="font-mono font-semibold">{formatPercent(resultado.taxaEfetivaDiariaPercent)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              {resultado.inputs.modo === "pos-cdi" ? t("rates.cdiHelper") : t("rates.preHelper")}
            </p>
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
      </CardContent>
    </Card>
  );
}

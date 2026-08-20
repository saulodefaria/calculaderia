"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, BadgeDollarSign, Calculator, Landmark, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils/index";
import type { InvestimentoCdiResultado, InvestimentoCdiWarningCode } from "@/lib/calculators/investimento-cdi";
import type { InvestimentoCdiUrlWarningCode } from "@/lib/url-state/investimento-cdi";

interface ResultsSummaryProps {
  resultado: InvestimentoCdiResultado;
  urlWarnings: InvestimentoCdiUrlWarningCode[];
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
  warnings: InvestimentoCdiWarningCode[],
  urlWarnings: InvestimentoCdiUrlWarningCode[]
): Array<InvestimentoCdiWarningCode | InvestimentoCdiUrlWarningCode> {
  return Array.from(new Set([...urlWarnings, ...warnings]));
}

export function ResultsSummary({ resultado, urlWarnings }: ResultsSummaryProps) {
  const t = useTranslations("calculators.investimento-cdi.results");
  const totalTaxes = resultado.iofValor + resultado.irValor;
  const warnings = useMemo(() => uniqueWarnings(resultado.warnings, urlWarnings), [resultado.warnings, urlWarnings]);

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
            {t("badges.sourceVersion", { version: resultado.cdiFonte.sourceVersion })}
          </span>
          <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("badges.observationDate", { date: resultado.cdiFonte.observationDate })}
          </span>
          <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("badges.dailyCdi", { rate: resultado.cdiFonte.dailyRatePercent.toFixed(6) })}
          </span>
          <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("badges.annualCdi", { rate: resultado.cdiFonte.annualRatePercent.toFixed(2) })}
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
            testId="investimento-cdi-net-value"
          />
          <SummaryCard
            label={t("cards.netYield")}
            value={formatCurrency(resultado.rendimentoLiquido)}
            helper={formatPercent(resultado.rentabilidadeLiquidaPercent)}
            tone="positive"
            testId="investimento-cdi-net-yield"
          />
          <SummaryCard
            label={t("cards.grossYield")}
            value={formatCurrency(resultado.rendimentoBruto)}
            helper={formatPercent(resultado.rentabilidadeBrutaPercent)}
            testId="investimento-cdi-gross-yield"
          />
          <SummaryCard
            label={t("cards.totalTaxes")}
            value={formatCurrency(totalTaxes)}
            tone="warning"
            testId="investimento-cdi-total-taxes"
          />
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
                <dt className="text-muted-foreground">{t("taxes.irBase")}</dt>
                <dd className="font-mono font-semibold">{formatCurrency(resultado.baseIr)}</dd>
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
                <dt className="text-muted-foreground">{t("rates.annualizedGross")}</dt>
                <dd className="font-mono font-semibold">{formatPercent(resultado.taxaEfetivaBrutaAnualPercent)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("rates.annualizedNet")}</dt>
                <dd className="font-mono font-semibold">{formatPercent(resultado.taxaEfetivaLiquidaAnualPercent)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("rates.dailyInvestment")}</dt>
                <dd className="font-mono font-semibold">{resultado.taxaInvestimentoDiariaPercent.toFixed(6)}%</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("rates.cdiMode")}</dt>
                <dd className="font-mono font-semibold">{t(`rates.modes.${resultado.cdiFonte.modo}`)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">{t(`rates.helpers.${resultado.cdiFonte.warningCode}`)}</p>
          </div>
        </div>

        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <Percent className="mt-0.5 h-4 w-4 flex-none" />
            <span>
              <strong className="text-foreground">{t("source.title")}</strong>{" "}
              {t("source.text", {
                version: resultado.cdiFonte.sourceVersion,
                observationDate: resultado.cdiFonte.observationDate,
                staleAfter: resultado.cdiFonte.staleAfter,
              })}
            </span>
          </p>
        </div>

        {warnings.length > 0 && (
          <div
            className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
            data-testid="investimento-cdi-warnings">
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
      </CardContent>
    </Card>
  );
}

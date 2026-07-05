"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, BadgeDollarSign, Clock, FileText, Landmark, Percent, ReceiptText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils/index";
import type { ResultadoSalarioPorHora } from "@/lib/calculators/salario-por-hora";

interface ResultsSummaryProps {
  resultado: ResultadoSalarioPorHora;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
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
  const t = useTranslations("calculators.salario-por-hora.results");

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
              {t("badges.source", { date: resultado.sourceVersion.legalRulesAccessedAt })}
            </span>
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase text-muted-foreground">
              {t(`badges.mode.${resultado.modo}`)}
            </span>
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase text-muted-foreground">
              {t(`badges.divisor.${resultado.divisorModo}`, { divisor: formatNumber(resultado.divisorMensal) })}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label={t("cards.hourly")}
              value={formatCurrency(resultado.valorHoraNormal)}
              helper={t("cards.hourlyHelper")}
              tone="positive"
              testId="salario-por-hora-hourly-result"
            />
            <SummaryCard
              label={t("cards.divisor")}
              value={formatNumber(resultado.divisorMensal)}
              helper={t("cards.divisorHelper")}
              testId="salario-por-hora-divisor-result"
            />
            <SummaryCard
              label={t("cards.monthly")}
              value={formatCurrency(resultado.salarioMensalEquivalente)}
              helper={t("cards.monthlyHelper")}
              testId="salario-por-hora-monthly-result"
            />
            <SummaryCard
              label={t("cards.period")}
              value={formatCurrency(resultado.valorPeriodo)}
              helper={t("cards.periodHelper", { hours: formatNumber(resultado.horasPeriodo) })}
              testId="salario-por-hora-period-result"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <ReceiptText className="h-4 w-4" />
                {t("formula.title")}
              </h3>
              <p className="mt-3 font-mono text-sm" data-testid="salario-por-hora-formula">
                {resultado.modo === "mensalParaHora"
                  ? `${formatCurrency(resultado.salarioMensal)} / ${formatNumber(resultado.divisorMensal)} = ${formatCurrency(resultado.valorHoraNormal)}`
                  : `${formatCurrency(resultado.valorHoraInformado)} x ${formatNumber(resultado.divisorMensal)} = ${formatCurrency(resultado.salarioMensalEquivalente)}`}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {resultado.modo === "mensalParaHora"
                  ? t("formula.monthlyToHourly")
                  : t("formula.hourlyToMonthly")}
              </p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="h-4 w-4" />
                {t("divisor.title")}
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">{t("divisor.weekly")}</dt>
                  <dd className="font-mono font-semibold">
                    {resultado.divisorModo === "jornadaSemanal" ? formatNumber(resultado.jornadaSemanal) : "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("divisor.daily")}</dt>
                  <dd className="font-mono font-semibold">
                    {resultado.jornadaMediaDiaria === null ? "-" : formatNumber(resultado.jornadaMediaDiaria)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("divisor.monthly")}</dt>
                  <dd className="font-mono font-semibold">{formatNumber(resultado.divisorMensal)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("divisor.dayBase")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.valorDiaBase)}</dd>
                </div>
              </dl>
            </div>
          </div>

          {resultado.mostrarAdicional && (
            <div className="rounded-lg border bg-muted/20 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Percent className="h-4 w-4" />
                {t("additional.title")}
              </h3>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">{t("additional.percent")}</dt>
                  <dd className="font-mono font-semibold">{formatPercent(resultado.adicionalPercentual)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("additional.hour")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.valorHoraComAdicional)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("additional.period")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.valorPeriodoComAdicional)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">{t("additional.helper")}</p>
            </div>
          )}

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

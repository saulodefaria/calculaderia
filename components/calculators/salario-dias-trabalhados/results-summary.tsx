"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, BadgeDollarSign, CalendarClock, FileText, Landmark, ReceiptText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils/index";
import type { ResultadoSalarioDiasTrabalhados } from "@/lib/calculators/salario-dias-trabalhados";

interface ResultsSummaryProps {
  resultado: ResultadoSalarioDiasTrabalhados;
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
  const t = useTranslations("calculators.salario-dias-trabalhados.results");
  const legalDeductionsTotal = resultado.inss + resultado.irrf;

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
              {t("badges.tables", { year: resultado.descontosLegais.versao })}
            </span>
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase text-muted-foreground">
              {t("badges.accessDate", { date: resultado.sourceVersion.legalRulesAccessedAt })}
            </span>
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase text-muted-foreground">
              {t(`badges.divisor.${resultado.divisorModo}`, { divisor: formatNumber(resultado.divisorAplicado) })}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label={t("cards.gross")}
              value={formatCurrency(resultado.salarioProporcionalBruto)}
              helper={t("cards.grossHelper", { days: formatNumber(resultado.diasRemuneradosEfetivos) })}
              testId="salario-dias-trabalhados-gross-result"
            />
            <SummaryCard
              label={t("cards.net")}
              value={formatCurrency(resultado.salarioLiquidoEstimado)}
              tone="positive"
              testId="salario-dias-trabalhados-net-result"
            />
            <SummaryCard
              label={t("cards.daily")}
              value={formatCurrency(resultado.valorDia)}
              helper={t("cards.dailyHelper", { divisor: formatNumber(resultado.divisorAplicado) })}
            />
            <SummaryCard
              label={t("cards.percent")}
              value={formatPercent(resultado.percentualMes * 100)}
              helper={t("cards.percentHelper", { days: formatNumber(resultado.diasRemuneradosEfetivos) })}
            />
          </div>

          <div className="rounded-lg border bg-muted/20 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <ReceiptText className="h-4 w-4" />
              {t("memo.title")}
            </h3>
            <p className="mt-3 font-mono text-sm" data-testid="salario-dias-trabalhados-formula">
              {formatCurrency(resultado.salarioMensal)} / {formatNumber(resultado.divisorAplicado)} x{" "}
              {formatNumber(resultado.diasRemuneradosEfetivos)} = {formatCurrency(resultado.salarioProporcionalBruto)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{t("memo.text")}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Landmark className="h-4 w-4" />
                {t("legal.title")}
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">{t("legal.inssBase")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.baseInss)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("legal.inss")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.inss)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("legal.irrfBase")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.baseIrrfUsada)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("legal.irrf")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.irrf)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                {t("legal.helper", {
                  total: formatCurrency(legalDeductionsTotal),
                  rate: formatPercent(resultado.aliquotaEfetivaLegal * 100),
                })}
              </p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <CalendarClock className="h-4 w-4" />
                {t("period.title")}
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">{t("period.month")}</dt>
                  <dd className="font-mono font-semibold">{resultado.periodo.mesReferencia}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("period.daysInMonth")}</dt>
                  <dd className="font-mono font-semibold">{formatNumber(resultado.diasNoMes)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("period.calendarDays")}</dt>
                  <dd className="font-mono font-semibold">{formatNumber(resultado.periodo.diasCalendarioInclusivos)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("period.effectiveDays")}</dt>
                  <dd className="font-mono font-semibold">{formatNumber(resultado.diasRemuneradosEfetivos)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">{t("period.helper")}</p>
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
                accessDate: resultado.sourceVersion.legalRulesAccessedAt,
                inssYear: resultado.sourceVersion.inss,
                irrfYear: resultado.sourceVersion.irrf,
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

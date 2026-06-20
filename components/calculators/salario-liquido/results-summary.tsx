"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, BadgeDollarSign, FileText, Landmark, ReceiptText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils/index";
import type { ResultadoSalarioLiquido } from "@/lib/calculators/salario-liquido";

interface ResultsSummaryProps {
  resultado: ResultadoSalarioLiquido;
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
  const t = useTranslations("calculators.salario-liquido.results");
  const legalDeductionsTotal = resultado.inss + resultado.irrf;
  const manualDeductionsTotal = resultado.descontosManuais + resultado.adiantamentos;

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
              {t("badges.tables", { year: resultado.descontosLegais.versao })}
            </span>
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("badges.accessDate", { date: resultado.sourceVersion.legalRulesAccessedAt })}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label={t("cards.netSalary")}
              value={formatCurrency(resultado.salarioLiquido)}
              tone="positive"
              testId="salario-liquido-net-result"
            />
            <SummaryCard label={t("cards.totalEarnings")} value={formatCurrency(resultado.totalProventos)} />
            <SummaryCard
              label={t("cards.legalDeductions")}
              value={formatCurrency(legalDeductionsTotal)}
              helper={formatPercent(resultado.aliquotaEfetivaLegal * 100)}
              tone="warning"
            />
            <SummaryCard label={t("cards.manualDeductions")} value={formatCurrency(manualDeductionsTotal)} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <ReceiptText className="h-4 w-4" />
                {t("inss.title")}
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">{t("inss.base")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.baseInss)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("inss.value")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.inss)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("inss.effectiveRate")}</dt>
                  <dd className="font-mono font-semibold">{formatPercent(resultado.descontosLegais.aliquotaEfetivaInss * 100)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("inss.ceiling")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.inssMemo.tetoInss)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">{t("inss.helper")}</p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Landmark className="h-4 w-4" />
                {t("irrf.title")}
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">{t("irrf.baseUsed")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.baseIrrfUsada)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("irrf.value")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.irrf)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("irrf.dependents")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.deducaoDependentes)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("irrf.reduction")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.reducaoIrrfMensal)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                {t(`irrf.baseType.${resultado.tipoBaseIrrfUsada}`)}
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

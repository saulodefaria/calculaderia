"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, BadgeDollarSign, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/index";
import type { ResultadoSeguroDesemprego } from "@/lib/calculators/seguro-desemprego";

interface ResultsSummaryProps {
  resultado: ResultadoSeguroDesemprego;
}

function SummaryCard({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: "default" | "positive" | "warning" | "danger";
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : tone === "danger"
          ? "text-red-600 dark:text-red-400"
          : "";

  return (
    <div className="flex min-h-28 flex-col justify-center rounded-lg border p-4">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`mt-1 break-words font-mono text-xl font-bold ${toneClass}`}>{value}</span>
      {helper && <span className="mt-1 text-xs text-muted-foreground">{helper}</span>}
    </div>
  );
}

export function ResultsSummary({ resultado }: ResultsSummaryProps) {
  const t = useTranslations("calculators.seguro-desemprego.results");
  const statusTone =
    resultado.status === "eligibleEstimate"
      ? "positive"
      : resultado.status === "needsOfficialReview"
        ? "warning"
        : "danger";
  const displayedTotal =
    resultado.status === "eligibleEstimate" ? resultado.totalEstimado : resultado.totalFormulaReferencia;

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <SummaryCard label={t("cards.parcela")} value={formatCurrency(resultado.valorParcela)} tone="positive" />
            <SummaryCard
              label={t("cards.parcelas")}
              value={t("parcelCount", { count: resultado.quantidadeParcelas })}
            />
            <SummaryCard
              label={resultado.status === "eligibleEstimate" ? t("cards.total") : t("cards.totalReference")}
              value={formatCurrency(displayedTotal)}
              helper={resultado.status === "eligibleEstimate" ? undefined : t("cards.totalReferenceHelper")}
              tone={resultado.status === "eligibleEstimate" ? "positive" : "warning"}
            />
            <SummaryCard label={t("cards.averageSalary")} value={formatCurrency(resultado.salarioMedio)} />
            <SummaryCard
              label={t("cards.status")}
              value={t(`status.${resultado.status}`)}
              helper={t(`statusHelp.${resultado.status}`)}
              tone={statusTone}
            />
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
                <strong className="text-foreground">{t("sourceBadge")}</strong> {t("method")}
              </span>
            </p>
            <p className="mt-2">{t("disclaimer")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

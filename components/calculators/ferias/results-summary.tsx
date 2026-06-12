"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, BadgeDollarSign, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/index";
import type { ResultadoFerias } from "@/lib/calculators/ferias";

interface ResultsSummaryProps {
  resultado: ResultadoFerias;
}

function SummaryCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "positive" | "warning";
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warning"
      ? "text-amber-600 dark:text-amber-400"
      : "";

  return (
    <div className="flex min-h-24 flex-col justify-center rounded-lg border p-4">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`mt-1 break-words font-mono text-xl font-bold ${toneClass}`}>{value}</span>
    </div>
  );
}

export function ResultsSummary({ resultado }: ResultsSummaryProps) {
  const t = useTranslations("calculators.ferias.results");

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryCard label={t("cards.brutoRecibo")} value={formatCurrency(resultado.brutoReciboFerias)} />
            <SummaryCard
              label={t("cards.totalDescontos")}
              value={formatCurrency(resultado.totalDescontos)}
              tone="warning"
            />
            <SummaryCard
              label={t("cards.liquidoRecibo")}
              value={formatCurrency(resultado.liquidoReciboFerias)}
              tone="positive"
            />
            <SummaryCard label={t("cards.totalTerco")} value={formatCurrency(resultado.totalTercoConstitucional)} />
            <SummaryCard label={t("cards.abono")} value={formatCurrency(resultado.abonoPecuniario + resultado.tercoAbono)} />
            <SummaryCard
              label={t("cards.salarioDiasVendidos")}
              value={formatCurrency(resultado.salarioDiasVendidos)}
            />
          </div>

          {resultado.salarioDiasVendidos > 0 && (
            <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">{t("abonoNote.title")}</strong> {t("abonoNote.text")}
              </p>
              <p className="mt-2 font-mono text-foreground">
                {t("abonoNote.cashFlow", { value: formatCurrency(resultado.fluxoCaixaBrutoComDiasVendidos) })}
              </p>
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
              <FileText className="mt-0.5 h-4 w-4 flex-none" />
              <span>
                <strong className="text-foreground">{t("method.title")}</strong> {t("method.text")}
              </span>
            </p>
            <p className="mt-2">{t("method.sourceNote")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

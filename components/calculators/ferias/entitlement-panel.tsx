"use client";

import { useLocale, useTranslations } from "next-intl";
import { CalendarRange } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResultadoFerias } from "@/lib/calculators/ferias";

interface EntitlementPanelProps {
  resultado: ResultadoFerias;
}

function formatDate(value: string | null, locale: string): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat(locale, { timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export function EntitlementPanel({ resultado }: EntitlementPanelProps) {
  const locale = useLocale();
  const t = useTranslations("calculators.ferias.entitlement");
  const rows = [
    { label: t("labels.bracket"), value: t(`absenceBrackets.${resultado.entitlement.bracket}`) },
    { label: t("labels.diasDireito"), value: t("daysValue", { count: resultado.entitlement.diasDireito }) },
    { label: t("labels.diasAbonoMax"), value: t("daysValue", { count: resultado.entitlement.diasAbonoMax }) },
    { label: t("labels.diasGozados"), value: t("daysValue", { count: resultado.diasGozados }) },
    { label: t("labels.diasAbono"), value: t("daysValue", { count: resultado.diasAbono }) },
    { label: t("labels.avosProporcionais"), value: t("avosValue", { count: resultado.avosProporcionais }) },
    { label: t("labels.dataFimAquisitivo"), value: formatDate(resultado.statusPeriodo.dataFimAquisitivo, locale) },
    { label: t("labels.dataLimiteConcessivo"), value: formatDate(resultado.statusPeriodo.dataLimiteConcessivo, locale) },
    { label: t("labels.dataFimFerias"), value: formatDate(resultado.statusPeriodo.dataFimFerias, locale) },
    { label: t("labels.emDobro"), value: resultado.statusPeriodo.emDobro ? t("yes") : t("no") },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarRange className="h-5 w-5" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {rows.map((row) => (
            <div key={row.label} className="rounded-lg border bg-muted/20 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{row.label}</dt>
              <dd className="mt-1 break-words font-mono text-sm font-semibold">{row.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

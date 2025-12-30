"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/index";
import type { ResultadoJurosCompostos, PeriodoJurosCompostos } from "@/lib/calculators/juros-compostos";

interface ResultsSummaryProps {
  resultado: ResultadoJurosCompostos;
  periodo: PeriodoJurosCompostos;
}

export function ResultsSummary({ resultado, periodo }: ResultsSummaryProps) {
  const t = useTranslations("calculators.juros-compostos.results");
  const periodoName = t(`periodNames.${periodo}`, { count: resultado.evolucao.length });

  const summaryItems = [
    {
      label: t("items.initialAmount"),
      value: formatCurrency(resultado.valorInicial),
      variant: "default" as const,
    },
    {
      label: t("items.totalContributions"),
      value: formatCurrency(resultado.totalAportes),
      variant: resultado.totalAportes > 0 ? "primary" : "default",
    },
    {
      label: t("items.totalInterestEarned"),
      value: formatCurrency(resultado.totalJuros),
      variant: "primary" as const,
    },
    {
      label: t("items.finalAmount"),
      value: formatCurrency(resultado.valorFinal),
      variant: "primary" as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("subtitle", { count: resultado.evolucao.length, periodName: periodoName })}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center justify-center rounded-lg border p-4 text-center">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.label}</span>
              <span
                className={`mt-1 text-lg font-bold font-mono ${
                  item.variant === "primary" ? "text-emerald-600 dark:text-emerald-400" : ""
                }`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

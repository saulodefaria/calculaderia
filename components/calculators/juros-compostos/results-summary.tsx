"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/index";
import type { ResultadoJurosCompostos, PeriodoJurosCompostos } from "@/lib/calculators/juros-compostos";
import { PERIODO_JUROS_COMPOSTOS_NAMES } from "@/lib/calculators/juros-compostos";

interface ResultsSummaryProps {
  resultado: ResultadoJurosCompostos;
  periodo: PeriodoJurosCompostos;
}

export function ResultsSummary({ resultado, periodo }: ResultsSummaryProps) {
  const periodoName =
    resultado.evolucao.length === 1
      ? PERIODO_JUROS_COMPOSTOS_NAMES[periodo].singular
      : PERIODO_JUROS_COMPOSTOS_NAMES[periodo].plural;

  const summaryItems = [
    {
      label: "Valor Inicial",
      value: formatCurrency(resultado.valorInicial),
      variant: "default" as const,
    },
    {
      label: "Total de Aportes",
      value: formatCurrency(resultado.totalAportes),
      variant: resultado.totalAportes > 0 ? "primary" : "default",
    },
    {
      label: "Total de Juros Ganhos",
      value: formatCurrency(resultado.totalJuros),
      variant: "primary" as const,
    },
    {
      label: "Valor Final",
      value: formatCurrency(resultado.valorFinal),
      variant: "primary" as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Resumo do Investimento</CardTitle>
        <p className="text-sm text-muted-foreground">
          Resultados calculados com base em {resultado.evolucao.length} {periodoName}
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

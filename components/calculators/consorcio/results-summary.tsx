"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { ResultadoConsorcio } from "@/lib/calculators/consorcio";

interface ResultsSummaryProps {
  resultado: ResultadoConsorcio;
}

export function ResultsSummary({ resultado }: ResultsSummaryProps) {
  const summaryItems = [
    {
      label: "Valor do Bem",
      value: formatCurrency(resultado.valorBem),
      variant: "default" as const,
    },
    {
      label: "Valor Final do Bem",
      value: formatCurrency(resultado.valorBemFinal),
      variant: "default" as const,
    },
    {
      label: "Total Pago",
      value: formatCurrency(resultado.totalPago),
      variant: "default" as const,
    },
    {
      label: "Primeira Parcela",
      value: formatCurrency(resultado.primeiraParcela),
      variant: "primary" as const,
    },
    {
      label: "Última Parcela",
      value: formatCurrency(resultado.ultimaParcela),
      variant: "primary" as const,
    },
    {
      label: "Total Taxa Admin.",
      value: formatCurrency(resultado.totalTaxaAdministracao),
      variant: "destructive" as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Resumo do Consórcio</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center justify-center rounded-lg border p-4 text-center">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.label}</span>
              <span
                className={`mt-1 text-lg font-bold font-mono ${
                  item.variant === "destructive"
                    ? "text-red-600 dark:text-red-400"
                    : item.variant === "primary"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : ""
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

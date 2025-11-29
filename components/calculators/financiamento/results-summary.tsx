"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { ResultadoFinanciamento } from "@/lib/calculators/financiamento"

interface ResultsSummaryProps {
  resultado: ResultadoFinanciamento
}

export function ResultsSummary({ resultado }: ResultsSummaryProps) {
  const summaryItems = [
    {
      label: "Valor Financiado",
      value: formatCurrency(resultado.valorFinanciado),
      variant: "default" as const,
    },
    {
      label: "Total de Juros",
      value: formatCurrency(resultado.totalJurosPagos),
      variant: "destructive" as const,
    },
    {
      label: "Total Pago",
      value: formatCurrency(resultado.totalPago),
      variant: "default" as const,
    },
    {
      label: "Primeira Prestação",
      value: formatCurrency(resultado.primeiraPrestacao),
      variant: "primary" as const,
    },
    {
      label: "Última Prestação",
      value: formatCurrency(resultado.ultimaPrestacao),
      variant: "primary" as const,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Resumo do Financiamento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center justify-center rounded-lg border p-4 text-center"
            >
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {item.label}
              </span>
              <span
                className={`mt-1 text-lg font-bold font-mono ${
                  item.variant === "destructive"
                    ? "text-red-600 dark:text-red-400"
                    : item.variant === "primary"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : ""
                }`}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}


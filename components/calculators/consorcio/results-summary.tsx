"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { ResultadoConsorcio, ResultadoConsorcioComAdicionais } from "@/lib/calculators/consorcio";

interface ResultsSummaryProps {
  resultado: ResultadoConsorcio;
  resultadoComAdicionais?: ResultadoConsorcioComAdicionais | null;
}

export function ResultsSummary({ resultado, resultadoComAdicionais }: ResultsSummaryProps) {
  const hasAdicionais = resultadoComAdicionais !== null && resultadoComAdicionais !== undefined;

  // Original summary items (when no additional amortizations)
  const summaryItemsOriginal = [
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

  if (!hasAdicionais) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumo do Consórcio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {summaryItemsOriginal.map((item) => (
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

  // With additional amortizations - show comparison
  const mesesEconomizados = resultadoComAdicionais.economiaMeses;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Resumo do Consórcio</CardTitle>
        <p className="text-sm text-muted-foreground">
          Comparativo entre o consórcio original e com amortizações adicionais
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Original Values */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            Valores Originais
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-3 text-center opacity-75">
              <span className="text-xs font-medium text-muted-foreground">Valor do Bem</span>
              <span className="mt-1 text-base font-bold font-mono">{formatCurrency(resultado.valorBem)}</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-3 text-center opacity-75">
              <span className="text-xs font-medium text-muted-foreground">Total Taxa Admin.</span>
              <span className="mt-1 text-base font-bold font-mono text-red-600/70 dark:text-red-400/70 line-through">
                {formatCurrency(resultadoComAdicionais.totalTaxaAdministracaoOriginal)}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-3 text-center opacity-75">
              <span className="text-xs font-medium text-muted-foreground">Prazo Original</span>
              <span className="mt-1 text-base font-bold font-mono">{resultadoComAdicionais.mesesOriginais} meses</span>
            </div>
          </div>
        </div>

        {/* New Values with Additional Amortizations */}
        <div>
          <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-3 uppercase tracking-wider">
            Com Amortizações Adicionais
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 text-center">
              <span className="text-xs font-medium text-muted-foreground">Nova Taxa Admin.</span>
              <span className="mt-1 text-lg font-bold font-mono text-red-600 dark:text-red-400">
                {formatCurrency(resultadoComAdicionais.totalTaxaAdministracaoComAdicionais)}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 text-center">
              <span className="text-xs font-medium text-muted-foreground">Novo Prazo</span>
              <span className="mt-1 text-lg font-bold font-mono">
                {resultadoComAdicionais.mesesComAdicionais} meses
              </span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 text-center">
              <span className="text-xs font-medium text-muted-foreground">Total Amort. Adicional</span>
              <span className="mt-1 text-lg font-bold font-mono text-blue-600 dark:text-blue-400">
                {formatCurrency(resultadoComAdicionais.totalAmortizacoesAdicionais)}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 text-center">
              <span className="text-xs font-medium text-muted-foreground">Novo Total Pago</span>
              <span className="mt-1 text-lg font-bold font-mono">
                {formatCurrency(resultadoComAdicionais.totalPagoComAdicionais)}
              </span>
            </div>
          </div>
        </div>

        {/* Savings Highlight */}
        <div className="rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 p-4 text-white">
          <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider opacity-90">Sua Economia</h3>
          <p className="text-xs opacity-80 mb-4">
            Economia gerada ao evitar os reajustes futuros (INCC/IPCA) sobre as parcelas antecipadas.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col">
              <span className="text-sm opacity-80">Economia em Taxa Admin.</span>
              <span className="text-2xl font-bold font-mono">
                {formatCurrency(resultadoComAdicionais.economiaTaxa)}
              </span>
            </div>
            {mesesEconomizados > 0 && (
              <div className="flex flex-col">
                <span className="text-sm opacity-80">Meses Economizados</span>
                <span className="text-2xl font-bold font-mono">
                  {mesesEconomizados} {mesesEconomizados === 1 ? "mês" : "meses"}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

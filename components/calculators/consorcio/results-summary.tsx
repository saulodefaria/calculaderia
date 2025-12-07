"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { ResultadoConsorcio, ResultadoConsorcioComAdicionais } from "@/lib/calculators/consorcio";

interface ResultsSummaryProps {
  resultado: ResultadoConsorcio;
  resultadoComAdicionais?: ResultadoConsorcioComAdicionais | null;
}

export function ResultsSummary({ resultado, resultadoComAdicionais }: ResultsSummaryProps) {
  const hasAdicionais = resultadoComAdicionais !== null && resultadoComAdicionais !== undefined;

  const tirMensalBase = resultado.tirMensal ?? null;
  const tirAnualBase = resultado.tirAnual ?? null;

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
        <CardContent className="space-y-6">
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

          {tirMensalBase !== null && tirAnualBase !== null && (
            <div className="rounded-xl border border-dashed bg-muted/40 dark:bg-muted/10 p-4 sm:p-5">
              <h3 className="text-sm font-semibold mb-2 uppercase tracking-wider">Retorno do Investimento (TIR)</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Cada parcela (fundo comum + taxa de administração) é tratada como saída mensal e o valor final corrigido
                do bem como entrada positiva no último mês.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">TIR Mensal</span>
                  <span
                    className={`mt-1 text-xl font-bold font-mono ${
                      tirMensalBase >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    }`}>
                    {formatPercent(tirMensalBase * 100)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    TIR Anual Equivalente
                  </span>
                  <span
                    className={`mt-1 text-xl font-bold font-mono ${
                      tirAnualBase >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    }`}>
                    {formatPercent(tirAnualBase * 100)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // With additional amortizations - show comparison
  const mesesEconomizados = resultadoComAdicionais.economiaMeses;

  const tirMensalOriginal = resultadoComAdicionais.tirMensalOriginal ?? tirMensalBase;
  const tirAnualOriginal = resultadoComAdicionais.tirAnualOriginal ?? tirAnualBase;
  const tirMensalComAdicionais = resultadoComAdicionais.tirMensalComAdicionais ?? null;
  const tirAnualComAdicionais = resultadoComAdicionais.tirAnualComAdicionais ?? null;

  const hasTirComparison =
    tirMensalOriginal !== null &&
    tirAnualOriginal !== null &&
    tirMensalComAdicionais !== null &&
    tirAnualComAdicionais !== null;

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

        {hasTirComparison && (
          <div className="rounded-xl border border-dashed bg-muted/40 dark:bg-muted/10 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider">Retorno do Investimento (TIR)</h3>
              <p className="text-xs text-muted-foreground">
                Fluxos mensais: parcelas (incluindo amortizações adicionais) como saídas e o valor final corrigido do
                bem como entrada positiva no último mês.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-background p-3 space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  TIR Original
                </span>
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Mensal</span>
                    <span
                      className={`text-lg font-bold font-mono ${
                        tirMensalOriginal! >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}>
                      {formatPercent(tirMensalOriginal! * 100)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Anual</span>
                    <span
                      className={`text-lg font-bold font-mono ${
                        tirAnualOriginal! >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}>
                      {formatPercent(tirAnualOriginal! * 100)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 p-3 space-y-2">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  TIR com Amortizações
                </span>
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Mensal</span>
                    <span
                      className={`text-lg font-bold font-mono ${
                        tirMensalComAdicionais! >= (tirMensalOriginal ?? 0)
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-amber-600 dark:text-amber-300"
                      }`}>
                      {formatPercent(tirMensalComAdicionais! * 100)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Anual</span>
                    <span
                      className={`text-lg font-bold font-mono ${
                        tirAnualComAdicionais! >= (tirAnualOriginal ?? 0)
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-amber-600 dark:text-amber-300"
                      }`}>
                      {formatPercent(tirAnualComAdicionais! * 100)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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

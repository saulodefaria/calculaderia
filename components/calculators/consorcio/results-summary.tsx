"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Gift, Gavel, Wallet, Home, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency, formatPercent, getAluguelCorrigidoNoMes } from "@/lib/utils/index";
import { encodeTirState } from "@/lib/url-state/tir";
import type { ResultadoConsorcio, ResultadoConsorcioComAdicionais, InputsConsorcio } from "@/lib/calculators/consorcio";

interface ResultsSummaryProps {
  resultado: ResultadoConsorcio;
  resultadoComAdicionais?: ResultadoConsorcioComAdicionais | null;
  inputs?: InputsConsorcio | null;
}

export function ResultsSummary({ resultado, resultadoComAdicionais, inputs }: ResultsSummaryProps) {
  const hasAdicionais = resultadoComAdicionais !== null && resultadoComAdicionais !== undefined;

  const tirMensalBase = resultado.tirMensal ?? null;
  const tirAnualBase = resultado.tirAnual ?? null;

  // Extract contemplation, lance and ágio info
  // Check mesContemplacao first (new field), then fall back to lance.mes
  const mesContemplacao = inputs?.mesContemplacao ?? inputs?.lance?.mes ?? 1;
  const valorLance = inputs?.lance?.valor ?? 0;
  const valorAgio = resultado.agio ?? 0;
  const hasLanceOrAgio = valorLance > 0 || valorAgio > 0;

  // Extract aluguel info
  const aluguelMensal = inputs?.aluguelMensal ?? 0;
  const correcaoAnualAluguel = inputs?.correcaoAnualAluguel ?? 0;
  const hasAluguel = aluguelMensal > 0;

  // Calculate total rent economy (from contemplação to end of parcelas)
  const totalDescontoAluguel = useMemo(() => {
    if (!hasAluguel) return 0;
    const parcelas = hasAdicionais ? resultadoComAdicionais!.parcelas : resultado.parcelas;
    let total = 0;
    for (let mes = mesContemplacao; mes <= parcelas.length; mes++) {
      total += getAluguelCorrigidoNoMes(mes, aluguelMensal, correcaoAnualAluguel);
    }
    return Math.round(total * 100) / 100;
  }, [
    hasAluguel,
    hasAdicionais,
    resultadoComAdicionais,
    resultado.parcelas,
    mesContemplacao,
    aluguelMensal,
    correcaoAnualAluguel,
  ]);

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
      label: hasAluguel ? "Total Pago (Bruto)" : "Total Pago",
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
    // Ágio (only if present)
    ...(resultado.agio > 0
      ? [
          {
            label: "Ágio Pago",
            value: formatCurrency(resultado.agio),
            variant: "destructive" as const,
          },
        ]
      : []),
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

          {(hasLanceOrAgio || hasAluguel) && (
            <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30 p-4">
              <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-3 flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Cenário do Consórcio
              </h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <div>
                    <span className="text-xs text-muted-foreground block">Contemplação</span>
                    <span className="text-sm font-semibold">
                      Mês {mesContemplacao}
                      {mesContemplacao === 1 && " (imediata)"}
                    </span>
                  </div>
                </div>
                {valorLance > 0 && (
                  <div className="flex items-center gap-2">
                    <Gavel className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div>
                      <span className="text-xs text-muted-foreground block">Lance</span>
                      <span className="text-sm font-semibold">{formatCurrency(valorLance)}</span>
                    </div>
                  </div>
                )}
                {valorAgio > 0 && (
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div>
                      <span className="text-xs text-muted-foreground block">Ágio Pago</span>
                      <span className="text-sm font-semibold">{formatCurrency(valorAgio)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Aluguel Recebido */}
          {hasAluguel && (
            <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30 p-4">
              <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-3 flex items-center gap-2">
                <Home className="h-4 w-4" />
                Aluguel Recebido
              </h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <div>
                    <span className="text-xs text-muted-foreground block">Aluguel recebido total</span>
                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                      +{formatCurrency(totalDescontoAluguel)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div>
                    <span className="text-xs text-muted-foreground block">Total Líquido</span>
                    <span className="text-sm font-semibold">
                      {formatCurrency(resultado.totalPago - totalDescontoAluguel)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div>
                    <span className="text-xs text-muted-foreground block">A partir do mês</span>
                    <span className="text-sm font-semibold">{mesContemplacao}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                O aluguel recebido considera o valor que você receberá ao alugar o imóvel, a partir da contemplação. O
                aluguel é reajustado anualmente pelo IGPM e está incluído no cálculo da TIR como receita mensal (podendo
                gerar fluxo positivo quando o aluguel superar a parcela).
              </p>
            </div>
          )}

          {tirMensalBase !== null && tirAnualBase !== null && (
            <div className="rounded-xl border border-dashed bg-muted/40 dark:bg-muted/10 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider">Retorno do Investimento (TIR)</h3>
                {resultado.cashflows && resultado.cashflows.length > 0 && (
                  <TooltipProvider>
                    <Tooltip delayDuration={120}>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1.5" asChild>
                          <Link
                            href={`/calculadoras/tir?${encodeTirState({
                              cashflows: resultado.cashflows,
                              periodo: "mensal",
                            }).toString()}`}
                            target="_blank"
                            rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                            Analisar
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Abrir calculadora de TIR com estes fluxos de caixa</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                {hasAluguel
                  ? "Cada mês é tratado como fluxo líquido = aluguel recebido - parcela (pode ser positivo quando o aluguel superar a parcela) e o valor final corrigido do bem como entrada positiva no último mês."
                  : "Cada parcela (fundo comum + taxa de administração) é tratada como saída mensal e o valor final corrigido do bem como entrada positiva no último mês."}
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
                {hasAluguel
                  ? "Fluxos mensais: fluxo líquido = aluguel recebido - parcelas (incluindo amortizações adicionais) e o valor final corrigido do bem como entrada positiva no último mês."
                  : "Fluxos mensais: parcelas (incluindo amortizações adicionais) como saídas e o valor final corrigido do bem como entrada positiva no último mês."}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-background p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    TIR Original
                  </span>
                  {resultadoComAdicionais.cashflowsOriginal && resultadoComAdicionais.cashflowsOriginal.length > 0 && (
                    <TooltipProvider>
                      <Tooltip delayDuration={120}>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs gap-1" asChild>
                            <Link
                              href={`/calculadoras/tir?${encodeTirState({
                                cashflows: resultadoComAdicionais.cashflowsOriginal,
                                periodo: "mensal",
                              }).toString()}`}
                              target="_blank"
                              rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Analisar na calculadora de TIR</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
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
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                    TIR com Amortizações
                  </span>
                  {resultadoComAdicionais.cashflowsComAdicionais &&
                    resultadoComAdicionais.cashflowsComAdicionais.length > 0 && (
                      <TooltipProvider>
                        <Tooltip delayDuration={120}>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs gap-1" asChild>
                              <Link
                                href={`/calculadoras/tir?${encodeTirState({
                                  cashflows: resultadoComAdicionais.cashflowsComAdicionais,
                                  periodo: "mensal",
                                }).toString()}`}
                                target="_blank"
                                rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Analisar na calculadora de TIR</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                </div>
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

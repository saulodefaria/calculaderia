"use client";

import { useTranslations } from "next-intl";
import { Trophy, Scale, TrendingUp, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency, formatPercent } from "@/lib/utils/index";
import type { ResultadoComparadorRendaFixa, RendaFixaTipo } from "@/lib/calculators/renda-fixa";
import { RENDA_FIXA_TIPO_LABELS } from "@/lib/calculators/renda-fixa";

interface ResultsSummaryProps {
  resultado: ResultadoComparadorRendaFixa;
}

export function ResultsSummary({ resultado }: ResultsSummaryProps) {
  const t = useTranslations("calculators.renda-fixa.results");
  const { opcoes, ranking, vencedor } = resultado;
  const isEmpate = vencedor === "empate";

  const getTipoLabel = (tipo: RendaFixaTipo) => {
    return RENDA_FIXA_TIPO_LABELS[tipo];
  };

  const getTipoColor = (tipo: RendaFixaTipo) => {
    const colors: Record<RendaFixaTipo, string> = {
      pre: "text-blue-600 dark:text-blue-400",
      cdi: "text-purple-600 dark:text-purple-400",
      ipca: "text-amber-600 dark:text-amber-400",
      selic: "text-emerald-600 dark:text-emerald-400",
    };
    return colors[tipo];
  };

  return (
    <div className="space-y-6">
      {/* Winner highlighted */}
      {!isEmpate && (
        <Card className="border-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900">
                <Trophy className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                  {t("winner.title", { tipo: getTipoLabel(vencedor as RendaFixaTipo) })}
                </h3>
                <p className="text-muted-foreground">{t("winner.subtitle")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isEmpate && (
        <Card className="border-2 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900">
                <Scale className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-300">{t("tie.title")}</h3>
                <p className="text-muted-foreground">{t("tie.subtitle")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards for 4 options */}
      <div className="grid gap-4 md:grid-cols-2">
        {opcoes.map((opcao) => {
          const isVencedor = opcao.tipo === vencedor;
          const posicao = ranking.find((r) => r.tipo === opcao.tipo)?.posicao ?? 0;

          return (
            <Card
              key={opcao.tipo}
              className={`relative overflow-hidden ${isVencedor ? "ring-2 ring-emerald-500" : ""}`}>
              {isVencedor && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-semibold px-2 py-1 rounded-bl">
                  {t("winner.badge")}
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className={`text-lg flex items-center gap-2 ${getTipoColor(opcao.tipo)}`}>
                  <TrendingUp className="h-5 w-5" />
                  {getTipoLabel(opcao.tipo)}
                  <span className="text-xs font-normal text-muted-foreground ml-auto">#{posicao}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("fields.finalValue")}</p>
                    <p className="text-lg font-bold font-mono">{formatCurrency(opcao.valorFinalLiquido)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("fields.finalReal")}</p>
                    <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(opcao.valorFinalReal)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("fields.return")}</p>
                      <TooltipProvider>
                        <Tooltip delayDuration={120}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                              <Info className="h-3 w-3" />
                              <span className="sr-only">{t("srOnly.returnInfo")}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs text-center">
                            <p>{t("fields.returnHelp")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-base font-semibold font-mono">
                      {formatPercent(opcao.rentabilidadeLiquidaPercent)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("fields.realReturn")}</p>
                      <TooltipProvider>
                        <Tooltip delayDuration={120}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                              <Info className="h-3 w-3" />
                              <span className="sr-only">{t("srOnly.realReturnInfo")}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs text-center">
                            <p>{t("fields.realReturnHelp")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-base font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                      {formatPercent(opcao.retornoRealPercent)}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <p className="text-muted-foreground">{t("fields.effectiveRate")}</p>
                        <TooltipProvider>
                          <Tooltip delayDuration={120}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                                <Info className="h-3 w-3" />
                                <span className="sr-only">{t("srOnly.effectiveRateInfo")}</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs text-center">
                              <p>{t("fields.effectiveRateHelp")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <p className="font-semibold font-mono">{formatPercent(opcao.taxaEfetivaAnualLiquidaPercent)}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <p className="text-muted-foreground">{t("fields.realRate")}</p>
                        <TooltipProvider>
                          <Tooltip delayDuration={120}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                                <Info className="h-3 w-3" />
                                <span className="sr-only">{t("srOnly.realRateInfo")}</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs text-center">
                              <p>{t("fields.realRateHelp")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <p className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                        {formatPercent(opcao.taxaRealAnualPercent)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t bg-muted/30 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold uppercase tracking-wider">{t("fields.taxes")}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {opcao.iof > 0 && (
                      <div>
                        <p className="text-muted-foreground">{t("fields.iof")}</p>
                        <p className="font-semibold font-mono text-red-600 dark:text-red-400">
                          {formatCurrency(opcao.iof)}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">{t("fields.ir")}</p>
                      <p className="font-semibold font-mono text-red-600 dark:text-red-400">
                        {formatCurrency(opcao.ir)}
                      </p>
                    </div>
                    {opcao.taxas > 0 && (
                      <div>
                        <p className="text-muted-foreground">{t("fields.fees")}</p>
                        <p className="font-semibold font-mono text-red-600 dark:text-red-400">
                          {formatCurrency(opcao.taxas)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { Trophy, Info } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency, formatPercent } from "@/lib/utils/index";
import type { ResultadoComparadorRendaFixa, RendaFixaTipo } from "@/lib/calculators/renda-fixa";
import { RENDA_FIXA_TIPO_LABELS } from "@/lib/calculators/renda-fixa";

interface ComparisonTableProps {
  resultado: ResultadoComparadorRendaFixa;
}

export function ComparisonTable({ resultado }: ComparisonTableProps) {
  const t = useTranslations("calculators.renda-fixa.table");
  const tResults = useTranslations("calculators.renda-fixa.results");
  const { opcoes, ranking, vencedor } = resultado;

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

  // Sort options by ranking (create a copy to avoid mutating the original array)
  const opcoesOrdenadas = [...opcoes].sort((a, b) => {
    const posA = ranking.find((r) => r.tipo === a.tipo)?.posicao ?? 999;
    const posB = ranking.find((r) => r.tipo === b.tipo)?.posicao ?? 999;
    return posA - posB;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <Table className="min-w-[900px]">
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-12 text-center sticky left-0 bg-background z-20">{t("columns.rank")}</TableHead>
                <TableHead className="sticky left-12 bg-background z-20">{t("columns.option")}</TableHead>
                <TableHead className="text-right">{t("columns.finalValue")}</TableHead>
                <TableHead className="text-right">{t("columns.finalReal")}</TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {t("columns.return")}
                    <TooltipProvider>
                      <Tooltip delayDuration={120}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                            <Info className="h-3 w-3" />
                            <span className="sr-only">{tResults("srOnly.returnInfo")}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-center">
                          <p>{t("columns.returnHelp")}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {t("columns.realReturn")}
                    <TooltipProvider>
                      <Tooltip delayDuration={120}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                            <Info className="h-3 w-3" />
                            <span className="sr-only">{tResults("srOnly.realReturnInfo")}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-center">
                          <p>{t("columns.realReturnHelp")}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {t("columns.effectiveRate")}
                    <TooltipProvider>
                      <Tooltip delayDuration={120}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                            <Info className="h-3 w-3" />
                            <span className="sr-only">{tResults("srOnly.effectiveRateInfo")}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-center">
                          <p>{t("columns.effectiveRateHelp")}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {t("columns.realRate")}
                    <TooltipProvider>
                      <Tooltip delayDuration={120}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                            <Info className="h-3 w-3" />
                            <span className="sr-only">{tResults("srOnly.realRateInfo")}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-center">
                          <p>{t("columns.realRateHelp")}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableHead>
                <TableHead className="text-right">{t("columns.taxes")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opcoesOrdenadas.map((opcao) => {
                const posicao = ranking.find((r) => r.tipo === opcao.tipo)?.posicao ?? 0;
                const isVencedor = opcao.tipo === vencedor;

                return (
                  <TableRow
                    key={opcao.tipo}
                    className={
                      isVencedor
                        ? "bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-300 dark:ring-emerald-700"
                        : ""
                    }>
                    <TableCell className="text-center font-medium sticky left-0 bg-background z-10">
                      <div className="flex items-center justify-center gap-1">
                        {posicao}
                        {isVencedor && <Trophy className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                      </div>
                    </TableCell>
                    <TableCell className={`font-medium sticky left-12 bg-background z-10 ${getTipoColor(opcao.tipo)}`}>
                      {getTipoLabel(opcao.tipo)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(opcao.valorFinalLiquido)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(opcao.valorFinalReal)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatPercent(opcao.rentabilidadeLiquidaPercent)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-emerald-600 dark:text-emerald-400">
                      {formatPercent(opcao.retornoRealPercent)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatPercent(opcao.taxaEfetivaAnualLiquidaPercent)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-emerald-600 dark:text-emerald-400">
                      {formatPercent(opcao.taxaRealAnualPercent)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-red-600 dark:text-red-400">
                      {formatCurrency(opcao.iof + opcao.ir + opcao.taxas)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

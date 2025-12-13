"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Gift, Home } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/index";
import type { ParcelaComparativa } from "@/lib/calculators/comparativo";

interface ComparisonTableProps {
  parcelas: ParcelaComparativa[];
}

export function ComparisonTable({ parcelas }: ComparisonTableProps) {
  const [showAll, setShowAll] = useState(false);

  if (parcelas.length === 0) {
    return null;
  }

  // Check if rent discount is configured (by checking if any parcela has rent info)
  const hasAluguel = parcelas.some(
    (p) => p?.aluguelEvitadoFinanciamento !== undefined && p.aluguelEvitadoFinanciamento > 0
  );

  // Show first 12 months and last 12 months by default (to give a good overview)
  const displayParcelas = showAll
    ? parcelas
    : parcelas.length <= 24
    ? parcelas
    : [
        ...parcelas.slice(0, 12),
        null, // Marker for collapsed rows
        ...parcelas.slice(-12),
      ];

  const collapsedCount = parcelas.length - 24;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Evolução Mensal</CardTitle>
        <p className="text-sm text-muted-foreground">
          Comparativo mês a mês {hasAluguel ? "dos custos líquidos (parcela - aluguel recebido)" : "das parcelas"} e
          saldo de investimento acumulado
        </p>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <Table className="min-w-[800px]">
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-12 text-center sticky left-0 bg-background z-20">Mês</TableHead>
                <TableHead className="text-right text-blue-600 dark:text-blue-400 whitespace-nowrap">
                  Parcela Financ.
                </TableHead>
                <TableHead className="text-right text-amber-600 dark:text-amber-400 whitespace-nowrap">
                  Parcela Consórcio
                </TableHead>
                <TableHead className="text-right whitespace-nowrap">Diferença</TableHead>
                <TableHead className="text-right text-blue-600 dark:text-blue-400 whitespace-nowrap">
                  Invest. Financ.
                </TableHead>
                <TableHead className="text-right text-amber-600 dark:text-amber-400 whitespace-nowrap">
                  Invest. Consórcio
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayParcelas.map((parcela) => {
                // Handle collapsed row marker
                if (parcela === null) {
                  return (
                    <TableRow key="collapsed">
                      <TableCell colSpan={6} className="text-center py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAll(true)}
                          className="text-muted-foreground hover:text-foreground">
                          <ChevronDown className="h-4 w-4 mr-2" />
                          Mostrar {collapsedCount} meses ocultos
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                }

                const diferencaPositiva = parcela.diferenca > 0;
                const diferencaNegativa = parcela.diferenca < 0;
                const isContemplacao = parcela.isContemplacao;

                // Determine row background based on contemplation and difference
                let rowClassName = "";
                if (isContemplacao) {
                  rowClassName = "bg-purple-50/50 dark:bg-purple-950/20 ring-1 ring-purple-300 dark:ring-purple-700";
                } else if (diferencaPositiva) {
                  rowClassName = "bg-blue-50/30 dark:bg-blue-950/10";
                } else if (diferencaNegativa) {
                  rowClassName = "bg-amber-50/30 dark:bg-amber-950/10";
                }

                return (
                  <TableRow key={parcela.mes} className={rowClassName}>
                    <TableCell className="text-center font-medium sticky left-0 bg-background z-10">
                      <div className="flex items-center justify-center gap-1">
                        {parcela.mes}
                        {isContemplacao && <Gift className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      <div className="flex flex-col items-end">
                        <span>
                          {parcela.parcelaFinanciamento > 0 ? formatCurrency(parcela.parcelaFinanciamento) : "-"}
                        </span>
                        {hasAluguel && parcela.aluguelEvitadoFinanciamento !== undefined && (
                          <span className="text-[10px] text-purple-600 dark:text-purple-400">
                            -{formatCurrency(parcela.aluguelEvitadoFinanciamento)} aluguel
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      <div className="flex flex-col items-end">
                        <span>{parcela.parcelaConsorcio > 0 ? formatCurrency(parcela.parcelaConsorcio) : "-"}</span>
                        {isContemplacao && (parcela.valorLance || parcela.valorAgio) && (
                          <span className="text-[10px] text-purple-600 dark:text-purple-400">
                            {parcela.valorLance && `Lance: ${formatCurrency(parcela.valorLance)}`}
                            {parcela.valorLance && parcela.valorAgio && " + "}
                            {parcela.valorAgio && `Ágio: ${formatCurrency(parcela.valorAgio)}`}
                          </span>
                        )}
                        {hasAluguel && parcela.aluguelEvitadoConsorcio !== undefined && (
                          <span className="text-[10px] text-purple-600 dark:text-purple-400">
                            {parcela.aluguelEvitadoConsorcio > 0
                              ? `-${formatCurrency(parcela.aluguelEvitadoConsorcio)} aluguel`
                              : "(sem imóvel)"}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono text-sm font-semibold ${
                        diferencaPositiva
                          ? "text-blue-600 dark:text-blue-400"
                          : diferencaNegativa
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-muted-foreground"
                      }`}>
                      {parcela.diferenca === 0 ? (
                        "-"
                      ) : (
                        <>
                          {diferencaPositiva ? "+" : ""}
                          {formatCurrency(parcela.diferenca)}
                        </>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-emerald-600 dark:text-emerald-400">
                      {parcela.saldoInvestimentoFinanciamento > 0
                        ? formatCurrency(parcela.saldoInvestimentoFinanciamento)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-emerald-600 dark:text-emerald-400">
                      {parcela.saldoInvestimentoConsorcio > 0
                        ? formatCurrency(parcela.saldoInvestimentoConsorcio)
                        : "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Toggle button for showing all/less */}
        {parcelas.length > 24 && (
          <div className="flex justify-center mt-4">
            <Button variant="outline" size="sm" onClick={() => setShowAll(!showAll)}>
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Mostrar menos
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Mostrar todos os {parcelas.length} meses
                </>
              )}
            </Button>
          </div>
        )}

        {/* Mobile scroll hint */}
        <div className="sm:hidden mt-2 px-4 text-xs text-muted-foreground text-center">
          ← Deslize para ver mais colunas →
        </div>

        {/* Legend */}
        <div className="mt-4 mx-4 sm:mx-0 p-4 bg-muted/30 rounded-lg text-sm space-y-2">
          <p className="font-medium text-muted-foreground">Legenda:</p>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-900" />
              <span>Financiamento mais barato no mês</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-100 dark:bg-amber-900" />
              <span>Consórcio mais barato no mês</span>
            </div>
            <div className="flex items-center gap-2">
              <Gift className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              <span>Mês de contemplação</span>
            </div>
            {hasAluguel && (
              <div className="flex items-center gap-2">
                <Home className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                <span>Aluguel recebido</span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <strong>Diferença positiva:</strong> financiamento é mais barato, investe a diferença.{" "}
            <strong>Diferença negativa:</strong> consórcio é mais barato, investe a diferença.
          </p>
          {hasAluguel && (
            <p className="text-xs text-muted-foreground">
              <strong>Aluguel recebido:</strong> O financiamento recebe aluguel desde o mês 1. O consórcio só recebe
              após a contemplação (quando tem o imóvel para alugar).
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

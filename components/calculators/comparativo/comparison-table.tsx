"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { ParcelaComparativa } from "@/lib/calculators/comparativo";

interface ComparisonTableProps {
  parcelas: ParcelaComparativa[];
}

export function ComparisonTable({ parcelas }: ComparisonTableProps) {
  const [showAll, setShowAll] = useState(false);

  if (parcelas.length === 0) {
    return null;
  }

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
          Comparativo mês a mês das parcelas e saldo de investimento acumulado
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
              {displayParcelas.map((parcela, index) => {
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

                return (
                  <TableRow
                    key={parcela.mes}
                    className={
                      diferencaPositiva
                        ? "bg-blue-50/30 dark:bg-blue-950/10"
                        : diferencaNegativa
                        ? "bg-amber-50/30 dark:bg-amber-950/10"
                        : ""
                    }>
                    <TableCell className="text-center font-medium sticky left-0 bg-background z-10">
                      {parcela.mes}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {parcela.parcelaFinanciamento > 0 ? formatCurrency(parcela.parcelaFinanciamento) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {parcela.parcelaConsorcio > 0 ? formatCurrency(parcela.parcelaConsorcio) : "-"}
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
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <strong>Diferença positiva:</strong> financiamento é mais barato, investe a diferença.{" "}
            <strong>Diferença negativa:</strong> consórcio é mais barato, investe a diferença.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}


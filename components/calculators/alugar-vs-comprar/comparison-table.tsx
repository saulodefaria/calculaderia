"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/index";
import type { ParcelaAluguelVsComprar } from "@/lib/calculators/alugar-vs-comprar";

interface ComparisonTableProps {
  parcelas: ParcelaAluguelVsComprar[];
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
          Comparativo mês a mês das prestações, aluguéis pagos, diferença investida e patrimônio acumulado
        </p>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <Table className="min-w-[900px]">
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-12 text-center sticky left-0 bg-background z-20">Mês</TableHead>
                <TableHead className="text-right text-blue-600 dark:text-blue-400 whitespace-nowrap">
                  Prestação Financ.
                </TableHead>
                <TableHead className="text-right text-purple-600 dark:text-purple-400 whitespace-nowrap">
                  Aluguel Pago
                </TableHead>
                <TableHead className="text-right whitespace-nowrap">Diferença Investida</TableHead>
                <TableHead className="text-right text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                  Saldo Investimento
                </TableHead>
                <TableHead className="text-right text-blue-600 dark:text-blue-400 whitespace-nowrap">
                  Patrimônio Comprar
                </TableHead>
                <TableHead className="text-right text-purple-600 dark:text-purple-400 whitespace-nowrap">
                  Patrimônio Aluguel
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayParcelas.map((parcela) => {
                // Handle collapsed row marker
                if (parcela === null) {
                  return (
                    <TableRow key="collapsed">
                      <TableCell colSpan={7} className="text-center py-4">
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

                const diferencaPositiva = parcela.diferencaInvestida > 0;
                const diferencaNegativa = parcela.diferencaInvestida < 0;

                // Determine row background based on difference
                let rowClassName = "";
                if (diferencaPositiva) {
                  rowClassName = "bg-emerald-50/30 dark:bg-emerald-950/10";
                } else if (diferencaNegativa) {
                  rowClassName = "bg-red-50/30 dark:bg-red-950/10";
                }

                return (
                  <TableRow key={parcela.mes} className={rowClassName}>
                    <TableCell className="text-center font-medium sticky left-0 bg-background z-10">
                      {parcela.mes}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {parcela.prestacaoFinanciamento > 0 ? formatCurrency(parcela.prestacaoFinanciamento) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {parcela.aluguelPago > 0 ? formatCurrency(parcela.aluguelPago) : "-"}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono text-sm font-semibold ${
                        diferencaPositiva
                          ? "text-emerald-600 dark:text-emerald-400"
                          : diferencaNegativa
                          ? "text-red-600 dark:text-red-400"
                          : "text-muted-foreground"
                      }`}>
                      {parcela.diferencaInvestida === 0 ? (
                        "-"
                      ) : (
                        <>
                          {diferencaPositiva ? "+" : ""}
                          {formatCurrency(parcela.diferencaInvestida)}
                        </>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-emerald-600 dark:text-emerald-400">
                      {parcela.saldoInvestimentoAluguel > 0 ? formatCurrency(parcela.saldoInvestimentoAluguel) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-blue-600 dark:text-blue-400">
                      {formatCurrency(parcela.patrimonioComprar)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-purple-600 dark:text-purple-400">
                      {formatCurrency(parcela.patrimonioAluguel)}
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
              <div className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-900" />
              <span>Diferença positiva: prestação maior que aluguel (investe a diferença)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-100 dark:bg-red-900" />
              <span>Diferença negativa: aluguel maior que prestação (precisa de mais dinheiro)</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <strong>Patrimônio Comprar:</strong> Valor do imóvel (valorizado) - Saldo devedor do financiamento
          </p>
          <p className="text-xs text-muted-foreground">
            <strong>Patrimônio Aluguel:</strong> Saldo investido - Aportes extras (quando aluguel &gt; prestação)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

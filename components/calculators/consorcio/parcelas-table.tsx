"use client";

import { TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { ParcelaConsorcio } from "@/lib/calculators/consorcio";

interface ParcelasTableProps {
  parcelas: ParcelaConsorcio[];
}

export function ParcelasTable({ parcelas }: ParcelasTableProps) {
  if (parcelas.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tabela de Parcelas</CardTitle>
        <p className="text-sm text-muted-foreground">
          As linhas destacadas indicam os meses onde a correção anual foi aplicada.
        </p>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <Table className="min-w-[600px]">
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-12 text-center sticky left-0 bg-background z-20">Mês</TableHead>
                <TableHead className="text-right whitespace-nowrap">Fundo Comum</TableHead>
                <TableHead className="text-right whitespace-nowrap">Taxa Admin.</TableHead>
                <TableHead className="text-right">Parcela</TableHead>
                <TableHead className="text-right whitespace-nowrap">Saldo Devedor</TableHead>
                <TableHead className="w-20 text-center">Correção</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parcelas.map((parcela) => {
                const hasCorrection = parcela.correcaoAplicada > 0;

                return (
                  <TableRow key={parcela.mes} className={hasCorrection ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}>
                    <TableCell
                      className={`text-center font-medium sticky left-0 z-10 ${
                        hasCorrection ? "bg-amber-50 dark:bg-amber-950/40" : "bg-background"
                      }`}>
                      {parcela.mes}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm whitespace-nowrap">
                      {formatCurrency(parcela.fundoComum)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-red-600 dark:text-red-400">
                      {formatCurrency(parcela.taxaAdministracao)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">
                      {formatCurrency(parcela.parcela)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(parcela.saldoDevedor)}
                    </TableCell>
                    <TableCell className="text-center">
                      {hasCorrection ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                          <TrendingUp className="h-3 w-3" />+{parcela.correcaoAplicada.toFixed(1).replace(".", ",")}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {/* Mobile scroll hint */}
        <div className="sm:hidden mt-2 px-4 text-xs text-muted-foreground text-center">
          ← Deslize para ver mais colunas →
        </div>
      </CardContent>
    </Card>
  );
}

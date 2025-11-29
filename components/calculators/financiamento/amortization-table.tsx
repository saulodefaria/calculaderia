"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { Parcela } from "@/lib/calculators/financiamento";

interface AmortizationTableProps {
  parcelas: Parcela[];
}

export function AmortizationTable({ parcelas }: AmortizationTableProps) {
  if (parcelas.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tabela de Amortização</CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="w-16 text-center">Mês</TableHead>
                <TableHead className="text-right">Saldo Inicial</TableHead>
                <TableHead className="text-right">Juros</TableHead>
                <TableHead className="text-right">Amortização</TableHead>
                <TableHead className="text-right">Prestação</TableHead>
                <TableHead className="text-right">Saldo Devedor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parcelas.map((parcela) => (
                <TableRow key={parcela.mes}>
                  <TableCell className="text-center font-medium">{parcela.mes}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatCurrency(parcela.saldoInicial)}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-red-600 dark:text-red-400">
                    {formatCurrency(parcela.jurosPago)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(parcela.amortizacao)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">
                    {formatCurrency(parcela.prestacao)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatCurrency(parcela.saldoDevedor)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

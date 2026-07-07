"use client";

import { useTranslations } from "next-intl";
import { BadgeDollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatPercent } from "@/lib/utils/index";
import type { InvestimentoCdiScenarioRow } from "@/lib/calculators/investimento-cdi";

interface ComparisonTableProps {
  rows: InvestimentoCdiScenarioRow[];
  selectedPercentualCdi: number;
}

export function ComparisonTable({ rows, selectedPercentualCdi }: ComparisonTableProps) {
  const t = useTranslations("calculators.investimento-cdi.comparison");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BadgeDollarSign className="h-5 w-5" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <p className="px-6 pb-4 text-sm text-muted-foreground sm:px-0">{t("intro")}</p>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.percent")}</TableHead>
                <TableHead className="text-right">{t("columns.grossFinal")}</TableHead>
                <TableHead className="text-right">{t("columns.grossYield")}</TableHead>
                <TableHead className="text-right">{t("columns.netFinal")}</TableHead>
                <TableHead className="text-right">{t("columns.netYield")}</TableHead>
                <TableHead className="text-right">{t("columns.netRate")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const selected = row.percentualCdi === selectedPercentualCdi;

                return (
                  <TableRow key={row.percentualCdi} data-testid={`investimento-cdi-comparison-${row.percentualCdi}`}>
                    <TableCell className="font-medium">
                      {formatPercent(row.percentualCdi)}
                      {selected && (
                        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          {t("selected")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(row.valorFinalBruto)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(row.rendimentoBruto)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(row.valorFinalLiquido)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(row.rendimentoLiquido)}</TableCell>
                    <TableCell className="text-right font-mono">{formatPercent(row.rentabilidadeLiquidaPercent)}</TableCell>
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

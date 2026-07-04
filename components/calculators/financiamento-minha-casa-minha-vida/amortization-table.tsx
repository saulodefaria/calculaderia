"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils/index";
import type { McmvParcela } from "@/lib/calculators/financiamento-minha-casa-minha-vida";

interface AmortizationTableProps {
  parcelas: McmvParcela[];
}

export function AmortizationTable({ parcelas }: AmortizationTableProps) {
  const t = useTranslations("calculators.financiamento-minha-casa-minha-vida.table");
  const [showAll, setShowAll] = useState(false);

  if (parcelas.length === 0) {
    return null;
  }

  const displayParcelas =
    showAll || parcelas.length <= 24 ? parcelas : [...parcelas.slice(0, 12), null, ...parcelas.slice(-12)];
  const collapsedCount = Math.max(0, parcelas.length - 24);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("hint")}</p>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Table className="min-w-[700px]" data-testid="financiamento-mcmv-amortization-table">
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 w-12 bg-background text-center">{t("columns.month")}</TableHead>
                <TableHead className="text-right whitespace-nowrap">{t("columns.openingBalance")}</TableHead>
                <TableHead className="text-right">{t("columns.interest")}</TableHead>
                <TableHead className="text-right whitespace-nowrap">{t("columns.principal")}</TableHead>
                <TableHead className="text-right">{t("columns.payment")}</TableHead>
                <TableHead className="text-right whitespace-nowrap">{t("columns.endingBalance")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayParcelas.map((parcela) => {
                if (parcela === null) {
                  return (
                    <TableRow key="collapsed">
                      <TableCell colSpan={6} className="py-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAll(true)}
                          className="text-muted-foreground hover:text-foreground">
                          <ChevronDown className="mr-2 h-4 w-4" />
                          {t("collapsed.showHidden", { count: collapsedCount })}
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                }

                return (
                  <TableRow key={parcela.mes}>
                    <TableCell className="sticky left-0 bg-background text-center font-medium">
                      {parcela.mes}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm whitespace-nowrap">
                      {formatCurrency(parcela.saldoInicial)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-amber-700 dark:text-amber-300">
                      {formatCurrency(parcela.juros)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-emerald-700 dark:text-emerald-300">
                      {formatCurrency(parcela.amortizacao)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold whitespace-nowrap">
                      {formatCurrency(parcela.parcela)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm whitespace-nowrap">
                      {formatCurrency(parcela.saldoFinal)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {showAll && parcelas.length > 24 && (
          <div className="border-t p-4 text-center sm:px-0">
            <Button variant="ghost" size="sm" onClick={() => setShowAll(false)}>
              <ChevronUp className="mr-2 h-4 w-4" />
              {t("collapsed.showLess")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

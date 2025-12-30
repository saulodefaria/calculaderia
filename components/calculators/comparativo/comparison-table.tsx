"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("calculators.comparativo.table");
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
        <CardTitle className="text-lg">{t("title")}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {hasAluguel ? t("subtitleWithRent") : t("subtitle")}
        </p>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <Table className="min-w-[800px]">
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-12 text-center sticky left-0 bg-background z-20">{t("columns.month")}</TableHead>
                <TableHead className="text-right text-blue-600 dark:text-blue-400 whitespace-nowrap">
                  {t("columns.financingInstallment")}
                </TableHead>
                <TableHead className="text-right text-amber-600 dark:text-amber-400 whitespace-nowrap">
                  {t("columns.consorcioInstallment")}
                </TableHead>
                <TableHead className="text-right whitespace-nowrap">{t("columns.difference")}</TableHead>
                <TableHead className="text-right text-blue-600 dark:text-blue-400 whitespace-nowrap">
                  {t("columns.financingInvestment")}
                </TableHead>
                <TableHead className="text-right text-amber-600 dark:text-amber-400 whitespace-nowrap">
                  {t("columns.consorcioInvestment")}
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
                          {t("collapsed.showHidden", { count: collapsedCount })}
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
                            {t("badges.rent", { value: formatCurrency(parcela.aluguelEvitadoFinanciamento) })}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      <div className="flex flex-col items-end">
                        <span>{parcela.parcelaConsorcio > 0 ? formatCurrency(parcela.parcelaConsorcio) : "-"}</span>
                        {isContemplacao && (parcela.valorLance || parcela.valorAgio) && (
                          <span className="text-[10px] text-purple-600 dark:text-purple-400">
                            {parcela.valorLance && t("badges.bid", { value: formatCurrency(parcela.valorLance) })}
                            {parcela.valorLance && parcela.valorAgio && " + "}
                            {parcela.valorAgio && t("badges.premium", { value: formatCurrency(parcela.valorAgio) })}
                          </span>
                        )}
                        {hasAluguel && parcela.aluguelEvitadoConsorcio !== undefined && (
                          <span className="text-[10px] text-purple-600 dark:text-purple-400">
                            {parcela.aluguelEvitadoConsorcio > 0
                              ? t("badges.rent", { value: formatCurrency(parcela.aluguelEvitadoConsorcio) })
                              : t("badges.noProperty")}
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
                  {t("toggle.showLess")}
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  {t("toggle.showAll", { count: parcelas.length })}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Mobile scroll hint */}
        <div className="sm:hidden mt-2 px-4 text-xs text-muted-foreground text-center">
          {t("mobileHint")}
        </div>

        {/* Legend */}
        <div className="mt-4 mx-4 sm:mx-0 p-4 bg-muted/30 rounded-lg text-sm space-y-2">
          <p className="font-medium text-muted-foreground">{t("legend.title")}</p>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-900" />
              <span>{t("legend.financingCheaper")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-100 dark:bg-amber-900" />
              <span>{t("legend.consorcioCheaper")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Gift className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              <span>{t("legend.contemplation")}</span>
            </div>
            {hasAluguel && (
              <div className="flex items-center gap-2">
                <Home className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                <span>{t("legend.rent")}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <strong>{t("legend.positiveLabel")}:</strong> {t("legend.positiveDescription")}{" "}
            <strong>{t("legend.negativeLabel")}:</strong> {t("legend.negativeDescription")}
          </p>
          {hasAluguel && (
            <p className="text-xs text-muted-foreground">
              <strong>{t("legend.rentLabel")}:</strong> {t("legend.rentDescription")}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

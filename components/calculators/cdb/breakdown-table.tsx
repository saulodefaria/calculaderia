"use client";

import { Fragment } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatPercent } from "@/lib/utils/index";
import type { CdbBreakdownCategory, CdbBreakdownRow, CdbModo } from "@/lib/calculators/cdb";

interface BreakdownTableProps {
  rows: CdbBreakdownRow[];
}

const CATEGORY_ORDER: CdbBreakdownCategory[] = ["entrada", "rendimento", "impostos", "liquido", "premissas"];

function formatMode(modo: CdbModo, t: ReturnType<typeof useTranslations>) {
  return modo === "pos-cdi" ? t("values.modes.posCdi") : t("values.modes.pre");
}

export function BreakdownTable({ rows }: BreakdownTableProps) {
  const t = useTranslations("calculators.cdb.breakdown");

  const formatValue = (row: CdbBreakdownRow) => {
    if (row.valor !== undefined) return formatCurrency(row.valor);
    if (row.percent !== undefined) return formatPercent(row.percent);
    if (row.id === "modo" && row.texto) return formatMode(row.texto as CdbModo, t);
    if ((row.id === "prazoDiasCorridos" || row.id === "diasUteis") && row.texto) {
      return t("values.days", { count: Number(row.texto) });
    }
    return row.texto ?? "-";
  };

  const renderDetail = (row: CdbBreakdownRow) => {
    if (row.percent !== undefined && row.valor !== undefined) {
      return t("details.rate", { rate: formatPercent(row.percent) });
    }
    return t(`rows.${row.id}.description`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.item")}</TableHead>
                <TableHead>{t("columns.detail")}</TableHead>
                <TableHead className="text-right">{t("columns.value")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CATEGORY_ORDER.map((category) => {
                const categoryRows = rows.filter((row) => row.categoria === category);
                if (categoryRows.length === 0) return null;

                return (
                  <Fragment key={category}>
                    <TableRow className="bg-muted/40">
                      <TableCell
                        colSpan={3}
                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t(`categories.${category}`)}
                      </TableCell>
                    </TableRow>
                    {categoryRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{t(`rows.${row.id}.label`)}</TableCell>
                        <TableCell>{renderDetail(row)}</TableCell>
                        <TableCell className="text-right font-mono">{formatValue(row)}</TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

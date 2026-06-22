"use client";

import { Fragment } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatPercent } from "@/lib/utils/index";
import type { FgtsBreakdownCategory, FgtsBreakdownRow } from "@/lib/calculators/fgts";

interface BreakdownTableProps {
  rows: FgtsBreakdownRow[];
}

const CATEGORY_ORDER: FgtsBreakdownCategory[] = ["depositos", "saldoBase", "rescisao", "saque"];

export function BreakdownTable({ rows }: BreakdownTableProps) {
  const t = useTranslations("calculators.fgts.breakdown");

  const renderDetail = (row: FgtsBreakdownRow) => {
    const details: string[] = [];
    if (row.detalhe) details.push(t(`details.${row.detalhe}`));
    if (row.base !== undefined) details.push(t("details.base", { value: formatCurrency(row.base) }));
    if (row.aliquota !== undefined) details.push(t("details.rate", { value: formatPercent(row.aliquota * 100) }));

    return details.length > 0 ? <span className="text-xs text-muted-foreground">{details.join(" · ")}</span> : null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Table className="min-w-[620px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.item")}</TableHead>
                <TableHead>{t("columns.detail")}</TableHead>
                <TableHead className="text-right">{t("columns.amount")}</TableHead>
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
                        <TableCell>
                          {row.aplicavel ? renderDetail(row) ?? t(`rows.${row.id}.description`) : t("notApplicable")}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {row.aplicavel ? formatCurrency(row.valor) : t("notApplicableShort")}
                        </TableCell>
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

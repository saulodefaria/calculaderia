"use client";

import { Fragment } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils/index";
import type {
  ImpostoDeRendaBreakdownCategory,
  ImpostoDeRendaBreakdownRow,
} from "@/lib/calculators/imposto-de-renda";

interface BreakdownTableProps {
  rows: ImpostoDeRendaBreakdownRow[];
}

const CATEGORY_ORDER: ImpostoDeRendaBreakdownCategory[] = ["rendimentos", "deducoes", "bases", "imposto", "saldo"];

export function BreakdownTable({ rows }: BreakdownTableProps) {
  const t = useTranslations("calculators.imposto-de-renda.breakdown");

  const renderDetail = (row: ImpostoDeRendaBreakdownRow) => {
    if (!row.detalhe) return t(`rows.${row.id}.description`);

    if (row.id === "deducaoDependentes") {
      return t("details.dependents", { count: row.detalhe });
    }

    return t(`details.${row.detalhe}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Table className="min-w-[720px]">
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
                          {row.aplicavel ? renderDetail(row) : t(`rows.${row.id}.description`)}
                        </TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(row.valor)}</TableCell>
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

"use client";

import { Fragment } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils/index";
import type {
  DecimoTerceiroBreakdownCategory,
  DecimoTerceiroBreakdownRow,
} from "@/lib/calculators/decimo-terceiro";

interface BreakdownTableProps {
  rows: DecimoTerceiroBreakdownRow[];
}

const CATEGORY_ORDER: DecimoTerceiroBreakdownCategory[] = ["base", "parcelas", "descontos", "liquido"];

export function BreakdownTable({ rows }: BreakdownTableProps) {
  const t = useTranslations("calculators.decimo-terceiro.breakdown");

  const renderAmount = (row: DecimoTerceiroBreakdownRow) => {
    if (row.id === "avos") return t("details.avos", { value: row.detalhe ?? `${row.valor}/12` });
    return formatCurrency(row.valor);
  };

  const renderDetail = (row: DecimoTerceiroBreakdownRow) => {
    const details: string[] = [];
    if (row.detalhe && row.id !== "avos") details.push(row.detalhe);
    if (row.base !== undefined) details.push(t("details.base", { value: formatCurrency(row.base) }));

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
                      <TableCell colSpan={3} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                          {row.aplicavel ? renderAmount(row) : t("notApplicableShort")}
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

"use client";

import { Fragment } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils/index";
import type { RescisaoBreakdownRow, RescisaoCategoria } from "@/lib/calculators/rescisao-trabalhista";

interface BreakdownTableProps {
  rows: RescisaoBreakdownRow[];
}

const CATEGORY_ORDER: RescisaoCategoria[] = ["provento", "fgts", "desconto"];
const EXPLICIT_ZERO_ROWS = new Set<RescisaoBreakdownRow["id"]>(["multaFgts", "saqueFgts"]);

export function BreakdownTable({ rows }: BreakdownTableProps) {
  const t = useTranslations("calculators.rescisao-sem-fgts.breakdown");

  const renderDetail = (row: RescisaoBreakdownRow) => {
    if (!row.detalhe && row.base === undefined) return null;

    const details: string[] = [];
    if (row.detalhe) {
      if (row.id === "avisoPrevio") {
        details.push(t("details.days", { value: row.detalhe }));
      } else {
        details.push(t("details.avos", { value: row.detalhe }));
      }
    }
    if (row.base !== undefined) {
      details.push(t("details.base", { value: formatCurrency(row.base) }));
    }

    return <span className="text-xs text-muted-foreground">{details.join(" · ")}</span>;
  };

  const isDisplayed = (row: RescisaoBreakdownRow) => row.aplicavel || EXPLICIT_ZERO_ROWS.has(row.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <Table className="min-w-[620px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.item")}</TableHead>
                <TableHead>{t("columns.detail")}</TableHead>
                <TableHead className="text-right">{t("columns.amount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CATEGORY_ORDER.map((category) => (
                <Fragment key={category}>
                  <TableRow className="bg-muted/40">
                    <TableCell colSpan={3} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t(`categories.${category}`)}
                    </TableCell>
                  </TableRow>
                  {rows
                    .filter((row) => row.categoria === category)
                    .map((row) => {
                      const displayed = isDisplayed(row);

                      return (
                        <TableRow key={row.id} data-testid={`rescisao-sem-fgts-row-${row.id}`}>
                          <TableCell className="font-medium">{t(`rows.${row.id}.label`)}</TableCell>
                          <TableCell>
                            {displayed ? renderDetail(row) ?? t(`rows.${row.id}.description`) : t("notApplicable")}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {displayed ? formatCurrency(row.valor) : t("notApplicableShort")}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

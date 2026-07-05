"use client";

import { Fragment } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatPercent } from "@/lib/utils/index";
import type {
  SalarioPorHoraBreakdownCategory,
  SalarioPorHoraBreakdownRow,
} from "@/lib/calculators/salario-por-hora";

interface FormulaMemoProps {
  rows: SalarioPorHoraBreakdownRow[];
}

const CATEGORY_ORDER: SalarioPorHoraBreakdownCategory[] = ["divisor", "formula", "periodo", "adicional"];
const NUMBER_ROWS = new Set<SalarioPorHoraBreakdownRow["id"]>([
  "jornadaSemanal",
  "jornadaMediaDiaria",
  "divisorMensal",
]);
const PERCENT_ROWS = new Set<SalarioPorHoraBreakdownRow["id"]>(["adicionalPercentual"]);

function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatValue(row: SalarioPorHoraBreakdownRow): string {
  if (NUMBER_ROWS.has(row.id)) return formatNumber(row.valor);
  if (PERCENT_ROWS.has(row.id)) return formatPercent(row.valor);
  return formatCurrency(row.valor);
}

export function FormulaMemo({ rows }: FormulaMemoProps) {
  const t = useTranslations("calculators.salario-por-hora.breakdown");

  const renderDetail = (row: SalarioPorHoraBreakdownRow) => {
    if (!row.detalhe) return t(`rows.${row.id}.description`);
    return t(`details.${row.detalhe}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Table className="min-w-[680px]">
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
                      <TableCell colSpan={3} className="text-xs font-semibold uppercase text-muted-foreground">
                        {t(`categories.${category}`)}
                      </TableCell>
                    </TableRow>
                    {categoryRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{t(`rows.${row.id}.label`)}</TableCell>
                        <TableCell>{row.aplicavel ? renderDetail(row) : t("notApplicable")}</TableCell>
                        <TableCell className="text-right font-mono">
                          {row.aplicavel ? formatValue(row) : t("notApplicableShort")}
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

"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CorrecaoIgpmYearSummary } from "@/lib/calculators/correcao-igpm";

export function YearlyBreakdownTable({ rows }: { rows: CorrecaoIgpmYearSummary[] }) {
  const t = useTranslations("calculators.correcao-igpm.yearly");

  const renderTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("columns.year")}</TableHead>
          <TableHead>{t("columns.period")}</TableHead>
          <TableHead className="text-right">{t("columns.months")}</TableHead>
          <TableHead className="text-right">{t("columns.factor")}</TableHead>
          <TableHead className="text-right">{t("columns.variation")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.year}>
            <TableCell className="font-medium">{row.year}</TableCell>
            <TableCell className="font-mono text-xs">{row.firstMonth} – {row.lastMonth}</TableCell>
            <TableCell className="text-right font-mono">{row.monthsApplied}</TableCell>
            <TableCell className="text-right font-mono">{row.factor.toFixed(8)}</TableCell>
            <TableCell className="text-right font-mono">{row.variationPercent.toFixed(4)}%</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <Card data-testid="correcao-igpm-yearly-table">
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <details className="px-4 sm:hidden">
          <summary className="mb-3 cursor-pointer text-sm text-muted-foreground">{t("toggle")}</summary>
          {renderTable()}
        </details>
        <div className="hidden sm:block">{renderTable()}</div>
      </CardContent>
    </Card>
  );
}

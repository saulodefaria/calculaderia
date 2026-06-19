"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DecimoTerceiroMonthMemoRow } from "@/lib/calculators/decimo-terceiro";

interface MonthMemoTableProps {
  rows: DecimoTerceiroMonthMemoRow[];
}

export function MonthMemoTable({ rows }: MonthMemoTableProps) {
  const t = useTranslations("calculators.decimo-terceiro.monthMemo");

  return (
    <Card data-testid="decimo-terceiro-avos-memo">
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Table className="min-w-[680px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.month")}</TableHead>
                <TableHead>{t("columns.period")}</TableHead>
                <TableHead className="text-right">{t("columns.days")}</TableHead>
                <TableHead>{t("columns.counted")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.month}>
                  <TableCell className="font-medium">{t(`months.${row.month}`)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.overlapStart && row.overlapEnd
                      ? t("periodValue", { start: row.overlapStart, end: row.overlapEnd })
                      : t("emptyPeriod")}
                  </TableCell>
                  <TableCell className="text-right font-mono">{row.daysConsidered}</TableCell>
                  <TableCell>
                    <span
                      className={
                        row.counted
                          ? "rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                          : "rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground"
                      }>
                      {row.counted ? t("yes") : t("no")}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

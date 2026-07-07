"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatPercent } from "@/lib/utils/index";
import type { PayrollInssSlice } from "@/lib/calculators/payroll-2026";

interface InssBracketMemoTableProps {
  slices: PayrollInssSlice[];
}

function roundCents(value: number): number {
  return Math.round((value + 1e-9) * 100) / 100;
}

export function InssBracketMemoTable({ slices }: InssBracketMemoTableProps) {
  const t = useTranslations("calculators.inss-irrf.inssBrackets");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Table className="min-w-[620px]" data-testid="inss-irrf-inss-bracket-table">
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.range")}</TableHead>
                <TableHead className="text-right">{t("columns.rate")}</TableHead>
                <TableHead className="text-right">{t("columns.amount")}</TableHead>
                <TableHead className="text-right">{t("columns.contribution")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slices.map((slice, index) => {
                const range =
                  index === 0
                    ? t("range.first", { to: formatCurrency(slice.to) })
                    : t("range.next", {
                        from: formatCurrency(roundCents(slice.from + 0.01)),
                        to: formatCurrency(slice.to),
                      });

                return (
                  <TableRow key={`${slice.from}-${slice.to}`}>
                    <TableCell className="font-medium">{range}</TableCell>
                    <TableCell className="text-right font-mono">{formatPercent(slice.rate * 100)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(slice.amount)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(slice.contribution)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

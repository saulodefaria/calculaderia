"use client";

import { useTranslations } from "next-intl";
import { ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/utils/index";
import type { InssEmAtrasoBreakdownRow } from "@/lib/calculators/inss-em-atraso";

interface BreakdownTableProps {
  rows: InssEmAtrasoBreakdownRow[];
}

function formatRowValue(row: InssEmAtrasoBreakdownRow): string {
  if (!row.aplicavel) return "-";
  if (row.id === "multaPercentual" || row.id === "jurosPercentual") return formatPercent(row.valor);
  return formatCurrency(row.valor);
}

export function BreakdownTable({ rows }: BreakdownTableProps) {
  const t = useTranslations("calculators.inss-em-atraso.breakdown");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ListChecks className="h-5 w-5" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                <th className="py-2 pr-4 font-medium">{t("columns.item")}</th>
                <th className="py-2 pr-4 font-medium">{t("columns.detail")}</th>
                <th className="py-2 text-right font-medium">{t("columns.amount")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 align-top">
                    <div className="font-medium">{t(`rows.${row.id}.label`)}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{t(`rows.${row.id}.description`)}</div>
                  </td>
                  <td className="py-3 pr-4 align-top text-muted-foreground">
                    {row.detalhe ? t(`details.${row.detalhe}`) : t(`categories.${row.categoria}`)}
                  </td>
                  <td className="py-3 text-right align-top font-mono font-semibold">{formatRowValue(row)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

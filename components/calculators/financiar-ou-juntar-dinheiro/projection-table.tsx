"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LinhaProjecaoCompraAVista } from "@/lib/calculators/financiar-ou-juntar-dinheiro";

interface ProjectionTableProps {
  rows: LinhaProjecaoCompraAVista[];
  crossingMonth: number | null;
  horizonMonth: number;
}

function formatCurrency(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === "pt-br" ? "pt-BR" : locale, {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function ProjectionTable({ rows, crossingMonth, horizonMonth }: ProjectionTableProps) {
  const t = useTranslations("calculators.financiar-ou-juntar-dinheiro.table");
  const locale = useLocale();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-muted-foreground sm:hidden">{t("mobileHint")}</p>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm" data-testid="financiar-projection-table">
            <caption className="sr-only">{t("caption")}</caption>
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-4 font-semibold">{t("columns.month")}</th>
                <th className="py-2 pr-4 font-semibold">{t("columns.balance")}</th>
                <th className="py-2 pr-4 font-semibold">{t("columns.price")}</th>
                <th className="py-2 pr-4 font-semibold">{t("columns.shortfall")}</th>
                <th className="py-2 pr-4 font-semibold">{t("columns.surplus")}</th>
                <th className="py-2 pr-4 font-semibold">{t("columns.rent")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const marker = row.mes === crossingMonth
                  ? t("markers.crossing")
                  : row.mes === horizonMonth
                    ? t("markers.horizon")
                    : null;
                return (
                  <tr key={row.mes} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">
                      {row.mes}
                      {marker && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{marker}</span>}
                    </td>
                    <td className="py-3 pr-4 font-mono">{formatCurrency(row.saldoInvestido, locale)}</td>
                    <td className="py-3 pr-4 font-mono">{formatCurrency(row.precoImovel, locale)}</td>
                    <td className="py-3 pr-4 font-mono">{formatCurrency(row.falta, locale)}</td>
                    <td className="py-3 pr-4 font-mono">{formatCurrency(row.sobra, locale)}</td>
                    <td className="py-3 pr-4 font-mono">{formatCurrency(row.aluguelAcumulado, locale)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

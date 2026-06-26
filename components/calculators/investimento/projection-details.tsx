"use client";

import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/index";
import type { InvestimentoProjectionRow, InvestimentoResult } from "@/lib/calculators/investimento";

interface ProjectionDetailsProps {
  resultado: InvestimentoResult;
}

interface ChartPoint {
  periodo: number;
  saldoFinalNominal: number;
  totalAportado: number;
  saldoFinalReal: number | null;
}

const MAX_CHART_POINTS = 36;

function sampleRows(rows: InvestimentoProjectionRow[]): ChartPoint[] {
  if (rows.length <= MAX_CHART_POINTS) {
    return rows.map((row) => ({
      periodo: row.periodo,
      saldoFinalNominal: row.saldoFinalNominal,
      totalAportado: row.totalAportado,
      saldoFinalReal: row.saldoFinalReal,
    }));
  }

  const step = (rows.length - 1) / (MAX_CHART_POINTS - 1);
  return Array.from({ length: MAX_CHART_POINTS }, (_, index) => {
    const row = rows[Math.round(index * step)];
    return {
      periodo: row.periodo,
      saldoFinalNominal: row.saldoFinalNominal,
      totalAportado: row.totalAportado,
      saldoFinalReal: row.saldoFinalReal,
    };
  });
}

function yearlyRows(rows: InvestimentoProjectionRow[]): InvestimentoProjectionRow[] {
  if (rows.length === 0) return [];
  return rows.filter((row) => row.periodo % 12 === 0 || row.periodo === rows.length);
}

export function ProjectionDetails({ resultado }: ProjectionDetailsProps) {
  const t = useTranslations("calculators.investimento.projection");
  const chartData = useMemo(() => sampleRows(resultado.projectionSeries), [resultado.projectionSeries]);
  const tableRows = useMemo(() => yearlyRows(resultado.projectionSeries), [resultado.projectionSeries]);
  const hasRealValue = resultado.valorFinalReal !== null;

  const formatAxisCurrency = useCallback((value: number) => {
    if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}k`;
    return `R$ ${value.toFixed(0)}`;
  }, []);

  return (
    <div className="space-y-6">
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("chart.title")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("chart.subtitle")}</p>
          </CardHeader>
          <CardContent>
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 1, height: 1 }}>
                <LineChart data={chartData} margin={{ top: 20, right: 24, left: 12, bottom: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="periodo" tick={{ fontSize: 12 }} tickMargin={8} />
                  <YAxis tickFormatter={formatAxisCurrency} tick={{ fontSize: 12 }} tickMargin={8} width={76} />
                  <Tooltip
                    formatter={(value, name) => [formatCurrency(Number(value)), t(`chart.legend.${String(name)}`)]}
                    labelFormatter={(label) => t("chart.tooltipMonth", { month: label })}
                  />
                  <Legend wrapperStyle={{ paddingTop: 16 }} formatter={(value) => t(`chart.legend.${value}`)} />
                  <Line
                    type="monotone"
                    dataKey="saldoFinalNominal"
                    stroke="hsl(158, 64%, 34%)"
                    strokeWidth={2}
                    dot={false}
                    name="saldoFinalNominal"
                  />
                  <Line
                    type="monotone"
                    dataKey="totalAportado"
                    stroke="hsl(217, 91%, 60%)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="totalAportado"
                  />
                  {hasRealValue && (
                    <Line
                      type="monotone"
                      dataKey="saldoFinalReal"
                      stroke="hsl(38, 92%, 50%)"
                      strokeWidth={2}
                      strokeDasharray="3 4"
                      dot={false}
                      name="saldoFinalReal"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {tableRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("table.title")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("table.subtitle")}</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 pr-4 font-semibold">{t("table.columns.month")}</th>
                    <th className="py-2 pr-4 font-semibold">{t("table.columns.contributed")}</th>
                    <th className="py-2 pr-4 font-semibold">{t("table.columns.earnings")}</th>
                    <th className="py-2 pr-4 font-semibold">{t("table.columns.nominal")}</th>
                    {hasRealValue && <th className="py-2 pr-4 font-semibold">{t("table.columns.real")}</th>}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row) => (
                    <tr key={row.periodo} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{row.periodo}</td>
                      <td className="py-3 pr-4 font-mono">{formatCurrency(row.totalAportado)}</td>
                      <td className="py-3 pr-4 font-mono">{formatCurrency(row.saldoFinalNominal - row.totalAportado)}</td>
                      <td className="py-3 pr-4 font-mono font-semibold">{formatCurrency(row.saldoFinalNominal)}</td>
                      {hasRealValue && (
                        <td className="py-3 pr-4 font-mono">
                          {row.saldoFinalReal === null ? "-" : formatCurrency(row.saldoFinalReal)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

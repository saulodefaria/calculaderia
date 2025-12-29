"use client";

import { useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { Payload } from "recharts/types/component/DefaultTooltipContent";
import { formatCurrency } from "@/lib/utils/index";
import type { ResultadoJurosCompostos } from "@/lib/calculators/juros-compostos";

interface EvolutionGraphProps {
  resultado: ResultadoJurosCompostos;
}

interface ChartDataPoint {
  periodo: number;
  valorFinal: number;
  aportesAcumulados: number;
  originalIndex: number;
}

const MAX_DATA_POINTS = 30;

/**
 * Samples the evolution data to a maximum number of points for better graph visualization
 */
function sampleEvolutionData(evolucao: ResultadoJurosCompostos["evolucao"], totalAportes: number, maxPoints: number) {
  const totalPeriodos = evolucao.length;

  if (totalPeriodos <= maxPoints) {
    // No sampling needed
    return evolucao.map((periodo) => {
      const cumulativeAportes = periodo.periodo * (totalAportes / totalPeriodos);
      return {
        periodo: periodo.periodo,
        valorFinal: Math.round(periodo.valorFinal * 100) / 100,
        aportesAcumulados: Math.round(cumulativeAportes * 100) / 100,
        originalIndex: periodo.periodo - 1,
      };
    });
  }

  // Sample evenly across the data, always including first and last
  const sampledData: Array<{
    periodo: number;
    valorFinal: number;
    aportesAcumulados: number;
    originalIndex: number;
  }> = [];

  // Calculate step size to get approximately maxPoints
  const step = (totalPeriodos - 1) / (maxPoints - 1);

  for (let i = 0; i < maxPoints; i++) {
    const index = Math.round(i * step);
    const periodo = evolucao[index];
    const cumulativeAportes = periodo.periodo * (totalAportes / totalPeriodos);

    sampledData.push({
      periodo: periodo.periodo,
      valorFinal: Math.round(periodo.valorFinal * 100) / 100,
      aportesAcumulados: Math.round(cumulativeAportes * 100) / 100,
      originalIndex: index,
    });
  }

  return sampledData;
}

export function EvolutionGraph({ resultado }: EvolutionGraphProps) {
  const chartData = useMemo(() => {
    return sampleEvolutionData(resultado.evolucao, resultado.totalAportes, MAX_DATA_POINTS);
  }, [resultado]);

  const renderTooltip = useCallback(
    ({ active, payload }: { active?: boolean; payload?: readonly Payload<number, string>[] }) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload as ChartDataPoint;
        const periodo = resultado.evolucao[data.originalIndex];
        if (!periodo) return null;

        const hasAportes = resultado.totalAportes > 0;

        return (
          <div className="rounded-lg border bg-background p-3 shadow-md">
            <p className="font-semibold mb-2">Período {data.periodo}</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Valor Inicial:</span>
                <span className="font-mono">{formatCurrency(periodo.valorInicial)}</span>
              </div>
              {hasAportes && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Aporte do Período:</span>
                  <span className="font-mono">{formatCurrency(periodo.aporte)}</span>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Juros:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(periodo.juros)}
                </span>
              </div>
              <div className="flex justify-between gap-4 border-t pt-1 mt-1">
                <span className="font-semibold">Valor Final:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(periodo.valorFinal)}
                </span>
              </div>
              {hasAportes && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Aportes Acumulados:</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">
                    {formatCurrency(data.aportesAcumulados)}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      }
      return null;
    },
    [resultado]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Evolução do Investimento</CardTitle>
        <p className="text-sm text-muted-foreground">Acompanhe o crescimento do seu investimento ao longo do tempo</p>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="periodo" tick={{ fontSize: 12 }} tickMargin={8} />
              <YAxis
                tickFormatter={(value) => {
                  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
                  return `R$ ${value.toFixed(0)}`;
                }}
                tick={{ fontSize: 12 }}
                tickMargin={8}
                width={80}
              />
              <Tooltip content={renderTooltip} />
              <Legend wrapperStyle={{ paddingTop: 16 }} />
              <Line
                type="monotone"
                dataKey="valorFinal"
                stroke="hsl(142, 71%, 45%)"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Valor Total"
                activeDot={{ r: 6 }}
              />
              {resultado.totalAportes > 0 && (
                <Line
                  type="monotone"
                  dataKey="aportesAcumulados"
                  stroke="hsl(217, 91%, 60%)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3 }}
                  name="Aportes Acumulados"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

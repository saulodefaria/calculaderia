"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { TooltipContentProps } from "recharts";
import { formatCurrency } from "@/lib/utils/index";
import type { ResultadoComparadorRendaFixa, RendaFixaTipo } from "@/lib/calculators/renda-fixa";
import { RENDA_FIXA_TIPO_LABELS } from "@/lib/calculators/renda-fixa";

interface EvolutionGraphProps {
  resultado: ResultadoComparadorRendaFixa;
}

interface ChartDataPoint {
  dia: number;
  [key: string]: number | string;
}

const MAX_DATA_POINTS = 50;

/**
 * Samples the evolution data to a maximum number of points for better graph visualization
 */
function sampleEvolutionData(
  evolucoes: Record<RendaFixaTipo, { dia: number; valorLiquido: number; valorReal: number }[]>,
  maxPoints: number
): ChartDataPoint[] {
  const tipos: RendaFixaTipo[] = ["pre", "cdi", "ipca", "selic"];
  const maxDia = Math.max(...tipos.map((tipo) => Math.max(...evolucoes[tipo].map((e) => e.dia))));

  if (maxDia <= maxPoints) {
    // No sampling needed - use all points
    const data: ChartDataPoint[] = [];
    for (let dia = 0; dia <= maxDia; dia++) {
      const point: ChartDataPoint = { dia };
      tipos.forEach((tipo) => {
        const evo = evolucoes[tipo].find((e) => e.dia === dia);
        if (evo) {
          point[`${tipo}_liquido`] = Math.round(evo.valorLiquido * 100) / 100;
          point[`${tipo}_real`] = Math.round(evo.valorReal * 100) / 100;
        }
      });
      data.push(point);
    }
    return data;
  }

  // Sample evenly
  const sampledData: ChartDataPoint[] = [];
  const step = maxDia / (maxPoints - 1);

  for (let i = 0; i < maxPoints; i++) {
    const dia = Math.round(i * step);
    const point: ChartDataPoint = { dia };
    tipos.forEach((tipo) => {
      // Find closest evolution point
      const evo = evolucoes[tipo].reduce((closest, current) => {
        return Math.abs(current.dia - dia) < Math.abs(closest.dia - dia) ? current : closest;
      });
      if (evo) {
        point[`${tipo}_liquido`] = Math.round(evo.valorLiquido * 100) / 100;
        point[`${tipo}_real`] = Math.round(evo.valorReal * 100) / 100;
      }
    });
    sampledData.push(point);
  }

  return sampledData;
}

export function EvolutionGraph({ resultado }: EvolutionGraphProps) {
  const t = useTranslations("calculators.renda-fixa.chart");
  const [mode, setMode] = useState<"nominal" | "real">("nominal");

  const evolucoes = useMemo(() => {
    const evos: Record<RendaFixaTipo, { dia: number; valorLiquido: number; valorReal: number }[]> = {
      pre: [],
      cdi: [],
      ipca: [],
      selic: [],
    };

    resultado.opcoes.forEach((opcao) => {
      evos[opcao.tipo] = opcao.evolucao.map((e) => ({
        dia: e.dia,
        valorLiquido: e.valorLiquido,
        valorReal: e.valorReal,
      }));
    });

    return evos;
  }, [resultado]);

  const chartData = useMemo(() => {
    return sampleEvolutionData(evolucoes, MAX_DATA_POINTS);
  }, [evolucoes]);

  const getTipoLabel = (tipo: RendaFixaTipo) => {
    return RENDA_FIXA_TIPO_LABELS[tipo];
  };

  const getTipoColor = (tipo: RendaFixaTipo) => {
    const colors: Record<RendaFixaTipo, string> = {
      pre: "hsl(217, 91%, 60%)",
      cdi: "hsl(280, 70%, 60%)",
      ipca: "hsl(43, 96%, 56%)",
      selic: "hsl(142, 71%, 45%)",
    };
    return colors[tipo];
  };

  const renderTooltip = useCallback(
    ({ active, payload }: TooltipContentProps) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload as ChartDataPoint;
        return (
          <div className="rounded-lg border bg-background p-3 shadow-md">
            <p className="font-semibold mb-2">{t("tooltip.title", { day: data.dia })}</p>
            <div className="space-y-1 text-sm">
              {(["pre", "cdi", "ipca", "selic"] as RendaFixaTipo[]).map((tipo) => {
                const valueKey = mode === "nominal" ? `${tipo}_liquido` : `${tipo}_real`;
                const value = data[valueKey] as number | undefined;
                if (value === undefined) return null;

                return (
                  <div key={tipo} className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{getTipoLabel(tipo)}:</span>
                    <span className="font-mono font-bold" style={{ color: getTipoColor(tipo) }}>
                      {formatCurrency(value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
      return null;
    },
    [t, mode]
  );

  const tipos: RendaFixaTipo[] = ["pre", "cdi", "ipca", "selic"];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{t("title")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
          <Tabs value={mode} onValueChange={(v) => setMode(v as "nominal" | "real")}>
            <TabsList>
              <TabsTrigger value="nominal">{t("tabs.nominal")}</TabsTrigger>
              <TabsTrigger value="real">{t("tabs.real")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 1, height: 1 }}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="dia"
                tick={{ fontSize: 12 }}
                tickMargin={8}
                label={{ value: t("axes.days"), position: "insideBottom", offset: -5 }}
              />
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
              {tipos.map((tipo) => {
                const dataKey = mode === "nominal" ? `${tipo}_liquido` : `${tipo}_real`;
                return (
                  <Line
                    key={tipo}
                    type="monotone"
                    dataKey={dataKey}
                    stroke={getTipoColor(tipo)}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name={getTipoLabel(tipo)}
                    activeDot={{ r: 5 }}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

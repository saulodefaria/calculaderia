"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, ArrowRight, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { ResultadoTir, PeriodoTir } from "@/lib/calculators/tir";
import { PERIODO_SUFFIX, npv } from "@/lib/calculators/tir";

interface ResultsSummaryProps {
  resultado: ResultadoTir;
  periodo: PeriodoTir;
  cashflows: number[];
}

export function ResultsSummary({ resultado, periodo, cashflows }: ResultsSummaryProps) {
  const [taxaDesconto, setTaxaDesconto] = useState<string>("");
  const [vplCalculado, setVplCalculado] = useState<number | null>(null);

  const handleTaxaDescontoChange = (value: string) => {
    // Permite apenas números, vírgula e ponto
    const cleaned = value.replace(/[^\d.,]/g, "");
    setTaxaDesconto(cleaned);

    // Calcula VPL em tempo real
    const taxaNum = parseFloat(cleaned.replace(",", "."));
    if (Number.isFinite(taxaNum) && cashflows.length > 0) {
      const vpl = npv(taxaNum / 100, cashflows);
      setVplCalculado(Number.isFinite(vpl) ? vpl : null);
    } else {
      setVplCalculado(null);
    }
  };

  const tirPeriodicaPercent = resultado.tirPeriodica !== null ? resultado.tirPeriodica * 100 : null;
  const tirAnualPercent = resultado.tirAnual !== null ? resultado.tirAnual * 100 : null;

  const isPositiveTir = tirPeriodicaPercent !== null && tirPeriodicaPercent >= 0;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* TIR Principal */}
        <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              {isPositiveTir ? (
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
              Taxa Interna de Retorno (TIR)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* TIR no período */}
              <div className="flex flex-col rounded-lg border bg-background p-4 text-center">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  TIR {PERIODO_SUFFIX[periodo]}
                </span>
                {tirPeriodicaPercent !== null ? (
                  <span
                    className={`mt-2 text-3xl font-bold font-mono ${
                      tirPeriodicaPercent >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatPercent(tirPeriodicaPercent)}
                  </span>
                ) : (
                  <span className="mt-2 text-xl text-muted-foreground">N/A</span>
                )}
              </div>

              {/* TIR Anual */}
              <div className="flex flex-col rounded-lg border bg-background p-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">TIR Anual</span>
                  <Tooltip delayDuration={120}>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                        <Info className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-center">
                      <p>Taxa equivalente anual calculada a partir da TIR {PERIODO_SUFFIX[periodo]}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                {tirAnualPercent !== null ? (
                  <span
                    className={`mt-2 text-3xl font-bold font-mono ${
                      tirAnualPercent >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatPercent(tirAnualPercent)}
                  </span>
                ) : (
                  <span className="mt-2 text-xl text-muted-foreground">N/A</span>
                )}
              </div>
            </div>

            {periodo !== "anual" && tirPeriodicaPercent !== null && tirAnualPercent !== null && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>{formatPercent(tirPeriodicaPercent)} {PERIODO_SUFFIX[periodo]}</span>
                <ArrowRight className="h-4 w-4" />
                <span>{formatPercent(tirAnualPercent)} a.a.</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* VPL Calculator */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Valor Presente Líquido (VPL)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="taxaDesconto">Taxa de Desconto ({PERIODO_SUFFIX[periodo]})</Label>
                <div className="relative">
                  <Input
                    id="taxaDesconto"
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={taxaDesconto}
                    onChange={(e) => handleTaxaDescontoChange(e.target.value)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
              </div>
              <div className="flex-1 rounded-lg border bg-muted/30 p-4 text-center">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">VPL</span>
                {vplCalculado !== null ? (
                  <span
                    className={`mt-1 text-xl font-bold font-mono block ${
                      vplCalculado >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatCurrency(vplCalculado)}
                  </span>
                ) : (
                  <span className="mt-1 text-lg text-muted-foreground block">
                    {taxaDesconto ? "N/A" : "Informe a taxa"}
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              O VPL indica se o investimento gera valor: positivo significa ganho, negativo significa perda quando
              descontado à taxa informada.
            </p>
          </CardContent>
        </Card>

        {/* Resumo dos Fluxos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Resumo dos Fluxos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryItem
                label="Períodos"
                value={resultado.quantidadePeriodos.toString()}
                sublabel={periodo === "mensal" ? "meses" : periodo === "trimestral" ? "trimestres" : periodo === "semestral" ? "semestres" : "anos"}
              />
              <SummaryItem
                label="Entradas"
                value={formatCurrency(resultado.totalPositivos)}
                sublabel="Fluxos positivos"
                variant="success"
              />
              <SummaryItem
                label="Saídas"
                value={formatCurrency(resultado.totalNegativos)}
                sublabel="Fluxos negativos"
                variant="danger"
              />
              <SummaryItem
                label="Saldo Líquido"
                value={formatCurrency(resultado.totalFluxos)}
                sublabel="Soma total"
                variant={resultado.totalFluxos >= 0 ? "success" : "danger"}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

interface SummaryItemProps {
  label: string;
  value: string;
  sublabel?: string;
  variant?: "default" | "success" | "danger";
}

function SummaryItem({ label, value, sublabel, variant = "default" }: SummaryItemProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border p-4 text-center">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <span
        className={`mt-1 text-lg font-bold font-mono ${
          variant === "success"
            ? "text-emerald-600 dark:text-emerald-400"
            : variant === "danger"
            ? "text-red-600 dark:text-red-400"
            : ""
        }`}
      >
        {value}
      </span>
      {sublabel && <span className="text-xs text-muted-foreground">{sublabel}</span>}
    </div>
  );
}


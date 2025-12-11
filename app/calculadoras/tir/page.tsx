"use client";

import { Suspense, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/ui/share-button";
import { CalculatorForm } from "@/components/calculators/tir/calculator-form";
import { ResultsSummary } from "@/components/calculators/tir/results-summary";
import {
  calcularTir,
  type PeriodoTir,
  type ResultadoTir,
} from "@/lib/calculators/tir";
import { decodeTirState, generateTirShareUrl, type TirUrlState } from "@/lib/url-state";

function TirCalculator() {
  const searchParams = useSearchParams();

  // Decode URL params once on mount
  const initialState = useMemo(() => {
    return decodeTirState(searchParams);
  }, [searchParams]);

  // State
  const [cashflows, setCashflows] = useState<number[]>(() => initialState?.cashflows ?? []);
  const [periodo, setPeriodo] = useState<PeriodoTir>(() => initialState?.periodo ?? "mensal");
  const [resultado, setResultado] = useState<ResultadoTir | null>(() => {
    if (initialState?.cashflows && initialState.cashflows.length >= 2) {
      return calcularTir({
        cashflows: initialState.cashflows,
        periodo: initialState.periodo,
        taxaDesconto: initialState.taxaDesconto,
      });
    }
    return null;
  });

  const handleCalculate = (newCashflows: number[], newPeriodo: PeriodoTir) => {
    setCashflows(newCashflows);
    setPeriodo(newPeriodo);
    const result = calcularTir({
      cashflows: newCashflows,
      periodo: newPeriodo,
    });
    setResultado(result);
  };

  // Generate share URL with current state
  const getShareUrl = useCallback(() => {
    if (cashflows.length === 0) return window.location.href;

    const state: TirUrlState = {
      cashflows,
      periodo,
    };

    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    return generateTirShareUrl(baseUrl, state);
  }, [cashflows, periodo]);

  return (
    <>
      {/* Calculator Form */}
      <div className="mb-8">
        <CalculatorForm
          onCalculate={handleCalculate}
          initialCashflows={initialState?.cashflows}
          initialPeriodo={initialState?.periodo}
        />
      </div>

      {/* Results Section */}
      {resultado && (
        <div className="space-y-6">
          {/* Share button */}
          <div className="flex justify-end">
            <ShareButton getShareUrl={getShareUrl} />
          </div>

          {/* Error state */}
          {resultado.erro ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-destructive shrink-0" />
                <div>
                  <h3 className="font-semibold text-destructive">Erro no cálculo</h3>
                  <p className="text-sm text-muted-foreground mt-1">{resultado.erro}</p>
                </div>
              </div>
            </div>
          ) : (
            <ResultsSummary resultado={resultado} periodo={periodo} cashflows={cashflows} />
          )}
        </div>
      )}
    </>
  );
}

function CalculatorSkeleton() {
  return (
    <div className="mb-8 animate-pulse">
      <div className="rounded-lg border bg-card p-6">
        <div className="h-6 w-48 bg-muted rounded mb-6" />
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-2">
                <div className="h-4 w-16 bg-muted rounded" />
                <div className="h-10 flex-1 bg-muted rounded" />
              </div>
            ))}
          </div>
          <div className="h-10 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

export default function TirPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Voltar para início
          </Link>
        </Button>
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Calculadora de TIR</h1>
        <p className="text-muted-foreground">
          Calcule a Taxa Interna de Retorno de uma série de fluxos de caixa. Insira valores negativos para saídas 
          (investimentos) e positivos para entradas (retornos).
        </p>
      </div>

      {/* Wrap calculator in Suspense for useSearchParams */}
      <Suspense fallback={<CalculatorSkeleton />}>
        <TirCalculator />
      </Suspense>
    </div>
  );
}


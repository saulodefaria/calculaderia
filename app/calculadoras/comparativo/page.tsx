"use client";

import { Suspense, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalculatorForm } from "@/components/calculators/comparativo/calculator-form";
import { ResultsSummary } from "@/components/calculators/comparativo/results-summary";
import { ComparisonTable } from "@/components/calculators/comparativo/comparison-table";
import { ShareButton } from "@/components/ui/share-button";
import { calcularComparativo, type InputsComparativo, type ResultadoComparativo } from "@/lib/calculators/comparativo";
import { decodeComparativoState, generateComparativoShareUrl, type ComparativoUrlState } from "@/lib/url-state/index";

function ComparativoCalculator() {
  const searchParams = useSearchParams();

  // Decode URL params once on mount - memoized to avoid recalculation
  const initialState = useMemo(() => {
    return decodeComparativoState(searchParams);
  }, [searchParams]);

  // Initialize state from URL params if present
  const [inputs, setInputs] = useState<InputsComparativo | null>(() => initialState?.inputs ?? null);
  const [resultado, setResultado] = useState<ResultadoComparativo | null>(() => {
    if (initialState?.inputs) {
      return calcularComparativo(initialState.inputs);
    }
    return null;
  });

  const handleCalculate = (newInputs: InputsComparativo) => {
    setInputs(newInputs);
    const result = calcularComparativo(newInputs);
    setResultado(result);
  };

  // Generate share URL with current state
  const getShareUrl = useCallback(() => {
    if (!inputs) return window.location.href;

    const state: ComparativoUrlState = {
      inputs,
    };

    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    return generateComparativoShareUrl(baseUrl, state);
  }, [inputs]);

  return (
    <>
      {/* Calculator Form */}
      <div className="mb-8">
        <CalculatorForm onCalculate={handleCalculate} initialValues={initialState?.inputs} />
      </div>

      {/* Results Section */}
      {resultado && (
        <div className="space-y-6">
          <div className="flex items-center justify-end">
            <ShareButton getShareUrl={getShareUrl} />
          </div>
          <ResultsSummary resultado={resultado} />
          <ComparisonTable parcelas={resultado.comparacao.parcelasMensais} />
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
        <div className="space-y-6">
          {/* Valor do Imóvel */}
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
          {/* Financiamento section */}
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
              </div>
            ))}
          </div>
          {/* Consórcio section */}
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="h-10 bg-muted rounded mt-6" />
      </div>
    </div>
  );
}

export default function ComparativoPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
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
        <h1 className="text-3xl font-bold tracking-tight mb-2">Financiamento vs Consórcio</h1>
        <p className="text-muted-foreground">
          Compare as duas opções lado a lado e descubra qual deixa mais dinheiro no seu bolso. A diferença mensal entre
          as parcelas é investida para calcular o saldo final.
        </p>
      </div>

      {/* Wrap calculator in Suspense for useSearchParams */}
      <Suspense fallback={<CalculatorSkeleton />}>
        <ComparativoCalculator />
      </Suspense>
    </div>
  );
}

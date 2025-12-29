"use client";

import { Suspense, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalculatorForm } from "@/components/calculators/aluguel-vs-comprar/calculator-form";
import { ResultsSummary } from "@/components/calculators/aluguel-vs-comprar/results-summary";
import { ComparisonTable } from "@/components/calculators/aluguel-vs-comprar/comparison-table";
import { ShareButton } from "@/components/ui/share-button";
import {
  calcularAluguelVsComprar,
  type InputsAluguelVsComprar,
  type ResultadoAluguelVsComprar,
} from "@/lib/calculators/aluguel-vs-comprar";
import {
  decodeAluguelVsComprarState,
  generateAluguelVsComprarShareUrl,
  type AluguelVsComprarUrlState,
} from "@/lib/url-state/index";

function AluguelVsComprarCalculator() {
  const searchParams = useSearchParams();

  // Decode URL params once on mount - memoized to avoid recalculation
  const initialState = useMemo(() => {
    return decodeAluguelVsComprarState(searchParams);
  }, [searchParams]);

  // Initialize state from URL params if present
  const [inputs, setInputs] = useState<InputsAluguelVsComprar | null>(() => initialState?.inputs ?? null);
  const [resultado, setResultado] = useState<ResultadoAluguelVsComprar | null>(() => {
    if (initialState?.inputs) {
      return calcularAluguelVsComprar(initialState.inputs);
    }
    return null;
  });

  const handleCalculate = (newInputs: InputsAluguelVsComprar) => {
    setInputs(newInputs);
    const result = calcularAluguelVsComprar(newInputs);
    setResultado(result);
  };

  // Generate share URL with current state
  const getShareUrl = useCallback(() => {
    if (!inputs) return window.location.href;

    const state: AluguelVsComprarUrlState = {
      inputs,
    };

    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    return generateAluguelVsComprarShareUrl(baseUrl, state);
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
          <ComparisonTable parcelas={resultado.parcelasMensais} />
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
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
            </div>
          ))}
        </div>
        <div className="h-10 bg-muted rounded mt-4" />
      </div>
    </div>
  );
}

export default function AluguelVsComprarPage() {
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
        <h1 className="text-3xl font-bold tracking-tight mb-2">Aluguel vs Comprar</h1>
        <p className="text-muted-foreground">
          Compare se é melhor comprar um imóvel financiado ou alugar e investir a diferença. A calculadora mostra qual
          opção deixa mais patrimônio ao final do período de financiamento.
        </p>
      </div>

      {/* Wrap calculator in Suspense for useSearchParams */}
      <Suspense fallback={<CalculatorSkeleton />}>
        <AluguelVsComprarCalculator />
      </Suspense>
    </div>
  );
}

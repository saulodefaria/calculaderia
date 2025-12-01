"use client";

import { Suspense, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalculatorForm } from "@/components/calculators/consorcio/calculator-form";
import { ResultsSummary } from "@/components/calculators/consorcio/results-summary";
import { ParcelasTable } from "@/components/calculators/consorcio/parcelas-table";
import { ShareButton } from "@/components/ui/share-button";
import { calcularConsorcio, type InputsConsorcio, type ResultadoConsorcio } from "@/lib/calculators/consorcio";
import { decodeConsorcioState, generateConsorcioShareUrl, type ConsorcioUrlState } from "@/lib/url-state";

function ConsorcioCalculator() {
  const searchParams = useSearchParams();

  // Decode URL params once on mount - memoized to avoid recalculation
  const initialState = useMemo(() => {
    return decodeConsorcioState(searchParams);
  }, [searchParams]);

  // Initialize state from URL params if present
  const [inputs, setInputs] = useState<InputsConsorcio | null>(() => initialState?.inputs ?? null);
  const [resultado, setResultado] = useState<ResultadoConsorcio | null>(() => {
    if (initialState?.inputs) {
      return calcularConsorcio(initialState.inputs);
    }
    return null;
  });

  const handleCalculate = (newInputs: InputsConsorcio) => {
    setInputs(newInputs);
    const result = calcularConsorcio(newInputs);
    setResultado(result);
  };

  // Generate share URL with current state
  const getShareUrl = useCallback(() => {
    if (!inputs) return window.location.href;

    const state: ConsorcioUrlState = {
      inputs,
    };

    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    return generateConsorcioShareUrl(baseUrl, state);
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
          <ParcelasTable parcelas={resultado.parcelas} />
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
          {[1, 2, 3, 4].map((i) => (
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

export default function ConsorcioPage() {
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
        <h1 className="text-3xl font-bold tracking-tight mb-2">Calculadora de Consórcio</h1>
        <p className="text-muted-foreground">
          Simule as parcelas do seu consórcio com correção anual por INCC/IPCA. Visualize a tabela completa de parcelas
          e acompanhe como o valor aumenta ao longo do tempo.
        </p>
      </div>

      {/* Wrap calculator in Suspense for useSearchParams */}
      <Suspense fallback={<CalculatorSkeleton />}>
        <ConsorcioCalculator />
      </Suspense>
    </div>
  );
}

"use client";

import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { CalculatorForm } from "@/components/calculators/alugar-vs-comprar/calculator-form";
import { ResultsSummary } from "@/components/calculators/alugar-vs-comprar/results-summary";
import { ComparisonTable } from "@/components/calculators/alugar-vs-comprar/comparison-table";
import { ShareButton } from "@/components/ui/share-button";
import {
  calcularAluguelVsComprar,
  type InputsAluguelVsComprar,
  type ResultadoAluguelVsComprar,
} from "@/lib/calculators/alugar-vs-comprar";
import {
  decodeAluguelVsComprarState,
  generateAluguelVsComprarShareUrl,
  type AluguelVsComprarUrlState,
} from "@/lib/url-state/index";

export function AluguelVsComprarCalculatorClient() {
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


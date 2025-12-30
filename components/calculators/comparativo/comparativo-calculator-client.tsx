"use client";

import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { CalculatorForm } from "@/components/calculators/comparativo/calculator-form";
import { ResultsSummary } from "@/components/calculators/comparativo/results-summary";
import { ComparisonTable } from "@/components/calculators/comparativo/comparison-table";
import { ShareButton } from "@/components/ui/share-button";
import { calcularComparativo, type InputsComparativo, type ResultadoComparativo } from "@/lib/calculators/comparativo";
import { getCurrentPageBaseUrl } from "@/lib/utils";
import { decodeComparativoState, generateComparativoShareUrl, type ComparativoUrlState } from "@/lib/url-state/index";

export function ComparativoCalculatorClient() {
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

    return generateComparativoShareUrl(getCurrentPageBaseUrl(), state);
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

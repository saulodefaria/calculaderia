"use client";

import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { CalculatorForm } from "@/components/calculators/renda-fixa/calculator-form";
import { ResultsSummary } from "@/components/calculators/renda-fixa/results-summary";
import { ComparisonTable } from "@/components/calculators/renda-fixa/comparison-table";
import { EvolutionGraph } from "@/components/calculators/renda-fixa/evolution-graph";
import { ShareButton } from "@/components/ui/share-button";
import { SaveButton } from "@/components/ui/save-button";
import {
  calcularComparadorRendaFixa,
  type InputsComparadorRendaFixa,
  type ResultadoComparadorRendaFixa,
} from "@/lib/calculators/renda-fixa";
import { getCurrentPageBaseUrl } from "@/lib/utils";
import { decodeRendaFixaState, generateRendaFixaShareUrl, type RendaFixaUrlState } from "@/lib/url-state/index";

export function RendaFixaCalculatorClient() {
  const searchParams = useSearchParams();

  // Decode URL params once on mount - memoized to avoid recalculation
  const initialState = useMemo(() => {
    return decodeRendaFixaState(searchParams);
  }, [searchParams]);

  // Initialize state from URL params if present
  const [inputs, setInputs] = useState<InputsComparadorRendaFixa | null>(() => initialState?.inputs ?? null);
  const [resultado, setResultado] = useState<ResultadoComparadorRendaFixa | null>(() => {
    if (initialState?.inputs) {
      return calcularComparadorRendaFixa(initialState.inputs);
    }
    return null;
  });

  const handleCalculate = (newInputs: InputsComparadorRendaFixa) => {
    setInputs(newInputs);
    const result = calcularComparadorRendaFixa(newInputs);
    setResultado(result);
  };

  // Generate share URL with current state
  const getShareUrl = useCallback(() => {
    if (!inputs) return window.location.href;

    const state: RendaFixaUrlState = {
      inputs,
    };

    return generateRendaFixaShareUrl(getCurrentPageBaseUrl(), state);
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
          <div className="flex items-center justify-end gap-2">
            <SaveButton getShareUrl={getShareUrl} calculatorId="renda-fixa" />
            <ShareButton getShareUrl={getShareUrl} />
          </div>
          <ResultsSummary resultado={resultado} />
          <ComparisonTable resultado={resultado} />
          <EvolutionGraph resultado={resultado} />
        </div>
      )}
    </>
  );
}

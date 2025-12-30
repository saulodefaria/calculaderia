"use client";

import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { CalculatorForm } from "@/components/calculators/juros-compostos/calculator-form";
import { ResultsSummary } from "@/components/calculators/juros-compostos/results-summary";
import { EvolutionGraph } from "@/components/calculators/juros-compostos/evolution-graph";
import { ShareButton } from "@/components/ui/share-button";
import {
  calcularJurosCompostos,
  type InputsJurosCompostos,
  type ResultadoJurosCompostos,
} from "@/lib/calculators/juros-compostos";
import {
  decodeJurosCompostosState,
  generateJurosCompostosShareUrl,
  type JurosCompostosUrlState,
} from "@/lib/url-state/index";

export function JurosCompostosCalculatorClient() {
  const searchParams = useSearchParams();

  // Decode URL params once on mount - memoized to avoid recalculation
  const initialState = useMemo(() => {
    return decodeJurosCompostosState(searchParams);
  }, [searchParams]);

  // Initialize state from URL params if present
  const [inputs, setInputs] = useState<InputsJurosCompostos | null>(() => initialState?.inputs ?? null);
  const [resultado, setResultado] = useState<ResultadoJurosCompostos | null>(() => {
    if (initialState?.inputs) {
      return calcularJurosCompostos(initialState.inputs);
    }
    return null;
  });

  const handleCalculate = (newInputs: InputsJurosCompostos) => {
    setInputs(newInputs);
    const result = calcularJurosCompostos(newInputs);
    setResultado(result);
  };

  // Generate share URL with current state
  const getShareUrl = useCallback(() => {
    if (!inputs) return window.location.href;

    const state: JurosCompostosUrlState = {
      inputs,
    };

    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    return generateJurosCompostosShareUrl(baseUrl, state);
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
          <ResultsSummary resultado={resultado} periodo={inputs!.periodo} />
          <EvolutionGraph resultado={resultado} />
        </div>
      )}
    </>
  );
}

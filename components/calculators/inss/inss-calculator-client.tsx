"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BracketMemoTable } from "@/components/calculators/inss/bracket-memo-table";
import { CalculatorForm } from "@/components/calculators/inss/calculator-form";
import { ResultsSummary } from "@/components/calculators/inss/results-summary";
import { SaveButton } from "@/components/ui/save-button";
import { ShareButton } from "@/components/ui/share-button";
import { calcularInss, type InssInputs, type ResultadoInss } from "@/lib/calculators/inss";
import { getCurrentPageBaseUrl } from "@/lib/utils";
import { decodeInssState, generateInssShareUrl, type InssUrlState } from "@/lib/url-state/index";

function InssCalculator() {
  const searchParams = useSearchParams();
  const initialState = useMemo(() => decodeInssState(searchParams), [searchParams]);
  const [inputs, setInputs] = useState<InssInputs | null>(() => initialState?.inputs ?? null);
  const [resultado, setResultado] = useState<ResultadoInss | null>(() =>
    initialState?.inputs ? calcularInss(initialState.inputs) : null
  );

  const handleCalculate = (nextInputs: InssInputs) => {
    setInputs(nextInputs);
    setResultado(calcularInss(nextInputs));
  };

  const getShareUrl = useCallback(() => {
    if (!inputs) return window.location.href;

    const state: InssUrlState = { inputs };
    return generateInssShareUrl(getCurrentPageBaseUrl(), state);
  }, [inputs]);

  return (
    <>
      <div className="mb-8">
        <CalculatorForm onCalculate={handleCalculate} initialValues={initialState?.inputs} />
      </div>

      {resultado && (
        <div className="space-y-6">
          <div className="flex items-center justify-end gap-2">
            <span data-testid="inss-save">
              <SaveButton getShareUrl={getShareUrl} calculatorId="inss" />
            </span>
            <span data-testid="inss-share">
              <ShareButton getShareUrl={getShareUrl} />
            </span>
          </div>
          <ResultsSummary resultado={resultado} />
          <BracketMemoTable slices={resultado.slices} />
        </div>
      )}
    </>
  );
}

export function InssCalculatorClient() {
  return <InssCalculator />;
}

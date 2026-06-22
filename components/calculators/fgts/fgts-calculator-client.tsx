"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BreakdownTable } from "@/components/calculators/fgts/breakdown-table";
import { CalculatorForm } from "@/components/calculators/fgts/calculator-form";
import { ResultsSummary } from "@/components/calculators/fgts/results-summary";
import { SaveButton } from "@/components/ui/save-button";
import { ShareButton } from "@/components/ui/share-button";
import { calcularFgts, type FgtsInputs, type ResultadoFgts } from "@/lib/calculators/fgts";
import { getCurrentPageBaseUrl } from "@/lib/utils";
import { decodeFgtsState, generateFgtsShareUrl, type FgtsUrlState } from "@/lib/url-state/index";

function FgtsCalculator() {
  const searchParams = useSearchParams();
  const initialState = useMemo(() => decodeFgtsState(searchParams), [searchParams]);
  const [inputs, setInputs] = useState<FgtsInputs | null>(() => initialState?.inputs ?? null);
  const [resultado, setResultado] = useState<ResultadoFgts | null>(() =>
    initialState?.inputs ? calcularFgts(initialState.inputs) : null
  );

  const handleCalculate = (nextInputs: FgtsInputs) => {
    setInputs(nextInputs);
    setResultado(calcularFgts(nextInputs));
  };

  const getShareUrl = useCallback(() => {
    if (!inputs) return window.location.href;

    const state: FgtsUrlState = { inputs };
    return generateFgtsShareUrl(getCurrentPageBaseUrl(), state);
  }, [inputs]);

  return (
    <>
      <div className="mb-8">
        <CalculatorForm onCalculate={handleCalculate} initialValues={initialState?.inputs} />
      </div>

      {resultado && (
        <div className="space-y-6">
          <div className="flex items-center justify-end gap-2">
            <span data-testid="fgts-save">
              <SaveButton getShareUrl={getShareUrl} calculatorId="fgts" />
            </span>
            <span data-testid="fgts-share">
              <ShareButton getShareUrl={getShareUrl} />
            </span>
          </div>
          <ResultsSummary resultado={resultado} />
          <BreakdownTable rows={resultado.breakdown} />
        </div>
      )}
    </>
  );
}

export function FgtsCalculatorClient() {
  return <FgtsCalculator />;
}

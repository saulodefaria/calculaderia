"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BreakdownTable } from "@/components/calculators/ferias/breakdown-table";
import { CalculatorForm } from "@/components/calculators/ferias/calculator-form";
import { EntitlementPanel } from "@/components/calculators/ferias/entitlement-panel";
import { ResultsSummary } from "@/components/calculators/ferias/results-summary";
import { SaveButton } from "@/components/ui/save-button";
import { ShareButton } from "@/components/ui/share-button";
import { calcularFerias, type InputsFerias, type ResultadoFerias } from "@/lib/calculators/ferias";
import { getCurrentPageBaseUrl } from "@/lib/utils";
import { decodeFeriasState, generateFeriasShareUrl, type FeriasUrlState } from "@/lib/url-state/index";

function FeriasCalculator() {
  const searchParams = useSearchParams();
  const initialState = useMemo(() => decodeFeriasState(searchParams), [searchParams]);
  const [inputs, setInputs] = useState<InputsFerias | null>(() => initialState?.inputs ?? null);
  const [resultado, setResultado] = useState<ResultadoFerias | null>(() =>
    initialState?.inputs ? calcularFerias(initialState.inputs) : null
  );

  const handleCalculate = (nextInputs: InputsFerias) => {
    setInputs(nextInputs);
    setResultado(calcularFerias(nextInputs));
  };

  const getShareUrl = useCallback(() => {
    if (!inputs) return window.location.href;

    const state: FeriasUrlState = { inputs };
    return generateFeriasShareUrl(getCurrentPageBaseUrl(), state);
  }, [inputs]);

  return (
    <>
      <div className="mb-8">
        <CalculatorForm onCalculate={handleCalculate} initialValues={initialState?.inputs} />
      </div>

      {resultado && (
        <div className="space-y-6">
          <div className="flex items-center justify-end gap-2">
            <SaveButton getShareUrl={getShareUrl} calculatorId="ferias" />
            <ShareButton getShareUrl={getShareUrl} />
          </div>
          <ResultsSummary resultado={resultado} />
          <EntitlementPanel resultado={resultado} />
          <BreakdownTable rows={resultado.breakdown} />
        </div>
      )}
    </>
  );
}

export function FeriasCalculatorClient() {
  return <FeriasCalculator />;
}

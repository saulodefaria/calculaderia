"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalculatorForm } from "@/components/calculators/inss-irrf/calculator-form";
import { InssBracketMemoTable } from "@/components/calculators/inss-irrf/inss-bracket-memo-table";
import { IrrfMemoTable } from "@/components/calculators/inss-irrf/irrf-memo-table";
import { ResultsSummary } from "@/components/calculators/inss-irrf/results-summary";
import { SaveButton } from "@/components/ui/save-button";
import { ShareButton } from "@/components/ui/share-button";
import { calcularInssIrrf, type InssIrrfInputs, type ResultadoInssIrrf } from "@/lib/calculators/inss-irrf";
import { getCurrentPageBaseUrl } from "@/lib/utils";
import {
  decodeInssIrrfState,
  generateInssIrrfShareUrl,
  type InssIrrfUrlState,
  type InssIrrfUrlWarningCode,
} from "@/lib/url-state/index";

function InssIrrfCalculator() {
  const searchParams = useSearchParams();
  const initialState = useMemo(() => decodeInssIrrfState(searchParams), [searchParams]);
  const [inputs, setInputs] = useState<InssIrrfInputs | null>(() => initialState?.inputs ?? null);
  const [urlWarnings, setUrlWarnings] = useState<InssIrrfUrlWarningCode[]>(() => initialState?.warnings ?? []);
  const [resultado, setResultado] = useState<ResultadoInssIrrf | null>(() =>
    initialState?.inputs ? calcularInssIrrf(initialState.inputs) : null
  );

  const handleCalculate = (nextInputs: InssIrrfInputs) => {
    setInputs(nextInputs);
    setUrlWarnings([]);
    setResultado(calcularInssIrrf(nextInputs));
  };

  const getShareUrl = useCallback(() => {
    if (!inputs) return window.location.href;

    const state: InssIrrfUrlState = { inputs, warnings: [] };
    return generateInssIrrfShareUrl(getCurrentPageBaseUrl(), state);
  }, [inputs]);

  return (
    <>
      <div className="mb-8">
        <CalculatorForm onCalculate={handleCalculate} initialValues={initialState?.inputs} />
      </div>

      {resultado && (
        <div className="space-y-6">
          <div className="flex items-center justify-end gap-2">
            <span data-testid="inss-irrf-save">
              <SaveButton getShareUrl={getShareUrl} calculatorId="inss-irrf" />
            </span>
            <span data-testid="inss-irrf-share">
              <ShareButton getShareUrl={getShareUrl} />
            </span>
          </div>
          <ResultsSummary resultado={resultado} urlWarnings={urlWarnings} />
          <InssBracketMemoTable slices={resultado.inssMemo.slices} />
          <IrrfMemoTable resultado={resultado} />
        </div>
      )}
    </>
  );
}

export function InssIrrfCalculatorClient() {
  return <InssIrrfCalculator />;
}

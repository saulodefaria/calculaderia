"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalculatorForm } from "@/components/calculators/rescisao-trabalhista/calculator-form";
import { ResultsSummary } from "@/components/calculators/rescisao-trabalhista/results-summary";
import { BreakdownTable } from "@/components/calculators/rescisao-trabalhista/breakdown-table";
import { SaveButton } from "@/components/ui/save-button";
import { ShareButton } from "@/components/ui/share-button";
import {
  calcularRescisaoTrabalhista,
  type InputsRescisaoTrabalhista,
  type ResultadoRescisaoTrabalhista,
} from "@/lib/calculators/rescisao-trabalhista";
import { getCurrentPageBaseUrl } from "@/lib/utils";
import {
  decodeRescisaoTrabalhistaState,
  generateRescisaoTrabalhistaShareUrl,
  type RescisaoTrabalhistaUrlState,
} from "@/lib/url-state/index";

function RescisaoTrabalhistaCalculator() {
  const searchParams = useSearchParams();

  const initialState = useMemo(() => decodeRescisaoTrabalhistaState(searchParams), [searchParams]);
  const [inputs, setInputs] = useState<InputsRescisaoTrabalhista | null>(() => initialState?.inputs ?? null);
  const [resultado, setResultado] = useState<ResultadoRescisaoTrabalhista | null>(() =>
    initialState?.inputs ? calcularRescisaoTrabalhista(initialState.inputs) : null
  );

  const handleCalculate = (nextInputs: InputsRescisaoTrabalhista) => {
    setInputs(nextInputs);
    setResultado(calcularRescisaoTrabalhista(nextInputs));
  };

  const getShareUrl = useCallback(() => {
    if (!inputs) return window.location.href;

    const state: RescisaoTrabalhistaUrlState = { inputs };
    return generateRescisaoTrabalhistaShareUrl(getCurrentPageBaseUrl(), state);
  }, [inputs]);

  return (
    <>
      <div className="mb-8">
        <CalculatorForm onCalculate={handleCalculate} initialValues={initialState?.inputs} />
      </div>

      {resultado && (
        <div className="space-y-6">
          <div className="flex items-center justify-end gap-2">
            <SaveButton getShareUrl={getShareUrl} calculatorId="rescisao-trabalhista" />
            <ShareButton getShareUrl={getShareUrl} />
          </div>
          <ResultsSummary resultado={resultado} />
          <BreakdownTable rows={resultado.breakdown} />
        </div>
      )}
    </>
  );
}

export function RescisaoTrabalhistaCalculatorClient() {
  return <RescisaoTrabalhistaCalculator />;
}

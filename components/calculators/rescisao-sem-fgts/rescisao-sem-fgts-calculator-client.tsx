"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BreakdownTable } from "@/components/calculators/rescisao-sem-fgts/breakdown-table";
import { CalculatorForm } from "@/components/calculators/rescisao-sem-fgts/calculator-form";
import { ResultsSummary } from "@/components/calculators/rescisao-sem-fgts/results-summary";
import { SaveButton } from "@/components/ui/save-button";
import { ShareButton } from "@/components/ui/share-button";
import {
  calcularRescisaoSemFgts,
  type InputsRescisaoSemFgts,
  type ResultadoRescisaoSemFgts,
} from "@/lib/calculators/rescisao-sem-fgts";
import { getCurrentPageBaseUrl } from "@/lib/utils";
import {
  decodeRescisaoSemFgtsState,
  generateRescisaoSemFgtsShareUrl,
  type RescisaoSemFgtsUrlState,
} from "@/lib/url-state/index";

function RescisaoSemFgtsCalculator() {
  const searchParams = useSearchParams();
  const initialState = useMemo(() => decodeRescisaoSemFgtsState(searchParams), [searchParams]);
  const [inputs, setInputs] = useState<InputsRescisaoSemFgts | null>(() => initialState?.inputs ?? null);
  const [resultado, setResultado] = useState<ResultadoRescisaoSemFgts | null>(() =>
    initialState?.inputs ? calcularRescisaoSemFgts(initialState.inputs) : null
  );

  const handleCalculate = (nextInputs: InputsRescisaoSemFgts) => {
    setInputs(nextInputs);
    setResultado(calcularRescisaoSemFgts(nextInputs));
  };

  const getShareUrl = useCallback(() => {
    if (!inputs) return window.location.href;

    const state: RescisaoSemFgtsUrlState = { inputs };
    return generateRescisaoSemFgtsShareUrl(getCurrentPageBaseUrl(), state);
  }, [inputs]);

  return (
    <>
      <div className="mb-8">
        <CalculatorForm onCalculate={handleCalculate} initialValues={initialState?.inputs} />
      </div>

      {inputs && resultado && (
        <div className="space-y-6">
          <div className="flex items-center justify-end gap-2">
            <span data-testid="rescisao-sem-fgts-save">
              <SaveButton getShareUrl={getShareUrl} calculatorId="rescisao-sem-fgts" />
            </span>
            <span data-testid="rescisao-sem-fgts-share">
              <ShareButton getShareUrl={getShareUrl} />
            </span>
          </div>
          <ResultsSummary inputs={inputs} resultado={resultado} />
          <BreakdownTable rows={resultado.breakdown} />
        </div>
      )}
    </>
  );
}

export function RescisaoSemFgtsCalculatorClient() {
  return <RescisaoSemFgtsCalculator />;
}

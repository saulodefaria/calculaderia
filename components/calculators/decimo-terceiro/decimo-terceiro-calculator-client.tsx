"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BreakdownTable } from "@/components/calculators/decimo-terceiro/breakdown-table";
import { CalculatorForm } from "@/components/calculators/decimo-terceiro/calculator-form";
import { MonthMemoTable } from "@/components/calculators/decimo-terceiro/month-memo-table";
import { ResultsSummary } from "@/components/calculators/decimo-terceiro/results-summary";
import { SaveButton } from "@/components/ui/save-button";
import { ShareButton } from "@/components/ui/share-button";
import {
  calcularDecimoTerceiro,
  type InputsDecimoTerceiro,
  type ResultadoDecimoTerceiro,
} from "@/lib/calculators/decimo-terceiro";
import { getCurrentPageBaseUrl } from "@/lib/utils";
import {
  decodeDecimoTerceiroState,
  generateDecimoTerceiroShareUrl,
  type DecimoTerceiroUrlState,
} from "@/lib/url-state/index";

function DecimoTerceiroCalculator() {
  const searchParams = useSearchParams();
  const initialState = useMemo(() => {
    if (searchParams.toString().length === 0) return null;
    return decodeDecimoTerceiroState(searchParams);
  }, [searchParams]);
  const [inputs, setInputs] = useState<InputsDecimoTerceiro | null>(() => initialState?.inputs ?? null);
  const [resultado, setResultado] = useState<ResultadoDecimoTerceiro | null>(() =>
    initialState?.inputs ? calcularDecimoTerceiro(initialState.inputs) : null
  );

  const handleCalculate = (nextInputs: InputsDecimoTerceiro) => {
    setInputs(nextInputs);
    setResultado(calcularDecimoTerceiro(nextInputs));
  };

  const getShareUrl = useCallback(() => {
    if (!inputs) return window.location.href;

    const state: DecimoTerceiroUrlState = { inputs };
    return generateDecimoTerceiroShareUrl(getCurrentPageBaseUrl(), state);
  }, [inputs]);

  return (
    <>
      <div className="mb-8">
        <CalculatorForm onCalculate={handleCalculate} initialValues={initialState?.inputs} />
      </div>

      {resultado && (
        <div className="space-y-6">
          <div className="flex items-center justify-end gap-2">
            <span data-testid="decimo-terceiro-save">
              <SaveButton getShareUrl={getShareUrl} calculatorId="decimo-terceiro" />
            </span>
            <span data-testid="decimo-terceiro-share">
              <ShareButton getShareUrl={getShareUrl} />
            </span>
          </div>
          <ResultsSummary resultado={resultado} />
          <BreakdownTable rows={resultado.breakdown} />
          <MonthMemoTable rows={resultado.monthMemo} />
        </div>
      )}
    </>
  );
}

export function DecimoTerceiroCalculatorClient() {
  return <DecimoTerceiroCalculator />;
}

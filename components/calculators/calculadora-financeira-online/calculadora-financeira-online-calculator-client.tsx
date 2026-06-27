"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalculatorForm } from "@/components/calculators/calculadora-financeira-online/calculator-form";
import { ResultsSummary } from "@/components/calculators/calculadora-financeira-online/results-summary";
import { SaveButton } from "@/components/ui/save-button";
import { ShareButton } from "@/components/ui/share-button";
import {
  calcularCalculadoraFinanceiraOnline,
  getDefaultCalculadoraFinanceiraOnlineInputs,
  type CalculadoraFinanceiraOnlineInputs,
  type CalculadoraFinanceiraOnlineResult,
} from "@/lib/calculators/calculadora-financeira-online";
import { getCurrentPageBaseUrl } from "@/lib/utils";
import {
  decodeCalculadoraFinanceiraOnlineState,
  generateCalculadoraFinanceiraOnlineShareUrl,
  type CalculadoraFinanceiraOnlineUrlState,
} from "@/lib/url-state/index";

function CalculadoraFinanceiraOnlineCalculator() {
  const searchParams = useSearchParams();
  const initialState = useMemo(() => decodeCalculadoraFinanceiraOnlineState(searchParams), [searchParams]);
  const initialInputs = useMemo(
    () => initialState?.inputs ?? getDefaultCalculadoraFinanceiraOnlineInputs(),
    [initialState]
  );
  const [inputs, setInputs] = useState<CalculadoraFinanceiraOnlineInputs>(() => initialInputs);
  const [resultado, setResultado] = useState<CalculadoraFinanceiraOnlineResult>(() =>
    calcularCalculadoraFinanceiraOnline(initialInputs)
  );

  const handleCalculate = (nextInputs: CalculadoraFinanceiraOnlineInputs) => {
    setInputs(nextInputs);
    setResultado(calcularCalculadoraFinanceiraOnline(nextInputs));
  };

  const getShareUrl = useCallback(() => {
    const state: CalculadoraFinanceiraOnlineUrlState = { inputs };
    return generateCalculadoraFinanceiraOnlineShareUrl(getCurrentPageBaseUrl(), state);
  }, [inputs]);

  return (
    <>
      <div className="mb-8">
        <CalculatorForm onCalculate={handleCalculate} initialValues={initialInputs} />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-end gap-2">
          <span data-testid="calculadora-financeira-online-save">
            <SaveButton getShareUrl={getShareUrl} calculatorId="calculadora-financeira-online" />
          </span>
          <span data-testid="calculadora-financeira-online-share">
            <ShareButton getShareUrl={getShareUrl} />
          </span>
        </div>
        <ResultsSummary resultado={resultado} />
      </div>
    </>
  );
}

export function CalculadoraFinanceiraOnlineCalculatorClient() {
  return <CalculadoraFinanceiraOnlineCalculator />;
}

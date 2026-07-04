"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AmortizationTable } from "@/components/calculators/financiamento-minha-casa-minha-vida/amortization-table";
import { CalculatorForm } from "@/components/calculators/financiamento-minha-casa-minha-vida/calculator-form";
import { ResultsSummary } from "@/components/calculators/financiamento-minha-casa-minha-vida/results-summary";
import { SaveButton } from "@/components/ui/save-button";
import { ShareButton } from "@/components/ui/share-button";
import {
  calcularFinanciamentoMinhaCasaMinhaVida,
  type McmvInputs,
  type ResultadoMinhaCasaMinhaVida,
} from "@/lib/calculators/financiamento-minha-casa-minha-vida";
import { getCurrentPageBaseUrl } from "@/lib/utils";
import {
  decodeFinanciamentoMcmvState,
  generateFinanciamentoMcmvShareUrl,
  type FinanciamentoMcmvUrlState,
} from "@/lib/url-state/index";

function FinanciamentoMinhaCasaMinhaVidaCalculator() {
  const searchParams = useSearchParams();
  const initialState = useMemo(() => decodeFinanciamentoMcmvState(searchParams), [searchParams]);
  const [inputs, setInputs] = useState<McmvInputs | null>(() => initialState?.inputs ?? null);
  const [resultado, setResultado] = useState<ResultadoMinhaCasaMinhaVida | null>(() =>
    initialState?.inputs ? calcularFinanciamentoMinhaCasaMinhaVida(initialState.inputs) : null
  );

  const handleCalculate = (nextInputs: McmvInputs) => {
    setInputs(nextInputs);
    setResultado(calcularFinanciamentoMinhaCasaMinhaVida(nextInputs));
  };

  const getShareUrl = useCallback(() => {
    if (!inputs) return window.location.href;

    const state: FinanciamentoMcmvUrlState = { inputs };
    return generateFinanciamentoMcmvShareUrl(getCurrentPageBaseUrl(), state);
  }, [inputs]);

  return (
    <>
      <div className="mb-8">
        <CalculatorForm onCalculate={handleCalculate} initialValues={initialState?.inputs} />
      </div>

      {resultado && (
        <div className="space-y-6">
          <div className="flex items-center justify-end gap-2">
            <span data-testid="financiamento-mcmv-save">
              <SaveButton getShareUrl={getShareUrl} calculatorId="financiamento-minha-casa-minha-vida" />
            </span>
            <span data-testid="financiamento-mcmv-share">
              <ShareButton getShareUrl={getShareUrl} />
            </span>
          </div>
          <ResultsSummary resultado={resultado} />
          <AmortizationTable parcelas={resultado.parcelas} />
        </div>
      )}
    </>
  );
}

export function FinanciamentoMinhaCasaMinhaVidaCalculatorClient() {
  return <FinanciamentoMinhaCasaMinhaVidaCalculator />;
}

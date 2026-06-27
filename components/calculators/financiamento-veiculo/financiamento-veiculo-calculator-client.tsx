"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AmortizationTable } from "@/components/calculators/financiamento-veiculo/amortization-table";
import { CalculatorForm } from "@/components/calculators/financiamento-veiculo/calculator-form";
import { ResultsSummary } from "@/components/calculators/financiamento-veiculo/results-summary";
import { SaveButton } from "@/components/ui/save-button";
import { ShareButton } from "@/components/ui/share-button";
import {
  calcularFinanciamentoVeiculo,
  type FinanciamentoVeiculoInputs,
  type ResultadoFinanciamentoVeiculo,
} from "@/lib/calculators/financiamento-veiculo";
import { getCurrentPageBaseUrl } from "@/lib/utils";
import {
  decodeFinanciamentoVeiculoState,
  generateFinanciamentoVeiculoShareUrl,
  type FinanciamentoVeiculoUrlState,
} from "@/lib/url-state/index";

function FinanciamentoVeiculoCalculator() {
  const searchParams = useSearchParams();
  const initialState = useMemo(() => decodeFinanciamentoVeiculoState(searchParams), [searchParams]);
  const [inputs, setInputs] = useState<FinanciamentoVeiculoInputs | null>(() => initialState?.inputs ?? null);
  const [resultado, setResultado] = useState<ResultadoFinanciamentoVeiculo | null>(() =>
    initialState?.inputs ? calcularFinanciamentoVeiculo(initialState.inputs) : null
  );

  const handleCalculate = (nextInputs: FinanciamentoVeiculoInputs) => {
    setInputs(nextInputs);
    setResultado(calcularFinanciamentoVeiculo(nextInputs));
  };

  const getShareUrl = useCallback(() => {
    if (!inputs) return window.location.href;

    const state: FinanciamentoVeiculoUrlState = { inputs };
    return generateFinanciamentoVeiculoShareUrl(getCurrentPageBaseUrl(), state);
  }, [inputs]);

  return (
    <>
      <div className="mb-8">
        <CalculatorForm onCalculate={handleCalculate} initialValues={initialState?.inputs} />
      </div>

      {resultado && (
        <div className="space-y-6">
          <div className="flex items-center justify-end gap-2">
            <span data-testid="financiamento-veiculo-save">
              <SaveButton getShareUrl={getShareUrl} calculatorId="financiamento-veiculo" />
            </span>
            <span data-testid="financiamento-veiculo-share">
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

export function FinanciamentoVeiculoCalculatorClient() {
  return <FinanciamentoVeiculoCalculator />;
}

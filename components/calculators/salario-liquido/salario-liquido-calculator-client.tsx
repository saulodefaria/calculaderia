"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BreakdownTable } from "@/components/calculators/salario-liquido/breakdown-table";
import { CalculatorForm } from "@/components/calculators/salario-liquido/calculator-form";
import { ResultsSummary } from "@/components/calculators/salario-liquido/results-summary";
import { SaveButton } from "@/components/ui/save-button";
import { ShareButton } from "@/components/ui/share-button";
import {
  calcularSalarioLiquido,
  type ResultadoSalarioLiquido,
  type SalarioLiquidoInputs,
} from "@/lib/calculators/salario-liquido";
import { getCurrentPageBaseUrl } from "@/lib/utils";
import {
  decodeSalarioLiquidoState,
  generateSalarioLiquidoShareUrl,
  type SalarioLiquidoUrlState,
} from "@/lib/url-state/index";

function SalarioLiquidoCalculator() {
  const searchParams = useSearchParams();
  const initialState = useMemo(() => decodeSalarioLiquidoState(searchParams), [searchParams]);
  const [inputs, setInputs] = useState<SalarioLiquidoInputs | null>(() => initialState?.inputs ?? null);
  const [resultado, setResultado] = useState<ResultadoSalarioLiquido | null>(() =>
    initialState?.inputs ? calcularSalarioLiquido(initialState.inputs) : null
  );

  const handleCalculate = (nextInputs: SalarioLiquidoInputs) => {
    setInputs(nextInputs);
    setResultado(calcularSalarioLiquido(nextInputs));
  };

  const getShareUrl = useCallback(() => {
    if (!inputs) return window.location.href;

    const state: SalarioLiquidoUrlState = { inputs };
    return generateSalarioLiquidoShareUrl(getCurrentPageBaseUrl(), state);
  }, [inputs]);

  return (
    <>
      <div className="mb-8">
        <CalculatorForm onCalculate={handleCalculate} initialValues={initialState?.inputs} />
      </div>

      {resultado && (
        <div className="space-y-6">
          <div className="flex items-center justify-end gap-2">
            <span data-testid="salario-liquido-save">
              <SaveButton getShareUrl={getShareUrl} calculatorId="salario-liquido" />
            </span>
            <span data-testid="salario-liquido-share">
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

export function SalarioLiquidoCalculatorClient() {
  return <SalarioLiquidoCalculator />;
}

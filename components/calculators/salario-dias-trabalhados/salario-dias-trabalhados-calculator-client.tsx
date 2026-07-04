"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BreakdownTable } from "@/components/calculators/salario-dias-trabalhados/breakdown-table";
import { CalculatorForm } from "@/components/calculators/salario-dias-trabalhados/calculator-form";
import { ResultsSummary } from "@/components/calculators/salario-dias-trabalhados/results-summary";
import { SaveButton } from "@/components/ui/save-button";
import { ShareButton } from "@/components/ui/share-button";
import {
  calcularSalarioDiasTrabalhados,
  type ResultadoSalarioDiasTrabalhados,
  type SalarioDiasTrabalhadosInputs,
  type SalarioDiasTrabalhadosWarningCode,
} from "@/lib/calculators/salario-dias-trabalhados";
import { getCurrentPageBaseUrl } from "@/lib/utils";
import {
  decodeSalarioDiasTrabalhadosState,
  generateSalarioDiasTrabalhadosShareUrl,
  type SalarioDiasTrabalhadosUrlState,
} from "@/lib/url-state/index";

function calculateWithExtraWarnings(
  inputs: SalarioDiasTrabalhadosInputs,
  extraWarnings: SalarioDiasTrabalhadosWarningCode[] = []
): ResultadoSalarioDiasTrabalhados {
  const resultado = calcularSalarioDiasTrabalhados(inputs);
  if (extraWarnings.length === 0) return resultado;

  return {
    ...resultado,
    warnings: [...new Set([...extraWarnings, ...resultado.warnings])],
  };
}

function SalarioDiasTrabalhadosCalculator() {
  const searchParams = useSearchParams();
  const initialState = useMemo(() => decodeSalarioDiasTrabalhadosState(searchParams), [searchParams]);
  const [inputs, setInputs] = useState<SalarioDiasTrabalhadosInputs | null>(() => initialState?.inputs ?? null);
  const [resultado, setResultado] = useState<ResultadoSalarioDiasTrabalhados | null>(() =>
    initialState?.inputs ? calculateWithExtraWarnings(initialState.inputs, initialState.warnings) : null
  );

  const handleCalculate = (nextInputs: SalarioDiasTrabalhadosInputs) => {
    setInputs(nextInputs);
    setResultado(calculateWithExtraWarnings(nextInputs));
  };

  const getShareUrl = useCallback(() => {
    if (!inputs) return window.location.href;

    const state: SalarioDiasTrabalhadosUrlState = { inputs };
    return generateSalarioDiasTrabalhadosShareUrl(getCurrentPageBaseUrl(), state);
  }, [inputs]);

  return (
    <>
      <div className="mb-8">
        <CalculatorForm onCalculate={handleCalculate} initialValues={initialState?.inputs} />
      </div>

      {resultado && (
        <div className="space-y-6">
          <div className="flex items-center justify-end gap-2">
            <span data-testid="salario-dias-trabalhados-save">
              <SaveButton getShareUrl={getShareUrl} calculatorId="salario-dias-trabalhados" />
            </span>
            <span data-testid="salario-dias-trabalhados-share">
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

export function SalarioDiasTrabalhadosCalculatorClient() {
  return <SalarioDiasTrabalhadosCalculator />;
}

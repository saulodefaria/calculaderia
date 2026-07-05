"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalculatorForm } from "@/components/calculators/salario-por-hora/calculator-form";
import { FormulaMemo } from "@/components/calculators/salario-por-hora/formula-memo";
import { ResultsSummary } from "@/components/calculators/salario-por-hora/results-summary";
import { SaveButton } from "@/components/ui/save-button";
import { ShareButton } from "@/components/ui/share-button";
import {
  calcularSalarioPorHora,
  type ResultadoSalarioPorHora,
  type SalarioPorHoraInputs,
  type SalarioPorHoraWarningCode,
} from "@/lib/calculators/salario-por-hora";
import { getCurrentPageBaseUrl } from "@/lib/utils";
import {
  decodeSalarioPorHoraState,
  generateSalarioPorHoraShareUrl,
  type SalarioPorHoraUrlState,
} from "@/lib/url-state/index";

function calculateWithExtraWarnings(
  inputs: SalarioPorHoraInputs,
  extraWarnings: SalarioPorHoraWarningCode[] = []
): ResultadoSalarioPorHora {
  const resultado = calcularSalarioPorHora(inputs);
  if (extraWarnings.length === 0) return resultado;

  return {
    ...resultado,
    warnings: [...new Set([...extraWarnings, ...resultado.warnings])],
  };
}

function SalarioPorHoraCalculator() {
  const searchParams = useSearchParams();
  const initialState = useMemo(() => decodeSalarioPorHoraState(searchParams), [searchParams]);
  const [inputs, setInputs] = useState<SalarioPorHoraInputs | null>(() => initialState?.inputs ?? null);
  const [resultado, setResultado] = useState<ResultadoSalarioPorHora | null>(() =>
    initialState?.inputs ? calculateWithExtraWarnings(initialState.inputs, initialState.warnings) : null
  );

  const handleCalculate = (nextInputs: SalarioPorHoraInputs) => {
    setInputs(nextInputs);
    setResultado(calculateWithExtraWarnings(nextInputs));
  };

  const getShareUrl = useCallback(() => {
    if (!inputs) return window.location.href;

    const state: SalarioPorHoraUrlState = { inputs };
    return generateSalarioPorHoraShareUrl(getCurrentPageBaseUrl(), state);
  }, [inputs]);

  return (
    <>
      <div className="mb-8">
        <CalculatorForm onCalculate={handleCalculate} initialValues={initialState?.inputs} />
      </div>

      {resultado && (
        <div className="space-y-6">
          <div className="flex items-center justify-end gap-2">
            <span data-testid="salario-por-hora-save">
              <SaveButton getShareUrl={getShareUrl} calculatorId="salario-por-hora" />
            </span>
            <span data-testid="salario-por-hora-share">
              <ShareButton getShareUrl={getShareUrl} />
            </span>
          </div>
          <ResultsSummary resultado={resultado} />
          <FormulaMemo rows={resultado.breakdown} />
        </div>
      )}
    </>
  );
}

export function SalarioPorHoraCalculatorClient() {
  return <SalarioPorHoraCalculator />;
}

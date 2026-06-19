"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalculatorForm } from "@/components/calculators/seguro-desemprego/calculator-form";
import { EligibilityPanel } from "@/components/calculators/seguro-desemprego/eligibility-panel";
import { ResultsSummary } from "@/components/calculators/seguro-desemprego/results-summary";
import { SaveButton } from "@/components/ui/save-button";
import { ShareButton } from "@/components/ui/share-button";
import {
  calcularSeguroDesemprego,
  type ResultadoSeguroDesemprego,
  type SeguroDesempregoInputs,
} from "@/lib/calculators/seguro-desemprego";
import { getCurrentPageBaseUrl } from "@/lib/utils";
import {
  decodeSeguroDesempregoState,
  generateSeguroDesempregoShareUrl,
  type SeguroDesempregoUrlState,
} from "@/lib/url-state/index";

function SeguroDesempregoCalculator() {
  const searchParams = useSearchParams();
  const initialState = useMemo(() => decodeSeguroDesempregoState(searchParams), [searchParams]);
  const [inputs, setInputs] = useState<SeguroDesempregoInputs | null>(() => initialState?.inputs ?? null);
  const [resultado, setResultado] = useState<ResultadoSeguroDesemprego | null>(() =>
    initialState?.inputs ? calcularSeguroDesemprego(initialState.inputs) : null
  );

  const handleCalculate = (nextInputs: SeguroDesempregoInputs) => {
    setInputs(nextInputs);
    setResultado(calcularSeguroDesemprego(nextInputs));
  };

  const getShareUrl = useCallback(() => {
    if (!inputs) return window.location.href;

    const state: SeguroDesempregoUrlState = { inputs };
    return generateSeguroDesempregoShareUrl(getCurrentPageBaseUrl(), state);
  }, [inputs]);

  return (
    <>
      <div className="mb-8">
        <CalculatorForm onCalculate={handleCalculate} initialValues={initialState?.inputs} />
      </div>

      {resultado && (
        <div className="space-y-6">
          <div className="flex items-center justify-end gap-2">
            <SaveButton getShareUrl={getShareUrl} calculatorId="seguro-desemprego" />
            <ShareButton getShareUrl={getShareUrl} />
          </div>
          <ResultsSummary resultado={resultado} />
          <EligibilityPanel resultado={resultado} />
        </div>
      )}
    </>
  );
}

export function SeguroDesempregoCalculatorClient() {
  return <SeguroDesempregoCalculator />;
}

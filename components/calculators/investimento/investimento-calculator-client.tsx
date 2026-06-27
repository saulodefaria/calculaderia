"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalculatorForm } from "@/components/calculators/investimento/calculator-form";
import { ProjectionDetails } from "@/components/calculators/investimento/projection-details";
import { ResultsSummary } from "@/components/calculators/investimento/results-summary";
import { SaveButton } from "@/components/ui/save-button";
import { ShareButton } from "@/components/ui/share-button";
import {
  calcularInvestimento,
  getDefaultInvestimentoInputs,
  type InvestimentoInputs,
  type InvestimentoResult,
} from "@/lib/calculators/investimento";
import { getCurrentPageBaseUrl } from "@/lib/utils";
import {
  decodeInvestimentoState,
  generateInvestimentoShareUrl,
  type InvestimentoUrlState,
  type InvestimentoUrlWarningCode,
} from "@/lib/url-state/index";

function InvestimentoCalculator() {
  const searchParams = useSearchParams();
  const initialState = useMemo(() => decodeInvestimentoState(searchParams), [searchParams]);
  const initialInputs = useMemo(() => initialState?.inputs ?? getDefaultInvestimentoInputs(), [initialState]);
  const [inputs, setInputs] = useState<InvestimentoInputs>(() => initialInputs);
  const [resultado, setResultado] = useState<InvestimentoResult>(() => calcularInvestimento(initialInputs));
  const [urlWarnings, setUrlWarnings] = useState<InvestimentoUrlWarningCode[]>(() => initialState?.warnings ?? []);

  const handleCalculate = (nextInputs: InvestimentoInputs) => {
    setInputs(nextInputs);
    setResultado(calcularInvestimento(nextInputs));
    setUrlWarnings([]);
  };

  const getShareUrl = useCallback(() => {
    const state: InvestimentoUrlState = { inputs, warnings: [] };
    return generateInvestimentoShareUrl(getCurrentPageBaseUrl(), state);
  }, [inputs]);

  return (
    <>
      <div className="mb-8">
        <CalculatorForm onCalculate={handleCalculate} initialValues={initialInputs} />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-end gap-2">
          <span data-testid="investimento-save">
            <SaveButton getShareUrl={getShareUrl} calculatorId="investimento" />
          </span>
          <span data-testid="investimento-share">
            <ShareButton getShareUrl={getShareUrl} />
          </span>
        </div>
        <ResultsSummary resultado={resultado} urlWarnings={urlWarnings} />
        <ProjectionDetails resultado={resultado} />
      </div>
    </>
  );
}

export function InvestimentoCalculatorClient() {
  return <InvestimentoCalculator />;
}

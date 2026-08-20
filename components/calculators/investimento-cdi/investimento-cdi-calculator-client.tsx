"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { BreakdownTable } from "@/components/calculators/investimento-cdi/breakdown-table";
import { CalculatorForm } from "@/components/calculators/investimento-cdi/calculator-form";
import { ComparisonTable } from "@/components/calculators/investimento-cdi/comparison-table";
import { ResultsSummary } from "@/components/calculators/investimento-cdi/results-summary";
import { SaveButton } from "@/components/ui/save-button";
import { ShareButton } from "@/components/ui/share-button";
import {
  calcularInvestimentoCdi,
  getDefaultInvestimentoCdiInputs,
  type InvestimentoCdiInputs,
  type InvestimentoCdiResultado,
} from "@/lib/calculators/investimento-cdi";
import { getCurrentPageBaseUrl } from "@/lib/utils";
import {
  decodeInvestimentoCdiState,
  generateInvestimentoCdiShareUrl,
  type InvestimentoCdiUrlState,
  type InvestimentoCdiUrlWarningCode,
} from "@/lib/url-state/index";

function InvestimentoCdiCalculator() {
  const searchParams = useSearchParams();
  const t = useTranslations("calculators.investimento-cdi.sharePrivacy");
  const initialState = useMemo(() => decodeInvestimentoCdiState(searchParams), [searchParams]);
  const initialInputs = useMemo(() => initialState?.inputs ?? getDefaultInvestimentoCdiInputs(), [initialState]);
  const [inputs, setInputs] = useState<InvestimentoCdiInputs>(() => initialInputs);
  const [resultado, setResultado] = useState<InvestimentoCdiResultado>(() => calcularInvestimentoCdi(initialInputs));
  const [urlWarnings, setUrlWarnings] = useState<InvestimentoCdiUrlWarningCode[]>(() => initialState?.warnings ?? []);

  const handleCalculate = (nextInputs: InvestimentoCdiInputs) => {
    setInputs(nextInputs);
    setResultado(calcularInvestimentoCdi(nextInputs));
    setUrlWarnings([]);
  };

  const getShareUrl = useCallback(() => {
    const state: InvestimentoCdiUrlState = { inputs, warnings: [] };
    return generateInvestimentoCdiShareUrl(getCurrentPageBaseUrl(), state);
  }, [inputs]);

  return (
    <>
      <div className="mb-8">
        <CalculatorForm
          onCalculate={handleCalculate}
          initialValues={initialInputs}
          staleSourceWarning={urlWarnings.includes("staleSourceVersion")}
        />
      </div>

      <div className="space-y-6">
        <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center">
          <p className="max-w-2xl text-sm text-muted-foreground">{t("text")}</p>
          <div className="flex items-center gap-2">
            <span data-testid="investimento-cdi-save">
              <SaveButton getShareUrl={getShareUrl} calculatorId="investimento-cdi" />
            </span>
            <span data-testid="investimento-cdi-share">
              <ShareButton getShareUrl={getShareUrl} />
            </span>
          </div>
        </div>

        <ResultsSummary resultado={resultado} urlWarnings={urlWarnings} />
        <BreakdownTable rows={resultado.breakdown} />
        <ComparisonTable rows={resultado.comparisonRows} selectedPercentualCdi={resultado.inputs.percentualCdi} />
      </div>
    </>
  );
}

export function InvestimentoCdiCalculatorClient() {
  return <InvestimentoCdiCalculator />;
}

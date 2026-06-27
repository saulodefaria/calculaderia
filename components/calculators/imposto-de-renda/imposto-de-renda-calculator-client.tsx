"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { BreakdownTable } from "@/components/calculators/imposto-de-renda/breakdown-table";
import { CalculatorForm } from "@/components/calculators/imposto-de-renda/calculator-form";
import { ResultsSummary } from "@/components/calculators/imposto-de-renda/results-summary";
import { SaveButton } from "@/components/ui/save-button";
import { ShareButton } from "@/components/ui/share-button";
import {
  calcularImpostoDeRenda,
  type ImpostoDeRendaInputs,
  type ResultadoImpostoDeRenda,
} from "@/lib/calculators/imposto-de-renda";
import { getCurrentPageBaseUrl } from "@/lib/utils";
import {
  decodeImpostoDeRendaState,
  generateImpostoDeRendaShareUrl,
  type ImpostoDeRendaUrlState,
} from "@/lib/url-state/index";

function ImpostoDeRendaCalculator() {
  const t = useTranslations("calculators.imposto-de-renda");
  const searchParams = useSearchParams();
  const initialState = useMemo(() => decodeImpostoDeRendaState(searchParams), [searchParams]);
  const hasInvalidQuery = searchParams.toString().length > 0 && !initialState;
  const [inputs, setInputs] = useState<ImpostoDeRendaInputs | null>(() => initialState?.inputs ?? null);
  const [resultado, setResultado] = useState<ResultadoImpostoDeRenda | null>(() =>
    initialState?.inputs ? calcularImpostoDeRenda(initialState.inputs) : null
  );

  const handleCalculate = (nextInputs: ImpostoDeRendaInputs) => {
    setInputs(nextInputs);
    setResultado(calcularImpostoDeRenda(nextInputs));
  };

  const getShareUrl = useCallback(() => {
    if (!inputs) return window.location.href;

    const state: ImpostoDeRendaUrlState = { inputs };
    return generateImpostoDeRendaShareUrl(getCurrentPageBaseUrl(), state);
  }, [inputs]);

  return (
    <>
      {hasInvalidQuery && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
            <span>{t("staleLink")}</span>
          </p>
        </div>
      )}

      <div className="mb-8">
        <CalculatorForm onCalculate={handleCalculate} initialValues={initialState?.inputs} />
      </div>

      {resultado && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">{t("shareWarning")}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span data-testid="imposto-de-renda-save">
                <SaveButton getShareUrl={getShareUrl} calculatorId="imposto-de-renda" />
              </span>
              <span data-testid="imposto-de-renda-share">
                <ShareButton getShareUrl={getShareUrl} />
              </span>
            </div>
          </div>
          <ResultsSummary resultado={resultado} />
          <BreakdownTable rows={resultado.breakdown} />
        </div>
      )}
    </>
  );
}

export function ImpostoDeRendaCalculatorClient() {
  return <ImpostoDeRendaCalculator />;
}

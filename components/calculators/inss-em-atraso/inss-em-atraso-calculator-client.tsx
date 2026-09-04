"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { BreakdownTable } from "@/components/calculators/inss-em-atraso/breakdown-table";
import { CalculatorForm } from "@/components/calculators/inss-em-atraso/calculator-form";
import { ResultsSummary } from "@/components/calculators/inss-em-atraso/results-summary";
import { SaveButton } from "@/components/ui/save-button";
import { ShareButton } from "@/components/ui/share-button";
import {
  calcularInssEmAtraso,
  type InssEmAtrasoInputs,
  type InssEmAtrasoWarningCode,
  type ResultadoInssEmAtraso,
} from "@/lib/calculators/inss-em-atraso";
import { getCurrentPageBaseUrl } from "@/lib/utils";
import {
  decodeInssEmAtrasoState,
  generateInssEmAtrasoShareUrl,
  type InssEmAtrasoUrlState,
} from "@/lib/url-state/index";

function calculateWithExtraWarnings(
  inputs: InssEmAtrasoInputs,
  extraWarnings: InssEmAtrasoWarningCode[] = []
): ResultadoInssEmAtraso {
  const resultado = calcularInssEmAtraso(inputs);
  if (extraWarnings.length === 0) return resultado;

  return {
    ...resultado,
    warnings: [...new Set([...extraWarnings, ...resultado.warnings])],
  };
}

function InssEmAtrasoCalculator() {
  const t = useTranslations("calculators.inss-em-atraso");
  const searchParams = useSearchParams();
  const initialState = useMemo(() => decodeInssEmAtrasoState(searchParams), [searchParams]);
  const hasInvalidQuery = searchParams.toString().length > 0 && !initialState;
  const hasStaleSourceWarning = Boolean(initialState?.warnings?.includes("fonteUrlNaoSuportada"));
  const [inputs, setInputs] = useState<InssEmAtrasoInputs | null>(() => initialState?.inputs ?? null);
  const [resultado, setResultado] = useState<ResultadoInssEmAtraso | null>(() =>
    initialState?.inputs ? calculateWithExtraWarnings(initialState.inputs, initialState.warnings) : null
  );

  const handleCalculate = (nextInputs: InssEmAtrasoInputs) => {
    setInputs(nextInputs);
    setResultado(calculateWithExtraWarnings(nextInputs));
  };

  const getShareUrl = useCallback(() => {
    if (!inputs) return window.location.href;

    const state: InssEmAtrasoUrlState = { inputs };
    return generateInssEmAtrasoShareUrl(getCurrentPageBaseUrl(), state);
  }, [inputs]);

  return (
    <>
      {(hasInvalidQuery || hasStaleSourceWarning) && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
            <span>{hasInvalidQuery ? t("invalidLink") : t("staleLink")}</span>
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
              <span data-testid="inss-em-atraso-save">
                <SaveButton getShareUrl={getShareUrl} calculatorId="inss-em-atraso" />
              </span>
              <span data-testid="inss-em-atraso-share">
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

export function InssEmAtrasoCalculatorClient() {
  return <InssEmAtrasoCalculator />;
}

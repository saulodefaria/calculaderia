"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { BreakdownTable } from "@/components/calculators/cdb/breakdown-table";
import { CalculatorForm } from "@/components/calculators/cdb/calculator-form";
import { ResultsSummary } from "@/components/calculators/cdb/results-summary";
import { SaveButton } from "@/components/ui/save-button";
import { ShareButton } from "@/components/ui/share-button";
import { calcularCdb, type CdbInputs, type CdbResultado } from "@/lib/calculators/cdb";
import { getCurrentPageBaseUrl } from "@/lib/utils";
import { decodeCdbState, generateCdbShareUrl, type CdbUrlState } from "@/lib/url-state/index";

function CdbCalculator() {
  const searchParams = useSearchParams();
  const t = useTranslations("calculators.cdb.sharePrivacy");
  const initialState = useMemo(() => decodeCdbState(searchParams), [searchParams]);
  const staleSourceWarning = initialState?.warnings.includes("staleSourceVersion") ?? false;
  const [inputs, setInputs] = useState<CdbInputs | null>(() => initialState?.inputs ?? null);
  const [resultado, setResultado] = useState<CdbResultado | null>(() =>
    initialState?.inputs ? calcularCdb(initialState.inputs) : null
  );

  const handleCalculate = (nextInputs: CdbInputs) => {
    setInputs(nextInputs);
    setResultado(calcularCdb(nextInputs));
  };

  const getShareUrl = useCallback(() => {
    if (!inputs) return window.location.href;

    const state: CdbUrlState = { inputs, warnings: [] };
    return generateCdbShareUrl(getCurrentPageBaseUrl(), state);
  }, [inputs]);

  return (
    <>
      <div className="mb-8">
        <CalculatorForm
          onCalculate={handleCalculate}
          initialValues={initialState?.inputs}
          staleSourceWarning={staleSourceWarning}
        />
      </div>

      {resultado && (
        <div className="space-y-6">
          <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center">
            <p className="max-w-2xl text-sm text-muted-foreground">{t("text")}</p>
            <div className="flex items-center gap-2">
              <span data-testid="cdb-save">
                <SaveButton getShareUrl={getShareUrl} calculatorId="cdb" />
              </span>
              <span data-testid="cdb-share">
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

export function CdbCalculatorClient() {
  return <CdbCalculator />;
}

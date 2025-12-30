"use client";

import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { ShareButton } from "@/components/ui/share-button";
import { CalculatorForm } from "@/components/calculators/tir/calculator-form";
import { ResultsSummary } from "@/components/calculators/tir/results-summary";
import { calcularTir, type PeriodoTir, type ResultadoTir } from "@/lib/calculators/tir";
import { getCurrentPageBaseUrl } from "@/lib/utils";
import { decodeTirState, generateTirShareUrl, type TirUrlState } from "@/lib/url-state/index";

export function TirCalculatorClient() {
  const searchParams = useSearchParams();
  const t = useTranslations("calculators.tir");

  // Decode URL params once on mount
  const initialState = useMemo(() => {
    return decodeTirState(searchParams);
  }, [searchParams]);

  // State
  const [cashflows, setCashflows] = useState<number[]>(() => initialState?.cashflows ?? []);
  const [periodo, setPeriodo] = useState<PeriodoTir>(() => initialState?.periodo ?? "mensal");
  const [resultado, setResultado] = useState<ResultadoTir | null>(() => {
    if (initialState?.cashflows && initialState.cashflows.length >= 2) {
      return calcularTir({
        cashflows: initialState.cashflows,
        periodo: initialState.periodo,
      });
    }
    return null;
  });

  const handleCalculate = (newCashflows: number[], newPeriodo: PeriodoTir) => {
    setCashflows(newCashflows);
    setPeriodo(newPeriodo);
    const result = calcularTir({
      cashflows: newCashflows,
      periodo: newPeriodo,
    });
    setResultado(result);
  };

  // Generate share URL with current state
  const getShareUrl = useCallback(() => {
    if (cashflows.length === 0) return window.location.href;

    const state: TirUrlState = {
      cashflows,
      periodo,
    };

    return generateTirShareUrl(getCurrentPageBaseUrl(), state);
  }, [cashflows, periodo]);

  return (
    <>
      {/* Calculator Form */}
      <div className="mb-8">
        <CalculatorForm
          onCalculate={handleCalculate}
          initialCashflows={initialState?.cashflows}
          initialPeriodo={initialState?.periodo}
        />
      </div>

      {/* Results Section */}
      {resultado && (
        <div className="space-y-6">
          {/* Share button */}
          <div className="flex justify-end">
            <ShareButton getShareUrl={getShareUrl} />
          </div>

          {/* Error state */}
          {resultado.erroCode ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-destructive shrink-0" />
                <div>
                  <h3 className="font-semibold text-destructive">{t("error.title")}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {resultado.erroCode ? t(`errors.${resultado.erroCode}`) : t("error.generic")}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <ResultsSummary resultado={resultado} periodo={periodo} />
          )}
        </div>
      )}
    </>
  );
}

"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CalculatorForm } from "./calculator-form";
import { ResultsSummary } from "./results-summary";
import { YearlyBreakdownTable } from "./yearly-breakdown-table";
import { SaveButton } from "@/components/ui/save-button";
import { ShareButton } from "@/components/ui/share-button";
import {
  CORRECAO_IGPM_LATEST_MONTH,
  calcularCorrecaoIgpm,
  getDefaultCorrecaoIgpmInputs,
  type CorrecaoIgpmInputs,
} from "@/lib/calculators/correcao-igpm";
import {
  decodeCorrecaoIgpmState,
  generateCorrecaoIgpmShareUrl,
  type CorrecaoIgpmUrlWarningCode,
} from "@/lib/url-state/index";
import { getCurrentPageBaseUrl } from "@/lib/utils/index";

export function CorrecaoIgpmCalculatorClient() {
  const searchParams = useSearchParams();
  const t = useTranslations("calculators.correcao-igpm.sharePrivacy");
  const initialState = useMemo(() => decodeCorrecaoIgpmState(searchParams), [searchParams]);
  const initialInputs = useMemo(() => initialState?.inputs ?? getDefaultCorrecaoIgpmInputs(), [initialState]);
  const [inputs, setInputs] = useState<CorrecaoIgpmInputs>(() => initialInputs);
  const [warnings, setWarnings] = useState<CorrecaoIgpmUrlWarningCode[]>(() => initialState?.warnings ?? []);
  const result = useMemo(() => calcularCorrecaoIgpm(inputs), [inputs]);

  const updateInputs = (nextInputs: CorrecaoIgpmInputs) => {
    setInputs(nextInputs);
    setWarnings([]);
  };

  const reset = () => updateInputs(getDefaultCorrecaoIgpmInputs());
  const useLatest = () => updateInputs({ ...inputs, mesFinal: CORRECAO_IGPM_LATEST_MONTH });
  const getShareUrl = useCallback(
    () => generateCorrecaoIgpmShareUrl(getCurrentPageBaseUrl(), { inputs }),
    [inputs]
  );

  return (
    <>
      <div className="mb-8">
        <CalculatorForm
          key={`${inputs.valorOriginal}-${inputs.mesInicial}-${inputs.mesFinal}`}
          initialValues={inputs}
          urlWarnings={warnings}
          onCalculate={updateInputs}
          onReset={reset}
        />
      </div>
      <div className="space-y-6">
        <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center">
          <p className="max-w-2xl text-sm text-muted-foreground">{t("text")}</p>
          <div className="flex items-center gap-2">
            <SaveButton getShareUrl={getShareUrl} calculatorId="correcao-igpm" />
            <ShareButton getShareUrl={getShareUrl} />
          </div>
        </div>
        <ResultsSummary result={result} onUseLatest={useLatest} />
        <YearlyBreakdownTable rows={result.resumoAnual} />
      </div>
    </>
  );
}

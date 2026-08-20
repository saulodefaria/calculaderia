"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalculatorForm } from "./calculator-form";
import { ProjectionTable } from "./projection-table";
import { ResultsSummary } from "./results-summary";
import { SaveButton } from "@/components/ui/save-button";
import { ShareButton } from "@/components/ui/share-button";
import {
  calcularFinanciarOuJuntarDinheiro,
  getDefaultFinanciarOuJuntarDinheiroInputs,
  type FinanciarOuJuntarDinheiroInputs,
} from "@/lib/calculators/financiar-ou-juntar-dinheiro";
import {
  decodeFinanciarOuJuntarDinheiroState,
  generateFinanciarOuJuntarDinheiroShareUrl,
} from "@/lib/url-state";
import { getCurrentPageBaseUrl } from "@/lib/utils";

function Calculator({
  initialInputs,
  invalidUrl,
}: {
  initialInputs: FinanciarOuJuntarDinheiroInputs;
  invalidUrl: boolean;
}) {
  const [inputs, setInputs] = useState<FinanciarOuJuntarDinheiroInputs>(() => initialInputs);
  const [resultado, setResultado] = useState(() => calcularFinanciarOuJuntarDinheiro(initialInputs));
  const [showInvalidUrl, setShowInvalidUrl] = useState(invalidUrl);

  const handleCalculate = (nextInputs: FinanciarOuJuntarDinheiroInputs) => {
    setInputs(nextInputs);
    setResultado(calcularFinanciarOuJuntarDinheiro(nextInputs));
    setShowInvalidUrl(false);
  };

  const getShareUrl = useCallback(
    () => generateFinanciarOuJuntarDinheiroShareUrl(getCurrentPageBaseUrl(), { inputs }),
    [inputs]
  );

  return (
    <div className="space-y-8">
      <CalculatorForm initialValues={initialInputs} onCalculate={handleCalculate} />
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span data-testid="financiar-save">
            <SaveButton getShareUrl={getShareUrl} calculatorId="financiar-ou-juntar-dinheiro" />
          </span>
          <span data-testid="financiar-share">
            <ShareButton getShareUrl={getShareUrl} />
          </span>
        </div>
        <ResultsSummary resultado={resultado} invalidUrl={showInvalidUrl} />
        <ProjectionTable
          rows={resultado.waitForCash.linhaDoTempo}
          crossingMonth={resultado.waitForCash.primeiroMesAcessivel}
          horizonMonth={inputs.horizonteMeses}
        />
      </div>
    </div>
  );
}

export function FinanciarOuJuntarDinheiroCalculatorClient() {
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const decodedState = useMemo(() => decodeFinanciarOuJuntarDinheiroState(searchParams), [searchParams]);
  const invalidUrl = searchKey.length > 0 && decodedState === null;
  const initialInputs = useMemo(
    () => decodedState?.inputs ?? getDefaultFinanciarOuJuntarDinheiroInputs(),
    [decodedState]
  );

  // A query-string navigation (including browser back/forward) remounts the
  // controlled form and derived result atomically from that exact URL state.
  return <Calculator key={searchKey} initialInputs={initialInputs} invalidUrl={invalidUrl} />;
}

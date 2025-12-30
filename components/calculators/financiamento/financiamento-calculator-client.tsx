"use client";

import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CalculatorForm } from "@/components/calculators/financiamento/calculator-form";
import { ResultsSummary } from "@/components/calculators/financiamento/results-summary";
import { AmortizationTable } from "@/components/calculators/financiamento/amortization-table";
import { ShareButton } from "@/components/ui/share-button";
import { SaveButton } from "@/components/ui/save-button";
import {
  calcularFinanciamento,
  recalcularComAmortizacoes,
  type InputsFinanciamento,
  type ResultadoFinanciamento,
  type ResultadoComAdicionais,
  type MetodoAmortizacao,
  type AmortizacaoAdicional,
  type TipoAmortizacaoAdicional,
} from "@/lib/calculators/financiamento";
import { getCurrentPageBaseUrl } from "@/lib/utils";
import {
  decodeFinanciamentoState,
  generateFinanciamentoShareUrl,
  type FinanciamentoUrlState,
} from "@/lib/url-state/index";

function FinanciamentoCalculator() {
  const searchParams = useSearchParams();
  const t = useTranslations("calculators.financiamento");

  // Decode URL params once on mount - memoized to avoid recalculation
  const initialState = useMemo(() => {
    return decodeFinanciamentoState(searchParams);
  }, [searchParams]);

  // Initialize state from URL params if present
  const [inputs, setInputs] = useState<InputsFinanciamento | null>(() => initialState?.inputs ?? null);
  const [metodo, setMetodo] = useState<MetodoAmortizacao>(() => initialState?.metodo ?? "sac");
  const [resultado, setResultado] = useState<ResultadoFinanciamento | null>(() => {
    if (initialState?.inputs) {
      return calcularFinanciamento(initialState.inputs, initialState.metodo);
    }
    return null;
  });
  const [amortizacoesAdicionais, setAmortizacoesAdicionais] = useState<AmortizacaoAdicional[]>(
    () => initialState?.amortizacoesAdicionais ?? []
  );

  // Calculate result with additional amortizations
  const resultadoComAdicionais: ResultadoComAdicionais | null = useMemo(() => {
    if (!inputs || amortizacoesAdicionais.length === 0) return null;
    const hasValidAmortization = amortizacoesAdicionais.some((a) => a.valor > 0);
    if (!hasValidAmortization) return null;
    return recalcularComAmortizacoes(inputs, metodo, amortizacoesAdicionais);
  }, [inputs, metodo, amortizacoesAdicionais]);

  const handleCalculate = (newInputs: InputsFinanciamento, newMetodo: MetodoAmortizacao) => {
    setInputs(newInputs);
    setMetodo(newMetodo);
    setAmortizacoesAdicionais([]); // Reset additional amortizations when recalculating
    const result = calcularFinanciamento(newInputs, newMetodo);
    setResultado(result);
  };

  const handleAmortizacaoChange = useCallback((mes: number, valor: number, tipo: TipoAmortizacaoAdicional) => {
    setAmortizacoesAdicionais((prev) => {
      const existing = prev.find((a) => a.mes === mes);
      if (existing) {
        if (valor === 0) {
          return prev.filter((a) => a.mes !== mes);
        }
        return prev.map((a) => (a.mes === mes ? { ...a, valor, tipo } : a));
      }
      if (valor > 0) {
        return [...prev, { mes, valor, tipo }];
      }
      return prev;
    });
  }, []);

  // Generate share URL with current state
  const getShareUrl = useCallback(() => {
    if (!inputs) return window.location.href;

    const state: FinanciamentoUrlState = {
      inputs,
      metodo,
      amortizacoesAdicionais,
    };

    return generateFinanciamentoShareUrl(getCurrentPageBaseUrl(), state);
  }, [inputs, metodo, amortizacoesAdicionais]);

  return (
    <>
      {/* Calculator Form */}
      <div className="mb-8">
        <CalculatorForm
          onCalculate={handleCalculate}
          initialValues={initialState?.inputs}
          initialMetodo={initialState?.metodo}
        />
      </div>

      {/* Results Section */}
      {resultado && (
        <div className="space-y-6">
          <div className="flex items-center justify-end gap-2">
            <SaveButton getShareUrl={getShareUrl} calculatorId="financiamento" />
            <ShareButton getShareUrl={getShareUrl} />
          </div>
          <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
            {metodo === "price" ? (
              <>
                <strong>{t("method.priceLabel")}:</strong> {t("priceExplanation")}
              </>
            ) : (
              <>
                <strong>{t("method.sacLabel")}:</strong> {t("sacExplanation")}
              </>
            )}
          </div>
          <ResultsSummary resultado={resultado} resultadoComAdicionais={resultadoComAdicionais} />
          <AmortizationTable
            parcelas={resultadoComAdicionais?.parcelas ?? resultado.parcelas}
            amortizacoesAdicionais={amortizacoesAdicionais}
            onAmortizacaoChange={handleAmortizacaoChange}
            inputs={inputs}
          />
        </div>
      )}
    </>
  );
}

export function FinanciamentoCalculatorClient() {
  return <FinanciamentoCalculator />;
}

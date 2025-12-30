"use client";

import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { CalculatorForm } from "@/components/calculators/consorcio/calculator-form";
import { ResultsSummary } from "@/components/calculators/consorcio/results-summary";
import { ParcelasTable } from "@/components/calculators/consorcio/parcelas-table";
import { ShareButton } from "@/components/ui/share-button";
import { SaveButton } from "@/components/ui/save-button";
import {
  calcularConsorcio,
  recalcularConsorcioComAmortizacoes,
  type InputsConsorcio,
  type ResultadoConsorcio,
  type ResultadoConsorcioComAdicionais,
  type AmortizacaoAdicionalConsorcio,
  type TipoAmortizacaoAdicional,
} from "@/lib/calculators/consorcio";
import { getCurrentPageBaseUrl } from "@/lib/utils";
import { decodeConsorcioState, generateConsorcioShareUrl, type ConsorcioUrlState } from "@/lib/url-state/index";

export function ConsorcioCalculator() {
  const searchParams = useSearchParams();

  // Decode URL params once on mount - memoized to avoid recalculation
  const initialState = useMemo(() => {
    return decodeConsorcioState(searchParams);
  }, [searchParams]);

  // Initialize state from URL params if present
  const [inputs, setInputs] = useState<InputsConsorcio | null>(() => initialState?.inputs ?? null);
  const [resultado, setResultado] = useState<ResultadoConsorcio | null>(() => {
    if (initialState?.inputs) {
      return calcularConsorcio(initialState.inputs);
    }
    return null;
  });
  const [amortizacoesAdicionais, setAmortizacoesAdicionais] = useState<AmortizacaoAdicionalConsorcio[]>(
    () => initialState?.amortizacoesAdicionais ?? []
  );

  // Calculate result with additional amortizations
  const resultadoComAdicionais: ResultadoConsorcioComAdicionais | null = useMemo(() => {
    if (!inputs || amortizacoesAdicionais.length === 0) return null;
    const hasValidAmortization = amortizacoesAdicionais.some((a) => a.valor > 0);
    if (!hasValidAmortization) return null;
    return recalcularConsorcioComAmortizacoes(inputs, amortizacoesAdicionais);
  }, [inputs, amortizacoesAdicionais]);

  const handleCalculate = (newInputs: InputsConsorcio) => {
    setInputs(newInputs);
    setAmortizacoesAdicionais([]); // Reset additional amortizations when recalculating
    const result = calcularConsorcio(newInputs);
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

    const state: ConsorcioUrlState = {
      inputs,
      amortizacoesAdicionais,
    };

    return generateConsorcioShareUrl(getCurrentPageBaseUrl(), state);
  }, [inputs, amortizacoesAdicionais]);

  return (
    <>
      {/* Calculator Form */}
      <div className="mb-8">
        <CalculatorForm onCalculate={handleCalculate} initialValues={initialState?.inputs} />
      </div>

      {/* Results Section */}
      {resultado && (
        <div className="space-y-6">
          <div className="flex items-center justify-end gap-2">
            <SaveButton getShareUrl={getShareUrl} calculatorId="consorcio" />
            <ShareButton getShareUrl={getShareUrl} />
          </div>
          <ResultsSummary resultado={resultado} resultadoComAdicionais={resultadoComAdicionais} inputs={inputs} />
          <ParcelasTable
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

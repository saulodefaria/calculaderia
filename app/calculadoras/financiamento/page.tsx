"use client";

import { Suspense, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalculatorForm } from "@/components/calculators/financiamento/calculator-form";
import { ResultsSummary } from "@/components/calculators/financiamento/results-summary";
import { AmortizationTable } from "@/components/calculators/financiamento/amortization-table";
import { ShareButton } from "@/components/ui/share-button";
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
import {
  decodeFinanciamentoState,
  generateFinanciamentoShareUrl,
  type FinanciamentoUrlState,
} from "@/lib/url-state/index";

function FinanciamentoCalculator() {
  const searchParams = useSearchParams();

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

    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    return generateFinanciamentoShareUrl(baseUrl, state);
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
          <div className="flex items-center justify-end">
            <ShareButton getShareUrl={getShareUrl} />
          </div>
          <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
            {metodo === "price" ? (
              <>
                <strong>Tabela PRICE:</strong> Sistema de amortização com parcelas fixas. Os juros são maiores no início
                e diminuem ao longo do tempo, enquanto a amortização aumenta.
              </>
            ) : (
              <>
                <strong>Sistema SAC:</strong> Sistema de Amortização Constante. A amortização é fixa e as parcelas
                diminuem ao longo do tempo, pois os juros são calculados sobre o saldo devedor decrescente.
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

function CalculatorSkeleton() {
  return (
    <div className="mb-8 animate-pulse">
      <div className="rounded-lg border bg-card p-6">
        <div className="h-6 w-48 bg-muted rounded mb-6" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
            </div>
          ))}
        </div>
        <div className="h-10 bg-muted rounded mt-4" />
      </div>
    </div>
  );
}

export default function FinanciamentoPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Voltar para início
          </Link>
        </Button>
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Calculadora de Financiamento</h1>
        <p className="text-muted-foreground">
          Simule seu financiamento usando os sistemas SAC ou PRICE. Visualize a tabela de amortização completa com todas
          as parcelas.
        </p>
      </div>

      {/* Wrap calculator in Suspense for useSearchParams */}
      <Suspense fallback={<CalculatorSkeleton />}>
        <FinanciamentoCalculator />
      </Suspense>
    </div>
  );
}

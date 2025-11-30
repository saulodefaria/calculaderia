"use client";

import { useState, useCallback, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CalculatorForm } from "@/components/calculators/financiamento/calculator-form";
import { ResultsSummary } from "@/components/calculators/financiamento/results-summary";
import { AmortizationTable } from "@/components/calculators/financiamento/amortization-table";
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

export default function FinanciamentoPage() {
  const [inputs, setInputs] = useState<InputsFinanciamento | null>(null);
  const [metodo, setMetodo] = useState<MetodoAmortizacao>("sac");
  const [resultado, setResultado] = useState<ResultadoFinanciamento | null>(null);
  const [amortizacoesAdicionais, setAmortizacoesAdicionais] = useState<AmortizacaoAdicional[]>([]);

  // Calculate result with additional amortizations
  const resultadoComAdicionais: ResultadoComAdicionais | null = useMemo(() => {
    if (!inputs || amortizacoesAdicionais.length === 0) return null;
    const hasValidAmortization = amortizacoesAdicionais.some((a) => a.valor > 0);
    if (!hasValidAmortization) return null;
    return recalcularComAmortizacoes(inputs, metodo, amortizacoesAdicionais);
  }, [inputs, metodo, amortizacoesAdicionais]);

  const handleCalculate = (newInputs: InputsFinanciamento) => {
    setInputs(newInputs);
    setAmortizacoesAdicionais([]); // Reset additional amortizations when recalculating
    const result = calcularFinanciamento(newInputs, metodo);
    setResultado(result);
  };

  const handleMetodoChange = (newMetodo: string) => {
    const method = newMetodo as MetodoAmortizacao;
    setMetodo(method);
    // Keep amortizacoesAdicionais when changing method - recalculation happens via useMemo
    if (inputs) {
      const result = calcularFinanciamento(inputs, method);
      setResultado(result);
    }
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

      {/* Calculator Form */}
      <div className="mb-8">
        <CalculatorForm onCalculate={handleCalculate} />
      </div>

      {/* Results Section */}
      {resultado && (
        <div className="space-y-6">
          {/* Method Tabs */}
          <Tabs value={metodo} onValueChange={handleMetodoChange}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="sac">Sistema SAC</TabsTrigger>
              <TabsTrigger value="price">Tabela PRICE</TabsTrigger>
            </TabsList>
            <TabsContent value="price" className="mt-6 space-y-6">
              <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                <strong>Tabela PRICE:</strong> Sistema de amortização com parcelas fixas. Os juros são maiores no início
                e diminuem ao longo do tempo, enquanto a amortização aumenta.
              </div>
              <ResultsSummary resultado={resultado} resultadoComAdicionais={resultadoComAdicionais} />
              <AmortizationTable
                parcelas={resultadoComAdicionais?.parcelas ?? resultado.parcelas}
                amortizacoesAdicionais={amortizacoesAdicionais}
                onAmortizacaoChange={handleAmortizacaoChange}
              />
            </TabsContent>
            <TabsContent value="sac" className="mt-6 space-y-6">
              <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                <strong>Sistema SAC:</strong> Sistema de Amortização Constante. A amortização é fixa e as parcelas
                diminuem ao longo do tempo, pois os juros são calculados sobre o saldo devedor decrescente.
              </div>
              <ResultsSummary resultado={resultado} resultadoComAdicionais={resultadoComAdicionais} />
              <AmortizationTable
                parcelas={resultadoComAdicionais?.parcelas ?? resultado.parcelas}
                amortizacoesAdicionais={amortizacoesAdicionais}
                onAmortizacaoChange={handleAmortizacaoChange}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

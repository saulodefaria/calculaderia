"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InputsFinanciamento } from "@/lib/calculators/financiamento";

interface CalculatorFormProps {
  onCalculate: (inputs: InputsFinanciamento) => void;
}

export function CalculatorForm({ onCalculate }: CalculatorFormProps) {
  const valorEmprestimoRef = useRef<HTMLInputElement>(null);
  const valorEntradaRef = useRef<HTMLInputElement>(null);
  const taxaJurosAnualRef = useRef<HTMLInputElement>(null);
  const mesesRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const inputs: InputsFinanciamento = {
      valorEmprestimo: parseFloat((valorEmprestimoRef.current?.value || "").replace(",", ".")) || 0,
      valorEntrada: parseFloat((valorEntradaRef.current?.value || "").replace(",", ".")) || 0,
      taxaJurosAnual: parseFloat((taxaJurosAnualRef.current?.value || "").replace(",", ".")) || 0,
      meses: parseInt(mesesRef.current?.value || "") || 0,
    };

    if (inputs.valorEmprestimo <= 0 || inputs.taxaJurosAnual <= 0 || inputs.meses <= 0) {
      return;
    }

    if (inputs.valorEntrada >= inputs.valorEmprestimo) {
      return;
    }

    onCalculate(inputs);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Dados do Financiamento</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="valorEmprestimo">Valor do Empréstimo (R$)</Label>
              <Input
                id="valorEmprestimo"
                ref={valorEmprestimoRef}
                type="text"
                inputMode="decimal"
                placeholder="Ex: 500000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorEntrada">Valor da Entrada (R$)</Label>
              <Input id="valorEntrada" ref={valorEntradaRef} type="text" inputMode="decimal" placeholder="Ex: 100000" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxaJurosAnual">Taxa de Juros Anual (%)</Label>
              <Input
                id="taxaJurosAnual"
                ref={taxaJurosAnualRef}
                type="text"
                inputMode="decimal"
                placeholder="Ex: 12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meses">Prazo (meses)</Label>
              <Input
                id="meses"
                ref={mesesRef}
                type="number"
                inputMode="numeric"
                placeholder="Ex: 360"
                min={1}
                max={600}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
            Calcular Financiamento
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

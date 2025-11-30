"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InputsFinanciamento } from "@/lib/calculators/financiamento";

interface CalculatorFormProps {
  onCalculate: (inputs: InputsFinanciamento) => void;
  /** Optional initial values to pre-fill the form */
  initialValues?: InputsFinanciamento | null;
}

function formatCurrencyInput(value: string): string {
  // Remove tudo exceto dígitos
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";

  // Converte para número (centavos)
  const number = parseInt(digits, 10);

  // Formata como moeda brasileira
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number / 100);
}

function formatCurrencyFromNumber(value: number): string {
  if (!value || value <= 0) return "";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function parseCurrencyValue(formatted: string): number {
  if (!formatted) return 0;
  // Remove pontos de milhar e substitui vírgula por ponto
  const cleaned = formatted.replace(/\./g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

function formatPercentInput(value: string): string {
  // Permite apenas dígitos e vírgula/ponto
  const cleaned = value.replace(/[^\d,]/g, "");
  // Permite apenas uma vírgula
  const parts = cleaned.split(",");
  if (parts.length > 2) {
    return parts[0] + "," + parts.slice(1).join("");
  }
  return cleaned;
}

function formatPercentFromNumber(value: number): string {
  if (!value || value <= 0) return "";
  // Format with comma as decimal separator for pt-BR
  return value.toString().replace(".", ",");
}

function parsePercentValue(formatted: string): number {
  if (!formatted) return 0;
  const cleaned = formatted.replace(",", ".");
  return parseFloat(cleaned) || 0;
}

export function CalculatorForm({ onCalculate, initialValues }: CalculatorFormProps) {
  // Initialize state from initialValues prop (used when loading from URL params)
  const [valorEmprestimo, setValorEmprestimo] = useState(() =>
    initialValues ? formatCurrencyFromNumber(initialValues.valorEmprestimo) : ""
  );
  const [valorEntrada, setValorEntrada] = useState(() =>
    initialValues ? formatCurrencyFromNumber(initialValues.valorEntrada) : ""
  );
  const [taxaJurosAnual, setTaxaJurosAnual] = useState(() =>
    initialValues ? formatPercentFromNumber(initialValues.taxaJurosAnual) : ""
  );
  const [meses, setMeses] = useState(() =>
    initialValues && initialValues.meses > 0 ? initialValues.meses.toString() : ""
  );

  const handleCurrencyChange = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setter(formatCurrencyInput(value));
  };

  const handlePercentChange = (value: string) => {
    setTaxaJurosAnual(formatPercentInput(value));
  };

  const handleMesesChange = (value: string) => {
    // Permite apenas dígitos
    const digits = value.replace(/\D/g, "");
    setMeses(digits);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const inputs: InputsFinanciamento = {
      valorEmprestimo: parseCurrencyValue(valorEmprestimo),
      valorEntrada: parseCurrencyValue(valorEntrada),
      taxaJurosAnual: parsePercentValue(taxaJurosAnual),
      meses: parseInt(meses) || 0,
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
              <Label htmlFor="valorEmprestimo">Valor do Empréstimo</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                <Input
                  id="valorEmprestimo"
                  type="text"
                  inputMode="numeric"
                  placeholder="0,00"
                  value={valorEmprestimo}
                  onChange={(e) => handleCurrencyChange(e.target.value, setValorEmprestimo)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorEntrada">Valor da Entrada</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                <Input
                  id="valorEntrada"
                  type="text"
                  inputMode="numeric"
                  placeholder="0,00"
                  value={valorEntrada}
                  onChange={(e) => handleCurrencyChange(e.target.value, setValorEntrada)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxaJurosAnual">Taxa de Juros Anual</Label>
              <div className="relative">
                <Input
                  id="taxaJurosAnual"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={taxaJurosAnual}
                  onChange={(e) => handlePercentChange(e.target.value)}
                  className="pr-8"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meses">Prazo</Label>
              <div className="relative">
                <Input
                  id="meses"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={meses}
                  onChange={(e) => handleMesesChange(e.target.value)}
                  className="pr-16"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">meses</span>
              </div>
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

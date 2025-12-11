"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { InputsFinanciamento } from "@/lib/calculators/financiamento";
import {
  formatCurrencyFromNumber,
  formatCurrencyInput,
  formatPercentFromNumber,
  formatPercentInput,
  parseCurrencyValue,
  parsePercentValue,
} from "@/lib/utils/index";

interface CalculatorFormProps {
  onCalculate: (inputs: InputsFinanciamento) => void;
  /** Optional initial values to pre-fill the form */
  initialValues?: InputsFinanciamento | null;
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
  const [correcaoAnualImovel, setCorrecaoAnualImovel] = useState(() => {
    if (initialValues && typeof initialValues.correcaoAnualImovel === "number") {
      return formatPercentFromNumber(initialValues.correcaoAnualImovel);
    }
    return "6";
  });

  const handleCurrencyChange = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setter(formatCurrencyInput(value));
  };

  const handlePercentChange = (value: string) => {
    setTaxaJurosAnual(formatPercentInput(value));
  };

  const handleCorrecaoAnualImovelChange = (value: string) => {
    setCorrecaoAnualImovel(formatPercentInput(value));
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
      correcaoAnualImovel: parsePercentValue(correcaoAnualImovel),
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
    <TooltipProvider>
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

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="correcaoAnualImovel">Valorização Anual do Imóvel</Label>
                  <Tooltip delayDuration={120}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                        <Info className="h-4 w-4" />
                        <span className="sr-only">Informações sobre valorização do imóvel</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-center">
                      <p>
                        Estimativa de valorização anual do imóvel (ex.: 6% ao ano). Esse valor não altera as parcelas,
                        apenas é usado para calcular a TIR, comparando o que você paga com o valor futuro estimado do
                        imóvel.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <Input
                    id="correcaoAnualImovel"
                    type="text"
                    inputMode="decimal"
                    placeholder="6,00"
                    value={correcaoAnualImovel}
                    onChange={(e) => handleCorrecaoAnualImovelChange(e.target.value)}
                    className="pr-8"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
              Calcular Financiamento
            </Button>
          </form>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

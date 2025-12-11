"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { InputsConsorcio } from "@/lib/calculators/consorcio";
import {
  formatCurrencyFromNumber,
  formatCurrencyInput,
  formatPercentFromNumber,
  formatPercentInput,
  parseCurrencyValue,
  parsePercentValue,
} from "@/lib/utils/index";

interface CalculatorFormProps {
  onCalculate: (inputs: InputsConsorcio) => void;
  /** Optional initial values to pre-fill the form */
  initialValues?: InputsConsorcio | null;
}

export function CalculatorForm({ onCalculate, initialValues }: CalculatorFormProps) {
  // Initialize state from initialValues prop (used when loading from URL params)
  const [valorBem, setValorBem] = useState(() =>
    initialValues ? formatCurrencyFromNumber(initialValues.valorBem) : ""
  );
  const [meses, setMeses] = useState(() =>
    initialValues && initialValues.meses > 0 ? initialValues.meses.toString() : ""
  );
  const [taxaAdministracaoTotal, setTaxaAdministracaoTotal] = useState(() =>
    initialValues ? formatPercentFromNumber(initialValues.taxaAdministracaoTotal) : ""
  );
  const [correcaoAnual, setCorrecaoAnual] = useState(() =>
    initialValues ? formatPercentFromNumber(initialValues.correcaoAnual) : "6"
  );

  const handleCurrencyChange = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setter(formatCurrencyInput(value));
  };

  const handlePercentChange = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setter(formatPercentInput(value));
  };

  const handleMesesChange = (value: string) => {
    // Permite apenas dígitos
    const digits = value.replace(/\D/g, "");
    setMeses(digits);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const inputs: InputsConsorcio = {
      valorBem: parseCurrencyValue(valorBem),
      meses: parseInt(meses) || 0,
      taxaAdministracaoTotal: parsePercentValue(taxaAdministracaoTotal),
      correcaoAnual: parsePercentValue(correcaoAnual),
    };

    if (inputs.valorBem <= 0 || inputs.meses <= 0 || inputs.taxaAdministracaoTotal <= 0) {
      return;
    }

    onCalculate(inputs);
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados do Consórcio</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="valorBem">Valor do Bem</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    id="valorBem"
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={valorBem}
                    onChange={(e) => handleCurrencyChange(e.target.value, setValorBem)}
                    className="pl-10"
                    required
                  />
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
                <Label htmlFor="taxaAdministracaoTotal">Taxa de Administração Total</Label>
                <div className="relative">
                  <Input
                    id="taxaAdministracaoTotal"
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={taxaAdministracaoTotal}
                    onChange={(e) => handlePercentChange(e.target.value, setTaxaAdministracaoTotal)}
                    className="pr-8"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="correcaoAnual">Correção Anual</Label>
                  <Tooltip delayDuration={120}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                        <Info className="h-4 w-4" />
                        <span className="sr-only">Informações sobre correção anual</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-center">
                      <p>
                        As parcelas do consórcio são corrigidas anualmente por um índice como INCC (imóveis) ou IPCA. O
                        valor padrão de 6% é uma estimativa. Consulte seu contrato para o índice exato.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <Input
                    id="correcaoAnual"
                    type="text"
                    inputMode="decimal"
                    placeholder="6,00"
                    value={correcaoAnual}
                    onChange={(e) => handlePercentChange(e.target.value, setCorrecaoAnual)}
                    className="pr-8"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
              Calcular Consórcio
            </Button>
          </form>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

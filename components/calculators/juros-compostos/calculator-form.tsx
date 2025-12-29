"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { InputsJurosCompostos, PeriodoJurosCompostos } from "@/lib/calculators/juros-compostos";
import { PERIODO_JUROS_COMPOSTOS_LABELS } from "@/lib/calculators/juros-compostos";
import {
  formatCurrencyFromNumber,
  formatCurrencyInput,
  formatPercentFromNumber,
  formatPercentInput,
  parseCurrencyValue,
  parsePercentValue,
} from "@/lib/utils/index";

interface CalculatorFormProps {
  onCalculate: (inputs: InputsJurosCompostos) => void;
  /** Optional initial values to pre-fill the form */
  initialValues?: InputsJurosCompostos | null;
}

export function CalculatorForm({ onCalculate, initialValues }: CalculatorFormProps) {
  // Initialize state from initialValues prop (used when loading from URL params)
  const [valorInicial, setValorInicial] = useState(() =>
    initialValues ? formatCurrencyFromNumber(initialValues.valorInicial) : ""
  );
  const [taxaJuros, setTaxaJuros] = useState(() =>
    initialValues ? formatPercentFromNumber(initialValues.taxaJuros) : ""
  );
  const [periodo, setPeriodo] = useState<PeriodoJurosCompostos>(initialValues?.periodo ?? "mensal");
  const [aportes, setAportes] = useState(() =>
    initialValues && initialValues.aportes > 0 ? formatCurrencyFromNumber(initialValues.aportes) : ""
  );
  const [quantidadePeriodos, setQuantidadePeriodos] = useState(() =>
    initialValues && initialValues.quantidadePeriodos > 0 ? initialValues.quantidadePeriodos.toString() : ""
  );

  const handleCurrencyChange = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setter(formatCurrencyInput(value));
  };

  const handlePercentChange = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setter(formatPercentInput(value));
  };

  const handleQuantidadePeriodosChange = (value: string) => {
    // Permite apenas dígitos
    const digits = value.replace(/\D/g, "");
    setQuantidadePeriodos(digits);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const inputs: InputsJurosCompostos = {
      valorInicial: parseCurrencyValue(valorInicial),
      taxaJuros: parsePercentValue(taxaJuros),
      periodo,
      aportes: parseCurrencyValue(aportes),
      quantidadePeriodos: parseInt(quantidadePeriodos) || 0,
    };

    if (inputs.valorInicial <= 0 || inputs.taxaJuros < 0 || inputs.quantidadePeriodos <= 0) {
      return;
    }

    onCalculate(inputs);
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados do Investimento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="valorInicial">Valor Inicial</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    id="valorInicial"
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={valorInicial}
                    onChange={(e) => handleCurrencyChange(e.target.value, setValorInicial)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="taxaJuros">Taxa de Juros</Label>
                  <Tooltip delayDuration={120}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                        <Info className="h-4 w-4" />
                        <span className="sr-only">Informações sobre taxa de juros</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-center">
                      <p>
                        Taxa de juros por período. Se você tem uma taxa anual, selecione &quot;Anual&quot; como período.
                        A taxa será aplicada a cada período.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <Input
                    id="taxaJuros"
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={taxaJuros}
                    onChange={(e) => handlePercentChange(e.target.value, setTaxaJuros)}
                    className="pr-8"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="periodo">Período</Label>
                  <Tooltip delayDuration={120}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                        <Info className="h-4 w-4" />
                        <span className="sr-only">Informações sobre período</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-center">
                      <p>
                        Define a periodicidade dos juros e aportes. Se você tem uma taxa anual de 12%, selecione
                        &quot;Anual&quot; e informe 12% como taxa.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={periodo} onValueChange={(value) => setPeriodo(value as PeriodoJurosCompostos)}>
                  <SelectTrigger id="periodo">
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PERIODO_JUROS_COMPOSTOS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="aportes">Aportes Periódicos</Label>
                  <Tooltip delayDuration={120}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                        <Info className="h-4 w-4" />
                        <span className="sr-only">Informações sobre aportes</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-center">
                      <p>
                        Valor fixo a ser adicionado a cada período. Deixe em branco ou zero se não houver aportes
                        periódicos.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    id="aportes"
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={aportes}
                    onChange={(e) => handleCurrencyChange(e.target.value, setAportes)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantidadePeriodos">Quantidade de Períodos</Label>
                <div className="relative">
                  <Input
                    id="quantidadePeriodos"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={quantidadePeriodos}
                    onChange={(e) => handleQuantidadePeriodosChange(e.target.value)}
                    className="pr-16"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    períodos
                  </span>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
              Calcular Juros Compostos
            </Button>
          </form>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

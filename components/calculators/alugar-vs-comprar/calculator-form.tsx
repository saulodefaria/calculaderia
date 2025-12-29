"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { InputsAluguelVsComprar } from "@/lib/calculators/alugar-vs-comprar";
import type { MetodoAmortizacao } from "@/lib/calculators/financiamento";
import {
  formatCurrencyFromNumber,
  formatCurrencyInput,
  formatPercentFromNumber,
  formatPercentInput,
  parseCurrencyValue,
  parsePercentValue,
} from "@/lib/utils/index";

interface CalculatorFormProps {
  onCalculate: (inputs: InputsAluguelVsComprar) => void;
  /** Optional initial values to pre-fill the form */
  initialValues?: InputsAluguelVsComprar | null;
}

export function CalculatorForm({ onCalculate, initialValues }: CalculatorFormProps) {
  // Initialize state from initialValues prop (used when loading from URL params)
  const [valorImovel, setValorImovel] = useState(() =>
    initialValues ? formatCurrencyFromNumber(initialValues.valorImovel) : ""
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
  const [metodo, setMetodo] = useState<MetodoAmortizacao>(() => initialValues?.metodo ?? "sac");
  const [correcaoAnualImovel, setCorrecaoAnualImovel] = useState(() => {
    if (initialValues && typeof initialValues.correcaoAnualImovel === "number") {
      return formatPercentFromNumber(initialValues.correcaoAnualImovel);
    }
    return "5";
  });
  const [aluguelMensal, setAluguelMensal] = useState(() =>
    initialValues?.aluguelMensal ? formatCurrencyFromNumber(initialValues.aluguelMensal) : ""
  );
  const [correcaoAnualAluguel, setCorrecaoAnualAluguel] = useState(() => {
    if (initialValues && typeof initialValues.correcaoAnualAluguel === "number") {
      return formatPercentFromNumber(initialValues.correcaoAnualAluguel);
    }
    return "6";
  });
  const [taxaRendimentoAnual, setTaxaRendimentoAnual] = useState(() =>
    initialValues?.taxaRendimentoAnual ? formatPercentFromNumber(initialValues.taxaRendimentoAnual) : ""
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

    const inputs: InputsAluguelVsComprar = {
      valorImovel: parseCurrencyValue(valorImovel),
      valorEntrada: parseCurrencyValue(valorEntrada),
      taxaJurosAnual: parsePercentValue(taxaJurosAnual),
      meses: parseInt(meses) || 0,
      metodo,
      correcaoAnualImovel: parsePercentValue(correcaoAnualImovel),
      aluguelMensal: parseCurrencyValue(aluguelMensal),
      correcaoAnualAluguel: parsePercentValue(correcaoAnualAluguel),
      taxaRendimentoAnual: parsePercentValue(taxaRendimentoAnual),
    };

    if (
      inputs.valorImovel <= 0 ||
      inputs.taxaJurosAnual <= 0 ||
      inputs.meses <= 0 ||
      inputs.aluguelMensal <= 0 ||
      inputs.taxaRendimentoAnual <= 0
    ) {
      return;
    }

    if (inputs.valorEntrada >= inputs.valorImovel) {
      return;
    }

    onCalculate(inputs);
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados da Comparação</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Dados do Imóvel e Financiamento */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Dados do Imóvel e Financiamento
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="valorImovel">Valor do Imóvel</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <Input
                      id="valorImovel"
                      type="text"
                      inputMode="numeric"
                      placeholder="0,00"
                      value={valorImovel}
                      onChange={(e) => handleCurrencyChange(e.target.value, setValorImovel)}
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
                      onChange={(e) => handlePercentChange(e.target.value, setTaxaJurosAnual)}
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
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      meses
                    </span>
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
                          Estimativa de valorização anual do imóvel (ex.: 5% ao ano). Usado para calcular o valor futuro
                          do imóvel no cenário de compra.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="relative">
                    <Input
                      id="correcaoAnualImovel"
                      type="text"
                      inputMode="decimal"
                      placeholder="5,00"
                      value={correcaoAnualImovel}
                      onChange={(e) => handlePercentChange(e.target.value, setCorrecaoAnualImovel)}
                      className="pr-8"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metodo">Sistema de Amortização</Label>
                  <Tabs value={metodo} onValueChange={(v) => setMetodo(v as MetodoAmortizacao)}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="sac">SAC</TabsTrigger>
                      <TabsTrigger value="price">PRICE</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </div>

            {/* Dados do Aluguel */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                Dados do Aluguel
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="aluguelMensal">Aluguel Mensal</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <Input
                      id="aluguelMensal"
                      type="text"
                      inputMode="numeric"
                      placeholder="0,00"
                      value={aluguelMensal}
                      onChange={(e) => handleCurrencyChange(e.target.value, setAluguelMensal)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="correcaoAnualAluguel">Correção Anual do Aluguel (IGPM)</Label>
                    <Tooltip delayDuration={120}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-4 w-4" />
                          <span className="sr-only">Informações sobre correção anual do aluguel</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-center">
                        <p>
                          Taxa de correção anual do aluguel (ex: IGPM). O aluguel será reajustado a cada 12 meses por
                          essa taxa.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="relative">
                    <Input
                      id="correcaoAnualAluguel"
                      type="text"
                      inputMode="decimal"
                      placeholder="6,00"
                      value={correcaoAnualAluguel}
                      onChange={(e) => handlePercentChange(e.target.value, setCorrecaoAnualAluguel)}
                      className="pr-8"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dados do Investimento */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Dados do Investimento
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="taxaRendimentoAnual">Taxa de Rendimento Anual do Investimento</Label>
                    <Tooltip delayDuration={120}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-4 w-4" />
                          <span className="sr-only">Informações sobre taxa de rendimento</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-center">
                        <p>
                          Taxa de rendimento anual esperada do investimento onde você aplicará a diferença entre a
                          prestação do financiamento e o aluguel pago.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="relative">
                    <Input
                      id="taxaRendimentoAnual"
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={taxaRendimentoAnual}
                      onChange={(e) => handlePercentChange(e.target.value, setTaxaRendimentoAnual)}
                      className="pr-8"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
              Comparar Alugar vs Comprar
            </Button>
          </form>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

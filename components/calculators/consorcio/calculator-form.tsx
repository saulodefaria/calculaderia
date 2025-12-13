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
  const [agio, setAgio] = useState(() =>
    initialValues && initialValues.agio && initialValues.agio > 0 ? formatCurrencyFromNumber(initialValues.agio) : ""
  );
  const [mesContemplacao, setMesContemplacao] = useState(() => {
    // Check mesContemplacao first (new field), then fall back to lance.mes
    if (initialValues?.mesContemplacao && initialValues.mesContemplacao > 0) {
      return initialValues.mesContemplacao.toString();
    }
    if (initialValues?.lance?.mes && initialValues.lance.mes > 0) {
      return initialValues.lance.mes.toString();
    }
    return "1";
  });
  const [valorLance, setValorLance] = useState(() =>
    initialValues?.lance?.valor && initialValues.lance.valor > 0
      ? formatCurrencyFromNumber(initialValues.lance.valor)
      : ""
  );

  // Aluguel (economia de não pagar aluguel ao ter imóvel próprio)
  const [aluguelMensal, setAluguelMensal] = useState(() =>
    initialValues?.aluguelMensal && initialValues.aluguelMensal > 0
      ? formatCurrencyFromNumber(initialValues.aluguelMensal)
      : ""
  );
  const [correcaoAnualAluguel, setCorrecaoAnualAluguel] = useState(() =>
    initialValues && typeof initialValues.correcaoAnualAluguel === "number"
      ? formatPercentFromNumber(initialValues.correcaoAnualAluguel)
      : "6"
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

  const handleMesContemplacaoChange = (value: string) => {
    const digits = value.replace(/\D/g, "");
    setMesContemplacao(digits);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedMeses = parseInt(meses) || 0;
    const parsedMesContemplacao = parseInt(mesContemplacao) || 1;
    const parsedValorLance = parseCurrencyValue(valorLance);

    const validMesContemplacao = Math.min(Math.max(parsedMesContemplacao, 1), parsedMeses);

    const inputs: InputsConsorcio = {
      valorBem: parseCurrencyValue(valorBem),
      meses: parsedMeses,
      taxaAdministracaoTotal: parsePercentValue(taxaAdministracaoTotal),
      correcaoAnual: parsePercentValue(correcaoAnual),
      agio: parseCurrencyValue(agio),
      lance:
        parsedValorLance > 0
          ? {
              mes: validMesContemplacao,
              valor: parsedValorLance,
            }
          : undefined,
      // Always send mesContemplacao (used for rent calculation even without lance)
      mesContemplacao: validMesContemplacao,
      aluguelMensal: parseCurrencyValue(aluguelMensal),
      correcaoAnualAluguel: parsePercentValue(correcaoAnualAluguel),
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

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="valorLance">Valor do Lance</Label>
                  <Tooltip delayDuration={120}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                        <Info className="h-4 w-4" />
                        <span className="sr-only">Informações sobre lance</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-center">
                      <p>
                        Valor do lance para antecipar parcelas e reduzir o prazo do consórcio. O lance será aplicado no
                        mês da contemplação.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    id="valorLance"
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={valorLance}
                    onChange={(e) => handleCurrencyChange(e.target.value, setValorLance)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="mesContemplacao">Mês da Contemplação</Label>
                  <Tooltip delayDuration={120}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                        <Info className="h-4 w-4" />
                        <span className="sr-only">Informações sobre mês da contemplação</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-center">
                      <p>
                        Mês em que você será contemplado e poderá dar o lance. Se comprou carta já contemplada, use mês
                        1.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <Input
                    id="mesContemplacao"
                    type="text"
                    inputMode="numeric"
                    placeholder="1"
                    value={mesContemplacao}
                    onChange={(e) => handleMesContemplacaoChange(e.target.value)}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">mês</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="agio">Ágio da Carta Contemplada</Label>
                  <Tooltip delayDuration={120}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                        <Info className="h-4 w-4" />
                        <span className="sr-only">Informações sobre ágio</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-center">
                      <p>
                        Valor pago para comprar uma carta de consórcio já contemplada. Este valor é adicionado ao custo
                        total e considerado no cálculo da TIR.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    id="agio"
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={agio}
                    onChange={(e) => handleCurrencyChange(e.target.value, setAgio)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center px-2">
              <strong>Nota:</strong> Lance e Ágio são cenários distintos. Use lance se será contemplado por
              sorteio/lance. Use ágio se está comprando uma carta já contemplada de terceiros.
            </p>

            {/* Seção Aluguel */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                Aluguel Recebido (Opcional)
              </h3>
              <p className="text-xs text-muted-foreground">
                Se você pretende alugar o imóvel, informe o valor do aluguel que receberá. A receita começa a partir do
                mês de contemplação e é considerada no cálculo da TIR.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="aluguelMensal">Aluguel Mensal</Label>
                    <Tooltip delayDuration={120}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-4 w-4" />
                          <span className="sr-only">Informações sobre aluguel</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-center">
                        <p>
                          Valor do aluguel que você receberá ao alugar o imóvel (mês 1). Esse valor será considerado como
                          receita mensal a partir da contemplação.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
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
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="correcaoAnualAluguel">Correção Anual (IGPM)</Label>
                    <Tooltip delayDuration={120}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-4 w-4" />
                          <span className="sr-only">Informações sobre correção do aluguel</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-center">
                        <p>
                          Reajuste anual do aluguel (geralmente IGPM). Aplicado a cada 12 meses (mês 13, 25, ...).
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
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
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

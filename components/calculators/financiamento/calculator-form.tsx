"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { InputsFinanciamento } from "@/lib/calculators/financiamento";
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
  onCalculate: (inputs: InputsFinanciamento, metodo: MetodoAmortizacao) => void;
  /** Optional initial values to pre-fill the form */
  initialValues?: InputsFinanciamento | null;
  /** Optional initial metodo value */
  initialMetodo?: MetodoAmortizacao;
}

export function CalculatorForm({ onCalculate, initialValues, initialMetodo }: CalculatorFormProps) {
  const t = useTranslations("calculators.financiamento.form");

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
  const [metodo, setMetodo] = useState<MetodoAmortizacao>(() => initialMetodo ?? "sac");
  const [correcaoAnualImovel, setCorrecaoAnualImovel] = useState(() => {
    if (initialValues && typeof initialValues.correcaoAnualImovel === "number") {
      return formatPercentFromNumber(initialValues.correcaoAnualImovel);
    }
    return "6";
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

  const handleCurrencyChange = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setter(formatCurrencyInput(value));
  };

  const handlePercentChange = (value: string) => {
    setTaxaJurosAnual(formatPercentInput(value));
  };

  const handleCorrecaoAnualImovelChange = (value: string) => {
    setCorrecaoAnualImovel(formatPercentInput(value));
  };

  const handleCorrecaoAnualAluguelChange = (value: string) => {
    setCorrecaoAnualAluguel(formatPercentInput(value));
  };

  const handleMesesChange = (value: string) => {
    // Allow only digits
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
      aluguelMensal: parseCurrencyValue(aluguelMensal),
      correcaoAnualAluguel: parsePercentValue(correcaoAnualAluguel),
    };

    if (inputs.valorEmprestimo <= 0 || inputs.taxaJurosAnual <= 0 || inputs.meses <= 0) {
      return;
    }

    if (inputs.valorEntrada >= inputs.valorEmprestimo) {
      return;
    }

    onCalculate(inputs, metodo);
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="valorEmprestimo">{t("fields.loanAmount.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    id="valorEmprestimo"
                    type="text"
                    inputMode="numeric"
                    placeholder={t("fields.loanAmount.placeholder")}
                    value={valorEmprestimo}
                    onChange={(e) => handleCurrencyChange(e.target.value, setValorEmprestimo)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valorEntrada">{t("fields.downPayment.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    id="valorEntrada"
                    type="text"
                    inputMode="numeric"
                    placeholder={t("fields.downPayment.placeholder")}
                    value={valorEntrada}
                    onChange={(e) => handleCurrencyChange(e.target.value, setValorEntrada)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxaJurosAnual">{t("fields.annualInterestRate.label")}</Label>
                <div className="relative">
                  <Input
                    id="taxaJurosAnual"
                    type="text"
                    inputMode="decimal"
                    placeholder={t("fields.annualInterestRate.placeholder")}
                    value={taxaJurosAnual}
                    onChange={(e) => handlePercentChange(e.target.value)}
                    className="pr-8"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meses">{t("fields.term.label")}</Label>
                <div className="relative">
                  <Input
                    id="meses"
                    type="text"
                    inputMode="numeric"
                    placeholder={t("fields.term.placeholder")}
                    value={meses}
                    onChange={(e) => handleMesesChange(e.target.value)}
                    className="pr-16"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    {t("fields.term.suffix")}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="correcaoAnualImovel">{t("fields.annualPropertyAppreciation.label")}</Label>
                  <Tooltip delayDuration={120}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                        <Info className="h-4 w-4" />
                        <span className="sr-only">{t("srOnly.propertyAppreciationInfo")}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-center">
                      <p>{t("fields.annualPropertyAppreciation.help")}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <Input
                    id="correcaoAnualImovel"
                    type="text"
                    inputMode="decimal"
                    placeholder={t("fields.annualPropertyAppreciation.placeholder")}
                    value={correcaoAnualImovel}
                    onChange={(e) => handleCorrecaoAnualImovelChange(e.target.value)}
                    className="pr-8"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metodo">{t("fields.amortizationSystem.label")}</Label>
                <Tabs value={metodo} onValueChange={(v) => setMetodo(v as MetodoAmortizacao)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="sac">{t("fields.amortizationSystem.options.sac")}</TabsTrigger>
                    <TabsTrigger value="price">{t("fields.amortizationSystem.options.price")}</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Rent Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                {t("rentSection.title")}
              </h3>
              <p className="text-xs text-muted-foreground">{t("rentSection.description")}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="aluguelMensal">{t("rentSection.fields.monthlyRent.label")}</Label>
                    <Tooltip delayDuration={120}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-4 w-4" />
                          <span className="sr-only">{t("srOnly.rentInfo")}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-center">
                        <p>{t("rentSection.fields.monthlyRent.help")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <Input
                      id="aluguelMensal"
                      type="text"
                      inputMode="numeric"
                      placeholder={t("rentSection.fields.monthlyRent.placeholder")}
                      value={aluguelMensal}
                      onChange={(e) => handleCurrencyChange(e.target.value, setAluguelMensal)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="correcaoAnualAluguel">{t("rentSection.fields.annualRentAdjustment.label")}</Label>
                    <Tooltip delayDuration={120}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-4 w-4" />
                          <span className="sr-only">{t("srOnly.rentAdjustmentInfo")}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-center">
                        <p>{t("rentSection.fields.annualRentAdjustment.help")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="relative">
                    <Input
                      id="correcaoAnualAluguel"
                      type="text"
                      inputMode="decimal"
                      placeholder={t("rentSection.fields.annualRentAdjustment.placeholder")}
                      value={correcaoAnualAluguel}
                      onChange={(e) => handleCorrecaoAnualAluguelChange(e.target.value)}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
              {t("submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

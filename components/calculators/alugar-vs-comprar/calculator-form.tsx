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
  const t = useTranslations("calculators.alugar-vs-comprar.form");

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
    // Allow only digits
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
          <CardTitle className="text-lg">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Property and Loan Data */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                {t("sections.propertyAndLoan.title")}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="valorImovel">{t("fields.propertyValue.label")}</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <Input
                      id="valorImovel"
                      type="text"
                      inputMode="numeric"
                      placeholder={t("fields.propertyValue.placeholder")}
                      value={valorImovel}
                      onChange={(e) => handleCurrencyChange(e.target.value, setValorImovel)}
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
                      onChange={(e) => handlePercentChange(e.target.value, setTaxaJurosAnual)}
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
                      onChange={(e) => handlePercentChange(e.target.value, setCorrecaoAnualImovel)}
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
            </div>

            {/* Dados do Aluguel */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                {t("sections.rent.title")}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="aluguelMensal">{t("fields.monthlyRent.label")}</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <Input
                      id="aluguelMensal"
                      type="text"
                      inputMode="numeric"
                      placeholder={t("fields.monthlyRent.placeholder")}
                      value={aluguelMensal}
                      onChange={(e) => handleCurrencyChange(e.target.value, setAluguelMensal)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="correcaoAnualAluguel">{t("fields.annualRentAdjustment.label")}</Label>
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
                        <p>{t("fields.annualRentAdjustment.help")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="relative">
                    <Input
                      id="correcaoAnualAluguel"
                      type="text"
                      inputMode="decimal"
                      placeholder={t("fields.annualRentAdjustment.placeholder")}
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
                {t("sections.investment.title")}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="taxaRendimentoAnual">{t("fields.annualReturnRate.label")}</Label>
                    <Tooltip delayDuration={120}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-4 w-4" />
                          <span className="sr-only">{t("srOnly.annualReturnRateInfo")}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-center">
                        <p>{t("fields.annualReturnRate.help")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="relative">
                    <Input
                      id="taxaRendimentoAnual"
                      type="text"
                      inputMode="decimal"
                      placeholder={t("fields.annualReturnRate.placeholder")}
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
              {t("submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

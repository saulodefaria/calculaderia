"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { InputsJurosCompostos, PeriodoJurosCompostos } from "@/lib/calculators/juros-compostos";
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
  const t = useTranslations("calculators.juros-compostos.form");

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
          <CardTitle className="text-lg">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="valorInicial">{t("fields.initialAmount.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    id="valorInicial"
                    type="text"
                    inputMode="numeric"
                    placeholder={t("fields.initialAmount.placeholder")}
                    value={valorInicial}
                    onChange={(e) => handleCurrencyChange(e.target.value, setValorInicial)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="taxaJuros">{t("fields.interestRate.label")}</Label>
                  <Tooltip delayDuration={120}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                        <Info className="h-4 w-4" />
                        <span className="sr-only">{t("srOnly.interestRateInfo")}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-center">
                      <p>{t("fields.interestRate.help")}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <Input
                    id="taxaJuros"
                    type="text"
                    inputMode="decimal"
                    placeholder={t("fields.interestRate.placeholder")}
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
                  <Label htmlFor="periodo">{t("fields.period.label")}</Label>
                  <Tooltip delayDuration={120}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                        <Info className="h-4 w-4" />
                        <span className="sr-only">{t("srOnly.periodInfo")}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-center">
                      <p>{t("fields.period.help")}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={periodo} onValueChange={(value) => setPeriodo(value as PeriodoJurosCompostos)}>
                  <SelectTrigger id="periodo">
                    <SelectValue placeholder={t("fields.period.placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {(["mensal", "anual"] as PeriodoJurosCompostos[]).map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(`fields.period.options.${value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="aportes">{t("fields.contribution.label")}</Label>
                  <Tooltip delayDuration={120}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                        <Info className="h-4 w-4" />
                        <span className="sr-only">{t("srOnly.contributionInfo")}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-center">
                      <p>{t("fields.contribution.help")}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    id="aportes"
                    type="text"
                    inputMode="numeric"
                    placeholder={t("fields.contribution.placeholder")}
                    value={aportes}
                    onChange={(e) => handleCurrencyChange(e.target.value, setAportes)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantidadePeriodos">{t("fields.periodCount.label")}</Label>
                <div className="relative">
                  <Input
                    id="quantidadePeriodos"
                    type="text"
                    inputMode="numeric"
                    placeholder={t("fields.periodCount.placeholder")}
                    value={quantidadePeriodos}
                    onChange={(e) => handleQuantidadePeriodosChange(e.target.value)}
                    className="pr-16"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    {t("fields.periodCount.suffix")}
                  </span>
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

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { InputsComparadorRendaFixa } from "@/lib/calculators/renda-fixa";
import {
  formatCurrencyFromNumber,
  formatCurrencyInput,
  formatPercentFromNumber,
  formatPercentInput,
  parseCurrencyValue,
  parsePercentValue,
} from "@/lib/utils/index";

interface CalculatorFormProps {
  onCalculate: (inputs: InputsComparadorRendaFixa) => void;
  /** Optional initial values to pre-fill the form */
  initialValues?: InputsComparadorRendaFixa | null;
}

export function CalculatorForm({ onCalculate, initialValues }: CalculatorFormProps) {
  const t = useTranslations("calculators.renda-fixa.form");

  // Main inputs
  const [valor, setValor] = useState(() => (initialValues ? formatCurrencyFromNumber(initialValues.valor) : ""));
  const [prazoDias, setPrazoDias] = useState(() =>
    initialValues && initialValues.prazoDias > 0 ? initialValues.prazoDias.toString() : ""
  );

  // Rates
  const [preAnual, setPreAnual] = useState(() =>
    initialValues ? formatPercentFromNumber(initialValues.preAnual) : ""
  );
  const [cdiPercent, setCdiPercent] = useState(() =>
    initialValues ? formatPercentFromNumber(initialValues.cdiPercent) : "100"
  );
  const [ipcaMaisAnual, setIpcaMaisAnual] = useState(() =>
    initialValues ? formatPercentFromNumber(initialValues.ipcaMaisAnual) : ""
  );
  const [selicAnual, setSelicAnual] = useState(() =>
    initialValues ? formatPercentFromNumber(initialValues.selicAnual) : ""
  );

  // Market expectations
  const [cdiAnual, setCdiAnual] = useState(() =>
    initialValues ? formatPercentFromNumber(initialValues.cdiAnual) : ""
  );
  const [ipcaAnual, setIpcaAnual] = useState(() =>
    initialValues ? formatPercentFromNumber(initialValues.ipcaAnual) : ""
  );

  // Fees
  const [custodiaAnual, setCustodiaAnual] = useState(() =>
    initialValues && initialValues.custodiaAnual > 0 ? formatPercentFromNumber(initialValues.custodiaAnual) : ""
  );

  const handleCurrencyChange = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setter(formatCurrencyInput(value));
  };

  const handlePercentChange = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setter(formatPercentInput(value));
  };

  const handlePrazoDiasChange = (value: string) => {
    const digits = value.replace(/\D/g, "");
    setPrazoDias(digits);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const inputs: InputsComparadorRendaFixa = {
      valor: parseCurrencyValue(valor),
      prazoDias: parseInt(prazoDias) || 0,
      preAnual: parsePercentValue(preAnual),
      cdiPercent: parsePercentValue(cdiPercent),
      ipcaMaisAnual: parsePercentValue(ipcaMaisAnual),
      selicAnual: parsePercentValue(selicAnual),
      cdiAnual: parsePercentValue(cdiAnual),
      ipcaAnual: parsePercentValue(ipcaAnual),
      custodiaAnual: parsePercentValue(custodiaAnual),
    };

    // Validations
    if (inputs.valor <= 0) return;
    if (inputs.prazoDias <= 0) return;
    if (inputs.preAnual < 0) return;
    if (inputs.cdiPercent < 0) return;
    if (inputs.ipcaMaisAnual < 0) return;
    if (inputs.selicAnual < 0) return;
    if (inputs.cdiAnual < 0) return;
    if (inputs.ipcaAnual < 0) return;
    if (inputs.custodiaAnual < 0) return;

    onCalculate(inputs);
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Main Inputs */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                {t("sections.main.title")}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="valor">{t("fields.amount.label")}</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <Input
                      id="valor"
                      type="text"
                      inputMode="numeric"
                      placeholder={t("fields.amount.placeholder")}
                      value={valor}
                      onChange={(e) => handleCurrencyChange(e.target.value, setValor)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="prazoDias">{t("fields.termDays.label")}</Label>
                    <Tooltip delayDuration={120}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-4 w-4" />
                          <span className="sr-only">{t("srOnly.termDaysInfo")}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-center">
                        <p>{t("fields.termDays.help")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="relative">
                    <Input
                      id="prazoDias"
                      type="text"
                      inputMode="numeric"
                      placeholder={t("fields.termDays.placeholder")}
                      value={prazoDias}
                      onChange={(e) => handlePrazoDiasChange(e.target.value)}
                      className="pr-16"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      {t("fields.termDays.suffix")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Option rates */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                {t("sections.rates.title")}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="preAnual">{t("fields.preAnual.label")}</Label>
                    <Tooltip delayDuration={120}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-4 w-4" />
                          <span className="sr-only">{t("srOnly.preAnualInfo")}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-center">
                        <p>{t("fields.preAnual.help")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="relative">
                    <Input
                      id="preAnual"
                      type="text"
                      inputMode="decimal"
                      placeholder={t("fields.preAnual.placeholder")}
                      value={preAnual}
                      onChange={(e) => handlePercentChange(e.target.value, setPreAnual)}
                      className="pr-8"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="cdiPercent">{t("fields.cdiPercent.label")}</Label>
                    <Tooltip delayDuration={120}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-4 w-4" />
                          <span className="sr-only">{t("srOnly.cdiPercentInfo")}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-center">
                        <p>{t("fields.cdiPercent.help")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="relative">
                    <Input
                      id="cdiPercent"
                      type="text"
                      inputMode="decimal"
                      placeholder={t("fields.cdiPercent.placeholder")}
                      value={cdiPercent}
                      onChange={(e) => handlePercentChange(e.target.value, setCdiPercent)}
                      className="pr-8"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="ipcaMaisAnual">{t("fields.ipcaMaisAnual.label")}</Label>
                    <Tooltip delayDuration={120}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-4 w-4" />
                          <span className="sr-only">{t("srOnly.ipcaMaisAnualInfo")}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-center">
                        <p>{t("fields.ipcaMaisAnual.help")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="relative">
                    <Input
                      id="ipcaMaisAnual"
                      type="text"
                      inputMode="decimal"
                      placeholder={t("fields.ipcaMaisAnual.placeholder")}
                      value={ipcaMaisAnual}
                      onChange={(e) => handlePercentChange(e.target.value, setIpcaMaisAnual)}
                      className="pr-8"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="selicAnual">{t("fields.selicAnual.label")}</Label>
                    <Tooltip delayDuration={120}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-4 w-4" />
                          <span className="sr-only">{t("srOnly.selicAnualInfo")}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-center">
                        <p>{t("fields.selicAnual.help")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="relative">
                    <Input
                      id="selicAnual"
                      type="text"
                      inputMode="decimal"
                      placeholder={t("fields.selicAnual.placeholder")}
                      value={selicAnual}
                      onChange={(e) => handlePercentChange(e.target.value, setSelicAnual)}
                      className="pr-8"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Market expectations */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                {t("sections.expectations.title")}
              </h3>
              <p className="text-xs text-muted-foreground">{t("sections.expectations.description")}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="cdiAnual">{t("fields.cdiAnual.label")}</Label>
                    <Tooltip delayDuration={120}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-4 w-4" />
                          <span className="sr-only">{t("srOnly.cdiAnualInfo")}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-center">
                        <p>{t("fields.cdiAnual.help")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="relative">
                    <Input
                      id="cdiAnual"
                      type="text"
                      inputMode="decimal"
                      placeholder={t("fields.cdiAnual.placeholder")}
                      value={cdiAnual}
                      onChange={(e) => handlePercentChange(e.target.value, setCdiAnual)}
                      className="pr-8"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="ipcaAnual">{t("fields.ipcaAnual.label")}</Label>
                    <Tooltip delayDuration={120}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-4 w-4" />
                          <span className="sr-only">{t("srOnly.ipcaAnualInfo")}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-center">
                        <p>{t("fields.ipcaAnual.help")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="relative">
                    <Input
                      id="ipcaAnual"
                      type="text"
                      inputMode="decimal"
                      placeholder={t("fields.ipcaAnual.placeholder")}
                      value={ipcaAnual}
                      onChange={(e) => handlePercentChange(e.target.value, setIpcaAnual)}
                      className="pr-8"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fees */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                {t("sections.fees.title")}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="custodiaAnual">{t("fields.custodiaAnual.label")}</Label>
                  <Tooltip delayDuration={120}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                        <Info className="h-4 w-4" />
                        <span className="sr-only">{t("srOnly.custodiaAnualInfo")}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-center">
                      <p>{t("fields.custodiaAnual.help")}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative max-w-xs">
                  <Input
                    id="custodiaAnual"
                    type="text"
                    inputMode="decimal"
                    placeholder={t("fields.custodiaAnual.placeholder")}
                    value={custodiaAnual}
                    onChange={(e) => handlePercentChange(e.target.value, setCustodiaAnual)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
                <p className="text-xs text-muted-foreground">{t("sections.fees.note")}</p>
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

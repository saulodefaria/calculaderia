"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Info, AlertTriangle } from "lucide-react";
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
  const t = useTranslations("calculators.consorcio.form");

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

  // Validation: Lance and Ágio are mutually exclusive
  const lanceAgioError = useMemo(() => {
    const parsedLance = parseCurrencyValue(valorLance);
    const parsedAgio = parseCurrencyValue(agio);
    return parsedLance > 0 && parsedAgio > 0;
  }, [valorLance, agio]);

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

    // Prevent submission if both lance and ágio are filled
    if (lanceAgioError) {
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
                <Label htmlFor="valorBem">{t("fields.assetValue.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    id="valorBem"
                    type="text"
                    inputMode="numeric"
                    placeholder={t("fields.assetValue.placeholder")}
                    value={valorBem}
                    onChange={(e) => handleCurrencyChange(e.target.value, setValorBem)}
                    className="pl-10"
                    required
                  />
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
                <Label htmlFor="taxaAdministracaoTotal">{t("fields.adminFee.label")}</Label>
                <div className="relative">
                  <Input
                    id="taxaAdministracaoTotal"
                    type="text"
                    inputMode="decimal"
                    placeholder={t("fields.adminFee.placeholder")}
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
                  <Label htmlFor="correcaoAnual">{t("fields.annualAdjustment.label")}</Label>
                  <Tooltip delayDuration={120}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                        <Info className="h-4 w-4" />
                        <span className="sr-only">{t("srOnly.annualAdjustmentInfo")}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-center">
                      <p>{t("fields.annualAdjustment.help")}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <Input
                    id="correcaoAnual"
                    type="text"
                    inputMode="decimal"
                    placeholder={t("fields.annualAdjustment.placeholder")}
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
                  <Label htmlFor="valorLance">{t("fields.bidAmount.label")}</Label>
                  <Tooltip delayDuration={120}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                        <Info className="h-4 w-4" />
                        <span className="sr-only">{t("srOnly.bidInfo")}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-center">
                      <p>{t("fields.bidAmount.help")}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    id="valorLance"
                    type="text"
                    inputMode="numeric"
                    placeholder={t("fields.bidAmount.placeholder")}
                    value={valorLance}
                    onChange={(e) => handleCurrencyChange(e.target.value, setValorLance)}
                    className={`pl-10 ${lanceAgioError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="mesContemplacao">{t("fields.contemplationMonth.label")}</Label>
                  <Tooltip delayDuration={120}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                        <Info className="h-4 w-4" />
                        <span className="sr-only">{t("srOnly.contemplationMonthInfo")}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-center">
                      <p>{t("fields.contemplationMonth.help")}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <Input
                    id="mesContemplacao"
                    type="text"
                    inputMode="numeric"
                    placeholder={t("fields.contemplationMonth.placeholder")}
                    value={mesContemplacao}
                    onChange={(e) => handleMesContemplacaoChange(e.target.value)}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    {t("fields.contemplationMonth.suffix")}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="agio">{t("fields.premium.label")}</Label>
                  <Tooltip delayDuration={120}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                        <Info className="h-4 w-4" />
                        <span className="sr-only">{t("srOnly.premiumInfo")}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-center">
                      <p>{t("fields.premium.help")}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    id="agio"
                    type="text"
                    inputMode="numeric"
                    placeholder={t("fields.premium.placeholder")}
                    value={agio}
                    onChange={(e) => handleCurrencyChange(e.target.value, setAgio)}
                    className={`pl-10 ${lanceAgioError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                </div>
              </div>
            </div>

            {lanceAgioError ? (
              <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400">
                  <strong>{t("lanceAgioError.title")}</strong> {t("lanceAgioError.message")}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center px-2">
                <strong>{t("lanceAgioNote.title")}</strong> {t("lanceAgioNote.message")}
              </p>
            )}

            {/* Seção Aluguel */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                {t("rentSection.title")}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t("rentSection.description")}
              </p>
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
                      onChange={(e) => handlePercentChange(e.target.value, setCorrecaoAnualAluguel)}
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

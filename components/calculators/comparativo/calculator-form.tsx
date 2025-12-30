"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { InputsComparativo } from "@/lib/calculators/comparativo";
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
  onCalculate: (inputs: InputsComparativo) => void;
  /** Optional initial values to pre-fill the form */
  initialValues?: InputsComparativo | null;
}

export function CalculatorForm({ onCalculate, initialValues }: CalculatorFormProps) {
  const t = useTranslations("calculators.comparativo.form");

  // Valor do Imóvel (compartilhado)
  const [valorImovel, setValorImovel] = useState(() =>
    initialValues ? formatCurrencyFromNumber(initialValues.financiamento.valorImovel) : ""
  );

  // Financiamento
  const [valorEntrada, setValorEntrada] = useState(() =>
    initialValues ? formatCurrencyFromNumber(initialValues.financiamento.valorEntrada) : ""
  );
  const [taxaJurosAnual, setTaxaJurosAnual] = useState(() =>
    initialValues ? formatPercentFromNumber(initialValues.financiamento.taxaJurosAnual) : ""
  );
  const [mesesFinanciamento, setMesesFinanciamento] = useState(() =>
    initialValues && initialValues.financiamento.meses > 0 ? initialValues.financiamento.meses.toString() : ""
  );
  const [metodo, setMetodo] = useState<MetodoAmortizacao>(() => initialValues?.financiamento.metodo ?? "sac");
  const [correcaoAnualImovel, setCorrecaoAnualImovel] = useState(() => {
    if (initialValues && typeof initialValues.financiamento.correcaoAnualImovel === "number") {
      return formatPercentFromNumber(initialValues.financiamento.correcaoAnualImovel);
    }
    return "6";
  });

  // Consórcio
  const [mesesConsorcio, setMesesConsorcio] = useState(() =>
    initialValues && initialValues.consorcio.meses > 0 ? initialValues.consorcio.meses.toString() : ""
  );
  const [taxaAdministracaoTotal, setTaxaAdministracaoTotal] = useState(() =>
    initialValues ? formatPercentFromNumber(initialValues.consorcio.taxaAdministracaoTotal) : ""
  );
  const [correcaoAnualConsorcio, setCorrecaoAnualConsorcio] = useState(() =>
    initialValues ? formatPercentFromNumber(initialValues.consorcio.correcaoAnual) : "6"
  );
  const [agioCartaContemplada, setAgioCartaContemplada] = useState(() =>
    initialValues && initialValues.consorcio.agioCartaContemplada > 0
      ? formatCurrencyFromNumber(initialValues.consorcio.agioCartaContemplada)
      : ""
  );
  const [mesContemplacao, setMesContemplacao] = useState(() =>
    initialValues && initialValues.consorcio.mesContemplacao > 0
      ? initialValues.consorcio.mesContemplacao.toString()
      : "1"
  );
  const [valorLance, setValorLance] = useState(() =>
    initialValues && initialValues.consorcio.valorLance > 0
      ? formatCurrencyFromNumber(initialValues.consorcio.valorLance)
      : ""
  );

  // Investimento
  const [taxaRendimentoAnual, setTaxaRendimentoAnual] = useState(() =>
    initialValues ? formatPercentFromNumber(initialValues.taxaRendimentoAnual) : "10"
  );

  // Aluguel (economia de não pagar aluguel ao ter imóvel próprio)
  const [aluguelMensal, setAluguelMensal] = useState(() =>
    initialValues && initialValues.aluguelMensal > 0 ? formatCurrencyFromNumber(initialValues.aluguelMensal) : ""
  );
  const [correcaoAnualAluguel, setCorrecaoAnualAluguel] = useState(() =>
    initialValues && typeof initialValues.correcaoAnualAluguel === "number"
      ? formatPercentFromNumber(initialValues.correcaoAnualAluguel)
      : "6"
  );

  // Validation: Lance and Ágio are mutually exclusive (same rule as standalone consórcio calculator)
  const lanceAgioError = useMemo(() => {
    const parsedLance = parseCurrencyValue(valorLance);
    const parsedAgio = parseCurrencyValue(agioCartaContemplada);
    return parsedLance > 0 && parsedAgio > 0;
  }, [valorLance, agioCartaContemplada]);

  const handleCurrencyChange = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setter(formatCurrencyInput(value));
  };

  const handlePercentChange = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setter(formatPercentInput(value));
  };

  const handleMesesChange = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const digits = value.replace(/\D/g, "");
    setter(digits);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const inputs: InputsComparativo = {
      financiamento: {
        valorImovel: parseCurrencyValue(valorImovel),
        valorEntrada: parseCurrencyValue(valorEntrada),
        taxaJurosAnual: parsePercentValue(taxaJurosAnual),
        meses: parseInt(mesesFinanciamento) || 0,
        metodo,
        correcaoAnualImovel: parsePercentValue(correcaoAnualImovel),
      },
      consorcio: {
        meses: parseInt(mesesConsorcio) || 0,
        taxaAdministracaoTotal: parsePercentValue(taxaAdministracaoTotal),
        correcaoAnual: parsePercentValue(correcaoAnualConsorcio),
        agioCartaContemplada: parseCurrencyValue(agioCartaContemplada),
        mesContemplacao: parseInt(mesContemplacao) || 1,
        valorLance: parseCurrencyValue(valorLance),
      },
      taxaRendimentoAnual: parsePercentValue(taxaRendimentoAnual),
      aluguelMensal: parseCurrencyValue(aluguelMensal),
      correcaoAnualAluguel: parsePercentValue(correcaoAnualAluguel),
    };

    // Validações
    if (inputs.financiamento.valorImovel <= 0) return;
    if (inputs.financiamento.taxaJurosAnual <= 0) return;
    if (inputs.financiamento.meses <= 0) return;
    if (inputs.financiamento.valorEntrada >= inputs.financiamento.valorImovel) return;
    if (inputs.consorcio.meses <= 0) return;
    if (inputs.consorcio.taxaAdministracaoTotal <= 0) return;
    if (inputs.taxaRendimentoAnual < 0) return;
    // Valida mês de contemplação (deve estar entre 1 e prazo do consórcio)
    if (inputs.consorcio.mesContemplacao < 1 || inputs.consorcio.mesContemplacao > inputs.consorcio.meses) {
      inputs.consorcio.mesContemplacao = Math.min(
        Math.max(1, inputs.consorcio.mesContemplacao),
        inputs.consorcio.meses
      );
    }

    // Prevent submission if both lance and ágio are filled
    if (lanceAgioError) return;

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
            {/* Valor do Imóvel - Compartilhado */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                {t("sections.property.title")}
              </h3>
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
                <p className="text-xs text-muted-foreground">{t("sections.property.note")}</p>
              </div>
            </div>

            {/* Seção Financiamento */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                {t("sections.loan.title")}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
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
                  <Label htmlFor="mesesFinanciamento">{t("fields.loanTerm.label")}</Label>
                  <div className="relative">
                    <Input
                      id="mesesFinanciamento"
                      type="text"
                      inputMode="numeric"
                      placeholder={t("fields.loanTerm.placeholder")}
                      value={mesesFinanciamento}
                      onChange={(e) => handleMesesChange(e.target.value, setMesesFinanciamento)}
                      className="pr-16"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      {t("fields.loanTerm.suffix")}
                    </span>
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

                <div className="space-y-2 sm:col-span-2">
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
                  <div className="relative max-w-xs">
                    <Input
                      id="correcaoAnualImovel"
                      type="text"
                      inputMode="decimal"
                      placeholder={t("fields.annualPropertyAppreciation.placeholder")}
                      value={correcaoAnualImovel}
                      onChange={(e) => handlePercentChange(e.target.value, setCorrecaoAnualImovel)}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção Consórcio */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                {t("sections.consorcio.title")}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mesesConsorcio">{t("fields.consorcioTerm.label")}</Label>
                  <div className="relative">
                    <Input
                      id="mesesConsorcio"
                      type="text"
                      inputMode="numeric"
                      placeholder={t("fields.consorcioTerm.placeholder")}
                      value={mesesConsorcio}
                      onChange={(e) => handleMesesChange(e.target.value, setMesesConsorcio)}
                      className="pr-16"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      {t("fields.consorcioTerm.suffix")}
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
                    <Label htmlFor="correcaoAnualConsorcio">{t("fields.annualAdjustment.label")}</Label>
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
                      id="correcaoAnualConsorcio"
                      type="text"
                      inputMode="decimal"
                      placeholder={t("fields.annualAdjustment.placeholder")}
                      value={correcaoAnualConsorcio}
                      onChange={(e) => handlePercentChange(e.target.value, setCorrecaoAnualConsorcio)}
                      className="pr-8"
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
                      onChange={(e) => handleMesesChange(e.target.value, setMesContemplacao)}
                      className="pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      {t("fields.contemplationMonth.suffix")}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="agioCartaContemplada">{t("fields.premium.label")}</Label>
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
                      id="agioCartaContemplada"
                      type="text"
                      inputMode="numeric"
                      placeholder={t("fields.premium.placeholder")}
                      value={agioCartaContemplada}
                      onChange={(e) => handleCurrencyChange(e.target.value, setAgioCartaContemplada)}
                      className={`pl-10 ${lanceAgioError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                  </div>
                </div>
              </div>

              {lanceAgioError ? (
                <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 mt-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-400">
                    <strong>{t("lanceAgioError.title")}</strong> {t("lanceAgioError.message")}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center mt-2 px-2">
                  <strong>{t("lanceAgioNote.title")}</strong> {t("lanceAgioNote.message")}
                </p>
              )}
            </div>

            {/* Seção Aluguel */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                {t("sections.rent.title")}
              </h3>
              <p className="text-xs text-muted-foreground">{t("sections.rent.description")}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="aluguelMensal">{t("fields.monthlyRent.label")}</Label>
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
                        <p>{t("fields.monthlyRent.help")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
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
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção Investimento */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                {t("sections.investment.title")}
              </h3>
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
                <div className="relative max-w-xs">
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
                <p className="text-xs text-muted-foreground">{t("sections.investment.note")}</p>
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

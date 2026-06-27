"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Calculator, CircleDollarSign, Goal, Percent, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrencyFromNumber, formatCurrencyInput, parseCurrencyValue } from "@/lib/utils/index";
import {
  getDefaultInvestimentoInputs,
  validateInvestimentoInputs,
  type InvestimentoAporteTiming,
  type InvestimentoInputs,
  type InvestimentoMode,
  type InvestimentoTaxaPeriodo,
} from "@/lib/calculators/investimento";

interface CalculatorFormProps {
  onCalculate: (inputs: InvestimentoInputs) => void;
  initialValues?: InvestimentoInputs | null;
}

const MODE_OPTIONS: InvestimentoMode[] = ["projection", "requiredContribution", "timeToGoal"];

function currencyInitial(value: number): string {
  if (value === 0) return "0,00";
  return formatCurrencyFromNumber(value);
}

function percentInitial(value: number | null): string {
  if (value === null) return "";
  return value.toString().replace(".", ",");
}

function parsePercent(value: string): number {
  if (!value) return 0;
  return Number(value.replace(",", ".")) || 0;
}

function formatSignedPercentInput(value: string): string {
  const normalized = value.replace(".", ",").replace(/[^\d,-]/g, "");
  const negative = normalized.trim().startsWith("-");
  const digits = normalized.replace(/-/g, "");
  const [integerPart, ...decimalParts] = digits.split(",");
  const decimalPart = decimalParts.join("").slice(0, 4);
  const prefix = negative ? "-" : "";

  if (digits.includes(",")) return `${prefix}${integerPart},${decimalPart}`;
  return `${prefix}${integerPart}`;
}

function integerInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 3);
}

export function CalculatorForm({ onCalculate, initialValues }: CalculatorFormProps) {
  const t = useTranslations("calculators.investimento.form");
  const defaults = useMemo(() => initialValues ?? getDefaultInvestimentoInputs(), [initialValues]);

  const [mode, setMode] = useState<InvestimentoMode>(defaults.mode);
  const [valorInicial, setValorInicial] = useState(() => currencyInitial(defaults.valorInicial));
  const [aporteMensal, setAporteMensal] = useState(() => currencyInitial(defaults.aporteMensal));
  const [metaValor, setMetaValor] = useState(() => currencyInitial(defaults.metaValor));
  const [prazoMeses, setPrazoMeses] = useState(() => defaults.prazoMeses.toString());
  const [taxa, setTaxa] = useState(() => percentInitial(defaults.taxa));
  const [taxaPeriodo, setTaxaPeriodo] = useState<InvestimentoTaxaPeriodo>(defaults.taxaPeriodo);
  const [aporteTiming, setAporteTiming] = useState<InvestimentoAporteTiming>(defaults.aporteTiming);
  const [inflacaoAnual, setInflacaoAnual] = useState(() => percentInitial(defaults.inflacaoAnual));
  const [error, setError] = useState<string | null>(null);

  const showAporteMensal = mode !== "requiredContribution";
  const showMetaValor = mode !== "projection";
  const showPrazoMeses = mode !== "timeToGoal";

  const handleCurrencyChange = (value: string, setter: (next: string) => void) => {
    setter(formatCurrencyInput(value));
  };

  const buildInputs = (): InvestimentoInputs => ({
    mode,
    valorInicial: parseCurrencyValue(valorInicial),
    aporteMensal: parseCurrencyValue(aporteMensal),
    metaValor: parseCurrencyValue(metaValor),
    prazoMeses: parseInt(prazoMeses, 10) || 0,
    taxa: parsePercent(taxa),
    taxaPeriodo,
    aporteTiming,
    inflacaoAnual: inflacaoAnual.trim() === "" ? null : parsePercent(inflacaoAnual),
  });

  const resetDefaults = () => {
    const next = getDefaultInvestimentoInputs();
    setMode(next.mode);
    setValorInicial(currencyInitial(next.valorInicial));
    setAporteMensal(currencyInitial(next.aporteMensal));
    setMetaValor(currencyInitial(next.metaValor));
    setPrazoMeses(next.prazoMeses.toString());
    setTaxa(percentInitial(next.taxa));
    setTaxaPeriodo(next.taxaPeriodo);
    setAporteTiming(next.aporteTiming);
    setInflacaoAnual("");
    setError(null);
    onCalculate(next);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const inputs = buildInputs();
    const errors = validateInvestimentoInputs(inputs);

    if (errors.length > 0) {
      setError(t(`validation.${errors[0]}`));
      return;
    }

    setError(null);
    onCalculate(inputs);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-5 w-5" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="space-y-3" aria-labelledby="investimento-modo">
            <h2 id="investimento-modo" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("sections.mode")}
            </h2>
            <div className="grid gap-2 sm:grid-cols-3" role="group" aria-label={t("sections.mode")}>
              {MODE_OPTIONS.map((option) => (
                <Button
                  key={option}
                  id={`mode-${option}`}
                  type="button"
                  variant={mode === option ? "default" : "outline"}
                  className="h-auto min-h-11 whitespace-normal px-3 py-2 text-sm"
                  aria-pressed={mode === option}
                  onClick={() => setMode(option)}>
                  {t(`modes.${option}`)}
                </Button>
              ))}
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="investimento-cenario">
            <h2
              id="investimento-cenario"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <CircleDollarSign className="h-4 w-4" />
              {t("sections.scenario")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="valorInicial">{t("fields.valorInicial.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="valorInicial"
                    inputMode="numeric"
                    value={valorInicial}
                    onChange={(event) => handleCurrencyChange(event.target.value, setValorInicial)}
                    placeholder={t("fields.valorInicial.placeholder")}
                    className="pl-10"
                  />
                </div>
              </div>

              {showAporteMensal && (
                <div className="space-y-2">
                  <Label htmlFor="aporteMensal">{t("fields.aporteMensal.label")}</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                    <Input
                      id="aporteMensal"
                      inputMode="numeric"
                      value={aporteMensal}
                      onChange={(event) => handleCurrencyChange(event.target.value, setAporteMensal)}
                      placeholder={t("fields.aporteMensal.placeholder")}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              {showMetaValor && (
                <div className="space-y-2">
                  <Label htmlFor="metaValor">{t("fields.metaValor.label")}</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                    <Input
                      id="metaValor"
                      inputMode="numeric"
                      value={metaValor}
                      onChange={(event) => handleCurrencyChange(event.target.value, setMetaValor)}
                      placeholder={t("fields.metaValor.placeholder")}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              {showPrazoMeses && (
                <div className="space-y-2">
                  <Label htmlFor="prazoMeses">{t("fields.prazoMeses.label")}</Label>
                  <div className="relative">
                    <Input
                      id="prazoMeses"
                      inputMode="numeric"
                      value={prazoMeses}
                      onChange={(event) => setPrazoMeses(integerInput(event.target.value))}
                      placeholder={t("fields.prazoMeses.placeholder")}
                      className="pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {t("fields.prazoMeses.suffix")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="investimento-premissas">
            <h2
              id="investimento-premissas"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Percent className="h-4 w-4" />
              {t("sections.assumptions")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="taxa">{t("fields.taxa.label")}</Label>
                <div className="relative">
                  <Input
                    id="taxa"
                    inputMode="decimal"
                    value={taxa}
                    onChange={(event) => setTaxa(formatSignedPercentInput(event.target.value))}
                    placeholder={t("fields.taxa.placeholder")}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">{t("helpers.taxa")}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxaPeriodo">{t("fields.taxaPeriodo.label")}</Label>
                <Select value={taxaPeriodo} onValueChange={(value) => setTaxaPeriodo(value as InvestimentoTaxaPeriodo)}>
                  <SelectTrigger id="taxaPeriodo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anualEfetiva">{t("fields.taxaPeriodo.options.anualEfetiva")}</SelectItem>
                    <SelectItem value="mensal">{t("fields.taxaPeriodo.options.mensal")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aporteTiming">{t("fields.aporteTiming.label")}</Label>
                <Select value={aporteTiming} onValueChange={(value) => setAporteTiming(value as InvestimentoAporteTiming)}>
                  <SelectTrigger id="aporteTiming">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fim">{t("fields.aporteTiming.options.fim")}</SelectItem>
                    <SelectItem value="inicio">{t("fields.aporteTiming.options.inicio")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inflacaoAnual">{t("fields.inflacaoAnual.label")}</Label>
                <div className="relative">
                  <Input
                    id="inflacaoAnual"
                    inputMode="decimal"
                    value={inflacaoAnual}
                    onChange={(event) => setInflacaoAnual(formatSignedPercentInput(event.target.value))}
                    placeholder={t("fields.inflacaoAnual.placeholder")}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">{t("helpers.inflacao")}</p>
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" className="sm:w-auto">
              <Goal className="mr-2 h-4 w-4" />
              {t("submit")}
            </Button>
            <Button type="button" variant="outline" className="sm:w-auto" onClick={resetDefaults}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {t("reset")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

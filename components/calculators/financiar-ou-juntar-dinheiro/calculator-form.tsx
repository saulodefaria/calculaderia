"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Calculator, Home, Landmark, PiggyBank, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getDefaultFinanciarOuJuntarDinheiroInputs,
  validateFinanciarOuJuntarDinheiroInputs,
  type FinanciarOuJuntarDinheiroInputs,
  type FinanciarOuJuntarValidationError,
} from "@/lib/calculators/financiar-ou-juntar-dinheiro";
import type { MetodoAmortizacao } from "@/lib/calculators/financiamento";

interface CalculatorFormProps {
  initialValues?: FinanciarOuJuntarDinheiroInputs | null;
  onCalculate: (inputs: FinanciarOuJuntarDinheiroInputs) => void;
}

const FORM_ERROR_ID = "financiar-form-error";
const VALIDATION_FIELD_IDS: Record<FinanciarOuJuntarValidationError, string> = {
  valorImovel: "financiar-valor-imovel",
  capitalInicial: "financiar-capital-inicial",
  metodo: "financiar-metodo",
  taxaFinanciamentoAnual: "financiar-taxa-financiamento",
  prazoFinanciamentoMeses: "financiar-prazo-financiamento",
  valorizacaoAnualImovel: "financiar-valorizacao-imovel",
  aporteMensalLiquido: "financiar-aporte-mensal",
  rendimentoAnualInvestimento: "financiar-rendimento-investimento",
  aluguelMensalInicial: "financiar-aluguel-inicial",
  crescimentoAnualAluguel: "financiar-crescimento-aluguel",
  horizonteMeses: "financiar-horizonte",
};

function describedBy(baseId: string | undefined, invalid: boolean): string | undefined {
  const ids = [baseId, invalid ? FORM_ERROR_ID : undefined].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

function inputLocale(locale: string): string {
  if (locale === "en") return "en-US";
  if (locale === "es") return "es-ES";
  return "pt-BR";
}

function formatMoneyInput(value: number, locale: string): string {
  return new Intl.NumberFormat(inputLocale(locale), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCurrencyTyping(raw: string, locale: string): string {
  if (/[A-Za-z+-]/.test(raw)) return "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return formatMoneyInput(Number(digits) / 100, locale);
}

function parseCurrencyTyping(value: string): number {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) / 100 : 0;
}

function formatPercentTyping(raw: string, locale: string): string {
  if (/[A-Za-z+-]/.test(raw)) return "";
  const cleaned = raw.replace(/[^\d.,]/g, "");
  const parts = cleaned.split(/[.,]/);
  const integer = parts.shift() ?? "";
  if (!/[.,]/.test(cleaned)) return integer;
  const separator = locale === "en" ? "." : ",";
  return `${integer}${separator}${parts.join("").slice(0, 4)}`;
}

function formatPercentInitial(value: number, locale: string): string {
  return value.toString().replace(".", locale === "en" ? "." : ",");
}

function parsePercent(value: string): number {
  if (!value.trim()) return 0;
  return Number(value.replace(",", "."));
}

function integerTyping(value: string): string {
  return value.replace(/\D/g, "").slice(0, 4);
}

export function CalculatorForm({ initialValues, onCalculate }: CalculatorFormProps) {
  const t = useTranslations("calculators.financiar-ou-juntar-dinheiro.form");
  const locale = useLocale();
  const defaults = useMemo(() => initialValues ?? getDefaultFinanciarOuJuntarDinheiroInputs(), [initialValues]);
  const [valorImovel, setValorImovel] = useState(() => formatMoneyInput(defaults.valorImovel, locale));
  const [capitalInicial, setCapitalInicial] = useState(() => formatMoneyInput(defaults.capitalInicial, locale));
  const [metodo, setMetodo] = useState<MetodoAmortizacao>(defaults.metodo);
  const [taxaFinanciamento, setTaxaFinanciamento] = useState(() =>
    formatPercentInitial(defaults.taxaFinanciamentoAnual, locale)
  );
  const [prazoFinanciamento, setPrazoFinanciamento] = useState(() => defaults.prazoFinanciamentoMeses.toString());
  const [valorizacaoImovel, setValorizacaoImovel] = useState(() =>
    formatPercentInitial(defaults.valorizacaoAnualImovel, locale)
  );
  const [aporteMensal, setAporteMensal] = useState(() => formatMoneyInput(defaults.aporteMensalLiquido, locale));
  const [rendimentoInvestimento, setRendimentoInvestimento] = useState(() =>
    formatPercentInitial(defaults.rendimentoAnualInvestimento, locale)
  );
  const [aluguelInicial, setAluguelInicial] = useState(() => formatMoneyInput(defaults.aluguelMensalInicial, locale));
  const [crescimentoAluguel, setCrescimentoAluguel] = useState(() =>
    formatPercentInitial(defaults.crescimentoAnualAluguel, locale)
  );
  const [horizonte, setHorizonte] = useState(() => defaults.horizonteMeses.toString());
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<FinanciarOuJuntarValidationError | null>(null);

  const showValidationError = (field: FinanciarOuJuntarValidationError) => {
    setErrorField(field);
    setError(t(`validation.${field}`));
    requestAnimationFrame(() => document.getElementById(VALIDATION_FIELD_IDS[field])?.focus());
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const requiredRawFields = [
      [valorImovel, "valorImovel"],
      [capitalInicial, "capitalInicial"],
      [taxaFinanciamento, "taxaFinanciamentoAnual"],
      [prazoFinanciamento, "prazoFinanciamentoMeses"],
      [valorizacaoImovel, "valorizacaoAnualImovel"],
      [aporteMensal, "aporteMensalLiquido"],
      [rendimentoInvestimento, "rendimentoAnualInvestimento"],
      [aluguelInicial, "aluguelMensalInicial"],
      [crescimentoAluguel, "crescimentoAnualAluguel"],
      [horizonte, "horizonteMeses"],
    ] as const;
    const emptyField = requiredRawFields.find(([value]) => value.trim() === "");
    if (emptyField) {
      showValidationError(emptyField[1]);
      return;
    }

    const inputs: FinanciarOuJuntarDinheiroInputs = {
      valorImovel: parseCurrencyTyping(valorImovel),
      capitalInicial: parseCurrencyTyping(capitalInicial),
      metodo,
      taxaFinanciamentoAnual: parsePercent(taxaFinanciamento),
      prazoFinanciamentoMeses: Number(prazoFinanciamento),
      valorizacaoAnualImovel: parsePercent(valorizacaoImovel),
      aporteMensalLiquido: parseCurrencyTyping(aporteMensal),
      rendimentoAnualInvestimento: parsePercent(rendimentoInvestimento),
      aluguelMensalInicial: parseCurrencyTyping(aluguelInicial),
      crescimentoAnualAluguel: parsePercent(crescimentoAluguel),
      horizonteMeses: Number(horizonte),
    };
    const errors = validateFinanciarOuJuntarDinheiroInputs(inputs);
    if (errors.length > 0) {
      showValidationError(errors[0]);
      return;
    }

    setError(null);
    setErrorField(null);
    onCalculate(inputs);
  };

  const currencyField = (
    id: string,
    label: string,
    value: string,
    setter: (value: string) => void,
    helperId?: string
  ) => (
    (() => {
      const invalid = errorField !== null && VALIDATION_FIELD_IDS[errorField] === id;
      return (
        <div className="space-y-2">
          <Label htmlFor={id}>{label}</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
            <Input
              id={id}
              inputMode="numeric"
              value={value}
              onChange={(event) => setter(formatCurrencyTyping(event.target.value, locale))}
              className="pl-10"
              aria-invalid={invalid}
              aria-describedby={describedBy(helperId, invalid)}
            />
          </div>
        </div>
      );
    })()
  );

  const percentField = (
    id: string,
    label: string,
    value: string,
    setter: (value: string) => void,
    helperId?: string
  ) =>
    (() => {
      const invalid = errorField !== null && VALIDATION_FIELD_IDS[errorField] === id;
      return (
        <div className="space-y-2">
          <Label htmlFor={id}>{label}</Label>
          <div className="relative">
            <Input
              id={id}
              inputMode="decimal"
              value={value}
              onChange={(event) => setter(formatPercentTyping(event.target.value, locale))}
              className="pr-8"
              aria-invalid={invalid}
              aria-describedby={describedBy(helperId, invalid)}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
          </div>
        </div>
      );
    })();

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
          <section className="space-y-4" aria-labelledby="financiar-imovel-capital-heading">
            <h2
              id="financiar-imovel-capital-heading"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Home className="h-4 w-4" />
              {t("sections.property")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {currencyField("financiar-valor-imovel", t("fields.valorImovel.label"), valorImovel, setValorImovel)}
              {currencyField(
                "financiar-capital-inicial",
                t("fields.capitalInicial.label"),
                capitalInicial,
                setCapitalInicial
              )}
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="financiar-agora-heading">
            <h2
              id="financiar-agora-heading"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Landmark className="h-4 w-4" />
              {t("sections.finance")}
            </h2>
            <p id="financiar-taxa-help" className="text-sm text-muted-foreground">
              {t("helpers.effectiveAnnualRate")}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="financiar-metodo">{t("fields.metodo.label")}</Label>
                <Select value={metodo} onValueChange={(value) => setMetodo(value as MetodoAmortizacao)}>
                  <SelectTrigger
                    id="financiar-metodo"
                    className="w-full"
                    aria-invalid={errorField === "metodo"}
                    aria-describedby={describedBy(undefined, errorField === "metodo")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sac">{t("fields.metodo.options.sac")}</SelectItem>
                    <SelectItem value="price">{t("fields.metodo.options.price")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {percentField(
                "financiar-taxa-financiamento",
                t("fields.taxaFinanciamento.label"),
                taxaFinanciamento,
                setTaxaFinanciamento,
                "financiar-taxa-help"
              )}
              <div className="space-y-2">
                <Label htmlFor="financiar-prazo-financiamento">{t("fields.prazoFinanciamento.label")}</Label>
                <Input
                  id="financiar-prazo-financiamento"
                  inputMode="numeric"
                  value={prazoFinanciamento}
                  onChange={(event) => setPrazoFinanciamento(integerTyping(event.target.value))}
                  aria-invalid={errorField === "prazoFinanciamentoMeses"}
                  aria-describedby={describedBy(undefined, errorField === "prazoFinanciamentoMeses")}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="financiar-juntar-heading">
            <h2
              id="financiar-juntar-heading"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <PiggyBank className="h-4 w-4" />
              {t("sections.save")}
            </h2>
            <p id="financiar-aporte-help" className="text-sm text-muted-foreground">
              {t("helpers.monthEndContribution")}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {percentField(
                "financiar-valorizacao-imovel",
                t("fields.valorizacaoImovel.label"),
                valorizacaoImovel,
                setValorizacaoImovel,
                "financiar-taxa-help"
              )}
              {currencyField(
                "financiar-aporte-mensal",
                t("fields.aporteMensal.label"),
                aporteMensal,
                setAporteMensal,
                "financiar-aporte-help"
              )}
              {percentField(
                "financiar-rendimento-investimento",
                t("fields.rendimentoInvestimento.label"),
                rendimentoInvestimento,
                setRendimentoInvestimento,
                "financiar-taxa-help"
              )}
              {currencyField(
                "financiar-aluguel-inicial",
                t("fields.aluguelInicial.label"),
                aluguelInicial,
                setAluguelInicial,
                "financiar-aporte-help"
              )}
              {percentField(
                "financiar-crescimento-aluguel",
                t("fields.crescimentoAluguel.label"),
                crescimentoAluguel,
                setCrescimentoAluguel,
                "financiar-taxa-help"
              )}
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="financiar-horizonte-heading">
            <h2
              id="financiar-horizonte-heading"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Timer className="h-4 w-4" />
              {t("sections.horizon")}
            </h2>
            <div className="max-w-sm space-y-2">
              <Label htmlFor="financiar-horizonte">{t("fields.horizonte.label")}</Label>
              <Input
                id="financiar-horizonte"
                inputMode="numeric"
                value={horizonte}
                onChange={(event) => setHorizonte(integerTyping(event.target.value))}
                aria-invalid={errorField === "horizonteMeses"}
                aria-describedby={describedBy(undefined, errorField === "horizonteMeses")}
              />
            </div>
          </section>

          {error && (
            <div
              id={FORM_ERROR_ID}
              role="alert"
              className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full sm:w-auto">
            {t("submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

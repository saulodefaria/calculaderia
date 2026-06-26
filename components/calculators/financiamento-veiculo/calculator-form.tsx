"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Calculator, Car, Percent, Scale, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatCurrencyFromNumber,
  formatCurrencyInput,
  formatPercentFromNumber,
  formatPercentInput,
  parseCurrencyValue,
  parsePercentValue,
} from "@/lib/utils/index";
import {
  getDefaultFinanciamentoVeiculoInputs,
  validateFinanciamentoVeiculoInputs,
  type FinanciamentoVeiculoInputs,
  type FinanciamentoVeiculoMetodo,
} from "@/lib/calculators/financiamento-veiculo";

interface CalculatorFormProps {
  onCalculate: (inputs: FinanciamentoVeiculoInputs) => void;
  initialValues?: FinanciamentoVeiculoInputs | null;
}

function currencyInitial(value: number | undefined, preserveZero = false): string {
  if (value === 0 && preserveZero) return "0,00";
  return value && value > 0 ? formatCurrencyFromNumber(value) : "";
}

function toInteger(value: string): number {
  return parseInt(value, 10) || 0;
}

function sanitizeInteger(value: string): string {
  return value.replace(/\D/g, "").slice(0, 3);
}

export function CalculatorForm({ onCalculate, initialValues }: CalculatorFormProps) {
  const t = useTranslations("calculators.financiamento-veiculo.form");
  const defaults = useMemo(() => initialValues ?? getDefaultFinanciamentoVeiculoInputs(), [initialValues]);
  const [valorVeiculo, setValorVeiculo] = useState(() => currencyInitial(defaults.valorVeiculo));
  const [entrada, setEntrada] = useState(() => currencyInitial(defaults.entrada, true));
  const [custosFinanciados, setCustosFinanciados] = useState(() =>
    currencyInitial(defaults.custosFinanciados, true)
  );
  const [custosAVista, setCustosAVista] = useState(() => currencyInitial(defaults.custosAVista, true));
  const [taxaJurosMensal, setTaxaJurosMensal] = useState(() =>
    formatPercentFromNumber(defaults.taxaJurosMensal)
  );
  const [prazoMeses, setPrazoMeses] = useState(defaults.prazoMeses.toString());
  const [metodo, setMetodo] = useState<FinanciamentoVeiculoMetodo>(defaults.metodo);
  const [compararMetodos, setCompararMetodos] = useState(defaults.compararMetodos);
  const [error, setError] = useState<string | null>(null);

  const handleCurrencyChange = (value: string, setter: (next: string) => void) => {
    setter(formatCurrencyInput(value));
  };

  const buildInputs = (): FinanciamentoVeiculoInputs => ({
    valorVeiculo: parseCurrencyValue(valorVeiculo),
    entrada: parseCurrencyValue(entrada),
    custosFinanciados: parseCurrencyValue(custosFinanciados),
    custosAVista: parseCurrencyValue(custosAVista),
    taxaJurosMensal: parsePercentValue(taxaJurosMensal),
    prazoMeses: toInteger(prazoMeses),
    metodo,
    compararMetodos,
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const inputs = buildInputs();
    const errors = validateFinanciamentoVeiculoInputs(inputs);

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
          <section className="space-y-4" aria-labelledby="financiamento-veiculo-bem">
            <h2
              id="financiamento-veiculo-bem"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Car className="h-4 w-4" />
              {t("sections.vehicle")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("helpers.vehicle")}</p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="valorVeiculo">{t("fields.valorVeiculo.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="valorVeiculo"
                    inputMode="numeric"
                    value={valorVeiculo}
                    onChange={(event) => handleCurrencyChange(event.target.value, setValorVeiculo)}
                    placeholder={t("fields.valorVeiculo.placeholder")}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="entrada">{t("fields.entrada.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="entrada"
                    inputMode="numeric"
                    value={entrada}
                    onChange={(event) => handleCurrencyChange(event.target.value, setEntrada)}
                    placeholder={t("fields.entrada.placeholder")}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="custosFinanciados">{t("fields.custosFinanciados.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="custosFinanciados"
                    inputMode="numeric"
                    value={custosFinanciados}
                    onChange={(event) => handleCurrencyChange(event.target.value, setCustosFinanciados)}
                    placeholder={t("fields.custosFinanciados.placeholder")}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t("helpers.financedCosts")}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="custosAVista">{t("fields.custosAVista.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="custosAVista"
                    inputMode="numeric"
                    value={custosAVista}
                    onChange={(event) => handleCurrencyChange(event.target.value, setCustosAVista)}
                    placeholder={t("fields.custosAVista.placeholder")}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t("helpers.upfrontCosts")}</p>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="financiamento-veiculo-condicoes">
            <h2
              id="financiamento-veiculo-condicoes"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Percent className="h-4 w-4" />
              {t("sections.terms")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("helpers.terms")}</p>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_minmax(220px,0.9fr)]">
              <div className="space-y-2">
                <Label htmlFor="taxaJurosMensal">{t("fields.taxaJurosMensal.label")}</Label>
                <div className="relative">
                  <Input
                    id="taxaJurosMensal"
                    inputMode="decimal"
                    value={taxaJurosMensal}
                    onChange={(event) => setTaxaJurosMensal(formatPercentInput(event.target.value))}
                    placeholder={t("fields.taxaJurosMensal.placeholder")}
                    className="pr-10"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prazoMeses">{t("fields.prazoMeses.label")}</Label>
                <div className="relative">
                  <Input
                    id="prazoMeses"
                    inputMode="numeric"
                    value={prazoMeses}
                    onChange={(event) => setPrazoMeses(sanitizeInteger(event.target.value))}
                    min={1}
                    max={120}
                    required
                    className="pr-20"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {t("fields.prazoMeses.suffix")}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("fields.metodo.label")}</Label>
                <div className="grid grid-cols-2 rounded-md border p-1" role="group" aria-label={t("fields.metodo.label")}>
                  {(["price", "sac"] as const).map((option) => (
                    <button
                      key={option}
                      id={`metodo-${option}`}
                      type="button"
                      aria-pressed={metodo === option}
                      onClick={() => setMetodo(option)}
                      className={`flex min-h-10 items-center justify-center rounded-sm px-3 text-sm font-medium transition-colors ${
                        metodo === option ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                      }`}>
                      {t(`fields.metodo.options.${option}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3 rounded-md border bg-muted/20 p-4" aria-labelledby="financiamento-veiculo-comparacao">
            <h2 id="financiamento-veiculo-comparacao" className="flex items-center gap-2 text-sm font-semibold">
              <Scale className="h-4 w-4" />
              {t("sections.comparison")}
            </h2>
            <label htmlFor="compararMetodos" className="flex items-start gap-3 text-sm">
              <input
                id="compararMetodos"
                type="checkbox"
                checked={compararMetodos}
                onChange={(event) => setCompararMetodos(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border"
              />
              <span>
                <span className="font-medium">{t("fields.compararMetodos.label")}</span>
                <span className="block text-muted-foreground">{t("fields.compararMetodos.help")}</span>
              </span>
            </label>
          </section>

          <div className="rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <span className="inline-flex items-start gap-2">
              <WalletCards className="mt-0.5 h-4 w-4 flex-none" />
              <span>{t("helpers.sourceBadge")}</span>
            </span>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
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

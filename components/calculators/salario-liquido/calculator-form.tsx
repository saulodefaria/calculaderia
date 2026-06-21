"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Calculator, Landmark, ReceiptText, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrencyFromNumber, formatCurrencyInput, parseCurrencyValue } from "@/lib/utils/index";
import {
  getDefaultSalarioLiquidoInputs,
  validateSalarioLiquidoInputs,
  type SalarioLiquidoInputs,
} from "@/lib/calculators/salario-liquido";

interface CalculatorFormProps {
  onCalculate: (inputs: SalarioLiquidoInputs) => void;
  initialValues?: SalarioLiquidoInputs | null;
}

function currencyInitial(value: number | undefined): string {
  return value && value > 0 ? formatCurrencyFromNumber(value) : "";
}

function toInteger(value: string): number {
  return parseInt(value, 10) || 0;
}

function sanitizeDependents(value: string): string {
  return value.replace(/\D/g, "").slice(0, 2);
}

export function CalculatorForm({ onCalculate, initialValues }: CalculatorFormProps) {
  const t = useTranslations("calculators.salario-liquido.form");
  const defaults = useMemo(() => initialValues ?? getDefaultSalarioLiquidoInputs(), [initialValues]);

  const [salarioBruto, setSalarioBruto] = useState(() => currencyInitial(defaults.salarioBruto));
  const [outrosProventosTributaveis, setOutrosProventosTributaveis] = useState(() =>
    currencyInitial(defaults.outrosProventosTributaveis)
  );
  const [outrosProventosNaoTributaveis, setOutrosProventosNaoTributaveis] = useState(() =>
    currencyInitial(defaults.outrosProventosNaoTributaveis)
  );
  const [dependentesIr, setDependentesIr] = useState(defaults.dependentesIr.toString());
  const [pensaoAlimenticia, setPensaoAlimenticia] = useState(() => currencyInitial(defaults.pensaoAlimenticia));
  const [descontosManuais, setDescontosManuais] = useState(() => currencyInitial(defaults.descontosManuais));
  const [adiantamentos, setAdiantamentos] = useState(() => currencyInitial(defaults.adiantamentos));
  const [calcularDescontosLegais, setCalcularDescontosLegais] = useState(defaults.calcularDescontosLegais);
  const [error, setError] = useState<string | null>(null);

  const handleCurrencyChange = (value: string, setter: (next: string) => void) => {
    setter(formatCurrencyInput(value));
  };

  const buildInputs = (): SalarioLiquidoInputs => ({
    salarioBruto: parseCurrencyValue(salarioBruto),
    outrosProventosTributaveis: parseCurrencyValue(outrosProventosTributaveis),
    outrosProventosNaoTributaveis: parseCurrencyValue(outrosProventosNaoTributaveis),
    dependentesIr: toInteger(dependentesIr),
    pensaoAlimenticia: parseCurrencyValue(pensaoAlimenticia),
    descontosManuais: parseCurrencyValue(descontosManuais),
    adiantamentos: parseCurrencyValue(adiantamentos),
    calcularDescontosLegais,
    tabelaAno: 2026,
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const inputs = buildInputs();
    const errors = validateSalarioLiquidoInputs(inputs);

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
          <section className="space-y-4" aria-labelledby="salario-liquido-proventos">
            <h2
              id="salario-liquido-proventos"
              className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("sections.earnings")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("helpers.earnings")}</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="salarioBruto">{t("fields.salarioBruto.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="salarioBruto"
                    inputMode="numeric"
                    value={salarioBruto}
                    onChange={(event) => handleCurrencyChange(event.target.value, setSalarioBruto)}
                    placeholder={t("fields.salarioBruto.placeholder")}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="outrosProventosTributaveis">
                  {t("fields.outrosProventosTributaveis.label")}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="outrosProventosTributaveis"
                    inputMode="numeric"
                    value={outrosProventosTributaveis}
                    onChange={(event) => handleCurrencyChange(event.target.value, setOutrosProventosTributaveis)}
                    placeholder={t("fields.outrosProventosTributaveis.placeholder")}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="outrosProventosNaoTributaveis">
                  {t("fields.outrosProventosNaoTributaveis.label")}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="outrosProventosNaoTributaveis"
                    inputMode="numeric"
                    value={outrosProventosNaoTributaveis}
                    onChange={(event) => handleCurrencyChange(event.target.value, setOutrosProventosNaoTributaveis)}
                    placeholder={t("fields.outrosProventosNaoTributaveis.placeholder")}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="salario-liquido-irrf">
            <h2
              id="salario-liquido-irrf"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Landmark className="h-4 w-4" />
              {t("sections.irrf")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dependentesIr">{t("fields.dependentesIr.label")}</Label>
                <Input
                  id="dependentesIr"
                  inputMode="numeric"
                  value={dependentesIr}
                  onChange={(event) => setDependentesIr(sanitizeDependents(event.target.value))}
                  min={0}
                  max={20}
                />
                <p className="text-xs text-muted-foreground">{t("helpers.dependents")}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pensaoAlimenticia">{t("fields.pensaoAlimenticia.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="pensaoAlimenticia"
                    inputMode="numeric"
                    value={pensaoAlimenticia}
                    onChange={(event) => handleCurrencyChange(event.target.value, setPensaoAlimenticia)}
                    placeholder={t("fields.pensaoAlimenticia.placeholder")}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="salario-liquido-descontos">
            <h2
              id="salario-liquido-descontos"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <WalletCards className="h-4 w-4" />
              {t("sections.discounts")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="descontosManuais">{t("fields.descontosManuais.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="descontosManuais"
                    inputMode="numeric"
                    value={descontosManuais}
                    onChange={(event) => handleCurrencyChange(event.target.value, setDescontosManuais)}
                    placeholder={t("fields.descontosManuais.placeholder")}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t("helpers.manualDiscounts")}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adiantamentos">{t("fields.adiantamentos.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="adiantamentos"
                    inputMode="numeric"
                    value={adiantamentos}
                    onChange={(event) => handleCurrencyChange(event.target.value, setAdiantamentos)}
                    placeholder={t("fields.adiantamentos.placeholder")}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="salario-liquido-tabelas">
            <h2
              id="salario-liquido-tabelas"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <ReceiptText className="h-4 w-4" />
              {t("sections.tables")}
            </h2>
            <div className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Label htmlFor="calcularDescontosLegais" className="text-sm font-medium">
                  {t("fields.calcularDescontosLegais.label")}
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">{t("helpers.legalDeductions")}</p>
              </div>
              <input
                id="calcularDescontosLegais"
                type="checkbox"
                checked={calcularDescontosLegais}
                onChange={(event) => setCalcularDescontosLegais(event.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
            </div>
            <div className="rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              {t("helpers.tableBadge")}
            </div>
          </section>

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

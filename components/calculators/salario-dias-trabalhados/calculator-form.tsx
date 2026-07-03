"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Calculator, CalendarClock, Landmark, ReceiptText, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrencyFromNumber, formatCurrencyInput, parseCurrencyValue } from "@/lib/utils/index";
import {
  getDefaultSalarioDiasTrabalhadosInputs,
  validateSalarioDiasTrabalhadosInputs,
  type SalarioDiasTrabalhadosDivisorModo,
  type SalarioDiasTrabalhadosInputs,
} from "@/lib/calculators/salario-dias-trabalhados";

interface CalculatorFormProps {
  onCalculate: (inputs: SalarioDiasTrabalhadosInputs) => void;
  initialValues?: SalarioDiasTrabalhadosInputs | null;
}

const DIVISOR_MODES: SalarioDiasTrabalhadosDivisorModo[] = ["comercial30", "diasDoMes", "manual"];

function currencyInitial(value: number | undefined): string {
  return value && value > 0 ? formatCurrencyFromNumber(value) : "";
}

function toInteger(value: string): number {
  return parseInt(value, 10) || 0;
}

function toDecimal(value: string): number {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function sanitizeInteger(value: string, maxLength = 2): string {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function sanitizeDecimal(value: string): string {
  return value.replace(/[^\d,.]/g, "").replace(/(.*[,.].*)[,.]/, "$1").slice(0, 5);
}

export function CalculatorForm({ onCalculate, initialValues }: CalculatorFormProps) {
  const t = useTranslations("calculators.salario-dias-trabalhados.form");
  const defaults = useMemo(() => initialValues ?? getDefaultSalarioDiasTrabalhadosInputs(), [initialValues]);

  const [salarioMensal, setSalarioMensal] = useState(() => currencyInitial(defaults.salarioMensal));
  const [diasRemunerados, setDiasRemunerados] = useState(defaults.diasRemunerados.toString());
  const [divisorModo, setDivisorModo] = useState<SalarioDiasTrabalhadosDivisorModo>(defaults.divisorModo);
  const [divisorManual, setDivisorManual] = useState(defaults.divisorManual.toString());
  const [mesReferencia, setMesReferencia] = useState(defaults.mesReferencia);
  const [usarPeriodo, setUsarPeriodo] = useState(defaults.usarPeriodo);
  const [dataInicio, setDataInicio] = useState(defaults.dataInicio);
  const [dataFim, setDataFim] = useState(defaults.dataFim);
  const [outrosProventosTributaveis, setOutrosProventosTributaveis] = useState(() =>
    currencyInitial(defaults.outrosProventosTributaveis)
  );
  const [outrosProventosNaoTributaveis, setOutrosProventosNaoTributaveis] = useState(() =>
    currencyInitial(defaults.outrosProventosNaoTributaveis)
  );
  const [descontosManuais, setDescontosManuais] = useState(() => currencyInitial(defaults.descontosManuais));
  const [dependentesIr, setDependentesIr] = useState(defaults.dependentesIr.toString());
  const [pensaoAlimenticia, setPensaoAlimenticia] = useState(() => currencyInitial(defaults.pensaoAlimenticia));
  const [calcularDescontosLegais, setCalcularDescontosLegais] = useState(defaults.calcularDescontosLegais);
  const [error, setError] = useState<string | null>(null);

  const handleCurrencyChange = (value: string, setter: (next: string) => void) => {
    setter(formatCurrencyInput(value));
  };

  const buildInputs = (): SalarioDiasTrabalhadosInputs => ({
    salarioMensal: parseCurrencyValue(salarioMensal),
    diasRemunerados: toInteger(diasRemunerados),
    divisorModo,
    divisorManual: toDecimal(divisorManual),
    mesReferencia,
    dataInicio,
    dataFim,
    usarPeriodo,
    outrosProventosTributaveis: parseCurrencyValue(outrosProventosTributaveis),
    outrosProventosNaoTributaveis: parseCurrencyValue(outrosProventosNaoTributaveis),
    descontosManuais: parseCurrencyValue(descontosManuais),
    dependentesIr: toInteger(dependentesIr),
    pensaoAlimenticia: parseCurrencyValue(pensaoAlimenticia),
    calcularDescontosLegais,
    tabelaAno: 2026,
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const inputs = buildInputs();
    const errors = validateSalarioDiasTrabalhadosInputs(inputs);

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
          <section className="space-y-4" aria-labelledby="salario-dias-base">
            <h2
              id="salario-dias-base"
              className="text-sm font-semibold uppercase text-muted-foreground">
              {t("sections.salary")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="salarioMensal">{t("fields.salarioMensal.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="salarioMensal"
                    inputMode="numeric"
                    value={salarioMensal}
                    onChange={(event) => handleCurrencyChange(event.target.value, setSalarioMensal)}
                    placeholder={t("fields.salarioMensal.placeholder")}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mesReferencia">{t("fields.mesReferencia.label")}</Label>
                <Input
                  id="mesReferencia"
                  type="month"
                  value={mesReferencia}
                  onChange={(event) => setMesReferencia(event.target.value)}
                  min="1900-01"
                  max="2100-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diasRemunerados">{t("fields.diasRemunerados.label")}</Label>
                <Input
                  id="diasRemunerados"
                  inputMode="numeric"
                  value={diasRemunerados}
                  onChange={(event) => setDiasRemunerados(sanitizeInteger(event.target.value))}
                  min={0}
                  max={31}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="salario-dias-periodo">
            <h2
              id="salario-dias-periodo"
              className="flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              {t("sections.period")}
            </h2>
            <div className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Label htmlFor="usarPeriodo" className="text-sm font-medium">
                  {t("fields.usarPeriodo.label")}
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">{t("helpers.period")}</p>
              </div>
              <input
                id="usarPeriodo"
                type="checkbox"
                checked={usarPeriodo}
                onChange={(event) => setUsarPeriodo(event.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
            </div>
            {usarPeriodo && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dataInicio">{t("fields.dataInicio.label")}</Label>
                  <Input id="dataInicio" type="date" value={dataInicio} onChange={(event) => setDataInicio(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataFim">{t("fields.dataFim.label")}</Label>
                  <Input id="dataFim" type="date" value={dataFim} onChange={(event) => setDataFim(event.target.value)} />
                </div>
              </div>
            )}
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="salario-dias-divisor">
            <h2
              id="salario-dias-divisor"
              className="flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground">
              <ReceiptText className="h-4 w-4" />
              {t("sections.divisor")}
            </h2>
            <div className="grid gap-2 sm:grid-cols-3" role="group" aria-label={t("fields.divisorModo.label")}>
              {DIVISOR_MODES.map((mode) => (
                <Button
                  key={mode}
                  id={`divisorModo-${mode}`}
                  type="button"
                  variant={divisorModo === mode ? "default" : "outline"}
                  onClick={() => setDivisorModo(mode)}
                  className="w-full">
                  {t(`fields.divisorModo.options.${mode}`)}
                </Button>
              ))}
            </div>
            {divisorModo === "manual" && (
              <div className="max-w-xs space-y-2">
                <Label htmlFor="divisorManual">{t("fields.divisorManual.label")}</Label>
                <Input
                  id="divisorManual"
                  inputMode="decimal"
                  value={divisorManual}
                  onChange={(event) => setDivisorManual(sanitizeDecimal(event.target.value))}
                  placeholder="30"
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground">{t("helpers.divisor")}</p>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="salario-dias-ajustes">
            <h2
              id="salario-dias-ajustes"
              className="flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground">
              <WalletCards className="h-4 w-4" />
              {t("sections.adjustments")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="outrosProventosTributaveis">{t("fields.outrosProventosTributaveis.label")}</Label>
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
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="salario-dias-tabelas">
            <h2
              id="salario-dias-tabelas"
              className="flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground">
              <Landmark className="h-4 w-4" />
              {t("sections.legal")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dependentesIr">{t("fields.dependentesIr.label")}</Label>
                <Input
                  id="dependentesIr"
                  inputMode="numeric"
                  value={dependentesIr}
                  onChange={(event) => setDependentesIr(sanitizeInteger(event.target.value))}
                  min={0}
                  max={20}
                />
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
            <div className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Label htmlFor="calcularDescontosLegais" className="text-sm font-medium">
                  {t("fields.calcularDescontosLegais.label")}
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">{t("helpers.legal")}</p>
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

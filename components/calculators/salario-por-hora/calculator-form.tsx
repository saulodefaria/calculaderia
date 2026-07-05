"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Calculator, CalendarClock, Clock, Percent } from "lucide-react";
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
  getDefaultSalarioPorHoraInputs,
  validateSalarioPorHoraInputs,
  type SalarioPorHoraDivisorModo,
  type SalarioPorHoraInputs,
  type SalarioPorHoraModo,
} from "@/lib/calculators/salario-por-hora";

interface CalculatorFormProps {
  onCalculate: (inputs: SalarioPorHoraInputs) => void;
  initialValues?: SalarioPorHoraInputs | null;
}

const MODES: SalarioPorHoraModo[] = ["mensalParaHora", "horaParaMensal"];
const DIVISOR_MODES: SalarioPorHoraDivisorModo[] = ["jornadaSemanal", "manual"];

function currencyInitial(value: number | undefined): string {
  return value && value > 0 ? formatCurrencyFromNumber(value) : "";
}

function numberInitial(value: number | undefined): string {
  if (value === undefined) return "";
  return value.toString().replace(".", ",");
}

function toDecimal(value: string): number {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function sanitizeDecimal(value: string, maxLength = 8): string {
  return value.replace(/[^\d,.]/g, "").replace(/(.*[,.].*)[,.]/, "$1").slice(0, maxLength);
}

export function CalculatorForm({ onCalculate, initialValues }: CalculatorFormProps) {
  const t = useTranslations("calculators.salario-por-hora.form");
  const defaults = useMemo(() => initialValues ?? getDefaultSalarioPorHoraInputs(), [initialValues]);

  const [modo, setModo] = useState<SalarioPorHoraModo>(defaults.modo);
  const [salarioMensal, setSalarioMensal] = useState(() => currencyInitial(defaults.salarioMensal));
  const [valorHora, setValorHora] = useState(() => currencyInitial(defaults.valorHora));
  const [divisorModo, setDivisorModo] = useState<SalarioPorHoraDivisorModo>(defaults.divisorModo);
  const [jornadaSemanal, setJornadaSemanal] = useState(() => numberInitial(defaults.jornadaSemanal));
  const [divisorMensalManual, setDivisorMensalManual] = useState(() => numberInitial(defaults.divisorMensalManual));
  const [horasPeriodo, setHorasPeriodo] = useState(() => numberInitial(defaults.horasPeriodo));
  const [adicionalPercentual, setAdicionalPercentual] = useState(() =>
    formatPercentFromNumber(defaults.adicionalPercentual)
  );
  const [mostrarAdicional, setMostrarAdicional] = useState(defaults.mostrarAdicional);
  const [error, setError] = useState<string | null>(null);

  const handleCurrencyChange = (value: string, setter: (next: string) => void) => {
    setter(formatCurrencyInput(value));
  };

  const buildInputs = (): SalarioPorHoraInputs => ({
    modo,
    salarioMensal: parseCurrencyValue(salarioMensal),
    valorHora: parseCurrencyValue(valorHora),
    divisorModo,
    jornadaSemanal: toDecimal(jornadaSemanal),
    divisorMensalManual: toDecimal(divisorMensalManual),
    horasPeriodo: toDecimal(horasPeriodo),
    adicionalPercentual: parsePercentValue(adicionalPercentual),
    mostrarAdicional,
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const inputs = buildInputs();
    const errors = validateSalarioPorHoraInputs(inputs);

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
          <section className="space-y-4" aria-labelledby="salario-hora-modo">
            <h2 id="salario-hora-modo" className="text-sm font-semibold uppercase text-muted-foreground">
              {t("sections.mode")}
            </h2>
            <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label={t("fields.modo.label")}>
              {MODES.map((mode) => (
                <Button
                  key={mode}
                  id={`modo-${mode}`}
                  type="button"
                  variant={modo === mode ? "default" : "outline"}
                  onClick={() => setModo(mode)}
                  className="w-full">
                  {t(`fields.modo.options.${mode}`)}
                </Button>
              ))}
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="salario-hora-base">
            <h2
              id="salario-hora-base"
              className="flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground">
              <Clock className="h-4 w-4" />
              {t("sections.salary")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {modo === "mensalParaHora" ? (
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
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="valorHora">{t("fields.valorHora.label")}</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                    <Input
                      id="valorHora"
                      inputMode="numeric"
                      value={valorHora}
                      onChange={(event) => handleCurrencyChange(event.target.value, setValorHora)}
                      placeholder={t("fields.valorHora.placeholder")}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="horasPeriodo">{t("fields.horasPeriodo.label")}</Label>
                <Input
                  id="horasPeriodo"
                  inputMode="decimal"
                  value={horasPeriodo}
                  onChange={(event) => setHorasPeriodo(sanitizeDecimal(event.target.value))}
                  placeholder={t("fields.horasPeriodo.placeholder")}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="salario-hora-divisor">
            <h2
              id="salario-hora-divisor"
              className="flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              {t("sections.divisor")}
            </h2>
            <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label={t("fields.divisorModo.label")}>
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

            <div className="grid gap-4 sm:grid-cols-2">
              {divisorModo === "jornadaSemanal" ? (
                <div className="space-y-2">
                  <Label htmlFor="jornadaSemanal">{t("fields.jornadaSemanal.label")}</Label>
                  <Input
                    id="jornadaSemanal"
                    inputMode="decimal"
                    value={jornadaSemanal}
                    onChange={(event) => setJornadaSemanal(sanitizeDecimal(event.target.value, 5))}
                    placeholder={t("fields.jornadaSemanal.placeholder")}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="divisorMensalManual">{t("fields.divisorMensalManual.label")}</Label>
                  <Input
                    id="divisorMensalManual"
                    inputMode="decimal"
                    value={divisorMensalManual}
                    onChange={(event) => setDivisorMensalManual(sanitizeDecimal(event.target.value, 6))}
                    placeholder={t("fields.divisorMensalManual.placeholder")}
                  />
                </div>
              )}
              <p className="self-end text-xs text-muted-foreground">{t("helpers.divisor")}</p>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="salario-hora-adicional">
            <h2
              id="salario-hora-adicional"
              className="flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground">
              <Percent className="h-4 w-4" />
              {t("sections.additional")}
            </h2>
            <div className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Label htmlFor="mostrarAdicional" className="text-sm font-medium">
                  {t("fields.mostrarAdicional.label")}
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">{t("helpers.additional")}</p>
              </div>
              <input
                id="mostrarAdicional"
                type="checkbox"
                checked={mostrarAdicional}
                onChange={(event) => setMostrarAdicional(event.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
            </div>
            {mostrarAdicional && (
              <div className="max-w-xs space-y-2">
                <Label htmlFor="adicionalPercentual">{t("fields.adicionalPercentual.label")}</Label>
                <Input
                  id="adicionalPercentual"
                  inputMode="decimal"
                  value={adicionalPercentual}
                  onChange={(event) => setAdicionalPercentual(formatPercentInput(event.target.value))}
                  placeholder={t("fields.adicionalPercentual.placeholder")}
                />
              </div>
            )}
          </section>

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
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

"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { BadgeDollarSign, CalendarDays, Calculator, Percent, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  INVESTIMENTO_CDI_ANNUAL_RATE_PERCENT,
  INVESTIMENTO_CDI_DAILY_RATE_PERCENT,
  INVESTIMENTO_CDI_OBSERVATION_DATE,
  INVESTIMENTO_CDI_SOURCE_VERSION,
  calcularDiasUteisEstimadosInvestimentoCdi,
  getDefaultInvestimentoCdiInputs,
  validateInvestimentoCdiInputs,
  type InvestimentoCdiDiasUteisModo,
  type InvestimentoCdiInputs,
  type InvestimentoCdiModo,
} from "@/lib/calculators/investimento-cdi";
import {
  formatCurrencyFromNumber,
  formatCurrencyInput,
  formatPercentInput,
  parseCurrencyValue,
  parsePercentValue,
} from "@/lib/utils/index";

interface CalculatorFormProps {
  onCalculate: (inputs: InvestimentoCdiInputs) => void;
  initialValues?: InvestimentoCdiInputs | null;
  staleSourceWarning?: boolean;
}

function currencyInitial(value: number | undefined): string {
  return value && value > 0 ? formatCurrencyFromNumber(value) : "";
}

function percentInitial(value: number | undefined): string {
  return value !== undefined ? value.toString().replace(".", ",") : "";
}

function sanitizeInteger(value: string): string {
  return value.replace(/\D/g, "").slice(0, 5);
}

function parseInteger(value: string): number {
  return parseInt(value, 10) || 0;
}

export function CalculatorForm({ onCalculate, initialValues, staleSourceWarning = false }: CalculatorFormProps) {
  const t = useTranslations("calculators.investimento-cdi.form");
  const defaults = useMemo(() => initialValues ?? getDefaultInvestimentoCdiInputs(), [initialValues]);
  const [valorInicial, setValorInicial] = useState(() => currencyInitial(defaults.valorInicial));
  const [prazoDiasCorridos, setPrazoDiasCorridos] = useState(defaults.prazoDiasCorridos.toString());
  const [diasUteis, setDiasUteis] = useState(defaults.diasUteis.toString());
  const [diasUteisModo, setDiasUteisModo] = useState<InvestimentoCdiDiasUteisModo>(defaults.diasUteisModo);
  const [percentualCdi, setPercentualCdi] = useState(() => percentInitial(defaults.percentualCdi));
  const [cdiModo, setCdiModo] = useState<InvestimentoCdiModo>(defaults.cdiModo);
  const [cdiAnualManual, setCdiAnualManual] = useState(() => percentInitial(defaults.cdiAnualManual));
  const [error, setError] = useState<string | null>(null);

  const updatePrazo = (value: string) => {
    const next = sanitizeInteger(value);
    setPrazoDiasCorridos(next);

    if (diasUteisModo === "estimado") {
      const prazo = parseInteger(next);
      setDiasUteis(prazo > 0 ? calcularDiasUteisEstimadosInvestimentoCdi(prazo).toString() : "");
    }
  };

  const updateDiasUteisModo = (modo: InvestimentoCdiDiasUteisModo) => {
    setDiasUteisModo(modo);
    if (modo === "estimado") {
      const prazo = parseInteger(prazoDiasCorridos);
      setDiasUteis(prazo > 0 ? calcularDiasUteisEstimadosInvestimentoCdi(prazo).toString() : "");
    }
  };

  const buildInputs = (): InvestimentoCdiInputs => ({
    valorInicial: parseCurrencyValue(valorInicial),
    prazoDiasCorridos: parseInteger(prazoDiasCorridos),
    diasUteis: parseInteger(diasUteis),
    diasUteisModo,
    percentualCdi: parsePercentValue(percentualCdi),
    cdiModo,
    cdiAnualManual: parsePercentValue(cdiAnualManual),
    sourceVersion: INVESTIMENTO_CDI_SOURCE_VERSION,
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const inputs = buildInputs();
    const errors = validateInvestimentoCdiInputs(inputs);

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
          {staleSourceWarning && (
            <div
              className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
              data-testid="investimento-cdi-stale-source-warning">
              <strong>{t("staleSource.title")}</strong> {t("staleSource.text", { version: INVESTIMENTO_CDI_SOURCE_VERSION })}
            </div>
          )}

          <section className="space-y-4" aria-labelledby="investimento-cdi-investment-section">
            <h2
              id="investimento-cdi-investment-section"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <BadgeDollarSign className="h-4 w-4" />
              {t("sections.investment")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="valorInicial">{t("fields.valorInicial.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="valorInicial"
                    inputMode="numeric"
                    value={valorInicial}
                    onChange={(event) => setValorInicial(formatCurrencyInput(event.target.value))}
                    placeholder={t("fields.valorInicial.placeholder")}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prazoDiasCorridos">{t("fields.prazoDiasCorridos.label")}</Label>
                <Input
                  id="prazoDiasCorridos"
                  inputMode="numeric"
                  value={prazoDiasCorridos}
                  onChange={(event) => updatePrazo(event.target.value)}
                  min={1}
                  max={3650}
                  required
                />
                <p className="text-xs text-muted-foreground">{t("helpers.calendarDays")}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="diasUteis">{t("fields.diasUteis.label")}</Label>
                <Input
                  id="diasUteis"
                  inputMode="numeric"
                  value={diasUteis}
                  onChange={(event) => setDiasUteis(sanitizeInteger(event.target.value))}
                  min={1}
                  max={2520}
                  disabled={diasUteisModo === "estimado"}
                  required
                />
                <p className="text-xs text-muted-foreground">{t("helpers.businessDays")}</p>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="investimento-cdi-business-days-section">
            <h2
              id="investimento-cdi-business-days-section"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              {t("sections.businessDays")}
            </h2>
            <div className="grid gap-2 rounded-lg border bg-muted/20 p-1 sm:grid-cols-2">
              <Button
                id="diasUteisModoEstimado"
                type="button"
                variant={diasUteisModo === "estimado" ? "default" : "ghost"}
                aria-pressed={diasUteisModo === "estimado"}
                onClick={() => updateDiasUteisModo("estimado")}>
                {t("fields.diasUteisModo.options.estimado")}
              </Button>
              <Button
                id="diasUteisModoManual"
                type="button"
                variant={diasUteisModo === "manual" ? "default" : "ghost"}
                aria-pressed={diasUteisModo === "manual"}
                onClick={() => updateDiasUteisModo("manual")}>
                {t("fields.diasUteisModo.options.manual")}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t("helpers.businessDaysOverride")}</p>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="investimento-cdi-rate-section">
            <h2
              id="investimento-cdi-rate-section"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Percent className="h-4 w-4" />
              {t("sections.cdi")}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="percentualCdi">{t("fields.percentualCdi.label")}</Label>
                <Input
                  id="percentualCdi"
                  inputMode="decimal"
                  value={percentualCdi}
                  onChange={(event) => setPercentualCdi(formatPercentInput(event.target.value))}
                  placeholder={t("fields.percentualCdi.placeholder")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("fields.cdiModo.label")}</Label>
                <div className="grid gap-2 rounded-lg border bg-muted/20 p-1 sm:grid-cols-2">
                  <Button
                    id="cdiModoSnapshot"
                    type="button"
                    variant={cdiModo === "snapshot" ? "default" : "ghost"}
                    aria-pressed={cdiModo === "snapshot"}
                    onClick={() => setCdiModo("snapshot")}>
                    {t("fields.cdiModo.options.snapshot")}
                  </Button>
                  <Button
                    id="cdiModoManual"
                    type="button"
                    variant={cdiModo === "manual" ? "default" : "ghost"}
                    aria-pressed={cdiModo === "manual"}
                    onClick={() => setCdiModo("manual")}>
                    {t("fields.cdiModo.options.manual")}
                  </Button>
                </div>
              </div>
            </div>

            {cdiModo === "manual" ? (
              <div className="max-w-sm space-y-2">
                <Label htmlFor="cdiAnualManual">{t("fields.cdiAnualManual.label")}</Label>
                <Input
                  id="cdiAnualManual"
                  inputMode="decimal"
                  value={cdiAnualManual}
                  onChange={(event) => setCdiAnualManual(formatPercentInput(event.target.value))}
                  placeholder={t("fields.cdiAnualManual.placeholder")}
                  required
                />
                <p className="text-xs text-muted-foreground">{t("helpers.manualCdi")}</p>
              </div>
            ) : (
              <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground" data-testid="investimento-cdi-source-badge">
                {t("helpers.snapshotBadge", {
                  version: INVESTIMENTO_CDI_SOURCE_VERSION,
                  observationDate: INVESTIMENTO_CDI_OBSERVATION_DATE,
                  dailyRate: INVESTIMENTO_CDI_DAILY_RATE_PERCENT.toFixed(6),
                  annualRate: INVESTIMENTO_CDI_ANNUAL_RATE_PERCENT.toFixed(2),
                })}
              </div>
            )}
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="investimento-cdi-source-section">
            <h2
              id="investimento-cdi-source-section"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Settings2 className="h-4 w-4" />
              {t("sections.assumptions")}
            </h2>
            <div className="rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              {t("helpers.sourceText", { version: INVESTIMENTO_CDI_SOURCE_VERSION })}
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

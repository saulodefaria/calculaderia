"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, Calculator, Percent, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatCurrencyFromNumber,
  formatCurrencyInput,
  formatPercentInput,
  parseCurrencyValue,
  parsePercentValue,
} from "@/lib/utils/index";
import {
  CDB_SOURCE_VERSION,
  calcularDiasUteisEstimados,
  getDefaultCdbInputs,
  validateCdbInputs,
  type CdbInputs,
  type CdbModo,
} from "@/lib/calculators/cdb";

interface CalculatorFormProps {
  onCalculate: (inputs: CdbInputs) => void;
  initialValues?: CdbInputs | null;
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
  const t = useTranslations("calculators.cdb.form");
  const defaults = useMemo(() => initialValues ?? getDefaultCdbInputs(), [initialValues]);
  const initialEstimatedBusinessDays = calcularDiasUteisEstimados(defaults.prazoDiasCorridos);
  const [modo, setModo] = useState<CdbModo>(defaults.modo);
  const [valorInicial, setValorInicial] = useState(() => currencyInitial(defaults.valorInicial));
  const [prazoDiasCorridos, setPrazoDiasCorridos] = useState(defaults.prazoDiasCorridos.toString());
  const [diasUteis, setDiasUteis] = useState(defaults.diasUteis.toString());
  const [usarDiasUteisManuais, setUsarDiasUteisManuais] = useState(defaults.diasUteis !== initialEstimatedBusinessDays);
  const [percentualCdi, setPercentualCdi] = useState(() => percentInitial(defaults.percentualCdi));
  const [cdiAnual, setCdiAnual] = useState(() => percentInitial(defaults.cdiAnual));
  const [taxaPreAnual, setTaxaPreAnual] = useState(() => percentInitial(defaults.taxaPreAnual));
  const [error, setError] = useState<string | null>(null);

  const updatePrazo = (value: string) => {
    const next = sanitizeInteger(value);
    setPrazoDiasCorridos(next);

    if (!usarDiasUteisManuais) {
      const prazo = parseInteger(next);
      setDiasUteis(prazo > 0 ? calcularDiasUteisEstimados(prazo).toString() : "");
    }
  };

  const toggleDiasUteisManuais = (checked: boolean) => {
    setUsarDiasUteisManuais(checked);
    if (!checked) {
      const prazo = parseInteger(prazoDiasCorridos);
      setDiasUteis(prazo > 0 ? calcularDiasUteisEstimados(prazo).toString() : "");
    }
  };

  const buildInputs = (): CdbInputs => ({
    modo,
    valorInicial: parseCurrencyValue(valorInicial),
    prazoDiasCorridos: parseInteger(prazoDiasCorridos),
    diasUteis: parseInteger(diasUteis),
    percentualCdi: parsePercentValue(percentualCdi),
    cdiAnual: parsePercentValue(cdiAnual),
    taxaPreAnual: parsePercentValue(taxaPreAnual),
    sourceVersion: CDB_SOURCE_VERSION,
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const inputs = buildInputs();
    const errors = validateCdbInputs(inputs);

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
              data-testid="cdb-stale-source-warning">
              <strong>{t("staleSource.title")}</strong> {t("staleSource.text", { version: CDB_SOURCE_VERSION })}
            </div>
          )}

          <section className="space-y-4" aria-labelledby="cdb-investment-section">
            <h2
              id="cdb-investment-section"
              className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
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
                  disabled={!usarDiasUteisManuais}
                  required
                />
                <p className="text-xs text-muted-foreground">{t("helpers.businessDays")}</p>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="cdb-business-days-section">
            <h2
              id="cdb-business-days-section"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              {t("sections.businessDays")}
            </h2>
            <div className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Label htmlFor="usarDiasUteisManuais" className="text-sm font-medium">
                  {t("fields.usarDiasUteisManuais.label")}
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">{t("helpers.businessDaysOverride")}</p>
              </div>
              <input
                id="usarDiasUteisManuais"
                type="checkbox"
                checked={usarDiasUteisManuais}
                onChange={(event) => toggleDiasUteisManuais(event.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="cdb-mode-section">
            <h2
              id="cdb-mode-section"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Percent className="h-4 w-4" />
              {t("sections.mode")}
            </h2>
            <div className="grid gap-2 rounded-lg border bg-muted/20 p-1 sm:grid-cols-2">
              <Button
                id="modoPosCdi"
                type="button"
                variant={modo === "pos-cdi" ? "default" : "ghost"}
                aria-pressed={modo === "pos-cdi"}
                onClick={() => setModo("pos-cdi")}>
                {t("fields.modo.options.posCdi")}
              </Button>
              <Button
                id="modoPre"
                type="button"
                variant={modo === "pre" ? "default" : "ghost"}
                aria-pressed={modo === "pre"}
                onClick={() => setModo("pre")}>
                {t("fields.modo.options.pre")}
              </Button>
            </div>
          </section>

          {modo === "pos-cdi" ? (
            <section className="space-y-4 border-t pt-5" aria-labelledby="cdb-cdi-section">
              <h2 id="cdb-cdi-section" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t("sections.cdi")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("helpers.cdiNotFetched")}</p>
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
                  <Label htmlFor="cdiAnual">{t("fields.cdiAnual.label")}</Label>
                  <Input
                    id="cdiAnual"
                    inputMode="decimal"
                    value={cdiAnual}
                    onChange={(event) => setCdiAnual(formatPercentInput(event.target.value))}
                    placeholder={t("fields.cdiAnual.placeholder")}
                    required
                  />
                  <p className="text-xs text-muted-foreground">{t("helpers.cdiRate")}</p>
                </div>
              </div>
            </section>
          ) : (
            <section className="space-y-4 border-t pt-5" aria-labelledby="cdb-pre-section">
              <h2 id="cdb-pre-section" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t("sections.pre")}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="taxaPreAnual">{t("fields.taxaPreAnual.label")}</Label>
                  <Input
                    id="taxaPreAnual"
                    inputMode="decimal"
                    value={taxaPreAnual}
                    onChange={(event) => setTaxaPreAnual(formatPercentInput(event.target.value))}
                    placeholder={t("fields.taxaPreAnual.placeholder")}
                    required
                  />
                </div>
              </div>
            </section>
          )}

          <section className="space-y-4 border-t pt-5" aria-labelledby="cdb-source-section">
            <h2
              id="cdb-source-section"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Settings2 className="h-4 w-4" />
              {t("sections.assumptions")}
            </h2>
            <div className="rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              {t("helpers.sourceBadge", { version: CDB_SOURCE_VERSION })}
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

"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { BadgeDollarSign, CalendarRange, Calculator, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CORRECAO_IGPM_FORMULA_VERSION,
  CORRECAO_IGPM_LATEST_MONTH,
  CORRECAO_IGPM_MIN_MONTH,
  getDefaultCorrecaoIgpmInputs,
  validateCorrecaoIgpmInputs,
  type CorrecaoIgpmInputs,
} from "@/lib/calculators/correcao-igpm";
import { formatCurrencyFromNumber, formatCurrencyInput, parseCurrencyValue } from "@/lib/utils/index";
import type { CorrecaoIgpmUrlWarningCode } from "@/lib/url-state/correcao-igpm";

interface CalculatorFormProps {
  initialValues?: CorrecaoIgpmInputs | null;
  urlWarnings: CorrecaoIgpmUrlWarningCode[];
  onCalculate: (inputs: CorrecaoIgpmInputs) => void;
  onReset: () => void;
}

export function CalculatorForm({ initialValues, urlWarnings, onCalculate, onReset }: CalculatorFormProps) {
  const t = useTranslations("calculators.correcao-igpm.form");
  const locale = useLocale();
  const defaults = useMemo(() => initialValues ?? getDefaultCorrecaoIgpmInputs(), [initialValues]);
  const [valorOriginal, setValorOriginal] = useState(() => formatCurrencyFromNumber(defaults.valorOriginal));
  const [mesInicial, setMesInicial] = useState(defaults.mesInicial);
  const [mesFinal, setMesFinal] = useState(defaults.mesFinal);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const inputs: CorrecaoIgpmInputs = {
      valorOriginal: parseCurrencyValue(valorOriginal),
      mesInicial,
      mesFinal,
      formulaVersion: CORRECAO_IGPM_FORMULA_VERSION,
    };
    const errors = validateCorrecaoIgpmInputs(inputs);
    if (errors.length > 0) {
      setError(t(`validation.${errors[0]}`));
      return;
    }
    setError(null);
    onCalculate(inputs);
  };

  const handleReset = () => {
    const resetInputs = getDefaultCorrecaoIgpmInputs();
    setValorOriginal(formatCurrencyFromNumber(resetInputs.valorOriginal));
    setMesInicial(resetInputs.mesInicial);
    setMesFinal(resetInputs.mesFinal);
    setError(null);
    onReset();
  };

  const latestMonthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${CORRECAO_IGPM_LATEST_MONTH}-01T00:00:00Z`));

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
          {urlWarnings.some((warning) => warning === "invalidLink" || warning === "formulaVersion") && (
            <div
              className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
              data-testid="correcao-igpm-invalid-link-warning">
              {t(`urlWarnings.${urlWarnings.includes("formulaVersion") ? "formulaVersion" : "invalidLink"}`)}
            </div>
          )}

          <section className="space-y-4" aria-labelledby="correcao-igpm-value-section">
            <h2
              id="correcao-igpm-value-section"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <BadgeDollarSign className="h-4 w-4" />
              {t("sections.purchase")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="valorOriginal">{t("fields.valorOriginal.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="valorOriginal"
                    inputMode="numeric"
                    value={valorOriginal}
                    onChange={(event) => setValorOriginal(formatCurrencyInput(event.target.value))}
                    className="pl-10"
                    placeholder={t("fields.valorOriginal.placeholder")}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mesInicial">{t("fields.mesInicial.label")}</Label>
                <Input
                  id="mesInicial"
                  type="month"
                  min={CORRECAO_IGPM_MIN_MONTH}
                  max={mesFinal}
                  value={mesInicial}
                  onChange={(event) => setMesInicial(event.target.value)}
                  required
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="correcao-igpm-period-section">
            <h2
              id="correcao-igpm-period-section"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <CalendarRange className="h-4 w-4" />
              {t("sections.period")}
            </h2>
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm font-medium" data-testid="correcao-igpm-latest-month-badge">
                {t("latestBadge", { month: latestMonthLabel })}
              </p>
              <details className="mt-3" open={mesFinal !== CORRECAO_IGPM_LATEST_MONTH}>
                <summary className="cursor-pointer text-sm font-medium">{t("advanced")}</summary>
                <div className="mt-3 max-w-sm space-y-2">
                  <Label htmlFor="mesFinal">{t("fields.mesFinal.label")}</Label>
                  <Input
                    id="mesFinal"
                    type="month"
                    min={mesInicial || CORRECAO_IGPM_MIN_MONTH}
                    max={CORRECAO_IGPM_LATEST_MONTH}
                    value={mesFinal}
                    onChange={(event) => setMesFinal(event.target.value)}
                    required
                  />
                </div>
              </details>
            </div>
            <p className="text-xs text-muted-foreground">{t("helpers.endpoints")}</p>
            <p className="text-xs text-muted-foreground">{t("helpers.minimum")}</p>
          </section>

          {error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" className="flex-1">
              <Calculator className="h-4 w-4" />
              {t("submit")}
            </Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
              {t("reset")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

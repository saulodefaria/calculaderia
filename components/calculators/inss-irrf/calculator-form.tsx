"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { BriefcaseBusiness, Calculator, Landmark, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrencyFromNumber, formatCurrencyInput, parseCurrencyValue } from "@/lib/utils/index";
import {
  INSS_IRRF_SUPPORTED_TABLE_YEAR,
  getDefaultInssIrrfInputs,
  validateInssIrrfInputs,
  type InssIrrfCategoriaSegurado,
  type InssIrrfInputs,
} from "@/lib/calculators/inss-irrf";

interface CalculatorFormProps {
  onCalculate: (inputs: InssIrrfInputs) => void;
  initialValues?: InssIrrfInputs | null;
}

const CATEGORY_OPTIONS: InssIrrfCategoriaSegurado[] = ["empregado", "domestico", "avulso"];

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
  const t = useTranslations("calculators.inss-irrf.form");
  const defaults = useMemo(() => initialValues ?? getDefaultInssIrrfInputs(), [initialValues]);

  const [rendimentosTributaveis, setRendimentosTributaveis] = useState(() =>
    currencyInitial(defaults.rendimentosTributaveis)
  );
  const [outrosRendimentosTributaveis, setOutrosRendimentosTributaveis] = useState(() =>
    currencyInitial(defaults.outrosRendimentosTributaveis)
  );
  const [categoriaSegurado, setCategoriaSegurado] = useState<InssIrrfCategoriaSegurado>(defaults.categoriaSegurado);
  const [dependentesIr, setDependentesIr] = useState(defaults.dependentesIr.toString());
  const [pensaoAlimenticia, setPensaoAlimenticia] = useState(() => currencyInitial(defaults.pensaoAlimenticia));
  const [considerarDescontoSimplificado, setConsiderarDescontoSimplificado] = useState(
    defaults.considerarDescontoSimplificado
  );
  const [error, setError] = useState<string | null>(null);

  const handleCurrencyChange = (value: string, setter: (next: string) => void) => {
    setter(formatCurrencyInput(value));
  };

  const buildInputs = (): InssIrrfInputs => ({
    rendimentosTributaveis: parseCurrencyValue(rendimentosTributaveis),
    outrosRendimentosTributaveis: parseCurrencyValue(outrosRendimentosTributaveis),
    categoriaSegurado,
    dependentesIr: toInteger(dependentesIr),
    pensaoAlimenticia: parseCurrencyValue(pensaoAlimenticia),
    considerarDescontoSimplificado,
    tabelaAno: INSS_IRRF_SUPPORTED_TABLE_YEAR,
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const inputs = buildInputs();
    const errors = validateInssIrrfInputs(inputs);

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
          <section className="space-y-4" aria-labelledby="inss-irrf-base">
            <h2 id="inss-irrf-base" className="text-sm font-semibold uppercase text-muted-foreground">
              {t("sections.base")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("helpers.base")}</p>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(220px,0.8fr)]">
              <div className="space-y-2">
                <Label htmlFor="rendimentosTributaveis">{t("fields.rendimentosTributaveis.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="rendimentosTributaveis"
                    inputMode="numeric"
                    value={rendimentosTributaveis}
                    onChange={(event) => handleCurrencyChange(event.target.value, setRendimentosTributaveis)}
                    placeholder={t("fields.rendimentosTributaveis.placeholder")}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="outrosRendimentosTributaveis">
                  {t("fields.outrosRendimentosTributaveis.label")}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="outrosRendimentosTributaveis"
                    inputMode="numeric"
                    value={outrosRendimentosTributaveis}
                    onChange={(event) =>
                      handleCurrencyChange(event.target.value, setOutrosRendimentosTributaveis)
                    }
                    placeholder={t("fields.outrosRendimentosTributaveis.placeholder")}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t("helpers.otherPay")}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoriaSegurado">{t("fields.categoriaSegurado.label")}</Label>
                <Select
                  value={categoriaSegurado}
                  onValueChange={(value) => setCategoriaSegurado(value as InssIrrfCategoriaSegurado)}>
                  <SelectTrigger id="categoriaSegurado" aria-label={t("fields.categoriaSegurado.label")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {t(`fields.categoriaSegurado.options.${option}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{t("helpers.category")}</p>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="inss-irrf-irrf">
            <h2
              id="inss-irrf-irrf"
              className="flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground">
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
                <p className="text-xs text-muted-foreground">{t("helpers.alimony")}</p>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="inss-irrf-fontes">
            <h2
              id="inss-irrf-fontes"
              className="flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground">
              <ReceiptText className="h-4 w-4" />
              {t("sections.sources")}
            </h2>
            <div className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Label htmlFor="considerarDescontoSimplificado" className="text-sm font-medium">
                  {t("fields.considerarDescontoSimplificado.label")}
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">{t("helpers.simplified")}</p>
              </div>
              <input
                id="considerarDescontoSimplificado"
                type="checkbox"
                checked={considerarDescontoSimplificado}
                onChange={(event) => setConsiderarDescontoSimplificado(event.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
            </div>
            <div className="rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              {t("helpers.tableBadge")}
            </div>
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <BriefcaseBusiness className="mt-0.5 h-4 w-4 flex-none" />
              <span>{t("helpers.scope")}</span>
            </p>
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

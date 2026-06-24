"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { BriefcaseBusiness, Calculator, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrencyFromNumber, formatCurrencyInput, parseCurrencyValue } from "@/lib/utils/index";
import {
  INSS_SUPPORTED_TABLE_YEAR,
  getDefaultInssInputs,
  validateInssInputs,
  type InssCategoriaSegurado,
  type InssInputs,
} from "@/lib/calculators/inss";

interface CalculatorFormProps {
  onCalculate: (inputs: InssInputs) => void;
  initialValues?: InssInputs | null;
}

const CATEGORY_OPTIONS: InssCategoriaSegurado[] = ["empregado", "domestico", "avulso"];

function currencyInitial(value: number | undefined): string {
  return value && value > 0 ? formatCurrencyFromNumber(value) : "";
}

export function CalculatorForm({ onCalculate, initialValues }: CalculatorFormProps) {
  const t = useTranslations("calculators.inss.form");
  const defaults = useMemo(() => initialValues ?? getDefaultInssInputs(), [initialValues]);

  const [salarioContribuicao, setSalarioContribuicao] = useState(() =>
    currencyInitial(defaults.salarioContribuicao)
  );
  const [outrasRemuneracoes, setOutrasRemuneracoes] = useState(() =>
    currencyInitial(defaults.outrasRemuneracoes)
  );
  const [categoriaSegurado, setCategoriaSegurado] = useState<InssCategoriaSegurado>(defaults.categoriaSegurado);
  const [error, setError] = useState<string | null>(null);

  const handleCurrencyChange = (value: string, setter: (next: string) => void) => {
    setter(formatCurrencyInput(value));
  };

  const buildInputs = (): InssInputs => ({
    salarioContribuicao: parseCurrencyValue(salarioContribuicao),
    outrasRemuneracoes: parseCurrencyValue(outrasRemuneracoes),
    categoriaSegurado,
    tabelaAno: INSS_SUPPORTED_TABLE_YEAR,
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const inputs = buildInputs();
    const errors = validateInssInputs(inputs);

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
          <section className="space-y-4" aria-labelledby="inss-base">
            <h2 id="inss-base" className="text-sm font-semibold uppercase text-muted-foreground">
              {t("sections.base")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("helpers.base")}</p>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(220px,0.8fr)]">
              <div className="space-y-2">
                <Label htmlFor="salarioContribuicao">{t("fields.salarioContribuicao.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="salarioContribuicao"
                    inputMode="numeric"
                    value={salarioContribuicao}
                    onChange={(event) => handleCurrencyChange(event.target.value, setSalarioContribuicao)}
                    placeholder={t("fields.salarioContribuicao.placeholder")}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="outrasRemuneracoes">{t("fields.outrasRemuneracoes.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="outrasRemuneracoes"
                    inputMode="numeric"
                    value={outrasRemuneracoes}
                    onChange={(event) => handleCurrencyChange(event.target.value, setOutrasRemuneracoes)}
                    placeholder={t("fields.outrasRemuneracoes.placeholder")}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t("helpers.otherPay")}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoriaSegurado">{t("fields.categoriaSegurado.label")}</Label>
                <Select
                  value={categoriaSegurado}
                  onValueChange={(value) => setCategoriaSegurado(value as InssCategoriaSegurado)}>
                  <SelectTrigger id="categoriaSegurado" aria-label={t("fields.categoriaSegurado.label")} className="w-full">
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

          <section className="space-y-3 border-t pt-5" aria-labelledby="inss-tabela">
            <h2 id="inss-tabela" className="flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground">
              <ReceiptText className="h-4 w-4" />
              {t("sections.table")}
            </h2>
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

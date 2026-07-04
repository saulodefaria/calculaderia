"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Calculator, Home, Landmark, Percent, Scale, WalletCards } from "lucide-react";
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
  getDefaultMinhaCasaMinhaVidaInputs,
  validateMinhaCasaMinhaVidaInputs,
  type McmvInputs,
  type McmvMetodo,
  type McmvRegiao,
  type McmvTipoImovel,
} from "@/lib/calculators/financiamento-minha-casa-minha-vida";

interface CalculatorFormProps {
  onCalculate: (inputs: McmvInputs) => void;
  initialValues?: McmvInputs | null;
}

function currencyInitial(value: number | null | undefined, preserveZero = false): string {
  if (value === 0 && preserveZero) return "0,00";
  return value && value > 0 ? formatCurrencyFromNumber(value) : "";
}

function percentInitial(value: number | null | undefined, preserveZero = false): string {
  if (value === 0 && preserveZero) return "0";
  return value && value > 0 ? formatPercentFromNumber(value) : "";
}

function toInteger(value: string): number {
  return parseInt(value, 10) || 0;
}

function sanitizeInteger(value: string): string {
  return value.replace(/\D/g, "").slice(0, 3);
}

function SelectField({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        {children}
      </select>
    </div>
  );
}

export function CalculatorForm({ onCalculate, initialValues }: CalculatorFormProps) {
  const t = useTranslations("calculators.financiamento-minha-casa-minha-vida.form");
  const defaults = useMemo(() => initialValues ?? getDefaultMinhaCasaMinhaVidaInputs(), [initialValues]);
  const [rendaMensalBruta, setRendaMensalBruta] = useState(() => currencyInitial(defaults.rendaMensalBruta));
  const [regiao, setRegiao] = useState<McmvRegiao>(defaults.regiao);
  const [cotistaFgts, setCotistaFgts] = useState(defaults.cotistaFgts);
  const [tipoImovel, setTipoImovel] = useState<McmvTipoImovel>(defaults.tipoImovel);
  const [valorImovel, setValorImovel] = useState(() => currencyInitial(defaults.valorImovel));
  const [limiteLocalFaixa12, setLimiteLocalFaixa12] = useState(() =>
    currencyInitial(defaults.limiteLocalFaixa12)
  );
  const [entradaRecursosProprios, setEntradaRecursosProprios] = useState(() =>
    currencyInitial(defaults.entradaRecursosProprios, true)
  );
  const [fgtsEntrada, setFgtsEntrada] = useState(() => currencyInitial(defaults.fgtsEntrada, true));
  const [subsidioInformado, setSubsidioInformado] = useState(() =>
    currencyInitial(defaults.subsidioInformado, true)
  );
  const [prazoMeses, setPrazoMeses] = useState(defaults.prazoMeses.toString());
  const [metodo, setMetodo] = useState<McmvMetodo>(defaults.metodo);
  const [usarTaxaOficial, setUsarTaxaOficial] = useState(defaults.usarTaxaOficial);
  const [taxaNominalAnualManual, setTaxaNominalAnualManual] = useState(() =>
    percentInitial(defaults.taxaNominalAnualManual, defaults.taxaNominalAnualManual === 0)
  );
  const [compararMetodos, setCompararMetodos] = useState(defaults.compararMetodos);
  const [error, setError] = useState<string | null>(null);

  const handleCurrencyChange = (value: string, setter: (next: string) => void) => {
    setter(formatCurrencyInput(value));
  };

  const buildInputs = (): McmvInputs => {
    const localCap = parseCurrencyValue(limiteLocalFaixa12);

    return {
      rendaMensalBruta: parseCurrencyValue(rendaMensalBruta),
      regiao,
      cotistaFgts,
      tipoImovel,
      valorImovel: parseCurrencyValue(valorImovel),
      limiteLocalFaixa12: localCap > 0 ? localCap : null,
      entradaRecursosProprios: parseCurrencyValue(entradaRecursosProprios),
      fgtsEntrada: parseCurrencyValue(fgtsEntrada),
      subsidioInformado: parseCurrencyValue(subsidioInformado),
      prazoMeses: toInteger(prazoMeses),
      metodo,
      usarTaxaOficial,
      taxaNominalAnualManual: taxaNominalAnualManual.trim() ? parsePercentValue(taxaNominalAnualManual) : null,
      compararMetodos,
    };
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const inputs = buildInputs();
    const errors = validateMinhaCasaMinhaVidaInputs(inputs);

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
          <section className="space-y-4" aria-labelledby="mcmv-household">
            <h2
              id="mcmv-household"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Landmark className="h-4 w-4" />
              {t("sections.household")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("helpers.household")}</p>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="rendaMensalBruta">{t("fields.rendaMensalBruta.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="rendaMensalBruta"
                    inputMode="numeric"
                    value={rendaMensalBruta}
                    onChange={(event) => handleCurrencyChange(event.target.value, setRendaMensalBruta)}
                    placeholder={t("fields.rendaMensalBruta.placeholder")}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <SelectField
                id="regiao"
                label={t("fields.regiao.label")}
                value={regiao}
                onChange={(value) => setRegiao(value as McmvRegiao)}>
                <option value="norte-nordeste">{t("fields.regiao.options.norteNordeste")}</option>
                <option value="sul-sudeste-centro-oeste">{t("fields.regiao.options.sulSudesteCentroOeste")}</option>
              </SelectField>
              <label htmlFor="cotistaFgts" className="flex items-start gap-3 rounded-md border p-3 text-sm">
                <input
                  id="cotistaFgts"
                  type="checkbox"
                  checked={cotistaFgts}
                  onChange={(event) => setCotistaFgts(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border"
                />
                <span>
                  <span className="font-medium">{t("fields.cotistaFgts.label")}</span>
                  <span className="block text-muted-foreground">{t("fields.cotistaFgts.help")}</span>
                </span>
              </label>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="mcmv-property">
            <h2
              id="mcmv-property"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Home className="h-4 w-4" />
              {t("sections.property")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("helpers.property")}</p>
            <div className="grid gap-4 md:grid-cols-3">
              <SelectField
                id="tipoImovel"
                label={t("fields.tipoImovel.label")}
                value={tipoImovel}
                onChange={(value) => setTipoImovel(value as McmvTipoImovel)}>
                <option value="novo">{t("fields.tipoImovel.options.novo")}</option>
                <option value="usado">{t("fields.tipoImovel.options.usado")}</option>
                <option value="construcao">{t("fields.tipoImovel.options.construcao")}</option>
                <option value="terreno-construcao">{t("fields.tipoImovel.options.terrenoConstrucao")}</option>
              </SelectField>
              <div className="space-y-2">
                <Label htmlFor="valorImovel">{t("fields.valorImovel.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="valorImovel"
                    inputMode="numeric"
                    value={valorImovel}
                    onChange={(event) => handleCurrencyChange(event.target.value, setValorImovel)}
                    placeholder={t("fields.valorImovel.placeholder")}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="limiteLocalFaixa12">{t("fields.limiteLocalFaixa12.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="limiteLocalFaixa12"
                    inputMode="numeric"
                    value={limiteLocalFaixa12}
                    onChange={(event) => handleCurrencyChange(event.target.value, setLimiteLocalFaixa12)}
                    placeholder={t("fields.limiteLocalFaixa12.placeholder")}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t("fields.limiteLocalFaixa12.help")}</p>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="mcmv-entry">
            <h2
              id="mcmv-entry"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <WalletCards className="h-4 w-4" />
              {t("sections.entry")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("helpers.entry")}</p>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  id: "entradaRecursosProprios",
                  value: entradaRecursosProprios,
                  setter: setEntradaRecursosProprios,
                },
                { id: "fgtsEntrada", value: fgtsEntrada, setter: setFgtsEntrada },
                { id: "subsidioInformado", value: subsidioInformado, setter: setSubsidioInformado },
              ].map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id}>{t(`fields.${field.id}.label`)}</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                    <Input
                      id={field.id}
                      inputMode="numeric"
                      value={field.value}
                      onChange={(event) => handleCurrencyChange(event.target.value, field.setter)}
                      placeholder={t(`fields.${field.id}.placeholder`)}
                      className="pl-10"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="mcmv-terms">
            <h2
              id="mcmv-terms"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Percent className="h-4 w-4" />
              {t("sections.terms")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("helpers.terms")}</p>
            <div className="grid gap-4 md:grid-cols-[minmax(0,0.75fr)_minmax(220px,0.9fr)_minmax(0,1fr)]">
              <div className="space-y-2">
                <Label htmlFor="prazoMeses">{t("fields.prazoMeses.label")}</Label>
                <div className="relative">
                  <Input
                    id="prazoMeses"
                    inputMode="numeric"
                    value={prazoMeses}
                    onChange={(event) => setPrazoMeses(sanitizeInteger(event.target.value))}
                    min={1}
                    max={420}
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
                  {(["sac", "price"] as const).map((option) => (
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
              <div className="space-y-2">
                <label htmlFor="usarTaxaOficial" className="flex items-start gap-3 rounded-md border p-3 text-sm">
                  <input
                    id="usarTaxaOficial"
                    type="checkbox"
                    checked={usarTaxaOficial}
                    onChange={(event) => setUsarTaxaOficial(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-border"
                  />
                  <span>
                    <span className="font-medium">{t("fields.usarTaxaOficial.label")}</span>
                    <span className="block text-muted-foreground">{t("fields.usarTaxaOficial.help")}</span>
                  </span>
                </label>
                {!usarTaxaOficial && (
                  <div className="space-y-2">
                    <Label htmlFor="taxaNominalAnualManual">{t("fields.taxaNominalAnualManual.label")}</Label>
                    <div className="relative">
                      <Input
                        id="taxaNominalAnualManual"
                        inputMode="decimal"
                        value={taxaNominalAnualManual}
                        onChange={(event) => setTaxaNominalAnualManual(formatPercentInput(event.target.value))}
                        placeholder={t("fields.taxaNominalAnualManual.placeholder")}
                        className="pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-3 rounded-md border bg-muted/20 p-4" aria-labelledby="mcmv-comparison">
            <h2 id="mcmv-comparison" className="flex items-center gap-2 text-sm font-semibold">
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

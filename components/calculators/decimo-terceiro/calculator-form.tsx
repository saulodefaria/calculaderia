"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Calculator, CalendarDays, CircleDollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrencyFromNumber, formatCurrencyInput, parseCurrencyValue } from "@/lib/utils/index";
import {
  formatDecimoTerceiroIsoDateFromDate,
  getDefaultDecimoTerceiroInputs,
  validateDecimoTerceiroInputs,
  type InputsDecimoTerceiro,
  type ModoDecimoTerceiro,
} from "@/lib/calculators/decimo-terceiro";

interface CalculatorFormProps {
  onCalculate: (inputs: InputsDecimoTerceiro) => void;
  initialValues?: InputsDecimoTerceiro | null;
}

const MODOS: ModoDecimoTerceiro[] = ["projecaoAnual", "proporcionalAteData"];

function currencyInitial(value: number | undefined): string {
  return value && value > 0 ? formatCurrencyFromNumber(value) : "";
}

function toInteger(value: string): number {
  return parseInt(value, 10) || 0;
}

function sanitizeInteger(value: string): string {
  return value.replace(/\D/g, "").slice(0, 4);
}

function referenceDateForMode(year: number, mode: ModoDecimoTerceiro): string {
  if (mode === "projecaoAnual") return `${year}-12-31`;

  const today = new Date();
  if (today.getFullYear() === year) {
    return formatDecimoTerceiroIsoDateFromDate(today);
  }

  return `${year}-12-31`;
}

export function CalculatorForm({ onCalculate, initialValues }: CalculatorFormProps) {
  const t = useTranslations("calculators.decimo-terceiro.form");
  const defaults = useMemo(() => initialValues ?? getDefaultDecimoTerceiroInputs(), [initialValues]);

  const [salarioMensal, setSalarioMensal] = useState(() => currencyInitial(defaults.salarioMensal));
  const [mediaVariavelMensal, setMediaVariavelMensal] = useState(() => currencyInitial(defaults.mediaVariavelMensal));
  const [anoReferencia, setAnoReferencia] = useState(defaults.anoReferencia.toString());
  const [dataAdmissao, setDataAdmissao] = useState(defaults.dataAdmissao);
  const [dataReferencia, setDataReferencia] = useState(defaults.dataReferencia);
  const [modoCalculo, setModoCalculo] = useState<ModoDecimoTerceiro>(defaults.modoCalculo);
  const [adiantamentoJaRecebido, setAdiantamentoJaRecebido] = useState(() =>
    currencyInitial(defaults.adiantamentoJaRecebido)
  );
  const [calcularPrimeiraParcela, setCalcularPrimeiraParcela] = useState(defaults.calcularPrimeiraParcela);
  const [dependentesIr, setDependentesIr] = useState(defaults.dependentesIr.toString());
  const [pensaoAlimenticia, setPensaoAlimenticia] = useState(() => currencyInitial(defaults.pensaoAlimenticia));
  const [outrosDescontos, setOutrosDescontos] = useState(() => currencyInitial(defaults.outrosDescontos));
  const [outrosAcrescimos, setOutrosAcrescimos] = useState(() => currencyInitial(defaults.outrosAcrescimos));
  const [calcularDescontosLegais, setCalcularDescontosLegais] = useState(defaults.calcularDescontosLegais);
  const [error, setError] = useState<string | null>(null);

  const handleCurrencyChange = (value: string, setter: (next: string) => void) => {
    setter(formatCurrencyInput(value));
  };

  const handleYearChange = (value: string) => {
    const nextValue = sanitizeInteger(value);
    const previousYear = toInteger(anoReferencia);
    setAnoReferencia(nextValue);

    if (nextValue.length !== 4) return;
    const nextYear = toInteger(nextValue);
    if (dataAdmissao === `${previousYear}-01-01`) {
      setDataAdmissao(`${nextYear}-01-01`);
    }
    if (dataReferencia === referenceDateForMode(previousYear, modoCalculo)) {
      setDataReferencia(referenceDateForMode(nextYear, modoCalculo));
    }
  };

  const handleModeChange = (value: string) => {
    const nextMode = value as ModoDecimoTerceiro;
    const year = toInteger(anoReferencia);
    setModoCalculo(nextMode);
    if (year >= 1900 && year <= 9999) {
      setDataReferencia(referenceDateForMode(year, nextMode));
    }
  };

  const buildInputs = (): InputsDecimoTerceiro => ({
    salarioMensal: parseCurrencyValue(salarioMensal),
    mediaVariavelMensal: parseCurrencyValue(mediaVariavelMensal),
    anoReferencia: toInteger(anoReferencia),
    dataAdmissao,
    dataReferencia,
    modoCalculo,
    adiantamentoJaRecebido: parseCurrencyValue(adiantamentoJaRecebido),
    calcularPrimeiraParcela,
    dependentesIr: toInteger(dependentesIr),
    pensaoAlimenticia: parseCurrencyValue(pensaoAlimenticia),
    outrosDescontos: parseCurrencyValue(outrosDescontos),
    outrosAcrescimos: parseCurrencyValue(outrosAcrescimos),
    calcularDescontosLegais,
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const inputs = buildInputs();
    const errors = validateDecimoTerceiroInputs(inputs);

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
          <section className="space-y-4" aria-labelledby="decimo-remuneracao">
            <h2 id="decimo-remuneracao" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("sections.remuneration")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="salarioMensal">{t("fields.salarioMensal.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="salarioMensal"
                    data-testid="decimo-terceiro-salario"
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
                <Label htmlFor="mediaVariavelMensal">{t("fields.mediaVariavelMensal.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="mediaVariavelMensal"
                    inputMode="numeric"
                    value={mediaVariavelMensal}
                    onChange={(event) => handleCurrencyChange(event.target.value, setMediaVariavelMensal)}
                    placeholder={t("fields.mediaVariavelMensal.placeholder")}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="anoReferencia">{t("fields.anoReferencia.label")}</Label>
                <Input
                  id="anoReferencia"
                  inputMode="numeric"
                  value={anoReferencia}
                  onChange={(event) => handleYearChange(event.target.value)}
                  required
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="decimo-periodo">
            <h2 id="decimo-periodo" className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              {t("sections.period")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="modoCalculo">{t("fields.modoCalculo.label")}</Label>
                <Select value={modoCalculo} onValueChange={handleModeChange}>
                  <SelectTrigger
                    id="modoCalculo"
                    data-testid="decimo-terceiro-modo"
                    aria-label={t("fields.modoCalculo.label")}
                    className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODOS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {t(`fields.modoCalculo.options.${option}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataAdmissao">{t("fields.dataAdmissao.label")}</Label>
                <Input
                  id="dataAdmissao"
                  data-testid="decimo-terceiro-data-admissao"
                  type="date"
                  value={dataAdmissao}
                  onChange={(event) => setDataAdmissao(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataReferencia">{t("fields.dataReferencia.label")}</Label>
                <Input
                  id="dataReferencia"
                  data-testid="decimo-terceiro-data-referencia"
                  type="date"
                  value={dataReferencia}
                  onChange={(event) => setDataReferencia(event.target.value)}
                  required
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="decimo-parcelas">
            <h2 id="decimo-parcelas" className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <CircleDollarSign className="h-4 w-4" />
              {t("sections.installments")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-md border p-3">
                <input
                  id="calcularPrimeiraParcela"
                  type="checkbox"
                  checked={calcularPrimeiraParcela}
                  onChange={(event) => setCalcularPrimeiraParcela(event.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="calcularPrimeiraParcela" className="text-sm leading-snug">
                  {t("fields.calcularPrimeiraParcela.label")}
                </Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adiantamentoJaRecebido">{t("fields.adiantamentoJaRecebido.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="adiantamentoJaRecebido"
                    data-testid="decimo-terceiro-adiantamento"
                    inputMode="numeric"
                    value={adiantamentoJaRecebido}
                    onChange={(event) => handleCurrencyChange(event.target.value, setAdiantamentoJaRecebido)}
                    placeholder={t("fields.adiantamentoJaRecebido.placeholder")}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="decimo-descontos">
            <h2 id="decimo-descontos" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("sections.deductions")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-3 rounded-md border p-3 lg:col-span-3">
                <input
                  id="calcularDescontosLegais"
                  data-testid="decimo-terceiro-descontos-legais"
                  type="checkbox"
                  checked={calcularDescontosLegais}
                  onChange={(event) => setCalcularDescontosLegais(event.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="calcularDescontosLegais" className="text-sm leading-snug">
                  {t("fields.calcularDescontosLegais.label")}
                </Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dependentesIr">{t("fields.dependentesIr.label")}</Label>
                <Input
                  id="dependentesIr"
                  inputMode="numeric"
                  value={dependentesIr}
                  onChange={(event) => setDependentesIr(event.target.value.replace(/\D/g, ""))}
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
              <div className="space-y-2">
                <Label htmlFor="outrosDescontos">{t("fields.outrosDescontos.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="outrosDescontos"
                    inputMode="numeric"
                    value={outrosDescontos}
                    onChange={(event) => handleCurrencyChange(event.target.value, setOutrosDescontos)}
                    placeholder={t("fields.outrosDescontos.placeholder")}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="outrosAcrescimos">{t("fields.outrosAcrescimos.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="outrosAcrescimos"
                    inputMode="numeric"
                    value={outrosAcrescimos}
                    onChange={(event) => handleCurrencyChange(event.target.value, setOutrosAcrescimos)}
                    placeholder={t("fields.outrosAcrescimos.placeholder")}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" data-testid="decimo-terceiro-submit">
            {t("submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

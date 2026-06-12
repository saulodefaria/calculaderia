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
  getDefaultFeriasInputs,
  getFeriasEntitlement,
  validateFeriasInputs,
  type InputsFerias,
  type ModoFerias,
} from "@/lib/calculators/ferias";

interface CalculatorFormProps {
  onCalculate: (inputs: InputsFerias) => void;
  initialValues?: InputsFerias | null;
}

const MODOS: ModoFerias[] = ["gozo", "proporcional", "vencidas"];

function currencyInitial(value: number | undefined): string {
  return value && value > 0 ? formatCurrencyFromNumber(value) : "";
}

function toInteger(value: string): number {
  return parseInt(value, 10) || 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function CalculatorForm({ onCalculate, initialValues }: CalculatorFormProps) {
  const t = useTranslations("calculators.ferias.form");
  const defaults = useMemo(() => initialValues ?? getDefaultFeriasInputs(), [initialValues]);

  const [salarioMensal, setSalarioMensal] = useState(() => currencyInitial(defaults.salarioMensal));
  const [mediaVariavelMensal, setMediaVariavelMensal] = useState(() => currencyInitial(defaults.mediaVariavelMensal));
  const [modo, setModo] = useState<ModoFerias>(defaults.modo);
  const [dataInicioPeriodoAquisitivo, setDataInicioPeriodoAquisitivo] = useState(defaults.dataInicioPeriodoAquisitivo);
  const [dataReferencia, setDataReferencia] = useState(defaults.dataReferencia);
  const [dataInicioFerias, setDataInicioFerias] = useState(defaults.dataInicioFerias);
  const [faltasInjustificadas, setFaltasInjustificadas] = useState(defaults.faltasInjustificadas.toString());
  const [diasFerias, setDiasFerias] = useState(defaults.diasFerias.toString());
  const [converterAbono, setConverterAbono] = useState(defaults.converterAbono);
  const [diasAbono, setDiasAbono] = useState(defaults.diasAbono.toString());
  const [incluirSalarioDiasVendidos, setIncluirSalarioDiasVendidos] = useState(defaults.incluirSalarioDiasVendidos);
  const [dependentesIr, setDependentesIr] = useState(defaults.dependentesIr.toString());
  const [pensaoAlimenticia, setPensaoAlimenticia] = useState(() => currencyInitial(defaults.pensaoAlimenticia));
  const [outrosDescontos, setOutrosDescontos] = useState(() => currencyInitial(defaults.outrosDescontos));
  const [outrosAcrescimos, setOutrosAcrescimos] = useState(() => currencyInitial(defaults.outrosAcrescimos));
  const [calcularDescontosLegais, setCalcularDescontosLegais] = useState(defaults.calcularDescontosLegais);
  const [error, setError] = useState<string | null>(null);

  const faltasNumber = clamp(toInteger(faltasInjustificadas), 0, 33);
  const entitlement = useMemo(() => getFeriasEntitlement(faltasNumber), [faltasNumber]);
  const abonoDisponivel = modo === "gozo" && entitlement.diasDireito > 0;
  const diasAbonoNumber = converterAbono ? clamp(toInteger(diasAbono), 0, entitlement.diasAbonoMax) : 0;
  const diasFeriasMax = Math.max(0, entitlement.diasDireito - diasAbonoNumber);

  const handleCurrencyChange = (value: string, setter: (next: string) => void) => {
    setter(formatCurrencyInput(value));
  };

  const handleIntegerChange = (value: string, setter: (next: string) => void) => {
    setter(value.replace(/\D/g, ""));
  };

  const syncVacationDaysForEntitlement = (nextFaltas: number) => {
    const nextEntitlement = getFeriasEntitlement(clamp(nextFaltas, 0, 33));
    if (!converterAbono) {
      setDiasFerias(nextEntitlement.diasDireito.toString());
      setDiasAbono("0");
      return;
    }

    const nextAbono = Math.min(toInteger(diasAbono) || nextEntitlement.diasAbonoMax, nextEntitlement.diasAbonoMax);
    setDiasAbono(nextAbono.toString());
    setDiasFerias(Math.max(0, nextEntitlement.diasDireito - nextAbono).toString());
  };

  const handleModoChange = (value: string) => {
    const nextModo = value as ModoFerias;
    setModo(nextModo);
    if (nextModo !== "gozo") {
      setConverterAbono(false);
      setDiasAbono("0");
      setCalcularDescontosLegais(false);
    } else {
      setCalcularDescontosLegais(true);
    }
  };

  const handleAbonoChange = (checked: boolean) => {
    setConverterAbono(checked);
    if (!checked) {
      setDiasAbono("0");
      setDiasFerias(entitlement.diasDireito.toString());
      return;
    }

    const defaultAbono = entitlement.diasAbonoMax;
    setDiasAbono(defaultAbono.toString());
    setDiasFerias(Math.max(0, entitlement.diasDireito - defaultAbono).toString());
    setIncluirSalarioDiasVendidos(true);
  };

  const buildInputs = (): InputsFerias => ({
    salarioMensal: parseCurrencyValue(salarioMensal),
    mediaVariavelMensal: parseCurrencyValue(mediaVariavelMensal),
    modo,
    dataInicioPeriodoAquisitivo,
    dataReferencia,
    dataInicioFerias,
    faltasInjustificadas: toInteger(faltasInjustificadas),
    diasFerias: toInteger(diasFerias),
    converterAbono,
    diasAbono: converterAbono ? toInteger(diasAbono) : 0,
    incluirSalarioDiasVendidos,
    dependentesIr: toInteger(dependentesIr),
    pensaoAlimenticia: parseCurrencyValue(pensaoAlimenticia),
    outrosDescontos: parseCurrencyValue(outrosDescontos),
    outrosAcrescimos: parseCurrencyValue(outrosAcrescimos),
    calcularDescontosLegais,
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const inputs = buildInputs();
    const errors = validateFeriasInputs(inputs);

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
          <section className="space-y-4" aria-labelledby="ferias-remuneracao">
            <h2 id="ferias-remuneracao" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("sections.remuneration")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="ferias-tipo">
            <h2 id="ferias-tipo" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("sections.type")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="modo">{t("fields.modo.label")}</Label>
                <Select value={modo} onValueChange={handleModoChange}>
                  <SelectTrigger id="modo" aria-label={t("fields.modo.label")} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODOS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {t(`fields.modo.options.${option}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-md border bg-muted/20 p-3 text-sm">
                <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("entitlementPreview.label")}
                </span>
                <span className="mt-1 block font-mono font-semibold">
                  {t("entitlementPreview.value", { days: entitlement.diasDireito, max: entitlement.diasAbonoMax })}
                </span>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="ferias-periodo">
            <h2
              id="ferias-periodo"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              {t("sections.period")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="dataInicioPeriodoAquisitivo">{t("fields.dataInicioPeriodoAquisitivo.label")}</Label>
                <Input
                  id="dataInicioPeriodoAquisitivo"
                  type="date"
                  value={dataInicioPeriodoAquisitivo}
                  onChange={(event) => setDataInicioPeriodoAquisitivo(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataReferencia">{t("fields.dataReferencia.label")}</Label>
                <Input
                  id="dataReferencia"
                  type="date"
                  value={dataReferencia}
                  onChange={(event) => setDataReferencia(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataInicioFerias">{t("fields.dataInicioFerias.label")}</Label>
                <Input
                  id="dataInicioFerias"
                  type="date"
                  value={dataInicioFerias}
                  onChange={(event) => setDataInicioFerias(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faltasInjustificadas">{t("fields.faltasInjustificadas.label")}</Label>
                <Input
                  id="faltasInjustificadas"
                  inputMode="numeric"
                  value={faltasInjustificadas}
                  onChange={(event) => {
                    handleIntegerChange(event.target.value, setFaltasInjustificadas);
                    syncVacationDaysForEntitlement(toInteger(event.target.value));
                  }}
                  min={0}
                  max={33}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="ferias-dias-abono">
            <h2 id="ferias-dias-abono" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("sections.days")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="diasFerias">{t("fields.diasFerias.label")}</Label>
                <Input
                  id="diasFerias"
                  inputMode="numeric"
                  value={diasFerias}
                  onChange={(event) => handleIntegerChange(event.target.value, setDiasFerias)}
                  min={0}
                  max={diasFeriasMax}
                />
              </div>
              <div className="flex items-center gap-3 rounded-md border p-3">
                <input
                  id="converterAbono"
                  type="checkbox"
                  checked={converterAbono}
                  onChange={(event) => handleAbonoChange(event.target.checked)}
                  disabled={!abonoDisponivel}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="converterAbono" className="text-sm leading-snug">
                  {t("fields.converterAbono.label")}
                </Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="diasAbono">{t("fields.diasAbono.label")}</Label>
                <Input
                  id="diasAbono"
                  inputMode="numeric"
                  value={diasAbono}
                  onChange={(event) => {
                    handleIntegerChange(event.target.value, setDiasAbono);
                    const nextAbono = clamp(toInteger(event.target.value), 0, entitlement.diasAbonoMax);
                    setDiasFerias(Math.max(0, entitlement.diasDireito - nextAbono).toString());
                  }}
                  min={0}
                  max={entitlement.diasAbonoMax}
                  disabled={!converterAbono || !abonoDisponivel}
                />
              </div>
              <div className="flex items-center gap-3 rounded-md border p-3">
                <input
                  id="incluirSalarioDiasVendidos"
                  type="checkbox"
                  checked={incluirSalarioDiasVendidos}
                  onChange={(event) => setIncluirSalarioDiasVendidos(event.target.checked)}
                  disabled={!converterAbono || !abonoDisponivel}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="incluirSalarioDiasVendidos" className="text-sm leading-snug">
                  {t("fields.incluirSalarioDiasVendidos.label")}
                </Label>
              </div>
            </div>
            {!abonoDisponivel && <p className="text-sm text-muted-foreground">{t("abonoUnavailable")}</p>}
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="ferias-descontos">
            <h2
              id="ferias-descontos"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <CircleDollarSign className="h-4 w-4" />
              {t("sections.deductions")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="flex items-center gap-3 rounded-md border p-3">
                <input
                  id="calcularDescontosLegais"
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
                  onChange={(event) => handleIntegerChange(event.target.value, setDependentesIr)}
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
            </div>
          </section>

          {error && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full sm:w-auto">
            {t("submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

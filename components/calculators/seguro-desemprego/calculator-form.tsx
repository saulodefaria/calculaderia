"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { BriefcaseBusiness, Calculator, CalendarDays, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrencyFromNumber, formatCurrencyInput, parseCurrencyValue } from "@/lib/utils/index";
import {
  getDefaultSeguroDesempregoInputs,
  getSeguroDesempregoEligibilityThreshold,
  validateSeguroDesempregoInputs,
  type SeguroDesempregoInputs,
  type SeguroDesempregoMotivoDispensa,
  type SeguroDesempregoNumeroSolicitacao,
} from "@/lib/calculators/seguro-desemprego";

interface CalculatorFormProps {
  onCalculate: (inputs: SeguroDesempregoInputs) => void;
  initialValues?: SeguroDesempregoInputs | null;
}

const REQUEST_OPTIONS: SeguroDesempregoNumeroSolicitacao[] = ["primeira", "segunda", "terceiraOuMais"];
const REASON_OPTIONS: SeguroDesempregoMotivoDispensa[] = [
  "semJustaCausa",
  "rescisaoIndireta",
  "pedidoDemissao",
  "justaCausa",
  "acordo",
  "pdv",
  "outro",
];

function currencyInitial(value: number | undefined): string {
  return value && value > 0 ? formatCurrencyFromNumber(value) : "";
}

function toInteger(value: string): number {
  return parseInt(value, 10) || 0;
}

export function CalculatorForm({ onCalculate, initialValues }: CalculatorFormProps) {
  const t = useTranslations("calculators.seguro-desemprego.form");
  const defaults = useMemo(() => initialValues ?? getDefaultSeguroDesempregoInputs(), [initialValues]);

  const [salarioUltimo, setSalarioUltimo] = useState(() => currencyInitial(defaults.salarioUltimo));
  const [salarioPenultimo, setSalarioPenultimo] = useState(() => currencyInitial(defaults.salarioPenultimo));
  const [salarioAntepenultimo, setSalarioAntepenultimo] = useState(() =>
    currencyInitial(defaults.salarioAntepenultimo)
  );
  const [numeroSolicitacao, setNumeroSolicitacao] = useState<SeguroDesempregoNumeroSolicitacao>(
    defaults.numeroSolicitacao
  );
  const [mesesComSalarioElegibilidade, setMesesComSalarioElegibilidade] = useState(
    defaults.mesesComSalarioElegibilidade.toString()
  );
  const [mesesTrabalhados36, setMesesTrabalhados36] = useState(defaults.mesesTrabalhados36.toString());
  const [motivoDispensa, setMotivoDispensa] = useState<SeguroDesempregoMotivoDispensa>(defaults.motivoDispensa);
  const [dataDispensa, setDataDispensa] = useState(defaults.dataDispensa);
  const [dataRequerimento, setDataRequerimento] = useState(defaults.dataRequerimento);
  const [desempregadoNoRequerimento, setDesempregadoNoRequerimento] = useState(
    defaults.desempregadoNoRequerimento
  );
  const [semRendaPropriaSuficiente, setSemRendaPropriaSuficiente] = useState(
    defaults.semRendaPropriaSuficiente
  );
  const [semBeneficioContinuadoIncompativel, setSemBeneficioContinuadoIncompativel] = useState(
    defaults.semBeneficioContinuadoIncompativel
  );
  const [error, setError] = useState<string | null>(null);

  const threshold = getSeguroDesempregoEligibilityThreshold(numeroSolicitacao);

  const handleCurrencyChange = (value: string, setter: (next: string) => void) => {
    setter(formatCurrencyInput(value));
  };

  const handleIntegerChange = (value: string, setter: (next: string) => void) => {
    setter(value.replace(/\D/g, ""));
  };

  const buildInputs = (): SeguroDesempregoInputs => ({
    salarioUltimo: parseCurrencyValue(salarioUltimo),
    salarioPenultimo: parseCurrencyValue(salarioPenultimo),
    salarioAntepenultimo: parseCurrencyValue(salarioAntepenultimo),
    numeroSolicitacao,
    mesesComSalarioElegibilidade: toInteger(mesesComSalarioElegibilidade),
    mesesTrabalhados36: toInteger(mesesTrabalhados36),
    motivoDispensa,
    dataDispensa,
    dataRequerimento,
    desempregadoNoRequerimento,
    semRendaPropriaSuficiente,
    semBeneficioContinuadoIncompativel,
    tabelaAno: 2026,
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const inputs = buildInputs();
    const errors = validateSeguroDesempregoInputs(inputs);

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
          <section className="space-y-4" aria-labelledby="seguro-desemprego-salarios">
            <h2
              id="seguro-desemprego-salarios"
              className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("sections.salaries")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("helpers.salaries")}</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="salarioUltimo">{t("fields.salarioUltimo.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="salarioUltimo"
                    inputMode="numeric"
                    value={salarioUltimo}
                    onChange={(event) => handleCurrencyChange(event.target.value, setSalarioUltimo)}
                    placeholder={t("fields.salarioUltimo.placeholder")}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salarioPenultimo">{t("fields.salarioPenultimo.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="salarioPenultimo"
                    inputMode="numeric"
                    value={salarioPenultimo}
                    onChange={(event) => handleCurrencyChange(event.target.value, setSalarioPenultimo)}
                    placeholder={t("fields.salarioPenultimo.placeholder")}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salarioAntepenultimo">{t("fields.salarioAntepenultimo.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="salarioAntepenultimo"
                    inputMode="numeric"
                    value={salarioAntepenultimo}
                    onChange={(event) => handleCurrencyChange(event.target.value, setSalarioAntepenultimo)}
                    placeholder={t("fields.salarioAntepenultimo.placeholder")}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="seguro-desemprego-solicitacao">
            <h2
              id="seguro-desemprego-solicitacao"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <BriefcaseBusiness className="h-4 w-4" />
              {t("sections.request")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="numeroSolicitacao">{t("fields.numeroSolicitacao.label")}</Label>
                <Select
                  value={numeroSolicitacao}
                  onValueChange={(value) => setNumeroSolicitacao(value as SeguroDesempregoNumeroSolicitacao)}>
                  <SelectTrigger id="numeroSolicitacao" aria-label={t("fields.numeroSolicitacao.label")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REQUEST_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {t(`fields.numeroSolicitacao.options.${option}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mesesComSalarioElegibilidade">
                  {t("fields.mesesComSalarioElegibilidade.label")}
                </Label>
                <Input
                  id="mesesComSalarioElegibilidade"
                  inputMode="numeric"
                  value={mesesComSalarioElegibilidade}
                  onChange={(event) => handleIntegerChange(event.target.value, setMesesComSalarioElegibilidade)}
                  min={0}
                  max={36}
                />
                <p className="text-xs text-muted-foreground">
                  {threshold.consecutive
                    ? t("helpers.thresholdConsecutive", { months: threshold.requiredMonths })
                    : t("helpers.thresholdWindow", {
                        months: threshold.requiredMonths,
                        window: threshold.windowMonths,
                      })}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mesesTrabalhados36">{t("fields.mesesTrabalhados36.label")}</Label>
                <Input
                  id="mesesTrabalhados36"
                  inputMode="numeric"
                  value={mesesTrabalhados36}
                  onChange={(event) => handleIntegerChange(event.target.value, setMesesTrabalhados36)}
                  min={0}
                  max={36}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="seguro-desemprego-demissao">
            <h2
              id="seguro-desemprego-demissao"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              {t("sections.dismissal")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="motivoDispensa">{t("fields.motivoDispensa.label")}</Label>
                <Select
                  value={motivoDispensa}
                  onValueChange={(value) => setMotivoDispensa(value as SeguroDesempregoMotivoDispensa)}>
                  <SelectTrigger id="motivoDispensa" aria-label={t("fields.motivoDispensa.label")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REASON_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {t(`fields.motivoDispensa.options.${option}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataDispensa">{t("fields.dataDispensa.label")}</Label>
                <Input
                  id="dataDispensa"
                  type="date"
                  value={dataDispensa}
                  onChange={(event) => setDataDispensa(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataRequerimento">{t("fields.dataRequerimento.label")}</Label>
                <Input
                  id="dataRequerimento"
                  type="date"
                  value={dataRequerimento}
                  onChange={(event) => setDataRequerimento(event.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="seguro-desemprego-declaracoes">
            <h2
              id="seguro-desemprego-declaracoes"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              {t("sections.declarations")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("helpers.declarations")}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-md border p-3">
                <input
                  id="desempregadoNoRequerimento"
                  type="checkbox"
                  checked={desempregadoNoRequerimento}
                  onChange={(event) => setDesempregadoNoRequerimento(event.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="desempregadoNoRequerimento" className="text-sm leading-snug">
                  {t("fields.desempregadoNoRequerimento.label")}
                </Label>
              </div>
              <div className="flex items-center gap-3 rounded-md border p-3">
                <input
                  id="semRendaPropriaSuficiente"
                  type="checkbox"
                  checked={semRendaPropriaSuficiente}
                  onChange={(event) => setSemRendaPropriaSuficiente(event.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="semRendaPropriaSuficiente" className="text-sm leading-snug">
                  {t("fields.semRendaPropriaSuficiente.label")}
                </Label>
              </div>
              <div className="flex items-center gap-3 rounded-md border p-3">
                <input
                  id="semBeneficioContinuadoIncompativel"
                  type="checkbox"
                  checked={semBeneficioContinuadoIncompativel}
                  onChange={(event) => setSemBeneficioContinuadoIncompativel(event.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="semBeneficioContinuadoIncompativel" className="text-sm leading-snug">
                  {t("fields.semBeneficioContinuadoIncompativel.label")}
                </Label>
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

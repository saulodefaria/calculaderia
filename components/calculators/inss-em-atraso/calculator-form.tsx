"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { CalendarClock, Landmark, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrencyFromNumber, formatCurrencyInput, parseCurrencyValue } from "@/lib/utils/index";
import {
  getDefaultInssEmAtrasoDueDate,
  getDefaultInssEmAtrasoInputs,
  validateInssEmAtrasoInputs,
  type InssEmAtrasoCategoriaSegurado,
  type InssEmAtrasoInputs,
} from "@/lib/calculators/inss-em-atraso";

interface CalculatorFormProps {
  onCalculate: (inputs: InssEmAtrasoInputs) => void;
  initialValues?: InssEmAtrasoInputs | null;
}

const CATEGORIES: InssEmAtrasoCategoriaSegurado[] = ["contribuinteIndividual", "facultativo"];

function currencyInitial(value: number | undefined): string {
  return value && value > 0 ? formatCurrencyFromNumber(value) : "";
}

function manualDaysInitial(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : value.toString();
}

function sanitizeInteger(value: string): string {
  return value.replace(/\D/g, "").slice(0, 5);
}

export function CalculatorForm({ onCalculate, initialValues }: CalculatorFormProps) {
  const t = useTranslations("calculators.inss-em-atraso.form");
  const defaults = useMemo(() => initialValues ?? getDefaultInssEmAtrasoInputs(), [initialValues]);

  const [valorPrincipal, setValorPrincipal] = useState(() => currencyInitial(defaults.valorPrincipal));
  const [competencia, setCompetencia] = useState(defaults.competencia);
  const [categoriaSegurado, setCategoriaSegurado] = useState<InssEmAtrasoCategoriaSegurado>(
    defaults.categoriaSegurado
  );
  const [dataVencimento, setDataVencimento] = useState(defaults.dataVencimento);
  const [dataPagamento, setDataPagamento] = useState(defaults.dataPagamento);
  const [diasAtrasoManual, setDiasAtrasoManual] = useState(() => manualDaysInitial(defaults.diasAtrasoManual));
  const [confirmarPrincipalUsuario, setConfirmarPrincipalUsuario] = useState(defaults.confirmarPrincipalUsuario);
  const [error, setError] = useState<string | null>(null);

  const handleCompetenciaChange = (value: string) => {
    setCompetencia(value);
    const nextDueDate = getDefaultInssEmAtrasoDueDate(value);
    if (nextDueDate) setDataVencimento(nextDueDate);
  };

  const buildInputs = (): InssEmAtrasoInputs => ({
    valorPrincipal: parseCurrencyValue(valorPrincipal),
    competencia,
    categoriaSegurado,
    dataVencimento,
    dataPagamento,
    diasAtrasoManual: diasAtrasoManual === "" ? null : Number(diasAtrasoManual),
    confirmarPrincipalUsuario,
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const inputs = buildInputs();
    const errors = validateInssEmAtrasoInputs(inputs).filter((errorCode) => errorCode !== "pagamentoAntesVencimento");

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
          <ReceiptText className="h-5 w-5" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="space-y-4" aria-labelledby="inss-atraso-principal">
            <h2
              id="inss-atraso-principal"
              className="flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground">
              <Landmark className="h-4 w-4" />
              {t("sections.principal")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="valorPrincipal">{t("fields.valorPrincipal.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="valorPrincipal"
                    inputMode="numeric"
                    value={valorPrincipal}
                    onChange={(event) => setValorPrincipal(formatCurrencyInput(event.target.value))}
                    placeholder={t("fields.valorPrincipal.placeholder")}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t("helpers.principal")}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="competencia">{t("fields.competencia.label")}</Label>
                <Input
                  id="competencia"
                  type="month"
                  value={competencia}
                  onChange={(event) => handleCompetenciaChange(event.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">{t("helpers.competencia")}</p>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="inss-atraso-categoria">
            <h2 id="inss-atraso-categoria" className="text-sm font-semibold uppercase text-muted-foreground">
              {t("sections.category")}
            </h2>
            <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label={t("fields.categoriaSegurado.label")}>
              {CATEGORIES.map((category) => (
                <Button
                  key={category}
                  id={`categoriaSegurado-${category}`}
                  type="button"
                  variant={categoriaSegurado === category ? "default" : "outline"}
                  onClick={() => setCategoriaSegurado(category)}
                  className="w-full">
                  {t(`fields.categoriaSegurado.options.${category}`)}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{t("helpers.category")}</p>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="inss-atraso-datas">
            <h2
              id="inss-atraso-datas"
              className="flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              {t("sections.dates")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dataVencimento">{t("fields.dataVencimento.label")}</Label>
                <Input
                  id="dataVencimento"
                  type="date"
                  value={dataVencimento}
                  onChange={(event) => setDataVencimento(event.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">{t("helpers.dueDate")}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataPagamento">{t("fields.dataPagamento.label")}</Label>
                <Input
                  id="dataPagamento"
                  type="date"
                  value={dataPagamento}
                  onChange={(event) => setDataPagamento(event.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">{t("helpers.paymentDate")}</p>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="inss-atraso-ajustes">
            <h2 id="inss-atraso-ajustes" className="text-sm font-semibold uppercase text-muted-foreground">
              {t("sections.adjustments")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="diasAtrasoManual">{t("fields.diasAtrasoManual.label")}</Label>
                <Input
                  id="diasAtrasoManual"
                  inputMode="numeric"
                  value={diasAtrasoManual}
                  onChange={(event) => setDiasAtrasoManual(sanitizeInteger(event.target.value))}
                  placeholder={t("fields.diasAtrasoManual.placeholder")}
                />
                <p className="text-xs text-muted-foreground">{t("helpers.manualDays")}</p>
              </div>
              <div className="flex items-start gap-3 rounded-md border p-4">
                <input
                  id="confirmarPrincipalUsuario"
                  type="checkbox"
                  checked={confirmarPrincipalUsuario}
                  onChange={(event) => setConfirmarPrincipalUsuario(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-input"
                />
                <div className="space-y-1">
                  <Label htmlFor="confirmarPrincipalUsuario">{t("fields.confirmarPrincipalUsuario.label")}</Label>
                  <p className="text-xs text-muted-foreground">{t("helpers.acknowledgement")}</p>
                </div>
              </div>
            </div>
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

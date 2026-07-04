"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Calculator, CalendarDays, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrencyFromNumber, formatCurrencyInput, parseCurrencyValue } from "@/lib/utils/index";
import {
  getDefaultRescisaoSemFgtsInputs,
  validateRescisaoSemFgtsInputs,
  type AvisoPrevioPedidoRescisaoSemFgts,
  type CenarioRescisaoSemFgts,
  type InputsRescisaoSemFgts,
} from "@/lib/calculators/rescisao-sem-fgts";

interface CalculatorFormProps {
  onCalculate: (inputs: InputsRescisaoSemFgts) => void;
  initialValues?: InputsRescisaoSemFgts | null;
}

const CENARIOS: CenarioRescisaoSemFgts[] = ["pedidoDemissao", "justaCausa"];
const AVISOS_PEDIDO: AvisoPrevioPedidoRescisaoSemFgts[] = ["trabalhado", "dispensado", "descontado"];

function currencyInitial(value: number | undefined): string {
  return value && value > 0 ? formatCurrencyFromNumber(value) : "";
}

function toInteger(value: string): number {
  return parseInt(value, 10) || 0;
}

export function CalculatorForm({ onCalculate, initialValues }: CalculatorFormProps) {
  const t = useTranslations("calculators.rescisao-sem-fgts.form");
  const defaults = useMemo(() => initialValues ?? getDefaultRescisaoSemFgtsInputs(), [initialValues]);

  const [salarioMensal, setSalarioMensal] = useState(() => currencyInitial(defaults.salarioMensal));
  const [mediaVariavelMensal, setMediaVariavelMensal] = useState(() => currencyInitial(defaults.mediaVariavelMensal));
  const [dataAdmissao, setDataAdmissao] = useState(defaults.dataAdmissao);
  const [dataDesligamento, setDataDesligamento] = useState(defaults.dataDesligamento);
  const [cenarioSemFgts, setCenarioSemFgts] = useState<CenarioRescisaoSemFgts>(defaults.cenarioSemFgts);
  const [avisoPrevioPedido, setAvisoPrevioPedido] = useState<AvisoPrevioPedidoRescisaoSemFgts>(
    defaults.avisoPrevioPedido
  );
  const [diasTrabalhadosMes, setDiasTrabalhadosMes] = useState(defaults.diasTrabalhadosMes.toString());
  const [diasEditados, setDiasEditados] = useState(Boolean(initialValues));
  const [feriasVencidasPeriodos, setFeriasVencidasPeriodos] = useState(defaults.feriasVencidasPeriodos.toString());
  const [dependentesIr, setDependentesIr] = useState(defaults.dependentesIr.toString());
  const [adiantamentoDecimoTerceiro, setAdiantamentoDecimoTerceiro] = useState(() =>
    currencyInitial(defaults.adiantamentoDecimoTerceiro)
  );
  const [adiantamentoFerias, setAdiantamentoFerias] = useState(() => currencyInitial(defaults.adiantamentoFerias));
  const [outrosCreditos, setOutrosCreditos] = useState(() => currencyInitial(defaults.outrosCreditos));
  const [outrosDescontos, setOutrosDescontos] = useState(() => currencyInitial(defaults.outrosDescontos));
  const [calcularDescontosLegais, setCalcularDescontosLegais] = useState(defaults.calcularDescontosLegais);
  const [error, setError] = useState<string | null>(null);

  const handleCurrencyChange = (value: string, setter: (next: string) => void) => {
    setter(formatCurrencyInput(value));
  };

  const handleIntegerChange = (value: string, setter: (next: string) => void) => {
    setter(value.replace(/\D/g, ""));
  };

  const handleDataDesligamentoChange = (value: string) => {
    setDataDesligamento(value);
    if (!diasEditados) {
      const day = Number(value.split("-")[2]);
      if (Number.isFinite(day) && day > 0) {
        setDiasTrabalhadosMes(Math.min(day, 30).toString());
      }
    }
  };

  const buildInputs = (): InputsRescisaoSemFgts => ({
    salarioMensal: parseCurrencyValue(salarioMensal),
    mediaVariavelMensal: parseCurrencyValue(mediaVariavelMensal),
    dataAdmissao,
    dataDesligamento,
    cenarioSemFgts,
    avisoPrevioPedido,
    diasTrabalhadosMes: toInteger(diasTrabalhadosMes),
    feriasVencidasPeriodos: toInteger(feriasVencidasPeriodos),
    dependentesIr: toInteger(dependentesIr),
    adiantamentoDecimoTerceiro: parseCurrencyValue(adiantamentoDecimoTerceiro),
    adiantamentoFerias: parseCurrencyValue(adiantamentoFerias),
    outrosCreditos: parseCurrencyValue(outrosCreditos),
    outrosDescontos: parseCurrencyValue(outrosDescontos),
    calcularDescontosLegais,
    sourceVersion: defaults.sourceVersion,
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const inputs = buildInputs();
    const errors = validateRescisaoSemFgtsInputs(inputs);

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
          <section className="space-y-4" aria-labelledby="rescisao-sem-fgts-contrato">
            <h2
              id="rescisao-sem-fgts-contrato"
              className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("sections.contract")}
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
              <div className="space-y-2">
                <Label htmlFor="dataAdmissao">{t("fields.dataAdmissao.label")}</Label>
                <Input
                  id="dataAdmissao"
                  type="date"
                  value={dataAdmissao}
                  onChange={(event) => setDataAdmissao(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataDesligamento">{t("fields.dataDesligamento.label")}</Label>
                <Input
                  id="dataDesligamento"
                  type="date"
                  value={dataDesligamento}
                  onChange={(event) => handleDataDesligamentoChange(event.target.value)}
                  required
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="rescisao-sem-fgts-cenario">
            <h2
              id="rescisao-sem-fgts-cenario"
              className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("sections.scenario")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="cenarioSemFgts">{t("fields.cenarioSemFgts.label")}</Label>
                <Select value={cenarioSemFgts} onValueChange={(value) => setCenarioSemFgts(value as CenarioRescisaoSemFgts)}>
                  <SelectTrigger id="cenarioSemFgts" aria-label={t("fields.cenarioSemFgts.label")} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CENARIOS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {t(`fields.cenarioSemFgts.options.${option}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {cenarioSemFgts === "pedidoDemissao" ? (
                <div className="space-y-2">
                  <Label htmlFor="avisoPrevioPedido">{t("fields.avisoPrevioPedido.label")}</Label>
                  <Select
                    value={avisoPrevioPedido}
                    onValueChange={(value) => setAvisoPrevioPedido(value as AvisoPrevioPedidoRescisaoSemFgts)}>
                    <SelectTrigger
                      id="avisoPrevioPedido"
                      aria-label={t("fields.avisoPrevioPedido.label")}
                      className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVISOS_PEDIDO.map((option) => (
                        <SelectItem key={option} value={option}>
                          {t(`fields.avisoPrevioPedido.options.${option}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{t("helpers.withCauseNotice")}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="diasTrabalhadosMes">{t("fields.diasTrabalhadosMes.label")}</Label>
                <div className="relative">
                  <Input
                    id="diasTrabalhadosMes"
                    inputMode="numeric"
                    value={diasTrabalhadosMes}
                    onChange={(event) => {
                      setDiasEditados(true);
                      handleIntegerChange(event.target.value, setDiasTrabalhadosMes);
                    }}
                    className="pr-14"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {t("fields.diasTrabalhadosMes.suffix")}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{t("helpers.scenario")}</p>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="rescisao-sem-fgts-ferias-decimo">
            <h2
              id="rescisao-sem-fgts-ferias-decimo"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              {t("sections.vacation")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="feriasVencidasPeriodos">{t("fields.feriasVencidasPeriodos.label")}</Label>
                <Input
                  id="feriasVencidasPeriodos"
                  inputMode="numeric"
                  value={feriasVencidasPeriodos}
                  onChange={(event) => handleIntegerChange(event.target.value, setFeriasVencidasPeriodos)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adiantamentoDecimoTerceiro">{t("fields.adiantamentoDecimoTerceiro.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="adiantamentoDecimoTerceiro"
                    inputMode="numeric"
                    value={adiantamentoDecimoTerceiro}
                    onChange={(event) => handleCurrencyChange(event.target.value, setAdiantamentoDecimoTerceiro)}
                    placeholder={t("fields.adiantamentoDecimoTerceiro.placeholder")}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adiantamentoFerias">{t("fields.adiantamentoFerias.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="adiantamentoFerias"
                    inputMode="numeric"
                    value={adiantamentoFerias}
                    onChange={(event) => handleCurrencyChange(event.target.value, setAdiantamentoFerias)}
                    placeholder={t("fields.adiantamentoFerias.placeholder")}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="rescisao-sem-fgts-ajustes">
            <h2
              id="rescisao-sem-fgts-ajustes"
              className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("sections.adjustments")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <Label htmlFor="outrosCreditos">{t("fields.outrosCreditos.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="outrosCreditos"
                    inputMode="numeric"
                    value={outrosCreditos}
                    onChange={(event) => handleCurrencyChange(event.target.value, setOutrosCreditos)}
                    placeholder={t("fields.outrosCreditos.placeholder")}
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
            </div>
            <p className="text-sm text-muted-foreground">{t("helpers.fgts")}</p>
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

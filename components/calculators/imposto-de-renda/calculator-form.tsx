"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Calculator, Landmark, ReceiptText, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrencyFromNumber, formatCurrencyInput, parseCurrencyValue } from "@/lib/utils/index";
import {
  getDefaultImpostoDeRendaInputs,
  validateImpostoDeRendaInputs,
  type ImpostoDeRendaAnoCalendario,
  type ImpostoDeRendaInputs,
  type ImpostoDeRendaModoDeducao,
} from "@/lib/calculators/imposto-de-renda";

interface CalculatorFormProps {
  onCalculate: (inputs: ImpostoDeRendaInputs) => void;
  initialValues?: ImpostoDeRendaInputs | null;
}

interface CurrencyFieldProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
}

function currencyInitial(value: number | undefined): string {
  return value && value > 0 ? formatCurrencyFromNumber(value) : "";
}

function toInteger(value: string): number {
  return parseInt(value, 10) || 0;
}

function sanitizeCount(value: string): string {
  return value.replace(/\D/g, "").slice(0, 2);
}

function CurrencyField({ id, label, placeholder, value, onChange, helper }: CurrencyFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
        <Input
          id={id}
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(formatCurrencyInput(event.target.value))}
          placeholder={placeholder}
          className="pl-10"
        />
      </div>
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}

export function CalculatorForm({ onCalculate, initialValues }: CalculatorFormProps) {
  const t = useTranslations("calculators.imposto-de-renda.form");
  const defaults = useMemo(() => initialValues ?? getDefaultImpostoDeRendaInputs(), [initialValues]);

  const [anoCalendario, setAnoCalendario] = useState<ImpostoDeRendaAnoCalendario>(defaults.anoCalendario);
  const [rendimentosTributaveis, setRendimentosTributaveis] = useState(() =>
    currencyInitial(defaults.rendimentosTributaveis)
  );
  const [rendimentosIsentos, setRendimentosIsentos] = useState(() => currencyInitial(defaults.rendimentosIsentos));
  const [rendimentosExclusivos, setRendimentosExclusivos] = useState(() =>
    currencyInitial(defaults.rendimentosExclusivos)
  );
  const [impostoRetidoFonte, setImpostoRetidoFonte] = useState(() => currencyInitial(defaults.impostoRetidoFonte));
  const [carneLeaoPago, setCarneLeaoPago] = useState(() => currencyInitial(defaults.carneLeaoPago));
  const [impostoComplementarPago, setImpostoComplementarPago] = useState(() =>
    currencyInitial(defaults.impostoComplementarPago)
  );
  const [dependentes, setDependentes] = useState(defaults.dependentes.toString());
  const [previdenciaOficial, setPrevidenciaOficial] = useState(() => currencyInitial(defaults.previdenciaOficial));
  const [pensaoAlimenticia, setPensaoAlimenticia] = useState(() => currencyInitial(defaults.pensaoAlimenticia));
  const [despesasMedicas, setDespesasMedicas] = useState(() => currencyInitial(defaults.despesasMedicas));
  const [despesasInstrucao, setDespesasInstrucao] = useState(() => currencyInitial(defaults.despesasInstrucao));
  const [pessoasInstrucao, setPessoasInstrucao] = useState(defaults.pessoasInstrucao.toString());
  const [previdenciaComplementar, setPrevidenciaComplementar] = useState(() =>
    currencyInitial(defaults.previdenciaComplementar)
  );
  const [livroCaixa, setLivroCaixa] = useState(() => currencyInitial(defaults.livroCaixa));
  const [outrasDeducoesLegais, setOutrasDeducoesLegais] = useState(() =>
    currencyInitial(defaults.outrasDeducoesLegais)
  );
  const [modoDeducao, setModoDeducao] = useState<ImpostoDeRendaModoDeducao>(defaults.modoDeducao);
  const [error, setError] = useState<string | null>(null);

  const buildInputs = (): ImpostoDeRendaInputs => ({
    anoCalendario,
    rendimentosTributaveis: parseCurrencyValue(rendimentosTributaveis),
    rendimentosIsentos: parseCurrencyValue(rendimentosIsentos),
    rendimentosExclusivos: parseCurrencyValue(rendimentosExclusivos),
    impostoRetidoFonte: parseCurrencyValue(impostoRetidoFonte),
    carneLeaoPago: parseCurrencyValue(carneLeaoPago),
    impostoComplementarPago: parseCurrencyValue(impostoComplementarPago),
    dependentes: toInteger(dependentes),
    previdenciaOficial: parseCurrencyValue(previdenciaOficial),
    pensaoAlimenticia: parseCurrencyValue(pensaoAlimenticia),
    despesasMedicas: parseCurrencyValue(despesasMedicas),
    despesasInstrucao: parseCurrencyValue(despesasInstrucao),
    pessoasInstrucao: toInteger(pessoasInstrucao),
    previdenciaComplementar: parseCurrencyValue(previdenciaComplementar),
    livroCaixa: parseCurrencyValue(livroCaixa),
    outrasDeducoesLegais: parseCurrencyValue(outrasDeducoesLegais),
    modoDeducao,
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const inputs = buildInputs();
    const errors = validateImpostoDeRendaInputs(inputs);

    if (errors.length > 0) {
      setError(t(`validation.${errors[0]}`));
      return;
    }

    setError(null);
    onCalculate(inputs);
  };

  const yearOptions: ImpostoDeRendaAnoCalendario[] = [2025, 2026];
  const modeOptions: ImpostoDeRendaModoDeducao[] = ["auto", "legais", "simplificado"];

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
          <section className="space-y-4" aria-labelledby="imposto-de-renda-periodo">
            <h2
              id="imposto-de-renda-periodo"
              className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("sections.period")}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {yearOptions.map((year) => (
                <Button
                  key={year}
                  id={`anoCalendario-${year}`}
                  type="button"
                  variant={anoCalendario === year ? "default" : "outline"}
                  className="h-auto justify-start whitespace-normal py-3 text-left"
                  aria-pressed={anoCalendario === year}
                  onClick={() => setAnoCalendario(year)}>
                  {t(`fields.anoCalendario.options.${year}`)}
                </Button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{t("helpers.period")}</p>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="imposto-de-renda-rendimentos">
            <h2
              id="imposto-de-renda-rendimentos"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <WalletCards className="h-4 w-4" />
              {t("sections.income")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("helpers.income")}</p>
            <div className="grid gap-4 md:grid-cols-3">
              <CurrencyField
                id="rendimentosTributaveis"
                label={t("fields.rendimentosTributaveis.label")}
                placeholder={t("fields.rendimentosTributaveis.placeholder")}
                value={rendimentosTributaveis}
                onChange={setRendimentosTributaveis}
              />
              <CurrencyField
                id="rendimentosIsentos"
                label={t("fields.rendimentosIsentos.label")}
                placeholder={t("fields.rendimentosIsentos.placeholder")}
                value={rendimentosIsentos}
                onChange={setRendimentosIsentos}
                helper={t("helpers.informationalIncome")}
              />
              <CurrencyField
                id="rendimentosExclusivos"
                label={t("fields.rendimentosExclusivos.label")}
                placeholder={t("fields.rendimentosExclusivos.placeholder")}
                value={rendimentosExclusivos}
                onChange={setRendimentosExclusivos}
                helper={t("helpers.informationalIncome")}
              />
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="imposto-de-renda-pago">
            <h2
              id="imposto-de-renda-pago"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Landmark className="h-4 w-4" />
              {t("sections.paidTax")}
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <CurrencyField
                id="impostoRetidoFonte"
                label={t("fields.impostoRetidoFonte.label")}
                placeholder={t("fields.impostoRetidoFonte.placeholder")}
                value={impostoRetidoFonte}
                onChange={setImpostoRetidoFonte}
              />
              <CurrencyField
                id="carneLeaoPago"
                label={t("fields.carneLeaoPago.label")}
                placeholder={t("fields.carneLeaoPago.placeholder")}
                value={carneLeaoPago}
                onChange={setCarneLeaoPago}
              />
              <CurrencyField
                id="impostoComplementarPago"
                label={t("fields.impostoComplementarPago.label")}
                placeholder={t("fields.impostoComplementarPago.placeholder")}
                value={impostoComplementarPago}
                onChange={setImpostoComplementarPago}
              />
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="imposto-de-renda-deducoes">
            <h2
              id="imposto-de-renda-deducoes"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <ReceiptText className="h-4 w-4" />
              {t("sections.deductions")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("helpers.deductions")}</p>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="dependentes">{t("fields.dependentes.label")}</Label>
                <Input
                  id="dependentes"
                  inputMode="numeric"
                  min={0}
                  max={30}
                  value={dependentes}
                  onChange={(event) => setDependentes(sanitizeCount(event.target.value))}
                />
              </div>
              <CurrencyField
                id="previdenciaOficial"
                label={t("fields.previdenciaOficial.label")}
                placeholder={t("fields.previdenciaOficial.placeholder")}
                value={previdenciaOficial}
                onChange={setPrevidenciaOficial}
              />
              <CurrencyField
                id="pensaoAlimenticia"
                label={t("fields.pensaoAlimenticia.label")}
                placeholder={t("fields.pensaoAlimenticia.placeholder")}
                value={pensaoAlimenticia}
                onChange={setPensaoAlimenticia}
              />
              <CurrencyField
                id="despesasMedicas"
                label={t("fields.despesasMedicas.label")}
                placeholder={t("fields.despesasMedicas.placeholder")}
                value={despesasMedicas}
                onChange={setDespesasMedicas}
              />
              <CurrencyField
                id="despesasInstrucao"
                label={t("fields.despesasInstrucao.label")}
                placeholder={t("fields.despesasInstrucao.placeholder")}
                value={despesasInstrucao}
                onChange={setDespesasInstrucao}
              />
              <div className="space-y-2">
                <Label htmlFor="pessoasInstrucao">{t("fields.pessoasInstrucao.label")}</Label>
                <Input
                  id="pessoasInstrucao"
                  inputMode="numeric"
                  min={0}
                  max={30}
                  value={pessoasInstrucao}
                  onChange={(event) => setPessoasInstrucao(sanitizeCount(event.target.value))}
                />
              </div>
              <CurrencyField
                id="previdenciaComplementar"
                label={t("fields.previdenciaComplementar.label")}
                placeholder={t("fields.previdenciaComplementar.placeholder")}
                value={previdenciaComplementar}
                onChange={setPrevidenciaComplementar}
                helper={t("helpers.complementaryPension")}
              />
              <CurrencyField
                id="livroCaixa"
                label={t("fields.livroCaixa.label")}
                placeholder={t("fields.livroCaixa.placeholder")}
                value={livroCaixa}
                onChange={setLivroCaixa}
              />
              <CurrencyField
                id="outrasDeducoesLegais"
                label={t("fields.outrasDeducoesLegais.label")}
                placeholder={t("fields.outrasDeducoesLegais.placeholder")}
                value={outrasDeducoesLegais}
                onChange={setOutrasDeducoesLegais}
              />
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="imposto-de-renda-metodo">
            <h2
              id="imposto-de-renda-metodo"
              className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("sections.method")}
            </h2>
            <div className="grid gap-3 md:grid-cols-3">
              {modeOptions.map((mode) => (
                <Button
                  key={mode}
                  id={`modoDeducao-${mode}`}
                  type="button"
                  variant={modoDeducao === mode ? "default" : "outline"}
                  className="h-auto justify-start whitespace-normal py-3 text-left"
                  aria-pressed={modoDeducao === mode}
                  onClick={() => setModoDeducao(mode)}>
                  {t(`fields.modoDeducao.options.${mode}`)}
                </Button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{t("helpers.method")}</p>
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

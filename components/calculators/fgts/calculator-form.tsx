"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { BadgeDollarSign, BriefcaseBusiness, Calculator, ReceiptText, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrencyFromNumber, formatCurrencyInput, parseCurrencyValue } from "@/lib/utils/index";
import {
  FGTS_SUPPORTED_SOURCE_VERSION,
  getDefaultFgtsInputs,
  validateFgtsInputs,
  type FgtsInputs,
  type FgtsMotivoRescisao,
  type FgtsTipoDeposito,
} from "@/lib/calculators/fgts";

interface CalculatorFormProps {
  onCalculate: (inputs: FgtsInputs) => void;
  initialValues?: FgtsInputs | null;
}

const DEPOSIT_OPTIONS: FgtsTipoDeposito[] = ["padrao8", "aprendiz2"];
const TERMINATION_OPTIONS: FgtsMotivoRescisao[] = [
  "semRescisao",
  "semJustaCausa",
  "rescisaoIndiretaReconhecida",
  "acordo484A",
  "culpaReciprocaForcaMaior",
  "pedidoDemissao",
  "justaCausa",
];

function currencyInitial(value: number | undefined): string {
  return value && value > 0 ? formatCurrencyFromNumber(value) : "";
}

function nullableCurrencyInitial(value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (value === 0) return "0,00";
  return formatCurrencyFromNumber(value);
}

function toInteger(value: string): number {
  return parseInt(value, 10) || 0;
}

function sanitizeInteger(value: string): string {
  return value.replace(/\D/g, "").slice(0, 3);
}

export function CalculatorForm({ onCalculate, initialValues }: CalculatorFormProps) {
  const t = useTranslations("calculators.fgts.form");
  const defaults = useMemo(() => initialValues ?? getDefaultFgtsInputs(), [initialValues]);

  const [baseMensalFgts, setBaseMensalFgts] = useState(() => currencyInitial(defaults.baseMensalFgts));
  const [meses, setMeses] = useState(defaults.meses.toString());
  const [tipoDeposito, setTipoDeposito] = useState<FgtsTipoDeposito>(defaults.tipoDeposito);
  const [baseDecimoTerceiro, setBaseDecimoTerceiro] = useState(() =>
    currencyInitial(defaults.baseDecimoTerceiro)
  );
  const [baseVerbasRescisoriasFgts, setBaseVerbasRescisoriasFgts] = useState(() =>
    currencyInitial(defaults.baseVerbasRescisoriasFgts)
  );
  const [depositosExtrasInformados, setDepositosExtrasInformados] = useState(() =>
    currencyInitial(defaults.depositosExtrasInformados)
  );
  const [saldoFgtsInformado, setSaldoFgtsInformado] = useState(() =>
    nullableCurrencyInitial(defaults.saldoFgtsInformado)
  );
  const [saldoIncluiDepositosEstimados, setSaldoIncluiDepositosEstimados] = useState(
    defaults.saldoIncluiDepositosEstimados
  );
  const [motivoRescisao, setMotivoRescisao] = useState<FgtsMotivoRescisao>(defaults.motivoRescisao);
  const [mostrarSaqueEstimado, setMostrarSaqueEstimado] = useState(defaults.mostrarSaqueEstimado);
  const [error, setError] = useState<string | null>(null);

  const handleCurrencyChange = (value: string, setter: (next: string) => void) => {
    setter(formatCurrencyInput(value));
  };

  const buildInputs = (): FgtsInputs => ({
    baseMensalFgts: parseCurrencyValue(baseMensalFgts),
    meses: toInteger(meses),
    tipoDeposito,
    baseDecimoTerceiro: parseCurrencyValue(baseDecimoTerceiro),
    baseVerbasRescisoriasFgts: parseCurrencyValue(baseVerbasRescisoriasFgts),
    depositosExtrasInformados: parseCurrencyValue(depositosExtrasInformados),
    saldoFgtsInformado: saldoFgtsInformado.trim() ? parseCurrencyValue(saldoFgtsInformado) : null,
    saldoIncluiDepositosEstimados,
    motivoRescisao,
    mostrarSaqueEstimado,
    sourceVersion: FGTS_SUPPORTED_SOURCE_VERSION,
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const inputs = buildInputs();
    const errors = validateFgtsInputs(inputs);

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
          <section className="space-y-4" aria-labelledby="fgts-base">
            <h2 id="fgts-base" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("sections.base")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("helpers.base")}</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="baseMensalFgts">{t("fields.baseMensalFgts.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="baseMensalFgts"
                    inputMode="numeric"
                    value={baseMensalFgts}
                    onChange={(event) => handleCurrencyChange(event.target.value, setBaseMensalFgts)}
                    placeholder={t("fields.baseMensalFgts.placeholder")}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="meses">{t("fields.meses.label")}</Label>
                <Input
                  id="meses"
                  inputMode="numeric"
                  value={meses}
                  onChange={(event) => setMeses(sanitizeInteger(event.target.value))}
                  min={0}
                  max={600}
                />
                <p className="text-xs text-muted-foreground">{t("helpers.months")}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipoDeposito">{t("fields.tipoDeposito.label")}</Label>
                <Select value={tipoDeposito} onValueChange={(value) => setTipoDeposito(value as FgtsTipoDeposito)}>
                  <SelectTrigger id="tipoDeposito" aria-label={t("fields.tipoDeposito.label")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPOSIT_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {t(`fields.tipoDeposito.options.${option}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="fgts-additional">
            <h2
              id="fgts-additional"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <ReceiptText className="h-4 w-4" />
              {t("sections.additional")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("helpers.additional")}</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="baseDecimoTerceiro">{t("fields.baseDecimoTerceiro.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="baseDecimoTerceiro"
                    inputMode="numeric"
                    value={baseDecimoTerceiro}
                    onChange={(event) => handleCurrencyChange(event.target.value, setBaseDecimoTerceiro)}
                    placeholder={t("fields.baseDecimoTerceiro.placeholder")}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="baseVerbasRescisoriasFgts">
                  {t("fields.baseVerbasRescisoriasFgts.label")}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="baseVerbasRescisoriasFgts"
                    inputMode="numeric"
                    value={baseVerbasRescisoriasFgts}
                    onChange={(event) => handleCurrencyChange(event.target.value, setBaseVerbasRescisoriasFgts)}
                    placeholder={t("fields.baseVerbasRescisoriasFgts.placeholder")}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="depositosExtrasInformados">
                  {t("fields.depositosExtrasInformados.label")}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="depositosExtrasInformados"
                    inputMode="numeric"
                    value={depositosExtrasInformados}
                    onChange={(event) => handleCurrencyChange(event.target.value, setDepositosExtrasInformados)}
                    placeholder={t("fields.depositosExtrasInformados.placeholder")}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="fgts-official-balance">
            <h2
              id="fgts-official-balance"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <WalletCards className="h-4 w-4" />
              {t("sections.balance")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("helpers.balance")}</p>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(240px,0.9fr)]">
              <div className="space-y-2">
                <Label htmlFor="saldoFgtsInformado">{t("fields.saldoFgtsInformado.label")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="saldoFgtsInformado"
                    inputMode="numeric"
                    value={saldoFgtsInformado}
                    onChange={(event) => handleCurrencyChange(event.target.value, setSaldoFgtsInformado)}
                    placeholder={t("fields.saldoFgtsInformado.placeholder")}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex flex-col justify-center gap-3 rounded-md border p-4">
                <div className="flex items-start gap-3">
                  <input
                    id="saldoIncluiDepositosEstimados"
                    type="checkbox"
                    checked={saldoIncluiDepositosEstimados}
                    onChange={(event) => setSaldoIncluiDepositosEstimados(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-input"
                  />
                  <div>
                    <Label htmlFor="saldoIncluiDepositosEstimados" className="text-sm font-medium">
                      {t("fields.saldoIncluiDepositosEstimados.label")}
                    </Label>
                    <p className="mt-1 text-xs text-muted-foreground">{t("helpers.balanceIncludes")}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-5" aria-labelledby="fgts-termination">
            <h2
              id="fgts-termination"
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <BriefcaseBusiness className="h-4 w-4" />
              {t("sections.termination")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(240px,0.9fr)]">
              <div className="space-y-2">
                <Label htmlFor="motivoRescisao">{t("fields.motivoRescisao.label")}</Label>
                <Select
                  value={motivoRescisao}
                  onValueChange={(value) => setMotivoRescisao(value as FgtsMotivoRescisao)}>
                  <SelectTrigger id="motivoRescisao" aria-label={t("fields.motivoRescisao.label")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TERMINATION_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {t(`fields.motivoRescisao.options.${option}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{t("helpers.termination")}</p>
              </div>
              <div className="flex flex-col justify-center gap-3 rounded-md border p-4">
                <div className="flex items-start gap-3">
                  <input
                    id="mostrarSaqueEstimado"
                    type="checkbox"
                    checked={mostrarSaqueEstimado}
                    onChange={(event) => setMostrarSaqueEstimado(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-input"
                  />
                  <div>
                    <Label htmlFor="mostrarSaqueEstimado" className="text-sm font-medium">
                      {t("fields.mostrarSaqueEstimado.label")}
                    </Label>
                    <p className="mt-1 text-xs text-muted-foreground">{t("helpers.withdrawal")}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <BadgeDollarSign className="mr-2 inline h-4 w-4" />
            {t("helpers.sourceBadge")}
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

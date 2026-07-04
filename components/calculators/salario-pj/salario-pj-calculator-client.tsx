"use client";

import { Fragment, useCallback, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertTriangle, Building2, Calculator, Landmark, ReceiptText, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SaveButton } from "@/components/ui/save-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShareButton } from "@/components/ui/share-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  calcularSalarioPj,
  getDefaultSalarioPjInputs,
  validateSalarioPjInputs,
  type ResultadoSalarioPj,
  type SalarioPjAnexoMode,
  type SalarioPjBreakdownCategory,
  type SalarioPjBreakdownRow,
  type SalarioPjInputs,
  type SalarioPjInssPessoaFisicaMode,
} from "@/lib/calculators/salario-pj";
import {
  formatCurrency,
  formatCurrencyFromNumber,
  formatCurrencyInput,
  formatPercent,
  formatPercentFromNumber,
  formatPercentInput,
  parseCurrencyValue,
  parsePercentValue,
} from "@/lib/utils/index";
import { getCurrentPageBaseUrl } from "@/lib/utils";
import { decodeSalarioPjState, generateSalarioPjShareUrl, type SalarioPjUrlState } from "@/lib/url-state/index";

const ANEXO_MODE_OPTIONS: SalarioPjAnexoMode[] = ["autoFatorR", "anexoIII", "anexoV", "aliquotaManual"];
const INSS_MODE_OPTIONS: SalarioPjInssPessoaFisicaMode[] = [
  "contribuinteIndividual20",
  "simplificado11Minimo",
  "mei5Minimo",
  "manual",
  "none",
];
const BREAKDOWN_ORDER: SalarioPjBreakdownCategory[] = ["receita", "empresa", "pessoal", "custos", "liquido"];

function currencyInitial(value: number | undefined): string {
  return value && value > 0 ? formatCurrencyFromNumber(value) : "";
}

function percentInitial(value: number | undefined): string {
  return value && value > 0 ? formatPercentFromNumber(value * 100) : "";
}

function toInteger(value: string): number {
  return parseInt(value, 10) || 0;
}

function sanitizeDependents(value: string): string {
  return value.replace(/\D/g, "").slice(0, 2);
}

function SummaryCard({
  label,
  value,
  helper,
  tone = "default",
  testId,
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: "default" | "positive" | "warning";
  testId?: string;
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : "";

  return (
    <div className="flex min-h-28 flex-col justify-center rounded-lg border p-4" data-testid={testId}>
      <span className="text-xs font-medium uppercase text-muted-foreground">{label}</span>
      <span className={`mt-1 break-words font-mono text-xl font-bold ${toneClass}`}>{value}</span>
      {helper && <span className="mt-1 text-xs text-muted-foreground">{helper}</span>}
    </div>
  );
}

function MoneyField({
  id,
  label,
  value,
  placeholder,
  required,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
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
          required={required}
        />
      </div>
    </div>
  );
}

function BreakdownTable({ rows }: { rows: SalarioPjBreakdownRow[] }) {
  const t = useTranslations("calculators.salario-pj.breakdown");

  const renderDetail = (row: SalarioPjBreakdownRow) => {
    const details: string[] = [];
    if (row.detalhe) details.push(t(`details.${row.detalhe}`));
    if (row.base !== undefined) details.push(t("details.base", { value: formatCurrency(row.base) }));
    return details.length > 0 ? <span className="text-xs text-muted-foreground">{details.join(" · ")}</span> : null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Table className="min-w-[680px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.item")}</TableHead>
                <TableHead>{t("columns.detail")}</TableHead>
                <TableHead className="text-right">{t("columns.amount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {BREAKDOWN_ORDER.map((category) => {
                const categoryRows = rows.filter((row) => row.categoria === category);
                if (categoryRows.length === 0) return null;

                return (
                  <Fragment key={category}>
                    <TableRow key={`${category}-heading`} className="bg-muted/40">
                      <TableCell
                        colSpan={3}
                        className="text-xs font-semibold uppercase text-muted-foreground">
                        {t(`categories.${category}`)}
                      </TableCell>
                    </TableRow>
                    {categoryRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{t(`rows.${row.id}.label`)}</TableCell>
                        <TableCell>
                          {row.aplicavel ? renderDetail(row) ?? t(`rows.${row.id}.description`) : t("notApplicable")}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {row.aplicavel ? formatCurrency(row.valor) : t("notApplicableShort")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function Results({ resultado }: { resultado: ResultadoSalarioPj }) {
  const t = useTranslations("calculators.salario-pj.results");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <WalletCards className="h-5 w-5" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase text-muted-foreground">
              {t("badges.tables", { year: resultado.sourceVersion.tableYear })}
            </span>
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase text-muted-foreground">
              {t("badges.accessDate", { date: resultado.sourceVersion.accessedAt })}
            </span>
            <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase text-muted-foreground">
              {t("badges.anexo", { anexo: resultado.anexoAplicado })}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label={t("cards.net")}
              value={formatCurrency(resultado.liquidoDisponivel)}
              helper={t("cards.netHelper")}
              tone="positive"
              testId="salario-pj-net-result"
            />
            <SummaryCard
              label={t("cards.das")}
              value={formatCurrency(resultado.dasEstimado)}
              helper={formatPercent(resultado.aliquotaEfetivaSimples * 100)}
              tone="warning"
            />
            <SummaryCard
              label={t("cards.personal")}
              value={formatCurrency(resultado.inssPessoaFisica + resultado.irrfProLabore)}
              helper={t("cards.personalHelper")}
            />
            <SummaryCard
              label={t("cards.totalBurden")}
              value={formatCurrency(resultado.custosTotais)}
              helper={formatPercent(resultado.taxaEfetivaTotal * 100)}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-lg border bg-muted/20 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Building2 className="h-4 w-4" />
                {t("simples.title")}
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">{t("simples.rbt12")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.rbt12)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("simples.bracket")}</dt>
                  <dd className="font-mono font-semibold">
                    {resultado.faixaSimples ? t("simples.bracketValue", { faixa: resultado.faixaSimples.faixa }) : "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("simples.nominal")}</dt>
                  <dd className="font-mono font-semibold">{formatPercent(resultado.aliquotaNominal * 100)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("simples.deduction")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.parcelaDeduzir)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">{t("simples.helper")}</p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4" data-testid="salario-pj-fator-r-result">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <ReceiptText className="h-4 w-4" />
                {t("fatorR.title")}
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">{t("fatorR.fs12")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.fs12)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("fatorR.ratio")}</dt>
                  <dd className="font-mono font-semibold">
                    {resultado.fatorR === null ? "-" : formatPercent(resultado.fatorR * 100)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("fatorR.threshold")}</dt>
                  <dd className="font-mono font-semibold">28,00%</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("fatorR.applied")}</dt>
                  <dd className="font-mono font-semibold">{resultado.anexoAplicado}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">{t("fatorR.helper")}</p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Landmark className="h-4 w-4" />
                {t("proLabore.title")}
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">{t("proLabore.baseInss")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.baseContribuicaoPf)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("proLabore.inss")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.inssPessoaFisica)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("proLabore.baseIrrf")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.baseIrrfProLabore)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("proLabore.irrf")}</dt>
                  <dd className="font-mono font-semibold">{formatCurrency(resultado.irrfProLabore)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                {t(`proLabore.baseType.${resultado.tipoBaseIrrfUsada}`)}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <span className="text-xs font-medium uppercase text-muted-foreground">{t("cashFlow.proLaboreNet")}</span>
              <p className="mt-1 font-mono text-lg font-semibold">{formatCurrency(resultado.proLaboreLiquidoEstimado)}</p>
            </div>
            <div className="rounded-lg border p-4">
              <span className="text-xs font-medium uppercase text-muted-foreground">{t("cashFlow.businessBalance")}</span>
              <p className="mt-1 font-mono text-lg font-semibold">{formatCurrency(resultado.saldoEmpresarialAposCustos)}</p>
            </div>
            <div className="rounded-lg border p-4">
              <span className="text-xs font-medium uppercase text-muted-foreground">{t("cashFlow.beyondProLabore")}</span>
              <p className="mt-1 font-mono text-lg font-semibold">{formatCurrency(resultado.valorDisponivelAlemProLabore)}</p>
            </div>
          </div>

          {resultado.warnings.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="h-4 w-4" />
                {t("warnings.title")}
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {resultado.warnings.map((warning) => (
                  <li key={warning}>{t(`warnings.items.${warning}`)}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <BreakdownTable rows={resultado.breakdown} />
    </div>
  );
}

function SalarioPjCalculator() {
  const t = useTranslations("calculators.salario-pj");
  const tForm = useTranslations("calculators.salario-pj.form");
  const searchParams = useSearchParams();
  const initialState = useMemo(() => decodeSalarioPjState(searchParams), [searchParams]);
  const hasUnsupportedState = searchParams.toString().length > 0 && !initialState;
  const initialInputs = useMemo(() => initialState?.inputs ?? getDefaultSalarioPjInputs(), [initialState]);
  const [inputs, setInputs] = useState<SalarioPjInputs>(() => initialInputs);
  const [resultado, setResultado] = useState<ResultadoSalarioPj>(() => calcularSalarioPj(initialInputs));

  const [receitaMensal, setReceitaMensal] = useState(() => currencyInitial(initialInputs.receitaMensal));
  const [rbt12, setRbt12] = useState(() => currencyInitial(initialInputs.rbt12));
  const [fs12, setFs12] = useState(() => currencyInitial(initialInputs.fs12));
  const [anexoMode, setAnexoMode] = useState<SalarioPjAnexoMode>(initialInputs.anexoMode);
  const [aliquotaManualEfetiva, setAliquotaManualEfetiva] = useState(() =>
    percentInitial(initialInputs.aliquotaManualEfetiva)
  );
  const [proLaboreMensal, setProLaboreMensal] = useState(() => currencyInitial(initialInputs.proLaboreMensal));
  const [inssPessoaFisicaMode, setInssPessoaFisicaMode] = useState<SalarioPjInssPessoaFisicaMode>(
    initialInputs.inssPessoaFisicaMode
  );
  const [inssManual, setInssManual] = useState(() => currencyInitial(initialInputs.inssManual));
  const [calcularIrrfProLabore, setCalcularIrrfProLabore] = useState(initialInputs.calcularIrrfProLabore);
  const [dependentesIr, setDependentesIr] = useState(initialInputs.dependentesIr.toString());
  const [pensaoAlimenticia, setPensaoAlimenticia] = useState(() => currencyInitial(initialInputs.pensaoAlimenticia));
  const [contabilidadeMensal, setContabilidadeMensal] = useState(() =>
    currencyInitial(initialInputs.contabilidadeMensal)
  );
  const [custosOperacionais, setCustosOperacionais] = useState(() => currencyInitial(initialInputs.custosOperacionais));
  const [beneficiosPessoais, setBeneficiosPessoais] = useState(() => currencyInitial(initialInputs.beneficiosPessoais));
  const [outrasRetencoes, setOutrasRetencoes] = useState(() => currencyInitial(initialInputs.outrasRetencoes));
  const [error, setError] = useState<string | null>(null);

  const buildInputs = (): SalarioPjInputs => ({
    receitaMensal: parseCurrencyValue(receitaMensal),
    rbt12: parseCurrencyValue(rbt12),
    fs12: parseCurrencyValue(fs12),
    anexoMode,
    aliquotaManualEfetiva: parsePercentValue(aliquotaManualEfetiva) / 100,
    proLaboreMensal: parseCurrencyValue(proLaboreMensal),
    inssPessoaFisicaMode,
    inssManual: parseCurrencyValue(inssManual),
    calcularIrrfProLabore,
    dependentesIr: toInteger(dependentesIr),
    pensaoAlimenticia: parseCurrencyValue(pensaoAlimenticia),
    contabilidadeMensal: parseCurrencyValue(contabilidadeMensal),
    custosOperacionais: parseCurrencyValue(custosOperacionais),
    beneficiosPessoais: parseCurrencyValue(beneficiosPessoais),
    outrasRetencoes: parseCurrencyValue(outrasRetencoes),
    tabelaAno: 2026,
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextInputs = buildInputs();
    const errors = validateSalarioPjInputs(nextInputs);

    if (errors.length > 0) {
      setError(tForm(`validation.${errors[0]}`));
      return;
    }

    setError(null);
    setInputs(nextInputs);
    setResultado(calcularSalarioPj(nextInputs));
  };

  const getShareUrl = useCallback(() => {
    const state: SalarioPjUrlState = { inputs };
    return generateSalarioPjShareUrl(getCurrentPageBaseUrl(), state);
  }, [inputs]);

  return (
    <div className="space-y-8">
      {hasUnsupportedState && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          {t("staleLink")}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5" />
            {tForm("title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="space-y-4" aria-labelledby="salario-pj-receita">
              <h2 id="salario-pj-receita" className="text-sm font-semibold uppercase text-muted-foreground">
                {tForm("sections.revenue")}
              </h2>
              <p className="text-sm text-muted-foreground">{tForm("helpers.revenue")}</p>
              <div className="grid gap-4 md:grid-cols-3">
                <MoneyField
                  id="receitaMensal"
                  label={tForm("fields.receitaMensal.label")}
                  value={receitaMensal}
                  onChange={setReceitaMensal}
                  placeholder={tForm("fields.receitaMensal.placeholder")}
                  required
                />
                <MoneyField
                  id="rbt12"
                  label={tForm("fields.rbt12.label")}
                  value={rbt12}
                  onChange={setRbt12}
                  placeholder={tForm("fields.rbt12.placeholder")}
                />
                <MoneyField
                  id="fs12"
                  label={tForm("fields.fs12.label")}
                  value={fs12}
                  onChange={setFs12}
                  placeholder={tForm("fields.fs12.placeholder")}
                />
              </div>
            </section>

            <section className="space-y-4 border-t pt-5" aria-labelledby="salario-pj-simples">
              <h2 id="salario-pj-simples" className="flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground">
                <Building2 className="h-4 w-4" />
                {tForm("sections.simples")}
              </h2>
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.8fr)]">
                <div className="space-y-2">
                  <Label htmlFor="anexoMode">{tForm("fields.anexoMode.label")}</Label>
                  <Select value={anexoMode} onValueChange={(value) => setAnexoMode(value as SalarioPjAnexoMode)}>
                    <SelectTrigger id="anexoMode" aria-label={tForm("fields.anexoMode.label")} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ANEXO_MODE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {tForm(`fields.anexoMode.options.${option}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{tForm("helpers.simples")}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aliquotaManualEfetiva">{tForm("fields.aliquotaManualEfetiva.label")}</Label>
                  <div className="relative">
                    <Input
                      id="aliquotaManualEfetiva"
                      inputMode="decimal"
                      value={aliquotaManualEfetiva}
                      onChange={(event) => setAliquotaManualEfetiva(formatPercentInput(event.target.value))}
                      placeholder={tForm("fields.aliquotaManualEfetiva.placeholder")}
                      className="pr-9"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{tForm("helpers.manualRate")}</p>
                </div>
              </div>
            </section>

            <section className="space-y-4 border-t pt-5" aria-labelledby="salario-pj-pro-labore">
              <h2
                id="salario-pj-pro-labore"
                className="flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground">
                <Landmark className="h-4 w-4" />
                {tForm("sections.proLabore")}
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                <MoneyField
                  id="proLaboreMensal"
                  label={tForm("fields.proLaboreMensal.label")}
                  value={proLaboreMensal}
                  onChange={setProLaboreMensal}
                  placeholder={tForm("fields.proLaboreMensal.placeholder")}
                />
                <div className="space-y-2">
                  <Label htmlFor="inssPessoaFisicaMode">{tForm("fields.inssPessoaFisicaMode.label")}</Label>
                  <Select
                    value={inssPessoaFisicaMode}
                    onValueChange={(value) => setInssPessoaFisicaMode(value as SalarioPjInssPessoaFisicaMode)}>
                    <SelectTrigger
                      id="inssPessoaFisicaMode"
                      aria-label={tForm("fields.inssPessoaFisicaMode.label")}
                      className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INSS_MODE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {tForm(`fields.inssPessoaFisicaMode.options.${option}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <MoneyField
                  id="inssManual"
                  label={tForm("fields.inssManual.label")}
                  value={inssManual}
                  onChange={setInssManual}
                  placeholder={tForm("fields.inssManual.placeholder")}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-3 rounded-md border p-4 md:col-span-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Label htmlFor="calcularIrrfProLabore" className="text-sm font-medium">
                        {tForm("fields.calcularIrrfProLabore.label")}
                      </Label>
                      <p className="mt-1 text-xs text-muted-foreground">{tForm("helpers.irrf")}</p>
                    </div>
                    <input
                      id="calcularIrrfProLabore"
                      type="checkbox"
                      checked={calcularIrrfProLabore}
                      onChange={(event) => setCalcularIrrfProLabore(event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dependentesIr">{tForm("fields.dependentesIr.label")}</Label>
                  <Input
                    id="dependentesIr"
                    inputMode="numeric"
                    value={dependentesIr}
                    onChange={(event) => setDependentesIr(sanitizeDependents(event.target.value))}
                    min={0}
                    max={20}
                  />
                  <p className="text-xs text-muted-foreground">{tForm("helpers.dependents")}</p>
                </div>
                <MoneyField
                  id="pensaoAlimenticia"
                  label={tForm("fields.pensaoAlimenticia.label")}
                  value={pensaoAlimenticia}
                  onChange={setPensaoAlimenticia}
                  placeholder={tForm("fields.pensaoAlimenticia.placeholder")}
                />
              </div>
            </section>

            <section className="space-y-4 border-t pt-5" aria-labelledby="salario-pj-custos">
              <h2 id="salario-pj-custos" className="flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground">
                <ReceiptText className="h-4 w-4" />
                {tForm("sections.costs")}
              </h2>
              <div className="grid gap-4 md:grid-cols-4">
                <MoneyField
                  id="contabilidadeMensal"
                  label={tForm("fields.contabilidadeMensal.label")}
                  value={contabilidadeMensal}
                  onChange={setContabilidadeMensal}
                  placeholder={tForm("fields.contabilidadeMensal.placeholder")}
                />
                <MoneyField
                  id="custosOperacionais"
                  label={tForm("fields.custosOperacionais.label")}
                  value={custosOperacionais}
                  onChange={setCustosOperacionais}
                  placeholder={tForm("fields.custosOperacionais.placeholder")}
                />
                <MoneyField
                  id="beneficiosPessoais"
                  label={tForm("fields.beneficiosPessoais.label")}
                  value={beneficiosPessoais}
                  onChange={setBeneficiosPessoais}
                  placeholder={tForm("fields.beneficiosPessoais.placeholder")}
                />
                <MoneyField
                  id="outrasRetencoes"
                  label={tForm("fields.outrasRetencoes.label")}
                  value={outrasRetencoes}
                  onChange={setOutrasRetencoes}
                  placeholder={tForm("fields.outrasRetencoes.placeholder")}
                />
              </div>
              <div className="rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                {tForm("helpers.tableBadge")}
              </div>
            </section>

            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full sm:w-auto" data-testid="salario-pj-submit">
              {tForm("submit")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <span data-testid="salario-pj-save">
          <SaveButton getShareUrl={getShareUrl} calculatorId="salario-pj" />
        </span>
        <span data-testid="salario-pj-share">
          <ShareButton getShareUrl={getShareUrl} />
        </span>
      </div>

      <Results resultado={resultado} />
    </div>
  );
}

export function SalarioPjCalculatorClient() {
  return <SalarioPjCalculator />;
}

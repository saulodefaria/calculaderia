"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, BadgeDollarSign, FileText, Home, Landmark, ReceiptText, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatPercent } from "@/lib/utils/index";
import type {
  McmvResumoMetodo,
  ResultadoMinhaCasaMinhaVida,
} from "@/lib/calculators/financiamento-minha-casa-minha-vida";

interface ResultsSummaryProps {
  resultado: ResultadoMinhaCasaMinhaVida;
}

function formatMaybeCurrency(value: number, available = true): string {
  return available ? formatCurrency(value) : "-";
}

function formatMaybePercent(value: number | null): string {
  return value === null ? "-" : formatPercent(value);
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
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`mt-1 break-words font-mono text-xl font-bold ${toneClass}`}>{value}</span>
      {helper && <span className="mt-1 text-xs text-muted-foreground">{helper}</span>}
    </div>
  );
}

function ComparisonRow({ resumo }: { resumo: McmvResumoMetodo }) {
  const t = useTranslations("calculators.financiamento-minha-casa-minha-vida");

  return (
    <TableRow>
      <TableCell className="font-medium">{t(`methods.${resumo.metodo}`)}</TableCell>
      <TableCell className="text-right font-mono">{formatCurrency(resumo.primeiraParcela)}</TableCell>
      <TableCell className="text-right font-mono">{formatCurrency(resumo.ultimaParcela)}</TableCell>
      <TableCell className="text-right font-mono">{formatCurrency(resumo.totalJuros)}</TableCell>
      <TableCell className="text-right font-mono">{formatCurrency(resumo.totalParcelas)}</TableCell>
    </TableRow>
  );
}

export function ResultsSummary({ resultado }: ResultsSummaryProps) {
  const t = useTranslations("calculators.financiamento-minha-casa-minha-vida.results");
  const tRoot = useTranslations("calculators.financiamento-minha-casa-minha-vida");
  const selectedRow = resultado.subfaixaRendaTaxa;
  const rowLabel = selectedRow ? t(`rateRows.rows.${selectedRow.rowId}`) : t("rateRows.unavailable");
  const columnLabel = selectedRow ? t(`rateRows.columns.${selectedRow.selectedColumn}`) : t("rateRows.columns.unavailable");
  const installmentLabel =
    resultado.metodo === "price"
      ? formatMaybeCurrency(resultado.primeiraParcela, resultado.calculoDisponivel)
      : `${formatMaybeCurrency(resultado.primeiraParcela, resultado.calculoDisponivel)} / ${formatMaybeCurrency(
          resultado.ultimaParcela,
          resultado.calculoDisponivel
        )}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BadgeDollarSign className="h-5 w-5" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <span
            className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase text-muted-foreground"
            data-testid="financiamento-mcmv-source-badge">
            {t("badges.source", { version: resultado.sourceVersion.sourceVersion })}
          </span>
          <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase text-muted-foreground">
            {t("badges.method", { method: tRoot(`methods.${resultado.metodo}`) })}
          </span>
          <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase text-muted-foreground">
            {t("badges.timing")}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryCard
            label={t("cards.program")}
            value={tRoot(`faixas.${resultado.faixaPrograma}`)}
            helper={rowLabel}
            testId="financiamento-mcmv-program"
          />
          <SummaryCard
            label={t("cards.selectedRate")}
            value={formatMaybePercent(resultado.taxaNominalAnualSelecionada)}
            helper={columnLabel}
            tone={resultado.taxaNominalAnualSelecionada === null ? "warning" : "default"}
            testId="financiamento-mcmv-selected-rate"
          />
          <SummaryCard
            label={t("cards.financedAmount")}
            value={formatCurrency(resultado.valorFinanciadoEstimado)}
            helper={t("cards.financedAmountHelper")}
            testId="financiamento-mcmv-financed-amount"
          />
          <SummaryCard
            label={t("cards.installment")}
            value={installmentLabel}
            helper={resultado.metodo === "price" ? t("cards.fixedInstallment") : t("cards.firstLastInstallment")}
            tone="positive"
            testId="financiamento-mcmv-first-installment"
          />
          <SummaryCard
            label={t("cards.totalInterest")}
            value={formatMaybeCurrency(resultado.totalJuros, resultado.calculoDisponivel)}
            helper={t("cards.totalInterestHelper")}
            tone="warning"
            testId="financiamento-mcmv-total-interest"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryCard
            label={t("cards.lastInstallment")}
            value={formatMaybeCurrency(resultado.ultimaParcela, resultado.calculoDisponivel)}
            helper={t("cards.lastInstallmentHelper")}
            testId="financiamento-mcmv-last-installment"
          />
          <SummaryCard
            label={t("cards.totalInstallments")}
            value={formatMaybeCurrency(resultado.totalParcelas, resultado.calculoDisponivel)}
            helper={t("cards.totalInstallmentsHelper")}
          />
          <SummaryCard
            label={t("cards.totalUserPaid")}
            value={formatMaybeCurrency(resultado.totalPagoUsuario, resultado.calculoDisponivel)}
            helper={t("cards.totalUserPaidHelper", { value: formatCurrency(resultado.totalEntradaInformada) })}
            testId="financiamento-mcmv-total-user-paid"
          />
          <SummaryCard
            label={t("cards.totalResourcesApplied")}
            value={formatMaybeCurrency(resultado.totalRecursosAplicados, resultado.calculoDisponivel)}
            helper={t("cards.totalResourcesAppliedHelper", { value: formatCurrency(resultado.valorSubsidioInformado) })}
            testId="financiamento-mcmv-total-resources-applied"
          />
          <SummaryCard
            label={t("cards.effectiveRate")}
            value={formatMaybePercent(
              resultado.taxaEfetivaAnualEquivalente === null ? null : resultado.taxaEfetivaAnualEquivalente * 100
            )}
            helper={t("cards.effectiveRateHelper")}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border bg-muted/20 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <ReceiptText className="h-4 w-4" />
              {t("memo.title")}
            </h3>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">{t("memo.income")}</dt>
                <dd className="font-mono font-semibold">{formatCurrency(resultado.inputs.rendaMensalBruta)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("memo.propertyValue")}</dt>
                <dd className="font-mono font-semibold">{formatCurrency(resultado.valorBaseImovel)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("memo.entry")}</dt>
                <dd className="font-mono font-semibold">{formatCurrency(resultado.totalEntradaInformada)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("memo.subsidy")}</dt>
                <dd className="font-mono font-semibold">{formatCurrency(resultado.valorSubsidioInformado)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("memo.monthlyRate")}</dt>
                <dd className="font-mono font-semibold">
                  {formatMaybePercent(
                    resultado.taxaMensalParaSimulacao === null ? null : resultado.taxaMensalParaSimulacao * 100
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("memo.term")}</dt>
                <dd className="font-mono font-semibold">{t("memo.months", { count: resultado.inputs.prazoMeses })}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border bg-muted/20 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Home className="h-4 w-4" />
              {t("capStatus.title")}
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              {t(`capStatus.items.${resultado.propertyCapStatus.code}`, {
                min: formatCurrency(resultado.propertyCapStatus.limiteMinimoFonte ?? 0),
                max: formatCurrency(resultado.propertyCapStatus.limiteMaximoFonte ?? 0),
                local: formatCurrency(resultado.propertyCapStatus.limiteLocalUsado ?? 0),
              })}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              {t("capStatus.ltv", { value: formatPercent(resultado.ltvEstimado * 100) })}
            </p>
          </div>

          <div className="rounded-lg border bg-muted/20 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Landmark className="h-4 w-4" />
              {t("source.title")}
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              {t("source.text", { accessDate: resultado.sourceVersion.accessedAt })}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <a className="underline underline-offset-4" href={resultado.sourceVersion.sources[0].url} target="_blank" rel="noreferrer">
                {t("source.links.about")}
              </a>
              <a className="underline underline-offset-4" href={resultado.sourceVersion.sources[1].url} target="_blank" rel="noreferrer">
                {t("source.links.financedLine")}
              </a>
              <a className="underline underline-offset-4" href={resultado.sourceVersion.sources[2].url} target="_blank" rel="noreferrer">
                {t("source.links.classeMedia")}
              </a>
            </div>
          </div>
        </div>

        {resultado.eligibilityWarnings.length > 0 && (
          <div
            className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
            data-testid="financiamento-mcmv-warnings">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4" />
              {t("warnings.title")}
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {resultado.eligibilityWarnings.map((warning) => (
                <li key={warning}>{t(`warnings.items.${warning}`)}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <FileText className="mt-0.5 h-4 w-4 flex-none" />
            <span>
              <strong className="text-foreground">{t(`method.${resultado.metodo}.title`)}</strong>{" "}
              {t(`method.${resultado.metodo}.text`)}
            </span>
          </p>
          <p className="mt-2">{t("method.disclaimer")}</p>
        </div>

        {resultado.comparacao && (
          <div className="rounded-lg border p-4" data-testid="financiamento-mcmv-comparison">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Scale className="h-4 w-4" />
              {t("comparison.title")}
            </h3>
            <div className="mt-4 overflow-x-auto">
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("comparison.columns.method")}</TableHead>
                    <TableHead className="text-right">{t("comparison.columns.first")}</TableHead>
                    <TableHead className="text-right">{t("comparison.columns.last")}</TableHead>
                    <TableHead className="text-right">{t("comparison.columns.interest")}</TableHead>
                    <TableHead className="text-right">{t("comparison.columns.installments")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <ComparisonRow resumo={resultado.comparacao.sac} />
                  <ComparisonRow resumo={resultado.comparacao.price} />
                </TableBody>
              </Table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {t("comparison.note", {
                value: formatCurrency(Math.abs(resultado.comparacao.diferencaJuros)),
              })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

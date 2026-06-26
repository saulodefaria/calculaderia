"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, BadgeDollarSign, FileText, Landmark, ReceiptText, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatPercent } from "@/lib/utils/index";
import type {
  FinanciamentoVeiculoResumoMetodo,
  ResultadoFinanciamentoVeiculo,
} from "@/lib/calculators/financiamento-veiculo";

interface ResultsSummaryProps {
  resultado: ResultadoFinanciamentoVeiculo;
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

function ComparisonRow({ resumo }: { resumo: FinanciamentoVeiculoResumoMetodo }) {
  const t = useTranslations("calculators.financiamento-veiculo");

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
  const t = useTranslations("calculators.financiamento-veiculo.results");
  const tRoot = useTranslations("calculators.financiamento-veiculo");
  const installmentLabel =
    resultado.metodo === "price"
      ? formatCurrency(resultado.primeiraParcela)
      : `${formatCurrency(resultado.primeiraParcela)} / ${formatCurrency(resultado.ultimaParcela)}`;

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
          <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold uppercase text-muted-foreground">
            {t("badges.formula", { version: resultado.sourceVersion.formulaVersion })}
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
            label={t("cards.financedAmount")}
            value={formatCurrency(resultado.valorFinanciado)}
            helper={t("cards.financedAmountHelper")}
            testId="financiamento-veiculo-financed-result"
          />
          <SummaryCard
            label={t("cards.installment")}
            value={installmentLabel}
            helper={resultado.metodo === "price" ? t("cards.fixedInstallment") : t("cards.firstLastInstallment")}
            tone="positive"
            testId="financiamento-veiculo-installment-result"
          />
          <SummaryCard
            label={t("cards.totalInterest")}
            value={formatCurrency(resultado.totalJuros)}
            helper={t("cards.totalInterestHelper")}
            tone="warning"
            testId="financiamento-veiculo-interest-result"
          />
          <SummaryCard
            label={t("cards.totalPaid")}
            value={formatCurrency(resultado.totalGeral)}
            helper={t("cards.totalPaidHelper", { value: formatCurrency(resultado.totalEntradaECustosAVista) })}
            testId="financiamento-veiculo-total-result"
          />
          <SummaryCard
            label={t("cards.annualRate")}
            value={formatPercent(resultado.taxaEfetivaAnual * 100)}
            helper={t("cards.annualRateHelper")}
            testId="financiamento-veiculo-annual-rate-result"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border bg-muted/20 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <ReceiptText className="h-4 w-4" />
              {t("memo.title")}
            </h3>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">{t("memo.vehicleValue")}</dt>
                <dd className="font-mono font-semibold">{formatCurrency(resultado.inputs.valorVeiculo)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("memo.downPayment")}</dt>
                <dd className="font-mono font-semibold">{formatCurrency(resultado.inputs.entrada)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("memo.financedCosts")}</dt>
                <dd className="font-mono font-semibold">{formatCurrency(resultado.inputs.custosFinanciados)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("memo.upfrontCosts")}</dt>
                <dd className="font-mono font-semibold">{formatCurrency(resultado.inputs.custosAVista)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("memo.monthlyRate")}</dt>
                <dd className="font-mono font-semibold">{formatPercent(resultado.inputs.taxaJurosMensal)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("memo.term")}</dt>
                <dd className="font-mono font-semibold">{t("memo.months", { count: resultado.inputs.prazoMeses })}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border bg-muted/20 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Landmark className="h-4 w-4" />
              {t("source.title")}
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              {t("source.text", { accessDate: resultado.sourceVersion.accessedAt })}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">{t("source.bcb")}</p>
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
          <div className="rounded-lg border p-4" data-testid="financiamento-veiculo-comparison">
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
                  <ComparisonRow resumo={resultado.comparacao.price} />
                  <ComparisonRow resumo={resultado.comparacao.sac} />
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

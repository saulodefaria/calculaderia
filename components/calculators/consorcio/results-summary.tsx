"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Gift, Gavel, Wallet, Home, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency, formatPercent, getAluguelCorrigidoNoMes } from "@/lib/utils/index";
import { encodeTirState } from "@/lib/url-state/tir";
import type { ResultadoConsorcio, ResultadoConsorcioComAdicionais, InputsConsorcio } from "@/lib/calculators/consorcio";

interface ResultsSummaryProps {
  resultado: ResultadoConsorcio;
  resultadoComAdicionais?: ResultadoConsorcioComAdicionais | null;
  inputs?: InputsConsorcio | null;
}

export function ResultsSummary({ resultado, resultadoComAdicionais, inputs }: ResultsSummaryProps) {
  const t = useTranslations("calculators.consorcio.results");
  const hasAdicionais = resultadoComAdicionais !== null && resultadoComAdicionais !== undefined;

  const tirMensalBase = resultado.tirMensal ?? null;
  const tirAnualBase = resultado.tirAnual ?? null;

  // Extract contemplation, bid and premium info
  // Check mesContemplacao first (new field), then fall back to lance.mes
  const mesContemplacao = inputs?.mesContemplacao ?? inputs?.lance?.mes ?? 1;
  const valorLance = inputs?.lance?.valor ?? 0;
  const valorAgio = resultado.agio ?? 0;
  const hasLanceOrAgio = valorLance > 0 || valorAgio > 0;

  // Extract aluguel info
  const aluguelMensal = inputs?.aluguelMensal ?? 0;
  const correcaoAnualAluguel = inputs?.correcaoAnualAluguel ?? 0;
  const hasAluguel = aluguelMensal > 0;

  // Calculate total rent savings (from contemplation to end of payments)
  const totalDescontoAluguel = useMemo(() => {
    if (!hasAluguel) return 0;
    const parcelas = hasAdicionais ? resultadoComAdicionais!.parcelas : resultado.parcelas;
    let total = 0;
    for (let mes = mesContemplacao; mes <= parcelas.length; mes++) {
      total += getAluguelCorrigidoNoMes(mes, aluguelMensal, correcaoAnualAluguel);
    }
    return Math.round(total * 100) / 100;
  }, [
    hasAluguel,
    hasAdicionais,
    resultadoComAdicionais,
    resultado.parcelas,
    mesContemplacao,
    aluguelMensal,
    correcaoAnualAluguel,
  ]);

  // Original summary items (when no additional amortizations)
  const summaryItemsOriginal = [
    {
      label: t("items.assetValue"),
      value: formatCurrency(resultado.valorBem),
      variant: "default" as const,
    },
    {
      label: t("items.futureAssetValue"),
      value: formatCurrency(resultado.valorBemFinal),
      variant: "default" as const,
    },
    {
      label: hasAluguel ? t("items.totalPaidGross") : t("items.totalPaid"),
      value: formatCurrency(resultado.totalPago),
      variant: "default" as const,
    },
    {
      label: t("items.firstInstallment"),
      value: formatCurrency(resultado.primeiraParcela),
      variant: "primary" as const,
    },
    {
      label: t("items.lastInstallment"),
      value: formatCurrency(resultado.ultimaParcela),
      variant: "primary" as const,
    },
    {
      label: t("items.totalAdminFee"),
      value: formatCurrency(resultado.totalTaxaAdministracao),
      variant: "destructive" as const,
    },
    // Premium (only if present)
    ...(resultado.agio > 0
      ? [
          {
            label: t("items.premiumPaid"),
            value: formatCurrency(resultado.agio),
            variant: "destructive" as const,
          },
        ]
      : []),
  ];

  if (!hasAdicionais) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {summaryItemsOriginal.map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center justify-center rounded-lg border p-4 text-center">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.label}</span>
                <span
                  className={`mt-1 text-lg font-bold font-mono ${
                    item.variant === "destructive"
                      ? "text-red-600 dark:text-red-400"
                      : item.variant === "primary"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : ""
                  }`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {(hasLanceOrAgio || hasAluguel) && (
            <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30 p-4">
              <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-3 flex items-center gap-2">
                <Gift className="h-4 w-4" />
                {t("scenario.title")}
              </h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <div>
                    <span className="text-xs text-muted-foreground block">{t("scenario.contemplation")}</span>
                    <span className="text-sm font-semibold">
                      {t("scenario.month", { month: mesContemplacao })}
                      {mesContemplacao === 1 && ` ${t("scenario.immediate")}`}
                    </span>
                  </div>
                </div>
                {valorLance > 0 && (
                  <div className="flex items-center gap-2">
                    <Gavel className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div>
                      <span className="text-xs text-muted-foreground block">{t("scenario.bid")}</span>
                      <span className="text-sm font-semibold">{formatCurrency(valorLance)}</span>
                    </div>
                  </div>
                )}
                {valorAgio > 0 && (
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div>
                      <span className="text-xs text-muted-foreground block">{t("items.premiumPaid")}</span>
                      <span className="text-sm font-semibold">{formatCurrency(valorAgio)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Aluguel Recebido */}
          {hasAluguel && (
            <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30 p-4">
              <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-3 flex items-center gap-2">
                <Home className="h-4 w-4" />
                {t("rent.title")}
              </h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <div>
                    <span className="text-xs text-muted-foreground block">{t("rent.totalReceived")}</span>
                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                      +{formatCurrency(totalDescontoAluguel)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div>
                    <span className="text-xs text-muted-foreground block">{t("rent.netTotal")}</span>
                    <span className="text-sm font-semibold">
                      {formatCurrency(resultado.totalPago - totalDescontoAluguel)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div>
                    <span className="text-xs text-muted-foreground block">{t("rent.fromMonth")}</span>
                    <span className="text-sm font-semibold">{mesContemplacao}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">{t("rent.description")}</p>
            </div>
          )}

          {tirMensalBase !== null && tirAnualBase !== null && (
            <div className="rounded-xl border border-dashed bg-muted/40 dark:bg-muted/10 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider">{t("irr.title")}</h3>
                {resultado.cashflows && resultado.cashflows.length > 0 && (
                  <TooltipProvider>
                    <Tooltip delayDuration={120}>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1.5" asChild>
                          <Link
                            href={`/calculadoras/tir?${encodeTirState({
                              cashflows: resultado.cashflows,
                              periodo: "mensal",
                            }).toString()}`}
                            target="_blank"
                            rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                            {t("irr.analyze")}
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("irr.openTooltip")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                {hasAluguel ? t("irr.explanationWithRent") : t("irr.explanationWithoutRent")}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("irr.monthly")}
                  </span>
                  <span
                    className={`mt-1 text-xl font-bold font-mono ${
                      tirMensalBase >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    }`}>
                    {formatPercent(tirMensalBase * 100)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("irr.annualEquivalent")}
                  </span>
                  <span
                    className={`mt-1 text-xl font-bold font-mono ${
                      tirAnualBase >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    }`}>
                    {formatPercent(tirAnualBase * 100)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // With additional amortizations - show comparison
  const mesesEconomizados = resultadoComAdicionais.economiaMeses;

  const tirMensalOriginal = resultadoComAdicionais.tirMensalOriginal ?? tirMensalBase;
  const tirAnualOriginal = resultadoComAdicionais.tirAnualOriginal ?? tirAnualBase;
  const tirMensalComAdicionais = resultadoComAdicionais.tirMensalComAdicionais ?? null;
  const tirAnualComAdicionais = resultadoComAdicionais.tirAnualComAdicionais ?? null;

  const hasTirComparison =
    tirMensalOriginal !== null &&
    tirAnualOriginal !== null &&
    tirMensalComAdicionais !== null &&
    tirAnualComAdicionais !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("comparison.subtitle")}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Original Values */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            {t("comparison.original.title")}
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-3 text-center opacity-75">
              <span className="text-xs font-medium text-muted-foreground">{t("items.assetValue")}</span>
              <span className="mt-1 text-base font-bold font-mono">{formatCurrency(resultado.valorBem)}</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-3 text-center opacity-75">
              <span className="text-xs font-medium text-muted-foreground">{t("items.totalAdminFee")}</span>
              <span className="mt-1 text-base font-bold font-mono text-red-600/70 dark:text-red-400/70 line-through">
                {formatCurrency(resultadoComAdicionais.totalTaxaAdministracaoOriginal)}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-3 text-center opacity-75">
              <span className="text-xs font-medium text-muted-foreground">{t("comparison.original.termLabel")}</span>
              <span className="mt-1 text-base font-bold font-mono">
                {t("comparison.months", { count: resultadoComAdicionais.mesesOriginais })}
              </span>
            </div>
          </div>
        </div>

        {hasTirComparison && (
          <div className="rounded-xl border border-dashed bg-muted/40 dark:bg-muted/10 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider">{t("irr.title")}</h3>
              <p className="text-xs text-muted-foreground">
                {hasAluguel ? t("irr.extrasExplanationWithRent") : t("irr.extrasExplanationWithoutRent")}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-background p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("comparison.original.irrLabel")}
                  </span>
                  {resultadoComAdicionais.cashflowsOriginal && resultadoComAdicionais.cashflowsOriginal.length > 0 && (
                    <TooltipProvider>
                      <Tooltip delayDuration={120}>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs gap-1" asChild>
                            <Link
                              href={`/calculadoras/tir?${encodeTirState({
                                cashflows: resultadoComAdicionais.cashflowsOriginal,
                                periodo: "mensal",
                              }).toString()}`}
                              target="_blank"
                              rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t("irr.analyzeTooltip")}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{t("irr.monthlyShort")}</span>
                    <span
                      className={`text-lg font-bold font-mono ${
                        tirMensalOriginal! >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}>
                      {formatPercent(tirMensalOriginal! * 100)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{t("irr.annualShort")}</span>
                    <span
                      className={`text-lg font-bold font-mono ${
                        tirAnualOriginal! >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}>
                      {formatPercent(tirAnualOriginal! * 100)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                    {t("comparison.withExtras.irrLabel")}
                  </span>
                  {resultadoComAdicionais.cashflowsComAdicionais &&
                    resultadoComAdicionais.cashflowsComAdicionais.length > 0 && (
                      <TooltipProvider>
                        <Tooltip delayDuration={120}>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs gap-1" asChild>
                              <Link
                                href={`/calculadoras/tir?${encodeTirState({
                                  cashflows: resultadoComAdicionais.cashflowsComAdicionais,
                                  periodo: "mensal",
                                }).toString()}`}
                                target="_blank"
                                rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t("irr.analyzeTooltip")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{t("irr.monthlyShort")}</span>
                    <span
                      className={`text-lg font-bold font-mono ${
                        tirMensalComAdicionais! >= (tirMensalOriginal ?? 0)
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-amber-600 dark:text-amber-300"
                      }`}>
                      {formatPercent(tirMensalComAdicionais! * 100)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{t("irr.annualShort")}</span>
                    <span
                      className={`text-lg font-bold font-mono ${
                        tirAnualComAdicionais! >= (tirAnualOriginal ?? 0)
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-amber-600 dark:text-amber-300"
                      }`}>
                      {formatPercent(tirAnualComAdicionais! * 100)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* New Values with Additional Amortizations */}
        <div>
          <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-3 uppercase tracking-wider">
            {t("comparison.withExtras.title")}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 text-center">
              <span className="text-xs font-medium text-muted-foreground">
                {t("comparison.withExtras.newAdminFee")}
              </span>
              <span className="mt-1 text-lg font-bold font-mono text-red-600 dark:text-red-400">
                {formatCurrency(resultadoComAdicionais.totalTaxaAdministracaoComAdicionais)}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 text-center">
              <span className="text-xs font-medium text-muted-foreground">{t("comparison.withExtras.newTerm")}</span>
              <span className="mt-1 text-lg font-bold font-mono">
                {t("comparison.months", { count: resultadoComAdicionais.mesesComAdicionais })}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 text-center">
              <span className="text-xs font-medium text-muted-foreground">
                {t("comparison.withExtras.totalExtraAmortization")}
              </span>
              <span className="mt-1 text-lg font-bold font-mono text-blue-600 dark:text-blue-400">
                {formatCurrency(resultadoComAdicionais.totalAmortizacoesAdicionais)}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 text-center">
              <span className="text-xs font-medium text-muted-foreground">
                {t("comparison.withExtras.newTotalPaid")}
              </span>
              <span className="mt-1 text-lg font-bold font-mono">
                {formatCurrency(resultadoComAdicionais.totalPagoComAdicionais)}
              </span>
            </div>
          </div>
        </div>

        {/* Savings Highlight */}
        <div className="rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 p-4 text-white">
          <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider opacity-90">{t("savings.title")}</h3>
          <p className="text-xs opacity-80 mb-4">{t("savings.subtitle")}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col">
              <span className="text-sm opacity-80">{t("savings.adminFee")}</span>
              <span className="text-2xl font-bold font-mono">
                {formatCurrency(resultadoComAdicionais.economiaTaxa)}
              </span>
            </div>
            {mesesEconomizados > 0 && (
              <div className="flex flex-col">
                <span className="text-sm opacity-80">{t("savings.monthsSaved")}</span>
                <span className="text-2xl font-bold font-mono">
                  {t("comparison.months", { count: mesesEconomizados })}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

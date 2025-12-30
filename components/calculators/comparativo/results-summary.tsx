"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ExternalLink, Trophy, TrendingUp, Wallet, PiggyBank, Scale, Gift, Gavel, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency, formatPercent } from "@/lib/utils/index";
import { encodeTirState } from "@/lib/url-state/tir";
import type { ResultadoComparativo } from "@/lib/calculators/comparativo";

interface ResultsSummaryProps {
  resultado: ResultadoComparativo;
}

export function ResultsSummary({ resultado }: ResultsSummaryProps) {
  const t = useTranslations("calculators.comparativo.results");
  const { comparacao, financiamento, consorcio } = resultado;
  const isFinanciamentoVencedor = comparacao.vencedor === "financiamento";
  const isConsorcioVencedor = comparacao.vencedor === "consorcio";
  const isEmpate = comparacao.vencedor === "empate";

  // Check if rent economy is configured
  const hasAluguel = comparacao.totalDescontoAluguelFinanciamento > 0 || comparacao.totalDescontoAluguelConsorcio > 0;

  const tirMensalFin = financiamento.tirMensal ?? null;
  const tirAnualFin = financiamento.tirAnual ?? null;
  const tirMensalCons = consorcio.tirMensal ?? null;
  const tirAnualCons = consorcio.tirAnual ?? null;

  const custoFin = comparacao.custoLiquidoFinanciamento;
  const custoCons = comparacao.custoLiquidoConsorcio;
  const isLucroFin = custoFin < 0;
  const isLucroCons = custoCons < 0;

  return (
    <div className="space-y-6">
      {/* Vencedor Destacado */}
      {!isEmpate && (
        <Card className="border-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900">
                <Trophy className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                  {t("winner.title", {
                    winner: isFinanciamentoVencedor ? t("winner.financing") : t("winner.consorcio"),
                  })}
                </h3>
                <p className="text-muted-foreground">
                  {t("winner.subtitlePrefix")}{" "}
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(comparacao.economiaVencedor)}
                  </span>{" "}
                  {t("winner.subtitleSuffix", {
                    other: isFinanciamentoVencedor ? t("winner.consorcioLower") : t("winner.financingLower"),
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isEmpate && (
        <Card className="border-2 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900">
                <Scale className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-300">{t("tie.title")}</h3>
                <p className="text-muted-foreground">{t("tie.subtitle")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparativo lado a lado */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Card Financiamento */}
        <Card className={`relative overflow-hidden ${isFinanciamentoVencedor ? "ring-2 ring-emerald-500" : ""}`}>
          {isFinanciamentoVencedor && (
            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-semibold px-2 py-1 rounded-bl">
              {t("winner.badge")}
            </div>
          )}
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Wallet className="h-5 w-5" />
              {t("financing.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {hasAluguel ? t("common.totalPaidGross") : t("common.totalPaid")}
                </p>
                <p className="text-lg font-bold font-mono">{formatCurrency(comparacao.totalPagoFinanciamento)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("financing.totalInterest")}</p>
                <p className="text-lg font-bold font-mono text-red-600 dark:text-red-400">
                  {formatCurrency(financiamento.totalJurosPagos)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("common.firstInstallment")}</p>
                <p className="text-base font-semibold font-mono">{formatCurrency(financiamento.primeiraPrestacao)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("common.lastInstallment")}</p>
                <p className="text-base font-semibold font-mono">{formatCurrency(financiamento.ultimaPrestacao)}</p>
              </div>
            </div>

            {/* Aluguel recebido (se configurado) */}
            {hasAluguel && (
              <div className="pt-3 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("common.rentIncome")}</p>
                </div>
                <p className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400">
                  +{formatCurrency(comparacao.totalDescontoAluguelFinanciamento)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{t("financing.rentHint")}</p>
              </div>
            )}

            {/* TIR (com link para calculadora de TIR) */}
            {tirMensalFin !== null && tirAnualFin !== null && (
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("common.irr")}</p>
                  {financiamento.cashflows && financiamento.cashflows.length > 0 && (
                    <TooltipProvider>
                      <Tooltip delayDuration={120}>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1.5" asChild>
                            <Link
                              href={`/calculadoras/tir?${encodeTirState({
                                cashflows: financiamento.cashflows,
                                periodo: "mensal",
                              }).toString()}`}
                              target="_blank"
                              rel="noopener noreferrer">
                              <ExternalLink className="h-3.5 w-3.5" />
                              {t("common.analyze")}
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t("common.openIrrTooltip")}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-3">{t("common.irrNote")}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("common.monthly")}</p>
                    <p
                      className={`text-base font-bold font-mono ${
                        tirMensalFin >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                      }`}>
                      {formatPercent(tirMensalFin * 100)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("common.annual")}</p>
                    <p
                      className={`text-base font-bold font-mono ${
                        tirAnualFin >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                      }`}>
                      {formatPercent(tirAnualFin * 100)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-3 border-t">
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {t("common.finalInvestmentBalance")}
                </p>
              </div>
              <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(comparacao.saldoInvestimentoFinanciamento)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t("common.investmentHint")}</p>
            </div>

            <div className="pt-3 border-t bg-muted/30 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-wider">
                  {isLucroFin ? t("common.netProfit") : t("common.netCost")}
                </p>
              </div>
              <p
                className={`text-2xl font-bold font-mono ${
                  isLucroFin ? "text-emerald-700 dark:text-emerald-300" : ""
                }`}>
                {isLucroFin ? `+${formatCurrency(Math.abs(custoFin))}` : formatCurrency(custoFin)}
              </p>
              <p className="text-xs text-muted-foreground">
                {isLucroFin
                  ? t("common.netProfitExplanation")
                  : hasAluguel
                  ? t("common.netCostFormulaWithRent")
                  : t("common.netCostFormulaWithoutRent")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card Consórcio */}
        <Card className={`relative overflow-hidden ${isConsorcioVencedor ? "ring-2 ring-emerald-500" : ""}`}>
          {isConsorcioVencedor && (
            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-semibold px-2 py-1 rounded-bl">
              {t("winner.badge")}
            </div>
          )}
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Wallet className="h-5 w-5" />
              {t("consorcio.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {hasAluguel ? t("common.totalPaidGross") : t("common.totalPaid")}
                </p>
                <p className="text-lg font-bold font-mono">{formatCurrency(comparacao.totalPagoConsorcio)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("consorcio.totalAdminFee")}</p>
                <p className="text-lg font-bold font-mono text-red-600 dark:text-red-400">
                  {formatCurrency(consorcio.totalTaxaAdministracao)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("common.firstInstallment")}</p>
                <p className="text-base font-semibold font-mono">{formatCurrency(consorcio.primeiraParcela)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("common.lastInstallment")}</p>
                <p className="text-base font-semibold font-mono">{formatCurrency(consorcio.ultimaParcela)}</p>
              </div>
            </div>

            {/* Aluguel recebido (se configurado) */}
            {hasAluguel && (
              <div className="pt-3 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("common.rentIncome")}</p>
                </div>
                <p className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400">
                  +{formatCurrency(comparacao.totalDescontoAluguelConsorcio)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("consorcio.rentHint", { month: comparacao.mesContemplacao })}
                </p>
              </div>
            )}

            {/* TIR (com link para calculadora de TIR) */}
            {tirMensalCons !== null && tirAnualCons !== null && (
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("common.irr")}</p>
                  {consorcio.cashflows && consorcio.cashflows.length > 0 && (
                    <TooltipProvider>
                      <Tooltip delayDuration={120}>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1.5" asChild>
                            <Link
                              href={`/calculadoras/tir?${encodeTirState({
                                cashflows: consorcio.cashflows,
                                periodo: "mensal",
                              }).toString()}`}
                              target="_blank"
                              rel="noopener noreferrer">
                              <ExternalLink className="h-3.5 w-3.5" />
                              {t("common.analyze")}
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t("common.openIrrTooltip")}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-3">{t("common.irrNote")}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("common.monthly")}</p>
                    <p
                      className={`text-base font-bold font-mono ${
                        tirMensalCons >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                      }`}>
                      {formatPercent(tirMensalCons * 100)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("common.annual")}</p>
                    <p
                      className={`text-base font-bold font-mono ${
                        tirAnualCons >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                      }`}>
                      {formatPercent(tirAnualCons * 100)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-3 border-t">
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {t("common.finalInvestmentBalance")}
                </p>
              </div>
              <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(comparacao.saldoInvestimentoConsorcio)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t("common.investmentHint")}</p>
            </div>

            <div className="pt-3 border-t bg-muted/30 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-wider">
                  {isLucroCons ? t("common.netProfit") : t("common.netCost")}
                </p>
              </div>
              <p
                className={`text-2xl font-bold font-mono ${
                  isLucroCons ? "text-emerald-700 dark:text-emerald-300" : ""
                }`}>
                {isLucroCons ? `+${formatCurrency(Math.abs(custoCons))}` : formatCurrency(custoCons)}
              </p>
              <p className="text-xs text-muted-foreground">
                {isLucroCons
                  ? t("common.netProfitExplanation")
                  : hasAluguel
                  ? t("common.netCostFormulaWithRent")
                  : t("common.netCostFormulaWithoutRent")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("details.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                {t("details.propertyValue")}
              </p>
              <p className="text-lg font-bold font-mono">{formatCurrency(resultado.valorImovel)}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t("details.totalTerm")}</p>
              <p className="text-lg font-bold font-mono">{t("details.months", { count: comparacao.mesesTotal })}</p>
              <p className="text-xs text-muted-foreground">
                ({(comparacao.mesesTotal / 12).toFixed(1)} {t("details.yearsUnit")})
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                {t("details.finalDifference")}
              </p>
              <p className={`text-lg font-bold font-mono ${!isEmpate ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                {formatCurrency(comparacao.economiaVencedor)}
              </p>
            </div>
          </div>

          {/* Contemplação e Lance - exibido apenas se houver valores relevantes */}
          {(comparacao.mesContemplacao > 1 || comparacao.valorLance > 0 || comparacao.valorAgio > 0) && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                {t("details.consorcioScenario.title")}
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50/50 dark:bg-purple-950/20">
                  <Gift className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t("details.consorcioScenario.contemplation")}</p>
                    <p className="text-sm font-semibold">
                      {t("details.consorcioScenario.month", { month: comparacao.mesContemplacao })}
                      {comparacao.mesContemplacao === 1 && (
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          {t("details.consorcioScenario.immediate")}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {comparacao.valorLance > 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50/50 dark:bg-purple-950/20">
                    <Gavel className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t("details.consorcioScenario.bid")}</p>
                      <p className="text-sm font-semibold font-mono">{formatCurrency(comparacao.valorLance)}</p>
                    </div>
                  </div>
                )}
                {comparacao.valorAgio > 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50/50 dark:bg-purple-950/20">
                    <Wallet className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t("details.consorcioScenario.premium")}</p>
                      <p className="text-sm font-semibold font-mono">{formatCurrency(comparacao.valorAgio)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

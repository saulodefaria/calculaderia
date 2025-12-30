"use client";

import { useTranslations } from "next-intl";
import { Trophy, TrendingUp, Wallet, Home, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/index";
import type { ResultadoAluguelVsComprar } from "@/lib/calculators/alugar-vs-comprar";

interface ResultsSummaryProps {
  resultado: ResultadoAluguelVsComprar;
}

export function ResultsSummary({ resultado }: ResultsSummaryProps) {
  const t = useTranslations("calculators.alugar-vs-comprar.results");
  const { comparacao } = resultado;
  const isComprarVencedor = comparacao.vencedor === "comprar";
  const isAluguelVencedor = comparacao.vencedor === "aluguel";
  const isEmpate = comparacao.vencedor === "empate";

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
                  {t("winner.title", { winner: isComprarVencedor ? t("winner.buy") : t("winner.rent") })}
                </h3>
                <p className="text-muted-foreground">
                  {t("winner.subtitlePrefix")}{" "}
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(comparacao.economiaVencedor)}
                  </span>{" "}
                  {t("winner.subtitleSuffix")}
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
        {/* Card Comprar */}
        <Card className={`relative overflow-hidden ${isComprarVencedor ? "ring-2 ring-emerald-500" : ""}`}>
          {isComprarVencedor && (
            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-semibold px-2 py-1 rounded-bl">
              {t("winner.badge")}
            </div>
          )}
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Home className="h-5 w-5" />
              {t("buy.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("buy.totalPaid")}</p>
                <p className="text-lg font-bold font-mono">{formatCurrency(comparacao.totalPagoComprar)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("buy.finalPropertyValue")}</p>
                <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(comparacao.valorImovelFinal)}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t bg-muted/30 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-wider">{t("common.finalNetWorth")}</p>
              </div>
              <p className="text-2xl font-bold font-mono">{formatCurrency(comparacao.patrimonioFinalComprar)}</p>
              <p className="text-xs text-muted-foreground">{t("buy.netWorthFormula")}</p>
            </div>
          </CardContent>
        </Card>

        {/* Card Aluguel */}
        <Card className={`relative overflow-hidden ${isAluguelVencedor ? "ring-2 ring-emerald-500" : ""}`}>
          {isAluguelVencedor && (
            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-semibold px-2 py-1 rounded-bl">
              {t("winner.badge")}
            </div>
          )}
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <Wallet className="h-5 w-5" />
              {t("rent.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("rent.totalPaid")}</p>
                <p className="text-lg font-bold font-mono">{formatCurrency(comparacao.totalPagoAluguel)}</p>
                <p className="text-xs text-muted-foreground">{t("rent.totalPaidHint")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("rent.investedBalance")}</p>
                <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(
                    resultado.parcelasMensais[resultado.parcelasMensais.length - 1]?.saldoInvestimentoAluguel ?? 0
                  )}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t bg-muted/30 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-wider">{t("common.finalNetWorth")}</p>
              </div>
              <p className="text-2xl font-bold font-mono">{formatCurrency(comparacao.patrimonioFinalAluguel)}</p>
              <p className="text-xs text-muted-foreground">
                {t("rent.netWorthFormulaPrefix")}
                {comparacao.aporteExtraTotalAluguel > 0
                  ? ` (${t("rent.extraContributionsTotal", { total: formatCurrency(comparacao.aporteExtraTotalAluguel) })})`
                  : ""}
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
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t("details.propertyValue")}</p>
              <p className="text-lg font-bold font-mono">{formatCurrency(resultado.valorImovel)}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t("details.totalTerm")}</p>
              <p className="text-lg font-bold font-mono">{comparacao.mesesTotal} meses</p>
              <p className="text-xs text-muted-foreground">
                ({(comparacao.mesesTotal / 12).toFixed(1)} {t("details.yearsUnit")})
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t("details.finalDifference")}</p>
              <p className={`text-lg font-bold font-mono ${!isEmpate ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                {formatCurrency(comparacao.economiaVencedor)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

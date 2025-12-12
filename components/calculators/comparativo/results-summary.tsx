"use client";

import { Trophy, TrendingUp, Wallet, PiggyBank, Scale, Gift, Gavel, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/index";
import type { ResultadoComparativo } from "@/lib/calculators/comparativo";

interface ResultsSummaryProps {
  resultado: ResultadoComparativo;
}

export function ResultsSummary({ resultado }: ResultsSummaryProps) {
  const { comparacao, financiamento, consorcio } = resultado;
  const isFinanciamentoVencedor = comparacao.vencedor === "financiamento";
  const isConsorcioVencedor = comparacao.vencedor === "consorcio";
  const isEmpate = comparacao.vencedor === "empate";

  // Check if rent economy is configured
  const hasAluguel =
    comparacao.totalDescontoAluguelFinanciamento > 0 || comparacao.totalDescontoAluguelConsorcio > 0;

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
                  {isFinanciamentoVencedor ? "Financiamento" : "Consórcio"} é a melhor opção!
                </h3>
                <p className="text-muted-foreground">
                  Você economiza{" "}
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(comparacao.economiaVencedor)}
                  </span>{" "}
                  em relação ao {isFinanciamentoVencedor ? "consórcio" : "financiamento"}
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
                <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-300">Empate técnico!</h3>
                <p className="text-muted-foreground">As duas opções têm custo líquido praticamente igual</p>
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
              VENCEDOR
            </div>
          )}
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Wallet className="h-5 w-5" />
              Financiamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {hasAluguel ? "Total Pago (Bruto)" : "Total Pago"}
                </p>
                <p className="text-lg font-bold font-mono">{formatCurrency(comparacao.totalPagoFinanciamento)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Juros</p>
                <p className="text-lg font-bold font-mono text-red-600 dark:text-red-400">
                  {formatCurrency(financiamento.totalJurosPagos)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">1ª Parcela</p>
                <p className="text-base font-semibold font-mono">{formatCurrency(financiamento.primeiraPrestacao)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Última Parcela</p>
                <p className="text-base font-semibold font-mono">{formatCurrency(financiamento.ultimaPrestacao)}</p>
              </div>
            </div>

            {/* Economia de aluguel (se configurado) */}
            {hasAluguel && (
              <div className="pt-3 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Economia de Aluguel</p>
                </div>
                <p className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400">
                  -{formatCurrency(comparacao.totalDescontoAluguelFinanciamento)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Aluguel evitado desde o mês 1</p>
              </div>
            )}

            <div className="pt-3 border-t">
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Saldo Investimento Final</p>
              </div>
              <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(comparacao.saldoInvestimentoFinanciamento)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Acumulado investindo a diferença mensal</p>
            </div>

            <div className="pt-3 border-t bg-muted/30 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-wider">Custo Líquido</p>
              </div>
              <p className="text-2xl font-bold font-mono">{formatCurrency(comparacao.custoLiquidoFinanciamento)}</p>
              <p className="text-xs text-muted-foreground">
                {hasAluguel
                  ? "Total pago - Aluguel evitado - Saldo investimento"
                  : "Total pago - Saldo investimento"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card Consórcio */}
        <Card className={`relative overflow-hidden ${isConsorcioVencedor ? "ring-2 ring-emerald-500" : ""}`}>
          {isConsorcioVencedor && (
            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-semibold px-2 py-1 rounded-bl">
              VENCEDOR
            </div>
          )}
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Wallet className="h-5 w-5" />
              Consórcio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {hasAluguel ? "Total Pago (Bruto)" : "Total Pago"}
                </p>
                <p className="text-lg font-bold font-mono">{formatCurrency(comparacao.totalPagoConsorcio)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Taxa Admin.</p>
                <p className="text-lg font-bold font-mono text-red-600 dark:text-red-400">
                  {formatCurrency(consorcio.totalTaxaAdministracao)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">1ª Parcela</p>
                <p className="text-base font-semibold font-mono">{formatCurrency(consorcio.primeiraParcela)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Última Parcela</p>
                <p className="text-base font-semibold font-mono">{formatCurrency(consorcio.ultimaParcela)}</p>
              </div>
            </div>

            {/* Economia de aluguel (se configurado) */}
            {hasAluguel && (
              <div className="pt-3 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Economia de Aluguel</p>
                </div>
                <p className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400">
                  -{formatCurrency(comparacao.totalDescontoAluguelConsorcio)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Aluguel evitado a partir da contemplação (mês {comparacao.mesContemplacao})
                </p>
              </div>
            )}

            <div className="pt-3 border-t">
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Saldo Investimento Final</p>
              </div>
              <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(comparacao.saldoInvestimentoConsorcio)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Acumulado investindo a diferença mensal</p>
            </div>

            <div className="pt-3 border-t bg-muted/30 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-wider">Custo Líquido</p>
              </div>
              <p className="text-2xl font-bold font-mono">{formatCurrency(comparacao.custoLiquidoConsorcio)}</p>
              <p className="text-xs text-muted-foreground">
                {hasAluguel
                  ? "Total pago - Aluguel evitado - Saldo investimento"
                  : "Total pago - Saldo investimento"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Detalhes da Comparação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Valor do Imóvel</p>
              <p className="text-lg font-bold font-mono">{formatCurrency(resultado.valorImovel)}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Prazo Total Analisado</p>
              <p className="text-lg font-bold font-mono">{comparacao.mesesTotal} meses</p>
              <p className="text-xs text-muted-foreground">({(comparacao.mesesTotal / 12).toFixed(1)} anos)</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Diferença Final</p>
              <p className={`text-lg font-bold font-mono ${!isEmpate ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                {formatCurrency(comparacao.economiaVencedor)}
              </p>
            </div>
          </div>

          {/* Contemplação e Lance - exibido apenas se houver valores relevantes */}
          {(comparacao.mesContemplacao > 1 || comparacao.valorLance > 0 || comparacao.valorAgio > 0) && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Cenário do Consórcio
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50/50 dark:bg-purple-950/20">
                  <Gift className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Contemplação</p>
                    <p className="text-sm font-semibold">
                      Mês {comparacao.mesContemplacao}
                      {comparacao.mesContemplacao === 1 && (
                        <span className="text-xs font-normal text-muted-foreground ml-1">(imediata)</span>
                      )}
                    </p>
                  </div>
                </div>
                {comparacao.valorLance > 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50/50 dark:bg-purple-950/20">
                    <Gavel className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Lance</p>
                      <p className="text-sm font-semibold font-mono">{formatCurrency(comparacao.valorLance)}</p>
                    </div>
                  </div>
                )}
                {comparacao.valorAgio > 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50/50 dark:bg-purple-950/20">
                    <Wallet className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Ágio</p>
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

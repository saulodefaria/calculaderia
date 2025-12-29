"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { InputsComparativo } from "@/lib/calculators/comparativo";
import type { MetodoAmortizacao } from "@/lib/calculators/financiamento";
import {
  formatCurrencyFromNumber,
  formatCurrencyInput,
  formatPercentFromNumber,
  formatPercentInput,
  parseCurrencyValue,
  parsePercentValue,
} from "@/lib/utils/index";

interface CalculatorFormProps {
  onCalculate: (inputs: InputsComparativo) => void;
  /** Optional initial values to pre-fill the form */
  initialValues?: InputsComparativo | null;
}

export function CalculatorForm({ onCalculate, initialValues }: CalculatorFormProps) {
  // Valor do Imóvel (compartilhado)
  const [valorImovel, setValorImovel] = useState(() =>
    initialValues ? formatCurrencyFromNumber(initialValues.financiamento.valorImovel) : ""
  );

  // Financiamento
  const [valorEntrada, setValorEntrada] = useState(() =>
    initialValues ? formatCurrencyFromNumber(initialValues.financiamento.valorEntrada) : ""
  );
  const [taxaJurosAnual, setTaxaJurosAnual] = useState(() =>
    initialValues ? formatPercentFromNumber(initialValues.financiamento.taxaJurosAnual) : ""
  );
  const [mesesFinanciamento, setMesesFinanciamento] = useState(() =>
    initialValues && initialValues.financiamento.meses > 0 ? initialValues.financiamento.meses.toString() : ""
  );
  const [metodo, setMetodo] = useState<MetodoAmortizacao>(() => initialValues?.financiamento.metodo ?? "sac");
  const [correcaoAnualImovel, setCorrecaoAnualImovel] = useState(() => {
    if (initialValues && typeof initialValues.financiamento.correcaoAnualImovel === "number") {
      return formatPercentFromNumber(initialValues.financiamento.correcaoAnualImovel);
    }
    return "6";
  });

  // Consórcio
  const [mesesConsorcio, setMesesConsorcio] = useState(() =>
    initialValues && initialValues.consorcio.meses > 0 ? initialValues.consorcio.meses.toString() : ""
  );
  const [taxaAdministracaoTotal, setTaxaAdministracaoTotal] = useState(() =>
    initialValues ? formatPercentFromNumber(initialValues.consorcio.taxaAdministracaoTotal) : ""
  );
  const [correcaoAnualConsorcio, setCorrecaoAnualConsorcio] = useState(() =>
    initialValues ? formatPercentFromNumber(initialValues.consorcio.correcaoAnual) : "6"
  );
  const [agioCartaContemplada, setAgioCartaContemplada] = useState(() =>
    initialValues && initialValues.consorcio.agioCartaContemplada > 0
      ? formatCurrencyFromNumber(initialValues.consorcio.agioCartaContemplada)
      : ""
  );
  const [mesContemplacao, setMesContemplacao] = useState(() =>
    initialValues && initialValues.consorcio.mesContemplacao > 0
      ? initialValues.consorcio.mesContemplacao.toString()
      : "1"
  );
  const [valorLance, setValorLance] = useState(() =>
    initialValues && initialValues.consorcio.valorLance > 0
      ? formatCurrencyFromNumber(initialValues.consorcio.valorLance)
      : ""
  );

  // Investimento
  const [taxaRendimentoAnual, setTaxaRendimentoAnual] = useState(() =>
    initialValues ? formatPercentFromNumber(initialValues.taxaRendimentoAnual) : "10"
  );

  // Aluguel (economia de não pagar aluguel ao ter imóvel próprio)
  const [aluguelMensal, setAluguelMensal] = useState(() =>
    initialValues && initialValues.aluguelMensal > 0 ? formatCurrencyFromNumber(initialValues.aluguelMensal) : ""
  );
  const [correcaoAnualAluguel, setCorrecaoAnualAluguel] = useState(() =>
    initialValues && typeof initialValues.correcaoAnualAluguel === "number"
      ? formatPercentFromNumber(initialValues.correcaoAnualAluguel)
      : "6"
  );

  // Validation: Lance and Ágio are mutually exclusive (same rule as standalone consórcio calculator)
  const lanceAgioError = useMemo(() => {
    const parsedLance = parseCurrencyValue(valorLance);
    const parsedAgio = parseCurrencyValue(agioCartaContemplada);
    return parsedLance > 0 && parsedAgio > 0;
  }, [valorLance, agioCartaContemplada]);

  const handleCurrencyChange = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setter(formatCurrencyInput(value));
  };

  const handlePercentChange = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setter(formatPercentInput(value));
  };

  const handleMesesChange = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const digits = value.replace(/\D/g, "");
    setter(digits);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const inputs: InputsComparativo = {
      financiamento: {
        valorImovel: parseCurrencyValue(valorImovel),
        valorEntrada: parseCurrencyValue(valorEntrada),
        taxaJurosAnual: parsePercentValue(taxaJurosAnual),
        meses: parseInt(mesesFinanciamento) || 0,
        metodo,
        correcaoAnualImovel: parsePercentValue(correcaoAnualImovel),
      },
      consorcio: {
        meses: parseInt(mesesConsorcio) || 0,
        taxaAdministracaoTotal: parsePercentValue(taxaAdministracaoTotal),
        correcaoAnual: parsePercentValue(correcaoAnualConsorcio),
        agioCartaContemplada: parseCurrencyValue(agioCartaContemplada),
        mesContemplacao: parseInt(mesContemplacao) || 1,
        valorLance: parseCurrencyValue(valorLance),
      },
      taxaRendimentoAnual: parsePercentValue(taxaRendimentoAnual),
      aluguelMensal: parseCurrencyValue(aluguelMensal),
      correcaoAnualAluguel: parsePercentValue(correcaoAnualAluguel),
    };

    // Validações
    if (inputs.financiamento.valorImovel <= 0) return;
    if (inputs.financiamento.taxaJurosAnual <= 0) return;
    if (inputs.financiamento.meses <= 0) return;
    if (inputs.financiamento.valorEntrada >= inputs.financiamento.valorImovel) return;
    if (inputs.consorcio.meses <= 0) return;
    if (inputs.consorcio.taxaAdministracaoTotal <= 0) return;
    if (inputs.taxaRendimentoAnual < 0) return;
    // Valida mês de contemplação (deve estar entre 1 e prazo do consórcio)
    if (inputs.consorcio.mesContemplacao < 1 || inputs.consorcio.mesContemplacao > inputs.consorcio.meses) {
      inputs.consorcio.mesContemplacao = Math.min(
        Math.max(1, inputs.consorcio.mesContemplacao),
        inputs.consorcio.meses
      );
    }

    // Prevent submission if both lance and ágio are filled
    if (lanceAgioError) return;

    onCalculate(inputs);
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comparativo Financiamento vs Consórcio</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Valor do Imóvel - Compartilhado */}
            <div className="space-y-4 pb-4 border-b">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Valor do Imóvel</h3>
              <div className="space-y-2">
                <Label htmlFor="valorImovel">Valor do Imóvel</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    id="valorImovel"
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={valorImovel}
                    onChange={(e) => handleCurrencyChange(e.target.value, setValorImovel)}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">Este valor será usado para ambos os cenários</p>
              </div>
            </div>

            {/* Seção Financiamento */}
            <div className="space-y-4 pb-4 border-b">
              <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Financiamento
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="valorEntrada">Valor da Entrada</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <Input
                      id="valorEntrada"
                      type="text"
                      inputMode="numeric"
                      placeholder="0,00"
                      value={valorEntrada}
                      onChange={(e) => handleCurrencyChange(e.target.value, setValorEntrada)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxaJurosAnual">Taxa de Juros Anual</Label>
                  <div className="relative">
                    <Input
                      id="taxaJurosAnual"
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={taxaJurosAnual}
                      onChange={(e) => handlePercentChange(e.target.value, setTaxaJurosAnual)}
                      className="pr-8"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mesesFinanciamento">Prazo do Financiamento</Label>
                  <div className="relative">
                    <Input
                      id="mesesFinanciamento"
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={mesesFinanciamento}
                      onChange={(e) => handleMesesChange(e.target.value, setMesesFinanciamento)}
                      className="pr-16"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      meses
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metodo">Sistema de Amortização</Label>
                  <Select value={metodo} onValueChange={(value) => setMetodo(value as MetodoAmortizacao)}>
                    <SelectTrigger id="metodo">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sac">SAC</SelectItem>
                      <SelectItem value="price">PRICE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="correcaoAnualImovel">Valorização Anual do Imóvel</Label>
                    <Tooltip delayDuration={120}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-4 w-4" />
                          <span className="sr-only">Informações sobre valorização do imóvel</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-center">
                        <p>Estimativa de valorização anual do imóvel. Usado para calcular a TIR do financiamento.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="relative max-w-xs">
                    <Input
                      id="correcaoAnualImovel"
                      type="text"
                      inputMode="decimal"
                      placeholder="6,00"
                      value={correcaoAnualImovel}
                      onChange={(e) => handlePercentChange(e.target.value, setCorrecaoAnualImovel)}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção Consórcio */}
            <div className="space-y-4 pb-4 border-b">
              <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Consórcio
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mesesConsorcio">Prazo do Consórcio</Label>
                  <div className="relative">
                    <Input
                      id="mesesConsorcio"
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={mesesConsorcio}
                      onChange={(e) => handleMesesChange(e.target.value, setMesesConsorcio)}
                      className="pr-16"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      meses
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxaAdministracaoTotal">Taxa de Administração Total</Label>
                  <div className="relative">
                    <Input
                      id="taxaAdministracaoTotal"
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={taxaAdministracaoTotal}
                      onChange={(e) => handlePercentChange(e.target.value, setTaxaAdministracaoTotal)}
                      className="pr-8"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="correcaoAnualConsorcio">Correção Anual (INCC/IPCA)</Label>
                    <Tooltip delayDuration={120}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-4 w-4" />
                          <span className="sr-only">Informações sobre correção anual</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-center">
                        <p>As parcelas do consórcio são corrigidas anualmente por um índice como INCC ou IPCA.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="relative">
                    <Input
                      id="correcaoAnualConsorcio"
                      type="text"
                      inputMode="decimal"
                      placeholder="6,00"
                      value={correcaoAnualConsorcio}
                      onChange={(e) => handlePercentChange(e.target.value, setCorrecaoAnualConsorcio)}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="valorLance">Valor do Lance</Label>
                    <Tooltip delayDuration={120}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-4 w-4" />
                          <span className="sr-only">Informações sobre valor do lance</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-center">
                        <p>
                          Valor pago no mês da contemplação para antecipar parcelas. Reduz o saldo devedor e o prazo do
                          consórcio, gerando economia na taxa de administração.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <Input
                      id="valorLance"
                      type="text"
                      inputMode="numeric"
                      placeholder="0,00"
                      value={valorLance}
                      onChange={(e) => handleCurrencyChange(e.target.value, setValorLance)}
                      className={`pl-10 ${lanceAgioError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="mesContemplacao">Mês de Contemplação</Label>
                    <Tooltip delayDuration={120}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-4 w-4" />
                          <span className="sr-only">Informações sobre mês de contemplação</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-center">
                        <p>
                          Mês em que você será contemplado e receberá a carta de crédito para comprar o imóvel. Antes
                          disso, você paga as parcelas mas ainda não tem o bem.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="relative">
                    <Input
                      id="mesContemplacao"
                      type="text"
                      inputMode="numeric"
                      placeholder="1"
                      value={mesContemplacao}
                      onChange={(e) => handleMesesChange(e.target.value, setMesContemplacao)}
                      className="pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">mês</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="agioCartaContemplada">Ágio da Carta Contemplada</Label>
                    <Tooltip delayDuration={120}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-4 w-4" />
                          <span className="sr-only">Informações sobre ágio da carta contemplada</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-center">
                        <p>
                          Valor pago para comprar uma carta de consórcio já contemplada. Este valor é adicionado ao
                          pagamento inicial (mês 1) e não altera o valor da carta nem as parcelas mensais.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <Input
                      id="agioCartaContemplada"
                      type="text"
                      inputMode="numeric"
                      placeholder="0,00"
                      value={agioCartaContemplada}
                      onChange={(e) => handleCurrencyChange(e.target.value, setAgioCartaContemplada)}
                      className={`pl-10 ${lanceAgioError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                  </div>
                </div>
              </div>

              {lanceAgioError ? (
                <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 mt-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-400">
                    <strong>Erro:</strong> Preencha apenas um dos campos: Valor do Lance <strong>ou</strong> Ágio. São
                    cenários mutuamente exclusivos.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center mt-2 px-2">
                  <strong>Nota:</strong> Lance e Ágio são cenários distintos. Use lance se será contemplado por
                  sorteio/lance. Use ágio se está comprando uma carta já contemplada de terceiros.
                </p>
              )}
            </div>

            {/* Seção Aluguel */}
            <div className="space-y-4 pb-4 border-b">
              <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                Aluguel Recebido (Opcional)
              </h3>
              <p className="text-xs text-muted-foreground">
                Se você pretende alugar o imóvel, informe o valor do aluguel que receberá. Financiamento recebe desde o
                mês 1; consórcio a partir da contemplação.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="aluguelMensal">Aluguel Mensal</Label>
                    <Tooltip delayDuration={120}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-4 w-4" />
                          <span className="sr-only">Informações sobre aluguel</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-center">
                        <p>
                          Valor do aluguel que você receberá ao alugar o imóvel (mês 1). Esse valor será considerado
                          como receita mensal.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <Input
                      id="aluguelMensal"
                      type="text"
                      inputMode="numeric"
                      placeholder="0,00"
                      value={aluguelMensal}
                      onChange={(e) => handleCurrencyChange(e.target.value, setAluguelMensal)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="correcaoAnualAluguel">Correção Anual (IGPM)</Label>
                    <Tooltip delayDuration={120}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-4 w-4" />
                          <span className="sr-only">Informações sobre correção do aluguel</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-center">
                        <p>Reajuste anual do aluguel (geralmente IGPM). Aplicado a cada 12 meses (mês 13, 25, ...).</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="relative">
                    <Input
                      id="correcaoAnualAluguel"
                      type="text"
                      inputMode="decimal"
                      placeholder="6,00"
                      value={correcaoAnualAluguel}
                      onChange={(e) => handlePercentChange(e.target.value, setCorrecaoAnualAluguel)}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção Investimento */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Investimento da Diferença
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="taxaRendimentoAnual">Taxa de Rendimento Anual</Label>
                  <Tooltip delayDuration={120}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
                        <Info className="h-4 w-4" />
                        <span className="sr-only">Informações sobre taxa de rendimento</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-center">
                      <p>
                        Taxa de rendimento anual que você conseguiria investindo a diferença entre as parcelas.
                        Exemplos: CDI (~10%), Tesouro Selic (~10%), CDB (~12%).
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative max-w-xs">
                  <Input
                    id="taxaRendimentoAnual"
                    type="text"
                    inputMode="decimal"
                    placeholder="10,00"
                    value={taxaRendimentoAnual}
                    onChange={(e) => handlePercentChange(e.target.value, setTaxaRendimentoAnual)}
                    className="pr-8"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  A diferença mensal entre as parcelas será investida a essa taxa
                </p>
              </div>
            </div>

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
              Comparar Financiamento vs Consórcio
            </Button>
          </form>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

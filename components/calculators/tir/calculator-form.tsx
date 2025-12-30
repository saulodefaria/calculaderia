"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CashflowsInput, parseCashflowInputs } from "./cashflows-input";
import { type PeriodoTir, validarCashflows } from "@/lib/calculators/tir";
import { formatCurrencyFromNumber } from "@/lib/utils/index";

interface CalculatorFormProps {
  onCalculate: (cashflows: number[], periodo: PeriodoTir) => void;
  initialCashflows?: number[];
  initialPeriodo?: PeriodoTir;
}

export function CalculatorForm({ onCalculate, initialCashflows, initialPeriodo }: CalculatorFormProps) {
  const t = useTranslations("calculators.tir.form");
  const tRoot = useTranslations("calculators.tir");

  // Converte cashflows numéricos iniciais para strings formatadas
  const [cashflowValues, setCashflowValues] = useState<string[]>(() => {
    if (initialCashflows && initialCashflows.length > 0) {
      return initialCashflows.map((cf) => formatNumberForInput(cf));
    }
    return ["", ""];
  });

  const [periodo, setPeriodo] = useState<PeriodoTir>(initialPeriodo ?? "mensal");
  const [errorIndices, setErrorIndices] = useState<Set<number>>(new Set());
  const [validationError, setValidationError] = useState<string | null>(null);

  // Handler que atualiza os valores e limpa erros
  const handleCashflowChange = (newValues: string[]) => {
    setCashflowValues(newValues);
    setErrorIndices(new Set());
    setValidationError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Parseia os valores
    const { cashflows, errorIndices: parseErrors } = parseCashflowInputs(cashflowValues);

    if (parseErrors.size > 0) {
      setErrorIndices(parseErrors);
      setValidationError(t("errors.invalidNumbers"));
      return;
    }

    // Valida os cashflows
    const validacao = validarCashflows(cashflows);
    if (!validacao.valido) {
      setValidationError(validacao.erroCode ? tRoot(`errors.${validacao.erroCode}`) : t("errors.validation"));
      return;
    }

    // Tudo ok, calcula
    onCalculate(cashflows, periodo);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção de período */}
          <div className="space-y-2">
            <Label htmlFor="periodo">{t("period.label")}</Label>
            <Select value={periodo} onValueChange={(value) => setPeriodo(value as PeriodoTir)}>
              <SelectTrigger id="periodo">
                <SelectValue placeholder={t("period.placeholder")} />
              </SelectTrigger>
              <SelectContent>
                {(["mensal", "trimestral", "semestral", "anual"] as PeriodoTir[]).map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`period.options.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t("period.help")}</p>
          </div>

          {/* Input de cashflows */}
          <CashflowsInput values={cashflowValues} onChange={handleCashflowChange} errors={errorIndices} />

          {/* Erro de validação */}
          {validationError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {validationError}
            </div>
          )}

          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
            {t("submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function formatNumberForInput(value: number): string {
  const isNegative = value < 0;
  const absValue = Math.abs(value);
  const formatted = formatCurrencyFromNumber(absValue);
  return isNegative && formatted ? `-${formatted}` : formatted;
}

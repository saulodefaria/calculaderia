"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CashflowsInput, parseCashflowInputs } from "./cashflows-input";
import { type PeriodoTir, PERIODO_LABELS, validarCashflows } from "@/lib/calculators/tir";

interface CalculatorFormProps {
  onCalculate: (cashflows: number[], periodo: PeriodoTir) => void;
  initialCashflows?: number[];
  initialPeriodo?: PeriodoTir;
}

export function CalculatorForm({ onCalculate, initialCashflows, initialPeriodo }: CalculatorFormProps) {
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
      setValidationError("Preencha todos os campos com valores numéricos válidos");
      return;
    }

    // Valida os cashflows
    const validacao = validarCashflows(cashflows);
    if (!validacao.valido) {
      setValidationError(validacao.erro ?? "Erro de validação");
      return;
    }

    // Tudo ok, calcula
    onCalculate(cashflows, periodo);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Dados dos Fluxos de Caixa</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção de período */}
          <div className="space-y-2">
            <Label htmlFor="periodo">Periodicidade dos Fluxos</Label>
            <Select value={periodo} onValueChange={(value) => setPeriodo(value as PeriodoTir)}>
              <SelectTrigger id="periodo">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PERIODO_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Define como a TIR será calculada e exibida (mensal, trimestral, semestral ou anual)
            </p>
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
            Calcular TIR
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function formatNumberForInput(value: number): string {
  if (Number.isInteger(value)) {
    return value.toString().replace(".", ",");
  }
  return value.toFixed(2).replace(".", ",");
}

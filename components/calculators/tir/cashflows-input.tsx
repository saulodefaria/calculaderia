"use client";

import { useState, useCallback, useRef } from "react";
import { Plus, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseCashflowsFromText, parseCashflowValue } from "@/lib/calculators/tir";

interface CashflowsInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  errors?: Set<number>; // Índices dos campos com erro
}

export function CashflowsInput({ values, onChange, errors = new Set() }: CashflowsInputProps) {
  const [pasteDetected, setPasteDetected] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleValueChange = (index: number, value: string) => {
    // Permite apenas números, vírgula, ponto e sinal de menos
    const cleaned = value.replace(/[^\d.,-]/g, "");
    const newValues = [...values];
    newValues[index] = cleaned;
    onChange(newValues);
  };

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
      const pastedText = e.clipboardData.getData("text");

      // Verifica se o texto colado parece ser uma lista de valores
      const hasMultipleValues =
        pastedText.includes("\n") ||
        pastedText.includes("\t") ||
        pastedText.includes(";") ||
        (pastedText.match(/,/g) || []).length > 1;

      if (hasMultipleValues) {
        e.preventDefault();

        const { values: parsedValues } = parseCashflowsFromText(pastedText);

        if (parsedValues.length > 0) {
          // Substitui todos os valores a partir do índice atual
          const newValues = [...values.slice(0, index)];
          parsedValues.forEach((val) => {
            newValues.push(formatNumberForInput(val));
          });
          onChange(newValues);

          // Mostra feedback visual
          setPasteDetected(true);
          setTimeout(() => setPasteDetected(false), 2000);
        }
      }
    },
    [values, onChange]
  );

  const addPeriod = () => {
    onChange([...values, ""]);
    // Focus no novo input após render
    setTimeout(() => {
      const lastInput = inputRefs.current[values.length];
      lastInput?.focus();
    }, 0);
  };

  const removePeriod = (index: number) => {
    if (values.length <= 2) return; // Mínimo de 2 períodos
    const newValues = values.filter((_, i) => i !== index);
    onChange(newValues);
  };

  const clearAll = () => {
    onChange(["", ""]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Fluxos de Caixa</Label>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={clearAll} className="h-8 px-2 text-xs">
            <Trash2 className="h-3 w-3 mr-1" />
            Limpar
          </Button>
        </div>
      </div>

      {pasteDetected && (
        <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
          Valores detectados e importados automaticamente!
        </div>
      )}

      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-16 shrink-0">Período {index + 1}</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <Input
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={value}
                onChange={(e) => handleValueChange(index, e.target.value)}
                onPaste={(e) => handlePaste(e, index)}
                className={`pl-10 ${errors.has(index) ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removePeriod(index)}
              disabled={values.length <= 2}
              className="h-9 w-9 shrink-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={addPeriod} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Período
      </Button>

      <p className="text-xs text-muted-foreground">
        Dica: Cole valores diretamente de uma planilha (coluna ou linha) para importar múltiplos fluxos de uma vez.
        Use valores negativos para saídas (ex: investimento inicial) e positivos para entradas.
      </p>
    </div>
  );
}

/**
 * Formata um número para exibição no input (formato brasileiro)
 */
function formatNumberForInput(value: number): string {
  // Se é inteiro, não precisa de decimais
  if (Number.isInteger(value)) {
    return value.toString().replace(".", ",");
  }
  // Senão, formata com até 2 decimais
  return value.toFixed(2).replace(".", ",");
}

/**
 * Converte os valores string do input para números
 * Retorna os valores e os índices com erro
 */
export function parseCashflowInputs(values: string[]): { cashflows: number[]; errorIndices: Set<number> } {
  const cashflows: number[] = [];
  const errorIndices = new Set<number>();

  values.forEach((value, index) => {
    if (value.trim() === "") {
      errorIndices.add(index);
      return;
    }

    const parsed = parseCashflowValue(value);
    if (parsed === null) {
      errorIndices.add(index);
    } else {
      cashflows.push(parsed);
    }
  });

  return { cashflows, errorIndices };
}


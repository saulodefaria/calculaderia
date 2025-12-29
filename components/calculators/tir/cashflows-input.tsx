"use client";

import { useState, useCallback, useRef } from "react";
import { Plus, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseCashflowValue } from "@/lib/calculators/tir";
import { formatCurrencyInput, formatCurrencyFromNumber, parseCurrencyValue } from "@/lib/utils/index";

interface CashflowsInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  errors?: Set<number>; // Índices dos campos com erro
}

export function CashflowsInput({ values, onChange, errors = new Set() }: CashflowsInputProps) {
  const [pasteDetected, setPasteDetected] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleValueChange = (index: number, value: string) => {
    // Detecta se é negativo
    const isNegative = value.startsWith("-");
    const valueWithoutSign = isNegative ? value.substring(1) : value;

    // Formata como moeda (remove caracteres não numéricos e formata)
    const formatted = formatCurrencyInput(valueWithoutSign);

    // Adiciona o sinal de menos de volta se necessário
    const finalValue = isNegative && formatted ? `-${formatted}` : formatted;

    const newValues = [...values];
    newValues[index] = finalValue;
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

        // Detecta qual separador está sendo usado
        let separator: RegExp;
        if (pastedText.includes("\n")) {
          separator = /\n+/;
        } else if (pastedText.includes("\t")) {
          separator = /\t+/;
        } else if (pastedText.includes(";")) {
          separator = /;+/;
        } else {
          // Para vírgula, verifica se é separador de lista
          const commaCount = (pastedText.match(/,/g) || []).length;
          const dotCount = (pastedText.match(/\./g) || []).length;
          if (commaCount > 1 && dotCount === 0) {
            separator = /,+/;
          } else {
            // Valor único, não é lista múltipla
            return;
          }
        }

        // Divide o texto e processa cada parte
        const parts = pastedText.split(separator).map((s) => s.trim());
        const parsedValues: number[] = [];

        parts.forEach((part) => {
          // Trata valores vazios como 0
          if (part === "" || part === null || part === undefined) {
            parsedValues.push(0);
            return;
          }

          // Tenta parsear o valor
          const parsed = parseCashflowValue(part);
          if (parsed !== null) {
            parsedValues.push(parsed);
          } else {
            // Se não conseguir parsear, trata como 0
            parsedValues.push(0);
          }
        });

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
            <span className="text-xs text-muted-foreground w-20 shrink-0">Período {index + 1}</span>
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
              variant="outline"
              size="icon"
              onClick={() => removePeriod(index)}
              disabled={values.length <= 2}
              className="h-9 w-9 shrink-0">
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
        Dica: Cole valores diretamente de uma planilha (coluna ou linha) para importar múltiplos fluxos de uma vez. Use
        valores negativos para saídas (ex: investimento inicial) e positivos para entradas.
      </p>
    </div>
  );
}

/**
 * Formata um número para exibição no input (formato brasileiro)
 */
function formatNumberForInput(value: number): string {
  // Trata 0 explicitamente
  if (value === 0) {
    return "0,00";
  }
  const isNegative = value < 0;
  const absValue = Math.abs(value);
  const formatted = formatCurrencyFromNumber(absValue);
  return isNegative && formatted ? `-${formatted}` : formatted;
}

/**
 * Converte os valores string do input para números
 * Retorna os valores e os índices com erro
 * Valores vazios são tratados como 0
 */
export function parseCashflowInputs(values: string[]): { cashflows: number[]; errorIndices: Set<number> } {
  const cashflows: number[] = [];
  const errorIndices = new Set<number>();

  values.forEach((value) => {
    // Trata valores vazios como 0
    if (value.trim() === "") {
      cashflows.push(0);
      return;
    }

    // Detecta se é negativo e parseia o valor absoluto
    const isNegative = value.startsWith("-");
    const valueWithoutSign = isNegative ? value.substring(1) : value;

    // Se só tem o sinal de menos, trata como 0
    if (!valueWithoutSign.trim()) {
      cashflows.push(0);
      return;
    }

    // Usa parseCurrencyValue que já lida com formato brasileiro
    const parsed = parseCurrencyValue(valueWithoutSign);
    const finalValue = isNegative ? -parsed : parsed;

    if (isNaN(finalValue)) {
      cashflows.push(0);
    } else {
      cashflows.push(finalValue);
    }
  });

  return { cashflows, errorIndices };
}

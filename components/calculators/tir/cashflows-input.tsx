"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Plus, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseCashflowValue } from "@/lib/calculators/tir";
import { formatCurrencyInput, formatCurrencyFromNumber, parseCurrencyValue } from "@/lib/utils/index";

interface CashflowsInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  errors?: Set<number>; // Indices of fields with errors
}

export function CashflowsInput({ values, onChange, errors = new Set() }: CashflowsInputProps) {
  const t = useTranslations("calculators.tir.cashflows");
  const [pasteDetected, setPasteDetected] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleValueChange = (index: number, value: string) => {
    // Detect if negative
    const isNegative = value.startsWith("-");
    const valueWithoutSign = isNegative ? value.substring(1) : value;

    // Format as currency (remove non-numeric characters and format)
    const formatted = formatCurrencyInput(valueWithoutSign);

    // Add minus sign back if necessary
    const finalValue = isNegative && formatted ? `-${formatted}` : formatted;

    const newValues = [...values];
    newValues[index] = finalValue;
    onChange(newValues);
  };

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
      const pastedText = e.clipboardData.getData("text");

      // Check if pasted text appears to be a list of values
      const hasMultipleValues =
        pastedText.includes("\n") ||
        pastedText.includes("\t") ||
        pastedText.includes(";") ||
        (pastedText.match(/,/g) || []).length > 1;

      if (hasMultipleValues) {
        e.preventDefault();

        // Detect which separator is being used
        let separator: RegExp;
        if (pastedText.includes("\n")) {
          separator = /\n+/;
        } else if (pastedText.includes("\t")) {
          separator = /\t+/;
        } else if (pastedText.includes(";")) {
          separator = /;+/;
        } else {
          // For comma, check if it's a list separator
          const commaCount = (pastedText.match(/,/g) || []).length;
          const dotCount = (pastedText.match(/\./g) || []).length;
          if (commaCount > 1 && dotCount === 0) {
            separator = /,+/;
          } else {
            // Single value, not a multiple list
            return;
          }
        }

        // Split text and process each part
        const parts = pastedText.split(separator).map((s) => s.trim());
        const parsedValues: number[] = [];

        parts.forEach((part) => {
          // Treat empty values as 0
          if (part === "" || part === null || part === undefined) {
            parsedValues.push(0);
            return;
          }

          // Try to parse the value
          const parsed = parseCashflowValue(part);
          if (parsed !== null) {
            parsedValues.push(parsed);
          } else {
            // If unable to parse, treat as 0
            parsedValues.push(0);
          }
        });

        if (parsedValues.length > 0) {
          // Replace all values starting from current index
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
    // Focus on new input after render
    setTimeout(() => {
      const lastInput = inputRefs.current[values.length];
      lastInput?.focus();
    }, 0);
  };

  const removePeriod = (index: number) => {
    if (values.length <= 2) return; // Minimum of 2 periods
    const newValues = values.filter((_, i) => i !== index);
    onChange(newValues);
  };

  const clearAll = () => {
    onChange(["", ""]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{t("title")}</Label>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={clearAll} className="h-8 px-2 text-xs">
            <Trash2 className="h-3 w-3 mr-1" />
            {t("clear")}
          </Button>
        </div>
      </div>

      {pasteDetected && (
        <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
          {t("pasteDetected")}
        </div>
      )}

      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-20 shrink-0">
              {t("periodLabel", { index: index + 1 })}
            </span>
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
        {t("addPeriod")}
      </Button>

      <p className="text-xs text-muted-foreground">{t("tip")}</p>
    </div>
  );
}

/**
 * Formats a number for display in input (Brazilian format)
 */
function formatNumberForInput(value: number): string {
  // Handle 0 explicitly
  if (value === 0) {
    return "0,00";
  }
  const isNegative = value < 0;
  const absValue = Math.abs(value);
  const formatted = formatCurrencyFromNumber(absValue);
  return isNegative && formatted ? `-${formatted}` : formatted;
}

/**
 * Converts string values from input to numbers
 * Returns values and error indices
 * Empty values are treated as 0
 */
export function parseCashflowInputs(values: string[]): { cashflows: number[]; errorIndices: Set<number> } {
  const cashflows: number[] = [];
  const errorIndices = new Set<number>();

  values.forEach((value) => {
    // Treat empty values as 0
    if (value.trim() === "") {
      cashflows.push(0);
      return;
    }

    // Detect if negative and parse absolute value
    const isNegative = value.startsWith("-");
    const valueWithoutSign = isNegative ? value.substring(1) : value;

    // If only minus sign, treat as 0
    if (!valueWithoutSign.trim()) {
      cashflows.push(0);
      return;
    }

    // Use parseCurrencyValue which already handles Brazilian format
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

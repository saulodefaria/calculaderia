import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return currencyFormatter.format(0);
  // Garante sempre 2 casas decimais na apresentação,
  // mesmo que o número interno venha com mais casas.
  const rounded = Number(value.toFixed(2));
  return currencyFormatter.format(rounded);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

export function parseCurrencyInput(value: string): number {
  // Remove everything except digits and comma/period
  const cleaned = value.replace(/[^\d,.-]/g, "");
  // Replace comma with period for parsing
  const normalized = cleaned.replace(",", ".");
  return parseFloat(normalized) || 0;
}

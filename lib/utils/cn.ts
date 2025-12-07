import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes do Tailwind CSS de forma inteligente
 * usando clsx para concatenação e tailwind-merge para resolver conflitos
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


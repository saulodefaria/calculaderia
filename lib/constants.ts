import { Calculator, Home, TrendingUp, Percent, PiggyBank } from "lucide-react";

export interface CalculatorDefinition {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: typeof Calculator;
  available: boolean;
}

export const calculators: CalculatorDefinition[] = [
  {
    id: "financiamento",
    title: "Calculadora de Financiamento",
    description: "Calcule suas parcelas usando os sistemas SAC ou PRICE. Visualize a tabela de amortização completa.",
    href: "/calculadoras/financiamento",
    icon: Home,
    available: true,
  },
  {
    id: "juros-compostos",
    title: "Juros Compostos",
    description: "Calcule o rendimento dos seus investimentos com juros compostos ao longo do tempo.",
    href: "/calculadoras/juros-compostos",
    icon: TrendingUp,
    available: false,
  },
  {
    id: "taxa-equivalente",
    title: "Taxa Equivalente",
    description: "Converta taxas de juros entre diferentes períodos (mensal, anual, etc).",
    href: "/calculadoras/taxa-equivalente",
    icon: Percent,
    available: false,
  },
  {
    id: "poupanca",
    title: "Simulador de Poupança",
    description: "Simule quanto você terá ao poupar um valor mensal durante um período.",
    href: "/calculadoras/poupanca",
    icon: PiggyBank,
    available: false,
  },
];

export const siteConfig = {
  name: "Calculadoras Financeiras",
  description: "Ferramentas gratuitas para cálculos financeiros: financiamento, juros compostos, e muito mais.",
};

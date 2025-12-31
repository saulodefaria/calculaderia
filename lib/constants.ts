import { Calculator, Home, TrendingUp, Users, Scale, LineChart, BarChart3 } from "lucide-react";

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
    id: "consorcio",
    title: "Calculadora de Consórcio",
    description: "Simule as parcelas do seu consórcio com correção anual por INCC/IPCA.",
    href: "/calculadoras/consorcio",
    icon: Users,
    available: true,
  },
  {
    id: "comparativo",
    title: "Financiamento vs Consórcio",
    description: "Compare financiamento e consórcio lado a lado. Veja qual opção deixa mais dinheiro no seu bolso.",
    href: "/calculadoras/comparativo",
    icon: Scale,
    available: true,
  },
  {
    id: "alugar-vs-comprar",
    title: "Alugar vs Comprar",
    description: "Compare se é melhor comprar um imóvel financiado ou alugar e investir a diferença.",
    href: "/calculadoras/alugar-vs-comprar",
    icon: Home,
    available: true,
  },
  {
    id: "tir",
    title: "Calculadora de TIR",
    description: "Calcule a Taxa Interna de Retorno de uma série de fluxos de caixa.",
    href: "/calculadoras/tir",
    icon: LineChart,
    available: true,
  },
  {
    id: "juros-compostos",
    title: "Juros Compostos",
    description: "Calcule o rendimento dos seus investimentos com juros compostos ao longo do tempo.",
    href: "/calculadoras/juros-compostos",
    icon: TrendingUp,
    available: true,
  },
  {
    id: "renda-fixa",
    title: "Comparador de Renda Fixa",
    description: "Compare investimentos de renda fixa (Pré, CDI, IPCA+, Selic) líquidos de IR/IOF e inflação.",
    href: "/calculadoras/renda-fixa",
    icon: BarChart3,
    available: true,
  },
];

export const siteConfig = {
  name: "Calculaderia",
  description: "Ferramentas gratuitas para cálculos financeiros: financiamento, consórcio, aluguel, e muito mais.",
};

import { Calculator, Home, TrendingUp, Users, Scale, LineChart, BarChart3, BriefcaseBusiness } from "lucide-react";

export type CalculatorCategoryId =
  | "trabalho-salario-beneficios"
  | "financiamento-credito"
  | "investimentos-rendimentos"
  | "moradia-patrimonio"
  | "impostos-governo";

export interface CalculatorCategoryDefinition {
  id: CalculatorCategoryId;
  slug: string;
  href: string;
  icon: typeof Calculator;
  sitemapPriority: number;
}

export interface CalculatorDefinition {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: typeof Calculator;
  available: boolean;
  primaryCategoryId: CalculatorCategoryId;
  categoryIds: CalculatorCategoryId[];
  popularRank?: number;
  sitemapPriority?: number;
}

export const calculatorCategories: CalculatorCategoryDefinition[] = [
  {
    id: "trabalho-salario-beneficios",
    slug: "trabalho-salario-beneficios",
    href: "/calculadoras/categorias/trabalho-salario-beneficios",
    icon: BriefcaseBusiness,
    sitemapPriority: 0.75,
  },
  {
    id: "financiamento-credito",
    slug: "financiamento-credito",
    href: "/calculadoras/categorias/financiamento-credito",
    icon: Scale,
    sitemapPriority: 0.8,
  },
  {
    id: "investimentos-rendimentos",
    slug: "investimentos-rendimentos",
    href: "/calculadoras/categorias/investimentos-rendimentos",
    icon: TrendingUp,
    sitemapPriority: 0.8,
  },
  {
    id: "moradia-patrimonio",
    slug: "moradia-patrimonio",
    href: "/calculadoras/categorias/moradia-patrimonio",
    icon: Home,
    sitemapPriority: 0.75,
  },
  {
    id: "impostos-governo",
    slug: "impostos-governo",
    href: "/calculadoras/categorias/impostos-governo",
    icon: BarChart3,
    sitemapPriority: 0.65,
  },
];

export const calculators: CalculatorDefinition[] = [
  {
    id: "rescisao-trabalhista",
    title: "Calculadora de Rescisão Trabalhista",
    description: "Estime verbas de rescisão CLT, aviso prévio, férias, décimo terceiro, FGTS e descontos.",
    href: "/calculadoras/rescisao-trabalhista",
    icon: BriefcaseBusiness,
    available: true,
    primaryCategoryId: "trabalho-salario-beneficios",
    categoryIds: ["trabalho-salario-beneficios"],
    sitemapPriority: 0.85,
  },
  {
    id: "financiamento",
    title: "Calculadora de Financiamento",
    description: "Calcule suas parcelas usando os sistemas SAC ou PRICE. Visualize a tabela de amortização completa.",
    href: "/calculadoras/financiamento",
    icon: Home,
    available: true,
    primaryCategoryId: "financiamento-credito",
    categoryIds: ["financiamento-credito", "moradia-patrimonio"],
    popularRank: 1,
    sitemapPriority: 0.9,
  },
  {
    id: "consorcio",
    title: "Calculadora de Consórcio",
    description: "Simule as parcelas do seu consórcio com correção anual por INCC/IPCA.",
    href: "/calculadoras/consorcio",
    icon: Users,
    available: true,
    primaryCategoryId: "financiamento-credito",
    categoryIds: ["financiamento-credito"],
    popularRank: 4,
    sitemapPriority: 0.75,
  },
  {
    id: "comparativo",
    title: "Financiamento vs Consórcio",
    description: "Compare financiamento e consórcio lado a lado. Veja qual opção deixa mais dinheiro no seu bolso.",
    href: "/calculadoras/comparativo",
    icon: Scale,
    available: true,
    primaryCategoryId: "financiamento-credito",
    categoryIds: ["financiamento-credito", "moradia-patrimonio"],
    sitemapPriority: 0.75,
  },
  {
    id: "alugar-vs-comprar",
    title: "Alugar vs Comprar",
    description: "Compare se é melhor comprar um imóvel financiado ou alugar e investir a diferença.",
    href: "/calculadoras/alugar-vs-comprar",
    icon: Home,
    available: true,
    primaryCategoryId: "moradia-patrimonio",
    categoryIds: ["moradia-patrimonio"],
    sitemapPriority: 0.75,
  },
  {
    id: "tir",
    title: "Calculadora de TIR",
    description: "Calcule a Taxa Interna de Retorno de uma série de fluxos de caixa.",
    href: "/calculadoras/tir",
    icon: LineChart,
    available: true,
    primaryCategoryId: "investimentos-rendimentos",
    categoryIds: ["investimentos-rendimentos"],
    sitemapPriority: 0.75,
  },
  {
    id: "juros-compostos",
    title: "Juros Compostos",
    description: "Calcule o rendimento dos seus investimentos com juros compostos ao longo do tempo.",
    href: "/calculadoras/juros-compostos",
    icon: TrendingUp,
    available: true,
    primaryCategoryId: "investimentos-rendimentos",
    categoryIds: ["investimentos-rendimentos"],
    popularRank: 2,
    sitemapPriority: 0.8,
  },
  {
    id: "renda-fixa",
    title: "Comparador de Renda Fixa",
    description: "Compare investimentos de renda fixa (Pré, CDI, IPCA+, Selic) líquidos de IR/IOF e inflação.",
    href: "/calculadoras/renda-fixa",
    icon: BarChart3,
    available: true,
    primaryCategoryId: "investimentos-rendimentos",
    categoryIds: ["investimentos-rendimentos"],
    popularRank: 3,
    sitemapPriority: 0.8,
  },
];

export function getAvailableCalculators() {
  return calculators.filter((calculator) => calculator.available);
}

export function getPopularCalculators() {
  return getAvailableCalculators()
    .filter((calculator) => typeof calculator.popularRank === "number")
    .sort((a, b) => (a.popularRank ?? Number.MAX_SAFE_INTEGER) - (b.popularRank ?? Number.MAX_SAFE_INTEGER));
}

export function getCalculatorById(calculatorId: string) {
  return calculators.find((calculator) => calculator.id === calculatorId);
}

export function getCalculatorCategoryById(categoryId: CalculatorCategoryId) {
  return calculatorCategories.find((category) => category.id === categoryId);
}

export function getCalculatorCategoryBySlug(categorySlug: string) {
  return calculatorCategories.find((category) => category.slug === categorySlug);
}

export function getCalculatorsByCategory(categoryId: CalculatorCategoryId) {
  return getAvailableCalculators().filter((calculator) => calculator.categoryIds.includes(categoryId));
}

export function getPrimaryCalculatorsByCategory(categoryId: CalculatorCategoryId) {
  return getAvailableCalculators().filter((calculator) => calculator.primaryCategoryId === categoryId);
}

export function getVisibleCalculatorCategories() {
  return calculatorCategories.filter((category) => getCalculatorsByCategory(category.id).length > 0);
}

export function getCalculatorPrimaryCategory(calculatorId: string) {
  const calculator = getCalculatorById(calculatorId);
  const category = calculator ? getCalculatorCategoryById(calculator.primaryCategoryId) : undefined;

  if (!calculator || !category) {
    throw new Error(`Calculator "${calculatorId}" does not have a valid primary category.`);
  }

  return category;
}

export const siteConfig = {
  name: "Calculaderia",
  description: "Ferramentas gratuitas para cálculos financeiros: financiamento, consórcio, aluguel, e muito mais.",
};

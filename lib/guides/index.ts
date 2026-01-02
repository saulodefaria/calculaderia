import { Home, TrendingUp, LineChart, BarChart3, Scale, Calculator } from "lucide-react";

export interface GuideFaqItem {
  question: string;
  answer: string;
}

export interface GuideDefinition {
  slug: string;
  titleKey: string;
  descriptionKey: string;
  metaTitleKey: string;
  metaDescriptionKey: string;
  relatedCalculators: string[]; // calculator IDs
  icon: typeof Calculator;
  faqCount: number; // Number of FAQ items for this guide
}

/**
 * Registry of all guides.
 * The actual content (title, description, FAQ) is stored in messages files.
 * This registry defines the structure and relationships.
 */
export const guides: GuideDefinition[] = [
  {
    slug: "sac-vs-price",
    titleKey: "guides.sacVsPrice.title",
    descriptionKey: "guides.sacVsPrice.description",
    metaTitleKey: "guides.sacVsPrice.metaTitle",
    metaDescriptionKey: "guides.sacVsPrice.metaDescription",
    relatedCalculators: ["financiamento", "comparativo"],
    icon: Home,
    faqCount: 5,
  },
  {
    slug: "juros-compostos-como-calcular",
    titleKey: "guides.jurosCompostos.title",
    descriptionKey: "guides.jurosCompostos.description",
    metaTitleKey: "guides.jurosCompostos.metaTitle",
    metaDescriptionKey: "guides.jurosCompostos.metaDescription",
    relatedCalculators: ["juros-compostos", "renda-fixa"],
    icon: TrendingUp,
    faqCount: 5,
  },
  {
    slug: "tir-o-que-e-como-calcular",
    titleKey: "guides.tir.title",
    descriptionKey: "guides.tir.description",
    metaTitleKey: "guides.tir.metaTitle",
    metaDescriptionKey: "guides.tir.metaDescription",
    relatedCalculators: ["tir", "juros-compostos"],
    icon: LineChart,
    faqCount: 5,
  },
  {
    slug: "renda-fixa-cdi-ipca-selic",
    titleKey: "guides.rendaFixa.title",
    descriptionKey: "guides.rendaFixa.description",
    metaTitleKey: "guides.rendaFixa.metaTitle",
    metaDescriptionKey: "guides.rendaFixa.metaDescription",
    relatedCalculators: ["renda-fixa", "juros-compostos"],
    icon: BarChart3,
    faqCount: 5,
  },
  {
    slug: "financiamento-vs-consorcio",
    titleKey: "guides.financiamentoVsConsorcio.title",
    descriptionKey: "guides.financiamentoVsConsorcio.description",
    metaTitleKey: "guides.financiamentoVsConsorcio.metaTitle",
    metaDescriptionKey: "guides.financiamentoVsConsorcio.metaDescription",
    relatedCalculators: ["comparativo", "financiamento", "consorcio"],
    icon: Scale,
    faqCount: 5,
  },
  {
    slug: "como-usar-calculadora-financeira",
    titleKey: "guides.comoUsar.title",
    descriptionKey: "guides.comoUsar.description",
    metaTitleKey: "guides.comoUsar.metaTitle",
    metaDescriptionKey: "guides.comoUsar.metaDescription",
    relatedCalculators: ["financiamento", "juros-compostos", "renda-fixa", "tir"],
    icon: Calculator,
    faqCount: 4,
  },
];

export function getGuideBySlug(slug: string): GuideDefinition | undefined {
  return guides.find((g) => g.slug === slug);
}

export function getAllGuideSlugs(): string[] {
  return guides.map((g) => g.slug);
}

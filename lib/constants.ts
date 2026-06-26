import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  BarChart3,
  Braces,
  BriefcaseBusiness,
  Building2,
  Calculator,
  CalendarDays,
  CalendarRange,
  CircleDollarSign,
  Code2,
  FileText,
  Home,
  KeyRound,
  Landmark,
  LineChart,
  Mail,
  Percent,
  QrCode,
  Scale,
  Shuffle,
  Sigma,
  TrendingUp,
  Users,
} from "lucide-react";

export type ToolFamilyId =
  | "calculadoras"
  | "geradores"
  | "validadores"
  | "matematica"
  | "datas"
  | "texto"
  | "dev";

export type CalculatorCategoryId =
  | "trabalho-salario-beneficios"
  | "financiamento-credito"
  | "investimentos-rendimentos"
  | "moradia-patrimonio"
  | "impostos-governo";

export type ToolCategoryId =
  | CalculatorCategoryId
  | "seguranca"
  | "aleatorios"
  | "codigos-links"
  | "documentos"
  | "contato"
  | "matematica-basica"
  | "datas-periodos"
  | "contagem-texto"
  | "transformacao-texto"
  | "dados-estruturados"
  | "codificacao";

export type ToolStateMode = "none" | "query";

export interface ToolFamilyDefinition {
  id: ToolFamilyId;
  slug: string;
  href: string;
  icon: LucideIcon;
  sitemapPriority: number;
}

export interface ToolCategoryDefinition {
  id: ToolCategoryId;
  familyId: ToolFamilyId;
  slug: string;
  href: string;
  icon: LucideIcon;
  sitemapPriority: number;
}

export interface ToolDefinition {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  available: boolean;
  familyId: ToolFamilyId;
  primaryCategoryId: ToolCategoryId;
  categoryIds: ToolCategoryId[];
  popularRank?: number;
  recentRank?: number;
  sitemapPriority?: number;
  stateMode: ToolStateMode;
  seoApplicationCategory: string;
}

export type CalculatorCategoryDefinition = ToolCategoryDefinition & {
  id: CalculatorCategoryId;
  familyId: "calculadoras";
};

export type CalculatorDefinition = ToolDefinition & {
  familyId: "calculadoras";
  primaryCategoryId: CalculatorCategoryId;
  categoryIds: CalculatorCategoryId[];
};

export const toolFamilies: ToolFamilyDefinition[] = [
  {
    id: "calculadoras",
    slug: "calculadoras",
    href: "/calculadoras",
    icon: Calculator,
    sitemapPriority: 0.85,
  },
  {
    id: "geradores",
    slug: "geradores",
    href: "/geradores",
    icon: KeyRound,
    sitemapPriority: 0.78,
  },
  {
    id: "validadores",
    slug: "validadores",
    href: "/validadores",
    icon: BadgeCheck,
    sitemapPriority: 0.78,
  },
  {
    id: "matematica",
    slug: "matematica",
    href: "/matematica",
    icon: Sigma,
    sitemapPriority: 0.75,
  },
  {
    id: "datas",
    slug: "datas",
    href: "/datas",
    icon: CalendarDays,
    sitemapPriority: 0.72,
  },
  {
    id: "texto",
    slug: "texto",
    href: "/texto",
    icon: FileText,
    sitemapPriority: 0.76,
  },
  {
    id: "dev",
    slug: "dev",
    href: "/dev",
    icon: Code2,
    sitemapPriority: 0.76,
  },
];

export const toolCategories: ToolCategoryDefinition[] = [
  {
    id: "trabalho-salario-beneficios",
    familyId: "calculadoras",
    slug: "trabalho-salario-beneficios",
    href: "/calculadoras/categorias/trabalho-salario-beneficios",
    icon: BriefcaseBusiness,
    sitemapPriority: 0.75,
  },
  {
    id: "financiamento-credito",
    familyId: "calculadoras",
    slug: "financiamento-credito",
    href: "/calculadoras/categorias/financiamento-credito",
    icon: Scale,
    sitemapPriority: 0.8,
  },
  {
    id: "investimentos-rendimentos",
    familyId: "calculadoras",
    slug: "investimentos-rendimentos",
    href: "/calculadoras/categorias/investimentos-rendimentos",
    icon: TrendingUp,
    sitemapPriority: 0.8,
  },
  {
    id: "moradia-patrimonio",
    familyId: "calculadoras",
    slug: "moradia-patrimonio",
    href: "/calculadoras/categorias/moradia-patrimonio",
    icon: Home,
    sitemapPriority: 0.75,
  },
  {
    id: "impostos-governo",
    familyId: "calculadoras",
    slug: "impostos-governo",
    href: "/calculadoras/categorias/impostos-governo",
    icon: BarChart3,
    sitemapPriority: 0.65,
  },
  {
    id: "seguranca",
    familyId: "geradores",
    slug: "seguranca",
    href: "/geradores/categorias/seguranca",
    icon: KeyRound,
    sitemapPriority: 0.7,
  },
  {
    id: "aleatorios",
    familyId: "geradores",
    slug: "aleatorios",
    href: "/geradores/categorias/aleatorios",
    icon: Shuffle,
    sitemapPriority: 0.7,
  },
  {
    id: "codigos-links",
    familyId: "geradores",
    slug: "codigos-links",
    href: "/geradores/categorias/codigos-links",
    icon: QrCode,
    sitemapPriority: 0.72,
  },
  {
    id: "documentos",
    familyId: "validadores",
    slug: "documentos",
    href: "/validadores/categorias/documentos",
    icon: BadgeCheck,
    sitemapPriority: 0.72,
  },
  {
    id: "contato",
    familyId: "validadores",
    slug: "contato",
    href: "/validadores/categorias/contato",
    icon: Mail,
    sitemapPriority: 0.72,
  },
  {
    id: "matematica-basica",
    familyId: "matematica",
    slug: "matematica-basica",
    href: "/matematica/categorias/matematica-basica",
    icon: Percent,
    sitemapPriority: 0.7,
  },
  {
    id: "datas-periodos",
    familyId: "datas",
    slug: "datas-periodos",
    href: "/datas/categorias/datas-periodos",
    icon: CalendarRange,
    sitemapPriority: 0.68,
  },
  {
    id: "contagem-texto",
    familyId: "texto",
    slug: "contagem-texto",
    href: "/texto/categorias/contagem-texto",
    icon: FileText,
    sitemapPriority: 0.7,
  },
  {
    id: "transformacao-texto",
    familyId: "texto",
    slug: "transformacao-texto",
    href: "/texto/categorias/transformacao-texto",
    icon: FileText,
    sitemapPriority: 0.7,
  },
  {
    id: "dados-estruturados",
    familyId: "dev",
    slug: "dados-estruturados",
    href: "/dev/categorias/dados-estruturados",
    icon: Braces,
    sitemapPriority: 0.72,
  },
  {
    id: "codificacao",
    familyId: "dev",
    slug: "codificacao",
    href: "/dev/categorias/codificacao",
    icon: Code2,
    sitemapPriority: 0.72,
  },
];

export const tools: ToolDefinition[] = [
  {
    id: "rescisao-trabalhista",
    title: "Calculadora de Rescisão Trabalhista",
    description: "Estime verbas de rescisão CLT, aviso prévio, férias, décimo terceiro, FGTS e descontos.",
    href: "/calculadoras/rescisao-trabalhista",
    icon: BriefcaseBusiness,
    available: true,
    familyId: "calculadoras",
    primaryCategoryId: "trabalho-salario-beneficios",
    categoryIds: ["trabalho-salario-beneficios"],
    sitemapPriority: 0.85,
    stateMode: "query",
    seoApplicationCategory: "FinanceApplication",
  },
  {
    id: "salario-liquido",
    title: "Calculadora de Salário Líquido",
    description: "Estime salário líquido CLT com INSS, IRRF, dependentes, pensão e descontos manuais.",
    href: "/calculadoras/salario-liquido",
    icon: CircleDollarSign,
    available: true,
    familyId: "calculadoras",
    primaryCategoryId: "trabalho-salario-beneficios",
    categoryIds: ["trabalho-salario-beneficios", "impostos-governo"],
    popularRank: 9,
    sitemapPriority: 0.84,
    stateMode: "query",
    seoApplicationCategory: "FinanceApplication",
  },
  {
    id: "fgts",
    title: "Calculadora de FGTS",
    description: "Estime depósitos mensais de FGTS, base de multa e cenários de 40% ou 20%.",
    href: "/calculadoras/fgts",
    icon: Landmark,
    available: true,
    familyId: "calculadoras",
    primaryCategoryId: "trabalho-salario-beneficios",
    categoryIds: ["trabalho-salario-beneficios"],
    popularRank: 10,
    sitemapPriority: 0.8,
    stateMode: "query",
    seoApplicationCategory: "FinanceApplication",
  },
  {
    id: "inss",
    title: "Calculadora de INSS",
    description: "Estime o desconto de INSS com tabela progressiva 2026, teto e memória por faixas.",
    href: "/calculadoras/inss",
    icon: Landmark,
    available: true,
    familyId: "calculadoras",
    primaryCategoryId: "trabalho-salario-beneficios",
    categoryIds: ["trabalho-salario-beneficios", "impostos-governo"],
    popularRank: 11,
    sitemapPriority: 0.8,
    stateMode: "query",
    seoApplicationCategory: "FinanceApplication",
  },
  {
    id: "ferias",
    title: "Calculadora de Férias",
    description: "Estime férias CLT com 1/3 constitucional, abono pecuniário e descontos de INSS/IRRF.",
    href: "/calculadoras/ferias",
    icon: CalendarDays,
    available: true,
    familyId: "calculadoras",
    primaryCategoryId: "trabalho-salario-beneficios",
    categoryIds: ["trabalho-salario-beneficios"],
    popularRank: 5,
    sitemapPriority: 0.82,
    stateMode: "query",
    seoApplicationCategory: "FinanceApplication",
  },
  {
    id: "decimo-terceiro",
    title: "Calculadora de Décimo Terceiro",
    description: "Estime 13º salário bruto e líquido, avos proporcionais, parcelas e descontos de INSS/IRRF.",
    href: "/calculadoras/decimo-terceiro",
    icon: CalendarRange,
    available: true,
    familyId: "calculadoras",
    primaryCategoryId: "trabalho-salario-beneficios",
    categoryIds: ["trabalho-salario-beneficios"],
    popularRank: 7,
    sitemapPriority: 0.8,
    stateMode: "query",
    seoApplicationCategory: "FinanceApplication",
  },
  {
    id: "seguro-desemprego",
    title: "Calculadora de Seguro-Desemprego",
    description: "Estime parcelas do seguro-desemprego formal com tabela MTE 2026 e avisos de elegibilidade.",
    href: "/calculadoras/seguro-desemprego",
    icon: BriefcaseBusiness,
    available: true,
    familyId: "calculadoras",
    primaryCategoryId: "trabalho-salario-beneficios",
    categoryIds: ["trabalho-salario-beneficios"],
    popularRank: 8,
    sitemapPriority: 0.8,
    stateMode: "query",
    seoApplicationCategory: "FinanceApplication",
  },
  {
    id: "financiamento",
    title: "Calculadora de Financiamento",
    description: "Calcule suas parcelas usando os sistemas SAC ou PRICE. Visualize a tabela de amortização completa.",
    href: "/calculadoras/financiamento",
    icon: Home,
    available: true,
    familyId: "calculadoras",
    primaryCategoryId: "financiamento-credito",
    categoryIds: ["financiamento-credito", "moradia-patrimonio"],
    popularRank: 1,
    sitemapPriority: 0.9,
    stateMode: "query",
    seoApplicationCategory: "FinanceApplication",
  },
  {
    id: "consorcio",
    title: "Calculadora de Consórcio",
    description: "Simule as parcelas do seu consórcio com correção anual por INCC/IPCA.",
    href: "/calculadoras/consorcio",
    icon: Users,
    available: true,
    familyId: "calculadoras",
    primaryCategoryId: "financiamento-credito",
    categoryIds: ["financiamento-credito"],
    popularRank: 6,
    sitemapPriority: 0.75,
    stateMode: "query",
    seoApplicationCategory: "FinanceApplication",
  },
  {
    id: "comparativo",
    title: "Financiamento vs Consórcio",
    description: "Compare financiamento e consórcio lado a lado. Veja qual opção deixa mais dinheiro no seu bolso.",
    href: "/calculadoras/comparativo",
    icon: Scale,
    available: true,
    familyId: "calculadoras",
    primaryCategoryId: "financiamento-credito",
    categoryIds: ["financiamento-credito", "moradia-patrimonio"],
    sitemapPriority: 0.75,
    stateMode: "query",
    seoApplicationCategory: "FinanceApplication",
  },
  {
    id: "alugar-vs-comprar",
    title: "Alugar vs Comprar",
    description: "Compare se é melhor comprar um imóvel financiado ou alugar e investir a diferença.",
    href: "/calculadoras/alugar-vs-comprar",
    icon: Home,
    available: true,
    familyId: "calculadoras",
    primaryCategoryId: "moradia-patrimonio",
    categoryIds: ["moradia-patrimonio"],
    sitemapPriority: 0.75,
    stateMode: "query",
    seoApplicationCategory: "FinanceApplication",
  },
  {
    id: "tir",
    title: "Calculadora de TIR",
    description: "Calcule a Taxa Interna de Retorno de uma série de fluxos de caixa.",
    href: "/calculadoras/tir",
    icon: LineChart,
    available: true,
    familyId: "calculadoras",
    primaryCategoryId: "investimentos-rendimentos",
    categoryIds: ["investimentos-rendimentos"],
    sitemapPriority: 0.75,
    stateMode: "query",
    seoApplicationCategory: "FinanceApplication",
  },
  {
    id: "juros-compostos",
    title: "Juros Compostos",
    description: "Calcule o rendimento dos seus investimentos com juros compostos ao longo do tempo.",
    href: "/calculadoras/juros-compostos",
    icon: TrendingUp,
    available: true,
    familyId: "calculadoras",
    primaryCategoryId: "investimentos-rendimentos",
    categoryIds: ["investimentos-rendimentos"],
    popularRank: 2,
    sitemapPriority: 0.8,
    stateMode: "query",
    seoApplicationCategory: "FinanceApplication",
  },
  {
    id: "renda-fixa",
    title: "Comparador de Renda Fixa",
    description: "Compare investimentos de renda fixa (Pré, CDI, IPCA+, Selic) líquidos de IR/IOF e inflação.",
    href: "/calculadoras/renda-fixa",
    icon: BarChart3,
    available: true,
    familyId: "calculadoras",
    primaryCategoryId: "investimentos-rendimentos",
    categoryIds: ["investimentos-rendimentos"],
    popularRank: 4,
    sitemapPriority: 0.8,
    stateMode: "query",
    seoApplicationCategory: "FinanceApplication",
  },
  {
    id: "investimento",
    title: "Calculadora de Investimento",
    description: "Simule projeção, aporte mensal necessário e tempo até uma meta com rentabilidade editável.",
    href: "/calculadoras/investimento",
    icon: TrendingUp,
    available: true,
    familyId: "calculadoras",
    primaryCategoryId: "investimentos-rendimentos",
    categoryIds: ["investimentos-rendimentos"],
    sitemapPriority: 0.78,
    stateMode: "query",
    seoApplicationCategory: "FinanceApplication",
  },
  {
    id: "senha",
    title: "Gerador de Senha",
    description: "Crie senhas fortes com tamanho, letras, números e símbolos configuráveis.",
    href: "/geradores/senha",
    icon: KeyRound,
    available: true,
    familyId: "geradores",
    primaryCategoryId: "seguranca",
    categoryIds: ["seguranca"],
    popularRank: 3,
    recentRank: 1,
    sitemapPriority: 0.78,
    stateMode: "query",
    seoApplicationCategory: "SecurityApplication",
  },
  {
    id: "qr-code",
    title: "Gerador de QR Code",
    description: "Crie QR codes para links, textos, Wi-Fi e Pix no navegador.",
    href: "/geradores/qr-code",
    icon: QrCode,
    available: true,
    familyId: "geradores",
    primaryCategoryId: "codigos-links",
    categoryIds: ["codigos-links"],
    popularRank: 1,
    sitemapPriority: 0.8,
    stateMode: "query",
    seoApplicationCategory: "UtilityApplication",
  },
  {
    id: "contador-caracteres",
    title: "Contador de Caracteres",
    description: "Conte caracteres, palavras, linhas, parágrafos e bytes no navegador.",
    href: "/texto/contador-caracteres",
    icon: FileText,
    available: true,
    familyId: "texto",
    primaryCategoryId: "contagem-texto",
    categoryIds: ["contagem-texto"],
    popularRank: 2,
    sitemapPriority: 0.8,
    stateMode: "query",
    seoApplicationCategory: "UtilityApplication",
  },
  {
    id: "conversor-maiusculas",
    title: "Conversor de Maiúsculas e Minúsculas",
    description: "Converta texto para maiúsculas, minúsculas, frase, título e capitalização no navegador.",
    href: "/texto/conversor-maiusculas",
    icon: FileText,
    available: true,
    familyId: "texto",
    primaryCategoryId: "transformacao-texto",
    categoryIds: ["transformacao-texto"],
    sitemapPriority: 0.78,
    stateMode: "query",
    seoApplicationCategory: "UtilityApplication",
  },
  {
    id: "formatador-json",
    title: "Formatador de JSON",
    description: "Formate, valide e minifique JSON no navegador sem enviar o conteúdo para o servidor.",
    href: "/dev/formatador-json",
    icon: Braces,
    available: true,
    familyId: "dev",
    primaryCategoryId: "dados-estruturados",
    categoryIds: ["dados-estruturados"],
    popularRank: 3,
    sitemapPriority: 0.8,
    stateMode: "query",
    seoApplicationCategory: "DeveloperApplication",
  },
  {
    id: "conversor-base64",
    title: "Conversor Base64",
    description: "Codifique e decodifique Base64 e Base64URL no navegador com suporte a UTF-8.",
    href: "/dev/conversor-base64",
    icon: Code2,
    available: true,
    familyId: "dev",
    primaryCategoryId: "codificacao",
    categoryIds: ["codificacao"],
    sitemapPriority: 0.78,
    stateMode: "query",
    seoApplicationCategory: "DeveloperApplication",
  },
  {
    id: "numeros-aleatorios",
    title: "Gerador de Números Aleatórios",
    description: "Gere um ou vários números aleatórios dentro de um intervalo definido.",
    href: "/geradores/numeros-aleatorios",
    icon: Shuffle,
    available: true,
    familyId: "geradores",
    primaryCategoryId: "aleatorios",
    categoryIds: ["aleatorios"],
    recentRank: 2,
    sitemapPriority: 0.72,
    stateMode: "query",
    seoApplicationCategory: "UtilityApplication",
  },
  {
    id: "sorteador-nomes",
    title: "Sorteador de Nomes",
    description: "Cole uma lista de nomes e sorteie vencedores ou embaralhe a ordem no navegador.",
    href: "/geradores/sorteador-nomes",
    icon: Users,
    available: true,
    familyId: "geradores",
    primaryCategoryId: "aleatorios",
    categoryIds: ["aleatorios"],
    recentRank: 8,
    sitemapPriority: 0.74,
    stateMode: "query",
    seoApplicationCategory: "UtilityApplication",
  },
  {
    id: "cpf",
    title: "Validador de CPF",
    description: "Confira se um CPF tem dígitos verificadores válidos.",
    href: "/validadores/cpf",
    icon: BadgeCheck,
    available: true,
    familyId: "validadores",
    primaryCategoryId: "documentos",
    categoryIds: ["documentos"],
    popularRank: 5,
    recentRank: 3,
    sitemapPriority: 0.78,
    stateMode: "query",
    seoApplicationCategory: "UtilityApplication",
  },
  {
    id: "cnpj",
    title: "Validador de CNPJ",
    description: "Confira se um CNPJ tem dígitos verificadores válidos.",
    href: "/validadores/cnpj",
    icon: Building2,
    available: true,
    familyId: "validadores",
    primaryCategoryId: "documentos",
    categoryIds: ["documentos"],
    recentRank: 4,
    sitemapPriority: 0.76,
    stateMode: "query",
    seoApplicationCategory: "UtilityApplication",
  },
  {
    id: "validador-email",
    title: "Validador de Email",
    description: "Valide a sintaxe de um email no navegador, sem verificar DNS, MX ou caixa postal.",
    href: "/validadores/validador-email",
    icon: Mail,
    available: true,
    familyId: "validadores",
    primaryCategoryId: "contato",
    categoryIds: ["contato"],
    recentRank: 9,
    sitemapPriority: 0.74,
    stateMode: "query",
    seoApplicationCategory: "UtilityApplication",
  },
  {
    id: "porcentagem",
    title: "Calculadora de Porcentagem",
    description: "Calcule percentuais, aumentos, descontos e variações de forma rápida.",
    href: "/matematica/porcentagem",
    icon: Percent,
    available: true,
    familyId: "matematica",
    primaryCategoryId: "matematica-basica",
    categoryIds: ["matematica-basica"],
    recentRank: 5,
    sitemapPriority: 0.74,
    stateMode: "query",
    seoApplicationCategory: "CalculatorApplication",
  },
  {
    id: "regra-de-tres",
    title: "Regra de Três",
    description: "Resolva proporções diretas com uma calculadora simples de regra de três.",
    href: "/matematica/regra-de-tres",
    icon: Sigma,
    available: true,
    familyId: "matematica",
    primaryCategoryId: "matematica-basica",
    categoryIds: ["matematica-basica"],
    recentRank: 6,
    sitemapPriority: 0.72,
    stateMode: "query",
    seoApplicationCategory: "CalculatorApplication",
  },
  {
    id: "contador-de-dias",
    title: "Contador de Dias",
    description: "Conte dias entre duas datas e veja a diferença em semanas e meses aproximados.",
    href: "/datas/contador-de-dias",
    icon: CalendarRange,
    available: true,
    familyId: "datas",
    primaryCategoryId: "datas-periodos",
    categoryIds: ["datas-periodos"],
    recentRank: 7,
    sitemapPriority: 0.72,
    stateMode: "query",
    seoApplicationCategory: "UtilityApplication",
  },
];

function isCalculatorTool(tool: ToolDefinition): tool is CalculatorDefinition {
  return tool.familyId === "calculadoras";
}

function isCalculatorCategory(category: ToolCategoryDefinition): category is CalculatorCategoryDefinition {
  return category.familyId === "calculadoras";
}

export const calculatorCategories = toolCategories.filter(isCalculatorCategory);
export const calculators = tools.filter(isCalculatorTool);

export function getAvailableTools() {
  return tools.filter((tool) => tool.available);
}

export function getPopularTools() {
  return getAvailableTools()
    .filter((tool) => typeof tool.popularRank === "number")
    .sort((a, b) => (a.popularRank ?? Number.MAX_SAFE_INTEGER) - (b.popularRank ?? Number.MAX_SAFE_INTEGER));
}

export function getRecentTools() {
  return getAvailableTools()
    .filter((tool) => typeof tool.recentRank === "number")
    .sort((a, b) => (a.recentRank ?? Number.MAX_SAFE_INTEGER) - (b.recentRank ?? Number.MAX_SAFE_INTEGER));
}

export function getToolById(toolId: string) {
  return tools.find((tool) => tool.id === toolId);
}

export function getToolFamilyById(familyId: ToolFamilyId) {
  return toolFamilies.find((family) => family.id === familyId);
}

export function getToolFamilyBySlug(familySlug: string) {
  return toolFamilies.find((family) => family.slug === familySlug);
}

export function getToolCategoryById(categoryId: ToolCategoryId) {
  return toolCategories.find((category) => category.id === categoryId);
}

export function getToolCategoryBySlug(familyId: ToolFamilyId, categorySlug: string) {
  return toolCategories.find((category) => category.familyId === familyId && category.slug === categorySlug);
}

export function getToolCategoriesByFamily(familyId: ToolFamilyId) {
  return toolCategories.filter((category) => category.familyId === familyId);
}

export function getToolsByFamily(familyId: ToolFamilyId) {
  return getAvailableTools().filter((tool) => tool.familyId === familyId);
}

export function getPrimaryToolsByFamily(familyId: ToolFamilyId) {
  return getAvailableTools().filter((tool) => tool.familyId === familyId);
}

export function getToolsByCategory(categoryId: ToolCategoryId) {
  return getAvailableTools().filter((tool) => tool.categoryIds.includes(categoryId));
}

export function getPrimaryToolsByCategory(categoryId: ToolCategoryId) {
  return getAvailableTools().filter((tool) => tool.primaryCategoryId === categoryId);
}

export function getVisibleToolFamilies() {
  return toolFamilies.filter((family) => getToolsByFamily(family.id).length > 0);
}

export function getVisibleToolCategories(familyId?: ToolFamilyId) {
  return toolCategories.filter(
    (category) =>
      (!familyId || category.familyId === familyId) &&
      getToolsByCategory(category.id).some((tool) => tool.familyId === category.familyId)
  );
}

export function getToolPrimaryCategory(toolId: string) {
  const tool = getToolById(toolId);
  const category = tool ? getToolCategoryById(tool.primaryCategoryId) : undefined;

  if (!tool || !category || category.familyId !== tool.familyId) {
    throw new Error(`Tool "${toolId}" does not have a valid primary category.`);
  }

  return category;
}

export function getToolFamilyForTool(toolId: string) {
  const tool = getToolById(toolId);
  const family = tool ? getToolFamilyById(tool.familyId) : undefined;

  if (!tool || !family) {
    throw new Error(`Tool "${toolId}" does not have a valid family.`);
  }

  return family;
}

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
  description:
    "Ferramentas gratuitas para cálculos, geradores, validadores, matemática, datas e decisões financeiras.",
};

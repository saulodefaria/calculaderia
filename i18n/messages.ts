import { cache } from "react";
import { getToolById, tools as toolDefinitions } from "@/lib/constants";
import { routing } from "./routing";

type AppLocale = (typeof routing.locales)[number];
type MessageTree = Record<string, unknown>;

const calculatorIds = toolDefinitions.filter((tool) => tool.familyId === "calculadoras").map((tool) => tool.id);
const toolIds = toolDefinitions.filter((tool) => tool.familyId !== "calculadoras").map((tool) => tool.id);

const guideIds = [
  "comoUsar",
  "financiamentoVsConsorcio",
  "index",
  "jurosCompostos",
  "rendaFixa",
  "sacVsPrice",
  "tir",
] as const;

const institutionalIds = ["about", "contact", "disclaimer", "privacy", "terms"] as const;

function normalizeLocale(locale: string): AppLocale {
  return routing.locales.includes(locale as AppLocale) ? (locale as AppLocale) : routing.defaultLocale;
}

async function importMessagesFile(locale: AppLocale, filePath: string): Promise<MessageTree> {
  return (await import(`../messages/${locale}/${filePath}.json`)).default;
}

async function importNestedMessages<const TId extends string>(
  locale: AppLocale,
  directory: string,
  ids: readonly TId[]
): Promise<Record<TId, MessageTree>> {
  const entries = await Promise.all(
    ids.map(async (id) => [id, await importMessagesFile(locale, `${directory}/${id}`)] as const)
  );

  return Object.fromEntries(entries) as Record<TId, MessageTree>;
}

async function importCatalogMessages(locale: AppLocale) {
  const [calculators, tools] = await Promise.all([
    importMessagesFile(locale, "catalog/calculators"),
    importMessagesFile(locale, "catalog/tools"),
  ]);

  return { calculators, tools };
}

async function importBaseClientMessages(locale: AppLocale) {
  const [common, shell, directories, support, catalog] = await Promise.all([
    importMessagesFile(locale, "common"),
    importMessagesFile(locale, "shell"),
    importMessagesFile(locale, "directories"),
    importMessagesFile(locale, "support"),
    importCatalogMessages(locale),
  ]);

  return {
    common,
    ...shell,
    ...directories,
    support,
    ...catalog,
  };
}

const getBaseClientMessages = cache(async (locale: AppLocale) => importBaseClientMessages(locale));

export const getRootClientMessages = cache(async (locale: string) => {
  return getBaseClientMessages(normalizeLocale(locale));
});

export const getToolClientMessages = cache(async (locale: string, toolId: string) => {
  const appLocale = normalizeLocale(locale);
  const tool = getToolById(toolId);

  if (!tool) {
    throw new Error(`Unknown tool id: ${toolId}`);
  }

  const rootMessages = await getBaseClientMessages(appLocale);
  const collection = tool.familyId === "calculadoras" ? "calculators" : "tools";
  const detailMessages = await importMessagesFile(appLocale, `${collection}/${toolId}`);

  return {
    ...rootMessages,
    [collection]: {
      ...(rootMessages[collection] as MessageTree),
      [toolId]: detailMessages,
    },
  };
});

export const getAllMessages = cache(async (locale: string) => {
  const appLocale = normalizeLocale(locale);
  const [baseMessages, institutional, guides, calculators, tools] = await Promise.all([
    getBaseClientMessages(appLocale),
    importNestedMessages(appLocale, "institutional", institutionalIds),
    importNestedMessages(appLocale, "guides", guideIds),
    importNestedMessages(appLocale, "calculators", calculatorIds),
    importNestedMessages(appLocale, "tools", toolIds),
  ]);

  return {
    ...baseMessages,
    institutional,
    guides,
    calculators: {
      ...(baseMessages.calculators as MessageTree),
      ...calculators,
    },
    tools: {
      ...(baseMessages.tools as MessageTree),
      ...tools,
    },
  };
});

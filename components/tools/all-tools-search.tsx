"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolCard } from "@/components/tools/tool-card";
import {
  getAvailableTools,
  getToolsByFamily,
  getVisibleToolCategories,
  getVisibleToolFamilies,
  type ToolCategoryDefinition,
  type ToolCategoryId,
  type ToolDefinition,
  type ToolFamilyDefinition,
  type ToolFamilyId,
} from "@/lib/constants";
import { cn } from "@/lib/utils/index";

type ToolSearchItem = {
  tool: ToolDefinition;
  title: string;
  description: string;
  familyTitle: string;
  categoryTitles: string[];
  searchText: string;
};

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

function FilterChip({
  active,
  children,
  testId,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  testId: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      data-testid={testId}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center justify-center rounded-full border px-3 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
        active
          ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
          : "border-border bg-background text-muted-foreground hover:border-emerald-300 hover:text-foreground"
      )}>
      {children}
    </button>
  );
}

export function AllToolsSearch() {
  const locale = useLocale();
  const t = useTranslations("toolDirectory");
  const tTools = useTranslations("tools");
  const tCalculators = useTranslations("calculators");
  const tFamilies = useTranslations("toolFamilies");
  const tCategories = useTranslations("toolCategories");

  const [query, setQuery] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<ToolFamilyId | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ToolCategoryId | null>(null);

  const families = useMemo(() => getVisibleToolFamilies(), []);
  const categoryOptions = useMemo(
    () => (selectedFamily ? getVisibleToolCategories(selectedFamily) : []),
    [selectedFamily]
  );

  const items = useMemo<ToolSearchItem[]>(() => {
    return getAvailableTools()
      .map((tool) => {
        const toolT = tool.familyId === "calculadoras" ? tCalculators : tTools;
        const title = toolT(`${tool.id}.title`);
        const description = toolT(`${tool.id}.description`);
        const familyTitle = tFamilies(`${tool.familyId}.title`);
        const categoryTitles = tool.categoryIds.map((categoryId) => tCategories(`${categoryId}.title`));
        const searchText = normalizeSearchText(
          [tool.id, tool.href, title, description, familyTitle, ...categoryTitles].join(" ")
        );

        return {
          tool,
          title,
          description,
          familyTitle,
          categoryTitles,
          searchText,
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title, locale, { sensitivity: "base" }));
  }, [locale, tCalculators, tCategories, tFamilies, tTools]);

  const normalizedQuery = normalizeSearchText(query.trim());
  const filteredItems = items.filter((item) => {
    if (selectedFamily && item.tool.familyId !== selectedFamily) return false;
    if (selectedCategory && !item.tool.categoryIds.includes(selectedCategory)) return false;
    if (normalizedQuery && !item.searchText.includes(normalizedQuery)) return false;

    return true;
  });

  const hasFilters = query.trim().length > 0 || selectedFamily !== null || selectedCategory !== null;

  const resetFilters = () => {
    setQuery("");
    setSelectedFamily(null);
    setSelectedCategory(null);
  };

  const selectFamily = (familyId: ToolFamilyId | null) => {
    setSelectedFamily(familyId);
    setSelectedCategory(null);
  };

  const getFamilyCount = (family: ToolFamilyDefinition) => getToolsByFamily(family.id).length;

  const getCategoryCount = (category: ToolCategoryDefinition) =>
    getAvailableTools().filter((tool) => tool.familyId === selectedFamily && tool.categoryIds.includes(category.id)).length;

  return (
    <section aria-labelledby="todas-ferramentas" className="scroll-mt-20">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="todas-ferramentas" className="text-2xl font-semibold tracking-tight">
            {t("allToolsTitle")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground" data-testid="tools-result-count">
            {t("resultCount", { count: filteredItems.length, total: items.length })}
          </p>
        </div>
        {hasFilters ? (
          <Button type="button" variant="outline" size="sm" onClick={resetFilters} data-testid="tools-clear-filters">
            <X className="h-4 w-4" />
            {t("clearFilters")}
          </Button>
        ) : null}
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-xs">
        <div className="space-y-2">
          <label htmlFor="tools-search" className="text-sm font-medium">
            {t("searchLabel")}
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="tools-search"
              data-testid="tools-search-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="pl-9"
            />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2" aria-label={t("familiesFilterLabel")}>
            <FilterChip
              active={selectedFamily === null}
              testId="tool-family-filter-all"
              onClick={() => selectFamily(null)}>
              {t("allFamilies")}
            </FilterChip>
            {families.map((family) => (
              <FilterChip
                key={family.id}
                active={selectedFamily === family.id}
                testId={`tool-family-filter-${family.slug}`}
                onClick={() => selectFamily(family.id)}>
                {tFamilies(`${family.id}.title`)} · {getFamilyCount(family)}
              </FilterChip>
            ))}
          </div>

          {selectedFamily ? (
            <div className="flex flex-wrap gap-2" aria-label={t("categoriesFilterLabel")}>
              <FilterChip
                active={selectedCategory === null}
                testId="tool-category-filter-all"
                onClick={() => setSelectedCategory(null)}>
                {t("allCategories")}
              </FilterChip>
              {categoryOptions.map((category) => (
                <FilterChip
                  key={category.id}
                  active={selectedCategory === category.id}
                  testId={`tool-category-filter-${category.slug}`}
                  onClick={() => setSelectedCategory(category.id)}>
                  {tCategories(`${category.id}.title`)} · {getCategoryCount(category)}
                </FilterChip>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {filteredItems.length > 0 ? (
        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          {filteredItems.map(({ tool }) => (
            <ToolCard key={tool.id} toolId={tool.id} showMeta />
          ))}
        </div>
      ) : (
        <div
          data-testid="tools-search-empty"
          className="mt-6 rounded-lg border border-dashed bg-muted/20 px-6 py-10 text-center">
          <h3 className="text-lg font-semibold">{t("emptyTitle")}</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t("emptyDescription")}</p>
          <Button type="button" variant="outline" size="sm" onClick={resetFilters} className="mt-5">
            {t("clearFilters")}
          </Button>
        </div>
      )}
    </section>
  );
}

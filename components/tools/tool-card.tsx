"use client";

import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/index";
import { getToolById, getToolFamilyById, getToolPrimaryCategory } from "@/lib/constants";

interface ToolCardProps {
  toolId: string;
  showMeta?: boolean;
  className?: string;
  testId?: string;
}

export function ToolCard({ toolId, showMeta = false, className, testId }: ToolCardProps) {
  const tool = getToolById(toolId);
  const tTools = useTranslations("tools");
  const tCalculators = useTranslations("calculators");
  const tFamilies = useTranslations("toolFamilies");
  const tCategories = useTranslations("toolCategories");

  if (!tool) return null;

  const Icon = tool.icon;
  const toolT = tool.familyId === "calculadoras" ? tCalculators : tTools;
  const title = toolT(`${tool.id}.title`);
  const description = toolT(`${tool.id}.description`);
  const family = getToolFamilyById(tool.familyId);
  const category = getToolPrimaryCategory(tool.id);

  return (
    <Link
      href={tool.href}
      data-testid={testId ?? `tool-card-${tool.id}`}
      aria-disabled={!tool.available}
      className={cn(
        "group flex h-full min-h-28 items-start gap-3 rounded-lg border bg-card p-4 text-left shadow-xs transition-all",
        "hover:border-emerald-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
        !tool.available && "pointer-events-none opacity-60",
        className
      )}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight transition-colors group-hover:text-emerald-600">
            {title}
          </h3>
          {showMeta && family ? (
            <span className="w-fit shrink-0 rounded-full border bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {tFamilies(`${family.id}.title`)}
            </span>
          ) : null}
        </div>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        {showMeta ? (
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border bg-background px-2.5 py-0.5 text-xs text-muted-foreground">
              {tCategories(`${category.id}.title`)}
            </span>
          </div>
        ) : null}
      </div>
      <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-emerald-600" />
    </Link>
  );
}

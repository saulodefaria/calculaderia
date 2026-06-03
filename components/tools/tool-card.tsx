"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/index";
import { getToolById } from "@/lib/constants";

interface ToolCardProps {
  toolId: string;
}

export function ToolCard({ toolId }: ToolCardProps) {
  const tool = getToolById(toolId);
  const t = useTranslations("toolCard");
  const tTools = useTranslations("tools");
  const tCalculators = useTranslations("calculators");

  if (!tool) return null;

  const Icon = tool.icon;
  const toolT = tool.familyId === "calculadoras" ? tCalculators : tTools;
  const title = toolT(`${tool.id}.title`);
  const description = toolT(`${tool.id}.description`);

  return (
    <Card className={cn("group relative overflow-hidden transition-all hover:shadow-lg", !tool.available && "opacity-60")}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            <Icon className="h-5 w-5" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
        {tool.available ? (
          <Button asChild className="w-full group-hover:bg-emerald-600">
            <Link href={tool.href}>
              {tool.familyId === "calculadoras" ? t("accessCalculator") : t("accessTool")}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        ) : (
          <Button disabled className="w-full">
            {t("comingSoon")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

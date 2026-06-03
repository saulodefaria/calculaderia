"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShareButton } from "@/components/ui/share-button";
import { generateRandomNumbers, type RandomNumberOptions } from "@/lib/tools/generators";
import { getInitialSearchParams, getShareUrlFromParams, replaceQueryString } from "@/components/tools/url-state";

function readInitialOptions(): RandomNumberOptions {
  const params = getInitialSearchParams();

  return {
    min: Number(params.get("min") ?? 1),
    max: Number(params.get("max") ?? 100),
    count: Number(params.get("quantidade") ?? 5),
    unique: params.get("unicos") === "1",
  };
}

function buildParams(options: RandomNumberOptions) {
  const params = new URLSearchParams();
  params.set("min", String(options.min));
  params.set("max", String(options.max));
  params.set("quantidade", String(options.count));
  if (options.unique) params.set("unicos", "1");
  return params;
}

export function RandomNumbersClient() {
  const t = useTranslations("tools.numeros-aleatorios.form");
  const [options, setOptions] = useState<RandomNumberOptions>(readInitialOptions);
  const [generation, setGeneration] = useState(0);
  const params = useMemo(() => buildParams(options), [options]);
  const numbers = useMemo(() => {
    void generation;
    return generateRandomNumbers(options);
  }, [options, generation]);

  const regenerate = () => {
    setGeneration((current) => current + 1);
  };

  useEffect(() => {
    replaceQueryString(params);
  }, [params]);

  const updateOption = (patch: Partial<RandomNumberOptions>) => {
    setOptions((current) => ({ ...current, ...patch }));
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="random-min">{t("min")}</Label>
            <Input
              id="random-min"
              type="number"
              value={options.min}
              onChange={(event) => updateOption({ min: Number(event.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="random-max">{t("max")}</Label>
            <Input
              id="random-max"
              type="number"
              value={options.max}
              onChange={(event) => updateOption({ max: Number(event.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="random-count">{t("count")}</Label>
            <Input
              id="random-count"
              type="number"
              min={1}
              max={500}
              value={options.count}
              onChange={(event) => updateOption({ count: Number(event.target.value) })}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={options.unique}
            onChange={(event) => updateOption({ unique: event.target.checked })}
          />
          {t("unique")}
        </label>

        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="mb-3 text-sm font-medium text-muted-foreground">{t("result")}</p>
          <div className="flex flex-wrap gap-2">
            {numbers.map((number, index) => (
              <span key={`${number}-${index}`} className="rounded-md bg-background px-3 py-1 font-mono text-sm">
                {number}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" onClick={regenerate} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {t("generate")}
          </Button>
          <ShareButton getShareUrl={() => getShareUrlFromParams(params)} />
        </div>
      </CardContent>
    </Card>
  );
}

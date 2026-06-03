"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShareButton } from "@/components/ui/share-button";
import {
  calculatePercentageApplied,
  calculatePercentageChange,
  calculatePercentageOf,
} from "@/lib/tools/math";
import { getInitialSearchParams, getShareUrlFromParams, replaceQueryString } from "@/components/tools/url-state";

function formatNumber(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "-";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 4 }).format(value);
}

function buildParams(values: { percentage: number; base: number; from: number; to: number }) {
  const params = new URLSearchParams();
  params.set("porcentagem", String(values.percentage));
  params.set("base", String(values.base));
  params.set("de", String(values.from));
  params.set("para", String(values.to));
  return params;
}

export function PercentageClient() {
  const t = useTranslations("tools.porcentagem.form");
  const initialParams = getInitialSearchParams();
  const [values, setValues] = useState({
    percentage: Number(initialParams.get("porcentagem") ?? 10),
    base: Number(initialParams.get("base") ?? 100),
    from: Number(initialParams.get("de") ?? 100),
    to: Number(initialParams.get("para") ?? 120),
  });
  const params = useMemo(() => buildParams(values), [values]);
  const percentageOf = calculatePercentageOf(values.percentage, values.base);
  const increased = calculatePercentageApplied(values.base, values.percentage, "increase");
  const decreased = calculatePercentageApplied(values.base, values.percentage, "decrease");
  const change = calculatePercentageChange(values.from, values.to);

  useEffect(() => {
    replaceQueryString(params);
  }, [params]);

  const updateValue = (key: keyof typeof values, value: number) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="percentage">{t("percentage")}</Label>
            <Input
              id="percentage"
              type="number"
              value={values.percentage}
              onChange={(event) => updateValue("percentage", Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="base">{t("base")}</Label>
            <Input
              id="base"
              type="number"
              value={values.base}
              onChange={(event) => updateValue("base", Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="from">{t("from")}</Label>
            <Input
              id="from"
              type="number"
              value={values.from}
              onChange={(event) => updateValue("from", Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to">{t("to")}</Label>
            <Input
              id="to"
              type="number"
              value={values.to}
              onChange={(event) => updateValue("to", Number(event.target.value))}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ResultCard label={t("percentageOf")} value={formatNumber(percentageOf)} />
          <ResultCard label={t("increase")} value={formatNumber(increased)} />
          <ResultCard label={t("decrease")} value={formatNumber(decreased)} />
          <ResultCard label={t("change")} value={change === null ? "-" : `${formatNumber(change)}%`} />
        </div>

        <ShareButton getShareUrl={() => getShareUrlFromParams(params)} />
      </CardContent>
    </Card>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-xl font-semibold">{value}</p>
    </div>
  );
}

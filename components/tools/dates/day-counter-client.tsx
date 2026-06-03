"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShareButton } from "@/components/ui/share-button";
import { countDaysBetween } from "@/lib/tools/dates";
import { getInitialSearchParams, getShareUrlFromParams, replaceQueryString } from "@/components/tools/url-state";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}

function buildParams(values: { start: string; end: string; inclusive: boolean }) {
  const params = new URLSearchParams();
  params.set("inicio", values.start);
  params.set("fim", values.end);
  if (values.inclusive) params.set("inclusivo", "1");
  return params;
}

export function DayCounterClient() {
  const t = useTranslations("tools.contador-de-dias.form");
  const initialParams = getInitialSearchParams();
  const [values, setValues] = useState({
    start: initialParams.get("inicio") ?? todayIso(),
    end: initialParams.get("fim") ?? addDaysIso(30),
    inclusive: initialParams.get("inclusivo") === "1",
  });
  const params = useMemo(() => buildParams(values), [values]);
  const result = countDaysBetween(values.start, values.end, values.inclusive);

  useEffect(() => {
    replaceQueryString(params);
  }, [params]);

  const updateValue = (patch: Partial<typeof values>) => {
    setValues((current) => ({ ...current, ...patch }));
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
            <Label htmlFor="start-date">{t("start")}</Label>
            <Input id="start-date" type="date" value={values.start} onChange={(event) => updateValue({ start: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">{t("end")}</Label>
            <Input id="end-date" type="date" value={values.end} onChange={(event) => updateValue({ end: event.target.value })} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={values.inclusive}
            onChange={(event) => updateValue({ inclusive: event.target.checked })}
          />
          {t("inclusive")}
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          <ResultCard label={t("days")} value={result ? String(result.days) : "-"} />
          <ResultCard label={t("weeks")} value={result ? formatNumber(result.weeks) : "-"} />
          <ResultCard label={t("months")} value={result ? formatNumber(result.monthsApprox) : "-"} />
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

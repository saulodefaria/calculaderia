"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShareButton } from "@/components/ui/share-button";
import { solveRuleOfThree } from "@/lib/tools/math";
import { getInitialSearchParams, getShareUrlFromParams, replaceQueryString } from "@/components/tools/url-state";

function formatNumber(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "-";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 }).format(value);
}

function buildParams(values: { a: number; b: number; c: number }) {
  const params = new URLSearchParams();
  params.set("a", String(values.a));
  params.set("b", String(values.b));
  params.set("c", String(values.c));
  return params;
}

export function RuleOfThreeClient() {
  const t = useTranslations("tools.regra-de-tres.form");
  const initialParams = getInitialSearchParams();
  const [values, setValues] = useState({
    a: Number(initialParams.get("a") ?? 2),
    b: Number(initialParams.get("b") ?? 10),
    c: Number(initialParams.get("c") ?? 5),
  });
  const params = useMemo(() => buildParams(values), [values]);
  const result = solveRuleOfThree(values.a, values.b, values.c);

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
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="rule-a">{t("a")}</Label>
            <Input
              id="rule-a"
              type="number"
              value={values.a}
              onChange={(event) => updateValue("a", Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rule-b">{t("b")}</Label>
            <Input
              id="rule-b"
              type="number"
              value={values.b}
              onChange={(event) => updateValue("b", Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rule-c">{t("c")}</Label>
            <Input
              id="rule-c"
              type="number"
              value={values.c}
              onChange={(event) => updateValue("c", Number(event.target.value))}
            />
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">{t("formula")}</p>
          <p className="mt-2 font-mono text-xl font-semibold">{formatNumber(result)}</p>
        </div>

        <ShareButton getShareUrl={() => getShareUrlFromParams(params)} />
      </CardContent>
    </Card>
  );
}

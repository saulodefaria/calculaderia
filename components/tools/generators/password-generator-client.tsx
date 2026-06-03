"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShareButton } from "@/components/ui/share-button";
import { generatePassword, type PasswordOptions } from "@/lib/tools/generators";
import { getInitialSearchParams, getShareUrlFromParams, replaceQueryString } from "@/components/tools/url-state";

function secureRandom() {
  if (typeof crypto === "undefined" || !crypto.getRandomValues) return Math.random();
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] / 2 ** 32;
}

function readInitialOptions(): PasswordOptions {
  const params = getInitialSearchParams();

  return {
    length: Number(params.get("tamanho") ?? 16),
    includeUppercase: params.get("maiusculas") !== "0",
    includeLowercase: params.get("minusculas") !== "0",
    includeNumbers: params.get("numeros") !== "0",
    includeSymbols: params.get("simbolos") !== "0",
  };
}

function buildParams(options: PasswordOptions) {
  const params = new URLSearchParams();
  params.set("tamanho", String(options.length));
  if (!options.includeUppercase) params.set("maiusculas", "0");
  if (!options.includeLowercase) params.set("minusculas", "0");
  if (!options.includeNumbers) params.set("numeros", "0");
  if (!options.includeSymbols) params.set("simbolos", "0");
  return params;
}

export function PasswordGeneratorClient() {
  const t = useTranslations("tools.senha.form");
  const [options, setOptions] = useState<PasswordOptions>(readInitialOptions);
  const [generation, setGeneration] = useState(0);
  const [copied, setCopied] = useState(false);
  const selectedPools = [
    options.includeUppercase,
    options.includeLowercase,
    options.includeNumbers,
    options.includeSymbols,
  ].filter(Boolean).length;

  const params = useMemo(() => buildParams(options), [options]);
  const password = useMemo(() => {
    void generation;
    return generatePassword(options, secureRandom);
  }, [options, generation]);

  const regenerate = () => {
    setGeneration((current) => current + 1);
  };

  useEffect(() => {
    replaceQueryString(params);
  }, [params]);

  const updateOption = (patch: Partial<PasswordOptions>) => {
    setOptions((current) => ({ ...current, ...patch }));
  };

  const handleCopy = async () => {
    if (!password) return;

    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            <Label htmlFor="password-length">{t("length")}</Label>
            <Input
              id="password-length"
              type="number"
              min={4}
              max={128}
              value={options.length}
              onChange={(event) => updateOption({ length: Number(event.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("sets")}</Label>
            <div className="grid gap-2 rounded-lg border p-3 text-sm">
              {[
                ["includeUppercase", "uppercase"],
                ["includeLowercase", "lowercase"],
                ["includeNumbers", "numbers"],
                ["includeSymbols", "symbols"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(options[key as keyof PasswordOptions])}
                    onChange={(event) => {
                      if (selectedPools === 1 && !event.target.checked) return;
                      updateOption({ [key]: event.target.checked } as Partial<PasswordOptions>);
                    }}
                  />
                  {t(label)}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="mb-2 text-sm font-medium text-muted-foreground">{t("result")}</p>
          <p className="break-all font-mono text-xl font-semibold">{password}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" onClick={regenerate} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {t("generate")}
          </Button>
          <Button type="button" variant="outline" onClick={handleCopy} className="gap-2">
            <Copy className="h-4 w-4" />
            {copied ? t("copied") : t("copy")}
          </Button>
          <ShareButton getShareUrl={() => getShareUrlFromParams(params)} />
        </div>
      </CardContent>
    </Card>
  );
}

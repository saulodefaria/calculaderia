"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShareButton } from "@/components/ui/share-button";
import { formatCnpj, formatCpf, onlyDigits, validateCnpj, validateCpf } from "@/lib/tools/documents";
import { getInitialSearchParams, getShareUrlFromParams, replaceQueryString } from "@/components/tools/url-state";

interface DocumentValidatorClientProps {
  kind: "cpf" | "cnpj";
}

function buildParams(value: string) {
  const params = new URLSearchParams();
  if (value) params.set("valor", onlyDigits(value));
  return params;
}

export function DocumentValidatorClient({ kind }: DocumentValidatorClientProps) {
  const t = useTranslations(`tools.${kind}.form`);
  const [value, setValue] = useState(() => getInitialSearchParams().get("valor") ?? "");
  const params = useMemo(() => buildParams(value), [value]);
  const digits = onlyDigits(value);
  const requiredLength = kind === "cpf" ? 11 : 14;
  const formattedValue = kind === "cpf" ? formatCpf(value) : formatCnpj(value);
  const isComplete = digits.length === requiredLength;
  const isValid = kind === "cpf" ? validateCpf(value) : validateCnpj(value);

  useEffect(() => {
    replaceQueryString(params);
  }, [params]);

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor={`${kind}-value`}>{t("value")}</Label>
          <Input
            id={`${kind}-value`}
            inputMode="numeric"
            value={formattedValue}
            onChange={(event) => setValue(event.target.value)}
            placeholder={t("placeholder")}
          />
        </div>

        <div className="rounded-lg border bg-muted/30 p-4">
          {!value ? (
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          ) : isComplete && isValid ? (
            <p className="flex items-center gap-2 font-medium text-emerald-600">
              <CheckCircle className="h-5 w-5" />
              {t("valid")}
            </p>
          ) : (
            <p className="flex items-center gap-2 font-medium text-red-600">
              <XCircle className="h-5 w-5" />
              {isComplete ? t("invalid") : t("incomplete")}
            </p>
          )}
        </div>

        <ShareButton getShareUrl={() => getShareUrlFromParams(params)} />
      </CardContent>
    </Card>
  );
}

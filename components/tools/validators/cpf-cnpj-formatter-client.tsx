"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  CheckCircle,
  ClipboardCopy,
  Copy,
  Eraser,
  FileText,
  Info,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShareButton } from "@/components/ui/share-button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { replaceQueryString } from "@/components/tools/url-state";
import {
  buildCpfCnpjFormatterSearchParams,
  buildCpfCnpjFormatterShareUrl,
  formatCpfCnpjInput,
  readCpfCnpjFormatterContentFromFragment,
  readCpfCnpjFormatterStateFromParams,
  type CpfCnpjFormatterDocumentType,
  type CpfCnpjFormatterOutputMode,
  type CpfCnpjFormatterState,
  type CpfCnpjFormatterStatus,
  type CpfCnpjFormatterType,
} from "@/lib/tools/documents";
import { cn } from "@/lib/utils/index";

const typeIds = ["auto", "cpf", "cnpj"] as const;
const outputModeIds = ["mascara", "limpar"] as const;
const faqIds = ["privacy", "validation", "cpfMask", "cnpjMask", "alphanumericCnpj", "sharing"] as const;
const detailIds = ["formatting", "raw", "validation", "alphanumeric", "privacy"] as const;

const statusIcons: Record<CpfCnpjFormatterStatus, { icon: LucideIcon; className: string }> = {
  empty: { icon: FileText, className: "text-muted-foreground" },
  incomplete: { icon: Info, className: "text-sky-600" },
  complete: { icon: CheckCircle, className: "text-emerald-600" },
  attention: { icon: AlertTriangle, className: "text-amber-600" },
};

function getTypeLabel(
  t: ReturnType<typeof useTranslations>,
  selectedType: CpfCnpjFormatterDocumentType | null
) {
  return selectedType ? t(`types.${selectedType}`) : t("result.type.none");
}

export function CpfCnpjFormatterClient() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("tools.formatador-cpf-cnpj.form");
  const tFaq = useTranslations("tools.formatador-cpf-cnpj.faq");
  const hasReadContentFragment = useRef(false);
  const [state, setState] = useState<CpfCnpjFormatterState>(() =>
    readCpfCnpjFormatterStateFromParams(new URLSearchParams(searchParams.toString()))
  );
  const [includeContentInUrl, setIncludeContentInUrl] = useState(false);
  const [shareContentOmitted, setShareContentOmitted] = useState(false);
  const [copied, setCopied] = useState<"masked" | "raw" | null>(null);

  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const result = useMemo(() => formatCpfCnpjInput(state.entrada, state.tipo), [state.entrada, state.tipo]);
  const liveParams = useMemo(
    () =>
      buildCpfCnpjFormatterSearchParams({
        entrada: "",
        tipo: state.tipo,
        saida: state.saida,
      }).params,
    [state.saida, state.tipo]
  );
  const selectedTypeLabel = getTypeLabel(t, result.selectedType);
  const unitLabel = result.selectedType === "cpf" ? t("result.units.digits") : t("result.units.characters");
  const lengthSummary =
    result.requiredLength === null
      ? t("result.lengthEmpty")
      : t("result.lengthSummary", {
          count: numberFormatter.format(result.normalizedLength),
          target: numberFormatter.format(result.requiredLength),
          unit: unitLabel,
        });
  const primaryOutput = state.saida === "mascara" ? result.maskedValue : result.rawValue;
  const StatusIcon = statusIcons[result.status].icon;
  const statusDescription =
    result.status === "empty"
      ? t("result.emptyDescription")
      : result.status === "incomplete"
        ? t("result.incompleteDescription", {
            count: numberFormatter.format(result.usedLength),
            target: numberFormatter.format(result.requiredLength ?? 0),
            unit: unitLabel,
          })
        : result.status === "complete"
          ? t("result.completeDescription")
          : t("result.attentionDescription");

  useEffect(() => {
    if (hasReadContentFragment.current) return;

    hasReadContentFragment.current = true;
    const contentFragment = readCpfCnpjFormatterContentFromFragment(window.location.hash, {
      requestedType: state.tipo,
    });
    if (!contentFragment.hasExplicitContent) return;

    const timeoutId = window.setTimeout(() => {
      setState((current) => ({
        ...current,
        entrada: contentFragment.entrada,
      }));
      setIncludeContentInUrl(true);
      setShareContentOmitted(contentFragment.contentOmitted);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [state.tipo]);

  useEffect(() => {
    replaceQueryString(liveParams);
  }, [liveParams]);

  const updateState = (patch: Partial<CpfCnpjFormatterState>) => {
    setShareContentOmitted(false);
    setState((current) => ({
      ...current,
      ...patch,
    }));
  };

  const copyToClipboard = async (value: string, type: "masked" | "raw") => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div className="min-w-0 space-y-6">
              <section className="space-y-4 rounded-lg border p-4" aria-labelledby="cpf-cnpj-formatter-input-title">
                <div>
                  <h2 id="cpf-cnpj-formatter-input-title" className="font-semibold">
                    {t("input.title")}
                  </h2>
                  <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {t("input.privacy")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf-cnpj-formatter-input">{t("input.label")}</Label>
                  <Input
                    id="cpf-cnpj-formatter-input"
                    data-testid="cpf-cnpj-formatter-input"
                    type="text"
                    inputMode="text"
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck={false}
                    value={state.entrada}
                    onChange={(event) => updateState({ entrada: event.target.value })}
                    placeholder={t("input.placeholder")}
                    aria-invalid={result.status === "attention"}
                  />
                  <p className="text-xs text-muted-foreground">{t("input.hint")}</p>
                </div>

                <div className="space-y-2">
                  <Label>{t("types.label")}</Label>
                  <Tabs
                    value={state.tipo}
                    onValueChange={(value) => updateState({ tipo: value as CpfCnpjFormatterType })}
                    data-testid="cpf-cnpj-formatter-type-selector">
                    <TabsList className="grid h-auto w-full grid-cols-3">
                      {typeIds.map((typeId) => (
                        <TabsTrigger
                          key={typeId}
                          value={typeId}
                          data-testid={`cpf-cnpj-formatter-type-${typeId}`}>
                          {t(`types.${typeId}`)}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>

                <div className="space-y-2">
                  <Label>{t("output.label")}</Label>
                  <Tabs
                    value={state.saida}
                    onValueChange={(value) => updateState({ saida: value as CpfCnpjFormatterOutputMode })}
                    data-testid="cpf-cnpj-formatter-output-selector">
                    <TabsList className="grid h-auto w-full grid-cols-2">
                      {outputModeIds.map((modeId) => (
                        <TabsTrigger
                          key={modeId}
                          value={modeId}
                          data-testid={`cpf-cnpj-formatter-output-${modeId}`}>
                          {t(`output.${modeId}`)}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                  <p className="text-xs text-muted-foreground">{t("output.hint")}</p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => updateState({ entrada: "" })}
                  disabled={!state.entrada}
                  data-testid="cpf-cnpj-formatter-clear">
                  <Eraser className="h-4 w-4" />
                  {t("actions.clear")}
                </Button>
              </section>

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="cpf-cnpj-formatter-share-title">
                <div>
                  <h2 id="cpf-cnpj-formatter-share-title" className="font-semibold">
                    {t("share.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("share.description")}</p>
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    id="cpf-cnpj-formatter-include-content"
                    data-testid="cpf-cnpj-formatter-include-content"
                    type="checkbox"
                    checked={includeContentInUrl}
                    onChange={(event) => {
                      setShareContentOmitted(false);
                      setIncludeContentInUrl(event.target.checked);
                    }}
                    className="mt-1"
                  />
                  <span>{t("share.includeContent")}</span>
                </label>
                <p
                  className={cn(
                    "text-sm",
                    includeContentInUrl || shareContentOmitted
                      ? "text-amber-700 dark:text-amber-400"
                      : "text-muted-foreground"
                  )}>
                  {shareContentOmitted
                    ? t("share.tooLong")
                    : includeContentInUrl
                      ? t("share.publicWarning")
                      : t("share.safe")}
                </p>
                <div data-testid="cpf-cnpj-formatter-share-button">
                  <ShareButton
                    className="w-full sm:w-auto"
                    getShareUrl={() => {
                      const shareUrl = buildCpfCnpjFormatterShareUrl(
                        `${window.location.origin}${window.location.pathname}`,
                        state,
                        { includeContent: includeContentInUrl }
                      );
                      setShareContentOmitted(shareUrl.contentOmitted);

                      return shareUrl.url;
                    }}
                  />
                </div>
              </section>

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="cpf-cnpj-formatter-details-title">
                <div>
                  <h2 id="cpf-cnpj-formatter-details-title" className="font-semibold">
                    {t("details.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("details.description")}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {detailIds.map((detailId) => (
                    <div key={detailId} className="rounded-lg border bg-muted/30 p-3">
                      <p className="text-sm font-medium">{t(`details.items.${detailId}.title`)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{t(`details.items.${detailId}.description`)}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside
              className="min-w-0 space-y-5 rounded-lg border bg-muted/30 p-4"
              aria-labelledby="cpf-cnpj-formatter-result-title">
              <div>
                <h2 id="cpf-cnpj-formatter-result-title" className="font-semibold">
                  {t("result.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("result.description")}</p>
              </div>

              <div
                data-testid="cpf-cnpj-formatter-status"
                aria-live="polite"
                className={cn(
                  "rounded-lg border bg-background p-4",
                  result.status === "complete" ? "border-emerald-200" : "",
                  result.status === "attention" ? "border-amber-300" : ""
                )}>
                <div className="flex items-start gap-3">
                  <StatusIcon className={cn("mt-0.5 h-5 w-5 shrink-0", statusIcons[result.status].className)} />
                  <div className="min-w-0">
                    <p className="font-medium">{t(`result.status.${result.status}`)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{statusDescription}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border bg-background p-3">
                  <p className="text-xs font-medium uppercase text-muted-foreground">{t("result.detectedType")}</p>
                  <p data-testid="cpf-cnpj-formatter-detected-type" className="mt-1 font-medium">
                    {selectedTypeLabel}
                  </p>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <p className="text-xs font-medium uppercase text-muted-foreground">{t("result.lengthLabel")}</p>
                  <p data-testid="cpf-cnpj-formatter-length" className="mt-1 font-medium">
                    {lengthSummary}
                  </p>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border bg-background p-4">
                <p className="text-sm font-medium">{t("result.primaryOutput")}</p>
                <p
                  data-testid="cpf-cnpj-formatter-primary-output"
                  className="min-h-10 break-all rounded-md bg-muted px-3 py-2 font-mono text-sm">
                  {primaryOutput || t("result.emptyValue")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {state.saida === "mascara" ? t("result.primaryMaskedHint") : t("result.primaryRawHint")}
                </p>
              </div>

              <div className="grid gap-3">
                <div className="space-y-2 rounded-lg border bg-background p-4">
                  <p className="text-sm font-medium">{t("result.maskedLabel")}</p>
                  <p
                    data-testid="cpf-cnpj-formatter-masked-output"
                    className="min-h-10 break-all rounded-md bg-muted px-3 py-2 font-mono text-sm">
                    {result.maskedValue || t("result.emptyValue")}
                  </p>
                </div>
                <div className="space-y-2 rounded-lg border bg-background p-4">
                  <p className="text-sm font-medium">{t("result.rawLabel")}</p>
                  <p
                    data-testid="cpf-cnpj-formatter-raw-output"
                    className="min-h-10 break-all rounded-md bg-muted px-3 py-2 font-mono text-sm">
                    {result.rawValue || t("result.emptyValue")}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border bg-background p-4">
                <p className="font-medium">{t("issues.title")}</p>
                <ul data-testid="cpf-cnpj-formatter-issues" className="mt-3 space-y-2">
                  {result.issues.length === 0 ? (
                    <li className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      {t("issues.none")}
                    </li>
                  ) : (
                    result.issues.map((issue) => (
                      <li key={issue.code} className="flex min-w-0 items-start gap-2 text-sm text-muted-foreground">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        <span className="min-w-0 break-words">
                          {t(`issues.${issue.code}`, {
                            characters: issue.characters ?? "",
                            value: issue.value ?? "",
                            count: numberFormatter.format(issue.count ?? 0),
                          })}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(result.maskedValue, "masked")}
                  disabled={!result.maskedValue}
                  data-testid="cpf-cnpj-formatter-copy-masked">
                  {copied === "masked" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "masked" ? t("actions.copied") : t("actions.copyMasked")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(result.rawValue, "raw")}
                  disabled={!result.rawValue}
                  data-testid="cpf-cnpj-formatter-copy-raw">
                  {copied === "raw" ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                  {copied === "raw" ? t("actions.copied") : t("actions.copyRaw")}
                </Button>
              </div>

              <div className="space-y-3 rounded-lg border bg-background p-4">
                <p className="flex items-start gap-2 text-sm text-muted-foreground">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                  {t("result.formatOnly")}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/validadores/cpf" data-testid="cpf-cnpj-formatter-related-cpf">
                      {t("related.cpf")}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/validadores/cnpj" data-testid="cpf-cnpj-formatter-related-cnpj">
                      {t("related.cnpj")}
                    </Link>
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tFaq("title")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {faqIds.map((faqId) => (
            <section key={faqId} className="rounded-lg border p-4">
              <h2 className="font-semibold">{tFaq(`${faqId}.question`)}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{tFaq(`${faqId}.answer`)}</p>
            </section>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  BadgeCheck,
  Car,
  Check,
  CheckCircle,
  ClipboardCopy,
  Copy,
  Info,
  ShieldCheck,
  Trash2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShareButton } from "@/components/ui/share-button";
import { replaceQueryString } from "@/components/tools/url-state";
import {
  buildBrazilianPlateValidatorSearchParams,
  buildBrazilianPlateValidatorShareUrl,
  defaultBrazilianPlateValidatorState,
  formatBrazilianPlate,
  readBrazilianPlateContentFromFragment,
  readBrazilianPlateValidatorStateFromParams,
  validateBrazilianPlate,
  type BrazilianPlateDiagnosticStatus,
  type BrazilianPlateIssueCode,
  type BrazilianPlateMode,
  type BrazilianPlateStatus,
  type BrazilianPlateValidatorState,
} from "@/lib/tools/license-plate";
import { cn } from "@/lib/utils/index";

const faqIds = ["officialLookup", "existence", "format", "conversion", "oldEquivalent", "privacy", "sharing"] as const;
const detailIds = ["formats", "conversion", "noLookup", "privacy"] as const;
const modeOptions: BrazilianPlateMode[] = ["auto", "mercosul", "antiga"];

const statusIcons: Record<BrazilianPlateStatus, { icon: LucideIcon; className: string }> = {
  empty: { icon: Car, className: "text-muted-foreground" },
  validMercosul: { icon: CheckCircle, className: "text-emerald-600" },
  validAntiga: { icon: CheckCircle, className: "text-emerald-600" },
  invalid: { icon: XCircle, className: "text-red-600" },
  incomplete: { icon: AlertTriangle, className: "text-amber-600" },
  attention: { icon: AlertTriangle, className: "text-amber-600" },
};

const diagnosticIcons: Record<BrazilianPlateDiagnosticStatus, { icon: LucideIcon; className: string }> = {
  pass: { icon: CheckCircle, className: "text-emerald-600" },
  fail: { icon: XCircle, className: "text-red-600" },
  warn: { icon: AlertTriangle, className: "text-amber-600" },
  info: { icon: Info, className: "text-sky-600" },
};

function getPrimaryIssue(issueCodes: BrazilianPlateIssueCode[]) {
  return (
    issueCodes.find(
      (issue) =>
        ![
          "empty",
          "trimmedWhitespace",
          "letterCaseNormalized",
          "ignoredSeparators",
          "confusableCharacters",
          "oldEquivalentUnavailable",
          "syntaxOnly",
        ].includes(issue)
    ) ?? null
  );
}

function isCopyableStatus(status: BrazilianPlateStatus) {
  return status === "validMercosul" || status === "validAntiga" || status === "attention";
}

export function LicensePlateValidatorClient() {
  const searchParams = useSearchParams();
  const t = useTranslations("tools.validador-placa.form");
  const tFaq = useTranslations("tools.validador-placa.faq");
  const hasReadContentFragment = useRef(false);
  const [state, setState] = useState<BrazilianPlateValidatorState>(() =>
    readBrazilianPlateValidatorStateFromParams(new URLSearchParams(searchParams.toString()))
  );
  const [includeContentInUrl, setIncludeContentInUrl] = useState(false);
  const [shareContentOmitted, setShareContentOmitted] = useState(false);
  const [copied, setCopied] = useState<"normalized" | "formatted" | "conversion" | "summary" | null>(null);

  const result = useMemo(() => validateBrazilianPlate(state.placa, { mode: state.modo }), [state.modo, state.placa]);
  const liveParams = useMemo(
    () => buildBrazilianPlateValidatorSearchParams({ placa: "", modo: state.modo }).params,
    [state.modo]
  );
  const primaryIssue = getPrimaryIssue(result.issueCodes);
  const StatusIcon = statusIcons[result.status].icon;
  const conversionDisplay =
    result.conversion?.direction === "mercosulToOld"
      ? (formatBrazilianPlate(result.conversion.output, "antiga") ?? result.conversion.output)
      : (result.conversion?.output ?? null);
  const statusDescription =
    result.status === "validMercosul"
      ? t("result.validMercosulDescription")
      : result.status === "validAntiga"
        ? t("result.validAntigaDescription")
        : result.status === "attention" && primaryIssue
          ? t(`issues.${primaryIssue}`)
          : result.status === "attention"
            ? t("result.attentionDescription")
            : result.status === "invalid" && primaryIssue
              ? t(`issues.${primaryIssue}`)
              : result.status === "incomplete"
                ? t("result.incompleteDescription")
                : t("result.emptyDescription");
  const summaryText = [
    t("summary.input", { value: result.trimmedInput || t("summary.emptyValue") }),
    t("summary.status", { value: t(`result.status.${result.status}`) }),
    result.format !== "unknown" ? t("summary.type", { value: t(`result.type.${result.format}`) }) : "",
    result.normalizedPlate ? t("summary.normalized", { value: result.normalizedPlate }) : "",
    result.formattedPlate ? t("summary.formatted", { value: result.formattedPlate }) : "",
    conversionDisplay ? t("summary.conversion", { value: conversionDisplay }) : "",
    result.issueCodes.includes("oldEquivalentUnavailable") ? t("summary.noOldEquivalent") : "",
    t("summary.syntaxOnly"),
  ]
    .filter(Boolean)
    .join("\n");

  useEffect(() => {
    if (hasReadContentFragment.current) return;

    hasReadContentFragment.current = true;
    const contentFragment = readBrazilianPlateContentFromFragment(window.location.hash);
    if (!contentFragment.hasExplicitContent) return;

    const timeoutId = window.setTimeout(() => {
      setState((current) => ({
        ...current,
        placa: contentFragment.placa,
      }));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    replaceQueryString(liveParams);
  }, [liveParams]);

  const updatePlate = (placa: string) => {
    setShareContentOmitted(false);
    setState((current) => ({
      ...current,
      placa,
    }));
  };

  const updateMode = (modo: BrazilianPlateMode) => {
    setShareContentOmitted(false);
    setState((current) => ({
      ...current,
      modo,
    }));
  };

  const clear = () => {
    setCopied(null);
    setShareContentOmitted(false);
    setState((current) => ({
      ...current,
      placa: defaultBrazilianPlateValidatorState.placa,
    }));
  };

  const copyToClipboard = async (
    value: string | null,
    type: "normalized" | "formatted" | "conversion" | "summary"
  ) => {
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
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
            <div className="space-y-6">
              <section className="space-y-4 rounded-lg border p-4" aria-labelledby="plate-validator-input-title">
                <div>
                  <h2 id="plate-validator-input-title" className="font-semibold">
                    {t("input.title")}
                  </h2>
                  <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {t("input.privacy")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license-plate-validator-input">{t("input.label")}</Label>
                  <Input
                    id="license-plate-validator-input"
                    data-testid="license-plate-validator-input"
                    type="text"
                    inputMode="text"
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck={false}
                    value={state.placa}
                    onChange={(event) => updatePlate(event.target.value)}
                    placeholder={t("input.placeholder")}
                    aria-invalid={result.status === "invalid"}
                  />
                  <p className="text-xs text-muted-foreground">{t("input.hint")}</p>
                </div>

                <div className="space-y-2">
                  <Label>{t("mode.label")}</Label>
                  <div className="grid gap-2 sm:grid-cols-3" data-testid="license-plate-validator-mode">
                    {modeOptions.map((mode) => (
                      <Button
                        key={mode}
                        type="button"
                        variant={state.modo === mode ? "default" : "outline"}
                        aria-pressed={state.modo === mode}
                        onClick={() => updateMode(mode)}
                        data-testid={`license-plate-validator-mode-${mode}`}>
                        {t(`mode.options.${mode}.label`)}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{t(`mode.options.${state.modo}.hint`)}</p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clear}
                    disabled={!state.placa}
                    data-testid="license-plate-validator-clear">
                    <Trash2 className="h-4 w-4" />
                    {t("actions.clear")}
                  </Button>
                </div>
              </section>

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="plate-validator-share-title">
                <div>
                  <h2 id="plate-validator-share-title" className="font-semibold">
                    {t("share.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("share.description")}</p>
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    id="license-plate-validator-include-content"
                    data-testid="license-plate-validator-include-content"
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
                <div data-testid="license-plate-validator-share-button">
                  <ShareButton
                    className="w-full sm:w-auto"
                    getShareUrl={() => {
                      const shareUrl = buildBrazilianPlateValidatorShareUrl(
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

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="plate-validator-details-title">
                <div>
                  <h2 id="plate-validator-details-title" className="font-semibold">
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

            <aside className="space-y-5 rounded-lg border bg-muted/30 p-4" aria-labelledby="plate-validator-result-title">
              <div>
                <h2 id="plate-validator-result-title" className="font-semibold">
                  {t("result.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("result.description")}</p>
              </div>

              <div
                data-testid="license-plate-validator-status"
                aria-live="polite"
                className={cn(
                  "rounded-lg border bg-background p-4",
                  result.status === "validMercosul" || result.status === "validAntiga" ? "border-emerald-200" : "",
                  result.status === "invalid" ? "border-red-200" : "",
                  result.status === "attention" || result.status === "incomplete" ? "border-amber-300" : ""
                )}>
                <div className="flex items-start gap-3">
                  <StatusIcon className={cn("mt-0.5 h-5 w-5 shrink-0", statusIcons[result.status].className)} />
                  <div className="min-w-0">
                    <p className="font-medium">{t(`result.status.${result.status}`)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{statusDescription}</p>
                  </div>
                </div>
              </div>

              {result.normalizedPlate ? (
                <div className="space-y-2 rounded-lg border bg-background p-4">
                  <p className="text-sm font-medium">{t("result.normalizedLabel")}</p>
                  <p
                    data-testid="license-plate-validator-normalized"
                    className="break-all rounded-md bg-muted px-3 py-2 font-mono text-sm">
                    {result.normalizedPlate}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("result.normalizedHint")}</p>
                </div>
              ) : null}

              {result.formattedPlate ? (
                <div className="space-y-2 rounded-lg border bg-background p-4">
                  <p className="text-sm font-medium">{t("result.formattedLabel")}</p>
                  <p
                    data-testid="license-plate-validator-formatted"
                    className="break-all rounded-md bg-muted px-3 py-2 font-mono text-sm">
                    {result.formattedPlate}
                  </p>
                  <p className="text-xs text-muted-foreground">{t(`result.typeHint.${result.format}`)}</p>
                </div>
              ) : null}

              {result.conversion ? (
                <div className="space-y-2 rounded-lg border bg-background p-4">
                  <p className="text-sm font-medium">{t("result.conversionLabel")}</p>
                  <p
                    data-testid="license-plate-validator-conversion"
                    className="break-all rounded-md bg-muted px-3 py-2 font-mono text-sm">
                    {conversionDisplay}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t(`result.conversionHint.${result.conversion.direction}`, {
                      digit: result.conversion.mappingDigit,
                      letter: result.conversion.mappingLetter,
                    })}
                  </p>
                </div>
              ) : result.issueCodes.includes("oldEquivalentUnavailable") ? (
                <div className="rounded-lg border bg-background p-4">
                  <p data-testid="license-plate-validator-conversion" className="text-sm text-muted-foreground">
                    {t("issues.oldEquivalentUnavailable")}
                  </p>
                </div>
              ) : null}

              <div className="rounded-lg border bg-background p-4">
                <p className="font-medium">{t("diagnostics.title")}</p>
                <ul data-testid="license-plate-validator-diagnostics" className="mt-3 space-y-3">
                  {result.diagnostics.map((diagnostic) => {
                    const DiagnosticIcon = diagnosticIcons[diagnostic.status].icon;
                    const description =
                      diagnostic.issueCodes.length > 0
                        ? diagnostic.issueCodes.map((issueCode) => t(`issues.${issueCode}`)).join(" ")
                        : t(`diagnostics.items.${diagnostic.id}.pass`);

                    return (
                      <li
                        key={diagnostic.id}
                        data-testid={`license-plate-validator-check-${diagnostic.id}`}
                        className="flex items-start gap-3 text-sm">
                        <DiagnosticIcon
                          className={cn("mt-0.5 h-4 w-4 shrink-0", diagnosticIcons[diagnostic.status].className)}
                        />
                        <div className="min-w-0">
                          <p className="font-medium">{t(`diagnostics.items.${diagnostic.id}.label`)}</p>
                          <p className="text-muted-foreground">{description}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(result.normalizedPlate, "normalized")}
                  disabled={!isCopyableStatus(result.status) || !result.normalizedPlate}
                  data-testid="license-plate-validator-copy-normalized">
                  {copied === "normalized" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "normalized" ? t("actions.copied") : t("actions.copyNormalized")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(result.formattedPlate, "formatted")}
                  disabled={!result.formattedPlate}
                  data-testid="license-plate-validator-copy-formatted">
                  {copied === "formatted" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "formatted" ? t("actions.copied") : t("actions.copyFormatted")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(conversionDisplay, "conversion")}
                  disabled={!conversionDisplay}
                  data-testid="license-plate-validator-copy-conversion">
                  {copied === "conversion" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "conversion" ? t("actions.copied") : t("actions.copyConversion")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(summaryText, "summary")}
                  disabled={result.status === "empty"}
                  data-testid="license-plate-validator-copy-summary">
                  {copied === "summary" ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                  {copied === "summary" ? t("actions.copied") : t("actions.copySummary")}
                </Button>
              </div>

              <div className="rounded-lg border bg-background p-4">
                <p className="flex items-start gap-2 text-sm text-muted-foreground">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                  {t("result.syntaxOnly")}
                </p>
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

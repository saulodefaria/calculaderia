"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  CheckCircle,
  ClipboardCopy,
  Copy,
  Fingerprint,
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
  buildPisPasepValidatorSearchParams,
  buildPisPasepValidatorShareUrl,
  defaultPisPasepValidatorState,
  readPisPasepValidatorContentFromFragment,
  readPisPasepValidatorSearchParams,
  validatePisPasepNumber,
  type PisPasepDiagnosticStatus,
  type PisPasepValidationIssueCode,
  type PisPasepValidationStatus,
  type PisPasepValidatorState,
} from "@/lib/tools/pis-pasep";
import { cn } from "@/lib/utils/index";

const faqIds = ["lookup", "eligibility", "terms", "privacy", "sharing"] as const;
const detailIds = ["checksum", "format", "noLookup", "privacy"] as const;

const statusIcons: Record<PisPasepValidationStatus, { icon: LucideIcon; className: string }> = {
  empty: { icon: Fingerprint, className: "text-muted-foreground" },
  incomplete: { icon: AlertTriangle, className: "text-amber-600" },
  invalidFormat: { icon: XCircle, className: "text-red-600" },
  invalidChecksum: { icon: XCircle, className: "text-red-600" },
  validChecksum: { icon: CheckCircle, className: "text-emerald-600" },
};

const diagnosticIcons: Record<PisPasepDiagnosticStatus, { icon: LucideIcon; className: string }> = {
  pass: { icon: CheckCircle, className: "text-emerald-600" },
  fail: { icon: XCircle, className: "text-red-600" },
  warn: { icon: AlertTriangle, className: "text-amber-600" },
  info: { icon: Info, className: "text-sky-600" },
};

function getPrimaryIssue(issues: PisPasepValidationIssueCode[]) {
  return (
    issues.find(
      (issue) =>
        !["empty", "trimmedWhitespace", "checksumUnavailable", "validChecksum", "syntaxOnly", "localOnly"].includes(
          issue
        )
    ) ?? null
  );
}

export function PisPasepValidatorClient() {
  const searchParams = useSearchParams();
  const t = useTranslations("tools.validador-pis-pasep.form");
  const tFaq = useTranslations("tools.validador-pis-pasep.faq");
  const hasReadContentFragment = useRef(false);
  const [state, setState] = useState<PisPasepValidatorState>(() =>
    readPisPasepValidatorSearchParams(new URLSearchParams(searchParams.toString()))
  );
  const [includeContentInUrl, setIncludeContentInUrl] = useState(false);
  const [shareContentOmitted, setShareContentOmitted] = useState(false);
  const [copied, setCopied] = useState<"normalized" | "formatted" | "summary" | null>(null);

  const result = useMemo(() => validatePisPasepNumber(state.pis), [state.pis]);
  const liveParams = useMemo(() => buildPisPasepValidatorSearchParams({ pis: "" }).params, []);
  const primaryIssue = getPrimaryIssue(result.issueCodes);
  const StatusIcon = statusIcons[result.status].icon;
  const statusDescription =
    result.status === "validChecksum"
      ? t("result.validDescription")
      : result.status === "invalidChecksum"
        ? t("result.invalidChecksumDescription")
        : result.status === "incomplete"
          ? t("result.incompleteDescription")
          : result.status === "invalidFormat" && primaryIssue
            ? t(`issues.${primaryIssue}`)
            : t("result.emptyDescription");
  const checkDigitDescription =
    result.expectedCheckDigit && result.providedCheckDigit
      ? t("result.checkDigitValue", {
          provided: result.providedCheckDigit,
          expected: result.expectedCheckDigit,
        })
      : t("result.checkDigitUnavailable");
  const summaryText = [
    t("summary.input", { value: result.trimmedInput || t("summary.emptyValue") }),
    result.normalizedValue ? t("summary.normalized", { value: result.normalizedValue }) : "",
    result.formattedValue ? t("summary.formatted", { value: result.formattedValue }) : "",
    t("summary.digits", { count: result.digitCount }),
    t("summary.status", { value: t(`result.status.${result.status}`) }),
    checkDigitDescription,
    t("summary.scope"),
  ]
    .filter(Boolean)
    .join("\n");

  useEffect(() => {
    if (hasReadContentFragment.current) return;

    hasReadContentFragment.current = true;
    const contentFragment = readPisPasepValidatorContentFromFragment(window.location.hash);
    if (!contentFragment.hasExplicitContent) return;

    const timeoutId = window.setTimeout(() => {
      setState((current) => ({
        ...current,
        pis: contentFragment.pis,
      }));
      setShareContentOmitted(contentFragment.contentOmitted);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    replaceQueryString(liveParams);
  }, [liveParams]);

  const updatePis = (pis: string) => {
    setShareContentOmitted(false);
    setCopied(null);
    setState((current) => ({
      ...current,
      pis,
    }));
  };

  const clear = () => {
    setShareContentOmitted(false);
    setCopied(null);
    setIncludeContentInUrl(false);
    setState(defaultPisPasepValidatorState);
  };

  const copyToClipboard = async (value: string | null, type: "normalized" | "formatted" | "summary") => {
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
              <section className="space-y-4 rounded-lg border p-4" aria-labelledby="pis-pasep-input-title">
                <div>
                  <h2 id="pis-pasep-input-title" className="font-semibold">
                    {t("input.title")}
                  </h2>
                  <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {t("input.privacy")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pis-pasep-validator-input">{t("input.label")}</Label>
                  <Input
                    id="pis-pasep-validator-input"
                    data-testid="pis-pasep-validator-input"
                    type="text"
                    inputMode="numeric"
                    autoCapitalize="none"
                    autoComplete="off"
                    spellCheck={false}
                    value={state.pis}
                    onChange={(event) => updatePis(event.target.value)}
                    placeholder={t("input.placeholder")}
                    aria-invalid={result.status === "invalidFormat" || result.status === "invalidChecksum"}
                  />
                  <p className="text-xs text-muted-foreground">{t("input.hint")}</p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clear}
                    disabled={!state.pis && !includeContentInUrl}
                    data-testid="pis-pasep-validator-clear">
                    <Trash2 className="h-4 w-4" />
                    {t("actions.clear")}
                  </Button>
                </div>
              </section>

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="pis-pasep-share-title">
                <div>
                  <h2 id="pis-pasep-share-title" className="font-semibold">
                    {t("share.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("share.description")}</p>
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    id="pis-pasep-validator-include-content"
                    data-testid="pis-pasep-validator-include-content"
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
                <div data-testid="pis-pasep-validator-share-button">
                  <ShareButton
                    className="w-full sm:w-auto"
                    getShareUrl={() => {
                      const shareUrl = buildPisPasepValidatorShareUrl(
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

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="pis-pasep-details-title">
                <div>
                  <h2 id="pis-pasep-details-title" className="font-semibold">
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

            <aside className="space-y-5 rounded-lg border bg-muted/30 p-4" aria-labelledby="pis-pasep-result-title">
              <div>
                <h2 id="pis-pasep-result-title" className="font-semibold">
                  {t("result.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("result.description")}</p>
              </div>

              <div
                data-testid="pis-pasep-validator-status"
                aria-live="polite"
                className={cn(
                  "rounded-lg border bg-background p-4",
                  result.status === "validChecksum" ? "border-emerald-200" : "",
                  result.status === "invalidFormat" || result.status === "invalidChecksum" ? "border-red-200" : "",
                  result.status === "incomplete" ? "border-amber-300" : ""
                )}>
                <div className="flex items-start gap-3">
                  <StatusIcon className={cn("mt-0.5 h-5 w-5 shrink-0", statusIcons[result.status].className)} />
                  <div className="min-w-0">
                    <p className="font-medium">{t(`result.status.${result.status}`)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{statusDescription}</p>
                  </div>
                </div>
              </div>

              {result.normalizedValue ? (
                <div className="space-y-2 rounded-lg border bg-background p-4">
                  <p className="text-sm font-medium">{t("result.normalizedLabel")}</p>
                  <p
                    data-testid="pis-pasep-validator-normalized"
                    className="break-all rounded-md bg-muted px-3 py-2 font-mono text-sm">
                    {result.normalizedValue}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("result.normalizedHint")}</p>
                </div>
              ) : null}

              {result.formattedValue ? (
                <div className="space-y-2 rounded-lg border bg-background p-4">
                  <p className="text-sm font-medium">{t("result.formattedLabel")}</p>
                  <p
                    data-testid="pis-pasep-validator-formatted"
                    className="break-all rounded-md bg-muted px-3 py-2 font-mono text-sm">
                    {result.formattedValue}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("result.formattedHint")}</p>
                </div>
              ) : null}

              <div className="rounded-lg border bg-background p-4">
                <p className="text-sm font-medium">{t("result.checkDigitLabel")}</p>
                <p data-testid="pis-pasep-validator-check-digit" className="mt-1 text-sm text-muted-foreground">
                  {checkDigitDescription}
                </p>
              </div>

              <div className="rounded-lg border bg-background p-4">
                <p className="font-medium">{t("diagnostics.title")}</p>
                <ul data-testid="pis-pasep-validator-diagnostics" className="mt-3 space-y-3">
                  {result.diagnostics.map((diagnostic) => {
                    const DiagnosticIcon = diagnosticIcons[diagnostic.status].icon;
                    const description =
                      diagnostic.issueCodes.length > 0
                        ? diagnostic.issueCodes.map((issueCode) => t(`issues.${issueCode}`)).join(" ")
                        : t(`diagnostics.items.${diagnostic.id}.pass`);

                    return (
                      <li
                        key={diagnostic.id}
                        data-testid={`pis-pasep-validator-check-${diagnostic.id}`}
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

              <div className="grid gap-2 sm:grid-cols-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(result.normalizedValue, "normalized")}
                  disabled={!result.normalizedValue}
                  data-testid="pis-pasep-validator-copy-normalized">
                  {copied === "normalized" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "normalized" ? t("actions.copied") : t("actions.copyNormalized")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(result.formattedValue, "formatted")}
                  disabled={!result.formattedValue}
                  data-testid="pis-pasep-validator-copy-formatted">
                  {copied === "formatted" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "formatted" ? t("actions.copied") : t("actions.copyFormatted")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(summaryText, "summary")}
                  disabled={result.status === "empty"}
                  data-testid="pis-pasep-validator-copy-summary">
                  {copied === "summary" ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                  {copied === "summary" ? t("actions.copied") : t("actions.copySummary")}
                </Button>
              </div>

              <div className="rounded-lg border bg-background p-4">
                <p className="flex items-start gap-2 text-sm text-muted-foreground">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                  {t(`result.explanation.${result.status}`)}
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

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
  Info,
  Mail,
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
  buildEmailValidatorSearchParams,
  buildEmailValidatorShareUrl,
  readEmailValidatorContentFromFragment,
  readEmailValidatorStateFromParams,
  validateEmailSyntax,
  type EmailDiagnosticStatus,
  type EmailValidationIssueCode,
  type EmailValidationStatus,
  type EmailValidatorState,
} from "@/lib/tools/email";
import { cn } from "@/lib/utils/index";

const faqIds = ["privacy", "mailbox", "dnsMx", "unicode", "rfc", "sharing"] as const;
const detailIds = ["syntax", "dns", "rfc", "unicode", "privacy"] as const;

const statusIcons: Record<EmailValidationStatus, { icon: LucideIcon; className: string }> = {
  empty: { icon: Mail, className: "text-muted-foreground" },
  valid: { icon: CheckCircle, className: "text-emerald-600" },
  invalid: { icon: XCircle, className: "text-red-600" },
  attention: { icon: AlertTriangle, className: "text-amber-600" },
};

const diagnosticIcons: Record<EmailDiagnosticStatus, { icon: LucideIcon; className: string }> = {
  pass: { icon: CheckCircle, className: "text-emerald-600" },
  fail: { icon: XCircle, className: "text-red-600" },
  warn: { icon: AlertTriangle, className: "text-amber-600" },
  info: { icon: Info, className: "text-sky-600" },
};

function getPrimaryIssue(issues: EmailValidationIssueCode[]) {
  return issues.find((issue) => issue !== "empty" && issue !== "domainIdnNormalized" && issue !== "syntaxOnly") ?? null;
}

export function EmailValidatorClient() {
  const searchParams = useSearchParams();
  const t = useTranslations("tools.validador-email.form");
  const tFaq = useTranslations("tools.validador-email.faq");
  const hasReadContentFragment = useRef(false);
  const [state, setState] = useState<EmailValidatorState>(() =>
    readEmailValidatorStateFromParams(new URLSearchParams(searchParams.toString()))
  );
  const [includeContentInUrl, setIncludeContentInUrl] = useState(false);
  const [shareContentOmitted, setShareContentOmitted] = useState(false);
  const [copied, setCopied] = useState<"normalized" | "summary" | null>(null);

  const result = useMemo(() => validateEmailSyntax(state.email), [state.email]);
  const liveParams = useMemo(
    () => buildEmailValidatorSearchParams({ email: "", mode: state.mode }).params,
    [state.mode]
  );
  const primaryIssue = getPrimaryIssue(result.issues);
  const StatusIcon = statusIcons[result.status].icon;
  const statusDescription =
    result.status === "valid"
      ? t("result.validDescription")
      : result.status === "attention"
        ? t("result.attentionDescription")
        : result.status === "invalid" && primaryIssue
          ? t(`issues.${primaryIssue}`)
          : t("result.emptyDescription");
  const summaryText = [
    t("summary.input", { value: result.trimmedInput || t("summary.emptyValue") }),
    t("summary.status", { value: t(`result.status.${result.status}`) }),
    result.normalizedEmail ? t("summary.normalized", { value: result.normalizedEmail }) : "",
    t("summary.syntaxOnly"),
  ]
    .filter(Boolean)
    .join("\n");

  useEffect(() => {
    if (hasReadContentFragment.current) return;

    hasReadContentFragment.current = true;
    const contentFragment = readEmailValidatorContentFromFragment(window.location.hash);
    if (!contentFragment.hasExplicitContent) return;

    const timeoutId = window.setTimeout(() => {
      setState((current) => ({
        ...current,
        email: contentFragment.email,
      }));
      setIncludeContentInUrl(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    replaceQueryString(liveParams);
  }, [liveParams]);

  const updateEmail = (email: string) => {
    setShareContentOmitted(false);
    setState((current) => ({
      ...current,
      email,
    }));
  };

  const copyToClipboard = async (value: string, type: "normalized" | "summary") => {
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
              <section className="space-y-4 rounded-lg border p-4" aria-labelledby="email-validator-input-title">
                <div>
                  <h2 id="email-validator-input-title" className="font-semibold">
                    {t("input.title")}
                  </h2>
                  <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {t("input.privacy")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-validator-input">{t("input.label")}</Label>
                  <Input
                    id="email-validator-input"
                    data-testid="email-validator-input"
                    type="text"
                    inputMode="email"
                    autoCapitalize="none"
                    autoComplete="off"
                    spellCheck={false}
                    value={state.email}
                    onChange={(event) => updateEmail(event.target.value)}
                    placeholder={t("input.placeholder")}
                    aria-invalid={result.status === "invalid"}
                  />
                  <p className="text-xs text-muted-foreground">{t("input.hint")}</p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => updateEmail("")}
                    disabled={!state.email}
                    data-testid="email-validator-clear">
                    <Trash2 className="h-4 w-4" />
                    {t("actions.clear")}
                  </Button>
                </div>
              </section>

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="email-validator-share-title">
                <div>
                  <h2 id="email-validator-share-title" className="font-semibold">
                    {t("share.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("share.description")}</p>
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    id="email-validator-include-content"
                    data-testid="email-validator-include-content"
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
                <div data-testid="email-validator-share-button">
                  <ShareButton
                    className="w-full sm:w-auto"
                    getShareUrl={() => {
                      const shareUrl = buildEmailValidatorShareUrl(
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

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="email-validator-details-title">
                <div>
                  <h2 id="email-validator-details-title" className="font-semibold">
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

            <aside className="space-y-5 rounded-lg border bg-muted/30 p-4" aria-labelledby="email-validator-result-title">
              <div>
                <h2 id="email-validator-result-title" className="font-semibold">
                  {t("result.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("result.description")}</p>
              </div>

              <div
                data-testid="email-validator-status"
                aria-live="polite"
                className={cn(
                  "rounded-lg border bg-background p-4",
                  result.status === "valid" ? "border-emerald-200" : "",
                  result.status === "invalid" ? "border-red-200" : "",
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

              {result.normalizedEmail ? (
                <div className="space-y-2 rounded-lg border bg-background p-4">
                  <p className="text-sm font-medium">{t("result.normalizedLabel")}</p>
                  <p
                    data-testid="email-validator-normalized"
                    className="break-all rounded-md bg-muted px-3 py-2 font-mono text-sm">
                    {result.normalizedEmail}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("result.normalizedHint")}</p>
                </div>
              ) : null}

              <div className="rounded-lg border bg-background p-4">
                <p className="font-medium">{t("diagnostics.title")}</p>
                <ul data-testid="email-validator-diagnostics" className="mt-3 space-y-3">
                  {result.diagnostics.map((diagnostic) => {
                    const DiagnosticIcon = diagnosticIcons[diagnostic.status].icon;
                    const description =
                      diagnostic.issueCodes.length > 0
                        ? diagnostic.issueCodes.map((issueCode) => t(`issues.${issueCode}`)).join(" ")
                        : t(`diagnostics.items.${diagnostic.id}.pass`);

                    return (
                      <li
                        key={diagnostic.id}
                        data-testid={`email-validator-check-${diagnostic.id}`}
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
                  onClick={() => copyToClipboard(result.normalizedEmail ?? "", "normalized")}
                  disabled={!result.normalizedEmail}
                  data-testid="email-validator-copy-normalized">
                  {copied === "normalized" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "normalized" ? t("actions.copied") : t("actions.copyNormalized")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(summaryText, "summary")}
                  disabled={result.status === "empty"}
                  data-testid="email-validator-copy-summary">
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

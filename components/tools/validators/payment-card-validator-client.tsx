"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  CheckCircle,
  ClipboardCopy,
  CreditCard,
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
  buildPaymentCardValidatorSearchParams,
  buildPaymentCardValidatorShareUrl,
  defaultPaymentCardValidatorState,
  readPaymentCardValidatorSearchParams,
  validatePaymentCardNumber,
  type PaymentCardDiagnosticStatus,
  type PaymentCardValidationIssueCode,
  type PaymentCardValidationStatus,
  type PaymentCardValidatorState,
} from "@/lib/tools/payment-card";
import { cn } from "@/lib/utils/index";

const faqIds = ["checks", "purchase", "privacy", "sensitive", "issuer", "sharing"] as const;
const detailIds = ["luhn", "format", "noLookup", "privacy"] as const;

const statusIcons: Record<PaymentCardValidationStatus, { icon: LucideIcon; className: string }> = {
  empty: { icon: CreditCard, className: "text-muted-foreground" },
  incomplete: { icon: AlertTriangle, className: "text-amber-600" },
  invalidFormat: { icon: XCircle, className: "text-red-600" },
  invalidChecksum: { icon: XCircle, className: "text-red-600" },
  validChecksum: { icon: CheckCircle, className: "text-emerald-600" },
};

const diagnosticIcons: Record<PaymentCardDiagnosticStatus, { icon: LucideIcon; className: string }> = {
  pass: { icon: CheckCircle, className: "text-emerald-600" },
  fail: { icon: XCircle, className: "text-red-600" },
  warn: { icon: AlertTriangle, className: "text-amber-600" },
  info: { icon: Info, className: "text-sky-600" },
};

function getPrimaryIssue(issues: PaymentCardValidationIssueCode[]) {
  return (
    issues.find(
      (issue) => !["empty", "trimmedWhitespace", "luhnUnavailable", "validChecksum", "localOnly"].includes(issue)
    ) ?? null
  );
}

export function PaymentCardValidatorClient() {
  const searchParams = useSearchParams();
  const t = useTranslations("tools.validador-cartao.form");
  const tFaq = useTranslations("tools.validador-cartao.faq");
  const [state, setState] = useState<PaymentCardValidatorState>(() =>
    readPaymentCardValidatorSearchParams(new URLSearchParams(searchParams.toString()))
  );
  const [copied, setCopied] = useState(false);

  const result = useMemo(
    () => validatePaymentCardNumber(state.numero, { masked: state.mascarado }),
    [state.mascarado, state.numero]
  );
  const liveParams = useMemo(() => buildPaymentCardValidatorSearchParams(state).params, [state]);
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
    t("summary.number", { value: result.maskedNumber || t("summary.emptyValue") }),
    t("summary.digits", { count: result.digitCount }),
    t("summary.status", { value: t(`result.status.${result.status}`) }),
    checkDigitDescription,
    t("summary.scope"),
  ].join("\n");

  useEffect(() => {
    replaceQueryString(liveParams);
  }, [liveParams]);

  const updateNumber = (numero: string) => {
    setState((current) => ({
      ...current,
      numero,
    }));
  };

  const clear = () => {
    setCopied(false);
    setState(defaultPaymentCardValidatorState);
  };

  const copySummary = async () => {
    if (result.status === "empty") return;

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
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
              <section className="space-y-4 rounded-lg border p-4" aria-labelledby="payment-card-input-title">
                <div>
                  <h2 id="payment-card-input-title" className="font-semibold">
                    {t("input.title")}
                  </h2>
                  <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {t("input.privacy")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment-card-validator-input">{t("input.label")}</Label>
                  <Input
                    id="payment-card-validator-input"
                    data-testid="payment-card-validator-input"
                    type="text"
                    inputMode="numeric"
                    autoCapitalize="none"
                    autoComplete="off"
                    spellCheck={false}
                    value={state.numero}
                    onChange={(event) => updateNumber(event.target.value)}
                    placeholder={t("input.placeholder")}
                    aria-invalid={result.status === "invalidFormat" || result.status === "invalidChecksum"}
                  />
                  <p className="text-xs text-muted-foreground">{t("input.hint")}</p>
                </div>

                <label className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
                  <input
                    id="payment-card-validator-mask-toggle"
                    data-testid="payment-card-validator-mask-toggle"
                    type="checkbox"
                    checked={state.mascarado}
                    onChange={(event) =>
                      setState((current) => ({
                        ...current,
                        mascarado: event.target.checked,
                      }))
                    }
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-medium">{t("mask.label")}</span>
                    <span className="block text-muted-foreground">{t("mask.hint")}</span>
                  </span>
                </label>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clear}
                    disabled={!state.numero && state.mascarado}
                    data-testid="payment-card-validator-clear">
                    <Trash2 className="h-4 w-4" />
                    {t("actions.clear")}
                  </Button>
                </div>
              </section>

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="payment-card-share-title">
                <div>
                  <h2 id="payment-card-share-title" className="font-semibold">
                    {t("share.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("share.description")}</p>
                </div>
                <p className="text-sm text-muted-foreground">{t("share.safe")}</p>
                <div data-testid="payment-card-validator-share-button">
                  <ShareButton
                    className="w-full sm:w-auto"
                    getShareUrl={() =>
                      buildPaymentCardValidatorShareUrl(
                        `${window.location.origin}${window.location.pathname}`,
                        state
                      ).url
                    }
                  />
                </div>
              </section>

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="payment-card-details-title">
                <div>
                  <h2 id="payment-card-details-title" className="font-semibold">
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

            <aside className="space-y-5 rounded-lg border bg-muted/30 p-4" aria-labelledby="payment-card-result-title">
              <div>
                <h2 id="payment-card-result-title" className="font-semibold">
                  {t("result.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("result.description")}</p>
              </div>

              <div
                data-testid="payment-card-validator-status"
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

              {result.digitCount > 0 ? (
                <div className="space-y-2 rounded-lg border bg-background p-4">
                  <p className="text-sm font-medium">{t("result.numberLabel")}</p>
                  <p
                    data-testid="payment-card-validator-display-number"
                    className="break-all rounded-md bg-muted px-3 py-2 font-mono text-sm">
                    {result.displayNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {state.mascarado ? t("result.maskedHint") : t("result.unmaskedHint")}
                  </p>
                </div>
              ) : null}

              <div className="rounded-lg border bg-background p-4">
                <p className="text-sm font-medium">{t("result.checkDigitLabel")}</p>
                <p data-testid="payment-card-validator-check-digit" className="mt-1 text-sm text-muted-foreground">
                  {checkDigitDescription}
                </p>
              </div>

              <div className="rounded-lg border bg-background p-4">
                <p className="font-medium">{t("diagnostics.title")}</p>
                <ul data-testid="payment-card-validator-diagnostics" className="mt-3 space-y-3">
                  {result.diagnostics.map((diagnostic) => {
                    const DiagnosticIcon = diagnosticIcons[diagnostic.status].icon;
                    const description =
                      diagnostic.issueCodes.length > 0
                        ? diagnostic.issueCodes.map((issueCode) => t(`issues.${issueCode}`)).join(" ")
                        : t(`diagnostics.items.${diagnostic.id}.pass`);

                    return (
                      <li
                        key={diagnostic.id}
                        data-testid={`payment-card-validator-check-${diagnostic.id}`}
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

              <Button
                type="button"
                variant="outline"
                onClick={copySummary}
                disabled={result.status === "empty"}
                data-testid="payment-card-validator-copy-summary">
                {copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                {copied ? t("actions.copied") : t("actions.copySummary")}
              </Button>

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

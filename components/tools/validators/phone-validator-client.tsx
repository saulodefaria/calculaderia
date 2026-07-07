"use client";

import Link from "next/link";
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
  Phone,
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
  buildPhoneValidatorSearchParams,
  buildPhoneValidatorShareUrl,
  readPhoneValidatorContentFromFragment,
  readPhoneValidatorStateFromParams,
  validatePhoneNumber,
  type PhoneDiagnosticStatus,
  type PhoneValidationIssueCode,
  type PhoneValidationStatus,
  type PhoneValidatorMode,
  type PhoneValidatorOutput,
  type PhoneValidatorState,
} from "@/lib/tools/phone";
import { cn } from "@/lib/utils/index";

const faqIds = ["privacy", "existence", "whatsappCarrier", "dddE164", "missingDdd", "specialSharing"] as const;
const detailIds = ["brazil", "e164", "noLookup", "privacy"] as const;
const modeIds: PhoneValidatorMode[] = ["br", "internacional"];
const outputIds: PhoneValidatorOutput[] = ["formatado", "e164", "digitos"];
const relatedLinks = [
  { id: "email", href: "/validadores/validador-email" },
  { id: "cpfCnpjFormatter", href: "/validadores/formatador-cpf-cnpj" },
  { id: "cpf", href: "/validadores/cpf" },
  { id: "cnpj", href: "/validadores/cnpj" },
  { id: "regex", href: "/dev/regex-tester" },
  { id: "characterCounter", href: "/texto/contador-caracteres" },
] as const;

const statusIcons: Record<PhoneValidationStatus, { icon: LucideIcon; className: string }> = {
  empty: { icon: Phone, className: "text-muted-foreground" },
  valid: { icon: CheckCircle, className: "text-emerald-600" },
  attention: { icon: AlertTriangle, className: "text-amber-600" },
  special: { icon: Info, className: "text-sky-600" },
  invalid: { icon: XCircle, className: "text-red-600" },
};

const diagnosticIcons: Record<PhoneDiagnosticStatus, { icon: LucideIcon; className: string }> = {
  pass: { icon: CheckCircle, className: "text-emerald-600" },
  fail: { icon: XCircle, className: "text-red-600" },
  warn: { icon: AlertTriangle, className: "text-amber-600" },
  info: { icon: Info, className: "text-sky-600" },
};

function getPrimaryIssue(issues: PhoneValidationIssueCode[]) {
  return (
    issues.find(
      (issue) =>
        ![
          "empty",
          "separatorsIgnored",
          "dddNotVerified",
          "internationalStructureOnly",
          "localValidationOnly",
        ].includes(issue)
    ) ?? null
  );
}

export function PhoneValidatorClient() {
  const searchParams = useSearchParams();
  const t = useTranslations("tools.validador-telefone.form");
  const tFaq = useTranslations("tools.validador-telefone.faq");
  const hasReadContentFragment = useRef(false);
  const [state, setState] = useState<PhoneValidatorState>(() =>
    readPhoneValidatorStateFromParams(new URLSearchParams(searchParams.toString()))
  );
  const [includeContentInUrl, setIncludeContentInUrl] = useState(false);
  const [shareContentOmitted, setShareContentOmitted] = useState(false);
  const [copied, setCopied] = useState<"formatted" | "e164" | "digits" | "summary" | null>(null);

  const result = useMemo(() => validatePhoneNumber(state.telefone, { mode: state.pais }), [state.pais, state.telefone]);
  const liveParams = useMemo(
    () => buildPhoneValidatorSearchParams({ telefone: "", pais: state.pais, saida: state.saida }).params,
    [state.pais, state.saida]
  );
  const primaryIssue = getPrimaryIssue(result.issues);
  const StatusIcon = statusIcons[result.status].icon;
  const formattedOutput = result.formattedNational ?? result.formattedLocal ?? result.serviceNumber;
  const selectedOutput =
    state.saida === "formatado" ? formattedOutput : state.saida === "e164" ? result.e164 : result.digitsOnly;
  const selectedOutputLabel =
    state.saida === "formatado"
      ? t("outputs.formatted")
      : state.saida === "e164"
        ? t("outputs.e164")
        : t("outputs.digits");
  const statusDescription =
    result.status === "valid"
      ? result.kind === "internationalE164"
        ? t("result.validInternationalDescription")
        : t("result.validBrazilDescription")
      : result.status === "attention" && primaryIssue
        ? t(`issues.${primaryIssue}`)
        : result.status === "special"
          ? t("result.specialDescription")
          : result.status === "invalid" && primaryIssue
            ? t(`issues.${primaryIssue}`)
            : t("result.emptyDescription");
  const summaryText = [
    t("summary.input", { value: result.trimmedInput || t("summary.emptyValue") }),
    t("summary.status", { value: t(`result.status.${result.status}`) }),
    t(`summary.kind.${result.kind}`),
    formattedOutput ? t("summary.formatted", { value: formattedOutput }) : "",
    result.e164 ? t("summary.e164", { value: result.e164 }) : "",
    result.digitsOnly ? t("summary.digits", { value: result.digitsOnly }) : "",
    t("summary.scope"),
  ]
    .filter(Boolean)
    .join("\n");

  useEffect(() => {
    if (hasReadContentFragment.current) return;

    hasReadContentFragment.current = true;
    const contentFragment = readPhoneValidatorContentFromFragment(window.location.hash);
    if (!contentFragment.hasExplicitContent) return;

    const timeoutId = window.setTimeout(() => {
      setState((current) => ({
        ...current,
        telefone: contentFragment.telefone,
      }));
      setIncludeContentInUrl(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    replaceQueryString(liveParams);
  }, [liveParams]);

  const updatePhone = (telefone: string) => {
    setShareContentOmitted(false);
    setState((current) => ({
      ...current,
      telefone,
    }));
  };

  const copyToClipboard = async (value: string | null | undefined, type: "formatted" | "e164" | "digits" | "summary") => {
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
              <section className="space-y-4 rounded-lg border p-4" aria-labelledby="phone-validator-input-title">
                <div>
                  <h2 id="phone-validator-input-title" className="font-semibold">
                    {t("input.title")}
                  </h2>
                  <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {t("input.privacy")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone-validator-input">{t("input.label")}</Label>
                  <Input
                    id="phone-validator-input"
                    data-testid="phone-validator-input"
                    type="text"
                    inputMode="tel"
                    autoCapitalize="none"
                    autoComplete="off"
                    spellCheck={false}
                    value={state.telefone}
                    onChange={(event) => updatePhone(event.target.value)}
                    placeholder={t("input.placeholder")}
                    aria-invalid={result.status === "invalid"}
                  />
                  <p className="text-xs text-muted-foreground">{t("input.hint")}</p>
                </div>

                <div className="space-y-2">
                  <p id="phone-validator-mode-label" className="text-sm font-medium">
                    {t("mode.label")}
                  </p>
                  <div
                    role="group"
                    aria-labelledby="phone-validator-mode-label"
                    data-testid="phone-validator-mode-control"
                    className="grid gap-2 sm:grid-cols-2">
                    {modeIds.map((mode) => (
                      <Button
                        key={mode}
                        type="button"
                        variant={state.pais === mode ? "default" : "outline"}
                        aria-pressed={state.pais === mode}
                        data-testid={`phone-validator-mode-${mode}`}
                        className="justify-start"
                        onClick={() =>
                          setState((current) => ({
                            ...current,
                            pais: mode,
                          }))
                        }>
                        {t(`mode.options.${mode}`)}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{t("mode.hint")}</p>
                </div>

                <div className="space-y-2">
                  <p id="phone-validator-output-label" className="text-sm font-medium">
                    {t("output.label")}
                  </p>
                  <div
                    role="group"
                    aria-labelledby="phone-validator-output-label"
                    data-testid="phone-validator-output-control"
                    className="grid gap-2 sm:grid-cols-3">
                    {outputIds.map((output) => (
                      <Button
                        key={output}
                        type="button"
                        variant={state.saida === output ? "default" : "outline"}
                        aria-pressed={state.saida === output}
                        data-testid={`phone-validator-output-${output}`}
                        className="justify-start"
                        onClick={() =>
                          setState((current) => ({
                            ...current,
                            saida: output,
                          }))
                        }>
                        {t(`output.options.${output}`)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => updatePhone("")}
                    disabled={!state.telefone}
                    data-testid="phone-validator-clear">
                    <Trash2 className="h-4 w-4" />
                    {t("actions.clear")}
                  </Button>
                </div>
              </section>

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="phone-validator-share-title">
                <div>
                  <h2 id="phone-validator-share-title" className="font-semibold">
                    {t("share.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("share.description")}</p>
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    id="phone-validator-include-content"
                    data-testid="phone-validator-include-content"
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
                  data-testid="phone-validator-privacy"
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
                <div data-testid="phone-validator-share-button">
                  <ShareButton
                    className="w-full sm:w-auto"
                    getShareUrl={() => {
                      const shareUrl = buildPhoneValidatorShareUrl(
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

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="phone-validator-details-title">
                <div>
                  <h2 id="phone-validator-details-title" className="font-semibold">
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

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="phone-validator-related-title">
                <h2 id="phone-validator-related-title" className="font-semibold">
                  {t("related.title")}
                </h2>
                <div data-testid="phone-validator-related-links" className="grid gap-2 sm:grid-cols-2">
                  {relatedLinks.map((link) => (
                    <Link
                      key={link.id}
                      href={link.href}
                      className="rounded-lg border bg-muted/30 px-3 py-2 text-sm font-medium hover:bg-muted">
                      {t(`related.items.${link.id}`)}
                    </Link>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-5 rounded-lg border bg-muted/30 p-4" aria-labelledby="phone-validator-result-title">
              <div>
                <h2 id="phone-validator-result-title" className="font-semibold">
                  {t("result.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("result.description")}</p>
              </div>

              <div
                data-testid="phone-validator-status"
                aria-live="polite"
                className={cn(
                  "rounded-lg border bg-background p-4",
                  result.status === "valid" ? "border-emerald-200" : "",
                  result.status === "invalid" ? "border-red-200" : "",
                  result.status === "attention" ? "border-amber-300" : "",
                  result.status === "special" ? "border-sky-200" : ""
                )}>
                <div className="flex items-start gap-3">
                  <StatusIcon className={cn("mt-0.5 h-5 w-5 shrink-0", statusIcons[result.status].className)} />
                  <div className="min-w-0">
                    <p className="font-medium">{t(`result.status.${result.status}`)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{statusDescription}</p>
                  </div>
                </div>
              </div>

              {selectedOutput ? (
                <div className="space-y-2 rounded-lg border bg-background p-4">
                  <p className="text-sm font-medium">{selectedOutputLabel}</p>
                  <p
                    data-testid="phone-validator-selected-output"
                    className="break-all rounded-md bg-muted px-3 py-2 font-mono text-sm">
                    {selectedOutput}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("outputs.selectedHint")}</p>
                </div>
              ) : null}

              {formattedOutput ? (
                <div className="space-y-2 rounded-lg border bg-background p-4">
                  <p className="text-sm font-medium">
                    {result.serviceNumber ? t("outputs.service") : t("outputs.formatted")}
                  </p>
                  <p
                    data-testid="phone-validator-formatted-output"
                    className="break-all rounded-md bg-muted px-3 py-2 font-mono text-sm">
                    {formattedOutput}
                  </p>
                </div>
              ) : null}

              {result.e164 ? (
                <div className="space-y-2 rounded-lg border bg-background p-4">
                  <p className="text-sm font-medium">{t("outputs.e164")}</p>
                  <p
                    data-testid="phone-validator-e164-output"
                    className="break-all rounded-md bg-muted px-3 py-2 font-mono text-sm">
                    {result.e164}
                  </p>
                </div>
              ) : null}

              {result.digitsOnly ? (
                <div className="space-y-2 rounded-lg border bg-background p-4">
                  <p className="text-sm font-medium">{t("outputs.digits")}</p>
                  <p
                    data-testid="phone-validator-digits-output"
                    className="break-all rounded-md bg-muted px-3 py-2 font-mono text-sm">
                    {result.digitsOnly}
                  </p>
                </div>
              ) : null}

              {result.status !== "empty" ? (
                <div className="rounded-lg border bg-background p-4">
                  <p className="font-medium">{t("parts.title")}</p>
                  <dl data-testid="phone-validator-parts" className="mt-3 grid gap-2 text-sm">
                    {result.countryCode ? (
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">{t("parts.countryCode")}</dt>
                        <dd className="font-mono">{result.countryCode}</dd>
                      </div>
                    ) : null}
                    {result.ddd ? (
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">{t("parts.ddd")}</dt>
                        <dd className="font-mono">{result.ddd}</dd>
                      </div>
                    ) : null}
                    {result.accessCode ? (
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">{t("parts.accessCode")}</dt>
                        <dd className="break-all font-mono">{result.accessCode}</dd>
                      </div>
                    ) : null}
                    {result.dialingPrefix ? (
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">{t("parts.dialingPrefix")}</dt>
                        <dd className="font-mono">{result.dialingPrefix}</dd>
                      </div>
                    ) : null}
                    {result.extension ? (
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">{t("parts.extension")}</dt>
                        <dd className="break-all font-mono">{result.extension}</dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              ) : null}

              <div className="rounded-lg border bg-background p-4">
                <p className="font-medium">{t("diagnostics.title")}</p>
                <ul data-testid="phone-validator-diagnostics" className="mt-3 space-y-3">
                  {result.diagnostics.map((diagnostic) => {
                    const DiagnosticIcon = diagnosticIcons[diagnostic.status].icon;
                    const description =
                      diagnostic.issueCodes.length > 0
                        ? diagnostic.issueCodes.map((issueCode) => t(`issues.${issueCode}`)).join(" ")
                        : t(`diagnostics.items.${diagnostic.id}.pass`);

                    return (
                      <li
                        key={diagnostic.id}
                        data-testid={`phone-validator-check-${diagnostic.id}`}
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
                  onClick={() => copyToClipboard(formattedOutput, "formatted")}
                  disabled={!formattedOutput}
                  data-testid="phone-validator-copy-formatted">
                  {copied === "formatted" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "formatted" ? t("actions.copied") : t("actions.copyFormatted")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(result.e164, "e164")}
                  disabled={!result.e164}
                  data-testid="phone-validator-copy-e164">
                  {copied === "e164" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "e164" ? t("actions.copied") : t("actions.copyE164")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(result.digitsOnly, "digits")}
                  disabled={!result.digitsOnly}
                  data-testid="phone-validator-copy-digits">
                  {copied === "digits" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "digits" ? t("actions.copied") : t("actions.copyDigits")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(summaryText, "summary")}
                  disabled={result.status === "empty"}
                  data-testid="phone-validator-copy-summary">
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

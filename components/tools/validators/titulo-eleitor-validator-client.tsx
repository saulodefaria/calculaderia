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
  Eraser,
  Fingerprint,
  Info,
  ShieldCheck,
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
  buildTituloEleitorSearchParams,
  buildTituloEleitorShareUrl,
  defaultTituloEleitorValidatorState,
  readTituloEleitorContentFromFragment,
  readTituloEleitorSearchParams,
  validateTituloEleitor,
  type TituloEleitorDiagnosticStatus,
  type TituloEleitorValidationIssueCode,
  type TituloEleitorValidationStatus,
  type TituloEleitorValidatorState,
} from "@/lib/tools/titulo-eleitor";
import { cn } from "@/lib/utils/index";

const faqIds = ["privacy", "checks", "official", "uf", "leftPadding", "sharing"] as const;
const detailIds = ["structure", "modulo", "noLookup", "privacy"] as const;

const statusIcons: Record<TituloEleitorValidationStatus, { icon: LucideIcon; className: string }> = {
  empty: { icon: Fingerprint, className: "text-muted-foreground" },
  incomplete: { icon: AlertTriangle, className: "text-amber-600" },
  attention: { icon: AlertTriangle, className: "text-amber-600" },
  invalidFormat: { icon: XCircle, className: "text-red-600" },
  invalidUf: { icon: XCircle, className: "text-red-600" },
  invalidChecksum: { icon: XCircle, className: "text-red-600" },
  validChecksum: { icon: CheckCircle, className: "text-emerald-600" },
};

const diagnosticIcons: Record<TituloEleitorDiagnosticStatus, { icon: LucideIcon; className: string }> = {
  pass: { icon: CheckCircle, className: "text-emerald-600" },
  fail: { icon: XCircle, className: "text-red-600" },
  warn: { icon: AlertTriangle, className: "text-amber-600" },
  info: { icon: Info, className: "text-sky-600" },
};

function getPrimaryIssue(issues: TituloEleitorValidationIssueCode[]) {
  return (
    issues.find(
      (issue) =>
        !["empty", "trimmedWhitespace", "leftPadded", "checksumUnavailable", "validChecksum", "localOnly"].includes(
          issue
        )
    ) ?? null
  );
}

export function TituloEleitorValidatorClient() {
  const searchParams = useSearchParams();
  const t = useTranslations("tools.validador-titulo-eleitor.form");
  const tFaq = useTranslations("tools.validador-titulo-eleitor.faq");
  const [state, setState] = useState<TituloEleitorValidatorState>(() =>
    readTituloEleitorSearchParams(new URLSearchParams(searchParams.toString()))
  );
  const [includeContentShare, setIncludeContentShare] = useState(false);
  const [copiedAction, setCopiedAction] = useState<string | null>(null);
  const [fragmentNotice, setFragmentNotice] = useState<"hydrated" | "omitted" | null>(null);

  const result = useMemo(() => validateTituloEleitor(state.titulo), [state.titulo]);
  const liveParams = useMemo(() => buildTituloEleitorSearchParams(state).params, [state]);
  const primaryIssue = getPrimaryIssue(result.issueCodes);
  const StatusIcon = statusIcons[result.status].icon;
  const statusDescription =
    result.status === "validChecksum"
      ? t("result.validDescription")
      : result.status === "invalidChecksum"
        ? t("result.invalidChecksumDescription")
        : result.status === "invalidUf"
          ? t("result.invalidUfDescription")
          : result.status === "attention"
            ? t("result.attentionDescription")
            : result.status === "incomplete"
              ? t("result.incompleteDescription")
              : result.status === "invalidFormat" && primaryIssue
                ? t(`issues.${primaryIssue}`)
                : t("result.emptyDescription");
  const ufLabel = result.uf ? t(`uf.${result.uf.code}.name`) : t("result.unavailable");
  const checkDigitDescription =
    result.expectedCheckDigits && result.providedCheckDigits
      ? t("result.checkDigitValue", {
          provided: result.providedCheckDigits,
          expected: result.expectedCheckDigits,
        })
      : t("result.checkDigitUnavailable");
  const explanationKey =
    result.status === "attention" && result.checksumValid === false
      ? "attentionInvalidChecksum"
      : result.status === "attention" && result.checksumValid === true
        ? "attentionValidChecksum"
        : result.status;
  const summaryText = [
    t("summary.number", { value: result.maskedNumber || t("summary.emptyValue") }),
    t("summary.uf", { value: result.ufCode ? `${result.ufCode} - ${ufLabel}` : t("summary.emptyValue") }),
    t("summary.status", { value: t(`result.status.${result.status}`) }),
    checkDigitDescription,
    t("summary.scope"),
  ].join("\n");

  useEffect(() => {
    const fragmentState = readTituloEleitorContentFromFragment(window.location.hash);
    const deferStateUpdate =
      typeof window.queueMicrotask === "function"
        ? window.queueMicrotask.bind(window)
        : (callback: () => void) => {
            window.setTimeout(callback, 0);
          };

    if (fragmentState.hasExplicitContent) {
      deferStateUpdate(() => {
        setState({ titulo: fragmentState.titulo });
        setIncludeContentShare(false);
        setFragmentNotice("hydrated");
      });
    } else if (fragmentState.contentOmitted) {
      deferStateUpdate(() => setFragmentNotice("omitted"));
    }
  }, []);

  useEffect(() => {
    replaceQueryString(liveParams);
  }, [liveParams]);

  const updateTitleNumber = (titulo: string) => {
    setCopiedAction(null);
    setState({ titulo });
  };

  const clear = () => {
    setCopiedAction(null);
    setFragmentNotice(null);
    setIncludeContentShare(false);
    setState(defaultTituloEleitorValidatorState);
  };

  const copyText = async (action: string, value: string | null) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopiedAction(action);
      window.setTimeout(() => setCopiedAction(null), 2000);
    } catch {
      setCopiedAction(null);
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
              <section className="space-y-4 rounded-lg border p-4" aria-labelledby="titulo-eleitor-input-title">
                <div>
                  <h2 id="titulo-eleitor-input-title" className="font-semibold">
                    {t("input.title")}
                  </h2>
                  <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {t("input.privacy")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="titulo-eleitor-validator-input">{t("input.label")}</Label>
                  <Input
                    id="titulo-eleitor-validator-input"
                    data-testid="titulo-eleitor-validator-input"
                    type="text"
                    inputMode="numeric"
                    autoCapitalize="none"
                    autoComplete="off"
                    spellCheck={false}
                    value={state.titulo}
                    onChange={(event) => updateTitleNumber(event.target.value)}
                    placeholder={t("input.placeholder")}
                    aria-invalid={["invalidFormat", "invalidUf", "invalidChecksum"].includes(result.status)}
                  />
                  <p className="text-xs text-muted-foreground">{t("input.hint")}</p>
                </div>

                {fragmentNotice ? (
                  <p
                    data-testid="titulo-eleitor-validator-fragment-notice"
                    className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                    {t(`fragment.${fragmentNotice}`)}
                  </p>
                ) : null}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clear}
                    disabled={!state.titulo && !includeContentShare}
                    data-testid="titulo-eleitor-validator-clear">
                    <Eraser className="h-4 w-4" />
                    {t("actions.clear")}
                  </Button>
                </div>
              </section>

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="titulo-eleitor-share-title">
                <div>
                  <h2 id="titulo-eleitor-share-title" className="font-semibold">
                    {t("share.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("share.description")}</p>
                </div>
                <label className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
                  <input
                    id="titulo-eleitor-validator-include-content"
                    data-testid="titulo-eleitor-validator-include-content"
                    type="checkbox"
                    checked={includeContentShare}
                    onChange={(event) => setIncludeContentShare(event.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-medium">{t("share.includeContentLabel")}</span>
                    <span className="block text-muted-foreground">{t("share.includeContentHint")}</span>
                  </span>
                </label>
                <p className="text-sm text-muted-foreground">{t("share.safe")}</p>
                <div data-testid="titulo-eleitor-validator-share-button">
                  <ShareButton
                    className="w-full sm:w-auto"
                    getShareUrl={() =>
                      buildTituloEleitorShareUrl(
                        `${window.location.origin}${window.location.pathname}`,
                        state,
                        { includeContent: includeContentShare }
                      ).url
                    }
                  />
                </div>
              </section>

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="titulo-eleitor-details-title">
                <div>
                  <h2 id="titulo-eleitor-details-title" className="font-semibold">
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

            <aside className="space-y-5 rounded-lg border bg-muted/30 p-4" aria-labelledby="titulo-eleitor-result-title">
              <div>
                <h2 id="titulo-eleitor-result-title" className="font-semibold">
                  {t("result.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("result.description")}</p>
              </div>

              <div
                data-testid="titulo-eleitor-validator-status"
                aria-live="polite"
                className={cn(
                  "rounded-lg border bg-background p-4",
                  result.status === "validChecksum" ? "border-emerald-200" : "",
                  ["invalidFormat", "invalidUf", "invalidChecksum"].includes(result.status) ? "border-red-200" : "",
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

              {result.canonicalDigits ? (
                <div className="space-y-3 rounded-lg border bg-background p-4">
                  <p className="text-sm font-medium">{t("result.numberLabel")}</p>
                  <p
                    data-testid="titulo-eleitor-validator-canonical-output"
                    className="break-all rounded-md bg-muted px-3 py-2 font-mono text-sm">
                    {result.canonicalDigits}
                  </p>
                  <p
                    data-testid="titulo-eleitor-validator-formatted-output"
                    className="break-all rounded-md bg-muted px-3 py-2 font-mono text-sm">
                    {result.formattedNumber}
                  </p>
                  {result.leftPadded ? <p className="text-xs text-amber-700">{t("result.leftPaddedHint")}</p> : null}
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyText("canonical", result.canonicalDigits)}
                      data-testid="titulo-eleitor-validator-copy-canonical">
                      {copiedAction === "canonical" ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                      {copiedAction === "canonical" ? t("actions.copied") : t("actions.copyCanonical")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyText("formatted", result.formattedNumber)}
                      data-testid="titulo-eleitor-validator-copy-formatted">
                      {copiedAction === "formatted" ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                      {copiedAction === "formatted" ? t("actions.copied") : t("actions.copyFormatted")}
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border bg-background p-4">
                  <p className="text-sm font-medium">{t("result.ufLabel")}</p>
                  <p data-testid="titulo-eleitor-validator-uf-output" className="mt-1 text-sm text-muted-foreground">
                    {result.ufCode ? `${result.ufCode} - ${ufLabel}` : t("result.unavailable")}
                  </p>
                </div>
                <div className="rounded-lg border bg-background p-4">
                  <p className="text-sm font-medium">{t("result.checkDigitLabel")}</p>
                  <p data-testid="titulo-eleitor-validator-expected-dvs" className="mt-1 text-sm text-muted-foreground">
                    {result.expectedCheckDigits ?? t("result.unavailable")}
                  </p>
                  <p data-testid="titulo-eleitor-validator-provided-dvs" className="mt-1 text-xs text-muted-foreground">
                    {result.providedCheckDigits
                      ? t("result.providedDigits", { value: result.providedCheckDigits })
                      : t("result.checkDigitUnavailable")}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border bg-background p-4">
                <p className="font-medium">{t("diagnostics.title")}</p>
                <ul data-testid="titulo-eleitor-validator-diagnostics" className="mt-3 space-y-3">
                  {result.diagnostics.map((diagnostic) => {
                    const DiagnosticIcon = diagnosticIcons[diagnostic.status].icon;
                    const description =
                      diagnostic.issueCodes.length > 0
                        ? diagnostic.issueCodes.map((issueCode) => t(`issues.${issueCode}`)).join(" ")
                        : t(`diagnostics.items.${diagnostic.id}.pass`);

                    return (
                      <li
                        key={diagnostic.id}
                        data-testid={`titulo-eleitor-validator-check-${diagnostic.id}`}
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
                onClick={() => copyText("summary", result.status === "empty" ? null : summaryText)}
                disabled={result.status === "empty"}
                data-testid="titulo-eleitor-validator-copy-summary">
                {copiedAction === "summary" ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                {copiedAction === "summary" ? t("actions.copied") : t("actions.copySummary")}
              </Button>

              <div className="rounded-lg border bg-background p-4">
                <p className="flex items-start gap-2 text-sm text-muted-foreground">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                  {t(`result.explanation.${explanationKey}`)}
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

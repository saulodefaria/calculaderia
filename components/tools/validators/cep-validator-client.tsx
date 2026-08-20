"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  Check,
  CheckCircle,
  Copy,
  ExternalLink,
  Info,
  MapPin,
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
  buildCepValidatorSearchParams,
  buildCepValidatorShareUrl,
  cepOutputModes,
  readCepValidatorContentFromFragment,
  readCepValidatorStateFromParams,
  validateCepFormat,
  type CepDiagnosticStatus,
  type CepOutputMode,
  type CepValidationIssue,
  type CepValidationStatus,
  type CepValidatorState,
} from "@/lib/tools/cep";
import { cn } from "@/lib/utils/index";

const faqIds = ["privacy", "existence", "format", "raw", "lookup", "sharing"] as const;
const detailIds = ["local", "mask", "structure", "lookup", "privacy"] as const;
const correiosBuscaCepUrl = "https://buscacepinter.correios.com.br/app/endereco/index.php";

const statusIcons: Record<CepValidationStatus, { icon: LucideIcon; className: string }> = {
  empty: { icon: MapPin, className: "text-muted-foreground" },
  incomplete: { icon: Info, className: "text-sky-600" },
  validFormat: { icon: CheckCircle, className: "text-emerald-600" },
  invalid: { icon: XCircle, className: "text-red-600" },
  attention: { icon: AlertTriangle, className: "text-amber-600" },
};

const diagnosticIcons: Record<CepDiagnosticStatus, { icon: LucideIcon; className: string }> = {
  pass: { icon: CheckCircle, className: "text-emerald-600" },
  fail: { icon: XCircle, className: "text-red-600" },
  warn: { icon: AlertTriangle, className: "text-amber-600" },
  info: { icon: Info, className: "text-sky-600" },
};

function getPrimaryIssue(issues: CepValidationIssue[]) {
  return issues.find((issue) => issue.code !== "empty" && issue.code !== "syntaxOnly") ?? null;
}

export function CepValidatorClient() {
  const searchParams = useSearchParams();
  const t = useTranslations("tools.validador-cep.form");
  const tFaq = useTranslations("tools.validador-cep.faq");
  const hasReadContentFragment = useRef(false);
  const [state, setState] = useState<CepValidatorState>(() =>
    readCepValidatorStateFromParams(new URLSearchParams(searchParams.toString()))
  );
  const [includeContentInUrl, setIncludeContentInUrl] = useState(false);
  const [shareContentOmitted, setShareContentOmitted] = useState(false);
  const [copied, setCopied] = useState<"formatted" | "raw" | null>(null);

  const result = useMemo(() => validateCepFormat(state.cep, state.saida), [state.cep, state.saida]);
  const liveParams = useMemo(
    () =>
      buildCepValidatorSearchParams({
        cep: "",
        saida: state.saida,
      }).params,
    [state.saida]
  );
  const primaryIssue = getPrimaryIssue(result.issues);
  const remainingDigits = Math.max(0, result.requiredDigits - Math.min(result.digitCount, result.requiredDigits));
  const StatusIcon = statusIcons[result.status].icon;
  const statusDescription =
    result.status === "validFormat"
      ? t("result.validDescription")
      : result.status === "incomplete"
        ? t("result.incompleteDescription", { remaining: remainingDigits })
        : result.status === "attention" && primaryIssue
          ? t(`issues.${primaryIssue.code}`, {
              characters: primaryIssue.characters ?? "",
              count: primaryIssue.count ?? 0,
              value: primaryIssue.value ?? "",
            })
          : result.status === "invalid" && primaryIssue
            ? t(`issues.${primaryIssue.code}`, {
                characters: primaryIssue.characters ?? "",
                count: primaryIssue.count ?? 0,
                value: primaryIssue.value ?? "",
              })
            : t("result.emptyDescription");
  const hasCopyableCep = result.rawDigits.length === result.requiredDigits && result.status !== "invalid";
  const primaryOutputLabel = state.saida === "digitos" ? t("result.rawLabel") : t("result.formattedLabel");
  const primaryOutput = state.saida === "digitos" ? result.rawDigits : result.formattedCep;

  useEffect(() => {
    if (hasReadContentFragment.current) return;

    hasReadContentFragment.current = true;
    const contentFragment = readCepValidatorContentFromFragment(window.location.hash);
    if (!contentFragment.hasExplicitContent) return;

    const timeoutId = window.setTimeout(() => {
      setState((current) => ({
        ...current,
        cep: contentFragment.cep,
      }));
      setIncludeContentInUrl(true);
      setShareContentOmitted(contentFragment.contentOmitted);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    replaceQueryString(liveParams);
  }, [liveParams]);

  const updateState = (patch: Partial<CepValidatorState>) => {
    setShareContentOmitted(false);
    setCopied(null);
    setState((current) => ({
      ...current,
      ...patch,
    }));
  };

  const copyToClipboard = async (value: string, type: "formatted" | "raw") => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  const renderIssue = (issue: CepValidationIssue) =>
    t(`issues.${issue.code}`, {
      characters: issue.characters ?? "",
      count: issue.count ?? 0,
      value: issue.value ?? "",
    });

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
              <section className="space-y-4 rounded-lg border p-4" aria-labelledby="cep-validator-input-title">
                <div>
                  <h2 id="cep-validator-input-title" className="font-semibold">
                    {t("input.title")}
                  </h2>
                  <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {t("input.privacy")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cep-validator-input">{t("input.label")}</Label>
                  <Input
                    id="cep-validator-input"
                    data-testid="cep-validator-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={state.cep}
                    onChange={(event) => updateState({ cep: event.target.value })}
                    placeholder={t("input.placeholder")}
                    aria-invalid={result.status === "invalid"}
                  />
                  <p className="text-xs text-muted-foreground">{t("input.hint")}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">{t("outputMode.label")}</p>
                  <div data-testid="cep-validator-output-mode" className="grid gap-2 sm:grid-cols-2">
                    {cepOutputModes.map((mode) => (
                      <Button
                        key={mode}
                        type="button"
                        variant={state.saida === mode ? "default" : "outline"}
                        aria-pressed={state.saida === mode}
                        data-testid={`cep-validator-output-${mode}`}
                        onClick={() => updateState({ saida: mode as CepOutputMode })}>
                        {t(`outputMode.options.${mode}`)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => updateState({ cep: "" })}
                    disabled={!state.cep}
                    data-testid="cep-validator-clear">
                    <Trash2 className="h-4 w-4" />
                    {t("actions.clear")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => updateState({ cep: "01001-000" })}
                    data-testid="cep-validator-example">
                    <MapPin className="h-4 w-4" />
                    {t("actions.example")}
                  </Button>
                </div>
              </section>

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="cep-validator-share-title">
                <div>
                  <h2 id="cep-validator-share-title" className="font-semibold">
                    {t("share.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("share.description")}</p>
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    id="cep-validator-include-content"
                    data-testid="cep-validator-include-content"
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
                <div data-testid="cep-validator-share-button">
                  <ShareButton
                    className="w-full sm:w-auto"
                    getShareUrl={() => {
                      const shareUrl = buildCepValidatorShareUrl(
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

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="cep-validator-details-title">
                <div>
                  <h2 id="cep-validator-details-title" className="font-semibold">
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
                <a
                  href={correiosBuscaCepUrl}
                  target="_blank"
                  rel="noreferrer"
                  data-testid="cep-validator-correios-link"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline">
                  {t("details.officialLookup")}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </section>
            </div>

            <aside className="space-y-5 rounded-lg border bg-muted/30 p-4" aria-labelledby="cep-validator-result-title">
              <div>
                <h2 id="cep-validator-result-title" className="font-semibold">
                  {t("result.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("result.description")}</p>
              </div>

              <div
                data-testid="cep-validator-status"
                aria-live="polite"
                className={cn(
                  "rounded-lg border bg-background p-4",
                  result.status === "validFormat" ? "border-emerald-200" : "",
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

              <div className="space-y-3 rounded-lg border bg-background p-4">
                <div>
                  <p className="text-sm font-medium">{primaryOutputLabel}</p>
                  <p
                    data-testid="cep-validator-primary-output"
                    className="mt-2 min-h-9 break-all rounded-md bg-muted px-3 py-2 font-mono text-sm">
                    {primaryOutput || t("result.noOutput")}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{t("result.formattedLabel")}</p>
                    <p
                      data-testid="cep-validator-formatted-output"
                      className="mt-1 min-h-8 break-all rounded-md bg-muted px-3 py-2 font-mono text-sm">
                      {result.formattedCep || t("result.noOutput")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{t("result.rawLabel")}</p>
                    <p
                      data-testid="cep-validator-raw-output"
                      className="mt-1 min-h-8 break-all rounded-md bg-muted px-3 py-2 font-mono text-sm">
                      {result.rawDigits || t("result.noOutput")}
                    </p>
                  </div>
                </div>
                <p data-testid="cep-validator-length-summary" className="text-sm text-muted-foreground">
                  {t("result.lengthSummary", { count: result.digitCount, required: result.requiredDigits })}
                </p>
              </div>

              <div className="rounded-lg border bg-background p-4">
                <p className="font-medium">{t("issues.title")}</p>
                <ul data-testid="cep-validator-issue-list" className="mt-3 space-y-2">
                  {result.issues.length === 0 ? (
                    <li className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      {t("issues.none")}
                    </li>
                  ) : (
                    result.issues.map((issue) => (
                      <li key={issue.code} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        <span className="min-w-0 break-words">{renderIssue(issue)}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div className="rounded-lg border bg-background p-4">
                <p className="font-medium">{t("diagnostics.title")}</p>
                <ul data-testid="cep-validator-diagnostics" className="mt-3 space-y-3">
                  {result.diagnostics.map((diagnostic) => {
                    const DiagnosticIcon = diagnosticIcons[diagnostic.status].icon;
                    const description =
                      diagnostic.issueCodes.length > 0
                        ? diagnostic.issueCodes
                            .map((issueCode) => renderIssue(result.issues.find((issue) => issue.code === issueCode) ?? { code: issueCode }))
                            .join(" ")
                        : t(`diagnostics.items.${diagnostic.id}.pass`);

                    return (
                      <li
                        key={diagnostic.id}
                        data-testid={`cep-validator-check-${diagnostic.id}`}
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
                  onClick={() => copyToClipboard(result.formattedCep, "formatted")}
                  disabled={!hasCopyableCep}
                  data-testid="cep-validator-copy-formatted">
                  {copied === "formatted" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "formatted" ? t("actions.copied") : t("actions.copyFormatted")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(result.rawDigits, "raw")}
                  disabled={!hasCopyableCep}
                  data-testid="cep-validator-copy-raw">
                  {copied === "raw" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "raw" ? t("actions.copied") : t("actions.copyRaw")}
                </Button>
              </div>

              <div className="rounded-lg border bg-background p-4">
                <p className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
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

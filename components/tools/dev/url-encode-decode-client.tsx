"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertTriangle,
  Check,
  ClipboardCopy,
  Copy,
  Download,
  Link2,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ShareButton } from "@/components/ui/share-button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { replaceQueryString } from "@/components/tools/url-state";
import {
  URL_ENCODING_MAX_INPUT_LENGTH,
  buildUrlEncodingSearchParams,
  buildUrlEncodingShareUrl,
  processUrlEncoding,
  readUrlEncodingContentFromFragment,
  readUrlEncodingStateFromParams,
  type UrlEncodingContext,
  type UrlEncodingMode,
  type UrlEncodingState,
  type UrlEncodingTextMetrics,
  type UrlEncodingWarning,
} from "@/lib/tools/url-encoding";
import { cn } from "@/lib/utils/index";

const editorClassName =
  "border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 min-h-72 w-full min-w-0 resize-y rounded-md border bg-transparent px-3 py-2 font-mono text-sm leading-relaxed shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive";

const modeIds = ["codificar", "decodificar"] as const;
const contextIds = ["componente", "uri", "form"] as const;
const exampleIds = ["component", "uri", "form"] as const;
const faqIds = ["privacy", "difference", "space", "percent25", "decodeFailed", "safety", "sharing"] as const;

type ExampleId = (typeof exampleIds)[number];

const examples: Record<ExampleId, Pick<UrlEncodingState, "input" | "mode" | "context" | "strict">> = {
  component: {
    input: "café com açúcar & valor=10/20?",
    mode: "codificar",
    context: "componente",
    strict: false,
  },
  uri: {
    input: "https://exemplo.test/a b?nome=Ana Maria&ok=sim#secao",
    mode: "codificar",
    context: "uri",
    strict: false,
  },
  form: {
    input: "Joao Maria+Silva",
    mode: "codificar",
    context: "form",
    strict: false,
  },
};

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function getMetricsRows(metrics: UrlEncodingTextMetrics | null) {
  if (!metrics) return [];

  return [
    ["characters", metrics.characters],
    ["bytes", metrics.bytes],
    ["lines", metrics.lines],
    ["percentTriplets", metrics.percentTriplets],
  ] as const;
}

export function UrlEncodeDecodeClient() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("tools.url-encode-decode.form");
  const tFaq = useTranslations("tools.url-encode-decode.faq");
  const hasReadContentFragment = useRef(false);
  const [state, setState] = useState<UrlEncodingState>(() =>
    readUrlEncodingStateFromParams(new URLSearchParams(searchParams.toString()))
  );
  const [includeContentInUrl, setIncludeContentInUrl] = useState(false);
  const [shareContentOmitted, setShareContentOmitted] = useState(false);
  const [copied, setCopied] = useState<"result" | "error" | null>(null);

  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const result = useMemo(() => processUrlEncoding(state), [state]);
  const liveParams = useMemo(
    () =>
      buildUrlEncodingSearchParams({
        input: "",
        mode: state.mode,
        context: state.context,
        strict: state.strict,
      }).params,
    [state.context, state.mode, state.strict]
  );
  const contextLabel = t(`contexts.${result.context}`);
  const strictApplies = state.mode === "codificar" && state.context === "componente";
  const successSummary =
    result.status === "valid"
      ? state.mode === "codificar"
        ? t("result.validEncodeDescription", {
            context: contextLabel,
            bytes: numberFormatter.format(result.outputMetrics?.bytes ?? 0),
          })
        : t("result.validDecodeDescription", {
            context: contextLabel,
            bytes: numberFormatter.format(result.outputMetrics?.bytes ?? 0),
          })
      : "";
  const errorCopyValue =
    result.error === null
      ? ""
      : [
          t(`errors.${result.error.code}`),
          result.error.percentIndex !== undefined
            ? t("errors.percentIndex", { index: numberFormatter.format(result.error.percentIndex) })
            : "",
          result.error.engineMessage ? t("errors.engine", { message: result.error.engineMessage }) : "",
          t("errors.diagnostic", { code: result.error.code }),
        ]
          .filter(Boolean)
          .join("\n");

  useEffect(() => {
    if (hasReadContentFragment.current) return;

    hasReadContentFragment.current = true;
    const contentFragment = readUrlEncodingContentFromFragment(window.location.hash);
    if (!contentFragment.hasExplicitContent) return;

    const timeoutId = window.setTimeout(() => {
      setState((current) => ({
        ...current,
        input: contentFragment.input,
      }));
      setIncludeContentInUrl(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    replaceQueryString(liveParams);
  }, [liveParams]);

  const updateState = (patch: Partial<UrlEncodingState>) => {
    setShareContentOmitted(false);
    setState((current) => ({
      ...current,
      ...patch,
    }));
  };

  const copyToClipboard = async (value: string, type: "result" | "error") => {
    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const swapOutputIntoInput = () => {
    if (!result.output) return;

    updateState({
      input: result.output,
      mode: state.mode === "codificar" ? "decodificar" : "codificar",
    });
  };

  const downloadText = () => {
    if (!result.output) return;

    downloadBlob(new Blob([result.output], { type: "text/plain;charset=utf-8" }), "url-encode-decode.txt");
  };

  const loadExample = (exampleId: ExampleId) => {
    updateState(examples[exampleId]);
  };

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div className="space-y-6">
              <section className="space-y-4 rounded-lg border p-4" aria-labelledby="url-encode-decode-input-title">
                <div>
                  <h2 id="url-encode-decode-input-title" className="font-semibold">
                    {t("input.title")}
                  </h2>
                  <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {t("input.privacy")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url-encode-decode-input">{t("input.label")}</Label>
                  <textarea
                    id="url-encode-decode-input"
                    data-testid="url-encode-decode-input"
                    className={editorClassName}
                    value={state.input}
                    onChange={(event) => updateState({ input: event.target.value })}
                    placeholder={t("input.placeholder")}
                    spellCheck={false}
                    aria-invalid={
                      result.status === "malformedPercent" ||
                      result.status === "invalidUtf8" ||
                      result.status === "invalidUnicode" ||
                      result.status === "tooLarge"
                    }
                  />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => updateState({ input: "" })}
                    disabled={!state.input}
                    data-testid="url-encode-decode-clear">
                    <Trash2 className="h-4 w-4" />
                    {t("actions.clear")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={swapOutputIntoInput}
                    disabled={!result.output}
                    data-testid="url-encode-decode-swap">
                    <RotateCcw className="h-4 w-4" />
                    {t("actions.swap")}
                  </Button>
                </div>
              </section>

              <section className="space-y-4 rounded-lg border p-4" aria-labelledby="url-encode-decode-options-title">
                <div>
                  <h2 id="url-encode-decode-options-title" className="font-semibold">
                    {t("options.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("options.description")}</p>
                </div>
                <div className="space-y-2">
                  <Label>{t("modes.label")}</Label>
                  <Tabs
                    value={state.mode}
                    onValueChange={(value) => updateState({ mode: value as UrlEncodingMode })}
                    data-testid="url-encode-decode-mode-selector">
                    <TabsList className="grid h-auto w-full grid-cols-2">
                      {modeIds.map((mode) => (
                        <TabsTrigger key={mode} value={mode} data-testid={`url-encode-decode-mode-${mode}`}>
                          {t(`modes.${mode}`)}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
                <fieldset className="space-y-2" data-testid="url-encode-decode-context-selector">
                  <legend className="text-sm font-medium">{t("contexts.label")}</legend>
                  <div className="grid gap-2 md:grid-cols-3">
                    {contextIds.map((context) => (
                      <Button
                        key={context}
                        type="button"
                        variant={state.context === context ? "default" : "outline"}
                        onClick={() => updateState({ context: context as UrlEncodingContext })}
                        aria-pressed={state.context === context}
                        data-testid={`url-encode-decode-context-${context}`}
                        className="h-auto min-h-11 w-full whitespace-normal text-left">
                        {t(`contexts.${context}`)}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{t("contexts.description")}</p>
                </fieldset>
                <label
                  className={cn(
                    "flex items-start gap-2 rounded-lg border p-3 text-sm",
                    strictApplies ? "" : "opacity-75"
                  )}>
                  <input
                    id="url-encode-decode-strict"
                    data-testid="url-encode-decode-strict"
                    type="checkbox"
                    checked={state.strict}
                    disabled={!strictApplies}
                    onChange={(event) => updateState({ strict: event.target.checked })}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-medium">{t("strict.label")}</span>
                    <span className="block text-muted-foreground">
                      {strictApplies ? t("strict.description") : t("strict.disabled")}
                    </span>
                  </span>
                </label>
                <div className="space-y-2" data-testid="url-encode-decode-examples">
                  <p className="text-sm font-medium">{t("examples.title")}</p>
                  <div className="grid gap-2 md:grid-cols-3">
                    {exampleIds.map((exampleId) => (
                      <Button
                        key={exampleId}
                        type="button"
                        variant="outline"
                        onClick={() => loadExample(exampleId)}
                        data-testid={`url-encode-decode-example-${exampleId}`}
                        className="h-auto min-h-11 w-full whitespace-normal text-left">
                        {t(`examples.${exampleId}`)}
                      </Button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="url-encode-decode-share-title">
                <div>
                  <h2 id="url-encode-decode-share-title" className="font-semibold">
                    {t("share.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("share.description")}</p>
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    id="url-encode-decode-include-content"
                    data-testid="url-encode-decode-include-content"
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
                <div data-testid="url-encode-decode-share-button">
                  <ShareButton
                    className="w-full sm:w-auto"
                    getShareUrl={() => {
                      const shareUrl = buildUrlEncodingShareUrl(
                        `${window.location.origin}${window.location.pathname}`,
                        state,
                        {
                          includeContent: includeContentInUrl,
                        }
                      );
                      setShareContentOmitted(shareUrl.contentOmitted);

                      return shareUrl.url;
                    }}
                  />
                </div>
              </section>
            </div>

            <aside className="space-y-5 rounded-lg border bg-muted/30 p-4" aria-labelledby="url-encode-decode-results">
              <div>
                <h2 id="url-encode-decode-results" className="font-semibold">
                  {t("result.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("result.description")}</p>
              </div>

              <div
                data-testid="url-encode-decode-status"
                aria-live="polite"
                className={cn(
                  "rounded-lg border bg-background p-4",
                  result.status === "valid" ? "border-emerald-200" : "",
                  result.status !== "empty" && result.status !== "valid" ? "border-amber-300" : ""
                )}>
                <div className="flex items-start gap-3">
                  {result.status === "valid" ? (
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  ) : result.status === "empty" ? (
                    <Link2 className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium">{t(`result.status.${result.status}`)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {result.status === "valid"
                        ? successSummary
                        : result.status === "tooLarge"
                          ? t("result.tooLargeDescription", {
                              limit: numberFormatter.format(URL_ENCODING_MAX_INPUT_LENGTH),
                            })
                          : result.status === "malformedPercent"
                            ? t("result.malformedPercentDescription")
                            : result.status === "invalidUtf8"
                              ? t("result.invalidUtf8Description")
                              : result.status === "invalidUnicode"
                                ? t("result.invalidUnicodeDescription")
                                : t("result.emptyDescription")}
                    </p>
                  </div>
                </div>
              </div>

              {result.warnings.length > 0 ? (
                <div className="flex flex-wrap gap-2" data-testid="url-encode-decode-warnings">
                  {result.warnings.map((warning: UrlEncodingWarning) => (
                    <span
                      key={warning}
                      data-testid={`url-encode-decode-warning-${warning}`}
                      className="rounded-full border border-amber-300 bg-background px-3 py-1 text-xs text-amber-700 dark:text-amber-300">
                      {t(`warnings.${warning}`)}
                    </span>
                  ))}
                </div>
              ) : null}

              {result.status !== "empty" && result.status !== "valid" ? (
                <div
                  data-testid="url-encode-decode-error"
                  className="space-y-3 rounded-lg border border-amber-300 bg-background p-4">
                  <p className="font-medium">
                    {result.error ? t(`errors.${result.error.code}`) : t("errors.malformedPercent")}
                  </p>
                  {result.normalizedInput ? (
                    <p className="break-words text-xs text-muted-foreground">
                      {t("errors.normalizedLength", {
                        characters: numberFormatter.format(Array.from(result.normalizedInput).length),
                      })}
                    </p>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => copyToClipboard(errorCopyValue, "error")}
                    disabled={!errorCopyValue}
                    data-testid="url-encode-decode-copy-error"
                    className="w-full">
                    {copied === "error" ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                    {copied === "error" ? t("actions.copied") : t("actions.copyError")}
                  </Button>
                </div>
              ) : null}

              {result.output ? (
                <div className="space-y-2">
                  <Label htmlFor="url-encode-decode-output">{t("result.outputLabel")}</Label>
                  <textarea
                    id="url-encode-decode-output"
                    data-testid="url-encode-decode-output"
                    readOnly
                    className={cn(editorClassName, "min-h-64 bg-background")}
                    value={result.output}
                  />
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border bg-background p-3">
                  <p className="text-xs font-medium text-muted-foreground">{t("metrics.input")}</p>
                  <div className="mt-2 space-y-1">
                    {getMetricsRows(result.inputMetrics).map(([metricId, value]) => (
                      <p key={metricId} className="flex justify-between gap-3 text-sm">
                        <span>{t(`metrics.${metricId}`)}</span>
                        <span
                          data-testid={`url-encode-decode-metric-input-${metricId}`}
                          className="font-medium tabular-nums">
                          {numberFormatter.format(value)}
                        </span>
                      </p>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <p className="text-xs font-medium text-muted-foreground">{t("metrics.output")}</p>
                  <div className="mt-2 space-y-1">
                    {getMetricsRows(result.outputMetrics).length > 0 ? (
                      getMetricsRows(result.outputMetrics).map(([metricId, value]) => (
                        <p key={metricId} className="flex justify-between gap-3 text-sm">
                          <span>{t(`metrics.${metricId}`)}</span>
                          <span
                            data-testid={`url-encode-decode-metric-output-${metricId}`}
                            className="font-medium tabular-nums">
                            {numberFormatter.format(value)}
                          </span>
                        </p>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">{t("metrics.noOutput")}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(result.output, "result")}
                  disabled={!result.output}
                  data-testid="url-encode-decode-copy-result">
                  {copied === "result" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "result" ? t("actions.copied") : t("actions.copyResult")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadText}
                  disabled={!result.output}
                  data-testid="url-encode-decode-download">
                  <Download className="h-4 w-4" />
                  {t("actions.download")}
                </Button>
              </div>
            </aside>
          </div>
        </CardContent>
      </Card>

      <section className="mb-8 rounded-lg border p-6" aria-labelledby="url-encode-decode-seo-details">
        <h2 id="url-encode-decode-seo-details" className="text-2xl font-semibold tracking-tight">
          {t("seoDetails.title")}
        </h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <div className="space-y-2">
            <h3 className="font-semibold">{t("seoDetails.percentTitle")}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("seoDetails.percentDescription")}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">{t("seoDetails.contextTitle")}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("seoDetails.contextDescription")}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">{t("seoDetails.privacyTitle")}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("seoDetails.privacyDescription")}</p>
          </div>
        </div>
      </section>

      <section className="mb-8 rounded-lg border p-6" aria-labelledby="url-encode-decode-faq">
        <h2 id="url-encode-decode-faq" className="text-2xl font-semibold tracking-tight">
          {tFaq("title")}
        </h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {faqIds.map((faqId) => (
            <div key={faqId} className="space-y-2">
              <h3 className="font-semibold">{tFaq(`${faqId}.question`)}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{tFaq(`${faqId}.answer`)}</p>
            </div>
          ))}
        </div>
      </section>

    </>
  );
}

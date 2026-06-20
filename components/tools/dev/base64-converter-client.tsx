"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertTriangle,
  Check,
  ClipboardCopy,
  Code2,
  Copy,
  Download,
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
  BASE64_CONVERTER_MAX_INPUT_LENGTH,
  buildBase64SearchParams,
  buildBase64ShareUrl,
  processBase64Converter,
  readBase64ContentFromFragment,
  readBase64StateFromParams,
  type Base64Alphabet,
  type Base64ConverterMode,
  type Base64ConverterState,
  type Base64ConverterWarning,
  type Base64TextMetrics,
} from "@/lib/tools/base64";
import { cn } from "@/lib/utils/index";

const editorClassName =
  "border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 min-h-72 w-full min-w-0 resize-y rounded-md border bg-transparent px-3 py-2 font-mono text-sm leading-relaxed shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive";

const modeIds = ["codificar", "decodificar"] as const;
const alphabetIds = ["base64", "base64url"] as const;
const faqIds = ["encryption", "privacy", "difference", "invalidUtf8", "padding", "sharing"] as const;

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function getMetricsRows(metrics: Base64TextMetrics | null) {
  if (!metrics) return [];

  return [
    ["characters", metrics.characters],
    ["bytes", metrics.bytes],
  ] as const;
}

export function Base64ConverterClient() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("tools.conversor-base64.form");
  const tFaq = useTranslations("tools.conversor-base64.faq");
  const hasReadContentFragment = useRef(false);
  const [state, setState] = useState<Base64ConverterState>(() =>
    readBase64StateFromParams(new URLSearchParams(searchParams.toString()))
  );
  const [includeContentInUrl, setIncludeContentInUrl] = useState(false);
  const [shareContentOmitted, setShareContentOmitted] = useState(false);
  const [copied, setCopied] = useState<"result" | "error" | null>(null);

  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const result = useMemo(() => processBase64Converter(state), [state]);
  const liveParams = useMemo(
    () =>
      buildBase64SearchParams({
        input: "",
        mode: state.mode,
        alphabet: state.alphabet,
        padding: state.padding,
        ignoreWhitespace: state.ignoreWhitespace,
      }).params,
    [state.alphabet, state.ignoreWhitespace, state.mode, state.padding]
  );
  const alphabetLabel = t(`alphabets.${result.alphabetUsed}`);
  const successSummary =
    result.status === "valid"
      ? state.mode === "codificar"
        ? t("result.validEncodeDescription", {
            alphabet: alphabetLabel,
            bytes: numberFormatter.format(result.outputMetrics?.bytes ?? 0),
          })
        : t("result.validDecodeDescription", {
            alphabet: alphabetLabel,
            bytes: numberFormatter.format(result.outputMetrics?.bytes ?? 0),
          })
      : "";
  const errorCopyValue =
    result.error === null
      ? ""
      : [t(`errors.${result.error.code}`), t("errors.diagnostic", { code: result.error.code })]
          .filter(Boolean)
          .join("\n");

  useEffect(() => {
    if (hasReadContentFragment.current) return;

    hasReadContentFragment.current = true;
    const contentFragment = readBase64ContentFromFragment(window.location.hash);
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

  const updateState = (patch: Partial<Base64ConverterState>) => {
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

    downloadBlob(new Blob([result.output], { type: "text/plain;charset=utf-8" }), "conversor-base64.txt");
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
              <section className="space-y-4 rounded-lg border p-4" aria-labelledby="base64-converter-input-title">
                <div>
                  <h2 id="base64-converter-input-title" className="font-semibold">
                    {t("input.title")}
                  </h2>
                  <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {t("input.privacy")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="base64-converter-input">{t("input.label")}</Label>
                  <textarea
                    id="base64-converter-input"
                    data-testid="base64-converter-input"
                    className={editorClassName}
                    value={state.input}
                    onChange={(event) => updateState({ input: event.target.value })}
                    placeholder={t("input.placeholder")}
                    spellCheck={false}
                    aria-invalid={
                      result.status === "invalidBase64" || result.status === "invalidUtf8" || result.status === "tooLarge"
                    }
                  />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => updateState({ input: "" })}
                    disabled={!state.input}
                    data-testid="base64-converter-clear">
                    <Trash2 className="h-4 w-4" />
                    {t("actions.clear")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={swapOutputIntoInput}
                    disabled={!result.output}
                    data-testid="base64-converter-swap">
                    <RotateCcw className="h-4 w-4" />
                    {t("actions.swap")}
                  </Button>
                </div>
              </section>

              <section className="space-y-4 rounded-lg border p-4" aria-labelledby="base64-converter-options-title">
                <div>
                  <h2 id="base64-converter-options-title" className="font-semibold">
                    {t("options.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("options.description")}</p>
                </div>
                <div className="space-y-2">
                  <Label>{t("modes.label")}</Label>
                  <Tabs
                    value={state.mode}
                    onValueChange={(value) => updateState({ mode: value as Base64ConverterMode })}
                    data-testid="base64-converter-mode-selector">
                    <TabsList className="grid h-auto w-full grid-cols-2">
                      {modeIds.map((mode) => (
                        <TabsTrigger key={mode} value={mode} data-testid={`base64-converter-mode-${mode}`}>
                          {t(`modes.${mode}`)}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
                <fieldset className="space-y-2" data-testid="base64-converter-alphabet-selector">
                  <legend className="text-sm font-medium">{t("alphabets.label")}</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {alphabetIds.map((alphabet) => (
                      <Button
                        key={alphabet}
                        type="button"
                        variant={state.alphabet === alphabet ? "default" : "outline"}
                        onClick={() => updateState({ alphabet: alphabet as Base64Alphabet })}
                        aria-pressed={state.alphabet === alphabet}
                        data-testid={`base64-converter-alphabet-${alphabet}`}
                        className="w-full">
                        {t(`alphabets.${alphabet}`)}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{t("alphabets.description")}</p>
                </fieldset>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label
                    className={cn(
                      "flex items-start gap-2 rounded-lg border p-3 text-sm",
                      state.mode === "codificar" ? "" : "opacity-75"
                    )}>
                    <input
                      id="base64-converter-padding"
                      data-testid="base64-converter-padding"
                      type="checkbox"
                      checked={state.padding}
                      onChange={(event) => updateState({ padding: event.target.checked })}
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-medium">{t("padding.label")}</span>
                      <span className="block text-muted-foreground">{t("padding.description")}</span>
                    </span>
                  </label>
                  <label
                    className={cn(
                      "flex items-start gap-2 rounded-lg border p-3 text-sm",
                      state.mode === "decodificar" ? "" : "opacity-75"
                    )}>
                    <input
                      id="base64-converter-ignore-whitespace"
                      data-testid="base64-converter-ignore-whitespace"
                      type="checkbox"
                      checked={state.ignoreWhitespace}
                      onChange={(event) => updateState({ ignoreWhitespace: event.target.checked })}
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-medium">{t("whitespace.label")}</span>
                      <span className="block text-muted-foreground">{t("whitespace.description")}</span>
                    </span>
                  </label>
                </div>
              </section>

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="base64-converter-share-title">
                <div>
                  <h2 id="base64-converter-share-title" className="font-semibold">
                    {t("share.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("share.description")}</p>
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    id="base64-converter-include-content"
                    data-testid="base64-converter-include-content"
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
                <div data-testid="base64-converter-share-button">
                  <ShareButton
                    className="w-full sm:w-auto"
                    getShareUrl={() => {
                      const shareUrl = buildBase64ShareUrl(`${window.location.origin}${window.location.pathname}`, state, {
                        includeContent: includeContentInUrl,
                      });
                      setShareContentOmitted(shareUrl.contentOmitted);

                      return shareUrl.url;
                    }}
                  />
                </div>
              </section>
            </div>

            <aside className="space-y-5 rounded-lg border bg-muted/30 p-4" aria-labelledby="base64-converter-results">
              <div>
                <h2 id="base64-converter-results" className="font-semibold">
                  {t("result.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("result.description")}</p>
              </div>

              <div
                data-testid="base64-converter-status"
                aria-live="polite"
                className={cn(
                  "rounded-lg border bg-background p-4",
                  result.status === "valid" ? "border-emerald-200" : "",
                  result.status === "invalidBase64" || result.status === "invalidUtf8" || result.status === "tooLarge"
                    ? "border-amber-300"
                    : ""
                )}>
                <div className="flex items-start gap-3">
                  {result.status === "valid" ? (
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  ) : result.status === "empty" ? (
                    <Code2 className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
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
                              limit: numberFormatter.format(BASE64_CONVERTER_MAX_INPUT_LENGTH),
                            })
                          : result.status === "invalidBase64"
                            ? t("result.invalidBase64Description")
                            : result.status === "invalidUtf8"
                              ? t("result.invalidUtf8Description")
                              : t("result.emptyDescription")}
                    </p>
                  </div>
                </div>
              </div>

              {result.warnings.length > 0 ? (
                <div className="flex flex-wrap gap-2" data-testid="base64-converter-warnings">
                  {result.warnings.map((warning: Base64ConverterWarning) => (
                    <span
                      key={warning}
                      data-testid={`base64-converter-warning-${warning}`}
                      className="rounded-full border border-amber-300 bg-background px-3 py-1 text-xs text-amber-700 dark:text-amber-300">
                      {t(`warnings.${warning}`)}
                    </span>
                  ))}
                </div>
              ) : null}

              {result.status === "invalidBase64" || result.status === "invalidUtf8" || result.status === "tooLarge" ? (
                <div
                  data-testid="base64-converter-error"
                  className="space-y-3 rounded-lg border border-amber-300 bg-background p-4">
                  <p className="font-medium">
                    {result.error ? t(`errors.${result.error.code}`) : t("errors.invalidCharacter")}
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
                    data-testid="base64-converter-copy-error"
                    className="w-full">
                    {copied === "error" ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                    {copied === "error" ? t("actions.copied") : t("actions.copyError")}
                  </Button>
                </div>
              ) : null}

              {result.output ? (
                <div className="space-y-2">
                  <Label htmlFor="base64-converter-output">{t("result.outputLabel")}</Label>
                  <textarea
                    id="base64-converter-output"
                    data-testid="base64-converter-output"
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
                          data-testid={`base64-converter-metric-input-${metricId}`}
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
                            data-testid={`base64-converter-metric-output-${metricId}`}
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
                  data-testid="base64-converter-copy-result">
                  {copied === "result" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "result" ? t("actions.copied") : t("actions.copyResult")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadText}
                  disabled={!result.output}
                  data-testid="base64-converter-download">
                  <Download className="h-4 w-4" />
                  {t("actions.download")}
                </Button>
              </div>
            </aside>
          </div>
        </CardContent>
      </Card>

      <section className="mb-8 rounded-lg border p-6" aria-labelledby="base64-converter-seo-details">
        <h2 id="base64-converter-seo-details" className="text-2xl font-semibold tracking-tight">
          {t("seoDetails.title")}
        </h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <div className="space-y-2">
            <h3 className="font-semibold">{t("seoDetails.utf8Title")}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("seoDetails.utf8Description")}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">{t("seoDetails.urlTitle")}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("seoDetails.urlDescription")}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">{t("seoDetails.securityTitle")}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("seoDetails.securityDescription")}</p>
          </div>
        </div>
      </section>

      <section className="mb-8 rounded-lg border p-6" aria-labelledby="base64-converter-faq">
        <h2 id="base64-converter-faq" className="text-2xl font-semibold tracking-tight">
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

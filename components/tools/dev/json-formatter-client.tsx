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
  FileJson,
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
  JSON_FORMATTER_MAX_INPUT_LENGTH,
  buildJsonFormatterSearchParams,
  buildJsonFormatterShareUrl,
  processJsonFormatter,
  readJsonFormatterContentFromFragment,
  readJsonFormatterStateFromParams,
  type JsonFormatterMode,
  type JsonFormatterState,
  type JsonTextMetrics,
} from "@/lib/tools/json";
import { cn } from "@/lib/utils/index";

const editorClassName =
  "border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 min-h-80 w-full min-w-0 resize-y rounded-md border bg-transparent px-3 py-2 font-mono text-sm leading-relaxed shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive";

const modeIds = ["formatar", "minificar", "validar"] as const;
const indentIds = ["2", "4", "tab"] as const;
const faqIds = ["privacy", "strict", "difference", "schema", "sharing"] as const;

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function getMetricsRows(metrics: JsonTextMetrics | null) {
  if (!metrics) return [];

  return [
    ["characters", metrics.characters],
    ["bytes", metrics.bytes],
    ["lines", metrics.lines],
  ] as const;
}

export function JsonFormatterClient() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("tools.formatador-json.form");
  const tFaq = useTranslations("tools.formatador-json.faq");
  const hasReadContentFragment = useRef(false);
  const [state, setState] = useState<JsonFormatterState>(() =>
    readJsonFormatterStateFromParams(new URLSearchParams(searchParams.toString()))
  );
  const [includeContentInUrl, setIncludeContentInUrl] = useState(false);
  const [shareContentOmitted, setShareContentOmitted] = useState(false);
  const [copied, setCopied] = useState<"result" | "error" | null>(null);

  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const percentFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }),
    [locale]
  );
  const result = useMemo(() => processJsonFormatter(state), [state]);
  const liveParams = useMemo(
    () => buildJsonFormatterSearchParams({ input: "", mode: state.mode, indent: state.indent }).params,
    [state.indent, state.mode]
  );
  const valueKindLabel = result.valueKind ? t(`result.valueKinds.${result.valueKind}`) : "";
  const successSummary =
    result.status === "valid"
      ? t("result.validDescription", {
          kind: valueKindLabel,
          bytes: numberFormatter.format(result.inputMetrics.bytes),
        })
      : "";
  const copyResultValue = result.output || successSummary;
  const errorCopyValue =
    result.error === null
      ? ""
      : [
          t(`errors.${result.error.code}`),
          result.error.location
            ? t("errors.location", {
                line: numberFormatter.format(result.error.location.line),
                column: numberFormatter.format(result.error.location.column),
              })
            : "",
          result.error.engineMessage ? t("errors.engine", { message: result.error.engineMessage }) : "",
        ]
          .filter(Boolean)
          .join("\n");

  useEffect(() => {
    if (hasReadContentFragment.current) return;

    hasReadContentFragment.current = true;
    const contentFragment = readJsonFormatterContentFromFragment(window.location.hash);
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

  const updateState = (patch: Partial<JsonFormatterState>) => {
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

  const downloadJson = () => {
    const content = result.output || (result.status === "valid" ? state.input.trim() : "");
    if (!content) return;

    downloadBlob(new Blob([content], { type: "application/json;charset=utf-8" }), "formatador-json.json");
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
              <section className="space-y-4 rounded-lg border p-4" aria-labelledby="json-formatter-input-title">
                <div>
                  <h2 id="json-formatter-input-title" className="font-semibold">
                    {t("input.title")}
                  </h2>
                  <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {t("input.privacy")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="json-formatter-input">{t("input.label")}</Label>
                  <textarea
                    id="json-formatter-input"
                    data-testid="json-formatter-input"
                    className={editorClassName}
                    value={state.input}
                    onChange={(event) => updateState({ input: event.target.value })}
                    placeholder={t("input.placeholder")}
                    spellCheck={false}
                    aria-invalid={result.status === "invalid" || result.status === "tooLarge"}
                  />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => updateState({ input: "" })}
                    disabled={!state.input}
                    data-testid="json-formatter-clear">
                    <Trash2 className="h-4 w-4" />
                    {t("actions.clear")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => updateState({ input: result.output })}
                    disabled={!result.output}
                    data-testid="json-formatter-use-output">
                    <RotateCcw className="h-4 w-4" />
                    {t("actions.useOutput")}
                  </Button>
                </div>
              </section>

              <section className="space-y-4 rounded-lg border p-4" aria-labelledby="json-formatter-options-title">
                <div>
                  <h2 id="json-formatter-options-title" className="font-semibold">
                    {t("options.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("options.description")}</p>
                </div>
                <div className="space-y-2">
                  <Label>{t("modes.label")}</Label>
                  <Tabs
                    value={state.mode}
                    onValueChange={(value) => updateState({ mode: value as JsonFormatterMode })}
                    data-testid="json-formatter-mode-selector">
                    <TabsList className="grid h-auto w-full grid-cols-3">
                      {modeIds.map((mode) => (
                        <TabsTrigger key={mode} value={mode} data-testid={`json-formatter-mode-${mode}`}>
                          {t(`modes.${mode}`)}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
                <fieldset
                  className={cn("space-y-2", state.mode === "formatar" ? "" : "opacity-75")}
                  data-testid="json-formatter-indent-selector">
                  <legend className="text-sm font-medium">{t("indent.label")}</legend>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {indentIds.map((indent) => (
                      <Button
                        key={indent}
                        type="button"
                        variant={state.indent === indent ? "default" : "outline"}
                        onClick={() => updateState({ indent })}
                        aria-pressed={state.indent === indent}
                        data-testid={`json-formatter-indent-${indent}`}
                        className="w-full">
                        {t(`indent.options.${indent}`)}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{t("indent.description")}</p>
                </fieldset>
              </section>

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="json-formatter-share-title">
                <div>
                  <h2 id="json-formatter-share-title" className="font-semibold">
                    {t("share.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("share.description")}</p>
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    id="json-formatter-include-content"
                    data-testid="json-formatter-include-content"
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
                <div data-testid="json-formatter-share-button">
                  <ShareButton
                    className="w-full sm:w-auto"
                    getShareUrl={() => {
                      const shareUrl = buildJsonFormatterShareUrl(`${window.location.origin}${window.location.pathname}`, state, {
                        includeContent: includeContentInUrl,
                      });
                      setShareContentOmitted(shareUrl.contentOmitted);

                      return shareUrl.url;
                    }}
                  />
                </div>
              </section>
            </div>

            <aside className="space-y-5 rounded-lg border bg-muted/30 p-4" aria-labelledby="json-formatter-results">
              <div>
                <h2 id="json-formatter-results" className="font-semibold">
                  {t("result.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("result.description")}</p>
              </div>

              <div
                data-testid="json-formatter-status"
                aria-live="polite"
                className={cn(
                  "rounded-lg border bg-background p-4",
                  result.status === "valid" ? "border-emerald-200" : "",
                  result.status === "invalid" || result.status === "tooLarge" ? "border-amber-300" : ""
                )}>
                <div className="flex items-start gap-3">
                  {result.status === "valid" ? (
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  ) : result.status === "empty" ? (
                    <FileJson className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
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
                              limit: numberFormatter.format(JSON_FORMATTER_MAX_INPUT_LENGTH),
                            })
                          : result.status === "invalid"
                            ? t("result.invalidDescription")
                            : t("result.emptyDescription")}
                    </p>
                  </div>
                </div>
              </div>

              {result.status === "invalid" || result.status === "tooLarge" ? (
                <div
                  data-testid="json-formatter-error"
                  className="space-y-3 rounded-lg border border-amber-300 bg-background p-4">
                  <p className="font-medium">{result.error ? t(`errors.${result.error.code}`) : t("errors.invalidJson")}</p>
                  {result.error?.location ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {t("errors.location", {
                          line: numberFormatter.format(result.error.location.line),
                          column: numberFormatter.format(result.error.location.column),
                        })}
                      </p>
                      <pre className="max-h-32 overflow-auto rounded-md bg-muted p-3 text-xs" data-testid="json-formatter-error-snippet">
                        {result.error.location.snippet}
                      </pre>
                    </>
                  ) : null}
                  {result.error?.engineMessage ? (
                    <p className="break-words text-xs text-muted-foreground">
                      {t("errors.engine", { message: result.error.engineMessage })}
                    </p>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => copyToClipboard(errorCopyValue, "error")}
                    disabled={!errorCopyValue}
                    data-testid="json-formatter-copy-error"
                    className="w-full">
                    {copied === "error" ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                    {copied === "error" ? t("actions.copied") : t("actions.copyError")}
                  </Button>
                </div>
              ) : null}

              {result.output ? (
                <div className="space-y-2">
                  <Label htmlFor="json-formatter-output">{t("result.outputLabel")}</Label>
                  <textarea
                    id="json-formatter-output"
                    data-testid="json-formatter-output"
                    readOnly
                    className={cn(editorClassName, "min-h-72 bg-background")}
                    value={result.output}
                  />
                </div>
              ) : result.status === "valid" ? (
                <div data-testid="json-formatter-validation-summary" className="rounded-lg border bg-background p-4">
                  <p className="font-medium">{t("result.validationSummaryTitle")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{successSummary}</p>
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
                          data-testid={`json-formatter-metric-input-${metricId}`}
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
                            data-testid={`json-formatter-metric-output-${metricId}`}
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

              {result.minificationSavings ? (
                <p data-testid="json-formatter-metric-savings" className="text-sm text-muted-foreground">
                  {t("metrics.savings", {
                    bytes: numberFormatter.format(result.minificationSavings.bytes),
                    percent: percentFormatter.format(result.minificationSavings.percent),
                  })}
                </p>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(copyResultValue, "result")}
                  disabled={!copyResultValue}
                  data-testid="json-formatter-copy-result">
                  {copied === "result" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "result" ? t("actions.copied") : t("actions.copyResult")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadJson}
                  disabled={result.status !== "valid"}
                  data-testid="json-formatter-download">
                  <Download className="h-4 w-4" />
                  {t("actions.download")}
                </Button>
              </div>
            </aside>
          </div>
        </CardContent>
      </Card>

      <section className="mb-8 rounded-lg border p-6" aria-labelledby="json-formatter-seo-details">
        <h2 id="json-formatter-seo-details" className="text-2xl font-semibold tracking-tight">
          {t("seoDetails.title")}
        </h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <div className="space-y-2">
            <h3 className="font-semibold">{t("seoDetails.strictTitle")}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("seoDetails.strictDescription")}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">{t("seoDetails.minifyTitle")}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("seoDetails.minifyDescription")}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">{t("seoDetails.privacyTitle")}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("seoDetails.privacyDescription")}</p>
          </div>
        </div>
      </section>

      <section className="mb-8 rounded-lg border p-6" aria-labelledby="json-formatter-faq">
        <h2 id="json-formatter-faq" className="text-2xl font-semibold tracking-tight">
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

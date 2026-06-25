"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, Check, Copy, Download, FileText, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ShareButton } from "@/components/ui/share-button";
import { replaceQueryString } from "@/components/tools/url-state";
import {
  TEXT_CASE_MAX_INPUT_LENGTH,
  buildTextCaseSearchParams,
  buildTextCaseShareUrl,
  convertTextCase,
  readTextCaseContentFromFragment,
  readTextCaseStateFromParams,
  textCaseModes,
  type TextCaseMode,
  type TextCaseState,
  type TextCaseWarning,
} from "@/lib/tools/text";
import { cn } from "@/lib/utils/index";

const textareaClassName =
  "border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 min-h-64 w-full min-w-0 resize-y rounded-md border bg-transparent px-3 py-2 text-base leading-relaxed shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive md:text-sm";

const faqIds = ["privacy", "differences", "accents", "variation", "sharing", "noAccents"] as const;

function downloadText(value: string) {
  const url = URL.createObjectURL(new Blob([value], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "conversor-maiusculas.txt";
  link.click();
  URL.revokeObjectURL(url);
}

export function CaseConverterClient() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("tools.conversor-maiusculas.form");
  const tFaq = useTranslations("tools.conversor-maiusculas.faq");
  const hasReadContentFragment = useRef(false);
  const [state, setState] = useState<TextCaseState>(() =>
    readTextCaseStateFromParams(new URLSearchParams(searchParams.toString()))
  );
  const [includeContentInUrl, setIncludeContentInUrl] = useState(false);
  const [shareContentOmitted, setShareContentOmitted] = useState(false);
  const [copied, setCopied] = useState<"input" | "output" | null>(null);
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const result = useMemo(
    () =>
      convertTextCase(state.text, {
        mode: state.mode,
        preserveLineBreaks: state.preserveLineBreaks,
        locale,
      }),
    [locale, state.mode, state.preserveLineBreaks, state.text]
  );
  const liveParams = useMemo(
    () =>
      buildTextCaseSearchParams({
        text: "",
        mode: state.mode,
        preserveLineBreaks: state.preserveLineBreaks,
      }).params,
    [state.mode, state.preserveLineBreaks]
  );
  const metricRows = [
    ["inputCharacters", result.inputMetrics.characters],
    ["outputCharacters", result.outputMetrics.characters],
    ["inputBytes", result.inputMetrics.bytes],
    ["outputBytes", result.outputMetrics.bytes],
    ["changedCharacters", result.changedCharacters],
  ] as const;
  const statusDescription =
    result.status === "converted"
      ? t("result.convertedDescription", { mode: t(`modes.${result.modeApplied}`) })
      : result.status === "tooLarge"
        ? t("result.tooLargeDescription", { limit: numberFormatter.format(TEXT_CASE_MAX_INPUT_LENGTH) })
        : t("result.emptyDescription");

  useEffect(() => {
    if (hasReadContentFragment.current) return;

    hasReadContentFragment.current = true;
    const contentFragment = readTextCaseContentFromFragment(window.location.hash);
    if (!contentFragment.hasExplicitContent) return;

    const timeoutId = window.setTimeout(() => {
      setState((current) => ({
        ...current,
        text: contentFragment.text,
      }));
      setIncludeContentInUrl(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    replaceQueryString(liveParams);
  }, [liveParams]);

  const updateState = (patch: Partial<TextCaseState>) => {
    setShareContentOmitted(false);
    setCopied(null);
    setState((current) => ({
      ...current,
      ...patch,
    }));
  };

  const copyToClipboard = async (value: string, type: "input" | "output") => {
    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const useOutputAsInput = () => {
    if (!result.output) return;

    updateState({ text: result.output });
  };

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
            <div className="space-y-6">
              <section className="space-y-4 rounded-lg border p-4" aria-labelledby="case-converter-input-title">
                <div>
                  <h2 id="case-converter-input-title" className="font-semibold">
                    {t("input.title")}
                  </h2>
                  <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {t("input.privacy")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="case-converter-input">{t("input.label")}</Label>
                  <textarea
                    id="case-converter-input"
                    data-testid="case-converter-input"
                    className={textareaClassName}
                    value={state.text}
                    onChange={(event) => updateState({ text: event.target.value })}
                    placeholder={t("input.placeholder")}
                    spellCheck={false}
                    aria-invalid={result.status === "tooLarge"}
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => copyToClipboard(state.text, "input")}
                    disabled={!state.text}
                    data-testid="case-converter-copy-input">
                    {copied === "input" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied === "input" ? t("actions.copied") : t("actions.copyInput")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => updateState({ text: "" })}
                    disabled={!state.text}
                    data-testid="case-converter-clear">
                    <Trash2 className="h-4 w-4" />
                    {t("actions.clear")}
                  </Button>
                </div>
              </section>

              <section className="space-y-4 rounded-lg border p-4" aria-labelledby="case-converter-options-title">
                <div>
                  <h2 id="case-converter-options-title" className="font-semibold">
                    {t("options.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("options.description")}</p>
                </div>

                <fieldset className="space-y-2" data-testid="case-converter-mode-selector">
                  <legend className="text-sm font-medium">{t("modes.label")}</legend>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {textCaseModes.map((mode) => (
                      <Button
                        key={mode}
                        type="button"
                        variant={state.mode === mode ? "default" : "outline"}
                        onClick={() => updateState({ mode: mode as TextCaseMode })}
                        aria-pressed={state.mode === mode}
                        data-testid={`case-converter-mode-${mode}`}
                        className="min-h-11 w-full whitespace-normal text-left">
                        {t(`modes.${mode}`)}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground" data-testid="case-converter-mode-description">
                    {t(`modeDescriptions.${state.mode}`)}
                  </p>
                </fieldset>

                <label className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
                  <input
                    id="case-converter-preserve-line-breaks"
                    data-testid="case-converter-preserve-line-breaks"
                    type="checkbox"
                    checked={state.preserveLineBreaks}
                    onChange={(event) => updateState({ preserveLineBreaks: event.target.checked })}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-medium">{t("preserveLineBreaks.label")}</span>
                    <span className="block text-muted-foreground">{t("preserveLineBreaks.description")}</span>
                  </span>
                </label>
              </section>

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="case-converter-share-title">
                <div>
                  <h2 id="case-converter-share-title" className="font-semibold">
                    {t("share.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("share.description")}</p>
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    id="case-converter-include-content"
                    data-testid="case-converter-include-content"
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
                  data-testid="case-converter-share-warning"
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
                <div data-testid="case-converter-share-button">
                  <ShareButton
                    className="w-full sm:w-auto"
                    getShareUrl={() => {
                      const shareUrl = buildTextCaseShareUrl(
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

            <aside className="space-y-5 rounded-lg border bg-muted/30 p-4" aria-labelledby="case-converter-results">
              <div>
                <h2 id="case-converter-results" className="font-semibold">
                  {t("result.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("result.description")}</p>
              </div>

              <div
                data-testid="case-converter-status"
                aria-live="polite"
                className={cn(
                  "rounded-lg border bg-background p-4",
                  result.status === "converted" ? "border-emerald-200" : "",
                  result.status === "tooLarge" ? "border-amber-300" : ""
                )}>
                <div className="flex items-start gap-3">
                  {result.status === "converted" ? (
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  ) : result.status === "tooLarge" ? (
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  ) : (
                    <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium">{t(`result.status.${result.status}`)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{statusDescription}</p>
                  </div>
                </div>
              </div>

              {result.warnings.length > 0 ? (
                <div className="flex flex-wrap gap-2" data-testid="case-converter-warnings">
                  {result.warnings.map((warning: TextCaseWarning) => (
                    <span
                      key={warning}
                      data-testid={`case-converter-warning-${warning}`}
                      className="rounded-full border border-amber-300 bg-background px-3 py-1 text-xs text-amber-700 dark:text-amber-300">
                      {t(`warnings.${warning}`)}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="case-converter-output">{t("output.label")}</Label>
                <textarea
                  id="case-converter-output"
                  data-testid="case-converter-output"
                  className={textareaClassName}
                  value={result.output}
                  readOnly
                  placeholder={t("output.placeholder")}
                  spellCheck={false}
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(result.output, "output")}
                  disabled={!result.output}
                  data-testid="case-converter-copy-output"
                  className="w-full">
                  {copied === "output" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "output" ? t("actions.copied") : t("actions.copyOutput")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={useOutputAsInput}
                  disabled={!result.output}
                  data-testid="case-converter-use-output"
                  className="w-full">
                  <RotateCcw className="h-4 w-4" />
                  {t("actions.useOutput")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => downloadText(result.output)}
                  disabled={!result.output}
                  data-testid="case-converter-download"
                  className="w-full">
                  <Download className="h-4 w-4" />
                  {t("actions.download")}
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2" data-testid="case-converter-metrics">
                {metricRows.map(([metricId, value]) => (
                  <div key={metricId} className="rounded-lg border bg-background p-3">
                    <p className="text-xs text-muted-foreground">{t(`metrics.${metricId}`)}</p>
                    <p className="mt-1 break-words text-xl font-semibold tabular-nums">
                      {numberFormatter.format(value)}
                    </p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </CardContent>
      </Card>

      <section className="mb-8 rounded-lg border p-6" aria-labelledby="case-converter-faq">
        <h2 id="case-converter-faq" className="text-2xl font-semibold tracking-tight">
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

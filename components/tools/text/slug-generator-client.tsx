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
  SLUG_GENERATOR_MAX_INPUT_LENGTH,
  SLUG_GENERATOR_MAX_OUTPUT_LENGTH,
  buildSlugGeneratorSearchParams,
  buildSlugGeneratorShareUrl,
  generateSlug,
  readSlugGeneratorContentFromFragment,
  readSlugGeneratorStateFromParams,
  slugSeparatorModes,
  type SlugGeneratorState,
  type SlugGeneratorWarning,
  type SlugSeparatorMode,
} from "@/lib/tools/text";
import { cn } from "@/lib/utils/index";

const textareaClassName =
  "border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 min-h-56 w-full min-w-0 resize-y rounded-md border bg-transparent px-3 py-2 text-base leading-relaxed shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive md:text-sm";

const inputClassName =
  "border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

const faqIds = ["privacy", "definition", "accents", "separator", "urlEncode", "availability", "sharing"] as const;

function downloadText(value: string) {
  const url = URL.createObjectURL(new Blob([value], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "gerador-slug.txt";
  link.click();
  URL.revokeObjectURL(url);
}

export function SlugGeneratorClient() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("tools.gerador-slug.form");
  const tFaq = useTranslations("tools.gerador-slug.faq");
  const hasReadContentFragment = useRef(false);
  const [state, setState] = useState<SlugGeneratorState>(() =>
    readSlugGeneratorStateFromParams(new URLSearchParams(searchParams.toString()))
  );
  const [includeContentInUrl, setIncludeContentInUrl] = useState(false);
  const [shareContentOmitted, setShareContentOmitted] = useState(false);
  const [copied, setCopied] = useState<"input" | "slug" | "path" | null>(null);
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const result = useMemo(
    () =>
      generateSlug(state.text, {
        separator: state.separator,
        lowercase: state.lowercase,
        maxLength: state.maxLengthInput,
        locale,
      }),
    [locale, state.lowercase, state.maxLengthInput, state.separator, state.text]
  );
  const liveParams = useMemo(
    () =>
      buildSlugGeneratorSearchParams({
        text: "",
        separator: state.separator,
        lowercase: state.lowercase,
        maxLengthInput: state.maxLengthInput,
      }).params,
    [state.lowercase, state.maxLengthInput, state.separator]
  );
  const metricRows = [
    ["inputCharacters", result.inputMetrics.characters],
    ["outputCharacters", result.outputMetrics.characters],
    ["inputBytes", result.inputMetrics.bytes],
    ["outputBytes", result.outputMetrics.bytes],
    ["removedCharacters", result.removedCharacters],
  ] as const;
  const statusDescription =
    result.status === "generated"
      ? t("result.generatedDescription", { separator: t(`separators.${result.modeApplied.separator}`) })
      : result.status === "tooLarge"
        ? t("result.tooLargeDescription", { limit: numberFormatter.format(SLUG_GENERATOR_MAX_INPUT_LENGTH) })
        : result.status === "emptyAfterNormalization"
          ? t("result.emptyAfterNormalizationDescription")
          : t("result.emptyDescription");

  useEffect(() => {
    if (hasReadContentFragment.current) return;

    hasReadContentFragment.current = true;
    const contentFragment = readSlugGeneratorContentFromFragment(window.location.hash);
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

  const updateState = (patch: Partial<SlugGeneratorState>) => {
    setShareContentOmitted(false);
    setCopied(null);
    setState((current) => ({
      ...current,
      ...patch,
    }));
  };

  const copyToClipboard = async (value: string, type: "input" | "slug" | "path") => {
    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const useSlugAsInput = () => {
    if (!result.slug) return;

    updateState({ text: result.slug });
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
              <section className="space-y-4 rounded-lg border p-4" aria-labelledby="slug-generator-input-title">
                <div>
                  <h2 id="slug-generator-input-title" className="font-semibold">
                    {t("input.title")}
                  </h2>
                  <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {t("input.privacy")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug-generator-input">{t("input.label")}</Label>
                  <textarea
                    id="slug-generator-input"
                    data-testid="slug-generator-input"
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
                    data-testid="slug-generator-copy-input">
                    {copied === "input" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied === "input" ? t("actions.copied") : t("actions.copyInput")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => updateState({ text: "" })}
                    disabled={!state.text}
                    data-testid="slug-generator-clear">
                    <Trash2 className="h-4 w-4" />
                    {t("actions.clear")}
                  </Button>
                </div>
              </section>

              <section className="space-y-4 rounded-lg border p-4" aria-labelledby="slug-generator-options-title">
                <div>
                  <h2 id="slug-generator-options-title" className="font-semibold">
                    {t("options.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("options.description")}</p>
                </div>

                <fieldset className="space-y-2" data-testid="slug-generator-separator-selector">
                  <legend className="text-sm font-medium">{t("separators.label")}</legend>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {slugSeparatorModes.map((separator) => (
                      <Button
                        key={separator}
                        type="button"
                        variant={state.separator === separator ? "default" : "outline"}
                        onClick={() => updateState({ separator: separator as SlugSeparatorMode })}
                        aria-pressed={state.separator === separator}
                        data-testid={`slug-generator-separator-${separator}`}
                        className="min-h-11 w-full whitespace-normal text-left">
                        {t(`separators.${separator}`)}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground" data-testid="slug-generator-separator-description">
                    {t(`separatorDescriptions.${state.separator}`)}
                  </p>
                </fieldset>

                <label className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
                  <input
                    id="slug-generator-lowercase"
                    data-testid="slug-generator-lowercase"
                    type="checkbox"
                    checked={state.lowercase}
                    onChange={(event) => updateState({ lowercase: event.target.checked })}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-medium">{t("lowercase.label")}</span>
                    <span className="block text-muted-foreground">{t("lowercase.description")}</span>
                  </span>
                </label>

                <div className="space-y-2">
                  <Label htmlFor="slug-generator-max-length">{t("maxLength.label")}</Label>
                  <input
                    id="slug-generator-max-length"
                    data-testid="slug-generator-max-length"
                    type="number"
                    min={1}
                    max={SLUG_GENERATOR_MAX_OUTPUT_LENGTH}
                    inputMode="numeric"
                    className={inputClassName}
                    value={state.maxLengthInput}
                    onChange={(event) => updateState({ maxLengthInput: event.target.value })}
                    placeholder={t("maxLength.placeholder")}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("maxLength.description", { max: numberFormatter.format(SLUG_GENERATOR_MAX_OUTPUT_LENGTH) })}
                  </p>
                </div>
              </section>

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="slug-generator-share-title">
                <div>
                  <h2 id="slug-generator-share-title" className="font-semibold">
                    {t("share.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("share.description")}</p>
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    id="slug-generator-include-content"
                    data-testid="slug-generator-include-content"
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
                  data-testid="slug-generator-share-warning"
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
                <div data-testid="slug-generator-share-button">
                  <ShareButton
                    className="w-full sm:w-auto"
                    getShareUrl={() => {
                      const shareUrl = buildSlugGeneratorShareUrl(
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

            <aside className="space-y-5 rounded-lg border bg-muted/30 p-4" aria-labelledby="slug-generator-results">
              <div>
                <h2 id="slug-generator-results" className="font-semibold">
                  {t("result.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("result.description")}</p>
              </div>

              <div
                data-testid="slug-generator-status"
                aria-live="polite"
                className={cn(
                  "rounded-lg border bg-background p-4",
                  result.status === "generated" ? "border-emerald-200" : "",
                  result.status === "tooLarge" || result.status === "emptyAfterNormalization" ? "border-amber-300" : ""
                )}>
                <div className="flex items-start gap-3">
                  {result.status === "generated" ? (
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  ) : result.status === "tooLarge" || result.status === "emptyAfterNormalization" ? (
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
                <div className="flex flex-wrap gap-2" data-testid="slug-generator-warnings">
                  {result.warnings.map((warning: SlugGeneratorWarning) => (
                    <span
                      key={warning}
                      data-testid={`slug-generator-warning-${warning}`}
                      className="rounded-full border border-amber-300 bg-background px-3 py-1 text-xs text-amber-700 dark:text-amber-300">
                      {t(`warnings.${warning}`)}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="slug-generator-output">{t("output.slugLabel")}</Label>
                <input
                  id="slug-generator-output"
                  data-testid="slug-generator-output"
                  className={inputClassName}
                  value={result.slug}
                  readOnly
                  placeholder={t("output.slugPlaceholder")}
                  spellCheck={false}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug-generator-path">{t("output.pathLabel")}</Label>
                <input
                  id="slug-generator-path"
                  data-testid="slug-generator-path"
                  className={inputClassName}
                  value={result.pathSegment}
                  readOnly
                  placeholder={t("output.pathPlaceholder")}
                  spellCheck={false}
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(result.slug, "slug")}
                  disabled={!result.slug}
                  data-testid="slug-generator-copy-slug"
                  className="w-full">
                  {copied === "slug" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "slug" ? t("actions.copied") : t("actions.copySlug")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(result.pathSegment, "path")}
                  disabled={!result.pathSegment}
                  data-testid="slug-generator-copy-path"
                  className="w-full">
                  {copied === "path" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "path" ? t("actions.copied") : t("actions.copyPath")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={useSlugAsInput}
                  disabled={!result.slug}
                  data-testid="slug-generator-use-output"
                  className="w-full">
                  <RotateCcw className="h-4 w-4" />
                  {t("actions.useOutput")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => downloadText(result.slug)}
                  disabled={!result.slug}
                  data-testid="slug-generator-download"
                  className="w-full">
                  <Download className="h-4 w-4" />
                  {t("actions.download")}
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2" data-testid="slug-generator-metrics">
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

      <section className="mb-8 rounded-lg border p-6" aria-labelledby="slug-generator-faq">
        <h2 id="slug-generator-faq" className="text-2xl font-semibold tracking-tight">
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

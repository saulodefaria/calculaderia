"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, Check, ClipboardCopy, Copy, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShareButton } from "@/components/ui/share-button";
import { getShareUrlFromParams, replaceQueryString } from "@/components/tools/url-state";
import {
  analyzeText,
  buildCharacterCounterSearchParams,
  normalizeCharacterLimit,
  readCharacterCounterStateFromParams,
  type CharacterCounterState,
} from "@/lib/tools/text";
import { cn } from "@/lib/utils/index";

const textareaClassName =
  "border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 min-h-72 w-full min-w-0 resize-y rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive md:text-sm";

const primaryMetricIds = ["characters", "charactersWithoutWhitespace", "words", "lines"] as const;
const secondaryMetricIds = ["nonEmptyLines", "paragraphs", "sentences", "bytes"] as const;
const faqIds = ["privacy", "spaces", "emoji", "wordVariation", "sharing"] as const;

export function CharacterCounterClient() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("tools.contador-caracteres.form");
  const tFaq = useTranslations("tools.contador-caracteres.faq");
  const [state, setState] = useState<CharacterCounterState>(() =>
    readCharacterCounterStateFromParams(new URLSearchParams(searchParams.toString()))
  );
  const [includeContentInUrl, setIncludeContentInUrl] = useState(() => searchParams.get("conteudo") === "1");
  const [shareContentOmitted, setShareContentOmitted] = useState(false);
  const [copied, setCopied] = useState<"text" | "summary" | null>(null);

  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const analysis = useMemo(
    () => analyzeText(state.text, { locale, limit: state.limitInput }),
    [locale, state.limitInput, state.text]
  );
  const liveParams = useMemo(
    () => buildCharacterCounterSearchParams({ text: "", limitInput: state.limitInput }).params,
    [state.limitInput]
  );
  const normalizedLimit = normalizeCharacterLimit(state.limitInput);
  const hasInvalidLimit = state.limitInput.trim().length > 0 && normalizedLimit === null;
  const summary = t("summaryText", {
    characters: numberFormatter.format(analysis.characters),
    charactersWithoutWhitespace: numberFormatter.format(analysis.charactersWithoutWhitespace),
    words: numberFormatter.format(analysis.words),
    lines: numberFormatter.format(analysis.lines),
    paragraphs: numberFormatter.format(analysis.paragraphs),
    sentences: numberFormatter.format(analysis.sentences),
    bytes: numberFormatter.format(analysis.bytes),
  });

  useEffect(() => {
    replaceQueryString(liveParams);
  }, [liveParams]);

  const updateState = (patch: Partial<CharacterCounterState>) => {
    setShareContentOmitted((current) => (current ? false : current));
    setState((current) => ({
      ...current,
      ...patch,
    }));
  };

  const copyToClipboard = async (value: string, type: "text" | "summary") => {
    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const metricValue = (metricId: (typeof primaryMetricIds)[number] | (typeof secondaryMetricIds)[number]) =>
    numberFormatter.format(analysis[metricId]);

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
            <div className="space-y-6">
              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="character-counter-input-title">
                <div>
                  <h2 id="character-counter-input-title" className="font-semibold">
                    {t("input.title")}
                  </h2>
                  <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {t("input.privacy")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="character-counter-text">{t("input.label")}</Label>
                  <textarea
                    id="character-counter-text"
                    data-testid="character-counter-textarea"
                    className={textareaClassName}
                    value={state.text}
                    onChange={(event) => updateState({ text: event.target.value })}
                    placeholder={t("input.placeholder")}
                    spellCheck={false}
                  />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => copyToClipboard(state.text, "text")}
                    disabled={!state.text}
                    data-testid="character-counter-copy-text"
                    className="sm:w-auto">
                    {copied === "text" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied === "text" ? t("actions.copied") : t("actions.copyText")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => updateState({ text: "" })}
                    disabled={!state.text}
                    data-testid="character-counter-clear"
                    className="sm:w-auto">
                    <Trash2 className="h-4 w-4" />
                    {t("actions.clear")}
                  </Button>
                </div>
              </section>

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="character-counter-limit-title">
                <div>
                  <h2 id="character-counter-limit-title" className="font-semibold">
                    {t("limit.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("limit.description")}</p>
                </div>
                <div className="max-w-xs space-y-2">
                  <Label htmlFor="character-counter-limit">{t("limit.label")}</Label>
                  <Input
                    id="character-counter-limit"
                    data-testid="character-counter-limit-input"
                    type="number"
                    min={1}
                    max={1_000_000}
                    inputMode="numeric"
                    value={state.limitInput}
                    onChange={(event) => updateState({ limitInput: event.target.value })}
                    placeholder={t("limit.placeholder")}
                    aria-invalid={hasInvalidLimit}
                  />
                </div>
                {hasInvalidLimit ? (
                  <p className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    {t("limit.invalid")}
                  </p>
                ) : null}
                {analysis.limit ? (
                  <div className="space-y-2" data-testid="character-counter-limit-result">
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full", analysis.limit.isExceeded ? "bg-red-500" : "bg-emerald-600")}
                        style={{ width: `${Math.min(analysis.limit.percentUsed, 100)}%` }}
                      />
                    </div>
                    <p
                      className={cn(
                        "text-sm",
                        analysis.limit.isExceeded ? "text-red-600" : "text-muted-foreground"
                      )}>
                      {analysis.limit.isExceeded
                        ? t("limit.exceeded", {
                            count: numberFormatter.format(analysis.limit.exceeded),
                            percent: numberFormatter.format(Math.round(analysis.limit.percentUsed)),
                          })
                        : t("limit.remaining", {
                            count: numberFormatter.format(analysis.limit.remaining),
                            percent: numberFormatter.format(Math.round(analysis.limit.percentUsed)),
                          })}
                    </p>
                  </div>
                ) : null}
              </section>

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="character-counter-share-title">
                <div>
                  <h2 id="character-counter-share-title" className="font-semibold">
                    {t("share.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("share.description")}</p>
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    id="character-counter-include-content"
                    data-testid="character-counter-include-content"
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
                    includeContentInUrl ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"
                  )}>
                  {shareContentOmitted
                    ? t("share.tooLong")
                    : includeContentInUrl
                      ? t("share.publicWarning")
                      : t("share.safe")}
                </p>
                <ShareButton
                  className="w-full sm:w-auto"
                  getShareUrl={() => {
                    const shareParams = buildCharacterCounterSearchParams(state, { includeContent: includeContentInUrl });
                    setShareContentOmitted(shareParams.contentOmitted);

                    return getShareUrlFromParams(shareParams.params);
                  }}
                />
              </section>
            </div>

            <aside className="space-y-5 rounded-lg border bg-muted/30 p-4" aria-labelledby="character-counter-results">
              <div>
                <h2 id="character-counter-results" className="font-semibold">
                  {t("results.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("results.description")}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2" aria-live="polite">
                {primaryMetricIds.map((metricId) => (
                  <div
                    key={metricId}
                    data-testid={`character-counter-metric-${metricId}`}
                    className="min-h-24 rounded-lg border bg-background p-4">
                    <p className="text-sm text-muted-foreground">{t(`metrics.${metricId}`)}</p>
                    <p className="mt-2 break-words text-3xl font-semibold tabular-nums">{metricValue(metricId)}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {secondaryMetricIds.map((metricId) => (
                  <div
                    key={metricId}
                    data-testid={`character-counter-metric-${metricId}`}
                    className="min-h-20 rounded-lg border bg-background p-3">
                    <p className="text-xs text-muted-foreground">{t(`metrics.${metricId}`)}</p>
                    <p className="mt-1 break-words text-xl font-semibold tabular-nums">{metricValue(metricId)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 rounded-lg border bg-background p-3">
                <p className="text-sm font-medium text-muted-foreground">{t("results.summaryTitle")}</p>
                <p className="text-sm leading-relaxed" data-testid="character-counter-summary">
                  {summary}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(summary, "summary")}
                  data-testid="character-counter-copy-summary"
                  className="w-full">
                  {copied === "summary" ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                  {copied === "summary" ? t("actions.copied") : t("actions.copySummary")}
                </Button>
              </div>
            </aside>
          </div>
        </CardContent>
      </Card>

      <section className="mb-8 rounded-lg border p-6" aria-labelledby="character-counter-faq">
        <h2 id="character-counter-faq" className="text-2xl font-semibold tracking-tight">
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

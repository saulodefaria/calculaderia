"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertTriangle,
  ArrowLeftRight,
  Check,
  Copy,
  Download,
  FileText,
  ListTree,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ShareButton } from "@/components/ui/share-button";
import { replaceQueryString } from "@/components/tools/url-state";
import {
  TEXT_DIFF_MAX_INPUT_LENGTH,
  buildTextDiffSearchParams,
  buildTextDiffShareUrl,
  buildTextDiffSummaryText,
  buildUnifiedTextDiff,
  compareTexts,
  formatTextDiffRange,
  readTextDiffContentFromFragment,
  readTextDiffStateFromParams,
  textDiffModes,
  textDiffViews,
  type TextDiffBlock,
  type TextDiffBlockType,
  type TextDiffInlineChange,
  type TextDiffMode,
  type TextDiffState,
  type TextDiffView,
  type TextDiffWarning,
} from "@/lib/tools/text-diff";
import { cn } from "@/lib/utils/index";

const textareaClassName =
  "border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 min-h-64 w-full min-w-0 resize-y rounded-md border bg-transparent px-3 py-2 text-base leading-relaxed shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive md:text-sm";

const outputTextClassName =
  "min-h-10 whitespace-pre-wrap break-words rounded-md border bg-background px-3 py-2 font-mono text-xs leading-relaxed";

const faqIds = ["privacy", "modes", "ignore", "formats", "legal", "sharing", "differences"] as const;
const summaryRows = [
  "unchanged",
  "added",
  "removed",
  "modified",
  "changedBlocks",
  "percentChanged",
  "originalLines",
  "revisedLines",
] as const;

function downloadText(value: string) {
  const url = URL.createObjectURL(new Blob([value], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "diff-texto.txt";
  link.click();
  URL.revokeObjectURL(url);
}

function getBlockTone(type: TextDiffBlockType) {
  if (type === "insert") return "border-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/20";
  if (type === "delete") return "border-red-300 bg-red-50/80 dark:bg-red-950/20";
  if (type === "replace") return "border-amber-300 bg-amber-50/80 dark:bg-amber-950/20";

  return "border-border bg-background";
}

function renderInlineChanges(changes: TextDiffInlineChange[], side: "original" | "revised") {
  if (changes.length === 0) return null;

  return changes
    .filter((change) => change.type === "equal" || (side === "original" ? change.type === "delete" : change.type === "insert"))
    .map((change, index) => (
      <span
        key={`${change.type}-${index}`}
        className={cn(
          change.type === "delete" ? "rounded bg-red-200/80 px-0.5 line-through dark:bg-red-900/60" : "",
          change.type === "insert" ? "rounded bg-emerald-200/80 px-0.5 dark:bg-emerald-900/60" : ""
        )}>
        {change.text}
      </span>
    ));
}

function getSummaryValue(row: (typeof summaryRows)[number], summary: ReturnType<typeof compareTexts>["summary"]) {
  if (row === "changedBlocks") return summary.totalChangedBlocks;
  if (row === "percentChanged") return summary.percentChanged;
  if (row === "originalLines") return summary.originalLines;
  if (row === "revisedLines") return summary.revisedLines;

  return summary[row];
}

interface DiffBlockViewProps {
  block: TextDiffBlock;
  side: "original" | "revised";
  label: string;
}

function DiffBlockView({ block, side, label }: DiffBlockViewProps) {
  const text = side === "original" ? block.originalText : block.revisedText;
  const range =
    side === "original"
      ? formatTextDiffRange(block.originalStart, block.originalEnd)
      : formatTextDiffRange(block.revisedStart, block.revisedEnd);
  const inline = block.type === "replace" ? renderInlineChanges(block.inlineChanges, side) : null;

  return (
    <div className={cn("min-w-0 rounded-md border p-3", getBlockTone(block.type))}>
      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums">{range || "..."}</span>
      </div>
      <div className={outputTextClassName}>{inline ?? (text || " ")}</div>
    </div>
  );
}

export function TextDiffClient() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("tools.diff-texto.form");
  const tFaq = useTranslations("tools.diff-texto.faq");
  const hasReadContentFragment = useRef(false);
  const [state, setState] = useState<TextDiffState>(() =>
    readTextDiffStateFromParams(new URLSearchParams(searchParams.toString()))
  );
  const [includeContentInUrl, setIncludeContentInUrl] = useState(false);
  const [shareContentOmitted, setShareContentOmitted] = useState(false);
  const [copied, setCopied] = useState<"original" | "revised" | "summary" | "unified" | null>(null);
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const percentFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0,
        style: "percent",
      }),
    [locale]
  );
  const result = useMemo(
    () =>
      compareTexts(state.original, state.alterado, {
        mode: state.modo,
        ignoreCase: state.ignorarCaixa,
        ignoreTrailingSpaces: state.ignorarEspacosFinais,
        ignoreBlankLines: state.ignorarLinhasVazias,
        locale,
      }),
    [locale, state.alterado, state.ignorarCaixa, state.ignorarEspacosFinais, state.ignorarLinhasVazias, state.modo, state.original]
  );
  const liveParams = useMemo(
    () =>
      buildTextDiffSearchParams({
        ...state,
        original: "",
        alterado: "",
      }).params,
    [state]
  );
  const unifiedText = useMemo(() => buildUnifiedTextDiff(result), [result]);
  const summaryText = useMemo(() => buildTextDiffSummaryText(result), [result]);
  const hasCopyableResult = result.blocks.length > 0;
  const statusDescription =
    result.status === "tooLarge"
      ? t("result.tooLargeDescription", { limit: numberFormatter.format(TEXT_DIFF_MAX_INPUT_LENGTH) })
      : result.status === "tooManyTokens"
        ? t("result.tooManyTokensDescription")
        : result.status === "identical"
          ? t("result.identicalDescription")
          : result.status === "different"
            ? t("result.differentDescription")
            : result.status === "missingOriginal"
              ? t("result.missingOriginalDescription")
              : result.status === "missingRevised"
                ? t("result.missingRevisedDescription")
                : t("result.emptyDescription");

  useEffect(() => {
    if (hasReadContentFragment.current) return;

    hasReadContentFragment.current = true;
    const contentFragment = readTextDiffContentFromFragment(window.location.hash);
    if (!contentFragment.hasExplicitContent) return;

    const timeoutId = window.setTimeout(() => {
      setState((current) => ({
        ...current,
        original: contentFragment.original,
        alterado: contentFragment.alterado,
      }));
      setIncludeContentInUrl(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    replaceQueryString(liveParams);
  }, [liveParams]);

  const updateState = (patch: Partial<TextDiffState>) => {
    setShareContentOmitted(false);
    setCopied(null);
    setState((current) => ({
      ...current,
      ...patch,
    }));
  };

  const copyToClipboard = async (value: string, type: "original" | "revised" | "summary" | "unified") => {
    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const loadExample = () => {
    updateState({
      original: t("examples.original"),
      alterado: t("examples.revised"),
      modo: "linhas",
      visao: "lado-a-lado",
      ignorarCaixa: false,
      ignorarEspacosFinais: false,
      ignorarLinhasVazias: false,
    });
  };

  const clearTexts = () => {
    updateState({ original: "", alterado: "" });
  };

  const swapTexts = () => {
    updateState({ original: state.alterado, alterado: state.original });
  };

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-4 rounded-lg border p-4" aria-labelledby="text-diff-input-title">
            <div>
              <h2 id="text-diff-input-title" className="font-semibold">
                {t("input.title")}
              </h2>
              <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                {t("input.privacy")}
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="text-diff-original">{t("input.originalLabel")}</Label>
                <textarea
                  id="text-diff-original"
                  data-testid="text-diff-original"
                  className={textareaClassName}
                  value={state.original}
                  onChange={(event) => updateState({ original: event.target.value })}
                  placeholder={t("input.originalPlaceholder")}
                  spellCheck={false}
                  aria-invalid={result.status === "tooLarge"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="text-diff-revised">{t("input.revisedLabel")}</Label>
                <textarea
                  id="text-diff-revised"
                  data-testid="text-diff-revised"
                  className={textareaClassName}
                  value={state.alterado}
                  onChange={(event) => updateState({ alterado: event.target.value })}
                  placeholder={t("input.revisedPlaceholder")}
                  spellCheck={false}
                  aria-invalid={result.status === "tooLarge"}
                />
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => copyToClipboard(state.original, "original")}
                disabled={!state.original}
                data-testid="text-diff-copy-original">
                {copied === "original" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied === "original" ? t("actions.copied") : t("actions.copyOriginal")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => copyToClipboard(state.alterado, "revised")}
                disabled={!state.alterado}
                data-testid="text-diff-copy-revised">
                {copied === "revised" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied === "revised" ? t("actions.copied") : t("actions.copyRevised")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={swapTexts}
                disabled={!state.original && !state.alterado}
                data-testid="text-diff-swap">
                <ArrowLeftRight className="h-4 w-4" />
                {t("actions.swap")}
              </Button>
              <Button type="button" variant="outline" onClick={loadExample} data-testid="text-diff-load-example">
                <ListTree className="h-4 w-4" />
                {t("actions.loadExample")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={clearTexts}
                disabled={!state.original && !state.alterado}
                data-testid="text-diff-clear">
                <Trash2 className="h-4 w-4" />
                {t("actions.clear")}
              </Button>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="space-y-6">
              <section className="space-y-4 rounded-lg border p-4" aria-labelledby="text-diff-options-title">
                <div>
                  <h2 id="text-diff-options-title" className="font-semibold">
                    {t("options.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("options.description")}</p>
                </div>

                <fieldset className="space-y-2" data-testid="text-diff-mode-selector">
                  <legend className="text-sm font-medium">{t("modes.label")}</legend>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {textDiffModes.map((mode) => (
                      <Button
                        key={mode}
                        type="button"
                        variant={state.modo === mode ? "default" : "outline"}
                        onClick={() => updateState({ modo: mode as TextDiffMode })}
                        aria-pressed={state.modo === mode}
                        data-testid={`text-diff-mode-${mode}`}
                        className="min-h-11 w-full whitespace-normal text-left">
                        {t(`modes.${mode}`)}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground" data-testid="text-diff-mode-description">
                    {t(`modeDescriptions.${state.modo}`)}
                  </p>
                </fieldset>

                <fieldset className="space-y-2" data-testid="text-diff-view-selector">
                  <legend className="text-sm font-medium">{t("views.label")}</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {textDiffViews.map((view) => (
                      <Button
                        key={view}
                        type="button"
                        variant={state.visao === view ? "default" : "outline"}
                        onClick={() => updateState({ visao: view as TextDiffView })}
                        aria-pressed={state.visao === view}
                        data-testid={`text-diff-view-${view}`}
                        className="min-h-11 w-full whitespace-normal text-left">
                        {t(`views.${view}`)}
                      </Button>
                    ))}
                  </div>
                </fieldset>

                <div className="space-y-2">
                  {(["ignorarCaixa", "ignorarEspacosFinais", "ignorarLinhasVazias"] as const).map((option) => (
                    <label key={option} className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
                      <input
                        id={`text-diff-${option}`}
                        data-testid={`text-diff-${option}`}
                        type="checkbox"
                        checked={state[option]}
                        onChange={(event) => updateState({ [option]: event.target.checked })}
                        className="mt-1"
                      />
                      <span>
                        <span className="block font-medium">{t(`ignoreOptions.${option}.label`)}</span>
                        <span className="block text-muted-foreground">{t(`ignoreOptions.${option}.description`)}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="text-diff-share-title">
                <div>
                  <h2 id="text-diff-share-title" className="font-semibold">
                    {t("share.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("share.description")}</p>
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    id="text-diff-include-content"
                    data-testid="text-diff-include-content"
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
                  data-testid="text-diff-share-warning"
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
                <div data-testid="text-diff-share-button">
                  <ShareButton
                    className="w-full sm:w-auto"
                    getShareUrl={() => {
                      const shareUrl = buildTextDiffShareUrl(
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

            <aside className="space-y-5 rounded-lg border bg-muted/30 p-4" aria-labelledby="text-diff-results">
              <div>
                <h2 id="text-diff-results" className="font-semibold">
                  {t("result.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("result.description")}</p>
              </div>

              <div
                data-testid="text-diff-status"
                aria-live="polite"
                className={cn(
                  "rounded-lg border bg-background p-4",
                  result.status === "identical" ? "border-emerald-200" : "",
                  result.status === "different" || result.status === "missingOriginal" || result.status === "missingRevised"
                    ? "border-amber-300"
                    : "",
                  result.status === "tooLarge" || result.status === "tooManyTokens" ? "border-red-300" : ""
                )}>
                <div className="flex items-start gap-3">
                  {result.status === "identical" ? (
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  ) : result.status === "tooLarge" || result.status === "tooManyTokens" ? (
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                  ) : result.status === "different" ||
                    result.status === "missingOriginal" ||
                    result.status === "missingRevised" ? (
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
                <div className="flex flex-wrap gap-2" data-testid="text-diff-warnings">
                  {result.warnings.map((warning: TextDiffWarning) => (
                    <span
                      key={warning}
                      data-testid={`text-diff-warning-${warning}`}
                      className="rounded-full border border-amber-300 bg-background px-3 py-1 text-xs text-amber-700 dark:text-amber-300">
                      {t(`warnings.${warning}`)}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2" data-testid="text-diff-summary">
                {summaryRows.map((row) => {
                  const value = getSummaryValue(row, result.summary);
                  const displayValue =
                    row === "percentChanged" ? percentFormatter.format(value / 100) : numberFormatter.format(value);

                  return (
                    <div key={row} className="rounded-lg border bg-background p-3">
                      <p className="text-xs text-muted-foreground">{t(`summary.${row}`)}</p>
                      <p
                        className="mt-1 break-words text-xl font-semibold tabular-nums"
                        data-testid={`text-diff-summary-${row}`}>
                        {displayValue}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(summaryText, "summary")}
                  disabled={!hasCopyableResult}
                  data-testid="text-diff-copy-summary"
                  className="w-full">
                  {copied === "summary" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "summary" ? t("actions.copied") : t("actions.copySummary")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(unifiedText, "unified")}
                  disabled={!hasCopyableResult}
                  data-testid="text-diff-copy-unified"
                  className="w-full">
                  {copied === "unified" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "unified" ? t("actions.copied") : t("actions.copyUnified")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => downloadText(`${summaryText}\n\n${unifiedText}`)}
                  disabled={!hasCopyableResult}
                  data-testid="text-diff-download"
                  className="w-full">
                  <Download className="h-4 w-4" />
                  {t("actions.download")}
                </Button>
              </div>
            </aside>
          </div>

          <section className="space-y-4 rounded-lg border p-4" aria-labelledby="text-diff-result-view-title">
            <div>
              <h2 id="text-diff-result-view-title" className="font-semibold">
                {t("diff.title")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("diff.description")}</p>
            </div>

            {state.visao === "unificado" ? (
              <pre
                data-testid="text-diff-unified"
                className="max-h-[36rem] overflow-auto rounded-lg border bg-background p-4 font-mono text-xs leading-relaxed">
                {unifiedText || t("diff.empty")}
              </pre>
            ) : (
              <div className="space-y-3" data-testid="text-diff-side-by-side">
                {result.blocks.length === 0 ? (
                  <div className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">{t("diff.empty")}</div>
                ) : (
                  result.blocks.map((block) => (
                    <div
                      key={block.id}
                      data-testid={`text-diff-block-${block.type}`}
                      className="grid gap-3 lg:grid-cols-2">
                      <DiffBlockView block={block} side="original" label={t("diff.originalColumn")} />
                      <DiffBlockView block={block} side="revised" label={t("diff.revisedColumn")} />
                    </div>
                  ))
                )}
              </div>
            )}
          </section>
        </CardContent>
      </Card>

      <section className="mb-8 rounded-lg border p-6" aria-labelledby="text-diff-faq">
        <h2 id="text-diff-faq" className="text-2xl font-semibold tracking-tight">
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

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, Check, Copy, RefreshCw, ShieldCheck, Shuffle, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShareButton } from "@/components/ui/share-button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { replaceQueryString } from "@/components/tools/url-state";
import {
  buildNameDrawerSearchParams,
  buildNameDrawerShareUrl,
  drawNameEntries,
  getNameDrawCandidateEntries,
  getNameDrawValidationCodes,
  normalizeNameDrawQuantity,
  parseNameEntries,
  readNameDrawerContentFromFragment,
  readNameDrawerStateFromParams,
  shuffleNameEntries,
  type NameDrawerState,
  type NameDrawMode,
  type NameDrawResult,
  type NameDrawValidationCode,
  type NameSeparatorMode,
  type NameShuffleResult,
} from "@/lib/tools/generators";
import { cn } from "@/lib/utils/index";

const textareaClassName =
  "border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 min-h-64 w-full min-w-0 resize-y rounded-md border bg-transparent px-3 py-2 text-base leading-relaxed shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive md:text-sm";

const faqIds = ["privacy", "duplicates", "multiple", "replacement", "sharing", "official"] as const;
const seoDetailIds = ["paste", "repeat", "privacy"] as const;

type DrawerResult = NameDrawResult | NameShuffleResult;

function secureRandom() {
  if (typeof crypto === "undefined" || !crypto.getRandomValues) return Math.random();
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] / 2 ** 32;
}

function getBlockingValidationCode(codes: NameDrawValidationCode[]) {
  return codes.find((code) => code === "empty" || code === "singleEntry") ?? null;
}

function buildCopyText(result: DrawerResult, title: string) {
  return [title, ...result.entries.map((entry, index) => `${index + 1}. ${entry.label}`)].join("\n");
}

export function NameDrawerClient() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("tools.sorteador-nomes.form");
  const tFaq = useTranslations("tools.sorteador-nomes.faq");
  const hasReadContentFragment = useRef(false);
  const [state, setState] = useState<NameDrawerState>(() =>
    readNameDrawerStateFromParams(new URLSearchParams(searchParams.toString()))
  );
  const [result, setResult] = useState<DrawerResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [includeContentInUrl, setIncludeContentInUrl] = useState(false);
  const [shareContentOmitted, setShareContentOmitted] = useState(false);
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const parsed = useMemo(
    () => parseNameEntries(state.input, { separator: state.separator, locale }),
    [locale, state.input, state.separator]
  );
  const validationOptions = useMemo(
    () => ({
      quantity: state.mode === "vencedores" ? state.quantity : parsed.stats.validEntries,
      noRepeat: state.mode === "vencedores" ? state.noRepeat : false,
      removeDuplicates: state.removeDuplicates,
    }),
    [parsed.stats.validEntries, state.mode, state.noRepeat, state.quantity, state.removeDuplicates]
  );
  const validationCodes = useMemo(
    () => getNameDrawValidationCodes(parsed, validationOptions),
    [parsed, validationOptions]
  );
  const blockingValidationCode = getBlockingValidationCode(validationCodes);
  const warningCodes = validationCodes.filter((code) => code !== "empty" && code !== "singleEntry");
  const candidateEntries = useMemo(
    () => getNameDrawCandidateEntries(parsed, { removeDuplicates: state.removeDuplicates }),
    [parsed, state.removeDuplicates]
  );
  const liveParams = useMemo(
    () =>
      buildNameDrawerSearchParams({
        input: "",
        mode: state.mode,
        quantity: state.quantity,
        separator: state.separator,
        noRepeat: state.noRepeat,
        removeDuplicates: state.removeDuplicates,
      }).params,
    [state.mode, state.noRepeat, state.quantity, state.removeDuplicates, state.separator]
  );
  const selectedQuantity =
    result?.selectedQuantity ??
    (state.mode === "embaralhar"
      ? candidateEntries.length
      : state.noRepeat
        ? Math.min(normalizeNameDrawQuantity(state.quantity), candidateEntries.length)
        : normalizeNameDrawQuantity(state.quantity));
  const copyText = result
    ? buildCopyText(
        result,
        result.mode === "embaralhar"
          ? t("copySummary.shuffle", { count: numberFormatter.format(result.entries.length) })
          : t("copySummary.winners", { count: numberFormatter.format(result.entries.length) })
      )
    : "";
  const statRows = [
    ["valid", numberFormatter.format(parsed.stats.validEntries)],
    ["unique", numberFormatter.format(parsed.stats.uniqueEntries)],
    ["ignored", numberFormatter.format(parsed.stats.ignoredEmptyEntries)],
    ["duplicates", numberFormatter.format(parsed.stats.duplicateEntries)],
    ["selected", numberFormatter.format(selectedQuantity)],
    ["mode", t(`modes.${state.mode}`)],
  ] as const;

  useEffect(() => {
    if (hasReadContentFragment.current) return;

    hasReadContentFragment.current = true;
    const contentFragment = readNameDrawerContentFromFragment(window.location.hash);
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

  const updateState = (patch: Partial<NameDrawerState>) => {
    setResult(null);
    setCopied(false);
    setShareContentOmitted(false);
    setState((current) => ({ ...current, ...patch }));
  };

  const handleDraw = () => {
    if (blockingValidationCode) return;

    setResult(
      state.mode === "embaralhar"
        ? shuffleNameEntries(parsed, { removeDuplicates: state.removeDuplicates }, secureRandom)
        : drawNameEntries(
            parsed,
            {
              quantity: state.quantity,
              noRepeat: state.noRepeat,
              removeDuplicates: state.removeDuplicates,
            },
            secureRandom
          )
    );
  };

  const copyResult = async () => {
    if (!copyText) return;

    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearInput = () => {
    updateState({ input: "" });
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
              <section className="space-y-4 rounded-lg border p-4" aria-labelledby="name-drawer-input-title">
                <div>
                  <h2 id="name-drawer-input-title" className="font-semibold">
                    {t("input.title")}
                  </h2>
                  <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {t("input.privacy")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name-drawer-input">{t("input.label")}</Label>
                  <textarea
                    id="name-drawer-input"
                    data-testid="name-drawer-input"
                    className={textareaClassName}
                    value={state.input}
                    onChange={(event) => updateState({ input: event.target.value })}
                    placeholder={t("input.placeholder")}
                    spellCheck={false}
                    aria-invalid={validationCodes.includes("inputTooLong") || validationCodes.includes("entryTooLong")}
                  />
                  <p className="text-xs text-muted-foreground">{t("input.guidance")}</p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={clearInput}
                  disabled={!state.input}
                  data-testid="name-drawer-clear">
                  <Trash2 className="h-4 w-4" />
                  {t("actions.clear")}
                </Button>
              </section>

              <section className="space-y-4 rounded-lg border p-4" aria-labelledby="name-drawer-settings-title">
                <div>
                  <h2 id="name-drawer-settings-title" className="font-semibold">
                    {t("settings.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("settings.description")}</p>
                </div>

                <div className="space-y-2">
                  <Label>{t("modes.label")}</Label>
                  <Tabs
                    value={state.mode}
                    onValueChange={(value) => updateState({ mode: value as NameDrawMode })}
                    data-testid="name-drawer-mode-selector">
                    <TabsList className="grid h-auto w-full grid-cols-2">
                      {(["vencedores", "embaralhar"] satisfies NameDrawMode[]).map((mode) => (
                        <TabsTrigger key={mode} value={mode} data-testid={`name-drawer-mode-${mode}`}>
                          {t(`modes.${mode}`)}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name-drawer-quantity">{t("quantity.label")}</Label>
                    <Input
                      id="name-drawer-quantity"
                      data-testid="name-drawer-quantity"
                      type="number"
                      min={1}
                      max={500}
                      value={state.quantity}
                      disabled={state.mode === "embaralhar"}
                      onChange={(event) => updateState({ quantity: Number(event.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">{t("quantity.help")}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name-drawer-separator">{t("separator.label")}</Label>
                    <Select
                      value={state.separator}
                      onValueChange={(value) => updateState({ separator: value as NameSeparatorMode })}>
                      <SelectTrigger
                        id="name-drawer-separator"
                        data-testid="name-drawer-separator"
                        aria-label={t("separator.label")}
                        className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="linhas">{t("separator.options.linhas")}</SelectItem>
                        <SelectItem value="auto">{t("separator.options.auto")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">{t("separator.help")}</p>
                  </div>
                </div>

                <div className="grid gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
                  <label className="flex items-start gap-2">
                    <input
                      id="name-drawer-no-repeat"
                      data-testid="name-drawer-no-repeat"
                      type="checkbox"
                      checked={state.noRepeat}
                      disabled={state.mode === "embaralhar"}
                      onChange={(event) => updateState({ noRepeat: event.target.checked })}
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-medium">{t("toggles.noRepeat")}</span>
                      <span className="text-muted-foreground">{t("toggles.noRepeatHelp")}</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-2">
                    <input
                      id="name-drawer-remove-duplicates"
                      data-testid="name-drawer-remove-duplicates"
                      type="checkbox"
                      checked={state.removeDuplicates}
                      onChange={(event) => updateState({ removeDuplicates: event.target.checked })}
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-medium">{t("toggles.removeDuplicates")}</span>
                      <span className="text-muted-foreground">{t("toggles.removeDuplicatesHelp")}</span>
                    </span>
                  </label>
                </div>
              </section>

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="name-drawer-share-title">
                <div>
                  <h2 id="name-drawer-share-title" className="font-semibold">
                    {t("share.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("share.description")}</p>
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    id="name-drawer-include-content"
                    data-testid="name-drawer-include-content"
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
                  data-testid="name-drawer-share-warning"
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
                <div data-testid="name-drawer-share-button">
                  <ShareButton
                    className="w-full sm:w-auto"
                    getShareUrl={() => {
                      const shareUrl = buildNameDrawerShareUrl(
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

            <aside className="space-y-5 rounded-lg border bg-muted/30 p-4" aria-labelledby="name-drawer-results-title">
              <div>
                <h2 id="name-drawer-results-title" className="font-semibold">
                  {t("result.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("result.description")}</p>
              </div>

              <div
                data-testid="name-drawer-validation"
                aria-live="polite"
                className={cn(
                  "rounded-lg border bg-background p-4",
                  blockingValidationCode ? "border-amber-300" : "border-emerald-200"
                )}>
                <div className="flex items-start gap-3">
                  {blockingValidationCode ? (
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  ) : (
                    <Users className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium">
                      {blockingValidationCode ? t(`validation.${blockingValidationCode}`) : t("validation.ready")}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("validation.summary", {
                        count: numberFormatter.format(candidateEntries.length),
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {warningCodes.length > 0 ? (
                <div className="space-y-2 rounded-lg border border-amber-300 bg-background p-4">
                  {warningCodes.map((code) => (
                    <p key={code} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      {t(`validation.${code}`, {
                        count:
                          code === "inputTooLong"
                            ? numberFormatter.format(parsed.stats.inputLength)
                            : code === "entryLimitReached"
                              ? numberFormatter.format(parsed.stats.truncatedEntries)
                              : code === "entryTooLong"
                                ? numberFormatter.format(parsed.stats.tooLongEntries)
                                : code === "duplicatesFound"
                                  ? numberFormatter.format(parsed.stats.duplicateEntries)
                                  : numberFormatter.format(candidateEntries.length),
                      })}
                    </p>
                  ))}
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                {statRows.map(([key, value]) => (
                  <div key={key} className="rounded-lg border bg-background p-3">
                    <p className="text-xs font-medium text-muted-foreground">{t(`stats.${key}`)}</p>
                    <p data-testid={`name-drawer-stat-${key}`} className="mt-1 font-semibold tabular-nums">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div
                data-testid="name-drawer-results"
                className="min-h-48 rounded-lg border bg-background p-4"
                aria-live="polite">
                {result ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      {result.mode === "embaralhar"
                        ? t("result.shuffleTitle", { count: numberFormatter.format(result.entries.length) })
                        : t("result.winnersTitle", { count: numberFormatter.format(result.entries.length) })}
                    </p>
                    <ol className="grid gap-2 sm:grid-cols-2">
                      {result.entries.map((entry, index) => (
                        <li
                          key={`${entry.id}-${index}`}
                          className="flex min-h-12 min-w-0 items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-background text-xs font-semibold tabular-nums">
                            {numberFormatter.format(index + 1)}
                          </span>
                          <span className="min-w-0 break-words text-sm font-medium" title={entry.normalizedLabel}>
                            {entry.label}
                          </span>
                        </li>
                      ))}
                    </ol>
                    {result.mode === "vencedores" && result.cappedByAvailable ? (
                      <p className="text-sm text-muted-foreground">{t("result.capped")}</p>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex h-full min-h-40 items-center justify-center text-center text-sm text-muted-foreground">
                    {blockingValidationCode ? t("result.waiting") : t("result.ready")}
                  </div>
                )}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  onClick={handleDraw}
                  disabled={Boolean(blockingValidationCode)}
                  data-testid="name-drawer-draw">
                  {state.mode === "embaralhar" ? <Shuffle className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                  {state.mode === "embaralhar"
                    ? t("actions.shuffle")
                    : result
                      ? t("actions.drawAgain")
                      : t("actions.draw")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={copyResult}
                  disabled={!copyText}
                  data-testid="name-drawer-copy-result">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? t("actions.copied") : t("actions.copyResult")}
                </Button>
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">{t("result.disclaimer")}</p>
            </aside>
          </div>
        </CardContent>
      </Card>

      <section className="mb-8 rounded-lg border p-6" aria-labelledby="name-drawer-seo-details">
        <h2 id="name-drawer-seo-details" className="text-2xl font-semibold tracking-tight">
          {t("seoDetails.title")}
        </h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {seoDetailIds.map((detailId) => (
            <div key={detailId} className="space-y-2">
              <h3 className="font-semibold">{t(`seoDetails.${detailId}.title`)}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{t(`seoDetails.${detailId}.description`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 rounded-lg border p-6" aria-labelledby="name-drawer-faq">
        <h2 id="name-drawer-faq" className="text-2xl font-semibold tracking-tight">
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

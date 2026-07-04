"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  Fingerprint,
  Info,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ShareButton } from "@/components/ui/share-button";
import { replaceQueryString } from "@/components/tools/url-state";
import {
  HASH_TEXT_MAX_INPUT_LENGTH,
  buildHashTextSearchParams,
  buildHashTextShareUrl,
  createHashTextHashingResult,
  hashTextAlgorithms,
  processHashText,
  readHashTextContentFromFragment,
  readHashTextStateFromParams,
  type HashTextAlgorithmId,
  type HashTextOutputFormat,
  type HashTextResult,
  type HashTextState,
  type HashTextWarning,
} from "@/lib/tools/hash-text";
import { cn } from "@/lib/utils/index";

const editorClassName =
  "border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 min-h-72 w-full min-w-0 resize-y rounded-md border bg-transparent px-3 py-2 font-mono text-sm leading-relaxed shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive";

const recommendedAlgorithms: HashTextAlgorithmId[] = ["sha-256", "sha-384", "sha-512"];
const legacyAlgorithms: HashTextAlgorithmId[] = ["sha-1", "md5"];
const outputFormats: HashTextOutputFormat[] = ["hex", "base64", "base64url"];
const faqIds = ["privacy", "algorithm", "legacy", "encryption", "passwords", "exactText", "sharing", "files"] as const;

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function getWarningTestId(warning: HashTextWarning) {
  return `hash-text-warning-${warning}`;
}

export function HashTextClient() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("tools.hash-texto.form");
  const tFaq = useTranslations("tools.hash-texto.faq");
  const hasReadContentFragment = useRef(false);
  const [state, setState] = useState<HashTextState>(() =>
    readHashTextStateFromParams(new URLSearchParams(searchParams.toString()))
  );
  const [result, setResult] = useState<HashTextResult>(() => createHashTextHashingResult(state));
  const [includeContentInUrl, setIncludeContentInUrl] = useState(false);
  const [shareContentOmitted, setShareContentOmitted] = useState(false);
  const [copied, setCopied] = useState<"hash" | "summary" | "all" | null>(null);

  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const liveParams = useMemo(
    () =>
      buildHashTextSearchParams({
        input: "",
        algorithm: state.algorithm,
        format: state.format,
        uppercaseHex: state.uppercaseHex,
      }).params,
    [state.algorithm, state.format, state.uppercaseHex]
  );
  const algorithm = hashTextAlgorithms.find((item) => item.id === state.algorithm) ?? hashTextAlgorithms[0];
  const formatLabel = t(`formats.${state.format}`);
  const outputLabel = `${result.algorithm.label} ${formatLabel}`;
  const statusDescription =
    result.status === "valid"
      ? t("result.validDescription", {
          algorithm: result.algorithm.label,
          bits: numberFormatter.format(result.digestMetrics?.digestBits ?? result.algorithm.digestBits),
        })
      : result.status === "tooLarge"
        ? t("result.tooLargeDescription", { limit: numberFormatter.format(HASH_TEXT_MAX_INPUT_LENGTH) })
        : result.status === "unsupported"
          ? t("result.unsupportedDescription")
          : result.status === "error"
            ? t("result.errorDescription")
            : result.status === "hashing"
              ? t("result.hashingDescription")
              : t("result.emptyDescription");

  useEffect(() => {
    if (hasReadContentFragment.current) return;

    hasReadContentFragment.current = true;
    const contentFragment = readHashTextContentFromFragment(window.location.hash);
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

  useEffect(() => {
    let cancelled = false;

    processHashText(state).then((nextResult) => {
      if (!cancelled) {
        setResult(nextResult);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [state]);

  const updateState = (patch: Partial<HashTextState>) => {
    setShareContentOmitted(false);
    setState((current) => ({
      ...current,
      ...patch,
    }));
  };

  const copyToClipboard = async (value: string, type: "hash" | "summary" | "all") => {
    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const buildSummary = () => {
    if (!result.hash) return "";

    return [
      t("summary.title", { algorithm: result.algorithm.label, format: formatLabel }),
      result.hash,
      t("summary.input", {
        characters: numberFormatter.format(result.inputMetrics.characters),
        bytes: numberFormatter.format(result.inputMetrics.utf8Bytes),
        lines: numberFormatter.format(result.inputMetrics.lines),
      }),
      t("summary.digest", {
        bits: numberFormatter.format(result.digestMetrics?.digestBits ?? 0),
        bytes: numberFormatter.format(result.digestMetrics?.digestBytes ?? 0),
      }),
    ].join("\n");
  };

  const buildAllHashes = () => {
    if (!result.hash) return "";

    const lines = [`${outputLabel}: ${result.hash}`];

    for (const comparison of result.comparisons) {
      lines.push(`${comparison.algorithm.label} ${formatLabel}: ${comparison.hash}`);
    }

    return lines.join("\n");
  };

  const downloadResult = () => {
    if (!result.hash) return;

    const content = [t("download.title"), buildSummary(), "", t("download.caveat")].join("\n");
    downloadBlob(new Blob([content], { type: "text/plain;charset=utf-8" }), "hash-texto.txt");
  };

  const clearInput = () => updateState({ input: "" });
  const securityKey = result.algorithm.id === "md5" ? "md5" : result.algorithm.id === "sha-1" ? "sha1" : "recommended";
  const StatusIcon =
    result.status === "valid"
      ? Check
      : result.status === "empty" || result.status === "hashing"
        ? Fingerprint
        : AlertTriangle;

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
              <section className="space-y-4 rounded-lg border p-4" aria-labelledby="hash-text-input-title">
                <div>
                  <h2 id="hash-text-input-title" className="font-semibold">
                    {t("input.title")}
                  </h2>
                  <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {t("input.privacy")}
                  </p>
                  <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    {t("input.exact")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hash-text-input">{t("input.label")}</Label>
                  <textarea
                    id="hash-text-input"
                    data-testid="hash-text-input"
                    className={editorClassName}
                    value={state.input}
                    onChange={(event) => updateState({ input: event.target.value })}
                    placeholder={t("input.placeholder")}
                    spellCheck={false}
                    aria-invalid={result.status === "tooLarge"}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearInput}
                  disabled={!state.input}
                  data-testid="hash-text-clear">
                  <Trash2 className="h-4 w-4" />
                  {t("actions.clear")}
                </Button>
              </section>

              <section className="space-y-4 rounded-lg border p-4" aria-labelledby="hash-text-options-title">
                <div>
                  <h2 id="hash-text-options-title" className="font-semibold">
                    {t("options.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("options.description")}</p>
                </div>

                <fieldset className="space-y-3" data-testid="hash-text-algorithm-selector">
                  <legend className="text-sm font-medium">{t("algorithms.label")}</legend>
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase text-muted-foreground">{t("algorithms.recommended")}</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {recommendedAlgorithms.map((algorithmId) => {
                        const item = hashTextAlgorithms.find((entry) => entry.id === algorithmId) ?? algorithm;

                        return (
                          <Button
                            key={algorithmId}
                            type="button"
                            variant={state.algorithm === algorithmId ? "default" : "outline"}
                            onClick={() => updateState({ algorithm: algorithmId })}
                            aria-pressed={state.algorithm === algorithmId}
                            data-testid={`hash-text-algorithm-${algorithmId}`}
                            className="w-full">
                            {item.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase text-muted-foreground">{t("algorithms.legacy")}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {legacyAlgorithms.map((algorithmId) => {
                        const item = hashTextAlgorithms.find((entry) => entry.id === algorithmId) ?? algorithm;

                        return (
                          <Button
                            key={algorithmId}
                            type="button"
                            variant={state.algorithm === algorithmId ? "default" : "outline"}
                            onClick={() => updateState({ algorithm: algorithmId })}
                            aria-pressed={state.algorithm === algorithmId}
                            data-testid={`hash-text-algorithm-${algorithmId}`}
                            className="w-full">
                            <ShieldAlert className="h-4 w-4" />
                            {item.label}
                          </Button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">{t("algorithms.legacyDescription")}</p>
                  </div>
                </fieldset>

                <fieldset className="space-y-2" data-testid="hash-text-format-selector">
                  <legend className="text-sm font-medium">{t("formats.label")}</legend>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {outputFormats.map((format) => (
                      <Button
                        key={format}
                        type="button"
                        variant={state.format === format ? "default" : "outline"}
                        onClick={() => updateState({ format })}
                        aria-pressed={state.format === format}
                        data-testid={`hash-text-format-${format}`}
                        className="w-full">
                        {t(`formats.${format}`)}
                      </Button>
                    ))}
                  </div>
                </fieldset>

                <label
                  className={cn(
                    "flex items-start gap-2 rounded-lg border p-3 text-sm",
                    state.format === "hex" ? "" : "opacity-70"
                  )}>
                  <input
                    id="hash-text-uppercase"
                    data-testid="hash-text-uppercase"
                    type="checkbox"
                    checked={state.uppercaseHex}
                    onChange={(event) => updateState({ uppercaseHex: event.target.checked })}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-medium">{t("uppercase.label")}</span>
                    <span className="block text-muted-foreground">{t("uppercase.description")}</span>
                  </span>
                </label>
              </section>

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="hash-text-share-title">
                <div>
                  <h2 id="hash-text-share-title" className="font-semibold">
                    {t("share.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("share.description")}</p>
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    id="hash-text-include-content"
                    data-testid="hash-text-include-content"
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
                <div data-testid="hash-text-share-button">
                  <ShareButton
                    className="w-full sm:w-auto"
                    getShareUrl={() => {
                      const shareUrl = buildHashTextShareUrl(`${window.location.origin}${window.location.pathname}`, state, {
                        includeContent: includeContentInUrl,
                      });
                      setShareContentOmitted(shareUrl.contentOmitted);

                      return shareUrl.url;
                    }}
                  />
                </div>
              </section>
            </div>

            <aside className="space-y-5 rounded-lg border bg-muted/30 p-4" aria-labelledby="hash-text-results">
              <div>
                <h2 id="hash-text-results" className="font-semibold">
                  {t("result.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("result.description")}</p>
              </div>

              <div
                data-testid="hash-text-status"
                aria-live="polite"
                className={cn(
                  "rounded-lg border bg-background p-4",
                  result.status === "valid" ? "border-emerald-200" : "",
                  result.status === "tooLarge" || result.status === "unsupported" || result.status === "error"
                    ? "border-amber-300"
                    : ""
                )}>
                <div className="flex items-start gap-3">
                  <StatusIcon
                    className={cn(
                      "mt-0.5 h-5 w-5 shrink-0",
                      result.status === "valid"
                        ? "text-emerald-600"
                        : result.status === "empty" || result.status === "hashing"
                          ? "text-muted-foreground"
                          : "text-amber-600"
                    )}
                  />
                  <div className="min-w-0">
                    <p className="font-medium">{t(`result.status.${result.status}`)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{statusDescription}</p>
                  </div>
                </div>
              </div>

              {result.warnings.length > 0 ? (
                <div className="flex flex-wrap gap-2" data-testid="hash-text-warnings">
                  {result.warnings.map((warning) => (
                    <span
                      key={warning}
                      data-testid={getWarningTestId(warning)}
                      className="rounded-full border border-amber-300 bg-background px-3 py-1 text-xs text-amber-700 dark:text-amber-300">
                      {t(`warnings.${warning}`)}
                    </span>
                  ))}
                </div>
              ) : null}

              <div
                data-testid={result.securityLevel === "legacy" ? "hash-text-legacy-warning" : "hash-text-security-note"}
                className={cn(
                  "rounded-lg border bg-background p-4",
                  result.securityLevel === "legacy" ? "border-amber-300" : "border-emerald-200"
                )}>
                <div className="flex items-start gap-3">
                  {result.securityLevel === "legacy" ? (
                    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  ) : (
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  )}
                  <div>
                    <p className="font-medium">{t(`security.${securityKey}.title`)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t(`security.${securityKey}.description`)}</p>
                  </div>
                </div>
              </div>

              {result.hash ? (
                <div className="space-y-2">
                  <Label htmlFor="hash-text-output">{t("result.outputLabel", { label: outputLabel })}</Label>
                  <textarea
                    id="hash-text-output"
                    data-testid="hash-text-output"
                    readOnly
                    className={cn(editorClassName, "min-h-44 bg-background")}
                    value={result.hash}
                  />
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border bg-background p-3" data-testid="hash-text-input-metrics">
                  <p className="text-xs font-medium text-muted-foreground">{t("metrics.input")}</p>
                  <div className="mt-2 space-y-1">
                    {(["characters", "utf8Bytes", "lines"] as const).map((metricId) => (
                      <p key={metricId} className="flex justify-between gap-3 text-sm">
                        <span>{t(`metrics.${metricId}`)}</span>
                        <span data-testid={`hash-text-metric-input-${metricId}`} className="font-medium tabular-nums">
                          {numberFormatter.format(result.inputMetrics[metricId])}
                        </span>
                      </p>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border bg-background p-3" data-testid="hash-text-digest-metrics">
                  <p className="text-xs font-medium text-muted-foreground">{t("metrics.digest")}</p>
                  <div className="mt-2 space-y-1">
                    {result.digestMetrics ? (
                      (["digestBits", "digestBytes", "outputLength"] as const).map((metricId) => (
                        <p key={metricId} className="flex justify-between gap-3 text-sm">
                          <span>{t(`metrics.${metricId}`)}</span>
                          <span data-testid={`hash-text-metric-digest-${metricId}`} className="font-medium tabular-nums">
                            {numberFormatter.format(result.digestMetrics?.[metricId] ?? 0)}
                          </span>
                        </p>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">{t("metrics.noDigest")}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(result.hash, "hash")}
                  disabled={!result.hash}
                  data-testid="hash-text-copy-hash">
                  {copied === "hash" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "hash" ? t("actions.copied") : t("actions.copyHash")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(buildSummary(), "summary")}
                  disabled={!result.hash}
                  data-testid="hash-text-copy-summary">
                  {copied === "summary" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "summary" ? t("actions.copied") : t("actions.copySummary")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(buildAllHashes(), "all")}
                  disabled={!result.hash}
                  data-testid="hash-text-copy-all">
                  {copied === "all" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "all" ? t("actions.copied") : t("actions.copyAll")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadResult}
                  disabled={!result.hash}
                  data-testid="hash-text-download">
                  <Download className="h-4 w-4" />
                  {t("actions.download")}
                </Button>
              </div>
            </aside>
          </div>
        </CardContent>
      </Card>

      {result.comparisons.length > 0 ? (
        <section className="mb-8 rounded-lg border p-6" aria-labelledby="hash-text-comparisons">
          <h2 id="hash-text-comparisons" className="text-2xl font-semibold tracking-tight">
            {t("comparison.title")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("comparison.description")}</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {result.comparisons.map((comparison) => (
              <div
                key={comparison.algorithm.id}
                data-testid={`hash-text-comparison-${comparison.algorithm.id}`}
                className="min-w-0 rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{comparison.algorithm.label}</h3>
                  {comparison.algorithm.securityLevel === "legacy" ? (
                    <span className="rounded-full border border-amber-300 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300">
                      {t("comparison.legacy")}
                    </span>
                  ) : (
                    <span className="rounded-full border border-emerald-300 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                      {t("comparison.recommended")}
                    </span>
                  )}
                </div>
                <p className="mt-3 break-all font-mono text-xs leading-relaxed text-muted-foreground">
                  {comparison.hash}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mb-8 rounded-lg border p-6" aria-labelledby="hash-text-seo-details">
        <h2 id="hash-text-seo-details" className="text-2xl font-semibold tracking-tight">
          {t("seoDetails.title")}
        </h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {(["hash", "encoding", "passwords"] as const).map((detailId) => (
            <div key={detailId} className="space-y-2">
              <h3 className="font-semibold">{t(`seoDetails.${detailId}.title`)}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t(`seoDetails.${detailId}.description`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 rounded-lg border p-6" aria-labelledby="hash-text-faq">
        <h2 id="hash-text-faq" className="text-2xl font-semibold tracking-tight">
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

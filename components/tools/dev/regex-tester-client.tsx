"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, Check, ClipboardCopy, Copy, Play, Regex, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ShareButton } from "@/components/ui/share-button";
import { replaceQueryString } from "@/components/tools/url-state";
import {
  REGEX_TESTER_FLAG_ORDER,
  REGEX_TESTER_MATCH_LIMIT_OPTIONS,
  REGEX_TESTER_MAX_PATTERN_LENGTH,
  REGEX_TESTER_MAX_TEXT_LENGTH,
  REGEX_TESTER_PREVIEW_TEXT_LIMIT,
  REGEX_TESTER_UI_FLAG_ORDER,
  buildRegexHighlightSegments,
  buildRegexTesterSearchParams,
  buildRegexTesterShareUrl,
  buildRegexTesterPreflightResult,
  buildRegexTesterTimeoutResult,
  getRegexTextMetrics,
  parseRegexLiteral,
  readRegexTesterContentFromFragment,
  readRegexTesterStateFromParams,
  shouldProcessRegexTesterInWorker,
  toggleRegexFlag,
  type RegexCaptureGroup,
  type RegexMatchLimit,
  type RegexMatchResult,
  type RegexNamedGroup,
  type RegexRange,
  type RegexTesterResult,
  type RegexTesterState,
  type RegexTesterWarning,
} from "@/lib/tools/regex";
import { cn } from "@/lib/utils/index";

const REGEX_TESTER_WORKER_TIMEOUT_MS = 900;
const REGEX_TESTER_WORKER_DEBOUNCE_MS = 120;
const inputClassName =
  "border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 w-full min-w-0 rounded-md border bg-transparent px-3 py-2 font-mono text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive";
const editorClassName = cn(inputClassName, "min-h-80 resize-y leading-relaxed");
const faqIds = ["privacy", "engine", "flags", "groups", "compatibility", "performance", "sharing"] as const;
type Translator = ReturnType<typeof useTranslations>;

interface RegexTesterWorkerRequest {
  id: number;
  state: RegexTesterState;
}

interface RegexTesterWorkerResponse {
  id: number;
  result: RegexTesterResult;
}

function formatRange(range: RegexRange | null, numberFormatter: Intl.NumberFormat) {
  return range ? `${numberFormatter.format(range.start)}-${numberFormatter.format(range.end)}` : "";
}

function buildMatchesCopyValue(matches: RegexMatchResult[]) {
  return matches
    .map((match) => `#${match.number} [${match.start}, ${match.end}) ${match.text}`)
    .join("\n");
}

function buildGroupsCopyValue(matches: RegexMatchResult[]) {
  return JSON.stringify(
    matches.map((match) => ({
      match: match.number,
      text: match.text,
      start: match.start,
      end: match.end,
      groups: match.groups.map((group) => ({
        index: group.index,
        value: group.value,
        range: group.range,
      })),
      namedGroups: Object.fromEntries(
        match.namedGroups.map((group) => [
          group.name,
          {
            value: group.value,
            range: group.range,
          },
        ])
      ),
    })),
    null,
    2
  );
}

function isRegexTesterResultCurrent(result: RegexTesterResult | null, state: RegexTesterState) {
  return (
    result !== null &&
    result.pattern === state.pattern &&
    result.text === state.text &&
    result.flagsUsed === buildRegexTesterSearchParams(state).params.get("flags") &&
    result.summary.matchLimit === state.limit
  );
}

function GroupRows({
  groups,
  namedGroups,
  numberFormatter,
  t,
}: {
  groups: RegexCaptureGroup[];
  namedGroups: RegexNamedGroup[];
  numberFormatter: Intl.NumberFormat;
  t: Translator;
}) {
  if (groups.length === 0 && namedGroups.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("matches.noGroups")}</p>;
  }

  return (
    <div className="min-w-0 space-y-3">
      {groups.length > 0 ? (
        <div className="min-w-0 space-y-2" data-testid="regex-tester-numbered-groups">
          <p className="text-xs font-medium uppercase text-muted-foreground">{t("matches.numberedGroups")}</p>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="bg-muted/60 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">{t("matches.group")}</th>
                  <th className="px-3 py-2 font-medium">{t("matches.value")}</th>
                  <th className="px-3 py-2 font-medium">{t("matches.range")}</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group.index} className="border-t">
                    <td className="px-3 py-2 font-mono text-xs">{group.index}</td>
                    <td className="max-w-[16rem] px-3 py-2">
                      <code className="whitespace-pre-wrap break-words text-xs">
                        {group.value ?? t("matches.unmatched")}
                      </code>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {group.range ? formatRange(group.range, numberFormatter) : t("matches.noRange")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {namedGroups.length > 0 ? (
        <div className="min-w-0 space-y-2" data-testid="regex-tester-named-groups">
          <p className="text-xs font-medium uppercase text-muted-foreground">{t("matches.namedGroups")}</p>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="bg-muted/60 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">{t("matches.name")}</th>
                  <th className="px-3 py-2 font-medium">{t("matches.value")}</th>
                  <th className="px-3 py-2 font-medium">{t("matches.range")}</th>
                </tr>
              </thead>
              <tbody>
                {namedGroups.map((group) => (
                  <tr key={group.name} className="border-t">
                    <td className="px-3 py-2 font-mono text-xs">{group.name}</td>
                    <td className="max-w-[16rem] px-3 py-2">
                      <code className="whitespace-pre-wrap break-words text-xs">
                        {group.value ?? t("matches.unmatched")}
                      </code>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {group.range ? formatRange(group.range, numberFormatter) : t("matches.noRange")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function RegexTesterClient() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("tools.regex-tester.form");
  const tFaq = useTranslations("tools.regex-tester.faq");
  const hasReadContentFragment = useRef(false);
  const workerRequestId = useRef(0);
  const [state, setState] = useState<RegexTesterState>(() =>
    readRegexTesterStateFromParams(new URLSearchParams(searchParams.toString()))
  );
  const [workerResult, setWorkerResult] = useState<RegexTesterResult | null>(null);
  const [includeContentInUrl, setIncludeContentInUrl] = useState(false);
  const [shareContentOmitted, setShareContentOmitted] = useState(false);
  const [copied, setCopied] = useState<"matches" | "first" | "groups" | "error" | null>(null);

  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const preflightResult = useMemo(() => buildRegexTesterPreflightResult(state), [state]);
  const shouldRunWorker = useMemo(() => shouldProcessRegexTesterInWorker(state), [state]);
  const isWorkerResultCurrent = isRegexTesterResultCurrent(workerResult, state);
  const isProcessing = shouldRunWorker && !isWorkerResultCurrent;
  const result: RegexTesterResult = isWorkerResultCurrent && workerResult !== null ? workerResult : preflightResult;
  const textMetrics = useMemo(() => getRegexTextMetrics(state.text), [state.text]);
  const patternLiteral = useMemo(() => parseRegexLiteral(state.pattern), [state.pattern]);
  const liveParams = useMemo(() => buildRegexTesterSearchParams(state).params, [state]);
  const highlightSegments = useMemo(
    () => buildRegexHighlightSegments(state.text, result.matches),
    [result.matches, state.text]
  );
  const matchesCopyValue = useMemo(() => buildMatchesCopyValue(result.matches), [result.matches]);
  const firstMatchCopyValue = result.matches[0]?.text ?? "";
  const groupsCopyValue = useMemo(() => buildGroupsCopyValue(result.matches), [result.matches]);
  const errorCopyValue =
    result.error === null
      ? ""
      : [
          t(`errors.${result.error.code}`),
          result.error.flags?.length ? t("errors.flags", { flags: result.error.flags.join(", ") }) : "",
          result.error.engineMessage ? t("errors.engine", { message: result.error.engineMessage }) : "",
        ]
          .filter(Boolean)
          .join("\n");

  useEffect(() => {
    if (hasReadContentFragment.current) return;

    hasReadContentFragment.current = true;
    const contentFragment = readRegexTesterContentFromFragment(window.location.hash);
    if (!contentFragment.hasExplicitContent) return;

    const timeoutId = window.setTimeout(() => {
      setState((current) => ({
        ...current,
        pattern: contentFragment.pattern,
        text: contentFragment.text,
      }));
      setIncludeContentInUrl(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    replaceQueryString(liveParams);
  }, [liveParams]);

  useEffect(() => {
    const requestId = workerRequestId.current + 1;
    workerRequestId.current = requestId;

    if (!shouldRunWorker) {
      return;
    }

    let worker: Worker | null = null;
    let timeoutId: number | undefined;

    const finishWithResult = (nextResult: RegexTesterResult) => {
      if (workerRequestId.current !== requestId) return;

      setWorkerResult(nextResult);
    };

    const terminateWorker = () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }

      worker?.terminate();
      worker = null;
    };

    const debounceId = window.setTimeout(() => {
      try {
        worker = new Worker(new URL("./regex-tester-worker.ts", import.meta.url), {
          name: "regex-tester",
          type: "module",
        });
      } catch {
        finishWithResult(buildRegexTesterTimeoutResult(state));
        return;
      }

      timeoutId = window.setTimeout(() => {
        terminateWorker();
        finishWithResult(buildRegexTesterTimeoutResult(state));
      }, REGEX_TESTER_WORKER_TIMEOUT_MS);

      worker.onmessage = (event: MessageEvent<RegexTesterWorkerResponse>) => {
        if (event.data.id !== requestId) return;

        const nextResult = event.data.result;
        terminateWorker();
        finishWithResult(nextResult);
      };

      worker.onerror = (event) => {
        event.preventDefault();
        terminateWorker();
        finishWithResult(buildRegexTesterTimeoutResult(state));
      };

      worker.postMessage({ id: requestId, state } satisfies RegexTesterWorkerRequest);
    }, REGEX_TESTER_WORKER_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(debounceId);
      terminateWorker();
    };
  }, [shouldRunWorker, state]);

  const updateState = (patch: Partial<RegexTesterState>) => {
    setShareContentOmitted(false);
    setState((current) => ({
      ...current,
      ...patch,
    }));
  };

  const copyToClipboard = async (value: string, type: "matches" | "first" | "groups" | "error") => {
    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const loadExample = () => {
    updateState({
      pattern: t("examples.pattern"),
      text: t("examples.text"),
      flags: "g",
      limit: 100,
    });
  };

  const applyLiteralParse = () => {
    if (!patternLiteral.parsed) return;

    updateState({
      pattern: patternLiteral.pattern,
      flags: patternLiteral.flags,
    });
  };

  const getStatusDescription = () => {
    if (isProcessing) return t("result.processingDescription");

    if (result.status === "tooLarge" && result.error?.code === "patternTooLarge") {
      return t("result.patternTooLargeDescription", {
        limit: numberFormatter.format(REGEX_TESTER_MAX_PATTERN_LENGTH),
      });
    }

    if (result.status === "tooLarge") {
      return t("result.textTooLargeDescription", {
        limit: numberFormatter.format(REGEX_TESTER_MAX_TEXT_LENGTH),
      });
    }

    if (result.status === "valid" || result.status === "tooManyMatches") {
      return t(result.summary.truncated ? "result.truncatedDescription" : "result.validDescription", {
        count: numberFormatter.format(result.summary.shownMatches),
        limit: numberFormatter.format(result.summary.matchLimit),
      });
    }

    if (result.status === "invalidPattern") return t("result.invalidPatternDescription");
    if (result.status === "invalidFlags") return t("result.invalidFlagsDescription");
    if (result.status === "needsText") return t("result.needsTextDescription");
    if (result.status === "noMatch") return t("result.noMatchDescription");
    if (result.status === "timeout") return t("result.timeoutDescription");

    return t("result.emptyDescription");
  };

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div className="min-w-0 space-y-6">
              <section className="min-w-0 space-y-4 rounded-lg border p-4" aria-labelledby="regex-tester-pattern-title">
                <div>
                  <h2 id="regex-tester-pattern-title" className="font-semibold">
                    {t("pattern.title")}
                  </h2>
                  <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {t("pattern.privacy")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regex-tester-pattern">{t("pattern.label")}</Label>
                  <input
                    id="regex-tester-pattern"
                    data-testid="regex-tester-pattern"
                    className={inputClassName}
                    value={state.pattern}
                    onChange={(event) => updateState({ pattern: event.target.value })}
                    placeholder={t("pattern.placeholder")}
                    spellCheck={false}
                    aria-invalid={result.status === "invalidPattern" || result.error?.code === "patternTooLarge"}
                  />
                  <p className="text-xs text-muted-foreground">{t("pattern.hint")}</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={applyLiteralParse}
                    disabled={!patternLiteral.parsed}
                    data-testid="regex-tester-parse-literal">
                    <Regex className="h-4 w-4" />
                    {patternLiteral.parsed ? t("actions.parseLiteral") : t("actions.noLiteral")}
                  </Button>
                  <Button type="button" variant="outline" onClick={loadExample} data-testid="regex-tester-load-example">
                    <Play className="h-4 w-4" />
                    {t("actions.loadExample")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => updateState({ pattern: "", text: "" })}
                    disabled={!state.pattern && !state.text}
                    data-testid="regex-tester-clear">
                    <Trash2 className="h-4 w-4" />
                    {t("actions.clear")}
                  </Button>
                </div>
              </section>

              <section className="min-w-0 space-y-4 rounded-lg border p-4" aria-labelledby="regex-tester-options-title">
                <div>
                  <h2 id="regex-tester-options-title" className="font-semibold">
                    {t("options.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("options.description")}</p>
                </div>
                <fieldset className="space-y-2" data-testid="regex-tester-flags">
                  <legend className="text-sm font-medium">{t("flags.label")}</legend>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {REGEX_TESTER_UI_FLAG_ORDER.map((flag) => {
                      const isActive = state.flags.includes(flag);

                      return (
                        <Button
                          key={flag}
                          type="button"
                          variant={isActive ? "default" : "outline"}
                          onClick={() => updateState({ flags: toggleRegexFlag(state.flags, flag, !isActive) })}
                          aria-pressed={isActive}
                          title={t(`flags.descriptions.${flag}`)}
                          data-testid={`regex-tester-flag-${flag}`}
                          className="justify-start font-mono">
                          {flag}
                          <span className="ml-2 truncate font-sans text-xs">{t(`flags.labels.${flag}`)}</span>
                        </Button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">{t("flags.description")}</p>
                </fieldset>
                <div className="grid gap-2 sm:max-w-xs">
                  <Label htmlFor="regex-tester-limit">{t("limit.label")}</Label>
                  <select
                    id="regex-tester-limit"
                    data-testid="regex-tester-limit"
                    className={inputClassName}
                    value={state.limit}
                    onChange={(event) => updateState({ limit: Number(event.target.value) as RegexMatchLimit })}>
                    {REGEX_TESTER_MATCH_LIMIT_OPTIONS.map((limit) => (
                      <option key={limit} value={limit}>
                        {t("limit.option", { count: numberFormatter.format(limit) })}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">{t("limit.description")}</p>
                </div>
              </section>

              <section className="min-w-0 space-y-4 rounded-lg border p-4" aria-labelledby="regex-tester-text-title">
                <div>
                  <h2 id="regex-tester-text-title" className="font-semibold">
                    {t("text.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("text.description")}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regex-tester-text">{t("text.label")}</Label>
                  <textarea
                    id="regex-tester-text"
                    data-testid="regex-tester-text"
                    className={editorClassName}
                    value={state.text}
                    onChange={(event) => updateState({ text: event.target.value })}
                    placeholder={t("text.placeholder")}
                    spellCheck={false}
                    aria-invalid={result.error?.code === "textTooLarge"}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("text.metrics", {
                    characters: numberFormatter.format(textMetrics.characters),
                    codeUnits: numberFormatter.format(textMetrics.codeUnits),
                    lines: numberFormatter.format(textMetrics.lines),
                  })}
                </p>
              </section>

              <section className="min-w-0 space-y-3 rounded-lg border p-4" aria-labelledby="regex-tester-share-title">
                <div>
                  <h2 id="regex-tester-share-title" className="font-semibold">
                    {t("share.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("share.description")}</p>
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    id="regex-tester-include-content"
                    data-testid="regex-tester-include-content"
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
                <div data-testid="regex-tester-share-button">
                  <ShareButton
                    className="w-full sm:w-auto"
                    getShareUrl={() => {
                      const shareUrl = buildRegexTesterShareUrl(
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

            <aside className="min-w-0 space-y-5 rounded-lg border bg-muted/30 p-4" aria-labelledby="regex-tester-results">
              <div>
                <h2 id="regex-tester-results" className="font-semibold">
                  {t("result.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("result.description")}</p>
              </div>

              <div
                data-testid="regex-tester-status"
                aria-live="polite"
                aria-busy={isProcessing}
                className={cn(
                  "rounded-lg border bg-background p-4",
                  result.status === "valid" && !isProcessing ? "border-emerald-200" : "",
                  ["invalidPattern", "invalidFlags", "tooLarge", "tooManyMatches", "timeout"].includes(result.status)
                    ? "border-amber-300"
                    : ""
                )}>
                <div className="flex items-start gap-3">
                  {result.status === "valid" && !isProcessing ? (
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  ) : result.status === "empty" || result.status === "needsText" || result.status === "noMatch" || isProcessing ? (
                    <Regex className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium">
                      {isProcessing ? t("result.status.pending") : t(`result.status.${result.status}`)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{getStatusDescription()}</p>
                    {result.compiledSource ? (
                      <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
                        /{result.compiledSource}/{result.flagsUsed}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              {result.warnings.length > 0 ? (
                <div className="flex flex-wrap gap-2" data-testid="regex-tester-warnings">
                  {result.warnings.map((warning: RegexTesterWarning) => (
                    <span
                      key={warning}
                      data-testid={`regex-tester-warning-${warning}`}
                      className="rounded-full border border-amber-300 bg-background px-3 py-1 text-xs text-amber-700 dark:text-amber-300">
                      {t(`warnings.${warning}`)}
                    </span>
                  ))}
                </div>
              ) : null}

              {result.error ? (
                <div data-testid="regex-tester-error" className="space-y-3 rounded-lg border border-amber-300 bg-background p-4">
                  <p className="font-medium">{t(`errors.${result.error.code}`)}</p>
                  {result.error.flags?.length ? (
                    <p className="break-words text-sm text-muted-foreground">
                      {t("errors.flags", { flags: result.error.flags.join(", ") })}
                    </p>
                  ) : null}
                  {result.error.engineMessage ? (
                    <p className="break-words text-xs text-muted-foreground">
                      {t("errors.engine", { message: result.error.engineMessage })}
                    </p>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => copyToClipboard(errorCopyValue, "error")}
                    disabled={!errorCopyValue}
                    data-testid="regex-tester-copy-error"
                    className="w-full">
                    {copied === "error" ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                    {copied === "error" ? t("actions.copied") : t("actions.copyError")}
                  </Button>
                </div>
              ) : null}

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label>{t("preview.label")}</Label>
                  {state.text.length > REGEX_TESTER_PREVIEW_TEXT_LIMIT ? (
                    <span className="text-xs text-muted-foreground">
                      {t("preview.truncated", {
                        limit: numberFormatter.format(REGEX_TESTER_PREVIEW_TEXT_LIMIT),
                      })}
                    </span>
                  ) : null}
                </div>
                <pre
                  data-testid="regex-tester-highlight-preview"
                  className="max-h-80 min-h-40 overflow-auto rounded-lg border bg-background p-3 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                  {highlightSegments.map((segment, index) =>
                    segment.kind === "match" ? (
                      <mark
                        key={`${segment.kind}-${segment.matchNumber}-${index}`}
                        className="rounded bg-emerald-200 px-0.5 text-emerald-950 dark:bg-emerald-500/30 dark:text-emerald-100">
                        {segment.text}
                      </mark>
                    ) : segment.kind === "zeroLength" ? (
                      <span
                        key={`${segment.kind}-${segment.matchNumber}-${index}`}
                        className="mx-0.5 inline-block h-4 border-l-2 border-amber-500 align-middle"
                        title={t("preview.zeroLength", { match: segment.matchNumber ?? 0 })}
                      />
                    ) : (
                      <span key={`${segment.kind}-${index}`}>{segment.text}</span>
                    )
                  )}
                </pre>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(matchesCopyValue, "matches")}
                  disabled={!matchesCopyValue}
                  data-testid="regex-tester-copy-matches">
                  {copied === "matches" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "matches" ? t("actions.copied") : t("actions.copyMatches")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(firstMatchCopyValue, "first")}
                  disabled={!firstMatchCopyValue}
                  data-testid="regex-tester-copy-first">
                  {copied === "first" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "first" ? t("actions.copied") : t("actions.copyFirst")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(groupsCopyValue, "groups")}
                  disabled={result.matches.length === 0}
                  data-testid="regex-tester-copy-groups">
                  {copied === "groups" ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                  {copied === "groups" ? t("actions.copied") : t("actions.copyGroups")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => updateState(readRegexTesterStateFromParams(new URLSearchParams()))}
                  data-testid="regex-tester-reset">
                  <RotateCcw className="h-4 w-4" />
                  {t("actions.reset")}
                </Button>
              </div>
            </aside>
          </div>

          {result.matches.length > 0 ? (
            <section className="min-w-0 space-y-4 rounded-lg border p-4" aria-labelledby="regex-tester-match-list-title">
              <div>
                <h2 id="regex-tester-match-list-title" className="font-semibold">
                  {t("matches.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("matches.description", {
                    count: numberFormatter.format(result.summary.shownMatches),
                    unit: result.summary.truncated ? "+" : "",
                  })}
                </p>
              </div>
              <div className="grid min-w-0 gap-4" data-testid="regex-tester-match-list">
                {result.matches.map((match) => (
                  <article
                    key={`${match.number}-${match.start}-${match.end}`}
                    data-testid={`regex-tester-match-${match.number}`}
                    className="min-w-0 space-y-3 rounded-lg border bg-background p-4">
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {t("matches.matchNumber", { number: numberFormatter.format(match.number) })}
                        </p>
                        <code className="mt-1 block max-w-full whitespace-pre-wrap break-words rounded bg-muted px-2 py-1 text-sm">
                          {match.text || t("matches.zeroLength")}
                        </code>
                      </div>
                      <p className="shrink-0 rounded-full border px-3 py-1 font-mono text-xs text-muted-foreground">
                        {numberFormatter.format(match.start)}-{numberFormatter.format(match.end)}
                      </p>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{match.preview}</p>
                    <GroupRows
                      groups={match.groups}
                      namedGroups={match.namedGroups}
                      numberFormatter={numberFormatter}
                      t={t}
                    />
                    {match.indices ? <p className="text-xs text-muted-foreground">{t("matches.indicesAvailable")}</p> : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </CardContent>
      </Card>

      <section className="mb-8 rounded-lg border p-6" aria-labelledby="regex-tester-seo-details">
        <h2 id="regex-tester-seo-details" className="text-2xl font-semibold tracking-tight">
          {t("seoDetails.title")}
        </h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {REGEX_TESTER_FLAG_ORDER.map((flag) => (
            <div key={flag} className="space-y-2">
              <h3 className="font-semibold">
                /{flag} - {t(`flags.labels.${flag}`)}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{t(`flags.descriptions.${flag}`)}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <div className="space-y-2">
            <h3 className="font-semibold">{t("seoDetails.groupsTitle")}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("seoDetails.groupsDescription")}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">{t("seoDetails.compatibilityTitle")}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("seoDetails.compatibilityDescription")}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">{t("seoDetails.performanceTitle")}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("seoDetails.performanceDescription")}</p>
          </div>
        </div>
      </section>

      <section className="mb-8 rounded-lg border p-6" aria-labelledby="regex-tester-faq">
        <h2 id="regex-tester-faq" className="text-2xl font-semibold tracking-tight">
          {tFaq("title")}
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {faqIds.map((faqId) => (
            <div key={faqId} className="rounded-lg border bg-muted/30 p-4">
              <h3 className="font-semibold">{tFaq(`${faqId}.question`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tFaq(`${faqId}.answer`)}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, CalendarClock, Check, ClipboardCopy, Clock, Copy, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShareButton } from "@/components/ui/share-button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getShareUrlFromParams, replaceQueryString } from "@/components/tools/url-state";
import {
  buildTimestampSearchParams,
  convertDateTimeToTimestamp,
  convertTimestampToDate,
  parseTimestampQuery,
  type UnixTimestampMode,
  type UnixTimestampState,
  type UnixTimestampUnit,
  type UnixTimestampZone,
} from "@/lib/tools/dates";
import { cn } from "@/lib/utils/index";

const modeIds = ["timestamp", "data"] as const;
const unitIds = ["s", "ms"] as const;
const zoneIds = ["utc", "local"] as const;
const faqIds = ["definition", "units", "utcLocal", "differentComputer", "leapSeconds", "before1970"] as const;
const detailIds = ["epoch", "javascript", "timezone", "limits"] as const;

function formatUtcDateTime(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "full",
    timeStyle: "long",
    timeZone: "UTC",
  }).format(date);
}

function formatLocalDateTime(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "full",
    timeStyle: "long",
  }).format(date);
}

function formatWeekdaySummary(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(date);
}

function getLocalTimeZoneLabel(date: Date): string {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (timeZone) return timeZone;

  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteOffset = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absoluteOffset / 60)).padStart(2, "0");
  const minutes = String(absoluteOffset % 60).padStart(2, "0");
  return `UTC${sign}${hours}:${minutes}`;
}

function getStateResult(state: UnixTimestampState) {
  return state.mode === "timestamp"
    ? convertTimestampToDate(state.timestamp, state.unit)
    : convertDateTimeToTimestamp(state.date, state.time, state.zone);
}

function getNowTimestamp(unit: UnixTimestampUnit, nowMs = Date.now()): string {
  return unit === "ms" ? String(nowMs) : String(Math.floor(nowMs / 1000));
}

function getDateTimeFieldsForInstant(nowMs: number, zone: UnixTimestampZone): Pick<UnixTimestampState, "date" | "time"> {
  const date = new Date(Math.floor(nowMs / 1000) * 1000);
  const year = zone === "utc" ? date.getUTCFullYear() : date.getFullYear();
  const month = zone === "utc" ? date.getUTCMonth() : date.getMonth();
  const day = zone === "utc" ? date.getUTCDate() : date.getDate();
  const hour = zone === "utc" ? date.getUTCHours() : date.getHours();
  const minute = zone === "utc" ? date.getUTCMinutes() : date.getMinutes();
  const second = zone === "utc" ? date.getUTCSeconds() : date.getSeconds();

  return {
    date: `${String(year).padStart(4, "0")}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}.000`,
  };
}

export function UnixTimestampClient() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("tools.unix-timestamp.form");
  const tFaq = useTranslations("tools.unix-timestamp.faq");
  const [state, setState] = useState<UnixTimestampState>(() =>
    parseTimestampQuery(new URLSearchParams(searchParams.toString()), 0)
  );
  const [hasHydrated, setHasHydrated] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const result = useMemo(() => getStateResult(state), [state]);
  const liveParams = useMemo(() => buildTimestampSearchParams(state), [state]);
  const validResult = result.status === "valid" ? result : null;
  const utcFormatted = validResult ? formatUtcDateTime(validResult.date, locale) : "";
  const localFormatted = validResult ? formatLocalDateTime(validResult.date, locale) : "";
  const weekdaySummary = validResult ? formatWeekdaySummary(validResult.date, locale) : "";
  const localTimeZone = validResult ? getLocalTimeZoneLabel(validResult.date) : getLocalTimeZoneLabel(new Date());
  const statusDescription =
    result.status === "valid"
      ? state.mode === "timestamp"
        ? t("result.validTimestampDescription", { unit: t(`units.${state.unit}`) })
        : t("result.validDateDescription", { zone: t(`zones.${state.zone}`) })
      : result.status === "empty"
        ? t("result.emptyDescription")
        : t(`issues.${result.issue}`);
  const summaryText = validResult
    ? [
        t("summary.input", {
          value:
            state.mode === "timestamp"
              ? `${state.timestamp} ${t(`units.${state.unit}`)}`
              : `${state.date} ${state.time} ${t(`zones.${state.zone}`)}`,
        }),
        t("summary.seconds", { value: validResult.secondsString }),
        t("summary.milliseconds", { value: validResult.millisecondsString }),
        t("summary.isoUtc", { value: validResult.isoUtc }),
        t("summary.utc", { value: utcFormatted }),
        t("summary.local", { value: localFormatted }),
      ].join("\n")
    : "";

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setState(parseTimestampQuery(new URLSearchParams(window.location.search), Date.now()));
      setHasHydrated(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;

    replaceQueryString(liveParams);
  }, [hasHydrated, liveParams]);

  const updateState = (patch: Partial<UnixTimestampState>) => {
    setCopied(null);
    setState((current) => ({
      ...current,
      ...patch,
    }));
  };

  const updateMode = (mode: UnixTimestampMode) => {
    updateState({ mode });
  };

  const updateUnit = (unit: UnixTimestampUnit) => {
    setCopied(null);
    setState((current) => {
      if (current.unit === unit) return current;

      const currentResult = convertTimestampToDate(current.timestamp, current.unit);
      return {
        ...current,
        unit,
        timestamp:
          currentResult.status === "valid"
            ? unit === "ms"
              ? currentResult.millisecondsString
              : currentResult.secondsString
            : current.timestamp,
      };
    });
  };

  const updateZone = (zone: UnixTimestampZone) => {
    updateState({ zone });
  };

  const useNow = () => {
    const nowMs = Date.now();

    setCopied(null);
    setState((current) => {
      const dateTimeFields = current.mode === "data" ? getDateTimeFieldsForInstant(nowMs, current.zone) : null;

      return {
        ...current,
        timestamp: current.mode === "timestamp" ? getNowTimestamp(current.unit, nowMs) : current.timestamp,
        date: dateTimeFields?.date ?? current.date,
        time: dateTimeFields?.time ?? current.time,
      };
    });
  };

  const copyToClipboard = async (value: string, key: string) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.04fr)_minmax(320px,0.96fr)]">
            <div className="space-y-6">
              <section className="space-y-4 rounded-lg border p-4" aria-labelledby="unix-timestamp-mode-title">
                <div>
                  <h2 id="unix-timestamp-mode-title" className="font-semibold">
                    {t("mode.title")}
                  </h2>
                  <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {t("mode.privacy")}
                  </p>
                </div>
                <Tabs value={state.mode} onValueChange={(value) => updateMode(value as UnixTimestampMode)}>
                  <TabsList className="grid h-auto w-full grid-cols-2" data-testid="unix-timestamp-mode-selector">
                    {modeIds.map((mode) => (
                      <TabsTrigger
                        key={mode}
                        value={mode}
                        data-testid={`unix-timestamp-mode-${mode}`}
                        className="min-h-10 whitespace-normal">
                        {t(`modes.${mode}`)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </section>

              {state.mode === "timestamp" ? (
                <section className="space-y-4 rounded-lg border p-4" aria-labelledby="unix-timestamp-input-title">
                  <div>
                    <h2 id="unix-timestamp-input-title" className="font-semibold">
                      {t("timestamp.title")}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">{t("timestamp.description")}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unix-timestamp-input">{t("timestamp.label")}</Label>
                    <Input
                      id="unix-timestamp-input"
                      data-testid="unix-timestamp-input"
                      value={state.timestamp}
                      onChange={(event) => updateState({ timestamp: event.target.value })}
                      inputMode="decimal"
                      autoComplete="off"
                      spellCheck={false}
                      aria-invalid={result.status === "invalid"}
                      placeholder={t("timestamp.placeholder")}
                    />
                    <p className="text-xs text-muted-foreground">{t("timestamp.hint")}</p>
                  </div>
                  <fieldset className="space-y-2" data-testid="unix-timestamp-unit-selector">
                    <legend className="text-sm font-medium">{t("unit.title")}</legend>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {unitIds.map((unit) => (
                        <Button
                          key={unit}
                          type="button"
                          variant={state.unit === unit ? "default" : "outline"}
                          onClick={() => updateUnit(unit)}
                          aria-pressed={state.unit === unit}
                          data-testid={`unix-timestamp-unit-${unit}`}
                          className="w-full">
                          {t(`units.${unit}`)}
                        </Button>
                      ))}
                    </div>
                  </fieldset>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button type="button" variant="outline" onClick={useNow} data-testid="unix-timestamp-use-now">
                      <RefreshCw className="h-4 w-4" />
                      {t("actions.useNow")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => updateState({ timestamp: "" })}
                      disabled={!state.timestamp}
                      data-testid="unix-timestamp-clear">
                      <Trash2 className="h-4 w-4" />
                      {t("actions.clear")}
                    </Button>
                  </div>
                </section>
              ) : (
                <section className="space-y-4 rounded-lg border p-4" aria-labelledby="unix-timestamp-date-title">
                  <div>
                    <h2 id="unix-timestamp-date-title" className="font-semibold">
                      {t("date.title")}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">{t("date.description")}</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="unix-timestamp-date-input">{t("date.dateLabel")}</Label>
                      <Input
                        id="unix-timestamp-date-input"
                        data-testid="unix-timestamp-date-input"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        spellCheck={false}
                        value={state.date}
                        onChange={(event) => updateState({ date: event.target.value })}
                        placeholder={t("date.datePlaceholder")}
                        aria-invalid={result.status === "invalid" && result.issue.startsWith("invalidDate")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unix-timestamp-time-input">{t("date.timeLabel")}</Label>
                      <Input
                        id="unix-timestamp-time-input"
                        data-testid="unix-timestamp-time-input"
                        type="text"
                        inputMode="numeric"
                        value={state.time}
                        onChange={(event) => updateState({ time: event.target.value })}
                        placeholder={t("date.timePlaceholder")}
                        aria-invalid={result.status === "invalid" && result.issue === "invalidTimeFormat"}
                      />
                    </div>
                  </div>
                  <fieldset className="space-y-2" data-testid="unix-timestamp-zone-selector">
                    <legend className="text-sm font-medium">{t("zone.title")}</legend>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {zoneIds.map((zone) => (
                        <Button
                          key={zone}
                          type="button"
                          variant={state.zone === zone ? "default" : "outline"}
                          onClick={() => updateZone(zone)}
                          aria-pressed={state.zone === zone}
                          data-testid={`unix-timestamp-zone-${zone}`}
                          className="w-full">
                          {t(`zones.${zone}`)}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{t("zone.hint")}</p>
                  </fieldset>
                  <Button type="button" variant="outline" onClick={useNow} data-testid="unix-timestamp-use-now">
                    <RefreshCw className="h-4 w-4" />
                    {t("actions.useNow")}
                  </Button>
                </section>
              )}

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="unix-timestamp-share-title">
                <div>
                  <h2 id="unix-timestamp-share-title" className="font-semibold">
                    {t("share.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("share.description")}</p>
                </div>
                <p
                  data-testid="unix-timestamp-share-warning"
                  className={cn(
                    "text-sm",
                    state.mode === "data" && state.zone === "local"
                      ? "text-amber-700 dark:text-amber-400"
                      : "text-muted-foreground"
                  )}>
                  {state.mode === "data" && state.zone === "local" ? t("share.localWarning") : t("share.safe")}
                </p>
                <div data-testid="unix-timestamp-share-button">
                  <ShareButton className="w-full sm:w-auto" getShareUrl={() => getShareUrlFromParams(liveParams)} />
                </div>
              </section>
            </div>

            <aside className="space-y-5 rounded-lg border bg-muted/30 p-4" aria-labelledby="unix-timestamp-result-title">
              <div>
                <h2 id="unix-timestamp-result-title" className="font-semibold">
                  {t("result.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("result.description")}</p>
              </div>

              <div
                data-testid="unix-timestamp-status"
                aria-live="polite"
                className={cn(
                  "rounded-lg border bg-background p-4",
                  result.status === "valid" ? "border-emerald-200" : "",
                  result.status === "invalid" ? "border-amber-300" : ""
                )}>
                <div className="flex items-start gap-3">
                  {result.status === "valid" ? (
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  ) : result.status === "invalid" ? (
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  ) : (
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium">
                      {result.status === "valid"
                        ? t("result.status.valid")
                        : result.status === "invalid"
                          ? t("result.status.invalid")
                          : t("result.status.empty")}
                    </p>
                    <p data-testid="unix-timestamp-diagnostics" className="mt-1 text-sm text-muted-foreground">
                      {statusDescription}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <ResultValueCard
                  label={t("result.seconds")}
                  value={validResult?.secondsString ?? "-"}
                  testId="unix-timestamp-result-seconds"
                  onCopy={() => copyToClipboard(validResult?.secondsString ?? "", "seconds")}
                  copied={copied === "seconds"}
                  copyLabel={t("actions.copy")}
                  copiedLabel={t("actions.copied")}
                  disabled={!validResult}
                />
                <ResultValueCard
                  label={t("result.milliseconds")}
                  value={validResult?.millisecondsString ?? "-"}
                  testId="unix-timestamp-result-milliseconds"
                  onCopy={() => copyToClipboard(validResult?.millisecondsString ?? "", "milliseconds")}
                  copied={copied === "milliseconds"}
                  copyLabel={t("actions.copy")}
                  copiedLabel={t("actions.copied")}
                  disabled={!validResult}
                />
                <ResultValueCard
                  label={t("result.isoUtc")}
                  value={validResult?.isoUtc ?? "-"}
                  testId="unix-timestamp-result-iso"
                  onCopy={() => copyToClipboard(validResult?.isoUtc ?? "", "iso")}
                  copied={copied === "iso"}
                  copyLabel={t("actions.copy")}
                  copiedLabel={t("actions.copied")}
                  disabled={!validResult}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DisplayCard
                  icon={<CalendarClock className="h-4 w-4 text-sky-600" />}
                  label={t("result.utc")}
                  value={validResult ? utcFormatted : "-"}
                  testId="unix-timestamp-result-utc"
                />
                <DisplayCard
                  icon={<Clock className="h-4 w-4 text-sky-600" />}
                  label={t("result.local")}
                  value={validResult ? localFormatted : "-"}
                  detail={validResult ? localTimeZone : ""}
                  testId="unix-timestamp-result-local"
                />
              </div>

              {validResult ? (
                <div className="rounded-lg border bg-background p-4">
                  <p className="text-xs font-medium text-muted-foreground">{t("result.weekday")}</p>
                  <p className="mt-1 text-sm font-medium" data-testid="unix-timestamp-weekday">
                    {weekdaySummary}
                  </p>
                  <p className="mt-2 break-all text-xs text-muted-foreground" data-testid="unix-timestamp-timezone">
                    {t("result.timezone", { value: localTimeZone })}
                  </p>
                </div>
              ) : null}

              <Button
                type="button"
                variant="outline"
                onClick={() => copyToClipboard(summaryText, "summary")}
                disabled={!validResult}
                data-testid="unix-timestamp-copy-summary"
                className="w-full">
                {copied === "summary" ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                {copied === "summary" ? t("actions.copied") : t("actions.copySummary")}
              </Button>
            </aside>
          </div>
        </CardContent>
      </Card>

      <section className="mb-8 rounded-lg border p-6" aria-labelledby="unix-timestamp-details">
        <h2 id="unix-timestamp-details" className="text-2xl font-semibold tracking-tight">
          {t("details.title")}
        </h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {detailIds.map((detailId) => (
            <div key={detailId} className="space-y-2">
              <h3 className="font-semibold">{t(`details.${detailId}.title`)}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{t(`details.${detailId}.description`)}</p>
            </div>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{tFaq("title")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {faqIds.map((faqId) => (
            <section key={faqId} className="rounded-lg border p-4">
              <h2 className="font-semibold">{tFaq(`${faqId}.question`)}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{tFaq(`${faqId}.answer`)}</p>
            </section>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

function ResultValueCard({
  label,
  value,
  testId,
  onCopy,
  copied,
  copyLabel,
  copiedLabel,
  disabled,
}: {
  label: string;
  value: string;
  testId: string;
  onCopy: () => void;
  copied: boolean;
  copyLabel: string;
  copiedLabel: string;
  disabled: boolean;
}) {
  return (
    <div className="rounded-lg border bg-background p-4" data-testid={testId}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onCopy} disabled={disabled} title={copyLabel}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span className="sr-only">{copied ? copiedLabel : copyLabel}</span>
        </Button>
      </div>
      <p className="mt-2 min-h-7 overflow-x-auto break-all font-mono text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function DisplayCard({
  icon,
  label,
  value,
  detail,
  testId,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail?: string;
  testId: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-4" data-testid={testId}>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="mt-2 min-h-12 break-words text-sm font-medium leading-relaxed">{value}</p>
      {detail ? <p className="mt-2 break-all text-xs text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

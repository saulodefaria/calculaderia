"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, Check, Copy, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShareButton } from "@/components/ui/share-button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getShareUrlFromParams, replaceQueryString } from "@/components/tools/url-state";
import {
  UUID_GENERATOR_MAX_COUNT,
  buildUuidGeneratorSearchParams,
  createUuidV4FromBytes,
  defaultUuidGeneratorState,
  formatUuid,
  generateUuidBatch,
  normalizeUuidGeneratorCount,
  readUuidGeneratorStateFromParams,
  type UuidFormat,
  type UuidGeneratorIssue,
  type UuidGeneratorState,
} from "@/lib/tools/generators";
import { cn } from "@/lib/utils/index";

const formatOptions: UuidFormat[] = ["padrao", "sem-hifens", "urn"];
const faqIds = ["what", "version", "privacy", "multiple", "secret", "formats"] as const;
const seoDetailIds = ["version", "formats", "privacy"] as const;

function getBrowserUuidGenerator(): (() => string) | null {
  const webCrypto = globalThis.crypto;

  if (!webCrypto) return null;

  if (typeof webCrypto.randomUUID === "function") {
    return () => webCrypto.randomUUID();
  }

  if (typeof webCrypto.getRandomValues === "function") {
    return () => {
      const bytes = new Uint8Array(16);
      webCrypto.getRandomValues(bytes);
      return createUuidV4FromBytes(bytes);
    };
  }

  return null;
}

function readInitialState(params: URLSearchParams): { state: UuidGeneratorState; quantityIssue: UuidGeneratorIssue | null } {
  return {
    state: readUuidGeneratorStateFromParams(params),
    quantityIssue: normalizeUuidGeneratorCount(params.get("quantidade")).issue,
  };
}

export function UuidGeneratorClient() {
  const searchParams = useSearchParams();
  const [initialState] = useState(() => readInitialState(new URLSearchParams(searchParams.toString())));
  const [state, setState] = useState<UuidGeneratorState>(initialState.state);
  const [quantityIssue, setQuantityIssue] = useState<UuidGeneratorIssue | null>(initialState.quantityIssue);
  const [canonicalUuids, setCanonicalUuids] = useState<string[]>([]);
  const [unsupported, setUnsupported] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const locale = useLocale();
  const t = useTranslations("tools.uuid.form");
  const tFaq = useTranslations("tools.uuid.faq");
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const params = useMemo(() => buildUuidGeneratorSearchParams(state), [state]);
  const displayUuids = useMemo(
    () => canonicalUuids.map((uuid) => formatUuid(uuid, state)),
    [canonicalUuids, state]
  );
  const copyAllText = displayUuids.join("\n");

  const generateBatch = useCallback(() => {
    const generator = getBrowserUuidGenerator();

    setCopiedAll(false);
    setCopiedIndex(null);

    if (!generator) {
      setUnsupported(true);
      setCanonicalUuids([]);
      return;
    }

    setUnsupported(false);
    setCanonicalUuids(
      generateUuidBatch(state.count, generator, {
        format: defaultUuidGeneratorState.format,
        uppercase: defaultUuidGeneratorState.uppercase,
      })
    );
  }, [state.count]);

  useEffect(() => {
    replaceQueryString(params);
  }, [params]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      generateBatch();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [generateBatch, generation]);

  const updateState = (patch: Partial<UuidGeneratorState>) => {
    setCopiedAll(false);
    setCopiedIndex(null);
    setState((current) => ({ ...current, ...patch }));
  };

  const updateCount = (value: string) => {
    const normalized = normalizeUuidGeneratorCount(value);
    setQuantityIssue(normalized.issue);
    updateState({ count: normalized.count });
  };

  const copyOne = async (uuid: string, index: number) => {
    await navigator.clipboard.writeText(uuid);
    setCopiedIndex(index);
    window.setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAll = async () => {
    if (!copyAllText) return;

    await navigator.clipboard.writeText(copyAllText);
    setCopiedAll(true);
    window.setTimeout(() => setCopiedAll(false), 2000);
  };

  const clear = () => {
    setCanonicalUuids([]);
    setCopiedAll(false);
    setCopiedIndex(null);
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <section className="space-y-4 rounded-lg border p-4" aria-labelledby="uuid-settings-title">
            <div>
              <h2 id="uuid-settings-title" className="font-semibold">
                {t("settings.title")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("settings.description")}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="uuid-count">{t("quantity.label")}</Label>
              <Input
                id="uuid-count"
                data-testid="uuid-count"
                type="number"
                min={1}
                max={UUID_GENERATOR_MAX_COUNT}
                step={1}
                value={state.count}
                onChange={(event) => updateCount(event.target.value)}
                aria-describedby="uuid-count-help"
                aria-invalid={quantityIssue === "quantityClamped"}
              />
              <p id="uuid-count-help" className="text-xs text-muted-foreground">
                {t("quantity.help", { max: UUID_GENERATOR_MAX_COUNT })}
              </p>
              {quantityIssue === "quantityClamped" ? (
                <p className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400" data-testid="uuid-count-warning">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  {t("warnings.quantityClamped", { max: UUID_GENERATOR_MAX_COUNT })}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>{t("formats.label")}</Label>
              <Tabs
                value={state.format}
                onValueChange={(value) => updateState({ format: value as UuidFormat })}
                data-testid="uuid-format-tabs">
                <TabsList className="grid h-auto w-full grid-cols-3">
                  {formatOptions.map((format) => (
                    <TabsTrigger key={format} value={format} data-testid={`uuid-format-${format}`}>
                      {t(`formats.options.${format}`)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <p className="text-xs text-muted-foreground">{t("formats.help")}</p>
            </div>

            <label className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3 text-sm">
              <input
                id="uuid-uppercase"
                data-testid="uuid-uppercase"
                type="checkbox"
                className="mt-1"
                checked={state.uppercase}
                onChange={(event) => updateState({ uppercase: event.target.checked })}
              />
              <span>
                <span className="block font-medium">{t("uppercase.label")}</span>
                <span className="block text-muted-foreground">{t("uppercase.help")}</span>
              </span>
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                type="button"
                onClick={() => setGeneration((current) => current + 1)}
                disabled={unsupported}
                data-testid="uuid-generate">
                <RefreshCw className="h-4 w-4" />
                {canonicalUuids.length > 0 ? t("actions.regenerate") : t("actions.generate")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={clear}
                disabled={canonicalUuids.length === 0}
                data-testid="uuid-clear">
                <Trash2 className="h-4 w-4" />
                {t("actions.clear")}
              </Button>
            </div>
          </section>

          <section className="space-y-4 rounded-lg border p-4" aria-labelledby="uuid-results-title">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 id="uuid-results-title" className="font-semibold">
                  {t("result.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("result.description")}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={copyAll}
                disabled={displayUuids.length === 0 || unsupported}
                data-testid="uuid-copy-all">
                {copiedAll ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                {copiedAll ? t("actions.copied") : t("actions.copyAll")}
              </Button>
            </div>

            {unsupported ? (
              <div
                className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200"
                data-testid="uuid-unsupported">
                <p className="flex items-start gap-2 font-medium">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  {t("unsupported.title")}
                </p>
                <p className="mt-2">{t("unsupported.description")}</p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2 text-xs" data-testid="uuid-summary">
              {[
                t("summary.version"),
                t("summary.count", { count: numberFormatter.format(state.count) }),
                t(`summary.formats.${state.format}`),
                state.uppercase ? t("summary.uppercaseOn") : t("summary.uppercaseOff"),
              ].map((item) => (
                <span key={item} className="rounded-full border bg-background px-2.5 py-1 text-muted-foreground">
                  {item}
                </span>
              ))}
            </div>

            {displayUuids.length > 0 ? (
              <ol className="space-y-2" data-testid="uuid-result-list">
                {displayUuids.map((uuid, index) => (
                  <li
                    key={`${canonicalUuids[index]}-${index}`}
                    className="flex min-w-0 flex-col gap-2 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between"
                    data-testid="uuid-result-row">
                    <span className="min-w-0 break-all font-mono text-sm" data-testid="uuid-result-value">
                      {uuid}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyOne(uuid, index)}
                      data-testid={`uuid-copy-one-${index}`}>
                      {copiedIndex === index ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copiedIndex === index ? t("actions.copied") : t("actions.copyOne")}
                    </Button>
                  </li>
                ))}
              </ol>
            ) : unsupported ? null : (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground" data-testid="uuid-empty">
                {t("result.empty")}
              </div>
            )}
          </section>
        </div>

        <section className="space-y-3 rounded-lg border p-4" aria-labelledby="uuid-share-title">
          <div>
            <h2 id="uuid-share-title" className="font-semibold">
              {t("share.title")}
            </h2>
            <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              {t("share.description")}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div data-testid="uuid-share-button">
              <ShareButton getShareUrl={() => getShareUrlFromParams(params)} />
            </div>
            <p className="text-sm text-muted-foreground">{t("share.safe")}</p>
          </div>
        </section>

        <section className="rounded-lg border bg-muted/20 p-4" aria-labelledby="uuid-details-title">
          <h2 id="uuid-details-title" className="text-lg font-semibold">
            {t("seoDetails.title")}
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {seoDetailIds.map((detailId) => (
              <div key={detailId} className={cn("space-y-1", detailId === "privacy" ? "md:col-span-1" : "")}>
                <h3 className="font-semibold">{t(`seoDetails.${detailId}.title`)}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{t(`seoDetails.${detailId}.description`)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border p-4" aria-labelledby="uuid-faq-title">
          <h2 id="uuid-faq-title" className="text-lg font-semibold">
            {tFaq("title")}
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {faqIds.map((faqId) => (
              <div key={faqId} className="space-y-1">
                <h3 className="font-semibold">{tFaq(`${faqId}.question`)}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{tFaq(`${faqId}.answer`)}</p>
              </div>
            ))}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

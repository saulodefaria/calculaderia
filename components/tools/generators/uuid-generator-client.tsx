"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, Check, Copy, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShareButton } from "@/components/ui/share-button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInitialSearchParams, getShareUrlFromParams, replaceQueryString } from "@/components/tools/url-state";
import {
  UUID_GENERATOR_MAX_QUANTITY,
  buildUuidGeneratorSearchParams,
  defaultUuidGeneratorState,
  formatUuidOutput,
  generateUuidV4Batch,
  normalizeUuidQuantity,
  readUuidGeneratorStateFromParams,
  type UuidGeneratorState,
  type UuidOutputFormat,
  type UuidRandomSource,
  type UuidRandomSourceName,
} from "@/lib/tools/generators";

const formatIds = ["padrao", "sem-hifens", "urn"] as const;
const detailIds = ["layout", "formats", "security"] as const;
const faqIds = ["what", "v4", "privacy", "secret", "formats", "sharing"] as const;
const relatedTools = [
  ["password", "/geradores/senha"],
  ["randomNumbers", "/geradores/numeros-aleatorios"],
  ["qrCode", "/geradores/qr-code"],
  ["base64", "/dev/conversor-base64"],
  ["json", "/dev/formatador-json"],
] as const;

type CopiedTarget = "all" | number | null;

type UuidGeneratorUiState = UuidGeneratorState & {
  quantityWasCapped: boolean;
};

function readInitialUiState(): UuidGeneratorUiState {
  return readUiStateFromParams(new URLSearchParams());
}

function readUiStateFromParams(params: URLSearchParams): UuidGeneratorUiState {
  const rawQuantityParam = params.get("quantidade");
  const rawQuantity =
    rawQuantityParam === null ? defaultUuidGeneratorState.quantity : Number(rawQuantityParam);
  const state = readUuidGeneratorStateFromParams(params);

  return {
    ...state,
    quantityWasCapped: Number.isFinite(rawQuantity) && rawQuantity > UUID_GENERATOR_MAX_QUANTITY,
  };
}

function getBrowserRandomSource(): UuidRandomSource | null {
  if (typeof globalThis.crypto === "undefined") return null;
  return globalThis.crypto;
}

export function UuidGeneratorClient() {
  const t = useTranslations("tools.uuid.form");
  const tFaq = useTranslations("tools.uuid.faq");
  const locale = useLocale();
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const [state, setState] = useState<UuidGeneratorUiState>(readInitialUiState);
  const [hasReadInitialParams, setHasReadInitialParams] = useState(false);
  const [generationNonce, setGenerationNonce] = useState(0);
  const [baseUuids, setBaseUuids] = useState<string[]>([]);
  const [randomSourceName, setRandomSourceName] = useState<UuidRandomSourceName | null>(null);
  const [isUnsupported, setIsUnsupported] = useState(false);
  const [copied, setCopied] = useState<CopiedTarget>(null);

  const settings = useMemo<UuidGeneratorState>(
    () => ({
      quantity: state.quantity,
      format: state.format,
      uppercase: state.uppercase,
    }),
    [state.format, state.quantity, state.uppercase]
  );
  const liveParams = useMemo(() => buildUuidGeneratorSearchParams(settings).params, [settings]);
  const displayedUuids = useMemo(
    () => baseUuids.map((uuid) => formatUuidOutput(uuid, settings)),
    [baseUuids, settings]
  );
  const copyAllText = displayedUuids.join("\n");
  const statRows = [
    ["count", numberFormatter.format(displayedUuids.length)],
    ["format", t(`formats.${settings.format}`)],
    ["version", "UUIDv4"],
    ["source", randomSourceName ? t(`sources.${randomSourceName}`) : t("sources.none")],
  ] as const;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setState(readUiStateFromParams(getInitialSearchParams()));
      setHasReadInitialParams(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!hasReadInitialParams) return;

    replaceQueryString(liveParams);
  }, [hasReadInitialParams, liveParams]);

  useEffect(() => {
    if (!hasReadInitialParams) return;

    const timeoutId = window.setTimeout(() => {
      const result = generateUuidV4Batch(settings.quantity, getBrowserRandomSource());

      if (result.status === "unsupported") {
        setBaseUuids([]);
        setIsUnsupported(true);
        setRandomSourceName(null);
        return;
      }

      setBaseUuids(result.uuids);
      setIsUnsupported(false);
      setRandomSourceName(result.source);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [generationNonce, hasReadInitialParams, settings.quantity]);

  const updateState = (patch: Partial<UuidGeneratorUiState>) => {
    setCopied(null);
    setState((current) => ({ ...current, ...patch }));
  };

  const updateQuantity = (value: string) => {
    const parsedValue = Number(value);

    updateState({
      quantity: normalizeUuidQuantity(parsedValue),
      quantityWasCapped: Number.isFinite(parsedValue) && parsedValue > UUID_GENERATOR_MAX_QUANTITY,
    });
  };

  const regenerate = () => {
    setCopied(null);
    setGenerationNonce((current) => current + 1);
  };

  const clearResults = () => {
    setCopied(null);
    setBaseUuids([]);
    setRandomSourceName(null);
  };

  const copyToClipboard = async (value: string, target: CopiedTarget) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(target);
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
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(340px,1.1fr)]">
            <div className="space-y-6">
              <section className="space-y-4 rounded-lg border p-4" aria-labelledby="uuid-generator-settings-title">
                <div>
                  <h2 id="uuid-generator-settings-title" className="font-semibold">
                    {t("settings.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("settings.description")}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="uuid-generator-quantity">{t("quantity.label")}</Label>
                  <Input
                    id="uuid-generator-quantity"
                    data-testid="uuid-generator-quantity"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={UUID_GENERATOR_MAX_QUANTITY}
                    value={state.quantity}
                    onChange={(event) => updateQuantity(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("quantity.help", { max: numberFormatter.format(UUID_GENERATOR_MAX_QUANTITY) })}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>{t("formats.label")}</Label>
                  <Tabs
                    value={state.format}
                    onValueChange={(value) => updateState({ format: value as UuidOutputFormat })}
                    data-testid="uuid-generator-format-selector">
                    <TabsList className="grid h-auto w-full grid-cols-3">
                      {formatIds.map((formatId) => (
                        <TabsTrigger
                          key={formatId}
                          value={formatId}
                          data-testid={`uuid-generator-format-${formatId}`}
                          className="text-wrap whitespace-normal">
                          {t(`formats.${formatId}`)}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                  <p className="text-xs text-muted-foreground">{t("formats.description")}</p>
                </div>

                <label className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
                  <input
                    id="uuid-generator-uppercase"
                    data-testid="uuid-generator-uppercase"
                    type="checkbox"
                    checked={state.uppercase}
                    onChange={(event) => updateState({ uppercase: event.target.checked })}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-medium">{t("uppercase.label")}</span>
                    <span className="text-muted-foreground">{t("uppercase.description")}</span>
                  </span>
                </label>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Button type="button" onClick={regenerate} data-testid="uuid-generator-generate">
                    <RefreshCw className="h-4 w-4" />
                    {displayedUuids.length > 0 ? t("actions.regenerate") : t("actions.generate")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearResults}
                    disabled={displayedUuids.length === 0}
                    data-testid="uuid-generator-clear">
                    <Trash2 className="h-4 w-4" />
                    {t("actions.clear")}
                  </Button>
                </div>
              </section>

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="uuid-generator-share-title">
                <div>
                  <h2 id="uuid-generator-share-title" className="font-semibold">
                    {t("share.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("share.description")}</p>
                </div>
                <p data-testid="uuid-generator-share-warning" className="text-sm text-muted-foreground">
                  {t("share.safe")}
                </p>
                <div data-testid="uuid-generator-share">
                  <ShareButton className="w-full sm:w-auto" getShareUrl={() => getShareUrlFromParams(liveParams)} />
                </div>
              </section>

              <section className="space-y-3 rounded-lg border p-4" aria-labelledby="uuid-generator-privacy-title">
                <div>
                  <h2 id="uuid-generator-privacy-title" className="font-semibold">
                    {t("privacy.title")}
                  </h2>
                  <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {t("privacy.browser")}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">{t("privacy.secret")}</p>
              </section>
            </div>

            <aside className="space-y-5 rounded-lg border bg-muted/30 p-4" aria-labelledby="uuid-generator-results-title">
              <div>
                <h2 id="uuid-generator-results-title" className="font-semibold">
                  {t("result.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("result.description")}</p>
              </div>

              {isUnsupported ? (
                <div
                  data-testid="uuid-generator-unsupported"
                  role="status"
                  className="rounded-lg border border-amber-300 bg-background p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div className="min-w-0">
                      <p className="font-medium">{t("warnings.unsupportedTitle")}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{t("warnings.unsupportedDescription")}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {state.quantityWasCapped ? (
                <p
                  data-testid="uuid-generator-capped-warning"
                  role="status"
                  className="rounded-lg border border-amber-300 bg-background p-3 text-sm text-amber-700 dark:text-amber-400">
                  {t("warnings.capped", { max: numberFormatter.format(UUID_GENERATOR_MAX_QUANTITY) })}
                </p>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                {statRows.map(([key, value]) => (
                  <div key={key} className="rounded-lg border bg-background p-3">
                    <p className="text-xs font-medium text-muted-foreground">{t(`stats.${key}`)}</p>
                    <p data-testid={`uuid-generator-stat-${key}`} className="mt-1 font-semibold tabular-nums">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div
                data-testid="uuid-generator-results"
                aria-live="polite"
                className="max-h-[32rem] min-h-64 overflow-y-auto rounded-lg border bg-background p-4">
                {displayedUuids.length > 0 ? (
                  <ol className="space-y-2">
                    {displayedUuids.map((uuid, index) => (
                      <li
                        key={`${baseUuids[index]}-${index}`}
                        data-testid="uuid-generator-result-row"
                        className="flex min-w-0 items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
                        <span className="w-8 shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
                          {numberFormatter.format(index + 1)}
                        </span>
                        <span
                          data-testid={`uuid-generator-value-${index}`}
                          className="min-w-0 flex-1 break-all font-mono text-sm"
                          title={uuid}>
                          {uuid}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => copyToClipboard(uuid, index)}
                          data-testid={`uuid-generator-copy-one-${index}`}
                          aria-label={t("actions.copyOneAria", { index: numberFormatter.format(index + 1) })}
                          title={t("actions.copyOneAria", { index: numberFormatter.format(index + 1) })}>
                          {copied === index ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="flex h-full min-h-56 items-center justify-center text-center text-sm text-muted-foreground">
                    {isUnsupported ? t("result.unsupportedEmpty") : t("result.empty")}
                  </div>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => copyToClipboard(copyAllText, "all")}
                disabled={!copyAllText}
                data-testid="uuid-generator-copy-all"
                className="w-full">
                {copied === "all" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied === "all" ? t("actions.copied") : t("actions.copyAll")}
              </Button>

              <p className="text-xs leading-relaxed text-muted-foreground">{t("result.disclaimer")}</p>
            </aside>
          </div>
        </CardContent>
      </Card>

      <section className="mb-8 rounded-lg border p-6" aria-labelledby="uuid-generator-details">
        <h2 id="uuid-generator-details" className="text-2xl font-semibold tracking-tight">
          {t("seoDetails.title")}
        </h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {detailIds.map((detailId) => (
            <div key={detailId} className="space-y-2">
              <h3 className="font-semibold">{t(`seoDetails.${detailId}.title`)}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t(`seoDetails.${detailId}.description`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 rounded-lg border p-6" aria-labelledby="uuid-generator-related">
        <h2 id="uuid-generator-related" className="text-2xl font-semibold tracking-tight">
          {t("related.title")}
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {relatedTools.map(([relatedKey, href]) => (
            <Link
              key={relatedKey}
              href={href}
              className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted">
              {t(`related.${relatedKey}`)}
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-8 rounded-lg border p-6" aria-labelledby="uuid-generator-faq">
        <h2 id="uuid-generator-faq" className="text-2xl font-semibold tracking-tight">
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

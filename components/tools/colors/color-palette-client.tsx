"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, Copy, Palette, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShareButton } from "@/components/ui/share-button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getShareUrlFromParams, replaceQueryString } from "@/components/tools/url-state";
import { Link } from "@/i18n/navigation";
import {
  COLOR_PALETTE_MODES,
  buildColorPaletteSearchParams,
  buildCssVariablesText,
  buildHexPaletteText,
  generateColorPalette,
  generateRandomHexColor,
  getDefaultColorPaletteQuantity,
  normalizeHexColor,
  readColorPaletteStateFromParams,
  type ColorPaletteMode,
  type ColorPaletteState,
  type PaletteColor,
} from "@/lib/tools/colors";
import { cn } from "@/lib/utils/index";

const quantityOptions = [3, 4, 5, 6, 7, 8];
const faqIds = ["base", "formats", "accessibility", "privacy", "css"] as const;
const sixDigitHexRegex = /^#?[0-9a-f]{6}$/i;
const potentialHexDraftRegex = /^#?[0-9a-f]{0,6}$/i;

interface ClientFormState {
  palette: ColorPaletteState;
  hexInput: string;
  hasHexError: boolean;
}

function readInitialFormState(searchParams: URLSearchParams): ClientFormState {
  const palette = readColorPaletteStateFromParams(searchParams);

  return {
    palette,
    hexInput: palette.seedHex,
    hasHexError: false,
  };
}

function getValueRows(color: PaletteColor) {
  return [
    { format: "HEX", value: color.hex },
    { format: "RGB", value: color.rgbString },
    { format: "HSL", value: color.hslString },
  ] as const;
}

export function ColorPaletteClient() {
  const searchParams = useSearchParams();
  const t = useTranslations("tools.paleta-cores.form");
  const tFaq = useTranslations("tools.paleta-cores.faq");
  const [formState, setFormState] = useState<ClientFormState>(() =>
    readInitialFormState(new URLSearchParams(searchParams.toString()))
  );
  const [copied, setCopied] = useState<string | null>(null);

  const result = useMemo(() => generateColorPalette(formState.palette), [formState.palette]);
  const currentParams = useMemo(() => buildColorPaletteSearchParams(result.state), [result.state]);
  const hexPaletteText = useMemo(() => buildHexPaletteText(result.colors), [result.colors]);
  const cssVariablesText = useMemo(() => buildCssVariablesText(result.colors), [result.colors]);
  const modeLabel = t(`modes.${result.state.mode}`);

  useEffect(() => {
    replaceQueryString(currentParams);
  }, [currentParams]);

  const updatePalette = (patch: Partial<ColorPaletteState>) => {
    setFormState((current) => ({
      ...current,
      palette: {
        ...current.palette,
        ...patch,
      },
    }));
  };

  const updateHexInput = (value: string) => {
    const normalizedHex = sixDigitHexRegex.test(value.trim()) ? normalizeHexColor(value) : null;
    const hasHexError = value.trim().length > 0 && !potentialHexDraftRegex.test(value.trim());

    setFormState((current) => ({
      hexInput: normalizedHex ?? value,
      hasHexError,
      palette: normalizedHex
        ? {
            ...current.palette,
            seedHex: normalizedHex,
          }
        : current.palette,
    }));
  };

  const commitHexInput = (value: string) => {
    const normalizedHex = normalizeHexColor(value);

    setFormState((current) => ({
      hexInput: normalizedHex ?? value,
      hasHexError: normalizedHex === null,
      palette: normalizedHex
        ? {
            ...current.palette,
            seedHex: normalizedHex,
          }
        : current.palette,
    }));
  };

  const updateMode = (mode: ColorPaletteMode) => {
    setFormState((current) => {
      const currentDefault = getDefaultColorPaletteQuantity(current.palette.mode);
      const nextDefault = getDefaultColorPaletteQuantity(mode);

      return {
        ...current,
        palette: {
          ...current.palette,
          mode,
          quantity: current.palette.quantity === currentDefault ? nextDefault : current.palette.quantity,
        },
      };
    });
  };

  const randomizeSeed = () => {
    const seedHex = generateRandomHexColor();

    setFormState((current) => ({
      ...current,
      hexInput: seedHex,
      hasHexError: false,
      palette: {
        ...current.palette,
        seedHex,
      },
    }));
  };

  const copyToClipboard = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]">
            <section className="space-y-6 rounded-lg border p-4" aria-labelledby="color-palette-settings-title">
              <div>
                <h2 id="color-palette-settings-title" className="font-semibold">
                  {t("settings.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("settings.description")}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-[72px_minmax(0,1fr)]">
                <div className="space-y-2">
                  <Label htmlFor="color-palette-picker">{t("seed.colorLabel")}</Label>
                  <Input
                    id="color-palette-picker"
                    data-testid="color-palette-color-input"
                    type="color"
                    value={result.state.seedHex}
                    onChange={(event) => commitHexInput(event.target.value)}
                    className="h-11 w-full cursor-pointer p-1"
                    aria-label={t("seed.colorLabel")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color-palette-hex-input">{t("seed.hexLabel")}</Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      id="color-palette-hex-input"
                      data-testid="color-palette-hex-input"
                      value={formState.hexInput}
                      onChange={(event) => updateHexInput(event.target.value)}
                      onBlur={(event) => commitHexInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          commitHexInput(event.currentTarget.value);
                        }
                      }}
                      inputMode="text"
                      spellCheck={false}
                      placeholder="#2F80ED"
                      aria-invalid={formState.hasHexError}
                      aria-describedby={formState.hasHexError ? "color-palette-hex-error" : undefined}
                      className="font-mono uppercase"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={randomizeSeed}
                      data-testid="color-palette-random">
                      <Shuffle className="h-4 w-4" />
                      {t("actions.random")}
                    </Button>
                  </div>
                  {formState.hasHexError ? (
                    <p id="color-palette-hex-error" className="text-sm text-destructive">
                      {t("validation.invalidHex")}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("seed.help")}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("mode.label")}</Label>
                <Tabs value={result.state.mode} onValueChange={(value) => updateMode(value as ColorPaletteMode)}>
                  <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-5" data-testid="color-palette-mode-tabs">
                    {COLOR_PALETTE_MODES.map((mode) => (
                      <TabsTrigger
                        key={mode}
                        value={mode}
                        data-testid={`color-palette-mode-${mode}`}
                        className="whitespace-normal px-2 py-2 text-center text-xs sm:text-sm">
                        {t(`modes.${mode}`)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                <p className="text-sm text-muted-foreground">{t(`modeDescriptions.${result.state.mode}`)}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="color-palette-quantity">{t("quantity.label")}</Label>
                  <Select
                    value={String(result.state.quantity)}
                    onValueChange={(value) => updatePalette({ quantity: Number(value) })}>
                    <SelectTrigger
                      id="color-palette-quantity"
                      data-testid="color-palette-quantity"
                      className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {quantityOptions.map((quantity) => (
                        <SelectItem key={quantity} value={String(quantity)}>
                          {t("quantity.option", { count: quantity })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3" data-testid="color-palette-summary">
                  <p className="text-sm font-medium">{t("summary.title")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("summary.text", {
                      seed: result.state.seedHex,
                      mode: modeLabel,
                      count: result.state.quantity,
                    })}
                  </p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(hexPaletteText, "all-hex")}
                  data-testid="color-palette-copy-all-hex">
                  {copied === "all-hex" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "all-hex" ? t("actions.copied") : t("actions.copyAllHex")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(cssVariablesText, "css-vars")}
                  data-testid="color-palette-copy-css">
                  {copied === "css-vars" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === "css-vars" ? t("actions.copied") : t("actions.copyCss")}
                </Button>
                <ShareButton className="w-full" getShareUrl={() => getShareUrlFromParams(currentParams)} />
              </div>
            </section>

            <section className="space-y-4 rounded-lg border bg-muted/30 p-4" aria-labelledby="color-palette-results-title">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background text-emerald-700">
                  <Palette className="h-5 w-5" />
                </div>
                <div>
                  <h2 id="color-palette-results-title" className="font-semibold">
                    {t("result.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("result.description")}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2" data-testid="color-palette-swatches">
                {result.colors.map((color) => (
                  <article key={`${color.index}-${color.hex}`} className="overflow-hidden rounded-lg border bg-background">
                    <div
                      className="h-24 border-b"
                      style={{ backgroundColor: color.hex }}
                      data-testid={`color-palette-swatch-${color.index}`}
                      aria-label={t("result.swatchLabel", { index: color.index, value: color.hex })}
                    />
                    <div className="space-y-3 p-3">
                      <div>
                        <p className="text-xs font-medium uppercase text-muted-foreground">
                          {t("result.colorIndex", { index: color.index })}
                        </p>
                        <p className="break-all font-mono text-base font-semibold">{color.hex}</p>
                      </div>
                      <div className="space-y-2">
                        {getValueRows(color).map((row) => {
                          const copyKey = `swatch-${color.index}-${row.format.toLowerCase()}`;

                          return (
                            <div
                              key={row.format}
                              className="grid grid-cols-[42px_minmax(0,1fr)_64px] items-center gap-2 rounded-md bg-muted/50 px-2 py-2 text-sm">
                              <span className="font-medium text-muted-foreground">{row.format}</span>
                              <code className="min-w-0 break-all font-mono text-xs">{row.value}</code>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(row.value, copyKey)}
                                data-testid={`color-palette-copy-${row.format.toLowerCase()}-${color.index}`}
                                aria-label={t("actions.copyValue", {
                                  format: row.format,
                                  value: row.value,
                                })}
                                className={cn("h-8 px-2", copied === copyKey ? "text-emerald-700" : "")}>
                                {copied === copyKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                {copied === copyKey ? t("actions.copiedShort") : t("actions.copyShort")}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </CardContent>
      </Card>

      <section className="mb-8 rounded-lg border p-6" aria-labelledby="color-palette-details">
        <h2 id="color-palette-details" className="text-2xl font-semibold tracking-tight">
          {t("details.title")}
        </h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <div className="space-y-2">
            <h3 className="font-semibold">{t("details.harmonyTitle")}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("details.harmonyDescription")}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">{t("details.tonesTitle")}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("details.tonesDescription")}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">{t("details.privacyTitle")}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("details.privacyDescription")}</p>
          </div>
        </div>
      </section>

      <section className="mb-8 rounded-lg border p-6" aria-labelledby="color-palette-related">
        <h2 id="color-palette-related" className="text-2xl font-semibold tracking-tight">
          {t("related.title")}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Link
            href="/geradores/qr-code"
            className="rounded-lg border p-4 transition-colors hover:border-emerald-300 hover:bg-muted/40">
            <p className="font-semibold">{t("related.qrCodeTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("related.qrCodeDescription")}</p>
          </Link>
        </div>
      </section>

      <section className="mb-8 rounded-lg border p-6" aria-labelledby="color-palette-faq">
        <h2 id="color-palette-faq" className="text-2xl font-semibold tracking-tight">
          {tFaq("title")}
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {faqIds.map((faqId) => (
            <div key={faqId} className="rounded-lg bg-muted/40 p-4">
              <h3 className="font-semibold">{tFaq(`${faqId}.question`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tFaq(`${faqId}.answer`)}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

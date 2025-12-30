"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Copy, Check, Coffee, Heart, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PIX_KEY = "260b909c-9a11-419a-8811-1b6f9a30d735";
const PIX_PAYLOAD =
  "00020101021126580014br.gov.bcb.pix0136260b909c-9a11-419a-8811-1b6f9a30d7355204000053039865802BR5921SAULO MORAES DE FARIA6013SAO JOSE DOS 62070503***63049931";
const BUY_ME_A_COFFEE_URL = "https://buymeacoffee.com/saulodefaria";

export default function ApoiarPage() {
  const [copied, setCopied] = useState(false);
  const tCommon = useTranslations("common");
  const t = useTranslations("support");

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Gradient background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              {tCommon("backToHome")}
            </Link>
          </Button>
        </div>

        {/* Hero Section */}
        <section className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-6">
            <Heart className="h-4 w-4" />
            <span>{t("hero.badge")}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {t("hero.title")}
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {t.rich("hero.description", {
              name: (chunks) => <span className="font-semibold text-foreground">{chunks}</span>,
            })}
          </p>
        </section>

        {/* Support Options */}
        <div className="grid gap-8 md:grid-cols-2 mb-12">
          {/* PIX Card */}
          <Card className="relative overflow-hidden border-2 border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

            <CardHeader className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10">
                  <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <CardTitle className="text-xl">PIX</CardTitle>
              </div>
              <CardDescription className="text-base">{t("pix.description")}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-2xl shadow-sm border">
                  <QRCodeSVG value={PIX_PAYLOAD} size={180} level="M" bgColor="#ffffff" fgColor="#000000" />
                </div>
              </div>

              {/* Copy Key */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center">{t("pix.orCopyKey")}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 bg-muted/50 rounded-lg font-mono text-sm truncate border">
                    {PIX_KEY}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                    className={`shrink-0 transition-colors ${
                      copied
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                        : "hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-600"
                    }`}
                    title={t("pix.copyCta")}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                {copied && (
                  <p className="text-xs text-emerald-600 text-center animate-in fade-in slide-in-from-top-1">
                    {t("pix.copied")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Buy Me a Coffee Card */}
          <Card className="relative overflow-hidden border-2 border-amber-500/20 hover:border-amber-500/40 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

            <CardHeader className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10">
                  <Coffee className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <CardTitle className="text-xl">Buy Me a Coffee</CardTitle>
              </div>
              <CardDescription className="text-base">{t("bmac.description")}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Illustration */}
              <div className="flex justify-center py-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-linear-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center">
                    <Coffee className="h-16 w-16 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
                    <Heart className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="space-y-3">
                <Button
                  asChild
                  className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-medium text-base gap-2 shadow-lg shadow-amber-500/20">
                  <a href={BUY_ME_A_COFFEE_URL} target="_blank" rel="noopener noreferrer">
                    <Coffee className="h-5 w-5" />
                    {t("bmac.cta")}
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </a>
                </Button>
                <p className="text-xs text-center text-muted-foreground">{t("bmac.note")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Thank you message */}
        <section className="text-center pb-8">
          <div className="inline-flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-muted/50 border">
            <Heart className="h-5 w-5 text-rose-500" />
            <p className="text-muted-foreground">
              {t.rich("thanks", {
                highlight: (chunks) => <span className="font-medium text-foreground">{chunks}</span>,
              })}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

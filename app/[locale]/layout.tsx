import { NextIntlClientProvider } from "next-intl";
import { Geist, Geist_Mono } from "next/font/google";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import "../globals.css";
import { routing } from "@/i18n/routing";
import { getAlternateLanguagePathnames } from "@/i18n/paths";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { GoogleAnalyticsPageView } from "@/components/analytics/google-analytics-pageview";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getOpenGraphImages, getSiteUrlObject, getTwitterImages } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const siteT = await getTranslations({ locale, namespace: "site" });

  return {
    metadataBase: getSiteUrlObject(),
    title: {
      default: siteT("name"),
      template: `%s | ${siteT("name")}`,
    },
    description: siteT("description"),
    alternates: {
      languages: getAlternateLanguagePathnames("/"),
    },
    openGraph: {
      images: getOpenGraphImages(),
    },
    twitter: {
      images: getTwitterImages(),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages for the current locale
  const messages = await getMessages({ locale });
  const htmlLang = locale === "pt-br" ? "pt-BR" : locale;
  const gaId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

  return (
    <html lang={htmlLang}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        {gaId ? (
          <>
            <GoogleAnalytics gaId={gaId} />
            <Suspense fallback={null}>
              <GoogleAnalyticsPageView gaId={gaId} />
            </Suspense>
          </>
        ) : null}
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

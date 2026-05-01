import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { getAlternateLanguagePathnames } from "@/i18n/paths";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getOpenGraphImages, getSiteUrlObject, getTwitterImages } from "@/lib/seo";

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

  return (
    <NextIntlClientProvider messages={messages}>
      <AuthProvider>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </AuthProvider>
    </NextIntlClientProvider>
  );
}

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Calculator } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getLocalizedPathname } from "@/i18n/paths";

type SignInPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });

  return {
    title: t("signInTitle"),
    description: t("signInDescription"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function EntrarPage({ params }: SignInPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "auth" });
  const siteT = await getTranslations({ locale, namespace: "site" });
  const fallbackUrl = getLocalizedPathname(locale, "/favoritos");

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-muted/30">
      <div className="container mx-auto flex min-h-[calc(100vh-8rem)] max-w-md items-center px-4 py-10">
        <Card className="w-full">
          <CardHeader className="text-center">
            <Link href="/" className="mx-auto mb-4 flex items-center justify-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600">
                <Calculator className="h-5 w-5 text-white" />
              </span>
              <span className="text-lg font-semibold">{siteT("name")}</span>
            </Link>
            <CardTitle className="text-2xl">{t("signInTitle")}</CardTitle>
            <CardDescription>{t("signInDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <GoogleSignInButton fallbackUrl={fallbackUrl} label={t("continueWithGoogle")} />
            <p className="mt-4 text-center text-xs text-muted-foreground">{t("termsNote")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

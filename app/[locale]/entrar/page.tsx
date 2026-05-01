import type { Metadata } from "next";
import { AuthError } from "next-auth";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Calculator, Search } from "lucide-react";
import { auth, signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getLocalizedPathname } from "@/i18n/paths";

type SignInPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
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

function getSafeCallbackUrl(locale: string, callbackUrl: string | string[] | undefined): string {
  const fallback = getLocalizedPathname(locale, "/favoritos");
  const candidate = Array.isArray(callbackUrl) ? callbackUrl[0] : callbackUrl;

  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  return candidate;
}

export default async function EntrarPage({ params, searchParams }: SignInPageProps) {
  const { locale } = await params;
  const { callbackUrl } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("auth");
  const siteT = await getTranslations("site");
  const session = await auth();
  const safeCallbackUrl = getSafeCallbackUrl(locale, callbackUrl);

  if (session?.user?.id) {
    redirect(safeCallbackUrl);
  }

  async function signInWithGoogle() {
    "use server";

    try {
      await signIn("google", { redirectTo: safeCallbackUrl });
    } catch (error) {
      if (error instanceof AuthError) {
        redirect(`${getLocalizedPathname(locale, "/entrar")}?error=oauth`);
      }

      throw error;
    }
  }

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
            <form action={signInWithGoogle}>
              <Button type="submit" className="w-full gap-2">
                <Search className="h-4 w-4" />
                {t("continueWithGoogle")}
              </Button>
            </form>
            <p className="mt-4 text-center text-xs text-muted-foreground">{t("termsNote")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

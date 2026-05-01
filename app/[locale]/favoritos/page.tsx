import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { ArrowLeft, Bookmark, Calculator } from "lucide-react";
import { auth } from "@/auth";
import { FavoritesList } from "@/components/favorites/favorites-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getLocalizedPathname } from "@/i18n/paths";
import { prismaFavoriteRepository } from "@/lib/favorites/prisma-repository";
import { listFavorites, serializeFavorite } from "@/lib/favorites/service";

export default async function FavoritosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const userId = session?.user?.id;
  const favoritesPath = getLocalizedPathname(locale, "/favoritos");

  if (!userId) {
    redirect(`${getLocalizedPathname(locale, "/entrar")}?callbackUrl=${encodeURIComponent(favoritesPath)}`);
  }

  const [t, tCommon, favorites] = await Promise.all([
    getTranslations("favorites.page"),
    getTranslations("common"),
    listFavorites(prismaFavoriteRepository, userId),
  ]);

  const serializedFavorites = favorites.map(serializeFavorite);

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              {tCommon("backToHome")}
            </Link>
          </Button>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <Bookmark className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          </div>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>

        {serializedFavorites.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Bookmark className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-xl">{t("empty.title")}</CardTitle>
              <CardDescription className="text-base">{t("empty.description")}</CardDescription>
            </CardHeader>
            <CardContent className="text-center pt-4">
              <Button asChild>
                <Link href="/" className="gap-2">
                  <Calculator className="h-4 w-4" />
                  {t("empty.cta")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <FavoritesList initialFavorites={serializedFavorites} />
        )}
      </div>
    </div>
  );
}

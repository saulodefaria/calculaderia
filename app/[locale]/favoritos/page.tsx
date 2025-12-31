"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { ArrowLeft, Bookmark, ExternalLink, Link2, Trash2, Check, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Link } from "@/i18n/navigation";
import { getLocalizedPathname } from "@/i18n/paths";
import { loadFavorites, removeFavorite, clearFavorites, type FavoriteEntry } from "@/lib/favorites/storage";
import { calculators } from "@/lib/constants";

export default function FavoritosPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);

  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const pathname = usePathname();

  const t = useTranslations("favorites.page");
  const tCommon = useTranslations("common");
  const tCalculators = useTranslations("calculators");
  const locale = useLocale();

  const reloadFavorites = useCallback(() => {
    setFavorites(loadFavorites());
  }, []);

  // Ensure favorites are reloaded whenever we navigate (back) to this page.
  // Next's router can preserve this page in memory, so relying only on mount is not enough.
  useEffect(() => {
    if (!pathname.endsWith("/favoritos")) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFavorites(loadFavorites());
  }, [pathname]);

  const handleDelete = useCallback(
    (id: string) => {
      removeFavorite(id);
      reloadFavorites();
    },
    [reloadFavorites]
  );

  const handleDeleteAll = useCallback(() => {
    if (clearFavorites()) {
      setDeleteAllOpen(false);
      setFavorites([]);
    }
  }, []);

  const handleCopyLink = useCallback(
    async (entry: { id: string; calculatorId: string; search: string }) => {
      const calc = calculators.find((c) => c.id === entry.calculatorId);
      if (!calc) return;

      const pathname = getLocalizedPathname(locale, calc.href);
      const url = `${window.location.origin}${pathname}${entry.search}`;

      try {
        await navigator.clipboard.writeText(url);
        setCopiedId(entry.id);
        setTimeout(() => setCopiedId(null), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    },
    [locale]
  );

  const getViewUrl = useCallback((entry: { calculatorId: string; search: string }) => {
    const calc = calculators.find((c) => c.id === entry.calculatorId);
    if (!calc) return "/";
    return `${calc.href}${entry.search}`;
  }, []);

  const formatDate = useCallback(
    (isoDate: string) => {
      const date = new Date(isoDate);
      return date.toLocaleDateString(locale === "pt-br" ? "pt-BR" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    [locale]
  );

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Gradient background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
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

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10">
                <Bookmark className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            </div>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>

          {favorites.length > 0 && (
            <Dialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  {t("deleteAll.button")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("deleteAll.title")}</DialogTitle>
                  <DialogDescription>{t("deleteAll.description")}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteAllOpen(false)}>
                    {t("deleteAll.cancel")}
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteAll}>
                    {t("deleteAll.confirm")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Content */}
        {favorites.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
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
          <div className="space-y-4">
            {favorites.map((entry) => {
              const calc = calculators.find((c) => c.id === entry.calculatorId);
              if (!calc) return null;

              const Icon = calc.icon;
              const calcTitle = tCalculators(`${calc.id}.title`);
              const isCopied = copiedId === entry.id;

              return (
                <Card key={entry.id} className="transition-colors hover:border-emerald-500/30">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Calculator info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 shrink-0">
                          <Icon className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium truncate">{calcTitle}</h3>
                          <p className="text-sm text-muted-foreground">
                            {t("item.createdAt", { date: formatDate(entry.createdAt) })}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" asChild className="gap-1.5" title={t("item.viewTooltip")}>
                          <Link href={getViewUrl(entry)}>
                            <ExternalLink className="h-4 w-4" />
                            <span className="hidden sm:inline">{t("item.view")}</span>
                          </Link>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => handleCopyLink(entry)}
                          title={isCopied ? t("item.copied") : t("item.copyLinkTooltip")}
                          disabled={isCopied}>
                          {isCopied ? (
                            <>
                              <Check className="h-4 w-4 text-emerald-600" />
                              <span className="hidden sm:inline text-emerald-600">{t("item.copied")}</span>
                            </>
                          ) : (
                            <>
                              <Link2 className="h-4 w-4" />
                              <span className="hidden sm:inline">{t("item.copyLink")}</span>
                            </>
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(entry.id)}
                          title={t("item.deleteTooltip")}>
                          <Trash2 className="h-4 w-4" />
                          <span className="hidden sm:inline">{t("item.delete")}</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

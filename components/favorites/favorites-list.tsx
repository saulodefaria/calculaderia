"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Calculator, Check, ExternalLink, Link2, Pencil, Save, Trash2, X } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { getLocalizedPathname } from "@/i18n/paths";
import { calculators } from "@/lib/constants";
import type { FavoriteDto } from "@/lib/favorites/service";

interface FavoritesListProps {
  initialFavorites: FavoriteDto[];
}

export function FavoritesList({ initialFavorites }: FavoritesListProps) {
  const [favorites, setFavorites] = useState(initialFavorites);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const t = useTranslations("favorites.page");
  const tCalculators = useTranslations("calculators");
  const locale = useLocale();

  const handleCopyLink = useCallback(
    async (entry: FavoriteDto) => {
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

  const handleDelete = useCallback(async (id: string) => {
    setPendingId(id);

    try {
      const response = await fetch(`/api/favorites/${id}`, { method: "DELETE" });
      if (response.ok) {
        setFavorites((current) => current.filter((favorite) => favorite.id !== id));
      }
    } finally {
      setPendingId(null);
    }
  }, []);

  const handleDeleteAll = useCallback(async () => {
    const response = await fetch("/api/favorites", { method: "DELETE" });

    if (response.ok) {
      setDeleteAllOpen(false);
      setFavorites([]);
    }
  }, []);

  const startEditing = useCallback((entry: FavoriteDto) => {
    setEditingId(entry.id);
    setEditingName(entry.name);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingId(null);
    setEditingName("");
  }, []);

  const handleRename = useCallback(
    async (id: string) => {
      const nextName = editingName.trim();
      if (!nextName) return;

      setPendingId(id);

      try {
        const response = await fetch(`/api/favorites/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: nextName }),
        });

        if (!response.ok) return;

        const payload = (await response.json()) as { favorite: FavoriteDto };
        setFavorites((current) =>
          current.map((favorite) => (favorite.id === id ? payload.favorite : favorite))
        );
        cancelEditing();
      } finally {
        setPendingId(null);
      }
    },
    [cancelEditing, editingName]
  );

  const getViewUrl = useCallback((entry: FavoriteDto) => {
    const calc = calculators.find((c) => c.id === entry.calculatorId);
    if (!calc) return "/";
    return `${calc.href}${entry.search}`;
  }, []);

  const formatDate = useCallback(
    (isoDate: string) => {
      const date = new Date(isoDate);
      return date.toLocaleDateString(locale === "pt-br" ? "pt-BR" : locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    [locale]
  );

  if (favorites.length === 0) {
    return (
      <Card className="border-2 border-dashed">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Calculator className="h-8 w-8 text-muted-foreground" />
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
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
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
      </div>

      {favorites.map((entry) => {
        const calc = calculators.find((c) => c.id === entry.calculatorId);
        if (!calc) return null;

        const Icon = calc.icon;
        const calcTitle = tCalculators(`${calc.id}.title`);
        const isCopied = copiedId === entry.id;
        const isEditing = editingId === entry.id;
        const isPending = pendingId === entry.id;

        return (
          <Card key={entry.id} className="transition-colors hover:border-emerald-500/30">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Icon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          value={editingName}
                          onChange={(event) => setEditingName(event.target.value)}
                          maxLength={80}
                          aria-label={t("item.nameLabel")}
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => handleRename(entry.id)}
                            disabled={isPending || !editingName.trim()}>
                            <Save className="h-4 w-4" />
                            {t("item.saveName")}
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={cancelEditing}>
                            <X className="h-4 w-4" />
                            <span className="sr-only">{t("item.cancelName")}</span>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex min-w-0 items-center gap-2">
                        <h3 className="truncate font-medium">{entry.name}</h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          title={t("item.editName")}
                          onClick={() => startEditing(entry)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">{t("item.editName")}</span>
                        </Button>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">{calcTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("item.createdAt", { date: formatDate(entry.createdAt) })}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
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
                    title={t("item.deleteTooltip")}
                    disabled={isPending}>
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
  );
}

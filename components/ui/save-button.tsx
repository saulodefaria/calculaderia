"use client";

import { useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Bookmark, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { getLocalizedPathname } from "@/i18n/paths";

type SaveState = "idle" | "saving" | "saved" | "duplicate" | "error";

interface SaveButtonProps {
  /** Function that returns the URL to share (we extract the search params from it) */
  getShareUrl: () => string;
  /** Calculator ID (e.g. "juros-compostos", "financiamento") */
  calculatorId: string;
  /** Optional class name */
  className?: string;
}

export function SaveButton({ getShareUrl, calculatorId, className }: SaveButtonProps) {
  const [state, setState] = useState<SaveState>("idle");
  const t = useTranslations("favorites");
  const tCalculators = useTranslations("calculators");
  const locale = useLocale();
  const router = useRouter();

  const redirectToSignIn = useCallback(() => {
    const callbackUrl = `${window.location.pathname}${window.location.search}`;
    const params = new URLSearchParams({ callbackUrl });
    router.push(`${getLocalizedPathname(locale, "/entrar")}?${params.toString()}`);
  }, [locale, router]);

  const handleSave = useCallback(async () => {
    const url = getShareUrl();

    try {
      // Extract search params from the URL
      const urlObj = new URL(url);
      const search = urlObj.search;

      if (!search) {
        setState("error");
        setTimeout(() => setState("idle"), 2000);
        return;
      }

      setState("saving");

      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          calculatorId,
          search,
          name: tCalculators(`${calculatorId}.title`),
        }),
      });

      if (response.status === 401) {
        redirectToSignIn();
        return;
      }

      if (!response.ok) {
        setState("error");
        setTimeout(() => setState("idle"), 2000);
        return;
      }

      const result = (await response.json()) as { status?: "created" | "duplicate" };

      if (result.status === "created") {
        setState("saved");
      } else if (result.status === "duplicate") {
        setState("duplicate");
      } else {
        setState("error");
      }

      // Reset after 2 seconds
      setTimeout(() => {
        setState("idle");
      }, 2000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2000);
    }
  }, [getShareUrl, calculatorId, redirectToSignIn, tCalculators]);

  const getButtonContent = () => {
    switch (state) {
      case "saving":
        return (
          <>
            <Bookmark className="h-4 w-4 mr-2" />
            {t("saving")}
          </>
        );
      case "saved":
        return (
          <>
            <Check className="h-4 w-4 mr-2 text-emerald-600" />
            <span className="text-emerald-600">{t("saved")}</span>
          </>
        );
      case "duplicate":
        return (
          <>
            <Check className="h-4 w-4 mr-2 text-amber-600" />
            <span className="text-amber-600">{t("alreadySaved")}</span>
          </>
        );
      case "error":
        return (
          <>
            <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
            <span className="text-red-600">{t("error")}</span>
          </>
        );
      default:
        return (
          <>
            <Bookmark className="h-4 w-4 mr-2" />
            {t("save")}
          </>
        );
    }
  };

  const getTitle = () => {
    switch (state) {
      case "saved":
        return t("savedTooltip");
      case "duplicate":
        return t("alreadySavedTooltip");
      case "saving":
        return t("savingTooltip");
      case "error":
        return t("errorTooltip");
      default:
        return t("saveTooltip");
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSave}
      className={className}
      title={getTitle()}
      disabled={state !== "idle"}>
      {getButtonContent()}
    </Button>
  );
}

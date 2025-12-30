"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Check, Bookmark, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addFavorite } from "@/lib/favorites/storage";

type SaveState = "idle" | "saved" | "duplicate" | "error";

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

  const handleSave = useCallback(() => {
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

      const result = addFavorite(calculatorId, search);

      if (result.success) {
        setState("saved");
      } else if (result.reason === "duplicate") {
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
  }, [getShareUrl, calculatorId]);

  const getButtonContent = () => {
    switch (state) {
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

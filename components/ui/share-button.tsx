"use client";

import { useState, useCallback } from "react";
import { Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareButtonProps {
  /** Function that returns the URL to share */
  getShareUrl: () => string;
  /** Optional class name */
  className?: string;
}

export function ShareButton({ getShareUrl, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const url = getShareUrl();

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);

      // Reset after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      console.error("Failed to copy to clipboard:", err);
    }
  }, [getShareUrl]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className={className}
      title={copied ? "Link copiado!" : "Copiar link da simulação"}>
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2 text-emerald-600" />
          <span className="text-emerald-600">Copiado!</span>
        </>
      ) : (
        <>
          <Link2 className="h-4 w-4 mr-2" />
          Compartilhar
        </>
      )}
    </Button>
  );
}

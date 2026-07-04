"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GoogleSignInButtonProps {
  fallbackUrl: string;
  label: string;
}

function getSafeCallbackUrl(fallbackUrl: string) {
  const callbackUrl = new URLSearchParams(window.location.search).get("callbackUrl");

  if (!callbackUrl || !callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return fallbackUrl;
  }

  return callbackUrl;
}

export function GoogleSignInButton({ fallbackUrl, label }: GoogleSignInButtonProps) {
  const [isPending, setIsPending] = useState(false);

  const handleClick = () => {
    setIsPending(true);

    void signIn("google", { redirectTo: getSafeCallbackUrl(fallbackUrl) }).catch(() => {
      setIsPending(false);
    });
  };

  return (
    <Button type="button" className="w-full gap-2" onClick={handleClick} disabled={isPending}>
      <Search className="h-4 w-4" />
      {label}
    </Button>
  );
}

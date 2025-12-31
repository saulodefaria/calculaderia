"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { pageview } from "@/lib/analytics/ga4";

export function GoogleAnalyticsPageView({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  const search = searchParams.toString();

  useEffect(() => {
    // The initial page view is already tracked by the default GA4 `gtag('config', ...)` snippet.
    // For client-side navigations (App Router), we manually send subsequent page views.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const url = search ? `${pathname}?${search}` : pathname;
    pageview(gaId, url);
  }, [gaId, pathname, search]);

  return null;
}

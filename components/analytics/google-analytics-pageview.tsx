"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { pageview } from "@/lib/analytics/ga4";

export function GoogleAnalyticsPageView({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.toString();

  useEffect(() => {
    // Manual page views use pathname + search only so URL fragments are never sent to GA.
    const url = search ? `${pathname}?${search}` : pathname;
    pageview(gaId, url);
  }, [gaId, pathname, search]);

  return null;
}

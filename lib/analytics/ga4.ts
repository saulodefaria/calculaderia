type GtagConfigParams = {
  page_path?: string;
  page_title?: string;
  page_location?: string;
  [key: string]: unknown;
};

type GtagEventParams = Record<string, unknown>;

export function pageview(gaId: string, url: string) {
  if (!gaId) return;
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;

  const pageUrl = new URL(url, window.location.origin);
  pageUrl.hash = "";
  const pagePath = `${pageUrl.pathname}${pageUrl.search}`;

  window.gtag("config", gaId, {
    page_path: pagePath,
    page_title: document.title,
    page_location: pageUrl.toString(),
  } satisfies GtagConfigParams);
}

export function gaEvent(gaId: string, name: string, params?: GtagEventParams) {
  if (!gaId) return;
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;

  window.gtag("event", name, params ?? {});
}

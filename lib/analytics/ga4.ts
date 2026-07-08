type GtagConfigParams = {
  page_path?: string;
  page_title?: string;
  page_location?: string;
  [key: string]: unknown;
};

type GtagEventParams = Record<string, unknown>;

function isPaymentCardValidatorPath(pathname: string): boolean {
  return /^\/(?:(?:pt-br|en|es)\/)?validadores\/validador-cartao\/?$/.test(pathname);
}

function isTituloEleitorValidatorPath(pathname: string): boolean {
  return /^\/(?:(?:pt-br|en|es)\/)?validadores\/validador-titulo-eleitor\/?$/.test(pathname);
}

export function sanitizeAnalyticsUrl(url: string, origin: string): URL {
  const pageUrl = new URL(url, origin);
  pageUrl.hash = "";

  if (isPaymentCardValidatorPath(pageUrl.pathname)) {
    const sanitizedParams = new URLSearchParams();

    if (pageUrl.searchParams.get("mascarado") === "0") {
      sanitizedParams.set("mascarado", "0");
    }

    pageUrl.search = sanitizedParams.toString();
  }

  if (isTituloEleitorValidatorPath(pageUrl.pathname)) {
    pageUrl.search = "";
  }

  return pageUrl;
}

export function pageview(gaId: string, url: string) {
  if (!gaId) return;
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;

  const pageUrl = sanitizeAnalyticsUrl(url, window.location.origin);
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

"use client";

export function getInitialSearchParams(): URLSearchParams {
  if (typeof window === "undefined") {
    return new URLSearchParams();
  }

  return new URLSearchParams(window.location.search);
}

export function replaceQueryString(params: URLSearchParams) {
  if (typeof window === "undefined") return;

  const query = params.toString();
  const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  window.history.replaceState(null, "", nextUrl);
}

export function getShareUrlFromParams(params: URLSearchParams): string {
  if (typeof window === "undefined") return "";

  const query = params.toString();
  return `${window.location.origin}${window.location.pathname}${query ? `?${query}` : ""}`;
}

export type LocationLike = {
  origin: string;
  pathname: string;
};

/**
 * Returns the current page "base URL" (origin + pathname), without query/hash.
 * Used to generate share URLs that preserve the current route but replace query params.
 */
export function getCurrentPageBaseUrl(location?: LocationLike): string {
  const loc = location ?? (typeof window !== "undefined" ? window.location : undefined);

  if (!loc) {
    throw new Error("getCurrentPageBaseUrl() must be called in a browser environment.");
  }

  return `${loc.origin}${loc.pathname}`;
}

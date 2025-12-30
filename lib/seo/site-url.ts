const DEFAULT_DEV_SITE_URL = "http://localhost:3000";

function hasProtocol(url: string): boolean {
  return /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(url);
}

function normalizeSiteUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  if (!url) return DEFAULT_DEV_SITE_URL;

  // Allow env values like "example.com" (no protocol) or "localhost:3000".
  if (!hasProtocol(url)) {
    const isLocalhost = url.startsWith("localhost") || url.startsWith("127.0.0.1") || url.startsWith("0.0.0.0");
    url = `${isLocalhost ? "http" : "https"}://${url}`;
  }

  // Remove trailing slash for consistent concatenation + URL building.
  url = url.replace(/\/$/, "");
  return url;
}

/**
 * Returns the canonical site URL (origin) used to build absolute URLs for SEO.
 *
 * Resolution order:
 * 1) SITE_URL (server-only preferred)
 * 2) NEXT_PUBLIC_SITE_URL (legacy / shared)
 * 3) NEXT_PUBLIC_APP_URL (alternative name)
 * 4) VERCEL_URL / NEXT_PUBLIC_VERCEL_URL (Vercel-provided host, assumed https)
 * 5) http://localhost:3000
 */
export function getSiteUrl(): string {
  const explicit = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return normalizeSiteUrl(explicit);

  const vercelHost = process.env.VERCEL_URL ?? process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercelHost) return normalizeSiteUrl(`https://${vercelHost}`);

  return DEFAULT_DEV_SITE_URL;
}

export function getSiteUrlObject(): URL {
  return new URL(getSiteUrl());
}

export function absoluteUrl(pathname: string): string {
  return new URL(pathname, getSiteUrl()).toString();
}

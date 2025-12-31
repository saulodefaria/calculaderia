import { routing } from "./routing";

type AppLocale = (typeof routing.locales)[number];

export function isAppLocale(locale: string): locale is AppLocale {
  return routing.locales.includes(locale as AppLocale);
}

/**
 * Normalizes a pathname to:
 * - start with "/"
 * - have no trailing slash (except for "/")
 */
export function normalizePathname(pathname: string): string {
  let p = pathname.trim();
  if (!p) return "/";
  if (!p.startsWith("/")) p = `/${p}`;
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

/**
 * Converts our internal locale format (e.g. "pt-br") to an hreflang key (e.g. "pt-BR").
 * For single-part locales, returns lowercase (e.g. "en", "es").
 */
export function toHreflang(locale: string): string {
  const parts = locale.split("-").filter(Boolean);
  if (parts.length === 0) return locale;
  if (parts.length === 1) return parts[0].toLowerCase();
  if (parts.length === 2) return `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`;
  // Fallback: keep a reasonable shape (language lower + rest upper).
  return [parts[0].toLowerCase(), ...parts.slice(1).map((p) => p.toUpperCase())].join("-");
}

/**
 * Returns a locale-aware pathname that matches our `next-intl` routing config.
 *
 * With `localePrefix.mode: "as-needed"` (current config):
 * - default locale (pt-br) stays unprefixed: "/calculadoras/financiamento"
 * - non-default locales are prefixed: "/en/calculadoras/financiamento", "/es/..."
 *
 * Root ("/") is special-cased so that "/en" is returned (instead of "/en/").
 */
export function getLocalizedPathname(locale: string, pathname: string): string {
  const normalizedPathname = normalizePathname(pathname);
  const safeLocale: AppLocale = isAppLocale(locale) ? locale : routing.defaultLocale;

  const localePrefix = routing.localePrefix;
  const mode = typeof localePrefix === "string" ? localePrefix : localePrefix?.mode ?? "as-needed";
  const prefixes =
    typeof localePrefix === "string" || !localePrefix || localePrefix.mode === "never"
      ? undefined
      : localePrefix.prefixes;

  const shouldPrefix = mode === "always" || (mode === "as-needed" && safeLocale !== routing.defaultLocale);

  if (!shouldPrefix) return normalizedPathname;

  const configuredPrefix = prefixes?.[safeLocale];
  const prefix = configuredPrefix ? normalizePathname(configuredPrefix) : `/${safeLocale}`;

  // Avoid double-prefixing if a fully-prefixed pathname is accidentally passed in.
  if (normalizedPathname === prefix || normalizedPathname.startsWith(`${prefix}/`)) {
    return normalizedPathname;
  }

  if (normalizedPathname === "/") return prefix;
  return `${prefix}${normalizedPathname}`;
}

/**
 * Builds the `alternates.languages` map for Next.js Metadata, for all supported locales.
 */
export function getAlternateLanguagePathnames(
  pathname: string,
  options?: { includeXDefault?: boolean }
): Record<string, string> {
  const normalizedPathname = normalizePathname(pathname);
  const out: Record<string, string> = {};

  for (const locale of routing.locales) {
    out[toHreflang(locale)] = getLocalizedPathname(locale, normalizedPathname);
  }

  if (options?.includeXDefault) {
    out["x-default"] = getLocalizedPathname(routing.defaultLocale, normalizedPathname);
  }

  return out;
}

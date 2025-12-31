import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ["pt-br", "en", "es"],

  // Used when no locale matches
  defaultLocale: "pt-br",

  // Always default to pt-br unless the locale is explicitly present in the URL.
  // This disables redirects based on Accept-Language headers and previously set locale cookies.
  localeDetection: false,

  // Only prefix non-default locale (en gets /en prefix, pt-br stays unprefixed)
  localePrefix: {
    mode: "as-needed",
  },
});

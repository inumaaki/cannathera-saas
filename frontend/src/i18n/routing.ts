import { defineRouting } from "next-intl/routing";
import { LOCALES, DEFAULT_LOCALE } from "@cannathera/shared";

// Locale routing driven by the shared single-source-of-truth locale list.
// `localePrefix: "always"` => /de, /en, /tr, /bg, /ar.
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always",
});

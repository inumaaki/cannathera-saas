// Single source of truth for supported locales.
// German is the DEFAULT and the pilot language; the rest are translation-ready.

export const LOCALES = ["de", "en", "tr", "bg", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "de";

// Right-to-left locales — layout must flip via logical CSS properties.
export const RTL_LOCALES: readonly Locale[] = ["ar"];

export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

// Native display names for a language switcher.
export const LOCALE_LABELS: Record<Locale, string> = {
  de: "Deutsch",
  en: "English",
  tr: "Türkçe",
  bg: "Български",
  ar: "العربية",
};

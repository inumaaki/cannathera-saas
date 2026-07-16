export declare const LOCALES: readonly ["de", "en", "tr", "bg", "ar"];
export type Locale = (typeof LOCALES)[number];
export declare const DEFAULT_LOCALE: Locale;
export declare const RTL_LOCALES: readonly Locale[];
export declare function isRtl(locale: Locale): boolean;
export declare function isLocale(value: string): value is Locale;
export declare const LOCALE_LABELS: Record<Locale, string>;

"use strict";
// Single source of truth for supported locales.
// German is the DEFAULT and the pilot language; the rest are translation-ready.
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOCALE_LABELS = exports.RTL_LOCALES = exports.DEFAULT_LOCALE = exports.LOCALES = void 0;
exports.isRtl = isRtl;
exports.isLocale = isLocale;
exports.LOCALES = ["de", "en", "tr", "bg", "ar"];
exports.DEFAULT_LOCALE = "de";
// Right-to-left locales — layout must flip via logical CSS properties.
exports.RTL_LOCALES = ["ar"];
function isRtl(locale) {
    return exports.RTL_LOCALES.includes(locale);
}
function isLocale(value) {
    return exports.LOCALES.includes(value);
}
// Native display names for a language switcher.
exports.LOCALE_LABELS = {
    de: "Deutsch",
    en: "English",
    tr: "Türkçe",
    bg: "Български",
    ar: "العربية",
};

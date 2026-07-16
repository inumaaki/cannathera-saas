import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";
import deMessages from "../../messages/de.json";

type Messages = typeof deMessages;

// Deep-merge locale messages over the German base so any MISSING key
// transparently falls back to German (pilot rule) instead of breaking the UI.
function deepMerge<T>(base: T, override: unknown): T {
  if (
    typeof base !== "object" ||
    base === null ||
    typeof override !== "object" ||
    override === null
  ) {
    return (override ?? base) as T;
  }
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
    if (key.startsWith("_")) continue; // skip meta keys like "_note"
    out[key] = deepMerge((base as Record<string, unknown>)[key], value);
  }
  return out as T;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const localeMessages =
    locale === routing.defaultLocale
      ? deMessages
      : ((await import(`../../messages/${locale}.json`)).default as Partial<Messages>);

  return {
    locale,
    messages: deepMerge(deMessages, localeMessages) as Messages,
  };
});

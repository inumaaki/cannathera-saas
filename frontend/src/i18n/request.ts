import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";
import fs from "fs/promises";
import path from "path";

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

  // Use fs.readFile instead of `import()` so Next.js doesn't transform the JSON strings into 
  // functions (which crashes RSC serialization to Client Components).
  const dePath = path.join(process.cwd(), "messages", "de.json");
  const deMessages = JSON.parse(await fs.readFile(dePath, "utf-8"));
  
  let localeMessages = deMessages;
  if (locale !== routing.defaultLocale) {
    try {
      const locPath = path.join(process.cwd(), "messages", `${locale}.json`);
      localeMessages = JSON.parse(await fs.readFile(locPath, "utf-8"));
    } catch {
      // Fallback to DE if file is missing
    }
  }

  return {
    locale,
    messages: deepMerge(deMessages, localeMessages),
  };
});

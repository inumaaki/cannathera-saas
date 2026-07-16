"use client";

import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { LOCALES, LOCALE_LABELS } from "@cannathera/shared";

/* Compact locale selector. Full navigation (not client transition) so every
   server component re-renders in the new locale; query string is preserved. */
export function LocaleSwitcher() {
  const locale = useLocale();
  // Path WITHOUT locale prefix, e.g. "/doctor/patients".
  const pathname = usePathname();

  function switchTo(next: string) {
    if (next === locale) return;
    const search = window.location.search;
    const hash = window.location.hash;
    window.location.assign(`/${next}${pathname}${search}${hash}`);
  }

  return (
    <select
      aria-label="Language"
      value={locale}
      onChange={(e) => switchTo(e.target.value)}
      className="bg-transparent text-sm font-semibold text-muted uppercase cursor-pointer
                 outline-none hover:text-ink-strong"
    >
      {LOCALES.map((l) => (
        <option key={l} value={l}>
          {LOCALE_LABELS[l]}
        </option>
      ))}
    </select>
  );
}

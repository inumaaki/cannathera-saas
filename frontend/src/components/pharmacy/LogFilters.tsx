"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

/* Filter bar for Treatment Logs (Figma 6.3.1) — drives the server query string. */
export function LogFilters({
  days,
  q,
  flagged,
}: Readonly<{ days: number; q: string; flagged: boolean }>) {
  const t = useTranslations("pharmacy.logs");
  const router = useRouter();
  const [term, setTerm] = useState(q);

  function apply(next: { days?: number; q?: string; flagged?: boolean }) {
    const query: Record<string, string> = {};
    const d = next.days ?? days;
    const term2 = next.q ?? term;
    const f = next.flagged ?? flagged;
    if (d !== 30) query.days = String(d);
    if (term2.trim()) query.q = term2.trim();
    if (f) query.flagged = "1";
    router.push({ pathname: "/pharmacy/logs", query });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply({});
      }}
      className="cw-watermark mt-6 grid gap-4 rounded-xl border border-hairline bg-white p-5 md:grid-cols-[1fr_2fr_auto] md:items-end"
    >
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-wide text-sage-900">
          {t("dateRange")}
        </span>
        <select
          value={days}
          onChange={(e) => apply({ days: Number(e.target.value) })}
          className="mt-1.5 h-11 w-full rounded-lg border border-hairline bg-surface px-3 text-sm font-semibold text-ink-strong outline-none focus:ring-2 focus:ring-pine-600/30"
        >
          <option value={7}>{t("last7")}</option>
          <option value={30}>{t("last30")}</option>
          <option value={90}>{t("last90")}</option>
        </select>
      </label>

      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-wide text-sage-900">
          {t("patientSearch")}
        </span>
        <span className="relative mt-1.5 block">
          <span
            aria-hidden
            className="msym absolute start-3 top-1/2 -translate-y-1/2 text-[20px] text-muted"
          >
            search
          </span>
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-11 w-full rounded-lg border border-hairline bg-surface ps-10 pe-3 text-sm text-ink-strong outline-none placeholder:text-muted focus:ring-2 focus:ring-pine-600/30"
          />
        </span>
      </label>

      <div className="flex items-center gap-3">
        <label className="flex h-11 cursor-pointer select-none items-center gap-2 rounded-lg border border-hairline px-4 text-sm font-semibold text-ink-strong">
          <input
            type="checkbox"
            checked={flagged}
            onChange={(e) => apply({ flagged: e.target.checked })}
            className="size-4 accent-[#066c41]"
          />
          {t("flaggedOnly")}
        </label>
        <button
          type="submit"
          className="h-11 rounded-lg bg-brand px-5 text-sm font-bold text-white hover:bg-pine"
        >
          {t("patientSearch")}
        </button>
      </div>
    </form>
  );
}

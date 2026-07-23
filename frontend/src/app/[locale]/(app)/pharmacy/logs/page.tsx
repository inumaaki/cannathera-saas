import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { API_URL } from "@/lib/api";
import { apiServer } from "@/lib/api-server";
import { LogFilters } from "@/components/pharmacy/LogFilters";

type LogRow = {
  id: string;
  loggedAt: string;
  patientId: string;
  patientName: string;
  patientRef: string | null;
  strain: string | null;
  dosageG: string | number | null;
  pain: number | null;
  sleep: number | null;
  flagged: boolean;
  severity: "INFO" | "WARNING" | "CRITICAL" | null;
  status: "flagged" | "verified";
};

type LogsData = {
  rows: LogRow[];
  stats: {
    total: number;
    recent7d: number;
    activePatients: number;
    inRange: number;
    matched: number;
    flagged: number;
  };
};

export default async function PharmacyLogs({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ days?: string; q?: string; flagged?: string }>;
}>) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);

  const parsedDays = Number(sp.days);
  const days = [7, 30, 90].includes(parsedDays) ? parsedDays : 30;
  const q = sp.q?.trim() ?? "";
  const flagged = sp.flagged === "1";
  const query = new URLSearchParams({ days: String(days) });
  if (q) query.set("q", q);
  if (flagged) query.set("flagged", "1");

  const [t, format, data] = await Promise.all([
    getTranslations("pharmacy.logs"),
    getFormatter(),
    apiServer<LogsData>(`/pharmacy/logs?${query.toString()}`),
  ]);

  const rows = data?.rows ?? [];
  const stats = data?.stats ?? {
    total: 0,
    recent7d: 0,
    activePatients: 0,
    inRange: 0,
    matched: 0,
    flagged: 0,
  };

  const emptyMessage = flagged
    ? q && stats.matched > 0
      ? t("emptyFlagged", { patient: q, matched: stats.matched })
      : t("emptyFlaggedAll")
    : q
      ? t("emptySearch", { q })
      : stats.total > 0
        ? t("emptyFiltered")
        : t("empty");

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-pine sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-1 max-w-2xl text-muted">{t("subtitle")}</p>
        </div>
        <a
          href={`${API_URL}/pharmacy/logs/export`}
          className="flex items-center gap-2 rounded-lg border border-pine-600 px-4 py-2.5 text-sm font-bold text-pine-600 transition hover:bg-mint/20"
        >
          <span aria-hidden className="msym text-[18px]">download</span>
          {t("exportCsv")}
        </a>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon="clinical_notes" tint="bg-[#eef2fe] text-info" value={stats.total} label={t("totalEntries")} />
        <Stat icon="update" tint="bg-mint/30 text-pine-600" value={stats.recent7d} label={t("recentAdjustments")} note={t("last7d")} />
        <Stat icon="groups" tint="bg-surface text-pine" value={stats.activePatients} label={t("activePatients")} />
        <Stat icon="flag" tint="bg-[#fdece0] text-accent-print" value={stats.flagged} label={t("flagged")} />
      </div>

      <LogFilters days={days} q={q} flagged={flagged} />

      {q || flagged || days !== 30 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-muted">{t("activeFilters")}</span>
          {q ? <FilterChip icon="search" label={t("chipSearch", { q })} /> : null}
          {flagged ? <FilterChip icon="flag" label={t("chipFlagged")} /> : null}
          {days !== 30 ? <FilterChip icon="date_range" label={t("chipDays", { days })} /> : null}
          <Link href="/pharmacy/logs" className="ms-1 font-bold text-pine-600 hover:underline">
            {t("clearAll")}
          </Link>
        </div>
      ) : null}

      <section className="cw-watermark mt-6 overflow-hidden rounded-xl border border-hairline bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-4 sm:px-6">
          <div>
            <h2 className="font-display text-xl font-bold text-pine">{t("tableTitle")}</h2>
            <p className="mt-0.5 text-xs text-muted">
              {t("showing", { count: rows.length, inRange: stats.inRange })}
            </p>
          </div>
          {stats.flagged > 0 && !flagged ? (
            <Link
              href={{ pathname: "/pharmacy/logs", query: { days: String(days), ...(q ? { q } : {}), flagged: "1" } }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#fdece0] px-3 py-2 text-xs font-bold text-accent-print hover:bg-red-100"
            >
              <span aria-hidden className="msym text-[17px]">flag</span>
              {t("flaggedCount", { count: stats.flagged })}
            </Link>
          ) : null}
        </div>

        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <span aria-hidden className="msym text-[42px] text-sage-300">manage_search</span>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted">{emptyMessage}</p>
            {flagged ? (
              <Link
                href={{ pathname: "/pharmacy/logs", query: { days: String(days), ...(q ? { q } : {}) } }}
                className="mt-4 inline-flex rounded-lg border border-hairline px-3 py-2 text-xs font-bold text-pine hover:bg-surface"
              >
                {t("clearFlagged")}
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto overscroll-x-contain [scrollbar-width:thin]">
            <table className="w-full min-w-[920px] text-start text-sm">
              <thead className="bg-surface text-[10px] font-bold uppercase tracking-wider text-sage-950">
                <tr>
                  <th className="px-6 py-3.5">{t("colDate")}</th>
                  <th className="px-6 py-3.5">{t("colPatient")}</th>
                  <th className="px-6 py-3.5">{t("colStrain")}</th>
                  <th className="px-6 py-3.5">{t("colDosage")}</th>
                  <th className="px-6 py-3.5">{t("colPain")}</th>
                  <th className="px-6 py-3.5">{t("colStatus")}</th>
                  <th className="px-6 py-3.5 text-end">{t("openReview")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {rows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-surface/60">
                    <td className="whitespace-nowrap px-6 py-4 text-xs font-semibold text-muted">
                      {format.dateTime(new Date(row.loggedAt), {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-ink-strong">{row.patientName}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-muted">{row.patientRef ?? "—"}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-ink-strong">{row.strain ?? "—"}</td>
                    <td className="px-6 py-4 font-mono text-xs">{row.dosageG != null ? `${row.dosageG} g` : "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex min-w-8 justify-center rounded-md px-2 py-1 text-xs font-bold ${
                        row.pain != null && row.pain >= 9 ? "bg-red-50 text-red-700" : "bg-surface text-ink-strong"
                      }`}>
                        {row.pain ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                        row.flagged ? "bg-[#fdece0] text-accent-print" : "bg-brand/10 text-brand"
                      }`}>
                        <span aria-hidden className="msym text-[15px]">{row.flagged ? "flag" : "verified"}</span>
                        {row.flagged ? t("flagged") : t("verified")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-end">
                      <Link
                        href={`/pharmacy/reviews/${row.patientId}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-hairline px-3 py-2 text-xs font-bold text-pine transition hover:border-pine-600 hover:bg-mint/20"
                      >
                        {t("openReview")}
                        <span aria-hidden className="msym text-[16px] rtl:rotate-180">arrow_forward</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function Stat({
  icon,
  tint,
  value,
  label,
  note,
}: Readonly<{ icon: string; tint: string; value: number; label: string; note?: string }>) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-hairline bg-white p-5 shadow-sm">
      <div>
        <div className="text-3xl font-extrabold text-pine">{value}</div>
        <div className="mt-1 text-sm font-bold text-ink-strong">{label}</div>
        {note ? <div className="text-xs text-muted">{note}</div> : null}
      </div>
      <span className={`flex size-12 items-center justify-center rounded-xl ${tint}`}>
        <span aria-hidden className="msym text-[25px]">{icon}</span>
      </span>
    </div>
  );
}

function FilterChip({ icon, label }: Readonly<{ icon: string; label: string }>) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-hairline bg-white px-2.5 py-1 font-semibold text-ink-strong">
      <span aria-hidden className="msym text-[14px] text-brand">{icon}</span>
      {label}
    </span>
  );
}

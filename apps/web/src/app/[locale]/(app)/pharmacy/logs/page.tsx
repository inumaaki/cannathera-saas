import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { API_URL } from "@/lib/api";
import { apiServer } from "@/lib/api-server";
import { LogFilters } from "@/components/pharmacy/LogFilters";

type Row = {
  id: string;
  loggedAt: string;
  patientId: string;
  patientName: string;
  patientRef: string | null;
  strain: string | null;
  dosageG: number | null;
  pain: number | null;
  sleep: number | null;
  flagged: boolean;
  severity: "CRITICAL" | "WARNING" | null;
  status: "flagged" | "verified";
};

type Data = {
  rows: Row[];
  stats: {
    total: number;
    recent7d: number;
    activePatients: number;
    inRange: number;
    matched: number;
    flagged: number;
  };
};

/* Figma 6.3.1 — Treatment Logs. */
export default async function PharmacyLogs({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ days?: string; q?: string; flagged?: string }>;
}>) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);

  const days = sp.days === "90" ? 90 : sp.days === "7" ? 7 : 30;
  const q = sp.q ?? "";
  const flagged = sp.flagged === "1";

  const query = new URLSearchParams({ days: String(days) });
  if (q) query.set("q", q);
  if (flagged) query.set("flagged", "1");

  const [t, format, d] = await Promise.all([
    getTranslations("pharmacy.logs"),
    getFormatter(),
    apiServer<Data>(`/pharmacy/logs?${query.toString()}`),
  ]);

  const hasFilters = Boolean(q) || flagged || days !== 30;

  /* Say exactly which filter emptied the table. The common trap: arriving from a
     red-flag link (flagged=1), then searching a patient who has no flagged entry. */
  const matched = d?.stats.matched ?? 0;
  const emptyMessage = flagged
    ? q && matched > 0
      ? t("emptyFlagged", { patient: q, matched })
      : t("emptyFlaggedAll")
    : q
      ? t("emptySearch", { q })
      : hasFilters
        ? t("emptyFiltered")
        : t("empty");

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-pine">{t("title")}</h1>
          <p className="mt-1 max-w-2xl text-muted">{t("subtitle")}</p>
        </div>
        <a
          href={`${API_URL}/pharmacy/logs/export`}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-pine"
        >
          <span aria-hidden className="msym text-[18px]">
            download
          </span>
          {t("exportCsv")}
        </a>
      </div>

      <LogFilters days={days} q={q} flagged={flagged} />

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Stat
          icon="database"
          tint="bg-[#eef2fe] text-info"
          value={String(d?.stats.total ?? 0)}
          label={t("totalEntries")}
          href={{ pathname: "/pharmacy/logs", query: { days: "90" } }}
        />
        <Stat
          icon="edit_note"
          tint="bg-mint/30 text-pine-600"
          value={String(d?.stats.recent7d ?? 0)}
          label={t("recentAdjustments")}
          note={t("last7d")}
          href={{ pathname: "/pharmacy/logs", query: { days: "7" } }}
        />
        <Stat
          icon="groups"
          tint="bg-[#fdece0] text-accent-print"
          value={String(d?.stats.activePatients ?? 0)}
          label={t("activePatients")}
          href="/pharmacy/reviews"
        />
      </div>

      <section className="cw-watermark mt-6 overflow-hidden rounded-xl border border-hairline bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-6 py-4">
          <h2 className="font-display text-xl font-bold text-pine">{t("tableTitle")}</h2>
          {d && d.stats.flagged > 0 ? (
            <span className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">
              {t("flaggedCount", { count: d.stats.flagged })}
            </span>
          ) : null}
        </div>

        {/* Active filters, always visible — an empty table must never be a mystery. */}
        {hasFilters ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-hairline bg-surface px-6 py-3 text-xs">
            <span className="font-bold text-sage-900">{t("activeFilters")}</span>
            {q ? <Chip>{t("chipSearch", { q })}</Chip> : null}
            {flagged ? <Chip tone="critical">{t("chipFlagged")}</Chip> : null}
            {days !== 30 ? <Chip>{t("chipDays", { days })}</Chip> : null}
            <Link
              href="/pharmacy/logs"
              className="ms-auto font-bold text-pine-600 hover:underline"
            >
              {t("clearAll")}
            </Link>
          </div>
        ) : null}

        {(d?.rows.length ?? 0) === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="mx-auto max-w-lg text-muted">{emptyMessage}</p>
            {flagged ? (
              <Link
                href={{
                  pathname: "/pharmacy/logs",
                  query: {
                    ...(q ? { q } : {}),
                    ...(days !== 30 ? { days: String(days) } : {}),
                  },
                }}
                className="mt-4 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-pine"
              >
                {t("clearFlagged")}
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline text-xs font-bold uppercase tracking-wide text-sage-900">
                  <th className="px-6 py-3 text-start">{t("colDate")}</th>
                  <th className="px-6 py-3 text-start">{t("colPatient")}</th>
                  <th className="px-6 py-3 text-start">{t("colStrain")}</th>
                  <th className="px-6 py-3 text-start">{t("colDosage")}</th>
                  <th className="px-6 py-3 text-start">{t("colPain")}</th>
                  <th className="px-6 py-3 text-start">{t("colStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {d!.rows.map((r) => (
                  <tr key={r.id} className="border-b border-hairline last:border-0">
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-muted">
                      {format.dateTime(new Date(r.loggedAt), {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/pharmacy/reviews/${r.patientId}`}
                        className="font-bold text-ink-strong hover:text-pine-600 hover:underline"
                      >
                        {r.patientName}
                      </Link>
                      <p className="font-mono text-xs text-muted">{r.patientRef}</p>
                    </td>
                    <td className="px-6 py-4 text-ink-strong">{r.strain ?? "—"}</td>
                    <td className="px-6 py-4 font-mono text-ink-strong">
                      {r.dosageG != null ? `${r.dosageG} g` : "—"}
                    </td>
                    <td className="px-6 py-4">
                      {r.pain != null ? (
                        <span
                          className={`font-mono font-bold ${
                            r.pain >= 7 ? "text-red-600" : "text-ink-strong"
                          }`}
                        >
                          {r.pain}/10
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-between gap-3">
                        {r.flagged ? (
                          <Link
                            href={{ pathname: "/pharmacy/logs", query: { flagged: "1" } }}
                            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold hover:underline ${
                              r.severity === "CRITICAL"
                                ? "bg-red-50 text-red-600"
                                : "bg-[#fdece0] text-accent-print"
                            }`}
                          >
                            <span aria-hidden className="msym text-[14px]">
                              flag
                            </span>
                            {t("flagged")}
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-mint/30 px-2.5 py-1 text-xs font-bold text-pine-600">
                            <span aria-hidden className="msym text-[14px]">
                              check_circle
                            </span>
                            {t("verified")}
                          </span>
                        )}
                        <Link
                          href={`/pharmacy/reviews/${r.patientId}`}
                          aria-label={t("openReview")}
                          title={t("openReview")}
                          className="text-muted hover:text-pine-600"
                        >
                          <span aria-hidden className="msym text-[18px] rtl:-scale-x-100">
                            chevron_right
                          </span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="border-t border-hairline px-6 py-3 text-xs text-muted">
          {t("showing", {
            count: d?.rows.length ?? 0,
            inRange: d?.stats.inRange ?? 0,
          })}
        </p>
      </section>
    </>
  );
}

function Chip({
  children,
  tone = "default",
}: Readonly<{ children: React.ReactNode; tone?: "default" | "critical" }>) {
  return (
    <span
      className={`rounded-md px-2.5 py-1 font-bold ${
        tone === "critical"
          ? "bg-red-50 text-red-600"
          : "bg-white text-ink-strong ring-1 ring-hairline"
      }`}
    >
      {children}
    </span>
  );
}

function Stat({
  icon,
  tint,
  value,
  label,
  note,
  href,
}: Readonly<{
  icon: string;
  tint: string;
  value: string;
  label: string;
  note?: string;
  href: string | { pathname: string; query: Record<string, string> };
}>) {
  return (
    <Link
      href={href}
      className="cw-watermark flex items-center gap-4 rounded-xl border border-hairline bg-white p-5 transition-colors hover:border-pine-600"
    >
      <span
        aria-hidden
        className={`msym flex size-12 items-center justify-center rounded-xl text-[24px] ${tint}`}
      >
        {icon}
      </span>
      <div>
        <p className="font-display text-3xl font-bold text-pine">{value}</p>
        <p className="text-sm text-muted">
          {label}
          {note ? <span className="ms-1 text-xs">({note})</span> : null}
        </p>
      </div>
    </Link>
  );
}

import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { API_URL } from "@/lib/api";
import { apiServer } from "@/lib/api-server";

type Row = {
  id: string;
  name: string;
  patientRef: string | null;
  condition: string | null;
  tier: string;
  lastReviewAt: string | null;
  diffDays: number;
  status: "overdue" | "dueSoon" | "onTrack";
  openFlags: number;
  criticalFlags: number;
};

type Data = {
  rows: Row[];
  stats: {
    overdue: number;
    completedToday: number;
    pending: number;
    flagged: number;
    total: number;
  };
};

const TABS = [
  { key: "all", label: "tabAll" },
  { key: "overdue", label: "tabOverdue" },
  { key: "dueSoon", label: "tabDueSoon" },
  { key: "onTrack", label: "tabOnTrack" },
  { key: "flagged", label: "tabFlagged" },
] as const;

const TIER_STYLE: Record<string, string> = {
  PREMIUM: "bg-pine text-white",
  PLUS: "bg-mint/50 text-pine",
  BASIC: "bg-[#eef1f8] text-ink-strong",
};

/* Figma 6.2 — Patient Reviews roster. */
export default async function PharmacyReviews({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ filter?: string }>;
}>) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);

  const filter = TABS.some((x) => x.key === sp.filter) ? sp.filter! : "all";

  const [t, format, d] = await Promise.all([
    getTranslations("pharmacy.reviews"),
    getFormatter(),
    apiServer<Data>(`/pharmacy/reviews?filter=${filter}`),
  ]);

  const dueLabel = (r: Row) =>
    r.status === "overdue"
      ? t("overdueBadge", { days: Math.abs(r.diffDays) })
      : r.status === "dueSoon"
        ? t("inDays", { days: Math.max(0, r.diffDays) })
        : t("onTrackBadge");

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-pine">{t("title")}</h1>
          <p className="mt-1 max-w-2xl text-muted">{t("subtitle")}</p>
        </div>
        <a
          href={`${API_URL}/pharmacy/reviews/export`}
          className="flex items-center gap-2 rounded-lg border border-pine-600 px-4 py-2.5 text-sm font-bold text-pine-600 hover:bg-mint/20"
        >
          <span aria-hidden className="msym text-[18px]">
            download
          </span>
          {t("exportRecords")}
        </a>
      </div>

      {/* Stats double as filter shortcuts. */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon="error"
          tint="bg-red-50 text-red-600"
          value={d?.stats.overdue ?? 0}
          label={t("overdue")}
          href={{ pathname: "/pharmacy/reviews", query: { filter: "overdue" } }}
        />
        <Stat
          icon="task_alt"
          tint="bg-mint/30 text-pine-600"
          value={d?.stats.completedToday ?? 0}
          label={t("completedToday")}
          href="/pharmacy/analytics"
        />
        <Stat
          icon="pending_actions"
          tint="bg-[#eef2fe] text-info"
          value={d?.stats.pending ?? 0}
          label={t("pending")}
          href={{ pathname: "/pharmacy/reviews", query: { filter: "dueSoon" } }}
        />
        <Stat
          icon="flag"
          tint="bg-[#fdece0] text-accent-print"
          value={d?.stats.flagged ?? 0}
          label={t("flagged")}
          href={{ pathname: "/pharmacy/reviews", query: { filter: "flagged" } }}
        />
      </div>

      <section className="cw-watermark mt-6 overflow-hidden rounded-xl border border-hairline bg-white">
        <div className="flex flex-wrap gap-1 border-b border-hairline px-4 pt-3">
          {TABS.map((tab) => (
            <Link
              key={tab.key}
              href={
                tab.key === "all"
                  ? "/pharmacy/reviews"
                  : { pathname: "/pharmacy/reviews", query: { filter: tab.key } }
              }
              className={`rounded-t-lg px-4 py-2.5 text-sm font-bold ${
                filter === tab.key
                  ? "border-b-2 border-pine-600 text-pine-600"
                  : "text-muted hover:text-ink-strong"
              }`}
            >
              {t(tab.label)}
            </Link>
          ))}
        </div>

        {(d?.rows.length ?? 0) === 0 ? (
          <p className="px-6 py-12 text-center text-muted">{t("empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline text-xs font-bold uppercase tracking-wide text-sage-900">
                  <th className="px-6 py-3 text-start">{t("colPatient")}</th>
                  <th className="px-6 py-3 text-start">{t("colCondition")}</th>
                  <th className="px-6 py-3 text-start">{t("colLast")}</th>
                  <th className="px-6 py-3 text-start">{t("colDue")}</th>
                  <th className="px-6 py-3 text-start">{t("colTier")}</th>
                  <th className="px-6 py-3 text-end">{t("colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {d!.rows.map((r) => (
                  <tr key={r.id} className="border-b border-hairline last:border-0">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-mint/40 text-xs font-bold text-pine">
                          {r.name
                            .split(/\s+/)
                            .filter(Boolean)
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </span>
                        <div>
                          <Link
                            href={`/pharmacy/reviews/${r.id}`}
                            className="font-bold text-ink-strong hover:text-pine-600 hover:underline"
                          >
                            {r.name}
                          </Link>
                          <p className="font-mono text-xs text-muted">{r.patientRef}</p>
                          {r.openFlags > 0 ? (
                            <Link
                              href={{
                                pathname: "/pharmacy/logs",
                                query: { q: r.patientRef ?? r.name, flagged: "1" },
                              }}
                              className={`mt-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                                r.criticalFlags > 0
                                  ? "bg-red-50 text-red-600"
                                  : "bg-[#fdece0] text-accent-print"
                              }`}
                            >
                              <span aria-hidden className="msym text-[12px]">
                                flag
                              </span>
                              {t("flagBadge", { count: r.openFlags })}
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-md bg-[#eef2fe] px-2.5 py-1 text-xs font-bold text-info">
                        {r.condition ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-muted">
                      {r.lastReviewAt
                        ? format.dateTime(new Date(r.lastReviewAt), {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          })
                        : t("never")}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`flex items-center gap-1.5 text-xs font-bold ${
                          r.status === "overdue"
                            ? "text-red-600"
                            : r.status === "dueSoon"
                              ? "text-gold"
                              : "text-pine-600"
                        }`}
                      >
                        <span aria-hidden className="size-2 rounded-full bg-current" />
                        {dueLabel(r)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                          TIER_STYLE[r.tier] ?? TIER_STYLE.BASIC
                        }`}
                      >
                        {r.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={{
                            pathname: "/pharmacy/logs",
                            query: { q: r.patientRef ?? r.name },
                          }}
                          className="rounded-lg border border-hairline px-3 py-2 text-xs font-bold uppercase tracking-wide text-ink-strong hover:bg-surface"
                        >
                          {t("viewLogs")}
                        </Link>
                        <Link
                          href={`/pharmacy/reviews/${r.id}`}
                          className="rounded-lg bg-brand px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-pine"
                        >
                          {t("startReview")}
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
          {t("showing", { count: d?.rows.length ?? 0, total: d?.stats.total ?? 0 })}
        </p>
      </section>
    </>
  );
}

function Stat({
  icon,
  tint,
  value,
  label,
  href,
}: Readonly<{
  icon: string;
  tint: string;
  value: number;
  label: string;
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
        <p className="text-sm text-muted">{label}</p>
      </div>
    </Link>
  );
}

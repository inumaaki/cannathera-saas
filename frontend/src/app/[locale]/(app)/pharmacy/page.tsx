import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { apiServer } from "@/lib/api-server";
import { ProgressRing } from "@/components/patient/charts";

type Row = {
  id: string;
  name: string;
  patientRef: string | null;
  condition: string | null;
  tier: string;
  lastReviewAt: string | null;
  diffDays: number;
  status: "overdue" | "dueSoon" | "onTrack";
};

type Overview = {
  pharmacyName: string;
  dueThisMonth: number;
  criticalPending: number;
  completedThisMonth: number;
  tier: string;
  planUsage: { used: number; cap: number | null };
  retention: number;
  avgAdherence: number;
  adherenceBuckets: { onTrack: number; supportNeeded: number; critical: number };
  reviewsDueSoon: Row[];
  stockAlert: { id: string; name: string; stockLevel: number; unit: string } | null;
};

/* Figma 6.1 — Pharmacy Dashboard. */
export default async function PharmacyDashboard({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, format, d] = await Promise.all([
    getTranslations("pharmacy.dashboard"),
    getFormatter(),
    apiServer<Overview>("/pharmacy/overview"),
  ]);

  const cycle = d?.planUsage.cap
    ? Math.min(100, Math.round((d.planUsage.used / d.planUsage.cap) * 100))
    : Math.min(100, d?.avgAdherence ?? 0);

  const dueLabel = (r: Row) =>
    r.diffDays < 0
      ? t("overdueDays", { days: Math.abs(r.diffDays) })
      : r.diffDays === 0
        ? t("today")
        : t("inDays", { days: r.diffDays });

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-pine">{t("title")}</h1>
          <p className="mt-1 text-muted">
            {t("subtitle", { name: d?.pharmacyName ?? "" })}
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-hairline bg-white px-5 py-3">
          <ProgressRing pct={cycle} size={48} stroke={5} color="#066c41">
            <span className="text-[10px] font-bold text-pine">{cycle}%</span>
          </ProgressRing>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-sage-900">
              {t("cycleProgress")}
            </p>
            <p className="font-display text-lg font-bold text-ink-strong">
              {t("completion")}
            </p>
          </div>
        </div>
      </div>

      {/* Every card is a shortcut into the page that owns that number. */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="pending_actions"
          tint="bg-[#eef2fe] text-info"
          badge={t("monthlyQuota")}
          value={String(d?.dueThisMonth ?? 0)}
          label={t("dueThisMonth")}
          href={{ pathname: "/pharmacy/reviews", query: { filter: "overdue" } }}
          foot={
            (d?.criticalPending ?? 0) > 0
              ? {
                  text: t("criticalPending", { count: d!.criticalPending }),
                  tone: "text-accent-print",
                  icon: "priority_high",
                }
              : undefined
          }
        />
        <StatCard
          icon="check_circle"
          tint="bg-mint/30 text-pine-600"
          badge={t("realtime")}
          value={String(d?.completedThisMonth ?? 0)}
          label={t("completed")}
          href={{ pathname: "/pharmacy/reviews", query: { filter: "onTrack" } }}
          foot={{ text: t("thisMonth"), tone: "text-pine-600", icon: "trending_up" }}
        />
        <StatCard
          icon="cloud_done"
          tint="bg-[#fdece0] text-accent-print"
          badge={t("tier", { tier: d?.tier ?? "—" })}
          value={String(d?.planUsage.used ?? 0)}
          suffix={d?.planUsage.cap ? t("cap", { cap: d.planUsage.cap }) : t("unlimited")}
          label={t("planUsage")}
          href={{ pathname: "/pharmacy/analytics", query: { tab: "billing" } }}
          progress={
            d?.planUsage.cap
              ? Math.min(100, ((d.planUsage.used ?? 0) / d.planUsage.cap) * 100)
              : undefined
          }
        />
        <StatCard
          icon="favorite"
          tint="bg-red-50 text-red-600"
          badge={t("quarterly")}
          value={`${d?.retention ?? 0}%`}
          label={t("retention")}
          href="/pharmacy/analytics"
          foot={
            (d?.retention ?? 0) >= 80
              ? { text: t("aboveBenchmark"), tone: "text-info", icon: "info" }
              : { text: t("belowBenchmark"), tone: "text-gold", icon: "trending_down" }
          }
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[7fr_4fr]">
        <section className="cw-watermark self-start overflow-hidden rounded-xl border border-hairline bg-white">
          <div className="flex items-center justify-between border-b border-hairline bg-[#eef2fe] px-6 py-4">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold text-pine">
              <span aria-hidden className="msym text-[22px] text-pine-600">
                assignment_late
              </span>
              {t("reviewsDue")}
            </h2>
            <Link
              href="/pharmacy/reviews"
              className="flex items-center gap-1 text-sm font-bold text-ink-strong hover:text-pine-600"
            >
              {t("viewAll")}
              <span aria-hidden className="msym text-[16px] rtl:-scale-x-100">
                chevron_right
              </span>
            </Link>
          </div>

          {(d?.reviewsDueSoon.length ?? 0) === 0 ? (
            <p className="px-6 py-10 text-center text-muted">{t("noneDue")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs font-bold uppercase tracking-wide text-sage-900">
                    <th className="px-6 py-3 text-start">{t("colPatient")}</th>
                    <th className="px-6 py-3 text-start">{t("colCondition")}</th>
                    <th className="px-6 py-3 text-start">{t("colLastReview")}</th>
                    <th className="px-6 py-3 text-start">{t("colDue")}</th>
                    <th className="px-6 py-3 text-end">{t("colAction")}</th>
                  </tr>
                </thead>
                <tbody>
                  {d!.reviewsDueSoon.map((r) => (
                    <tr key={r.id} className="border-t border-hairline">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-mint/40 text-xs font-bold text-pine">
                            {initials(r.name)}
                          </span>
                          <div>
                            <p className="font-bold text-ink-strong">{r.name}</p>
                            <p className="font-mono text-xs text-muted">{r.patientRef}</p>
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
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`flex items-center gap-1.5 text-xs font-bold ${
                            r.status === "overdue" ? "text-red-600" : "text-gold"
                          }`}
                        >
                          <span aria-hidden className="size-2 rounded-full bg-current" />
                          {dueLabel(r)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-end">
                        <Link
                          href={`/pharmacy/reviews/${r.id}`}
                          className={`inline-block rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wide ${
                            r.status === "overdue"
                              ? "bg-brand text-white hover:bg-pine"
                              : "border border-pine-600 text-pine-600 hover:bg-mint/20"
                          }`}
                        >
                          {r.status === "overdue" ? t("start") : t("schedule")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="space-y-6 self-start">
          <section
            className={`rounded-xl p-6 ${
              d?.stockAlert ? "bg-brand text-white" : "border border-hairline bg-white"
            }`}
          >
            <h2
              className={`font-display text-xl font-bold ${
                d?.stockAlert ? "text-white" : "text-pine"
              }`}
            >
              {t("stockAlert")}
            </h2>
            {d?.stockAlert ? (
              <>
                <p className="mt-2 text-sm leading-relaxed text-white/80">
                  {t("stockText", {
                    name: d.stockAlert.name,
                    level: d.stockAlert.stockLevel,
                    unit: d.stockAlert.unit,
                  })}
                </p>
                <Link
                  href="/pharmacy/inventory"
                  className="mt-4 block rounded-lg bg-mint-bright px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-pine hover:bg-mint"
                >
                  {t("manageInventory")}
                </Link>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">{t("noStockAlert")}</p>
            )}
          </section>

          <section className="cw-watermark rounded-xl border border-hairline bg-white p-6">
            <h2 className="font-display text-xl font-bold text-pine">{t("adherence")}</h2>
            <div className="mt-4 flex justify-center">
              <ProgressRing pct={d?.avgAdherence ?? 0} size={170} stroke={14}>
                <p className="font-display text-3xl font-bold text-pine">
                  {d?.avgAdherence ?? 0}%
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-sage-900">
                  {t("average")}
                </p>
              </ProgressRing>
            </div>
            <ul className="mt-5 space-y-1 text-sm">
              <Bucket
                color="bg-pine-600"
                label={t("onTrack")}
                value={d?.adherenceBuckets.onTrack ?? 0}
                href={{ pathname: "/pharmacy/reviews", query: { filter: "onTrack" } }}
              />
              <Bucket
                color="bg-gold"
                label={t("supportNeeded")}
                value={d?.adherenceBuckets.supportNeeded ?? 0}
                href={{ pathname: "/pharmacy/logs", query: { days: "30" } }}
              />
              <Bucket
                color="bg-red-600"
                label={t("criticalWarning")}
                value={d?.adherenceBuckets.critical ?? 0}
                href={{ pathname: "/pharmacy/logs", query: { flagged: "1" } }}
              />
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type Href = string | { pathname: string; query: Record<string, string> };

function Bucket({
  color,
  label,
  value,
  href,
}: Readonly<{ color: string; label: string; value: number; href: Href }>) {
  return (
    <li>
      <Link
        href={href}
        className="-mx-2 flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-surface"
      >
        <span className="flex items-center gap-2 text-ink-strong">
          <span aria-hidden className={`size-2.5 rounded-full ${color}`} />
          {label}
        </span>
        <span className="font-bold text-ink-strong">{value}</span>
      </Link>
    </li>
  );
}

function StatCard({
  icon,
  tint,
  badge,
  value,
  suffix,
  label,
  foot,
  progress,
  href,
}: Readonly<{
  icon: string;
  tint: string;
  badge: string;
  value: string;
  suffix?: string;
  label: string;
  foot?: { text: string; tone: string; icon: string };
  progress?: number;
  href: Href;
}>) {
  return (
    <Link
      href={href}
      className="cw-watermark block rounded-xl border border-hairline bg-white p-5 transition-colors hover:border-pine-600"
    >
      <div className="flex items-start justify-between">
        <span
          aria-hidden
          className={`msym flex size-11 items-center justify-center rounded-xl text-[22px] ${tint}`}
        >
          {icon}
        </span>
        <span className="rounded-md bg-[#eef1f8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-strong">
          {badge}
        </span>
      </div>
      <p className="mt-4 font-display text-4xl font-bold text-pine">
        {value}
        {suffix ? (
          <span className="ms-1 font-mono text-sm font-normal text-muted">{suffix}</span>
        ) : null}
      </p>
      <p className="mt-1 text-muted">{label}</p>
      {progress !== undefined ? (
        <div className="mt-3 h-1.5 rounded-full bg-[#e3e9f2]" aria-hidden>
          <div className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      {foot ? (
        <p className={`mt-3 flex items-center gap-1.5 text-sm font-semibold ${foot.tone}`}>
          <span aria-hidden className="msym text-[18px]">
            {foot.icon}
          </span>
          {foot.text}
        </p>
      ) : null}
    </Link>
  );
}

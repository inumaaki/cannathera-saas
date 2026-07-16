import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { apiServer } from "@/lib/api-server";
import { ProgressRing } from "@/components/patient/charts";
import { requirePermission } from "@/lib/permissions";
import { DownloadReportButton } from "@/components/reports/DownloadReportButton";

type Reports = {
  trend: Array<{ month: string; pain: number | null; sleep: number | null }>;
  painReduction: number | null;
  phases: { phase1: number; phase2: number; phase3: number };
  rows: Array<{
    id: string;
    patientId: string;
    patientName: string;
    patientRef: string | null;
    submittedAt: string;
    compliance: number | null;
    risk: "low" | "moderate" | "high";
  }>;
  totalLogs: number;
};

type Overview = { avgAdherence: number | null; activePatients: number };

/* Figma 5.6 — Clinical Reports. Chart pair #e66a12/#066c41 (validated).
   Range: ?days=30|90|all. */
export default async function DoctorReports({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ days?: string }>;
}>) {
  const { locale } = await params;
  const { days: rawDays } = await searchParams;
  setRequestLocale(locale);


  const denied = await requirePermission("reports:view");

  if (denied) return denied;

  const days = rawDays === "90" || rawDays === "all" ? rawDays : "30";

  const [t, format, data, overview] = await Promise.all([
    getTranslations("doctor.reports"),
    getFormatter(),
    apiServer<Reports>(`/doctor/reports?days=${days}`),
    apiServer<Overview>("/doctor/overview"),
  ]);

  const rangeLabel = { "30": t("last30"), "90": t("last90"), all: t("allTime") } as const;

  const riskStyle = {
    low: "bg-mint/40 text-pine",
    moderate: "bg-[#fdf3d7] text-gold",
    high: "bg-red-100 text-red-600",
  } as const;
  const riskLabel = { low: t("riskLow"), moderate: t("riskModerate"), high: t("riskHigh") };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-pine">{t("title")}</h1>
          <p className="mt-1 max-w-xl text-muted">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex h-11 items-center rounded-lg border border-hairline bg-white p-1 text-sm font-semibold">
            {(["30", "90", "all"] as const).map((r) => (
              <Link
                key={r}
                href={
                  r === "30"
                    ? "/doctor/reports"
                    : { pathname: "/doctor/reports", query: { days: r } }
                }
                className={`rounded-md px-3 py-1.5 ${
                  days === r ? "bg-brand text-white" : "text-muted hover:text-ink-strong"
                }`}
              >
                {rangeLabel[r]}
              </Link>
            ))}
          </div>
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/doctor/reports/export`}
            className="flex h-11 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-bold text-white hover:bg-pine"
          >
            <span aria-hidden className="msym text-[18px]">
              download
            </span>
            {t("export")}
          </a>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center justify-between rounded-xl border border-hairline bg-white p-5">
          <div>
            <p className="text-sm font-semibold text-muted">{t("avgAdherence")}</p>
            <p className="mt-1 font-mono text-3xl font-bold text-pine">
              {overview?.avgAdherence != null ? `${overview.avgAdherence}%` : "—"}
            </p>
          </div>
          <ProgressRing pct={overview?.avgAdherence ?? 0} size={56} stroke={6} color="#066c41">
            <span aria-hidden />
          </ProgressRing>
        </div>
        <div className="rounded-xl border border-hairline bg-white p-5">
          <p className="text-sm font-semibold text-muted">{t("reducedPain")}</p>
          <p className="mt-1 font-mono text-3xl font-bold text-pine">
            {data?.painReduction != null ? `${data.painReduction}%` : "—"}
          </p>
          <div className="mt-3 h-1.5 rounded-full bg-[#e3e9f2]" aria-hidden>
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${data?.painReduction ?? 0}%` }}
            />
          </div>
        </div>
        <div className="rounded-xl border border-hairline bg-white p-5">
          <p className="text-sm font-semibold text-muted">{t("attendance")}</p>
          <p className="mt-1 font-mono text-3xl font-bold text-info">
            {overview?.activePatients ?? "—"}
          </p>
          <p className="mt-2 font-mono text-sm text-muted">
            {t("activeOf", {
              active: overview?.activePatients ?? 0,
              total: overview?.activePatients ?? 0,
            })}
          </p>
        </div>
        <div className="rounded-xl border border-hairline bg-white p-5">
          <p className="text-sm font-semibold text-muted">{t("satisfaction")}</p>
          <p className="mt-1 font-mono text-3xl font-bold text-gold">
            {data?.rows.length
              ? (
                  data.rows.reduce((a, r) => a + (r.compliance ?? 0), 0) /
                  data.rows.length /
                  20
                ).toFixed(1)
              : "—"}
            <span className="text-base text-muted"> / 5.0</span>
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[8fr_4fr]">
        {/* Trends chart */}
        <section className="cw-watermark rounded-xl border border-hairline bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold text-pine">
              {t("efficacyTrends")}
            </h2>
            <div className="flex gap-4 text-sm font-semibold text-ink-strong">
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="size-2.5 rounded-full bg-[#e66a12]" />
                {t("avgPain")}
              </span>
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="size-2.5 rounded-full bg-[#066c41]" />
                {t("sleepScore")}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <TrendChart
              trend={data?.trend ?? []}
              monthLabel={(m) =>
                format.dateTime(new Date(`${m}-15`), { month: "short" })
              }
            />
          </div>
        </section>

        {/* Cohort distribution */}
        <section className="self-start rounded-xl border border-hairline bg-white p-6">
          <h2 className="font-display text-2xl font-bold text-pine">
            {t("cohortDistribution")}
          </h2>
          <div className="mt-5 space-y-5">
            <PhaseBar
              label={t("phase1")}
              count={t("patientsCount", { count: data?.phases.phase1 ?? 0 })}
              pct={pct(data?.phases.phase1, data)}
              color="#e66a12"
            />
            <PhaseBar
              label={t("phase2")}
              count={t("patientsCount", { count: data?.phases.phase2 ?? 0 })}
              pct={pct(data?.phases.phase2, data)}
              color="#5f8575"
            />
            <PhaseBar
              label={t("phase3")}
              count={t("patientsCount", { count: data?.phases.phase3 ?? 0 })}
              pct={pct(data?.phases.phase3, data)}
              color="#0b4d34"
            />
          </div>
          <div className="mt-6 rounded-xl bg-[#eef2fe] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-sage-900">
              {t("insight")}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-ink-strong">
              {t("insightText")}
            </p>
          </div>
        </section>
      </div>

      {/* Recent reports table */}
      <section className="cw-watermark mt-6 overflow-hidden rounded-xl border border-hairline bg-white">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="font-display text-2xl font-bold text-pine">
            {t("recentReports")}
          </h2>
          <Link
            href="/doctor/patients"
            className="text-sm font-bold text-pine-600 hover:underline"
          >
            {t("viewAll")}
          </Link>
        </div>
        {(data?.rows.length ?? 0) === 0 ? (
          <p className="px-6 pb-6 text-muted">{t("noData")}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#eef1f8] text-xs font-bold uppercase tracking-wide text-ink-strong">
                <th className="px-6 py-3 text-start">{t("colPeriod")}</th>
                <th className="px-6 py-3 text-start">{t("colCompliance")}</th>
                <th className="px-6 py-3 text-start">{t("colRisk")}</th>
                <th className="px-6 py-3 text-end">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {data!.rows.map((r) => (
                <tr key={r.id} className="border-t border-hairline">
                  <td className="px-6 py-4">
                    <p className="font-bold text-ink-strong">{r.patientName}</p>
                    <p className="font-mono text-xs text-muted">
                      {r.patientRef ?? "—"} ·{" "}
                      {r.submittedAt
                        ? format.dateTime(new Date(r.submittedAt), {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-md px-2.5 py-1 font-mono text-sm font-bold ${
                        (r.compliance ?? 0) >= 80
                          ? "bg-mint/40 text-pine"
                          : (r.compliance ?? 0) >= 60
                            ? "bg-[#fdf3d7] text-gold"
                            : "bg-red-100 text-red-600"
                      }`}
                    >
                      {r.compliance != null ? `${r.compliance}%` : "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${riskStyle[r.risk]}`}
                    >
                      ● {riskLabel[r.risk]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-end">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/doctor/submissions/${r.id}`}
                        className="inline-flex items-center gap-1 font-bold text-muted hover:text-ink-strong"
                      >
                        <span aria-hidden className="msym text-[18px]">
                          description
                        </span>
                        {t("colActions")}
                      </Link>
                      <DownloadReportButton patientId={r.patientId} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="border-t border-hairline bg-[#f6f8fc] px-6 py-3 text-sm text-muted">
          {t("showing", { count: data?.rows.length ?? 0 })}
        </p>
      </section>
    </>
  );
}

function pct(v: number | undefined, data: Reports | null): number {
  const total =
    (data?.phases.phase1 ?? 0) + (data?.phases.phase2 ?? 0) + (data?.phases.phase3 ?? 0);
  return total ? Math.round(((v ?? 0) / total) * 100) : 0;
}

function PhaseBar({
  label,
  count,
  pct,
  color,
}: Readonly<{ label: string; count: string; pct: number; color: string }>) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-ink-strong">{label}</span>
        <span className="font-mono font-bold text-ink-strong">{count}</span>
      </div>
      <div className="mt-2 h-2.5 rounded-full bg-[#e3e9f2]" aria-hidden>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/* Two-series monthly line chart (pain #e66a12, sleep #066c41 — palette validated). */
function TrendChart({
  trend,
  monthLabel,
}: Readonly<{
  trend: Array<{ month: string; pain: number | null; sleep: number | null }>;
  monthLabel: (m: string) => string;
}>) {
  const W = 640;
  const H = 260;
  const PAD = { top: 12, bottom: 28, left: 8, right: 8 };
  if (trend.length === 0) return <p className="text-muted">—</p>;

  const xs = (i: number) =>
    PAD.left +
    (trend.length === 1
      ? (W - PAD.left - PAD.right) / 2
      : (i * (W - PAD.left - PAD.right)) / (trend.length - 1));
  const ys = (v: number) => PAD.top + (1 - v / 10) * (H - PAD.top - PAD.bottom);
  const path = (key: "pain" | "sleep") =>
    trend
      .map((p, i) => {
        const v = p[key];
        return v == null ? "" : `${i === 0 ? "M" : "L"}${xs(i)},${ys(v)}`;
      })
      .filter(Boolean)
      .join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" className="h-auto w-full">
      {[2.5, 5, 7.5].map((v) => (
        <line
          key={v}
          x1={PAD.left}
          x2={W - PAD.right}
          y1={ys(v)}
          y2={ys(v)}
          stroke="#e5e7eb"
          strokeWidth={1}
        />
      ))}
      <path d={path("pain")} fill="none" stroke="#e66a12" strokeWidth={2.5} strokeLinejoin="round" />
      <path d={path("sleep")} fill="none" stroke="#066c41" strokeWidth={2.5} strokeLinejoin="round" />
      {trend.map((p, i) => (
        <g key={p.month}>
          {p.pain != null ? (
            <circle cx={xs(i)} cy={ys(p.pain)} r={4} fill="#e66a12" stroke="#fff" strokeWidth={2}>
              <title>{`${monthLabel(p.month)}: ${p.pain}`}</title>
            </circle>
          ) : null}
          {p.sleep != null ? (
            <circle cx={xs(i)} cy={ys(p.sleep)} r={4} fill="#066c41" stroke="#fff" strokeWidth={2}>
              <title>{`${monthLabel(p.month)}: ${p.sleep}`}</title>
            </circle>
          ) : null}
          <text
            x={xs(i)}
            y={H - 8}
            textAnchor="middle"
            fontSize={11}
            fill="#6b7280"
            style={{ textTransform: "uppercase" }}
          >
            {monthLabel(p.month)}
          </text>
        </g>
      ))}
    </svg>
  );
}

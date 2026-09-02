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
            href={`/api/doctor/reports/export`}
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
      {/* Recent reports table */}
      <section className="cw-watermark mt-6 overflow-hidden rounded-xl border border-hairline bg-white">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="font-display text-2xl font-bold text-pine">
            {t("clinicalReports")}
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

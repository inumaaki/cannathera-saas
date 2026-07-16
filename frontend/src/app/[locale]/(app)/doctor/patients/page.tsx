import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { apiServer } from "@/lib/api-server";
import { requirePermission } from "@/lib/permissions";

type Row = {
  id: string;
  name: string;
  email: string;
  patientRef: string | null;
  therapyStart: string | null;
  day: number;
  adherence: number;
  lastLogAt: string | null;
  lastPain: number | null;
  openFlags: number;
  criticalFlags: number;
};

/* Figma 5.2 — Patient Roster. ?flagged=1 = flagged only; ?q= = topbar search. */
export default async function DoctorRoster({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ flagged?: string; q?: string }>;
}>) {
  const { locale } = await params;
  const { flagged, q } = await searchParams;
  setRequestLocale(locale);


  const denied = await requirePermission("patients:view");

  if (denied) return denied;

  const [t, format, all] = await Promise.all([
    getTranslations("doctor.roster"),
    getFormatter(),
    apiServer<Row[]>("/doctor/patients"),
  ]);

  const needle = q?.toLowerCase().trim();
  const rows = (all ?? []).filter(
    (r) =>
      (flagged ? r.openFlags > 0 : true) &&
      (!needle ||
        r.name.toLowerCase().includes(needle) ||
        r.email.toLowerCase().includes(needle) ||
        (r.patientRef ?? "").toLowerCase().includes(needle)),
  );
  const avgAdherence = rows.length
    ? Math.round(rows.reduce((a, r) => a + r.adherence, 0) / rows.length)
    : 0;
  const totalFlags = (all ?? []).reduce((a, r) => a + r.openFlags, 0);
  const critical = (all ?? []).reduce((a, r) => a + r.criticalFlags, 0);
  const onTrack = (all ?? []).filter((r) => r.adherence >= 70).length;

  const badge = (adherence: number) =>
    adherence >= 85
      ? "bg-mint/40 text-pine"
      : adherence >= 60
        ? "bg-[#fdf3d7] text-gold"
        : "bg-red-100 text-red-600";

  return (
    <>
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-sage-900">
        <span aria-hidden className="msym text-[16px]">
          group
        </span>
        {t("breadcrumb")}
      </p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-pine">{t("title")}</h1>
          <p className="mt-1 text-muted">{t("subtitle", { count: all?.length ?? 0 })}</p>
        </div>
        <Link
          href="/doctor/patients/new"
          className="flex h-12 items-center gap-2 rounded-xl bg-brand px-5 font-bold text-white hover:bg-pine"
        >
          <span aria-hidden className="msym text-[20px]">
            person_add
          </span>
          {t("onboard")}
        </Link>
      </div>

      {/* Filters */}
      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-hairline bg-white px-5 py-3">
        <span className="text-xs font-bold uppercase tracking-wide text-muted">
          {t("filters")}
        </span>
        <Link
          href="/doctor/patients"
          className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold ${
            !flagged
              ? "border-pine-600 bg-mint/30 text-pine"
              : "border-hairline bg-white text-muted hover:text-ink-strong"
          }`}
        >
          <span
            aria-hidden
            className={`size-2 rounded-full ${!flagged ? "bg-pine-600" : "bg-hairline"}`}
          />
          {t("active")}
        </Link>
        <Link
          href={{ pathname: "/doctor/patients", query: { flagged: "1" } }}
          className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold ${
            flagged
              ? "border-red-400 bg-red-50 text-red-600"
              : "border-hairline bg-white text-muted hover:text-ink-strong"
          }`}
        >
          <span aria-hidden className="msym text-[16px] leading-none">
            flag
          </span>
          {t("flaggedOnly")}
        </Link>
        <span className="ms-auto" />
        <Link
          href="/doctor/patients"
          className="flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink-strong"
        >
          <span aria-hidden className="msym text-[16px]">
            filter_alt_off
          </span>
          {t("clearAll")}
        </Link>
      </div>

      {/* Table */}
      <section className="cw-watermark mt-4 overflow-x-auto rounded-xl border border-hairline bg-white">
        <table className="w-full min-w-[56rem] text-sm">
          <thead>
            <tr className="bg-[#eef1f8] text-xs font-bold uppercase tracking-wide text-ink-strong">
              <th className="px-5 py-3 text-start">{t("colPatient")}</th>
              <th className="px-5 py-3 text-start">{t("colStart")}</th>
              <th className="px-5 py-3 text-start">{t("colDay")}</th>
              <th className="px-5 py-3 text-start">{t("colAdherence")}</th>
              <th className="px-5 py-3 text-start">{t("colLastLog")}</th>
              <th className="px-5 py-3 text-start">{t("colNext")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-hairline hover:bg-surface/60">
                <td className="px-5 py-4">
                  <Link href={`/doctor/patients/${r.id}`} className="flex items-center gap-3">
                    <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-[#eef1f8] font-bold text-pine">
                      {r.name
                        .split(/\s+/)
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase() || "?"}
                      {r.openFlags > 0 ? (
                        <span
                          aria-hidden
                          className="absolute -bottom-0.5 -end-0.5 size-3.5 rounded-full border-2 border-white bg-red-500"
                        />
                      ) : null}
                    </span>
                    <span>
                      <span className="block font-bold text-ink-strong hover:text-pine-600">
                        {r.name || r.email}
                      </span>
                      <span className="block font-mono text-xs text-muted">
                        ID: {r.patientRef ?? "—"}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-5 py-4 font-mono text-ink-strong">
                  {r.therapyStart
                    ? format.dateTime(new Date(r.therapyStart), {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })
                    : "—"}
                </td>
                <td className="px-5 py-4">
                  <p className="font-mono font-semibold text-ink-strong">
                    {t("dayOf", { day: Math.min(90, r.day) })}
                  </p>
                  <div className="mt-1.5 h-1.5 w-28 rounded-full bg-[#e3e9f2]" aria-hidden>
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${Math.min(100, (r.day / 90) * 100)}%` }}
                    />
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-block rounded-full px-3 py-1.5 text-center text-xs font-bold ${badge(r.adherence)}`}
                  >
                    {r.adherence}%{" "}
                    {r.adherence >= 85 ? t("achieved") : r.adherence < 60 ? t("low") : ""}
                  </span>
                </td>
                <td className="px-5 py-4 font-mono text-muted">
                  {r.lastLogAt ? format.relativeTime(new Date(r.lastLogAt)) : t("never")}
                </td>
                <td className="px-5 py-4 font-mono text-ink-strong">
                  {r.openFlags > 0 ? (
                    <span className="flex items-center gap-1.5 text-gold">
                      <span aria-hidden className="msym text-[16px]">
                        history
                      </span>
                      {t("pendingReview")}
                    </span>
                  ) : (
                    t("noAppointment")
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t border-hairline bg-[#f6f8fc] px-5 py-3 text-sm text-muted">
          {t("showing", { from: rows.length ? 1 : 0, to: rows.length, total: all?.length ?? 0 })}
        </p>
      </section>

      {/* Summary cards */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-hairline bg-white p-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-sage-900">
            <span aria-hidden className="msym text-[18px] text-pine-600">
              trending_up
            </span>
            {t("cohortCompliance")}
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-ink-strong">
            {avgAdherence}%
          </p>
        </div>
        <div className="rounded-xl border border-hairline bg-white p-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-sage-900">
            <span aria-hidden className="msym text-[18px] text-red-600">
              report
            </span>
            {t("activeFlags")}
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-ink-strong">
            {totalFlags}
          </p>
          {critical > 0 ? (
            <p className="mt-1 text-sm font-semibold text-red-600">
              {t("requireAction", { count: critical })}
            </p>
          ) : null}
        </div>
        <div className="rounded-xl bg-brand p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-wide text-white/70">
            {t("planReach")}
          </p>
          <p className="mt-2 font-display text-3xl font-bold">
            {t("planReachPatients", { count: onTrack })}
          </p>
          <p className="mt-1 text-sm text-white/70">{t("onSchedule")}</p>
        </div>
      </div>
    </>
  );
}

import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { apiServer } from "@/lib/api-server";
import { requirePermission } from "@/lib/permissions";

type Overview = {
  activePatients: number;
  appointmentsToday: number;
  nextAppointment: { scheduledAt: string } | null;
  avgAdherence: number | null;
  appointments: Array<{
    id: string;
    patientId: string;
    patientName: string;
    scheduledAt: string;
    video: boolean;
  }>;
  recentPatients: Array<{
    id: string;
    name: string;
    email: string;
    patientRef: string | null;
    day: number;
    adherence: number;
    lastLogAt: string | null;
    latestMonthlyReview: { id: string; submittedAt: string | null } | null;
  }>;
};

/* Figma 5.1 — Doctor Dashboard. */
export default async function DoctorDashboard({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);


  const denied = await requirePermission("patients:view");

  if (denied) return denied;

  const [t, tr, format, data] = await Promise.all([
    getTranslations("doctor.dashboard"),
    getTranslations("doctor.roster"),
    getFormatter(),
    apiServer<Overview>("/doctor/overview"),
  ]);

  const timeOf = (iso: string) =>
    format.dateTime(new Date(iso), { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="cw-watermark rounded-xl border border-hairline bg-white p-5">
          <p className="text-sm font-semibold text-ink-strong">{t("activePatients")}</p>
          <p className="mt-2 font-display text-4xl font-bold text-pine">
            {data?.activePatients ?? "—"}
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-pine-600">
            <span aria-hidden className="msym text-[18px]">
              trending_up
            </span>
            {t("healthyExpansion")}
          </p>
        </div>
        <div className="cw-watermark rounded-xl border border-hairline bg-white p-5">
          <p className="text-sm font-semibold text-ink-strong">
            {t("appointmentsToday")}
          </p>
          <p className="mt-2 font-display text-4xl font-bold text-ink-strong">
            {data?.appointmentsToday ?? "—"}
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-gold">
            <span aria-hidden className="msym text-[18px]">
              schedule
            </span>
            {data?.nextAppointment
              ? t("next", { time: timeOf(data.nextAppointment.scheduledAt) })
              : t("noneToday")}
          </p>
        </div>
        <div className="cw-watermark rounded-xl border border-hairline bg-white p-5">
          <p className="text-sm font-semibold text-ink-strong">{t("avgAdherence")}</p>
          <p className="mt-2 font-display text-4xl font-bold text-pine">
            {data?.avgAdherence != null ? `${data.avgAdherence}%` : "—"}
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-pine-600">
            <span aria-hidden className="msym text-[18px]">
              check_circle
            </span>
            {t("aboveBenchmark")}
          </p>
        </div>
      </div>

      <section className="cw-watermark mt-6 overflow-hidden rounded-xl border border-hairline bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-pine">{tr("title")}</h2>
            <p className="mt-0.5 text-sm text-muted">
              {tr("subtitle", { count: data?.recentPatients.length ?? 0 })}
            </p>
          </div>
          <Link
            href="/doctor/patients"
            className="rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-pine"
          >
            {tr("breadcrumb")}
          </Link>
        </div>
        {(data?.recentPatients.length ?? 0) === 0 ? (
          <p className="border-t border-hairline px-6 py-8 text-center text-muted">
            {tr("showing", { from: 0, to: 0, total: 0 })}
          </p>
        ) : (
          <div className="overflow-x-auto border-t border-hairline">
            <table className="w-full min-w-[48rem] text-sm">
              <thead className="bg-[#eef1f8] text-xs font-bold uppercase tracking-wide text-ink-strong">
                <tr>
                  <th className="px-6 py-3 text-start">{tr("colPatient")}</th>
                  <th className="px-6 py-3 text-start">{tr("colDay")}</th>
                  <th className="px-6 py-3 text-start">{tr("colAdherence")}</th>
                  <th className="px-6 py-3 text-start">{tr("colLastLog")}</th>
                  <th className="px-6 py-3 text-end">{t("action")}</th>
                </tr>
              </thead>
              <tbody>
                {data!.recentPatients.map((patient) => (
                  <tr key={patient.id} className="border-t border-hairline">
                    <td className="px-6 py-4">
                      <Link
                        href={`/doctor/patients/${patient.id}`}
                        className="font-bold text-ink-strong hover:text-pine-600"
                      >
                        {patient.name || patient.email}
                      </Link>
                      <p className="font-mono text-xs text-muted">
                        ID: {patient.patientRef ?? "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-ink-strong">
                      {tr("dayOf", { day: Math.min(90, patient.day) })}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-pine-600">
                      {patient.adherence}%
                    </td>
                    <td className="px-6 py-4 text-muted">
                      {patient.lastLogAt
                        ? format.relativeTime(new Date(patient.lastLogAt))
                        : tr("never")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {patient.latestMonthlyReview ? (
                          <Link
                            href={`/doctor/submissions/${patient.latestMonthlyReview.id}`}
                            className="rounded-lg border border-pine-600 px-3 py-2 text-xs font-bold text-pine-600 hover:bg-mint/20"
                          >
                            {t("reviewData")}
                          </Link>
                        ) : null}
                        <Link
                          href={`/doctor/patients/${patient.id}/briefing`}
                          className="rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white hover:bg-pine"
                        >
                          {t("openBriefing")}
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="mt-6">
        {/* Today's appointments */}
        <section className="cw-watermark self-start overflow-hidden rounded-xl border border-hairline bg-white">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="font-display text-2xl font-bold text-pine">
              {t("todaysAppointments")}
            </h2>
            <span className="flex items-center gap-2 text-sm text-muted">
              <span aria-hidden className="size-2 rounded-full bg-pine-600" />
              {t("liveSchedule")}
            </span>
          </div>
          {(data?.appointments.length ?? 0) === 0 ? (
            <p className="px-6 pb-6 text-muted">{t("noAppointments")}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#eef1f8] text-xs font-bold uppercase tracking-wide text-ink-strong">
                  <th className="px-6 py-3 text-start">{t("time")}</th>
                  <th className="px-6 py-3 text-start">{t("patientName")}</th>
                  <th className="px-6 py-3 text-start">{t("format")}</th>
                  <th className="px-6 py-3 text-end">{t("action")}</th>
                </tr>
              </thead>
              <tbody>
                {data!.appointments.map((a) => (
                  <tr key={a.id} className="border-t border-hairline">
                    <td className="px-6 py-4 font-mono font-semibold text-ink-strong">
                      {timeOf(a.scheduledAt)}
                    </td>
                    <td className="px-6 py-4 text-base font-bold text-ink-strong">
                      {a.patientName}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`flex items-center gap-1.5 text-xs font-bold uppercase ${
                          a.video ? "text-info" : "text-pine-600"
                        }`}
                      >
                        <span aria-hidden className="msym text-[16px]">
                          {a.video ? "videocam" : "person"}
                        </span>
                        {a.video ? t("videoConsult") : t("inPerson")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-end">
                      <Link
                        href={`/doctor/patients/${a.patientId}/briefing`}
                        className="inline-block rounded-lg bg-brand px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-pine"
                      >
                        {t("openBriefing")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

      </div>
    </>
  );
}

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
};

/* Figma 5.1 — Doctor Dashboard. */
export default async function DoctorDashboard({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);


  const denied = await requirePermission("patients:view");

  if (denied) return denied;

  const [t, format, data] = await Promise.all([
    getTranslations("doctor.dashboard"),
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

import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { apiServer } from "@/lib/api-server";
import { AppointmentActions } from "./AppointmentActions";

type Session = {
  id: string;
  provider: string;
  joinUrl: string | null;
  scheduledAt: string;
  durationMin: number;
};

/* Consultations screen (Figma 6-864). */
export default async function PatientAppointments({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, format, data] = await Promise.all([
    getTranslations("patient.appointments"),
    getFormatter(),
    apiServer<{ upcoming: Session[]; past: Session[] }>("/patient/appointments"),
  ]);

  const [next, ...later] = data?.upcoming ?? [];
  const isToday =
    next && new Date(next.scheduledAt).toDateString() === new Date().toDateString();
  const minutesTo = next
    ? Math.max(0, Math.round((new Date(next.scheduledAt).getTime() - Date.now()) / 60000))
    : 0;
  const timeOf = (s: Session) =>
    format.dateTime(new Date(s.scheduledAt), { hour: "2-digit", minute: "2-digit" });
  const dateOf = (s: Session) =>
    format.dateTime(new Date(s.scheduledAt), { weekday: "long", month: "short", day: "numeric" });

  return (
    <>
      <h1 className="font-display text-3xl font-bold text-pine">{t("title")}</h1>
      <p className="mt-1 text-muted">{t("subtitle")}</p>

      {!next ? (
        <p className="mt-8 text-center text-muted">{t("noUpcoming")}</p>
      ) : (
        <section className="cw-watermark mt-5 rounded-2xl border border-hairline bg-white p-5">
          <div className="flex items-start justify-between">
            <span className="flex size-16 items-center justify-center rounded-xl bg-mint/30 text-[30px] text-pine-600">
              <span aria-hidden className="msym">stethoscope</span>
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-[#9ef5be] px-3 py-1 text-xs font-bold text-pine">
              <span aria-hidden className="size-2 rounded-full bg-pine-600" />
              {t("readyToJoin")}
            </span>
          </div>
          <h2 className="mt-4 font-display text-3xl font-bold text-ink-strong">
            {t("videoConsultation")}
          </h2>
          <p className="mt-2 flex items-center gap-1.5 text-muted">
            <span aria-hidden className="msym text-[16px]">
              calendar_today
            </span>
            {isToday
              ? `${t("todayAt", { time: timeOf(next) })} ${t("inMinutes", { minutes: minutesTo })}`
              : t("onDate", { date: dateOf(next), time: timeOf(next) })}
          </p>
          <AppointmentActions sessionId={next.id} joinUrl={next.joinUrl} />
        </section>
      )}

      {later.map((s) => (
        <section key={s.id} className="mt-4 rounded-2xl border border-hairline bg-white p-5">
          <div className="flex items-start justify-between">
            <span className="flex size-11 items-center justify-center rounded-xl bg-[#eef2fe] text-[22px] text-info">
              <span aria-hidden className="msym">medication</span>
            </span>
            <span className="text-sm font-semibold text-muted">{t("confirmed")}</span>
          </div>
          <h3 className="mt-3 text-lg font-bold text-ink-strong">{t("review")}</h3>
          <p className="mt-1 font-mono text-pine">
            {dateOf(s)}
            <br />
            {timeOf(s)}
          </p>
          <div className="border-t border-hairline pt-1">
            <AppointmentActions sessionId={s.id} joinUrl={s.joinUrl} />
          </div>
        </section>
      ))}

      {/* Recent history */}
      {(data?.past.length ?? 0) > 0 ? (
        <section className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-white">
          <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
            <h3 className="font-semibold text-ink-strong">{t("recentHistory")}</h3>
            <Link href="/patient/reports" className="text-sm font-semibold text-info hover:underline">
              {t("toForms")}
            </Link>
          </div>
          {data!.past.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between border-b border-hairline px-5 py-4 last:border-0"
            >
              <div className="flex items-center gap-3">
                <span aria-hidden className="msym text-[20px] text-pine-600">
                  check_circle
                </span>
                <div>
                  <p className="font-bold text-ink-strong">{t("pastConsultation")}</p>
                  <p className="text-sm text-muted">
                    {format.dateTime(new Date(s.scheduledAt), {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <Link
                href="/patient/forms"
                className="flex items-center gap-1 text-sm text-info hover:underline"
              >
                {t("viewSummary")}
                <span aria-hidden className="msym text-[16px]">
                  open_in_new
                </span>
              </Link>
            </div>
          ))}
        </section>
      ) : null}
    </>
  );
}

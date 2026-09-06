import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { apiServer } from "@/lib/api-server";
import { getSessionUser } from "@/lib/session";
import { ProgressRing } from "@/components/patient/charts";
import { HomeLogButton } from "./HomeLogButton";
import { SafeguardModal } from "@/components/patient/SafeguardModal";

type Summary = {
  firstName: string | null;
  day: number;
  planDays: number;
  adherence: number;
  todayLogged: boolean;
  stats: Array<{ key: "pain" | "sleep" | "activity" | "qol"; value: number | null; delta: number | null }>;
  nextAppointment: { scheduledAt: string; joinUrl: string | null } | null;
  onboardingCompleted?: boolean;
  hasActiveSubscription: boolean;
  safeguardAcknowledged?: boolean;
  packageTier?: string;
};

type Plan = {
  phases: Array<{ key: string; day: number; status: string }>;
};

const STAT_META = {
  pain: { icon: "favorite", color: "#dc2626", betterWhenDown: true },
  sleep: { icon: "bedtime", color: "#2563eb", betterWhenDown: false },
  activity: { icon: "directions_run", color: "#066c41", betterWhenDown: false },
  qol: { icon: "sentiment_satisfied", color: "#ca8a04", betterWhenDown: false },
} as const;

/* Patient home (Figma 6-385). */
export default async function PatientHome({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tp, format, user, summary, plan] = await Promise.all([
    getTranslations("patient.home"),
    getTranslations("patient.plan.phases"),
    getFormatter(),
    getSessionUser(),
    apiServer<Summary>("/patient/summary"),
    apiServer<Plan>("/patient/plan"),
  ]);

  const name = summary?.firstName ?? user?.firstName ?? "";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const nextPhase = plan?.phases.find((p) => p.status !== "achieved" && p.status !== "inProgress");
  const appt = summary?.nextAppointment;

  return (
    <>
      {!summary?.safeguardAcknowledged && summary?.packageTier !== "ENTERPRISE" ? (
        <SafeguardModal />
      ) : null}
      
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sage-900">
        {t("welcomeBack")}
      </p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink-strong">
        {t(greeting, { name })}
      </h1>

      {/* Progress ring card */}
      <section className="cw-watermark mt-4 rounded-2xl border border-hairline bg-white p-6">
        <div className="flex justify-center">
          <ProgressRing pct={((summary?.day ?? 0) / (summary?.planDays ?? 90)) * 100}>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-sage-900">
              {t("currentProgress")}
            </p>
            <p className="font-display text-4xl font-bold text-pine">
              {t("day", { day: summary?.day ?? 0 })}
            </p>
            <p className="text-sm text-muted">{t("ofDays", { total: summary?.planDays ?? 90 })}</p>
          </ProgressRing>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[#eef2fe] p-4">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-sage-900">
              <span aria-hidden className="msym text-[18px] text-info">
                event_note
              </span>
              {t("nextMilestone")}
            </p>
            <p className="mt-1 font-bold text-ink-strong">
              {nextPhase ? tp(`${nextPhase.key}.title`) : "—"}
            </p>
          </div>
          <div className="rounded-xl bg-[#eef2fe] p-4">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-sage-900">
              <span aria-hidden className="msym text-[18px] text-gold">
                lab_profile
              </span>
              {t("adherence")}
            </p>
            <p className="mt-1 font-bold text-pine-600">
              {summary?.adherence ?? 0}%{" "}
              {summary && summary.adherence >= 95 ? t("adherencePerfect") : ""}
            </p>
            <p className="mt-2 text-[10px] leading-tight text-sage-900/70">
              {t("adherenceInfo")}
            </p>
          </div>
        </div>
      </section>

      {/* Daily log card */}
      <section className="mt-4 rounded-2xl border border-hairline bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-strong">
            {summary?.todayLogged ? t("dailyLogDone") : t("dailyLogDue")}
          </h2>
          <span aria-hidden className="msym text-[22px] text-accent">
            {summary?.todayLogged ? "check_circle" : "timer"}
          </span>
        </div>
        <p className="mt-1 text-muted">
          {summary?.todayLogged ? t("recordedToday") : t("recordSession")}
        </p>
        {!summary?.todayLogged ? <HomeLogButton label={t("logDose")} /> : null}
      </section>

      {/* Pharmacy Inventory & Strain Feedback Quick Access Tiles */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/patient/inventory"
          className="group rounded-2xl border border-hairline bg-white p-5 shadow-sm hover:border-pine-600 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-xl bg-pine-50 text-pine-600 group-hover:bg-pine-600 group-hover:text-white transition-colors">
                <span aria-hidden className="msym text-[22px]">storefront</span>
              </span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                Live-Preise
              </span>
            </div>
            <h3 className="mt-3 font-display font-bold text-ink-strong text-base group-hover:text-pine-600 transition-colors">
              {t("inventoryTileTitle")}
            </h3>
            <p className="mt-1 text-xs text-muted line-clamp-2">
              {t("inventoryTileDesc")}
            </p>
          </div>
          <span className="mt-4 flex items-center gap-1 text-xs font-bold text-pine-600 group-hover:translate-x-1 transition-transform">
            {t("viewInventory")} →
          </span>
        </Link>

        <Link
          href="/patient/feedback"
          className="group rounded-2xl border border-hairline bg-white p-5 shadow-sm hover:border-pine-600 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <span aria-hidden className="msym text-[22px]">rate_review</span>
              </span>
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                Monats-Review
              </span>
            </div>
            <h3 className="mt-3 font-display font-bold text-ink-strong text-base group-hover:text-pine-600 transition-colors">
              {t("feedbackTileTitle")}
            </h3>
            <p className="mt-1 text-xs text-muted line-clamp-2">
              {t("feedbackTileDesc")}
            </p>
          </div>
          <span className="mt-4 flex items-center gap-1 text-xs font-bold text-amber-700 group-hover:translate-x-1 transition-transform">
            {t("giveFeedback")} →
          </span>
        </Link>
      </div>

      {/* Next appointment */}
      {appt ? (
        <section className="cw-watermark mt-4 rounded-2xl border border-hairline bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-sage-900">
            {t("nextAppointment")}
          </p>
          <div className="mt-3 flex items-center gap-4">
            <div className="rounded-xl bg-[#eef2fe] px-3 py-2 text-center">
              <p className="text-[10px] font-bold uppercase text-info">
                {format.dateTime(new Date(appt.scheduledAt), { month: "short" })}
              </p>
              <p className="font-display text-2xl font-bold text-ink-strong">
                {format.dateTime(new Date(appt.scheduledAt), { day: "numeric" })}
              </p>
            </div>
            <div>
              <p className="font-bold text-ink-strong">{t("checkIn")}</p>
              <Link
                href="/patient/appointments"
                className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-info hover:underline"
              >
                <span aria-hidden className="msym text-[16px]">
                  videocam
                </span>
                {t("telehealth")}
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* Stat tiles */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {(summary?.stats ?? []).map(({ key, value, delta }) => {
          const meta = STAT_META[key];
          const improving =
            delta !== null && delta !== 0 && (meta.betterWhenDown ? delta < 0 : delta > 0);
          return (
            <div key={key} className="rounded-2xl border border-hairline bg-white p-4">
              <div className="flex items-center justify-between">
                <span aria-hidden className="msym text-[20px]" style={{ color: meta.color }}>
                  {meta.icon}
                </span>
                <span
                  className={`text-xs font-bold ${
                    delta === null || delta === 0
                      ? "text-gold"
                      : improving
                        ? "text-pine-600"
                        : "text-accent-print"
                  }`}
                >
                  {delta === null || delta === 0
                    ? t("stable")
                    : `${delta > 0 ? "+" : ""}${delta}`}
                </span>
              </div>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.1em] text-sage-900">
                {t(`stats.${key}`)}
              </p>
              <p className="font-display text-2xl font-bold text-ink-strong">
                {value ?? "—"}
                <span className="ms-1 text-xs font-normal text-muted">
                  {t(`units.${key}`)}
                </span>
              </p>
            </div>
          );
        })}
      </div>
    </>
  );
}

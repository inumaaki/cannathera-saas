import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { apiServer } from "@/lib/api-server";
import { ProgressRing, Sparkline } from "@/components/patient/charts";
import { RescheduleButton } from "./RescheduleButton";
import { requirePermission } from "@/lib/permissions";

type Detail = {
  id: string;
  name: string;
  email: string;
  patientRef: string | null;
  dateOfBirth: string | null;
  therapyStart: string | null;
  logs: Array<{
    loggedAt: string;
    metrics: { pain?: number; sleep?: number; activity?: number; qol?: number } | null;
  }>;
  redFlags: Array<{ severity: string; message: string }>;
  appointments: Array<{ id: string; scheduledAt: string; joinUrl: string | null }>;
};

/* Figma 5.4 — Pre-Appointment Briefing. */
export default async function BriefingPage({
  params,
}: Readonly<{ params: Promise<{ locale: string; id: string }> }>) {
  const { locale, id } = await params;
  setRequestLocale(locale);


  const denied = await requirePermission("patients:view");

  if (denied) return denied;

  const [t, p] = await Promise.all([
    getTranslations("doctor.briefing"),
    apiServer<Detail>(`/doctor/patients/${encodeURIComponent(id)}`),
  ]);
  if (!p) notFound();

  const day = p.therapyStart
    ? Math.max(
        1,
        Math.floor((Date.now() - new Date(p.therapyStart).getTime()) / 86_400_000) + 1,
      )
    : 0;
  const progress = Math.min(100, Math.round((day / 90) * 100));
  const age = p.dateOfBirth
    ? Math.floor((Date.now() - new Date(p.dateOfBirth).getTime()) / 31_557_600_000)
    : null;
  const recent = p.logs.slice(-5);
  const last = p.logs.at(-1)?.metrics ?? {};
  const satisfaction = last.qol != null ? Math.round(last.qol * 10) / 10 : null;
  const nextCall = p.appointments.find((a) => new Date(a.scheduledAt) > new Date());
  const warning = p.redFlags[0];

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/doctor/patients/${p.id}`}
        className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink-strong"
      >
        <span aria-hidden className="msym text-[18px] rtl:-scale-x-100">
          arrow_back
        </span>
        {t("back")}
      </Link>
      <section className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-sm">
        {/* Snapshot header */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#eef2fe] px-6 py-4">
          <div className="flex items-center gap-4">
            <span className="flex size-16 items-center justify-center rounded-xl bg-white font-display text-2xl font-bold text-pine">
              {p.name
                .split(/\s+/)
                .map((x) => x[0])
                .slice(0, 2)
                .join("")
                .toUpperCase() || "?"}
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-sage-900">
                {t("title")}
              </p>
              <h1 className="font-display text-3xl font-bold text-pine">
                {p.name || p.email}
                {age ? `, ${age}` : ""}
              </h1>
              {warning ? (
                <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-ink-strong">
                  <span aria-hidden className="size-2 rounded-full bg-accent" />
                  {t("mainConcern", { concern: warning.message.split("—")[0] })}
                </p>
              ) : null}
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-sage-900">
              {t("progress")}
            </p>
            <div className="mt-1">
              <ProgressRing pct={progress} size={72} stroke={7}>
                <span className="text-sm font-bold text-pine">{progress}%</span>
              </ProgressRing>
            </div>
          </div>
        </div>

        {/* Metric grid */}
        <div className="grid gap-3 p-5 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <BriefMetric label={t("painIndex")}>
                <Sparkline
                  values={recent.map((l) => l.metrics?.pain ?? 0)}
                  color="#066c41"
                  width={180}
                  height={44}
                />
              </BriefMetric>
              <BriefMetric label={t("sleepQuality")}>
                <Sparkline
                  values={recent.map((l) => l.metrics?.sleep ?? 0)}
                  color="#2563eb"
                  width={180}
                  height={44}
                />
              </BriefMetric>
              <BriefMetric label={t("activityLabel")}>
                <Sparkline
                  values={recent.map((l) => l.metrics?.activity ?? 0)}
                  color="#ca8a04"
                  width={180}
                  height={44}
                />
              </BriefMetric>
              <BriefMetric label={t("qolScore")}>
                <Sparkline
                  values={recent.map((l) => l.metrics?.qol ?? 0)}
                  color="#066c41"
                  width={180}
                  height={44}
                />
              </BriefMetric>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl bg-brand p-5 text-center text-white">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/70">
              {t("satisfaction")}
            </p>
            <p className="mt-2 font-display text-4xl font-bold">
              {satisfaction ?? "—"}
              <span className="text-lg font-normal text-white/60">/10</span>
            </p>
            <p className="mt-3 text-sm text-white/75">{t("satisfactionNote")}</p>
          </div>
        </div>

        {/* Side effects + questions */}
        <div className="grid gap-3 px-5 pb-5 md:grid-cols-2">
          <div className="rounded-xl border border-hairline p-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-sage-900">
              <span aria-hidden className="msym text-[18px] text-accent">
                warning
              </span>
              {t("sideEffects")}
            </p>
            {warning ? (
              <>
                <blockquote className="mt-3 rounded-lg border-s-4 border-accent bg-[#eef2fe] px-4 py-3 italic text-ink-strong">
                  {warning.message}
                </blockquote>
                <p className="mt-3 text-sm text-muted">{t("clinicalNote")}</p>
              </>
            ) : (
              <p className="mt-3 text-muted">{t("noSideEffects")}</p>
            )}
          </div>
          <div className="rounded-xl border border-hairline p-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-sage-900">
              <span aria-hidden className="msym text-[18px] text-info">
                chat_bubble
              </span>
              {t("patientQuestions")}
            </p>
            <p className="mt-3 text-muted">{t("noQuestions")}</p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-5 py-3">
          <Link
            href={`/doctor/patients/${p.id}`}
            className="flex items-center gap-2 font-bold text-pine-600 hover:underline"
          >
            <span aria-hidden className="msym text-[18px]">
              description
            </span>
            {t("viewHistory")}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <RescheduleButton sessionId={nextCall?.id ?? null} />
            {nextCall?.joinUrl ? (
              <a
                href={nextCall.joinUrl}
                target="_blank"
                rel="noreferrer"
                className="flex h-12 items-center gap-2 rounded-xl bg-brand px-5 font-bold text-white hover:bg-pine"
              >
                <span aria-hidden className="msym text-[20px]">
                  videocam
                </span>
                {t("startCall")}
              </a>
            ) : (
              <span
                title={t("noCallUrl")}
                className="flex h-12 cursor-not-allowed items-center gap-2 rounded-xl bg-brand/40 px-5 font-bold text-white"
              >
                <span aria-hidden className="msym text-[20px]">
                  videocam
                </span>
                {t("startCall")}
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function BriefMetric({
  label,
  children,
}: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="rounded-xl border border-hairline p-4">
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-sage-900">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { apiServer } from "@/lib/api-server";
import { ProgressRing, Sparkline } from "@/components/patient/charts";
import { AddNoteForm } from "./AddNoteForm";
import { ReportButtons } from "@/components/reports/ReportButtons";
import { requirePermission } from "@/lib/permissions";

type Detail = {
  id: string;
  name: string;
  email: string;
  patientRef: string | null;
  dateOfBirth: string | null;
  therapyStart: string | null;
  pharmacy: {
    name: string;
    tier: string;
    lastReviewAt: string | null;
    nextReviewAt: string;
  } | null;
  notes: Array<{ id: string; text: string; createdAt: string; author: string }>;
  logs: Array<{
    loggedAt: string;
    dosageG: number | null;
    strain: string | null;
    metrics: { pain?: number; sleep?: number; activity?: number; qol?: number } | null;
  }>;
  redFlags: Array<{ id: string; severity: string; message: string; createdAt: string }>;
  submissions: Array<{
    id: string;
    submittedAt: string;
    questionnaire: string;
    flags: number;
  }>;
  appointments: Array<{ id: string; scheduledAt: string; joinUrl: string | null }>;
};

/* Figma 5.3 — Patient Detail (timeline + metrics snapshot). */
export default async function DoctorPatientDetail({
  params,
}: Readonly<{ params: Promise<{ locale: string; id: string }> }>) {
  const { locale, id } = await params;
  setRequestLocale(locale);


  const denied = await requirePermission("patients:view");

  if (denied) return denied;

  const [t, tr, format, p] = await Promise.all([
    getTranslations("doctor.patient"),
    getTranslations("doctor.reportsPdf"),
    getFormatter(),
    apiServer<Detail>(`/doctor/patients/${encodeURIComponent(id)}`),
  ]);
  if (!p) notFound();

  const last = p.logs.at(-1);
  const start = p.therapyStart ? new Date(p.therapyStart) : null;
  const day = start
    ? Math.max(1, Math.floor((Date.now() - start.getTime()) / 86_400_000) + 1)
    : null;
  const loggedDays = new Set(p.logs.map((l) => l.loggedAt.slice(0, 10))).size;
  const adherence = day
    ? Math.min(100, Math.round((loggedDays / Math.min(day, 90)) * 100))
    : 0;
  const age = p.dateOfBirth
    ? Math.floor((Date.now() - new Date(p.dateOfBirth).getTime()) / 31_557_600_000)
    : null;

  const recent = p.logs.slice(-7);
  const series = (key: "pain" | "sleep" | "activity") =>
    recent.map((l) => l.metrics?.[key] ?? 0);

  // Timeline: merge submissions + last logs, newest first.
  const timeline = [
    ...p.submissions.map((s) => ({
      type: "submission" as const,
      at: s.submittedAt,
      data: s,
    })),
    ...p.logs.slice(-10).map((l) => ({ type: "log" as const, at: l.loggedAt, data: l })),
  ].sort((a, b) => +new Date(b.at) - +new Date(a.at));

  return (
    <>
      <Link
        href="/doctor/patients"
        className="mb-4 flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink-strong"
      >
        <span aria-hidden className="msym text-[18px] rtl:-scale-x-100">
          arrow_back
        </span>
        {t("backToRoster")}
      </Link>

      <div className="grid gap-6 xl:grid-cols-[3fr_7fr]">
        {/* Left column */}
        <div className="space-y-5">
          <section className="cw-watermark rounded-xl border border-hairline bg-white p-6 text-center">
            <span className="mx-auto flex size-24 items-center justify-center rounded-full border-2 border-pine-600 bg-[#eef1f8] font-display text-3xl font-bold text-pine">
              {p.name
                .split(/\s+/)
                .map((x) => x[0])
                .slice(0, 2)
                .join("")
                .toUpperCase() || "?"}
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold text-pine">
              {p.name || p.email}
            </h1>
            <p className="mt-1 font-mono text-sm text-muted">ID: {p.patientRef ?? "—"}</p>

            <hr className="my-5 border-hairline" />
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-sage-900">
              {t("adherence")}
            </p>
            <div className="mt-3 flex justify-center">
              <ProgressRing pct={adherence} size={140} stroke={12}>
                <p className="font-display text-3xl font-bold text-pine">{adherence}%</p>
              </ProgressRing>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-4 text-start">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-sage-900">
                  {t("ageSex")}
                </dt>
                <dd className="mt-0.5 font-bold text-ink-strong">{age ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-sage-900">
                  {t("enrollment")}
                </dt>
                <dd className="mt-0.5 font-bold text-ink-strong">
                  {day ? t("dayOf", { day: Math.min(90, day) }) : "—"}
                </dd>
              </div>
            </dl>

            {/* The pharmacy side of this patient's care (their Monatsreview cycle). */}
            {p.pharmacy ? (
              <>
                <hr className="my-5 border-hairline" />
                <div className="text-start">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-sage-900">
                    {t("pharmacy")}
                  </p>
                  <p className="mt-1 font-bold text-ink-strong">{p.pharmacy.name}</p>
                  <dl className="mt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted">{t("package")}</dt>
                      <dd className="font-bold text-ink-strong">{p.pharmacy.tier}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">{t("lastReview")}</dt>
                      <dd className="font-mono text-ink-strong">
                        {p.pharmacy.lastReviewAt
                          ? format.dateTime(new Date(p.pharmacy.lastReviewAt), {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">{t("nextReview")}</dt>
                      <dd
                        className={`font-mono font-bold ${
                          new Date(p.pharmacy.nextReviewAt) < new Date()
                            ? "text-red-600"
                            : "text-ink-strong"
                        }`}
                      >
                        {format.dateTime(new Date(p.pharmacy.nextReviewAt), {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </dd>
                    </div>
                  </dl>
                </div>
              </>
            ) : null}

            <AddNoteForm patientId={p.id} />
          </section>

          {/* PDF reports */}
          <section className="rounded-xl border border-hairline bg-white p-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-sage-900">
              {tr("generate")}
            </h2>
            <div className="mt-3">
              <ReportButtons
                patientId={p.id}
                compact
                labels={{
                  MONTHLY: tr("monthly"),
                  QUARTERLY: tr("quarterly"),
                  YEARLY: tr("yearly"),
                  LONG_TERM: tr("longTerm"),
                  generating: "…",
                }}
              />
            </div>
          </section>

          {/* Clinical notes */}
          <section className="rounded-xl border border-hairline bg-white p-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-sage-900">
              {t("notesTitle")}
            </h2>
            <div className="mt-4 space-y-4">
              {p.notes.length === 0 ? (
                <p className="text-sm text-muted">{t("noNotes")}</p>
              ) : (
                p.notes.map((n) => (
                  <div key={n.id} className="rounded-lg border-s-4 border-pine-600 bg-surface px-4 py-3">
                    <p className="whitespace-pre-line text-sm leading-relaxed text-ink-strong">
                      {n.text}
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      {t("noteBy", {
                        author: n.author,
                        date: format.dateTime(new Date(n.createdAt), {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        }),
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-hairline bg-white p-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-sage-900">
              {t("snapshot")}
            </h2>
            <div className="mt-4 space-y-4">
              <MetricBar
                label={t("painScore")}
                value={last?.metrics?.pain ?? null}
                max={10}
                invert
              />
              <MetricBar label={t("sleepHours")} value={last?.metrics?.sleep ?? null} max={10} />
              <MetricBar label={t("activity")} value={last?.metrics?.activity ?? null} max={10} />
              <MetricBar label={t("qol")} value={last?.metrics?.qol ?? null} max={10} />
            </div>
          </section>
        </div>

        {/* Right column */}
        <div>
          {/* Mini charts */}
          <div className="grid gap-4 md:grid-cols-3">
            <ChartCard title={t("painLevel")}>
              <Sparkline values={series("pain")} color="#066c41" width={200} height={48} />
            </ChartCard>
            <ChartCard title={t("sleepQuality")}>
              <Sparkline values={series("sleep")} color="#2563eb" width={200} height={48} />
            </ChartCard>
            <ChartCard title={t("activitySteps")}>
              <Sparkline values={series("activity")} color="#ca8a04" width={200} height={48} />
            </ChartCard>
          </div>

          {/* Timeline */}
          <section className="mt-5 space-y-4">
            {timeline.length === 0 ? (
              <p className="text-muted">{t("noData")}</p>
            ) : (
              timeline.map((item) =>
                item.type === "submission" ? (
                  <div
                    key={`s-${item.data.id}`}
                    className="cw-watermark rounded-xl border border-hairline bg-white p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="flex items-center gap-2 font-bold text-pine">
                        <span
                          aria-hidden
                          className="msym flex size-10 items-center justify-center rounded-lg bg-[#eef2fe] text-[20px] text-info"
                        >
                          assignment
                        </span>
                        {t("submission", { name: item.data.questionnaire })}
                      </p>
                      <span className="rounded-md bg-[#eef2fe] px-2.5 py-1 text-xs font-bold uppercase text-info">
                        {t("patientNote")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      {t("selfReported")} ·{" "}
                      {format.dateTime(new Date(item.at), {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {item.data.flags > 0 ? (
                        <span className="ms-2 font-bold text-red-600">
                          {t("flags", { count: item.data.flags })}
                        </span>
                      ) : null}
                    </p>
                    <Link
                      href={`/doctor/submissions/${item.data.id}`}
                      className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-pine-600 hover:underline"
                    >
                      {t("viewSubmission")}
                      <span aria-hidden className="msym text-[16px] rtl:-scale-x-100">
                        arrow_forward
                      </span>
                    </Link>
                  </div>
                ) : (
                  <div
                    key={`l-${item.at}`}
                    className="rounded-xl border border-hairline bg-white p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="flex items-center gap-2 font-bold text-pine">
                        <span
                          aria-hidden
                          className="msym flex size-10 items-center justify-center rounded-lg bg-mint/30 text-[20px] text-pine-600"
                        >
                          medication
                        </span>
                        {t("dosageLog", {
                          dosage: item.data.dosageG ?? "—",
                          strain: item.data.strain ?? "—",
                        })}
                      </p>
                      <span className="rounded-md bg-mint/30 px-2.5 py-1 text-xs font-bold uppercase text-pine">
                        {t("systemData")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      {t("patientLog")} ·{" "}
                      {format.dateTime(new Date(item.at), {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ),
              )
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function ChartCard({
  title,
  children,
}: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <div className="rounded-xl border border-hairline bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-sage-900">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function MetricBar({
  label,
  value,
  max,
  invert = false,
}: Readonly<{ label: string; value: number | null; max: number; invert?: boolean }>) {
  const pct = value != null ? (value / max) * 100 : 0;
  const good = invert ? pct <= 40 : pct >= 60;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-ink-strong">{label}</span>
        <span className={`font-bold ${good ? "text-pine-600" : "text-red-600"}`}>
          {value ?? "—"}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-[#e3e9f2]" aria-hidden>
        <div
          className={`h-full rounded-full ${good ? "bg-brand" : "bg-red-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

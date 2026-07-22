import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { apiServer } from "@/lib/api-server";
import { AcknowledgeButton } from "./AcknowledgeButton";
import { requirePermission } from "@/lib/permissions";

type Flag = {
  id: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  message: string;
  createdAt: string;
  acknowledged: boolean;
  patientId: string;
  patientName: string;
  patientRef: string | null;
  questionnaire: string;
};

const ICONS: Record<string, string> = {
  CRITICAL: "priority_high",
  WARNING: "trending_down",
  INFO: "info",
};

/* Figma 5.5 — Critical Red-Flags. Tabs: ?view=unreviewed|reviewed|all. */
export default async function DoctorAlerts({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ view?: string }>;
}>) {
  const { locale } = await params;
  const { view: rawView } = await searchParams;
  setRequestLocale(locale);


  const denied = await requirePermission("alerts:view");

  if (denied) return denied;

  const view =
    rawView === "reviewed" || rawView === "all" ? rawView : "unreviewed";

  const [t, format, flags] = await Promise.all([
    getTranslations("doctor.alerts"),
    getFormatter(),
    apiServer<Flag[]>(`/doctor/red-flags?view=${view}`),
  ]);

  const critical = (flags ?? []).filter((f) => f.severity === "CRITICAL").length;
  const warning = (flags ?? []).filter((f) => f.severity === "WARNING").length;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-pine">{t("title")}</h1>
          <p className="mt-1 max-w-lg text-muted">{t("subtitle")}</p>
        </div>
        <div className="flex rounded-lg border border-hairline bg-white p-1 text-sm font-bold">
          {(
            [
              ["unreviewed", t("unreviewed")],
              ["reviewed", t("reviewed")],
              ["all", t("all")],
            ] as const
          ).map(([key, label]) => (
            <Link
              key={key}
              href={
                key === "unreviewed"
                  ? "/doctor/alerts"
                  : { pathname: "/doctor/alerts", query: { view: key } }
              }
              className={`rounded-md px-4 py-1.5 uppercase ${
                view === key ? "bg-brand text-white" : "text-muted hover:text-ink-strong"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[3fr_9fr]">
        {/* Left rail */}
        <div className="space-y-4 self-start">
          <section className="rounded-xl border border-hairline bg-white p-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-sage-900">
              {t("overview")}
            </h2>
            <div className="mt-4 space-y-3">
              <p className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-bold text-red-600">
                  <span aria-hidden className="size-2.5 rounded-full bg-red-600" />
                  {t("critical")}
                </span>
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-sm font-bold text-red-600">
                  {critical}
                </span>
              </p>
              <p className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-bold text-gold">
                  <span aria-hidden className="size-2.5 rounded-full bg-gold" />
                  {t("warning")}
                </span>
                <span className="rounded-full bg-[#fdf3d7] px-2.5 py-0.5 text-sm font-bold text-gold">
                  {warning}
                </span>
              </p>
            </div>
          </section>
          <section className="rounded-xl bg-brand p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/70">
              {t("flux")}
            </p>
            <p className="mt-4 font-display text-2xl font-bold">
              {t("volatility")}{" "}
              <span className="text-accent">{critical > 0 ? t("high") : "—"}</span>
            </p>
          </section>
          <section className="rounded-xl border border-info/30 bg-[#eef2fe] p-5">
            <p className="flex items-center gap-2 font-bold text-info">
              <span aria-hidden className="msym text-[18px]">
                info
              </span>
              {t("triageTitle")}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-strong">
              {t("triageText")}
            </p>
          </section>
        </div>

        {/* Alert list */}
        <div className="space-y-4 self-start">
          {(flags ?? []).length === 0 ? (
            <p className="rounded-xl border border-hairline bg-white p-8 text-center text-muted">
              {t("empty")}
            </p>
          ) : (
            flags!.map((f) => (
              <div
                key={f.id}
                className={`flex flex-wrap items-center gap-4 rounded-xl border border-hairline bg-white p-5 border-s-4 ${
                  f.severity === "CRITICAL" ? "border-s-red-600" : "border-s-gold"
                }`}
              >
                <span
                  className={`flex size-14 shrink-0 items-center justify-center rounded-xl ${
                    f.severity === "CRITICAL"
                      ? "bg-red-100 text-red-600"
                      : "bg-[#fdf3d7] text-gold"
                  }`}
                >
                  <span aria-hidden className="msym text-[26px]">
                    {ICONS[f.severity] ?? "info"}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-bold text-ink-strong">
                      {f.patientName}
                      {f.patientRef ? (
                        <span className="ms-1 font-mono text-sm font-normal text-muted">
                          (ID: {f.patientRef})
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        f.severity === "CRITICAL"
                          ? "bg-red-100 text-red-600"
                          : "bg-[#fdf3d7] text-gold"
                      }`}
                    >
                      {f.severity === "CRITICAL" ? t("critical") : t("warning")}
                    </span>
                  </p>
                  <p className="mt-1.5 rounded-lg bg-[#eef2fe] px-3 py-2 text-sm font-semibold text-ink-strong">
                    {f.message}
                  </p>
                  <p className="mt-1.5 font-mono text-xs text-muted">
                    {f.questionnaire} ·{" "}
                    {t("reported", { time: format.relativeTime(new Date(f.createdAt)) })}
                  </p>
                </div>
                <div className="flex shrink-0 gap-3">
                  {!f.acknowledged ? (
                    <AcknowledgeButton flagId={f.id} label={t("markReviewed")} />
                  ) : null}
                  <Link
                    href={`/doctor/patients/${f.patientId}`}
                    className="flex items-center gap-1.5 rounded-lg bg-pine-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-pine"
                  >
                    {t("openPatient")}
                    <span aria-hidden className="msym text-[14px]">
                      open_in_new
                    </span>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

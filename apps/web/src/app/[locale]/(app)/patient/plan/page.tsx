import { getTranslations, setRequestLocale } from "next-intl/server";
import { apiServer } from "@/lib/api-server";
import { ProgressRing } from "@/components/patient/charts";

type Plan = {
  day: number;
  planDays: number;
  progressPct: number;
  phases: Array<{
    key: string;
    day: number;
    status: "achieved" | "inProgress" | "pending";
  }>;
};

const STATUS_STYLE = {
  achieved: "bg-mint/40 text-pine",
  inProgress: "bg-[#fdf3d7] text-gold",
  pending: "bg-surface text-muted",
} as const;

/* 90-day therapeutic plan timeline (Figma 6-984). */
export default async function PatientPlan({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, plan] = await Promise.all([
    getTranslations("patient.plan"),
    apiServer<Plan>("/patient/plan"),
  ]);

  return (
    <>
      <h1 className="font-display text-3xl font-bold text-pine">{t("title")}</h1>
      <p className="mt-2 text-muted">{t("subtitle")}</p>

      {/* Overall progress */}
      <section className="mt-5 flex items-center gap-5 rounded-2xl border border-hairline bg-white p-5">
        <ProgressRing pct={plan?.progressPct ?? 0} size={72} stroke={7}>
          <span className="text-[10px] font-bold text-pine">
            {t("day", { day: plan?.day ?? 0 })}
          </span>
        </ProgressRing>
        <div>
          <p className="text-sm text-muted">{t("overallProgress")}</p>
          <p className="font-display text-2xl font-bold text-ink-strong">
            {t("complete", { pct: plan?.progressPct ?? 0 })}
          </p>
        </div>
      </section>

      {/* Timeline */}
      <ol className="relative mt-6 space-y-4 border-s-2 border-hairline ps-5">
        {(plan?.phases ?? []).map(({ key, day, status }) => (
          <li key={key} className="relative">
            <span
              aria-hidden
              className={`absolute -start-[27px] top-6 size-4 rounded-full border-2 border-white ${
                status === "achieved"
                  ? "bg-pine-600"
                  : status === "inProgress"
                    ? "bg-accent"
                    : "bg-hairline"
              }`}
            />
            <section
              className={`cw-watermark rounded-2xl border bg-white p-5 ${
                status === "inProgress" ? "border-pine-600" : "border-hairline"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[#0c3527] px-3 py-1 text-xs font-bold text-white">
                  {t("day", { day })}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLE[status]}`}
                >
                  {t(`status.${status}`)}
                </span>
              </div>
              <h2 className="mt-3 font-display text-2xl font-bold text-ink-strong">
                {t(`phases.${key}.title`)}
              </h2>
              <p className="mt-2 leading-relaxed text-muted">
                {t(`phases.${key}.description`)}
              </p>
            </section>
          </li>
        ))}
      </ol>
    </>
  );
}

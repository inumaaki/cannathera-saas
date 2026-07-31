import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { apiServer } from "@/lib/api-server";
import { CorrelationChart, ProgressRing, Sparkline } from "@/components/patient/charts";

type Stats = {
  efficacy: number | null;
  totalDosageMg: number;
  adherence: number;
  day: number;
  planDays: number;
  series: Array<{
    date: string;
    dosageMg: number | null;
    relief: number | null;
    pain: number | null;
  }>;
};

/* Progress screen (Figma 6-725). Tabs: this period = last 7 days,
   history = full 90-day range. */
export default async function PatientProgress({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}>) {
  const { locale } = await params;
  const { tab } = await searchParams;
  setRequestLocale(locale);

  const isHistory = tab === "history";
  const days = isHistory ? 90 : 7;

  const [t, tplan, format, stats] = await Promise.all([
    getTranslations("patient.progress"),
    getTranslations("patient.plan"),
    getFormatter(),
    apiServer<Stats>(`/patient/stats?days=${days}`),
  ]);

  const series = stats?.series ?? [];
  const reliefSeries = series.map((s) => s.relief ?? 0);
  const dosageSeries = series.map((s) => s.dosageMg ?? 0);
  // 7-day view: weekday labels; history: thin out to ~6 date labels.
  const labelEvery = Math.max(1, Math.ceil(series.length / 6));
  const labels = series.map((s, i) =>
    isHistory
      ? i % labelEvery === 0
        ? format.dateTime(new Date(s.date), { day: "numeric", month: "numeric" })
        : ""
      : format.dateTime(new Date(s.date), { weekday: "short" }),
  );

  const tabClass = (active: boolean) =>
    active
      ? "border-b-2 border-pine-600 pb-2 text-sm font-bold text-pine-600"
      : "pb-2 text-sm font-semibold text-muted hover:text-ink-strong";

  return (
    <>
      <div className="flex gap-6 border-b border-hairline">
        <Link href="/patient/progress" className={tabClass(!isHistory)}>
          {t("thisPeriod")}
        </Link>
        <Link
          href={{ pathname: "/patient/progress", query: { tab: "history" } }}
          className={tabClass(isHistory)}
        >
          {t("history")}
        </Link>
      </div>

      {series.length < 2 ? (
        <p className="mt-8 text-center text-muted">{t("noData")}</p>
      ) : (
        <>
          <StatCard
            label={t("efficacy")}
            value={stats?.efficacy !== null ? `${stats?.efficacy}%` : "—"}
          >
            <Sparkline values={reliefSeries} color="#066c41" />
          </StatCard>

          <StatCard label={t("totalDosage")} value={`${stats?.totalDosageMg ?? 0}mg`}>
            <Sparkline values={dosageSeries} color="#2563eb" step />
          </StatCard>

          <StatCard label={t("adherence")} value={`${stats?.adherence ?? 0}%`}>
            <Sparkline
              values={series.map((s) => (s.pain !== null ? 10 - s.pain : 0))}
              color="#ca8a04"
            />
          </StatCard>

          {/* Cycle progress banner */}
          <section className="mt-4 flex items-center justify-between rounded-2xl bg-[#0c3527] p-5 text-white">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-mint-bright">
                {t("cycleProgress")}
              </p>
              <p className="mt-1 font-display text-3xl font-bold">
                {tplan("day", { day: stats?.day ?? 0 })}
              </p>
              <p className="text-sm text-white/70">{t("ofPlan")}</p>
            </div>
            <ProgressRing
              pct={((stats?.day ?? 0) / (stats?.planDays ?? 90)) * 100}
              size={64}
              stroke={6}
              color="#9ef5be"
              track="rgba(255,255,255,0.15)"
            >
              <span aria-hidden className="msym text-[20px] text-accent">
                navigation
              </span>
            </ProgressRing>
          </section>

          {/* Correlation chart */}
          <section className="cw-watermark mt-4 rounded-2xl border border-hairline bg-white p-5">
            <h2 className="font-display text-2xl font-bold text-pine">
              {t("correlationTitle")}
            </h2>
            <p className="mt-1 text-sm text-muted">{t("correlationSubtitle")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-mint/40 px-3 py-1 text-xs font-bold text-pine">
                <span aria-hidden className="size-2 rounded-full bg-pine-600" />
                {t("legendDosage")}
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-[#eef2fe] px-3 py-1 text-xs font-bold text-info">
                <span aria-hidden className="size-2 rounded-full bg-info" />
                {t("legendRelief")}
              </span>
            </div>
            <div className="mt-4">
              <CorrelationChart dosage={dosageSeries} relief={reliefSeries} labels={labels} />
            </div>
          </section>
        </>
      )}
    </>
  );
}

function StatCard({
  label,
  value,
  children,
}: Readonly<{ label: string; value: string; children: React.ReactNode }>) {
  return (
    <section className="mt-4 rounded-2xl border border-hairline bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-sage-900">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold text-ink-strong">{value}</p>
      <div className="mt-2">{children}</div>
    </section>
  );
}

import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { API_URL } from "@/lib/api";
import { apiServer } from "@/lib/api-server";
import { ProgressRing } from "@/components/patient/charts";

type Data = {
  retention: number;
  months: Array<{ month: string; entries: number; avgQol: number | null }>;
  totalReviews: number;
  avgRating: number | null;
  responseRate: number;
  billing: {
    tier: string;
    planName: string;
    monthlyPrice: number | null;
    reviewCap: number | null;
    reviewsThisMonth: number;
    unitPrice: number;
    projectedCost: number;
  };
};

/* Figma 6.4 Analytics + 6.5 Billing & Usage. */
export default async function PharmacyAnalytics({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}>) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);

  const tab = sp.tab === "billing" ? "billing" : "analytics";

  const [t, format, d] = await Promise.all([
    getTranslations("pharmacy.analytics"),
    getFormatter(),
    apiServer<Data>("/pharmacy/analytics"),
  ]);

  const maxEntries = Math.max(1, ...(d?.months ?? []).map((m) => m.entries));
  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "EUR" });

  // Sentiment is derived from the satisfaction answers, never assumed positive.
  const rating = d?.avgRating ?? null;
  const sentiment =
    rating == null
      ? { label: t("noRating"), tone: "text-muted" }
      : rating >= 4
        ? { label: t("positive"), tone: "text-pine-600" }
        : rating >= 3
          ? { label: t("neutral"), tone: "text-gold" }
          : { label: t("negative"), tone: "text-red-600" };

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-pine">{t("title")}</h1>
          <p className="mt-1 max-w-2xl text-muted">{t("subtitle")}</p>
        </div>
        <a
          href={`${API_URL}/pharmacy/analytics/export`}
          className="flex items-center gap-2 rounded-lg border border-pine-600 px-4 py-2.5 text-sm font-bold text-pine-600 hover:bg-mint/20"
        >
          <span aria-hidden className="msym text-[18px]">
            download
          </span>
          {t("exportCsv")}
        </a>
      </div>

      <div className="mt-6 flex gap-1 border-b border-hairline">
        <Link
          href="/pharmacy/analytics"
          className={`px-5 py-3 text-sm font-bold ${
            tab === "analytics"
              ? "border-b-2 border-pine-600 text-pine-600"
              : "text-muted hover:text-ink-strong"
          }`}
        >
          {t("tabAnalytics")}
        </Link>
        <Link
          href={{ pathname: "/pharmacy/analytics", query: { tab: "billing" } }}
          className={`px-5 py-3 text-sm font-bold ${
            tab === "billing"
              ? "border-b-2 border-pine-600 text-pine-600"
              : "text-muted hover:text-ink-strong"
          }`}
        >
          {t("tabBilling")}
        </Link>
      </div>

      {tab === "analytics" ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[7fr_5fr]">
          <section className="cw-watermark rounded-xl border border-hairline bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-pine">
                {t("monthlyEntries")}
              </h2>
              <span className="rounded-md bg-mint/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-pine-600">
                {t("retention")} {d?.retention ?? 0}%
              </span>
            </div>

            {(d?.months.length ?? 0) === 0 ? (
              <p className="py-10 text-center text-muted">—</p>
            ) : (
              /* `h-full` on the item gives the bar's percentage height something
                 definite to resolve against — without it the bars collapse to 0. */
              <ul className="mt-6 flex h-56 items-end gap-3">
                {d!.months.map((m) => (
                  <li
                    key={m.month}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span className="font-mono text-xs font-bold text-ink-strong">
                      {m.entries}
                    </span>
                    <span
                      className="w-full min-h-1 rounded-t-md bg-pine-600"
                      style={{ height: `${(m.entries / maxEntries) * 100}%` }}
                      aria-hidden
                    />
                    <span className="text-[10px] font-bold uppercase text-muted">
                      {m.month.slice(5)}/{m.month.slice(2, 4)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="space-y-6">
            <section className="cw-watermark rounded-xl border border-hairline bg-white p-6">
              <h2 className="font-display text-xl font-bold text-pine">
                {t("adherenceTitle")}
              </h2>
              <div className="mt-4 flex justify-center">
                <ProgressRing pct={d?.retention ?? 0} size={160} stroke={14}>
                  <p className="font-display text-3xl font-bold text-pine">
                    {d?.retention ?? 0}%
                  </p>
                </ProgressRing>
              </div>
              <p className="mt-4 text-center text-sm leading-relaxed text-muted">
                {t("adherenceNote")}
              </p>
            </section>

            <section className="cw-watermark rounded-xl border border-hairline bg-white p-6">
              <h2 className="font-display text-xl font-bold text-pine">
                {t("reviewVolume")}
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <Row
                  label={t("totalReviews")}
                  value={String(d?.totalReviews ?? 0)}
                  href="/pharmacy/reviews"
                />
                <Row
                  label={t("avgRating")}
                  value={d?.avgRating != null ? `${d.avgRating}/5` : "—"}
                />
                <Row
                  label={t("responseRate")}
                  value={`${d?.responseRate ?? 0}%`}
                  href="/pharmacy/logs"
                />
                <Row
                  label={t("sentiment")}
                  value={sentiment.label}
                  tone={sentiment.tone}
                />
              </dl>
            </section>
          </div>
        </div>
      ) : (
        <section className="cw-watermark mt-6 rounded-xl border border-hairline bg-white p-6">
          <h2 className="font-display text-xl font-bold text-pine">
            {t("billingTitle")}
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <BillCard
              label={t("plan")}
              value={d?.billing.planName ?? "—"}
              badge={d?.billing.tier}
            />
            <BillCard
              label={t("monthlyPrice")}
              value={
                d?.billing.monthlyPrice != null ? money(d.billing.monthlyPrice) : "—"
              }
            />
            <BillCard
              label={t("includedReviews")}
              value={
                d?.billing.reviewCap != null ? String(d.billing.reviewCap) : "∞"
              }
            />
            <BillCard
              label={t("reviewsThisMonth")}
              value={String(d?.billing.reviewsThisMonth ?? 0)}
            />
            <BillCard
              label={t("unitPrice")}
              value={d ? money(d.billing.unitPrice) : "—"}
            />
            <BillCard
              label={t("projected")}
              value={d ? money(d.billing.projectedCost) : "—"}
              highlight
            />
          </div>

          {d?.billing.reviewCap ? (
            <div className="mt-6">
              <div className="flex justify-between text-xs font-bold text-muted">
                <span>{t("reviewsThisMonth")}</span>
                <span className="font-mono">
                  {d.billing.reviewsThisMonth} / {d.billing.reviewCap}
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-[#e3e9f2]" aria-hidden>
                <div
                  className="h-full rounded-full bg-brand"
                  style={{
                    width: `${Math.min(
                      100,
                      (d.billing.reviewsThisMonth / d.billing.reviewCap) * 100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          ) : null}

          <p className="mt-6 rounded-lg border border-hairline bg-surface p-4 text-xs leading-relaxed text-muted">
            {t("tierNote")}
          </p>
        </section>
      )}
    </>
  );
}

function Row({
  label,
  value,
  tone = "text-ink-strong",
  href,
}: Readonly<{ label: string; value: string; tone?: string; href?: string }>) {
  return (
    <div className="flex items-center justify-between border-b border-hairline pb-2 last:border-0">
      <dt className="text-muted">{label}</dt>
      <dd className={`font-bold ${tone}`}>
        {href ? (
          <Link href={href} className="hover:underline">
            {value}
            <span aria-hidden className="msym ms-1 align-middle text-[16px] rtl:-scale-x-100">
              chevron_right
            </span>
          </Link>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function BillCard({
  label,
  value,
  badge,
  highlight,
}: Readonly<{
  label: string;
  value: string;
  badge?: string;
  highlight?: boolean;
}>) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        highlight ? "border-pine-600 bg-mint/15" : "border-hairline bg-surface"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wide text-sage-900">
          {label}
        </p>
        {badge ? (
          <span className="rounded-md bg-pine px-2 py-0.5 text-[10px] font-bold uppercase text-white">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-pine">{value}</p>
    </div>
  );
}

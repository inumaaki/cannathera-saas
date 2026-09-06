import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { apiServer } from "@/lib/api-server";
import { ProgressRing } from "@/components/patient/charts";

type Data = {
  totalPrescriptions: number;
  completedPrescriptions: number;
  processingTimeHours: number;
  stockAlerts: number;
  topStrains: Array<{
    name: string;
    quantity: number;
    orders?: number;
    category?: string;
    thc?: number | null;
    cbd?: number | null;
    unit?: string;
    percentage?: number;
  }>;
  billing: {
    tier: string;
    planName: string;
    monthlyPrice: number | null;
  };
};

/* Pharmacy Analytics + Billing */
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

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "EUR" });

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-pine">{t("title")}</h1>
          <p className="mt-1 max-w-2xl text-muted">{t("subtitle")}</p>
        </div>
        <a
          href={`/api/pharmacy/analytics/export`}
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
          <section className="cw-watermark rounded-xl border border-hairline bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-pine">
                  {t("topStrainsTitle")}
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  {t("topStrainsSubtitle")}
                </p>
              </div>
              <span className="self-start rounded-full bg-mint/30 px-2.5 py-1 text-[11px] font-bold text-pine-600">
                1:1 Live-Abrechnung
              </span>
            </div>

            {(d?.topStrains?.length ?? 0) === 0 ? (
              <p className="py-12 text-center text-muted">{t("noStrains")}</p>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-hairline text-[11px] uppercase tracking-wider text-sage-900">
                    <tr>
                      <th className="pb-3 font-semibold">{t("colRank")}</th>
                      <th className="pb-3 font-semibold">{t("colStrain")}</th>
                      <th className="pb-3 text-right font-semibold">{t("colDispensed")}</th>
                      <th className="pb-3 text-right font-semibold">{t("colShare")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {d?.topStrains.map((s, idx) => (
                      <tr key={s.name} className="hover:bg-surface/50 transition-colors">
                        <td className="py-3.5 align-middle">
                          <span className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                            idx === 0
                              ? "bg-amber-100 text-amber-800"
                              : idx === 1
                              ? "bg-slate-200 text-slate-700"
                              : idx === 2
                              ? "bg-amber-50 text-amber-700"
                              : "bg-surface text-muted"
                          }`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-3.5 align-middle">
                          <div className="font-bold text-ink-strong">{s.name}</div>
                          <div className="flex items-center gap-2 text-[11px] text-muted mt-0.5">
                            <span className="rounded bg-surface px-1.5 py-0.5 font-medium">
                              {s.category || "Blüten"}
                            </span>
                            {s.thc ? <span>THC: {s.thc}%</span> : null}
                            {s.orders ? <span>· {s.orders} Verordnungen</span> : null}
                          </div>
                        </td>
                        <td className="py-3.5 text-right align-middle font-mono font-bold text-pine">
                          {s.quantity} {s.unit || "g"}
                        </td>
                        <td className="py-3.5 text-right align-middle">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-xs text-ink-strong">
                            <span className="inline-block h-2 rounded-full bg-pine-600" style={{ width: `${Math.max(8, s.percentage || 15)}px` }}></span>
                            {s.percentage ?? Math.max(5, Math.round(100 / (idx + 2)))}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="space-y-6">
            <section className="cw-watermark rounded-xl border border-hairline bg-white p-6 shadow-sm">
              <h2 className="font-display text-xl font-bold text-pine">
                {t("efficiencyTitle")}
              </h2>
              <div className="mt-4 flex justify-center">
                <ProgressRing pct={100} size={160} stroke={14}>
                  <p className="font-display text-3xl font-bold text-pine">
                    {d?.processingTimeHours}h
                  </p>
                </ProgressRing>
              </div>
              <p className="mt-4 text-center text-sm leading-relaxed text-muted">
                {t("avgProcessing")}
              </p>
              
              <div className="mt-6 rounded-lg bg-pine-50 p-4 border border-pine-100">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pine-600 mb-1.5">
                  <span className="msym text-[16px]">info</span>
                  {t("efficiencyContext")}
                </p>
                <p className="text-sm text-pine-800 leading-relaxed">
                  {t("efficiencyNote")}
                </p>
              </div>
            </section>

            <section className="cw-watermark rounded-xl border border-hairline bg-white p-6 shadow-sm">
              <h2 className="font-display text-xl font-bold text-pine">
                {t("volumeTitle")}
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <Row
                  label={t("rxReceived")}
                  value={String(d?.totalPrescriptions ?? 0)}
                  href="/pharmacy/prescriptions"
                />
                <Row
                  label={t("rxCompleted")}
                  value={String(d?.completedPrescriptions ?? 0)}
                />
                <Row
                  label={t("rxAlerts")}
                  value={String(d?.stockAlerts ?? 0)}
                  tone={d?.stockAlerts && d.stockAlerts > 0 ? "text-red-600" : "text-pine-600"}
                  href="/pharmacy/inventory"
                />
              </dl>
              
              <div className="mt-6 rounded-lg bg-surface p-4 border border-hairline">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
                  <span className="msym text-[16px]">medical_services</span>
                  {t("alertsContext")}
                </p>
                <p className="text-sm text-ink leading-relaxed">
                  {t("alertsNote")}
                </p>
              </div>
            </section>
          </div>
        </div>
      ) : (
        <section className="cw-watermark mt-6 rounded-xl border border-hairline bg-white p-6 shadow-sm">
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
          </div>
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

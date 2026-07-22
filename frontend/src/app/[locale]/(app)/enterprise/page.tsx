import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { API_URL } from "@/lib/api";
import { apiServer } from "@/lib/api-server";
import { ProgressRing } from "@/components/patient/charts";

type Partner = {
  id: string;
  name: string;
  type: "PHARMACY" | "PRACTICE";
  city: string | null;
  address: string | null;
  patients: number;
  overdue: number;
  avgAdherence: number;
};

type Overview = {
  enterpriseName: string;
  partners: { total: number; pharmacies: number; practices: number };
  patients: number;
  activePatients: number;
  reviewsThisMonth: number;
  overdueReviews: number;
  openFlags: number;
  criticalFlags: number;
  avgAdherence: number;
  billing: { unitPrice: number; projectedCost: number; tierLabel: string };
  topPartners: Partner[];
};

type Audit = {
  rows: Array<{ id: string; user: string; action: string; createdAt: string }>;
  total: number;
};

/* Figma 8.1 — Enterprise Overview. */
export default async function EnterpriseOverview({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, format, d, audit] = await Promise.all([
    getTranslations("enterprise.overview"),
    getFormatter(),
    apiServer<Overview>("/enterprise/overview"),
    apiServer<Audit>("/enterprise/settings/audit?limit=5"),
  ]);

  const money = (v: number) => format.number(v, { style: "currency", currency: "EUR" });

  // Group partners by city — computed here from stored addresses. The Figma had
  // an embedded Google map; sending partner/patient locations to a third party
  // would breach the client's GDPR + German-hosting requirement, so the same
  // information is rendered locally instead.
  const byCity = new Map<string, Partner[]>();
  for (const p of d?.topPartners ?? []) {
    const key = p.city ?? "—";
    byCity.set(key, [...(byCity.get(key) ?? []), p]);
  }
  const cities = [...byCity.entries()].sort((a, b) => b[1].length - a[1].length);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-pine">{t("title")}</h1>
          <p className="mt-1 text-muted">
            {t("subtitle", { name: d?.enterpriseName ?? "" })}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href={`${API_URL}/enterprise/export`}
            className="flex items-center gap-2 rounded-lg border border-hairline bg-white px-4 py-2.5 text-sm font-bold text-ink-strong hover:bg-surface"
          >
            <span aria-hidden className="msym text-[18px]">
              download
            </span>
            {t("exportAudit")}
          </a>
          <Link
            href="/enterprise/partners"
            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-pine"
          >
            <span aria-hidden className="msym text-[18px]">
              add
            </span>
            {t("newPartner")}
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon="hub"
          tint="bg-mint/30 text-pine-600"
          value={String(d?.partners.total ?? 0)}
          label={t("connectedPartners")}
          foot={t("partnerSplit", {
            pharmacies: d?.partners.pharmacies ?? 0,
            practices: d?.partners.practices ?? 0,
          })}
          href="/enterprise/partners"
        />
        <Stat
          icon="fact_check"
          tint="bg-[#eef2fe] text-info"
          value={String(d?.reviewsThisMonth ?? 0)}
          label={t("activeReviews")}
          foot={t("overdueReviews", { count: d?.overdueReviews ?? 0 })}
          footTone={(d?.overdueReviews ?? 0) > 0 ? "text-red-600" : "text-pine-600"}
          href="/enterprise/reports"
        />
        <StatRing
          value={d?.avgAdherence ?? 0}
          label={t("portfolioHealth")}
          foot={(d?.avgAdherence ?? 0) >= 70 ? t("optimalRange") : t("belowRange")}
          good={(d?.avgAdherence ?? 0) >= 70}
          href="/enterprise/reports"
        />
        <Stat
          icon="payments"
          tint="bg-[#fdece0] text-accent-print"
          value={money(d?.billing.projectedCost ?? 0)}
          label={t("revenue")}
          foot={t("perReview", { price: money(d?.billing.unitPrice ?? 0) })}
          href="/enterprise/billing"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[7fr_5fr]">
        {/* Location distribution — GDPR-safe: no external map service. */}
        <section className="cw-watermark self-start rounded-xl border border-hairline bg-white p-6">
          <h2 className="font-display text-xl font-bold text-pine">
            {t("distribution")}
          </h2>
          <p className="mt-1 text-sm text-muted">{t("distributionNote")}</p>

          {cities.length === 0 ? (
            <p className="py-10 text-center text-muted">{t("noPartners")}</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {cities.map(([city, partners]) => {
                const patients = partners.reduce((s, p) => s + p.patients, 0);
                return (
                  <li
                    key={city}
                    className="rounded-xl border border-hairline bg-surface p-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="flex items-center gap-2 font-bold text-ink-strong">
                        <span aria-hidden className="msym text-[20px] text-pine-600">
                          location_on
                        </span>
                        {city}
                      </h3>
                      <span className="font-mono text-sm font-bold text-pine">
                        {t("patientsCount", { count: patients })}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1.5">
                      {partners.map((p) => (
                        <li key={p.id}>
                          <Link
                            href={`/enterprise/partners/${p.id}`}
                            className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-white"
                          >
                            <span className="flex items-center gap-2 text-ink-strong">
                              <span aria-hidden className="msym text-[18px] text-muted">
                                {p.type === "PHARMACY"
                                  ? "local_pharmacy"
                                  : "medical_services"}
                              </span>
                              {p.name}
                            </span>
                            <span className="font-mono text-xs text-muted">
                              {p.patients} · {p.avgAdherence}%
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="mt-4 flex items-start gap-2 rounded-lg border border-hairline bg-mint/10 p-3 text-xs leading-relaxed text-sage-900">
            <span aria-hidden className="msym text-[16px] text-pine-600">
              verified_user
            </span>
            {t("gdprMapNote")}
          </p>
        </section>

        {/* System log — straight from the audit trail. */}
        <section className="cw-watermark self-start rounded-xl border border-hairline bg-white p-6">
          <h2 className="font-display text-xl font-bold text-pine">{t("systemLog")}</h2>
          <ul className="mt-4 space-y-3">
            {(audit?.rows ?? []).map((a) => (
              <li
                key={a.id}
                className="flex gap-3 border-b border-hairline pb-3 last:border-0"
              >
                <span aria-hidden className="msym mt-0.5 text-[20px] text-pine-600">
                  {a.action.includes("LOGIN")
                    ? "login"
                    : a.action.includes("KEY")
                      ? "key"
                      : a.action.includes("INVOICE")
                        ? "receipt_long"
                        : a.action.includes("PARTNER")
                          ? "hub"
                          : "history"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs font-bold text-ink-strong">
                    {a.action}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {a.user} ·{" "}
                    {format.dateTime(new Date(a.createdAt), {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <Link
            href="/enterprise/settings"
            className="mt-4 block rounded-lg border border-pine-600 px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-pine-600 hover:bg-mint/20"
          >
            {t("fullAudit")}
          </Link>
        </section>
      </div>
    </>
  );
}

type Href = string | { pathname: string; query: Record<string, string> };

function Stat({
  icon,
  tint,
  value,
  label,
  foot,
  footTone = "text-muted",
  href,
}: Readonly<{
  icon: string;
  tint: string;
  value: string;
  label: string;
  foot: string;
  footTone?: string;
  href: Href;
}>) {
  return (
    <Link
      href={href}
      className="cw-watermark block rounded-xl border border-hairline bg-white p-5 transition-colors hover:border-pine-600"
    >
      <span className={`flex size-11 items-center justify-center rounded-xl text-[22px] ${tint}`}>
        <span aria-hidden className="msym">{icon}</span>
      </span>
      <p className="mt-4 font-display text-3xl font-bold text-pine">{value}</p>
      <p className="mt-1 text-muted">{label}</p>
      <p className={`mt-2 text-sm font-semibold ${footTone}`}>{foot}</p>
    </Link>
  );
}

function StatRing({
  value,
  label,
  foot,
  good,
  href,
}: Readonly<{
  value: number;
  label: string;
  foot: string;
  good: boolean;
  href: Href;
}>) {
  return (
    <Link
      href={href}
      className="cw-watermark flex items-center gap-4 rounded-xl border border-hairline bg-white p-5 transition-colors hover:border-pine-600"
    >
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-sage-900">
          {label}
        </p>
        <p className="mt-1 font-display text-3xl font-bold text-pine">{value}%</p>
        <span
          className={`mt-2 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
            good ? "bg-mint/40 text-pine" : "bg-[#fdece0] text-accent-print"
          }`}
        >
          {foot}
        </span>
      </div>
      <div className="ms-auto">
        <ProgressRing pct={value} size={72} stroke={7} color="#066c41" />
      </div>
    </Link>
  );
}

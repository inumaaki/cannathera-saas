import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { API_URL } from "@/lib/api";
import { apiServer } from "@/lib/api-server";
import { GenerateInvoiceButton } from "@/components/enterprise/InvoiceActions";

type Usage = {
  cycle: { label: string };
  totalVolume: number;
  volumeLimit: number;
  activeTier: string;
  unitPrice: number;
  projectedCost: number;
  tiers: Array<{
    key: string;
    label: string;
    from: number;
    to: number | null;
    unitPrice: number;
    used: number;
    capacity: number | null;
    pct: number;
    state: "maxed" | "active" | "pending";
  }>;
};

type Invoices = {
  rows: Array<{
    id: string;
    number: string;
    issuedAt: string;
    tier: string;
    reviews: number;
    unitPrice: number;
    amount: number;
    status: "PAID" | "PENDING" | "OVERDUE";
  }>;
  totals: { count: number; outstanding: number };
};

const FILTERS = [
  { key: "all", label: "filterAll" },
  { key: "paid", label: "filterPaid" },
  { key: "pending", label: "filterPending" },
  { key: "overdue", label: "filterOverdue" },
] as const;

const STATUS_STYLE: Record<string, string> = {
  PAID: "bg-mint/30 text-pine-600",
  PENDING: "bg-[#fdf6e3] text-gold",
  OVERDUE: "bg-red-50 text-red-600",
};

/* Figma 8.2 — Tiered Usage Tracking + Invoice History. */
export default async function EnterpriseBilling({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}>) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);

  const status = FILTERS.some((f) => f.key === sp.status) ? sp.status! : "all";

  const [t, format, usage, invoices] = await Promise.all([
    getTranslations("enterprise.billing"),
    getFormatter(),
    apiServer<Usage>("/enterprise/billing/usage"),
    apiServer<Invoices>(`/enterprise/billing/invoices?status=${status}`),
  ]);

  const money = (v: number) => format.number(v, { style: "currency", currency: "EUR" });

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-pine">{t("title")}</h1>
          <p className="mt-1 max-w-2xl text-muted">{t("subtitle")}</p>
        </div>
        <GenerateInvoiceButton />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[7fr_4fr]">
        {/* Tiered usage */}
        <section className="cw-watermark self-start rounded-xl border border-hairline bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-pine">
                {t("usageTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {t("usageNote", { cycle: usage?.cycle.label ?? "—" })}
              </p>
            </div>
            <div className="text-end">
              <p className="text-[10px] font-bold uppercase tracking-wide text-sage-900">
                {t("totalVolume")}
              </p>
              <p className="font-display text-3xl font-bold text-pine-600">
                {usage?.totalVolume ?? 0}
                <span className="ms-1 font-mono text-sm font-normal text-muted">
                  / {usage?.volumeLimit ?? 0}
                </span>
              </p>
            </div>
          </div>

          <ul className="mt-6 space-y-5">
            {(usage?.tiers ?? []).map((tier) => (
              <li
                key={tier.key}
                className={`rounded-xl p-4 ${
                  tier.state === "active"
                    ? "border-2 border-pine-600 bg-mint/10"
                    : "border border-hairline"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-bold text-ink-strong">
                    {tier.key}: {tier.label}
                    {tier.state === "active" ? (
                      <span className="rounded bg-pine-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        {t("active")}
                      </span>
                    ) : null}
                  </p>
                  <p className="font-mono text-xs font-bold text-muted">
                    {tier.state === "maxed"
                      ? t("maxed")
                      : tier.state === "pending"
                        ? t("pending")
                        : tier.capacity === null
                          ? t("unlimited")
                          : t("inTier", { used: tier.used, capacity: tier.capacity })}
                  </p>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-[#e3e9f2]" aria-hidden>
                  <div
                    className={`h-full rounded-full ${
                      tier.state === "pending" ? "bg-[#e3e9f2]" : "bg-pine-600"
                    }`}
                    style={{ width: `${tier.pct}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between font-mono text-[10px] text-muted">
                  <span>{tier.from}</span>
                  <span>
                    {money(tier.unitPrice)} / Review
                    {tier.to ? ` · bis ${tier.to}` : ""}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Cost summary */}
        <div className="space-y-6 self-start">
          <section className="rounded-xl bg-brand p-6 text-white">
            <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">
              {t("projected")}
            </p>
            <p className="mt-2 font-display text-4xl font-bold">
              {money(usage?.projectedCost ?? 0)}
            </p>
            <dl className="mt-5 space-y-2 border-t border-white/20 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-white/70">{t("colTier")}</dt>
                <dd className="font-bold">{usage?.activeTier ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/70">{t("unitPrice")}</dt>
                <dd className="font-mono font-bold">{money(usage?.unitPrice ?? 0)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/70">{t("reviews")}</dt>
                <dd className="font-mono font-bold">{usage?.totalVolume ?? 0}</dd>
              </div>
            </dl>
          </section>

          <section className="cw-watermark rounded-xl border border-hairline bg-white p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-pine">
              <span aria-hidden className="msym text-[20px] text-info">
                help
              </span>
              {t("questionsTitle")}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {t("questionsText")}
            </p>
            <a
              href="mailto:support@cannathera.de"
              className="mt-3 inline-block text-sm font-bold text-pine-600 hover:underline"
            >
              {t("contact")}
            </a>
          </section>

          <section className="cw-watermark rounded-xl border border-hairline bg-white p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-pine">
              <span aria-hidden className="msym text-[20px] text-pine-600">
                description
              </span>
              {t("taxTitle")}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">{t("taxText")}</p>
            <a
              href={`${API_URL}/enterprise/billing/invoices/export`}
              className="mt-3 inline-block text-sm font-bold text-pine-600 hover:underline"
            >
              {t("taxLink")}
            </a>
          </section>
        </div>
      </div>

      {/* Invoice history */}
      <section className="cw-watermark mt-6 overflow-hidden rounded-xl border border-hairline bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-6 py-4">
          <h2 className="font-display text-xl font-bold text-pine">
            {t("invoiceHistory")}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => (
              <Link
                key={f.key}
                href={
                  f.key === "all"
                    ? "/enterprise/billing"
                    : { pathname: "/enterprise/billing", query: { status: f.key } }
                }
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                  status === f.key
                    ? "bg-brand text-white"
                    : "text-muted hover:bg-surface hover:text-ink-strong"
                }`}
              >
                {t(f.label)}
              </Link>
            ))}
            <a
              href={`${API_URL}/enterprise/billing/invoices/export`}
              className="flex items-center gap-1.5 rounded-lg bg-pine-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-pine"
            >
              <span aria-hidden className="msym text-[16px]">
                download
              </span>
              {t("exportAll")}
            </a>
          </div>
        </div>

        {(invoices?.rows.length ?? 0) === 0 ? (
          <p className="px-6 py-12 text-center text-muted">{t("empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline text-xs font-bold uppercase tracking-wide text-sage-900">
                  <th className="px-6 py-3 text-start">{t("colDate")}</th>
                  <th className="px-6 py-3 text-start">{t("colInvoice")}</th>
                  <th className="px-6 py-3 text-start">{t("colTier")}</th>
                  <th className="px-6 py-3 text-start">{t("colReviews")}</th>
                  <th className="px-6 py-3 text-start">{t("colAmount")}</th>
                  <th className="px-6 py-3 text-start">{t("colStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {invoices!.rows.map((i) => (
                  <tr key={i.id} className="border-b border-hairline last:border-0">
                    <td className="px-6 py-4 font-mono text-muted">
                      {format.dateTime(new Date(i.issuedAt), {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-ink-strong">
                      {i.number}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-md bg-mint/30 px-2.5 py-1 text-xs font-bold text-pine">
                        {i.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-ink-strong">{i.reviews}</td>
                    <td className="px-6 py-4 font-mono font-bold text-ink-strong">
                      {money(i.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[i.status]}`}
                      >
                        <span aria-hidden className="size-1.5 rounded-full bg-current" />
                        {t(i.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline px-6 py-3 text-xs">
          <span className="text-muted">
            {t("showing", { count: invoices?.rows.length ?? 0 })}
          </span>
          {(invoices?.totals.outstanding ?? 0) > 0 ? (
            <span className="font-bold text-accent-print">
              {t("outstanding", { amount: money(invoices!.totals.outstanding) })}
            </span>
          ) : null}
        </div>
      </section>
    </>
  );
}

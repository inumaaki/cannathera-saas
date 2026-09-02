import { getFormatter, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { apiServer } from "@/lib/api-server";
import { ProgressRing } from "@/components/patient/charts";

type Data = {
  totalPrescriptions: number;
  completedPrescriptions: number;
  processingTimeHours: number;
  stockAlerts: number;
  topStrains: Array<{ name: string; quantity: number }>;
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

  const [format, d] = await Promise.all([
    getFormatter(),
    apiServer<Data>("/pharmacy/analytics"),
  ]);

  const money = (v: number) =>
    format.number(v, { style: "currency", currency: "EUR" });

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-pine">Apotheken-Analytik</h1>
          <p className="mt-1 max-w-2xl text-muted">Umfassende operative Auswertung von Rezeptvolumen, Durchlaufzeiten und Lagerbewegungen.</p>
        </div>
        <a
          href={`/api/pharmacy/analytics/export`}
          className="flex items-center gap-2 rounded-lg border border-pine-600 px-4 py-2.5 text-sm font-bold text-pine-600 hover:bg-mint/20"
        >
          <span aria-hidden className="msym text-[18px]">
            download
          </span>
          Export
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
          Operative Auswertung
        </Link>
        <Link
          href={{ pathname: "/pharmacy/analytics", query: { tab: "billing" } }}
          className={`px-5 py-3 text-sm font-bold ${
            tab === "billing"
              ? "border-b-2 border-pine-600 text-pine-600"
              : "text-muted hover:text-ink-strong"
          }`}
        >
          Tarif & Abrechnung
        </Link>
      </div>

      {tab === "analytics" ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[7fr_5fr]">
          <section className="cw-watermark rounded-xl border border-hairline bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-pine">
                Top Dispensed Strains
              </h2>
            </div>
            {(d?.topStrains?.length ?? 0) === 0 ? (
              <p className="py-10 text-center text-muted">Noch keine Abverkäufe registriert.</p>
            ) : (
              <ul className="mt-6 space-y-4">
                {d?.topStrains.map((s, idx) => (
                  <li key={s.name} className="flex items-center justify-between border-b border-hairline pb-2 last:border-0">
                    <span className="flex items-center gap-3">
                      <span className="flex size-6 items-center justify-center rounded-full bg-mint/20 text-xs font-bold text-pine-600">{idx + 1}</span>
                      <span className="font-semibold text-ink-strong">{s.name}</span>
                    </span>
                    <span className="font-mono text-sm font-bold text-pine-600">{s.quantity} g</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="space-y-6">
            <section className="cw-watermark rounded-xl border border-hairline bg-white p-6">
              <h2 className="font-display text-xl font-bold text-pine">
                Effizienz & Durchsatz
              </h2>
              <div className="mt-4 flex justify-center">
                <ProgressRing pct={100} size={160} stroke={14}>
                  <p className="font-display text-3xl font-bold text-pine">
                    {d?.processingTimeHours}h
                  </p>
                </ProgressRing>
              </div>
              <p className="mt-4 text-center text-sm leading-relaxed text-muted">
                Durchschnittliche Bearbeitungszeit (Eingang bis Bereitstellung)
              </p>
              
              <div className="mt-6 rounded-lg bg-pine-50 p-4 border border-pine-100">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pine-600 mb-1.5">
                  <span className="msym text-[16px]">info</span>
                  Effizienz-Kontext
                </p>
                <p className="text-sm text-pine-800 leading-relaxed">
                  Schnelle Bearbeitungszeiten unter 4 Stunden steigern die Patientenzufriedenheit erheblich und erhöhen die Bindungsrate.
                </p>
              </div>
            </section>

            <section className="cw-watermark rounded-xl border border-hairline bg-white p-6">
              <h2 className="font-display text-xl font-bold text-pine">
                Rezept-Volumen
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <Row
                  label="Eingegangene Rezepte"
                  value={String(d?.totalPrescriptions ?? 0)}
                  href="/pharmacy/prescriptions"
                />
                <Row
                  label="Abgeschlossene Verordnungen"
                  value={String(d?.completedPrescriptions ?? 0)}
                />
                <Row
                  label="Kritische Lagerbestände"
                  value={String(d?.stockAlerts ?? 0)}
                  tone={d?.stockAlerts && d.stockAlerts > 0 ? "text-red-600" : "text-pine-600"}
                  href="/pharmacy/inventory"
                />
              </dl>
              
              <div className="mt-6 rounded-lg bg-surface p-4 border border-hairline">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
                  <span className="msym text-[16px]">medical_services</span>
                  Lagerwarnungen
                </p>
                <p className="text-sm text-ink leading-relaxed">
                  Stellen Sie sicher, dass Bestände frühzeitig nachbestellt werden, um Engpässe bei wiederkehrenden Verordnungen zu vermeiden.
                </p>
              </div>
            </section>
          </div>
        </div>
      ) : (
        <section className="cw-watermark mt-6 rounded-xl border border-hairline bg-white p-6">
          <h2 className="font-display text-xl font-bold text-pine">
            Monatliche Abrechnungsübersicht
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <BillCard
              label="Aktueller Tarif"
              value={d?.billing.planName ?? "—"}
              badge={d?.billing.tier}
            />
            <BillCard
              label="Grundgebühr (Monat)"
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

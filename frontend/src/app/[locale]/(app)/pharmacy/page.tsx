import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { apiServer } from "@/lib/api-server";
import { LiveOrderTicker } from "@/components/pharmacy/LiveOrderTicker";

type Overview = {
  pharmacyName: string;
  monthlyVolume: number;
  activeRegulars: number;
  returningPatientsPercentage: number;
  prescriptionsToday: number;
  stockAlert: { id: string; name: string; stockLevel: number; unit: string } | null;
  recentPrescriptions: {
    id: string;
    patientName: string;
    status: string;
    parsedData: { inventoryId: string; name: string; quantity: number; unit: string }[] | null;
    createdAt: string;
  }[];
};

/* Pharmacy Smart Dashboard – real-time operational overview. */
export default async function PharmacyDashboard({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, format, d] = await Promise.all([
    getTranslations("pharmacy.dashboard"),
    getFormatter(),
    apiServer<Overview>("/pharmacy/overview"),
  ]);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-pine">{t("title")}</h1>
          <p className="mt-1 text-muted">
            {t("subtitle", { name: d?.pharmacyName ?? "" })}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="receipt_long"
          tint="bg-[#eef2fe] text-info"
          badge={t("metrics")}
          value={String(d?.monthlyVolume ?? 0)}
          label={t("monthlyVolume")}
          href="/pharmacy/prescriptions"
        />
        <StatCard
          icon="group"
          tint="bg-mint/30 text-pine-600"
          badge={t("retention")}
          value={String(d?.activeRegulars ?? 0)}
          label={t("activeRegulars")}
          href="/pharmacy/reviews"
          foot={{
            text: t("returningPatients", { pct: d?.returningPatientsPercentage ?? 0 }),
            tone: "text-pine-600",
            icon: "hub"
          }}
        />
        <StatCard
          icon="today"
          tint="bg-amber-50 text-amber-600"
          badge={t("todayActivity")}
          value={String(d?.prescriptionsToday ?? 0)}
          label={t("prescriptionsToday")}
          href="/pharmacy/prescriptions"
        />
        <StatCard
          icon="inventory_2"
          tint={d?.stockAlert ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"}
          badge={t("inventory")}
          value={d?.stockAlert ? String(d.stockAlert.stockLevel) : "OK"}
          suffix={d?.stockAlert ? d.stockAlert.unit : undefined}
          label={d?.stockAlert ? d.stockAlert.name : t("stockOk")}
          href="/pharmacy/inventory"
          foot={
            d?.stockAlert
              ? { text: t("lowStock"), tone: "text-red-600", icon: "warning" }
              : undefined
          }
        />
      </div>

      <div className="mt-8">
        <LiveOrderTicker
          prescriptions={d?.recentPrescriptions || []}
          translations={{
            liveOrderTicker: t("liveOrderTicker"),
            viewAllOrders: t("viewAllOrders"),
            noNewOrders: t("noNewOrders"),
            newPrescriptionReceived: (name) => t("newPrescriptionReceived", { name }),
            processOrder: t("processOrder"),
            aiExtracted: t("aiExtracted"),
          }}
          timeFormatter={format.relativeTime}
        />
      </div>
    </>
  );
}

type Href = string | { pathname: string; query: Record<string, string> };

function StatCard({
  icon,
  tint,
  badge,
  value,
  suffix,
  label,
  foot,
  href,
}: Readonly<{
  icon: string;
  tint: string;
  badge: string;
  value: string;
  suffix?: string;
  label: string;
  foot?: { text: string; tone: string; icon: string };
  href: Href;
}>) {
  return (
    <Link
      href={href}
      className="cw-watermark block rounded-xl border border-hairline bg-white p-5 transition-colors hover:border-pine-600"
    >
      <div className="flex items-start justify-between">
        <span className={`flex size-11 items-center justify-center rounded-xl text-[22px] ${tint}`}>
          <span aria-hidden className="msym">{icon}</span>
        </span>
        <span className="rounded-md bg-[#eef1f8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-strong">
          {badge}
        </span>
      </div>
      <p className="mt-4 font-display text-4xl font-bold text-pine">
        {value}
        {suffix ? (
          <span className="ms-1 font-mono text-sm font-normal text-muted">{suffix}</span>
        ) : null}
      </p>
      <p className="mt-1 text-muted">{label}</p>
      {foot ? (
        <p className={`mt-3 flex items-center gap-1.5 text-sm font-semibold ${foot.tone}`}>
          <span aria-hidden className="msym text-[18px]">
            {foot.icon}
          </span>
          {foot.text}
        </p>
      ) : null}
    </Link>
  );
}

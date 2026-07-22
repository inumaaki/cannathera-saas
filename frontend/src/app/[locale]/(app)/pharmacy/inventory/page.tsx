import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { API_URL } from "@/lib/api";
import { apiServer } from "@/lib/api-server";
import { InventoryFilters } from "@/components/pharmacy/InventoryFilters";
import { InventoryTable, type Item } from "@/components/pharmacy/InventoryTable";
import { ReorderButton } from "@/components/pharmacy/ReorderButton";

type Data = {
  items: Item[];
  shortages: Item[];
  categories: string[];
  stats: {
    totalSkus: number;
    lowStock: number;
    critical: number;
    pendingOrders: number;
  };
};

/* Figma 6.6 — Inventory Management. */
export default async function PharmacyInventory({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; q?: string; status?: string; sort?: string }>;
}>) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);

  const category = sp.category ?? "all";
  const q = sp.q ?? "";
  const status = sp.status ?? "all";
  const sort = sp.sort ?? "name";

  const query = new URLSearchParams({ category, status, sort });
  if (q) query.set("q", q);

  const [t, d] = await Promise.all([
    getTranslations("pharmacy.inventory"),
    apiServer<Data>(`/pharmacy/inventory?${query.toString()}`),
  ]);

  const shortages = d?.shortages ?? [];
  const worst = shortages[0];

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-pine">{t("title")}</h1>
          <p className="mt-1 max-w-2xl text-muted">{t("subtitle")}</p>
        </div>
        <a
          href={`${API_URL}/pharmacy/inventory/export`}
          className="flex items-center gap-2 rounded-lg border border-pine-600 px-4 py-2.5 text-sm font-bold text-pine-600 hover:bg-mint/20"
        >
          <span aria-hidden className="msym text-[18px]">
            download
          </span>
          {t("exportCsv")}
        </a>
      </div>

      {/* Stat cards describe the whole inventory, never the current filter. */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon="inventory_2"
          tint="bg-[#eef2fe] text-info"
          value={d?.stats.totalSkus ?? 0}
          label={t("totalSkus")}
        />
        <Stat
          icon="trending_down"
          tint="bg-[#fdece0] text-accent-print"
          value={d?.stats.lowStock ?? 0}
          label={t("lowStock")}
          note={t("attention")}
          href={{ pathname: "/pharmacy/inventory", query: { status: "low" } }}
        />
        <Stat
          icon="warning"
          tint="bg-red-50 text-red-600"
          value={d?.stats.critical ?? 0}
          label={t("critical")}
          note={t("immediate")}
          href={{ pathname: "/pharmacy/inventory", query: { status: "critical" } }}
        />
        <Stat
          icon="local_shipping"
          tint="bg-mint/30 text-pine-600"
          value={d?.stats.pendingOrders ?? 0}
          label={t("pendingOrders")}
          href={{ pathname: "/pharmacy/inventory", query: { status: "pending" } }}
        />
      </div>

      {worst ? (
        <section className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-brand p-6 text-white">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-[24px] text-mint-bright">
              <span aria-hidden className="msym">warning</span>
            </span>
            <div>
              <h2 className="font-display text-xl font-bold">{t("alertTitle")}</h2>
              <p className="mt-1 text-sm leading-relaxed text-white/80">
                {t("alertText", {
                  name: worst.name,
                  threshold: worst.safetyThreshold,
                  unit: worst.unit,
                })}
              </p>
              {shortages.length > 1 ? (
                <p className="mt-1 text-sm font-semibold text-mint-bright">
                  {t("alertMulti", { count: shortages.length })}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="rounded-lg bg-white/10 px-4 py-2 font-mono text-sm font-bold text-mint-bright">
              {worst.stockLevel} {worst.unit}
            </span>
            <ReorderButton
              itemId={worst.id}
              pendingOrder={worst.pendingOrder}
              suggestedQty={Math.max(
                1,
                Math.round(worst.safetyThreshold * 2 - worst.stockLevel),
              )}
            />
          </div>
        </section>
      ) : null}

      <InventoryFilters
        q={q}
        status={status}
        category={category}
        sort={sort}
        categories={d?.categories ?? []}
      />

      <InventoryTable items={d?.items ?? []} />
    </>
  );
}

function Stat({
  icon,
  tint,
  value,
  label,
  note,
  href,
}: Readonly<{
  icon: string;
  tint: string;
  value: number;
  label: string;
  note?: string;
  href?: { pathname: string; query: Record<string, string> };
}>) {
  const body = (
    <>
      <span className={`flex size-11 items-center justify-center rounded-xl text-[22px] ${tint}`}>
        <span aria-hidden className="msym">{icon}</span>
      </span>
      <p className="mt-4 font-display text-4xl font-bold text-pine">{value}</p>
      <p className="mt-1 text-muted">{label}</p>
      {note ? (
        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-sage-900">
          {note}
        </p>
      ) : null}
    </>
  );

  const className = "cw-watermark block rounded-xl border border-hairline bg-white p-5";
  if (!href) return <div className={className}>{body}</div>;

  return (
    <Link
      href={href}
      className={`${className} transition-colors hover:border-pine-600`}
    >
      {body}
    </Link>
  );
}

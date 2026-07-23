"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";

const STATUSES = ["all", "critical", "low", "inStock", "pending"] as const;
const SORTS = ["name", "sku", "stock", "category"] as const;

/* Search / status / category / sort — all pushed into the server query string. */
export function InventoryFilters({
  q,
  status,
  category,
  sort,
  categories,
}: Readonly<{
  q: string;
  status: string;
  category: string;
  sort: string;
  categories: string[];
}>) {
  const t = useTranslations("pharmacy.inventory");
  const router = useRouter();
  const [term, setTerm] = useState(q);

  const filtered = q || status !== "all" || category !== "all" || sort !== "name";

  function apply(next: Partial<Record<"q" | "status" | "category" | "sort", string>>) {
    const merged = { q: term, status, category, sort, ...next };
    const query: Record<string, string> = {};
    if (merged.q.trim()) query.q = merged.q.trim();
    if (merged.status !== "all") query.status = merged.status;
    if (merged.category !== "all") query.category = merged.category;
    if (merged.sort !== "name") query.sort = merged.sort;
    router.push({ pathname: "/pharmacy/inventory", query });
  }

  const statusLabel = (s: string) =>
    s === "all"
      ? t("statusAll")
      : s === "critical"
        ? t("statusCritical")
        : s === "low"
          ? t("statusLow")
          : s === "inStock"
            ? t("statusInStock")
            : t("statusPending");

  const sortLabel = (s: string) =>
    s === "name"
      ? t("sortName")
      : s === "sku"
        ? t("sortSku")
        : s === "stock"
          ? t("sortStock")
          : t("sortCategory");

  const categoryLabel = (value: string) => {
    const key = `category${value}` as
      | "categoryFlower"
      | "categoryOil"
      | "categoryExtract"
      | "categoryCapsule";
    return ["Flower", "Oil", "Extract", "Capsule"].includes(value) ? t(key) : value;
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply({});
      }}
      className="cw-watermark mt-6 grid gap-4 rounded-xl border border-hairline bg-white p-5 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end"
    >
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-wide text-sage-900">
          {t("search")}
        </span>
        <span className="relative mt-1.5 block">
          <span
            aria-hidden
            className="msym absolute start-3 top-1/2 -translate-y-1/2 text-[20px] text-muted"
          >
            search
          </span>
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={t("search")}
            className="h-11 w-full rounded-lg border border-hairline bg-surface ps-10 pe-3 text-sm text-ink-strong outline-none placeholder:text-muted focus:ring-2 focus:ring-pine-600/30"
          />
        </span>
      </label>

      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-wide text-sage-900">
          {t("filterStatus")}
        </span>
        <select
          value={status}
          onChange={(e) => apply({ status: e.target.value })}
          className="mt-1.5 h-11 w-full rounded-lg border border-hairline bg-surface px-3 text-sm font-semibold text-ink-strong outline-none focus:ring-2 focus:ring-pine-600/30"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-wide text-sage-900">
          {t("category")}
        </span>
        <select
          value={category}
          onChange={(e) => apply({ category: e.target.value })}
          className="mt-1.5 h-11 w-full rounded-lg border border-hairline bg-surface px-3 text-sm font-semibold text-ink-strong outline-none focus:ring-2 focus:ring-pine-600/30"
        >
          <option value="all">{t("allProducts")}</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {categoryLabel(c)}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-wide text-sage-900">
          {t("sortBy")}
        </span>
        <select
          value={sort}
          onChange={(e) => apply({ sort: e.target.value })}
          className="mt-1.5 h-11 w-full rounded-lg border border-hairline bg-surface px-3 text-sm font-semibold text-ink-strong outline-none focus:ring-2 focus:ring-pine-600/30"
        >
          {SORTS.map((s) => (
            <option key={s} value={s}>
              {sortLabel(s)}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="h-11 rounded-lg bg-brand px-5 text-sm font-bold text-white hover:bg-pine"
        >
          {t("search")}
        </button>
        {filtered ? (
          <Link
            href="/pharmacy/inventory"
            onClick={() => setTerm("")}
            className="flex h-11 items-center rounded-lg border border-hairline px-4 text-sm font-bold text-ink-strong hover:bg-surface"
          >
            {t("reset")}
          </Link>
        ) : null}
      </div>
    </form>
  );
}

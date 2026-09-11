"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { Link, useRouter } from "@/i18n/navigation";
import Image from "next/image";
import { formatOperatingHours } from "@/lib/formatHours";

type InventoryItem = {
  id: string;
  sku: string;
  name: string;
  category: string;
  thc: number | null;
  cbd: number | null;
  unit: string;
  inStock: boolean;
  availability?: "IN_STOCK" | "ON_REQUEST";
  genetics: "Sativa" | "Indica" | "Hybrid";
  price: number;
  imageUrl?: string;
  effects?: string[];
};

type PharmacyInfo = {
  id: string;
  name: string;
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  operatingHours?: any;
  productFocus?: string | null;
};

type InventoryResponse = {
  pharmacy: PharmacyInfo;
  items: InventoryItem[];
};

type PharmacyOption = {
  id: string;
  name: string;
  city?: string | null;
  isFavorite?: boolean;
};

const EFFECT_OPTIONS = [
  { key: "ALL", label: "Alle Wirkungen", icon: "tune" },
  { key: "pain", label: "Schmerzlindernd", icon: "healing" },
  { key: "calm", label: "Beruhigend / Sedierend", icon: "spa" },
  { key: "euphoric", label: "Stimmungsaufhellend", icon: "flare" },
  { key: "sleep", label: "Schlaffördernd", icon: "bedtime" },
  { key: "focus", label: "Fokussierend", icon: "psychology" },
] as const;

const EFFECT_LABELS: Record<string, string> = {
  pain: "Schmerzlindernd",
  calm: "Beruhigend / Sedierend",
  euphoric: "Stimmungsaufhellend",
  sleep: "Schlaffördernd",
  focus: "Fokussierend",
};

function InventoryContent() {
  const t = useTranslations("patient.inventory");
  const searchParams = useSearchParams();
  const router = useRouter();

  const [pharmacies, setPharmacies] = useState<PharmacyOption[]>([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>(
    searchParams.get("pharmacyId") || ""
  );

  const [inventoryData, setInventoryData] = useState<InventoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "Flower" | "Extract">("ALL");
  const [geneticsFilter, setGeneticsFilter] = useState<"ALL" | "Sativa" | "Indica" | "Hybrid">("ALL");
  const [effectFilter, setEffectFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "thc-desc" | "name-asc">("price-asc");

  // 1. Fetch available pharmacies (favorites + network search)
  useEffect(() => {
    async function loadPharmacies() {
      try {
        const [profileRes, searchRes] = await Promise.all([
          api<{ favoritePharmacies: Array<{ id: string; name: string; city: string | null }> }>("/patient/profile").catch(() => null),
          api<Array<{ id: string; name: string; city: string }>>("/patient/pharmacies/search").catch(() => []),
        ]);

        const favs = profileRes?.favoritePharmacies || [];
        const favIds = new Set(favs.map((f) => f.id));

        const combined: PharmacyOption[] = [];
        favs.forEach((f) => combined.push({ ...f, isFavorite: true }));
        (searchRes || []).forEach((p) => {
          if (!favIds.has(p.id)) {
            combined.push({ ...p, isFavorite: false });
          }
        });

        setPharmacies(combined);

        // Pick selected pharmacy
        const initialId = searchParams.get("pharmacyId");
        if (initialId && combined.some((p) => p.id === initialId)) {
          setSelectedPharmacyId(initialId);
        } else if (combined.length > 0) {
          setSelectedPharmacyId(combined[0].id);
        }
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Apotheken konnten nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    }

    loadPharmacies();
  }, [searchParams]);

  // 2. Fetch inventory of the selected pharmacy
  useEffect(() => {
    if (!selectedPharmacyId) return;

    setLoadingItems(true);
    setError(null);
    api<InventoryResponse>(`/patient/pharmacies/${selectedPharmacyId}/inventory`)
      .then((res) => {
        setInventoryData(res);
      })
      .catch((err) => {
        const error = err as Error;
        setError(error.message || "Bestand konnte nicht geladen werden.");
      })
      .finally(() => {
        setLoadingItems(false);
      });
  }, [selectedPharmacyId]);

  // Filter & sort items
  const filteredItems = useMemo(() => {
    if (!inventoryData?.items) return [];

    return inventoryData.items
      .filter((item) => {
        // Category
        if (categoryFilter === "Flower" && item.category !== "Flower") return false;
        if (categoryFilter === "Extract" && item.category === "Flower") return false;

        // Genetics
        if (geneticsFilter !== "ALL" && item.genetics !== geneticsFilter) return false;

        // Effect profile filter
        if (effectFilter !== "ALL") {
          if (!item.effects || !item.effects.includes(effectFilter)) {
            return false;
          }
        }

        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = item.name.toLowerCase().includes(q);
          const matchSku = item.sku.toLowerCase().includes(q);
          const matchGenetics = item.genetics.toLowerCase().includes(q);
          if (!matchName && !matchSku && !matchGenetics) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        if (sortBy === "thc-desc") return (b.thc || 0) - (a.thc || 0);
        if (sortBy === "name-asc") return a.name.localeCompare(b.name);
        return 0;
      });
  }, [inventoryData?.items, categoryFilter, geneticsFilter, effectFilter, searchQuery, sortBy]);

  // Resolve authentic real product image
  function getProductImage(item: InventoryItem): string {
    if (item.imageUrl) return item.imageUrl;
    if (item.category === "Extract" || item.unit === "ml") {
      return "/products/cannabis_extract_oil.jpg";
    }
    if (item.genetics === "Sativa") {
      return "/products/cannabis_flower_sativa.jpg";
    }
    if (item.genetics === "Indica") {
      return "/products/cannabis_flower_indica.jpg";
    }
    return "/products/cannabis_flower_hybrid.jpg";
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-xs text-muted mb-1">
          <Link href="/patient" className="hover:text-pine-600">
            Start
          </Link>
          <span>/</span>
          <span className="text-ink-strong font-medium">Apotheken-Sortiment</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-pine-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </div>

      {/* Pharmacy Selector Pill Bar */}
      <div className="rounded-2xl border border-hairline bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1">
              {t("selectPharmacy")}
            </label>
            <div className="flex flex-wrap gap-2">
              {pharmacies.map((p) => {
                const active = p.id === selectedPharmacyId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPharmacyId(p.id)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                      active
                        ? "bg-pine-600 text-white shadow-sm ring-2 ring-pine-600/20"
                        : "bg-[#f6f8fc] text-ink-strong hover:bg-slate-200"
                    }`}
                  >
                    <span aria-hidden className="msym text-[16px]">
                      local_pharmacy
                    </span>
                    <span>{p.name}</span>
                    {p.isFavorite && (
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[9px] ${
                          active ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        ★ Favorit
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <Link
            href="/patient/profile#network"
            className="text-xs font-bold text-pine-600 hover:underline flex items-center gap-1.5 self-end pb-1"
          >
            <span aria-hidden className="msym text-[16px]">map</span>
            Favoriten auf Karte bearbeiten (25–30 km)
          </Link>
        </div>

        {/* Selected Pharmacy Info Banner */}
        {inventoryData?.pharmacy && (
          <div className="border-t border-hairline pt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-muted">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-semibold text-ink-strong flex items-center gap-1">
                <span aria-hidden className="msym text-[16px] text-pine-600">location_on</span>
                {[
                  inventoryData.pharmacy.street,
                  inventoryData.pharmacy.postalCode,
                  inventoryData.pharmacy.city,
                ]
                  .filter(Boolean)
                  .join(", ") || "Apotheke vor Ort"}
              </span>
              {inventoryData.pharmacy.phone && (
                <span className="flex items-center gap-1">
                  <span aria-hidden className="msym text-[16px] text-pine-600">call</span>
                  {inventoryData.pharmacy.phone}
                </span>
              )}
              {formatOperatingHours(inventoryData.pharmacy.operatingHours) && (
                <span className="flex items-center gap-1">
                  <span aria-hidden className="msym text-[16px] text-pine-600">schedule</span>
                  {formatOperatingHours(inventoryData.pharmacy.operatingHours)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/patient/feedback?pharmacyId=${inventoryData.pharmacy.id}`}
                className="h-8 px-3 rounded-lg bg-amber-50 text-amber-800 font-bold hover:bg-amber-100 flex items-center gap-1 transition-colors"
              >
                <span aria-hidden className="msym text-[14px]">rate_review</span>
                Sorten-Feedback abgeben
              </Link>
              <Link
                href="/patient/prescriptions"
                className="h-8 px-3 rounded-lg bg-pine-50 text-pine-700 font-bold hover:bg-pine-100 flex items-center gap-1 transition-colors"
              >
                <span aria-hidden className="msym text-[14px]">receipt_long</span>
                Rezept einlösen
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Controls */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 rounded-xl bg-white p-1 border border-hairline shadow-sm">
            <button
              type="button"
              onClick={() => setCategoryFilter("ALL")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                categoryFilter === "ALL"
                  ? "bg-pine-600 text-white"
                  : "text-muted hover:text-ink-strong"
              }`}
            >
              {t("filterAll")}
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter("Flower")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                categoryFilter === "Flower"
                  ? "bg-pine-600 text-white"
                  : "text-muted hover:text-ink-strong"
              }`}
            >
              {t("filterFlowers")}
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter("Extract")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                categoryFilter === "Extract"
                  ? "bg-pine-600 text-white"
                  : "text-muted hover:text-ink-strong"
              }`}
            >
              {t("filterExtracts")}
            </button>
          </div>

          {/* Genetics Filter */}
          <div className="flex items-center gap-1.5 rounded-xl bg-white p-1 border border-hairline shadow-sm text-xs">
            {(["ALL", "Sativa", "Indica", "Hybrid"] as const).map((gen) => (
              <button
                key={gen}
                type="button"
                onClick={() => setGeneticsFilter(gen)}
                className={`rounded-lg px-2.5 py-1.5 font-bold transition-colors ${
                  geneticsFilter === gen
                    ? "bg-[#0c3527] text-white"
                    : "text-muted hover:text-ink-strong"
                }`}
              >
                {gen === "ALL" ? "Alle Genetiken" : gen}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <span
              aria-hidden
              className="msym absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-muted pointer-events-none"
            >
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-10 w-full rounded-xl border border-hairline bg-white pl-9 pr-3 text-xs text-ink-strong outline-none focus:border-pine-600 shadow-sm"
            />
          </div>

          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="h-10 rounded-xl border border-hairline bg-white px-3 text-xs font-medium text-ink-strong outline-none focus:border-pine-600 shadow-sm"
          >
            <option value="price-asc">Preis: aufsteigend (€/g)</option>
            <option value="price-desc">Preis: absteigend (€/g)</option>
            <option value="thc-desc">THC-Gehalt: absteigend</option>
            <option value="name-asc">Sorte: A–Z</option>
          </select>
        </div>

        {/* Advanced Effect Profile Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-hairline bg-white p-3 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-muted mr-1 flex items-center gap-1">
            <span aria-hidden className="msym text-[16px] text-pine-600">filter_list</span>
            Wirkprofil:
          </span>
          {EFFECT_OPTIONS.map((eff) => {
            const active = effectFilter === eff.key;
            return (
              <button
                key={eff.key}
                type="button"
                onClick={() => setEffectFilter(eff.key)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? "bg-pine-600 text-white shadow-xs"
                    : "bg-[#f6f8fc] text-ink-strong hover:bg-slate-200"
                }`}
              >
                <span aria-hidden className="msym text-[14px]">
                  {eff.icon}
                </span>
                <span>{eff.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid */}
      {loading || loadingItems ? (
        <div className="py-20 text-center">
          <span aria-hidden className="msym text-4xl text-pine-600 animate-spin">
            progress_activity
          </span>
          <p className="mt-3 text-sm text-muted">Apotheken-Sortiment wird geladen …</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-800">
          <p className="font-bold">{error}</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-hairline bg-white p-12 text-center">
          <span aria-hidden className="msym text-5xl text-muted">inventory_2</span>
          <h3 className="mt-3 text-lg font-bold text-ink-strong">{t("noProducts")}</h3>
          <p className="mt-1 text-sm text-muted">
            Versuchen Sie, den Suchbegriff oder die Filterkriterien anzupassen.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const imgSrc = getProductImage(item);
            const isAvailable = item.availability === "IN_STOCK" || item.inStock;

            return (
              <div
                key={item.id}
                className="group flex flex-col justify-between rounded-2xl border border-hairline bg-white shadow-sm hover:border-pine-600 hover:shadow-md transition-all overflow-hidden"
              >
                <div>
                  {/* Real Product Image Showcase */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                    <img
                      src={imgSrc}
                      alt={item.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Genetics Corner Badge */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${
                          item.genetics === "Sativa"
                            ? "bg-amber-500/90 text-white"
                            : item.genetics === "Indica"
                              ? "bg-purple-600/90 text-white"
                              : "bg-emerald-600/90 text-white"
                        }`}
                      >
                        {item.genetics}
                      </span>
                    </div>

                    {/* Stock Status Badge without raw numeric inventory */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md shadow-sm flex items-center gap-1.5 ${
                          isAvailable
                            ? "bg-emerald-900/85 text-emerald-200 border border-emerald-500/30"
                            : "bg-amber-900/85 text-amber-200 border border-amber-500/30"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            isAvailable ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                          }`}
                        />
                        {isAvailable ? "Sofort verfügbar" : "Auf Anfrage"}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-semibold uppercase text-muted">
                        SKU: {item.sku}
                      </span>
                      <span className="text-[11px] font-medium text-muted">
                        {item.category === "Flower" ? "Cannabisblüte" : item.category}
                      </span>
                    </div>

                    <h3 className="mt-2 font-display text-lg font-bold text-ink-strong group-hover:text-pine-600 transition-colors line-clamp-1">
                      {item.name}
                    </h3>

                    {/* Cannabinoid Profile Pills */}
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {item.thc !== null && (
                        <span className="rounded-lg bg-emerald-50 px-2.5 py-1 font-bold text-emerald-800 border border-emerald-100">
                          THC {item.thc}%
                        </span>
                      )}
                      {item.cbd !== null && (
                        <span className="rounded-lg bg-blue-50 px-2.5 py-1 font-bold text-blue-800 border border-blue-100">
                          CBD {item.cbd}%
                        </span>
                      )}
                    </div>

                    {/* Therapeutic Effect Profile Tags */}
                    {item.effects && item.effects.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-hairline">
                        {item.effects.map((eff) => (
                          <span
                            key={eff}
                            className="rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700 border border-slate-200/80"
                          >
                            {EFFECT_LABELS[eff] || eff}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Price & Actions Footer */}
                <div className="border-t border-hairline bg-[#f8fafc] p-4 flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
                      Preis
                    </span>
                    <span className="font-display text-xl font-bold text-pine-900">
                      {(item.price ?? 0).toFixed(2)} €{" "}
                      <span className="text-xs font-normal text-muted">
                        / {item.unit || "g"}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/patient/feedback?pharmacyId=${selectedPharmacyId}&strain=${encodeURIComponent(
                        item.name || ""
                      )}`}
                      title="Feedback zu dieser Sorte an Apotheke senden"
                      className="size-9 rounded-xl border border-hairline bg-white flex items-center justify-center text-amber-600 hover:bg-amber-50 hover:border-amber-300 transition-colors shadow-sm"
                    >
                      <span aria-hidden className="msym text-[18px]">rate_review</span>
                    </Link>

                    <Link
                      href="/patient/prescriptions"
                      className="h-9 px-3 rounded-xl bg-pine-600 font-bold text-xs text-white shadow-sm hover:bg-pine-700 flex items-center gap-1 transition-colors"
                    >
                      <span aria-hidden className="msym text-[16px]">receipt</span>
                      Rezept
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PatientInventoryPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center">Wird geladen …</div>}>
      <InventoryContent />
    </Suspense>
  );
}

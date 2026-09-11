"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { Link, useRouter } from "@/i18n/navigation";
import { formatOperatingHours } from "@/lib/formatHours";

export type PharmacyResult = {
  id: string;
  name: string;
  postalCode: string;
  city: string;
  street: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  operatingHours?: any;
  distanceKm: number;
  availableStrainsCount: number;
  lat: number;
  lng: number;
};

export function FavoritePharmacies({
  initialFavorites,
}: Readonly<{
  initialFavorites: Array<{
    id: string;
    name: string;
    city: string | null;
    inventory?: Array<{ name: string; stockLevel: number; unit: string }>;
  }>;
}>) {
  const t = useTranslations("patient.profile");
  const router = useRouter();

  const [results, setResults] = useState<PharmacyResult[]>([]);
  const [searching, setSearching] = useState(true);
  const [favorites, setFavorites] = useState(initialFavorites);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map state
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(null);
  const [radiusFilterOnly, setRadiusFilterOnly] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 35km view, 1.5 = 20km, 0.7 = 50km

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const res = await api<PharmacyResult[]>("/patient/pharmacies/search");
        setResults(res);
        if (res.length > 0) {
          setSelectedPharmacyId(res[0].id);
        }
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Apotheken im Umkreis konnten nicht geladen werden.");
      } finally {
        setSearching(false);
      }
    }
    fetchRecommendations();
  }, []);

  function toggleFavorite(p: { id: string; name: string; city: string | null }) {
    const isFav = favorites.some((f) => f.id === p.id);
    if (isFav) {
      setFavorites(favorites.filter((f) => f.id !== p.id));
    } else {
      if (favorites.length >= 3) {
        alert(t("favoriteLimitReached"));
        return;
      }
      setFavorites([...favorites, { id: p.id, name: p.name, city: p.city, inventory: [] }]);
    }
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await api("/patient/profile/favorites", {
        method: "PATCH",
        body: { pharmacyIds: favorites.map((f) => f.id) },
      });
      setSaved(true);
      router.refresh();
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  // Filtered pharmacies
  const displayedPharmacies = useMemo(() => {
    if (radiusFilterOnly) {
      return results.filter((p) => p.distanceKm <= 30);
    }
    return results;
  }, [results, radiusFilterOnly]);

  const selectedPharmacy = useMemo(
    () => results.find((p) => p.id === selectedPharmacyId) ?? results[0] ?? null,
    [results, selectedPharmacyId]
  );

  // SVG Radar / Map coordinates projection
  // Center is patient (width: 540, height: 360) -> center (270, 180)
  const mapCenter = { x: 270, y: 180 };
  const radiusKm = 30;
  // At zoom 1: 30km corresponds to 125px radius
  const pxPerKm = (125 * zoomLevel) / radiusKm;

  // Compute center lat/lng from results or Frankfurt default
  const centerLat = 50.1109;
  const centerLng = 8.6821;

  return (
    <div className="mt-8 space-y-6">
      {/* Header */}
      <div className="border-t border-hairline pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-pine-900">{t("networkTitle")}</h2>
            <p className="text-sm text-muted mt-1">{t("networkSubtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Radius: 25–30 km
            </span>
          </div>
        </div>
      </div>

      {/* Selected Favorites Pill Counter */}
      <div className="rounded-2xl border border-hairline bg-[#f6f8fc] p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-ink-strong">
            {t("currentFavorites")} ({favorites.length}/3)
          </h3>
          <span className="text-xs text-muted">
            Maximal 3 Partner-Apotheken für Rezeptzuweisung
          </span>
        </div>

        {favorites.length === 0 ? (
          <div className="p-4 text-center rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
            <p className="text-sm font-semibold">{t("noFavorites")}</p>
            <p className="text-xs mt-1 text-amber-700">
              Wählen Sie unten auf der Karte oder in der Liste Ihre bevorzugten Partner-Apotheken aus.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {favorites.map((f) => (
              <div
                key={f.id}
                className="flex flex-col justify-between rounded-xl border border-hairline bg-white p-4 shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-pine-900 text-sm">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(f)}
                      aria-label={t("removeFavorite")}
                      className="text-red-500 hover:text-red-700 text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>
                  {f.city && <p className="text-xs text-muted mt-0.5">{f.city}</p>}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-hairline pt-2">
                  <Link
                    href={`/patient/inventory?pharmacyId=${f.id}`}
                    className="text-xs font-bold text-pine-600 hover:underline flex items-center gap-1"
                  >
                    <span aria-hidden className="msym text-[14px]">storefront</span>
                    {t("viewShop")}
                  </Link>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Favorit
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3">
          <p className="text-xs text-muted">
            Änderungen werden nach dem Speichern sofort für Ihre E-Rezepte aktiviert.
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || favorites.length === 0}
            className="h-10 rounded-xl bg-pine-600 px-6 font-bold text-white shadow-sm hover:bg-pine-700 disabled:opacity-50 transition-colors"
          >
            {saved ? t("networkSaved") : t("saveNetwork")}
          </button>
        </div>
      </div>

      {/* Interactive 25-30 km Radius Map View */}
      <div className="rounded-2xl border border-hairline bg-white overflow-hidden shadow-sm">
        <div className="border-b border-hairline bg-[#f8fafc] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-ink-strong flex items-center gap-2">
              <span aria-hidden className="msym text-pine-600">map</span>
              {t("radiusMapTitle")}
            </h3>
            <p className="text-xs text-muted mt-0.5">{t("radiusMapSubtitle")}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRadiusFilterOnly(!radiusFilterOnly)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                radiusFilterOnly
                  ? "bg-pine-600 text-white border-pine-600"
                  : "bg-white text-ink-strong border-hairline hover:bg-slate-50"
              }`}
            >
              {radiusFilterOnly ? "✓ ≤ 30 km Umkreis" : "Alle Entfernungen"}
            </button>
            <div className="flex items-center bg-white border border-hairline rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.2))}
                aria-label="Zoom in"
                className="px-2.5 py-1 text-sm font-bold text-ink-strong hover:bg-slate-100 border-r border-hairline"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.6))}
                aria-label="Zoom out"
                className="px-2.5 py-1 text-sm font-bold text-ink-strong hover:bg-slate-100"
              >
                −
              </button>
            </div>
          </div>
        </div>

        {/* Map Canvas */}
        <div className="relative w-full h-[380px] bg-[#eef3f6] overflow-hidden select-none">
          {/* Subtle Map Grid / Roads Pattern */}
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(#94a3b8 1px, transparent 1px), linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)",
              backgroundSize: "20px 20px, 60px 60px, 60px 60px",
            }}
          />

          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 540 360">
            <defs>
              {/* Radius gradient */}
              <radialGradient id="radiusGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.06" />
                <stop offset="75%" stopColor="#059669" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.22" />
              </radialGradient>
            </defs>

            {/* 15 km inner guide circle */}
            <circle
              cx={mapCenter.x}
              cy={mapCenter.y}
              r={15 * pxPerKm}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.5"
            />
            <text
              x={mapCenter.x + 15 * pxPerKm + 4}
              y={mapCenter.y - 4}
              fill="#64748b"
              fontSize="10"
              fontWeight="600"
            >
              15 km
            </text>

            {/* 25-30 km Main Radius Range */}
            <circle
              cx={mapCenter.x}
              cy={mapCenter.y}
              r={30 * pxPerKm}
              fill="url(#radiusGlow)"
              stroke="#059669"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            <text
              x={mapCenter.x + 30 * pxPerKm + 4}
              y={mapCenter.y - 4}
              fill="#065f46"
              fontSize="11"
              fontWeight="bold"
            >
              30 km Radius
            </text>

            {/* Center Patient Location Indicator */}
            <circle
              cx={mapCenter.x}
              cy={mapCenter.y}
              r="18"
              fill="#2563eb"
              fillOpacity="0.15"
              className="animate-ping"
            />
            <circle
              cx={mapCenter.x}
              cy={mapCenter.y}
              r="9"
              fill="#2563eb"
              stroke="#ffffff"
              strokeWidth="2.5"
            />
            <circle cx={mapCenter.x} cy={mapCenter.y} r="3" fill="#ffffff" />
          </svg>

          {/* Patient Location Label */}
          <div
            className="absolute -translate-x-1/2 translate-y-3 pointer-events-none"
            style={{ left: `${mapCenter.x}px`, top: `${mapCenter.y}px` }}
          >
            <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow">
              {t("patientLocation")}
            </span>
          </div>

          {/* Pharmacy Markers on Map */}
          {displayedPharmacies.map((p, idx) => {
            // Polar or coordinate offset
            // lat diff approx 111 km/deg, lng approx 71 km/deg
            const dLat = ((p.lat || centerLat) - centerLat) * 111;
            const dLng = ((p.lng || centerLng) - centerLng) * 71;

            // Compute distance or fallback with synthetic angle if lat/lng are identical
            const angle = (idx * (2 * Math.PI)) / Math.max(1, displayedPharmacies.length);
            const dist = p.distanceKm > 0 ? p.distanceKm : 8 + idx * 5;
            const effectiveX = mapCenter.x + (dLng !== 0 ? dLng * pxPerKm : Math.cos(angle) * dist * pxPerKm);
            const effectiveY = mapCenter.y - (dLat !== 0 ? dLat * pxPerKm : Math.sin(angle) * dist * pxPerKm);

            const isSelected = selectedPharmacyId === p.id;
            const isFav = favorites.some((f) => f.id === p.id);

            return (
              <div
                key={p.id}
                onClick={() => setSelectedPharmacyId(p.id)}
                className={`absolute -translate-x-1/2 -translate-y-full cursor-pointer transition-transform group ${
                  isSelected ? "scale-115 z-30" : "hover:scale-110 z-20"
                }`}
                style={{
                  left: `${Math.max(25, Math.min(515, effectiveX))}px`,
                  top: `${Math.max(35, Math.min(335, effectiveY))}px`,
                }}
              >
                {/* Pin Tooltip / Tag */}
                <div
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-1 text-xs font-bold shadow-md border ${
                    isSelected
                      ? "bg-pine-900 text-white border-pine-700"
                      : isFav
                        ? "bg-emerald-600 text-white border-emerald-500"
                        : "bg-white text-ink-strong border-slate-200"
                  }`}
                >
                  <span aria-hidden className="msym text-[14px]">local_pharmacy</span>
                  <span>{p.name.split(" ")[0]}</span>
                  <span
                    className={`rounded px-1 text-[10px] ${
                      isSelected || isFav ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {p.distanceKm} km
                  </span>
                </div>

                {/* Pin Needle */}
                <div className="flex justify-center">
                  <div
                    className={`size-2.5 rotate-45 -mt-1 ${
                      isSelected ? "bg-pine-900" : isFav ? "bg-emerald-600" : "bg-white border-r border-b border-slate-200"
                    }`}
                  />
                </div>
              </div>
            );
          })}

          {/* Map Legend Overlay */}
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md rounded-xl p-2.5 text-[11px] font-medium border border-hairline shadow-sm space-y-1 pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-blue-600" />
              <span className="text-slate-700">{t("patientLocation")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-emerald-600" />
              <span className="text-slate-700">Favorit-Apotheke</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-white border border-slate-400" />
              <span className="text-slate-700">Partner im Versorgungsradius</span>
            </div>
          </div>
        </div>

        {/* Selected Pharmacy Detail Card Inside Map Drawer */}
        {selectedPharmacy && (
          <div className="border-t border-hairline bg-[#f8fafc] p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-pine-900">{selectedPharmacy.name}</h4>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Verifizierte Partner-Apotheke
                  </span>
                </div>
                <p className="text-sm text-muted">
                  {selectedPharmacy.street}, {selectedPharmacy.postalCode} {selectedPharmacy.city}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-ink-strong">
                  <span className="flex items-center gap-1 font-semibold text-pine-700 bg-pine-50 px-2 py-1 rounded-md">
                    <span aria-hidden className="msym text-[14px]">near_me</span>
                    {selectedPharmacy.distanceKm} km Entfernung
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                    <span aria-hidden className="msym text-[14px]">inventory_2</span>
                    {selectedPharmacy.availableStrainsCount} Sorten im Sortiment
                  </span>
                  {selectedPharmacy.phone && (
                    <span className="flex items-center gap-1 text-muted">
                      <span aria-hidden className="msym text-[14px]">call</span>
                      {selectedPharmacy.phone}
                    </span>
                  )}
                  {formatOperatingHours(selectedPharmacy.operatingHours) && (
                    <span className="flex items-center gap-1 text-muted">
                      <span aria-hidden className="msym text-[14px]">schedule</span>
                      {formatOperatingHours(selectedPharmacy.operatingHours)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/patient/inventory?pharmacyId=${selectedPharmacy.id}`}
                  className="h-10 px-4 rounded-xl border border-pine-600 text-pine-700 font-bold text-sm flex items-center gap-1.5 hover:bg-pine-50 transition-colors"
                >
                  <span aria-hidden className="msym text-[18px]">storefront</span>
                  {t("viewShop")}
                </Link>

                <button
                  type="button"
                  onClick={() => toggleFavorite(selectedPharmacy)}
                  className={`h-10 px-5 rounded-xl font-bold text-sm shadow-sm transition-colors ${
                    favorites.some((f) => f.id === selectedPharmacy.id)
                      ? "bg-slate-200 text-ink-strong hover:bg-red-50 hover:text-red-700"
                      : "bg-pine-600 text-white hover:bg-pine-700"
                  }`}
                >
                  {favorites.some((f) => f.id === selectedPharmacy.id)
                    ? t("removeFavorite")
                    : t("selectAsFavorite")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pharmacy Roster List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-ink-strong">
            {t("recommendedPharmacies")} ({displayedPharmacies.length})
          </h3>
          {searching && <p className="text-xs text-muted">{t("locatingPartners")}</p>}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="grid gap-3">
          {displayedPharmacies.map((p) => {
            const isFav = favorites.some((f) => f.id === p.id);
            const isSelected = selectedPharmacyId === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedPharmacyId(p.id)}
                className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border bg-white shadow-sm cursor-pointer transition-all ${
                  isSelected ? "border-pine-600 ring-2 ring-pine-100" : "border-hairline hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-pine-900">{p.name}</h4>
                    {isFav && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        Favorit
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted">
                    {p.street}, {p.postalCode} {p.city}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium text-ink-strong">
                    <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                      <span aria-hidden className="msym text-[14px]">location_on</span>
                      {p.distanceKm} km
                    </span>
                    <span className="flex items-center gap-1 bg-leaf-50 px-2 py-1 rounded text-leaf-700">
                      <span aria-hidden className="msym text-[14px]">inventory_2</span>
                      {p.availableStrainsCount} Sorten
                    </span>
                    {p.phone && (
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded text-muted">
                        <span aria-hidden className="msym text-[14px]">call</span>
                        {p.phone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Link
                    href={`/patient/inventory?pharmacyId=${p.id}`}
                    className="h-9 px-3 rounded-lg border border-slate-200 text-xs font-bold text-ink-strong hover:bg-slate-50 flex items-center gap-1"
                  >
                    <span aria-hidden className="msym text-[15px]">storefront</span>
                    Sortiment
                  </Link>

                  <button
                    type="button"
                    onClick={() => toggleFavorite(p)}
                    className={`h-9 rounded-lg px-4 text-xs font-bold transition-colors ${
                      isFav
                        ? "bg-slate-100 text-ink-strong hover:bg-red-50 hover:text-red-700"
                        : "bg-pine-100 text-pine-700 hover:bg-pine-200"
                    }`}
                  >
                    {isFav ? t("added") : t("addToFavorites")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


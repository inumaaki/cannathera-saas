"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useRouter } from "@/i18n/navigation";

type PharmacyResult = {
  id: string;
  name: string;
  postalCode: string;
  city: string;
  street: string;
  distanceKm: number;
  availableStrainsCount: number;
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

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const res = await api<PharmacyResult[]>("/patient/pharmacies/search");
        setResults(res);
      } catch (err) {
          const error = err as Error;
        setError(error.message || "Failed to load local pharmacies");
      } finally {
        setSearching(false);
      }
    }
    fetchRecommendations();
  }, []);

  function toggleFavorite(p: PharmacyResult) {
    const isFav = favorites.some((f) => f.id === p.id);
    if (isFav) {
      setFavorites(favorites.filter((f) => f.id !== p.id));
    } else {
      if (favorites.length >= 3) {
        alert("You can only select up to 3 favorite pharmacies.");
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
      setError(error.message || "Failed to save network");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="border-t border-hairline pt-6">
        <h2 className="text-lg font-bold text-pine-900">My Pharmacy Network</h2>
        <p className="text-sm text-muted mt-1">
          Select up to 3 local pharmacies to receive your prescriptions directly. Your local recommendations are generated automatically based on your address.
        </p>
      </div>

      <div className="rounded-xl border border-hairline bg-[#f6f8fc] p-5">
        <h3 className="font-semibold text-ink-strong mb-3">Current Favorites ({favorites.length}/3)</h3>
        {favorites.length === 0 ? (
          <p className="text-sm text-muted">No pharmacies selected yet.</p>
        ) : (
          <ul className="space-y-3">
            {favorites.map((f) => (
              <li key={f.id} className="bg-white p-4 rounded-xl border border-hairline shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-bold text-pine-900">{f.name}</span>
                    {f.city && <span className="text-sm text-muted ml-2">{f.city}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => setFavorites(favorites.filter((x) => x.id !== f.id))}
                    className="text-red-500 hover:text-red-700 text-sm font-semibold"
                  >
                    Remove
                  </button>
                </div>
                
                {/* Stock levels display */}
                {f.inventory && f.inventory.length > 0 && (
                  <div className="mt-3 bg-leaf-50 rounded-lg p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-leaf-800 mb-2">Live Stock Levels</p>
                    <div className="flex flex-wrap gap-2">
                      {f.inventory.slice(0, 3).map((item, idx) => (
                        <span key={idx} className="text-xs font-medium bg-white text-ink-strong border border-leaf-200 px-2 py-1 rounded">
                          {item.name}: {item.stockLevel}{item.unit}
                        </span>
                      ))}
                      {f.inventory.length > 3 && (
                        <span className="text-xs font-medium text-leaf-700 py-1">
                          +{f.inventory.length - 3} more strains...
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {f.inventory && f.inventory.length === 0 && (
                  <p className="mt-2 text-xs text-muted italic">Inventory syncing...</p>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || favorites.length === 0}
            className="h-10 rounded-lg bg-pine-600 px-5 font-bold text-white disabled:opacity-50"
          >
            {saved ? "Saved!" : "Save Network"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-ink-strong">Recommended Local Pharmacies</h3>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {searching && <p className="text-sm text-muted">Locating nearby partners...</p>}
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          <ul className="space-y-3">
            {results.map((p) => {
              const isFav = favorites.some((f) => f.id === p.id);
              return (
                <li key={p.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-hairline shadow-sm">
                  <div>
                    <h4 className="font-bold text-pine-900">{p.name}</h4>
                    <p className="text-sm text-muted">
                      {p.street}, {p.postalCode} {p.city}
                    </p>
                    <div className="mt-2 flex gap-3 text-xs font-medium text-ink-strong">
                      <span className="flex items-center gap-1 bg-[#f6f8fc] px-2 py-1 rounded">
                        <span aria-hidden className="msym text-[14px]">location_on</span>
                        {p.distanceKm} km
                      </span>
                      <span className="flex items-center gap-1 bg-leaf-50 px-2 py-1 rounded text-leaf-700">
                        <span aria-hidden className="msym text-[14px]">inventory_2</span>
                        {p.availableStrainsCount} Strains
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(p)}
                    className={`h-10 rounded-lg px-4 font-bold ${
                      isFav
                        ? "bg-[#e8ece9] text-ink-strong"
                        : "bg-pine-100 text-pine-700 hover:bg-pine-200"
                    }`}
                  >
                    {isFav ? "Added" : "Add to Favorites"}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

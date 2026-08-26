"use client";

import { useState } from "react";
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
  initialFavorites: Array<{ id: string; name: string; city: string | null }>;
}>) {
  const t = useTranslations("patient.profile");
  const router = useRouter();
  
  const [postalCode, setPostalCode] = useState("");
  const [radius, setRadius] = useState("30");
  const [results, setResults] = useState<PharmacyResult[]>([]);
  const [searching, setSearching] = useState(false);
  
  const [favorites, setFavorites] = useState(initialFavorites);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!postalCode) return;
    
    setSearching(true);
    setError(null);
    try {
      const res = await api<PharmacyResult[]>(
        `/patient/pharmacies/search?postalCode=${encodeURIComponent(
          postalCode
        )}&radius=${encodeURIComponent(radius)}`
      );
      setResults(res);
    } catch (err: any) {
      setError(err.message || "Search failed");
    } finally {
      setSearching(false);
    }
  }

  function toggleFavorite(p: PharmacyResult) {
    const isFav = favorites.some((f) => f.id === p.id);
    if (isFav) {
      setFavorites(favorites.filter((f) => f.id !== p.id));
    } else {
      if (favorites.length >= 3) {
        alert("You can only select up to 3 favorite pharmacies.");
        return;
      }
      setFavorites([...favorites, { id: p.id, name: p.name, city: p.city }]);
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
    } catch (err: any) {
      setError(err.message || "Failed to remove favorite");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="border-t border-hairline pt-6">
        <h2 className="text-lg font-bold text-pine-900">My Pharmacy Network</h2>
        <p className="text-sm text-muted mt-1">
          Select up to 3 local pharmacies to receive your prescriptions directly.
        </p>
      </div>

      <div className="rounded-xl border border-hairline bg-[#f6f8fc] p-5">
        <h3 className="font-semibold text-ink-strong mb-3">Current Favorites ({favorites.length}/3)</h3>
        {favorites.length === 0 ? (
          <p className="text-sm text-muted">No pharmacies selected yet.</p>
        ) : (
          <ul className="space-y-2">
            {favorites.map((f) => (
              <li key={f.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-hairline">
                <div>
                  <span className="font-medium text-ink-strong">{f.name}</span>
                  {f.city && <span className="text-sm text-muted ml-2">{f.city}</span>}
                </div>
                <button
                  type="button"
                  onClick={() => setFavorites(favorites.filter((x) => x.id !== f.id))}
                  className="text-red-500 hover:text-red-700 text-sm font-semibold"
                >
                  Remove
                </button>
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
        <h3 className="font-semibold text-ink-strong">Find Local Pharmacies</h3>
        <form onSubmit={handleSearch} className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1">
              Postal Code
            </label>
            <input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="e.g. 10115"
              className="h-11 w-full rounded-lg border border-hairline bg-white px-4 outline-none focus:border-pine-600"
              required
            />
          </div>
          <div className="w-32">
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1">
              Radius (km)
            </label>
            <div className="flex h-11 w-full items-center rounded-lg border border-hairline bg-[#f6f8fc] px-4 text-ink-strong opacity-80 cursor-not-allowed">
              30 km
            </div>
          </div>
          <button
            type="submit"
            disabled={searching}
            className="h-11 rounded-lg bg-ink-strong px-5 font-bold text-white disabled:opacity-50"
          >
            Search
          </button>
        </form>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted uppercase tracking-wide">Results</h4>
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

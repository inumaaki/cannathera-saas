"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useRouter } from "@/i18n/navigation";

type InventoryItem = {
  id: string;
  sku: string;
  name: string;
  category: string;
  thc: number | null;
  cbd: number | null;
  unit: string;
  price: number;
  genetics: "Sativa" | "Indica" | "Hybrid";
  inStock: boolean;
  availability?: string;
  imageUrl?: string;
};

type SelectedStrainItem = {
  inventoryId: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  genetics: string;
};

export function PrescriptionUpload({
  favoritePharmacies,
}: Readonly<{
  favoritePharmacies: Array<{ id: string; name: string }>;
}>) {
  const t = useTranslations("patient.prescriptions");
  const router = useRouter();

  const [pharmacyId, setPharmacyId] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pharmacy Inventory for strain selection
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);

  // Selected strains & gram quantities
  const [selectedStrains, setSelectedStrains] = useState<SelectedStrainItem[]>([]);
  const [activeStrainId, setActiveStrainId] = useState<string>("");
  const [activeQuantity, setActiveQuantity] = useState<number>(20);

  // Fallback pharmacies if no favorites yet
  const [fallbackPharmacies, setFallbackPharmacies] = useState<
    Array<{ id: string; name: string; distanceKm?: number }>
  >([]);
  const [loadingFallback, setLoadingFallback] = useState(false);

  useEffect(() => {
    if (!favoritePharmacies || favoritePharmacies.length === 0) {
      setLoadingFallback(true);
      api<Array<{ id: string; name: string; distanceKm: number }>>("/patient/pharmacies/search")
        .then((res) => {
          setFallbackPharmacies(res);
          if (res.length > 0) {
            setPharmacyId(res[0].id);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingFallback(false));
    } else if (favoritePharmacies.length > 0) {
      setPharmacyId(favoritePharmacies[0].id);
    }
  }, [favoritePharmacies]);

  // Load inventory of currently chosen pharmacy
  useEffect(() => {
    if (!pharmacyId) {
      setInventoryItems([]);
      return;
    }

    setLoadingInventory(true);
    api<{ items: InventoryItem[] }>(`/patient/pharmacies/${pharmacyId}/inventory`)
      .then((res) => {
        const items = res?.items || [];
        setInventoryItems(items);
        if (items.length > 0 && !activeStrainId) {
          setActiveStrainId(items[0].id);
        }
      })
      .catch(() => {
        setInventoryItems([]);
      })
      .finally(() => {
        setLoadingInventory(false);
      });
  }, [pharmacyId]);

  function handleAddStrain() {
    if (!activeStrainId) return;
    const item = inventoryItems.find((it) => it.id === activeStrainId);
    if (!item) return;

    setSelectedStrains((prev) => {
      const existing = prev.find((s) => s.inventoryId === item.id);
      if (existing) {
        return prev.map((s) =>
          s.inventoryId === item.id
            ? { ...s, quantity: s.quantity + activeQuantity }
            : s
        );
      }
      return [
        ...prev,
        {
          inventoryId: item.id,
          name: item.name,
          quantity: activeQuantity,
          unit: item.unit || "g",
          price: item.price || 7.95,
          genetics: item.genetics || "Hybrid",
        },
      ];
    });
  }

  function handleUpdateQuantity(inventoryId: string, delta: number) {
    setSelectedStrains((prev) =>
      prev
        .map((s) => {
          if (s.inventoryId === inventoryId) {
            const nextQty = s.quantity + delta;
            return nextQty > 0 ? { ...s, quantity: nextQty } : null;
          }
          return s;
        })
        .filter(Boolean) as SelectedStrainItem[]
    );
  }

  function handleRemoveStrain(inventoryId: string) {
    setSelectedStrains((prev) => prev.filter((s) => s.inventoryId !== inventoryId));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pharmacyId) {
      setError(t("upload.errorNoPharmacy"));
      return;
    }
    if (!file && selectedStrains.length === 0) {
      setError("Bitte laden Sie eine Rezeptdatei hoch oder wählen Sie mindestens eine Sorte mit Grammatur aus.");
      return;
    }

    setPending(true);
    setError(null);

    const postPayload = async (base64String?: string) => {
      try {
        await api("/patient/prescriptions", {
          method: "POST",
          body: {
            pharmacyId,
            note,
            fileUrl: base64String,
            selectedItems: selectedStrains.map((s) => ({
              inventoryId: s.inventoryId,
              name: s.name,
              quantity: s.quantity,
              unit: s.unit,
            })),
          },
        });
        setNote("");
        setFile(null);
        setSelectedStrains([]);
        router.refresh();
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Fehler beim Einreichen des Rezepts");
      } finally {
        setPending(false);
      }
    };

    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64String = event.target?.result as string;
        await postPayload(base64String);
      };
      reader.onerror = () => {
        setError("Fehler beim Lesen der Rezeptdatei.");
        setPending(false);
      };
      reader.readAsDataURL(file);
    } else {
      await postPayload(undefined);
    }
  }

  const availablePharmacies =
    favoritePharmacies && favoritePharmacies.length > 0
      ? favoritePharmacies
      : fallbackPharmacies;

  if (availablePharmacies.length === 0 && !loadingFallback) {
    return (
      <div className="rounded-xl border border-hairline bg-[#f6f8fc] p-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-800 mb-3">
          <span aria-hidden className="msym text-2xl">map</span>
        </div>
        <h3 className="font-bold text-ink-strong text-lg">{t("upload.noFavoritesTitle")}</h3>
        <p className="mt-2 text-sm text-muted max-w-md mx-auto">
          {t("upload.noFavoritesText")}
        </p>
        <button
          type="button"
          onClick={() => router.push("/patient/profile#network")}
          className="mt-4 inline-flex items-center gap-2 h-11 rounded-xl bg-pine-600 px-6 font-bold text-white shadow-sm hover:bg-pine-700 transition-colors"
        >
          <span aria-hidden className="msym text-[18px]">explore</span>
          {t("upload.manageNetwork")} (Karte im 25–30 km Radius)
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-hairline bg-white p-6 space-y-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between border-b border-hairline pb-4 gap-2">
        <div>
          <h3 className="font-display font-bold text-pine-900 text-xl">{t("upload.title")}</h3>
          <p className="text-xs text-muted mt-0.5">
            Wählen Sie Ihre Zielapotheke, Sorten & Grammatur sowie Ihr E-Rezept aus.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/patient/profile#network")}
          className="text-xs font-bold text-pine-600 hover:underline flex items-center gap-1.5"
        >
          <span aria-hidden className="msym text-[16px]">map</span>
          Apotheke auf 25–30 km Karte wählen
        </button>
      </div>

      {/* 1. Apotheke wählen */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
          {t("upload.selectPharmacy")}
        </label>
        <select
          value={pharmacyId}
          onChange={(e) => {
            setPharmacyId(e.target.value);
            setSelectedStrains([]);
          }}
          className="h-11 w-full rounded-xl border border-hairline bg-[#f6f8fc] px-4 text-sm font-semibold text-ink-strong outline-none focus:border-pine-600 focus:bg-white transition-colors"
          required
        >
          <option value="" disabled>
            {t("upload.choosePlaceholder")}
          </option>
          {availablePharmacies.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {"distanceKm" in p ? `(${p.distanceKm} km Entfernung)` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Sortenauswahl & Grammatur direkt aus dem Apotheken-Sortiment */}
      <div className="rounded-xl border border-hairline bg-[#fbfcfd] p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <span aria-hidden className="msym text-[18px]">psychiatry</span>
            </span>
            <div>
              <h4 className="text-sm font-bold text-ink-strong">
                Sortenauswahl & Grammatur
              </h4>
              <p className="text-xs text-muted">
                Wählen Sie die verordneten Blüten-Sorten und spezifischen Grammmengen direkt aus dem Sortiment.
              </p>
            </div>
          </div>
          {loadingInventory && (
            <span className="flex items-center gap-1 text-xs text-muted">
              <span aria-hidden className="msym text-[16px] animate-spin">progress_activity</span>
              Sortiment wird geladen …
            </span>
          )}
        </div>

        {inventoryItems.length > 0 ? (
          <div className="space-y-3 pt-2">
            {/* Strain selector & quantity picker */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-7">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                  Verfügbare Sorte
                </label>
                <select
                  value={activeStrainId}
                  onChange={(e) => setActiveStrainId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-hairline bg-white px-3 text-xs font-medium text-ink-strong outline-none focus:border-pine-600"
                >
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.genetics || "Hybrid"} · {item.thc ? `THC ${item.thc}%` : ""} · {(item.price ?? 0).toFixed(2)} €/{item.unit || "g"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                  Grammatur (Menge)
                </label>
                <div className="flex items-center border border-hairline rounded-lg bg-white overflow-hidden h-10">
                  <button
                    type="button"
                    onClick={() => setActiveQuantity((q) => Math.max(5, q - 5))}
                    className="px-3 h-full hover:bg-slate-100 font-bold text-muted"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={5}
                    max={200}
                    step={5}
                    value={activeQuantity}
                    onChange={(e) => setActiveQuantity(Math.max(5, Number(e.target.value) || 5))}
                    className="w-full text-center text-xs font-bold text-ink-strong outline-none"
                  />
                  <span className="pr-2 text-xs font-medium text-muted">g</span>
                  <button
                    type="button"
                    onClick={() => setActiveQuantity((q) => q + 5)}
                    className="px-3 h-full hover:bg-slate-100 font-bold text-muted"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddStrain}
                  className="h-10 w-full rounded-lg bg-emerald-600 font-bold text-xs text-white shadow-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1"
                >
                  <span aria-hidden className="msym text-[16px]">add</span>
                  Hinzufügen
                </button>
              </div>
            </div>

            {/* Quick Chips Presets */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-muted font-medium">Schnellauswahl:</span>
              {[15, 20, 30, 50].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => setActiveQuantity(qty)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                    activeQuantity === qty
                      ? "bg-pine-600 text-white"
                      : "bg-white border border-hairline text-ink-strong hover:bg-slate-100"
                  }`}
                >
                  {qty} g
                </button>
              ))}
            </div>

            {/* Selected Strains List */}
            {selectedStrains.length > 0 && (
              <div className="mt-4 space-y-2 border-t border-hairline pt-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                  Ausgewählte Sorten ({selectedStrains.length}):
                </p>
                <div className="grid gap-2">
                  {selectedStrains.map((strain) => (
                    <div
                      key={strain.inventoryId}
                      className="flex items-center justify-between rounded-xl border border-emerald-200 bg-white p-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                          <span aria-hidden className="msym text-[18px]">spa</span>
                        </span>
                        <div>
                          <p className="font-bold text-xs text-ink-strong">{strain.name}</p>
                          <span className="text-[10px] text-muted">
                            {strain.genetics} · {(strain.price * strain.quantity).toFixed(2)} € ca.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-hairline rounded-lg bg-[#f8fafc] text-xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(strain.inventoryId, -5)}
                            className="px-2 py-1 font-bold text-muted hover:bg-slate-200"
                          >
                            −
                          </button>
                          <span className="px-2 font-bold text-emerald-900">
                            {strain.quantity} {strain.unit}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(strain.inventoryId, 5)}
                            className="px-2 py-1 font-bold text-muted hover:bg-slate-200"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveStrain(strain.inventoryId)}
                          className="size-7 rounded-lg text-muted hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors"
                          title="Sorte entfernen"
                        >
                          <span aria-hidden className="msym text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted italic">
            Für diese Apotheke stehen aktuell keine Produkte im Live-Katalog zur Verfügung. Sie können das E-Rezept dennoch hochladen.
          </p>
        )}
      </div>

      {/* 3. Rezeptdatei hochladen */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
          {t("upload.selectFile")} {selectedStrains.length > 0 ? "(Optional bei digitaler Sortenauswahl)" : ""}
        </label>
        <div className="relative flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-hairline bg-[#f6f8fc] hover:bg-gray-50 transition-colors">
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="absolute inset-0 z-10 w-full opacity-0 cursor-pointer"
          />
          <span aria-hidden className="msym text-pine-600 text-3xl mb-2">upload_file</span>
          <p className="text-sm font-semibold text-ink-strong">
            {file ? file.name : t("upload.filePlaceholder")}
          </p>
          <p className="text-xs text-muted mt-1">
            Unterstützt PDF, JPG, PNG (E-Rezept Scan oder Foto)
          </p>
        </div>
      </div>

      {/* 4. Notiz an die Apotheke */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
          {t("upload.noteLabel")}
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-hairline bg-[#f6f8fc] p-3 text-xs text-ink-strong outline-none focus:border-pine-600 focus:bg-white"
          placeholder={t("upload.notePlaceholder")}
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 font-medium">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-xl bg-pine-600 font-bold text-sm text-white shadow-sm transition-colors hover:bg-pine-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {pending ? (
          <>
            <span aria-hidden className="msym animate-spin text-[20px]">progress_activity</span>
            {t("upload.submitting")}
          </>
        ) : (
          <>
            <span aria-hidden className="msym text-[20px]">send</span>
            {selectedStrains.length > 0
              ? `Rezept mit ${selectedStrains.length} Sorte(n) an Apotheke übermitteln`
              : t("upload.submit")}
          </>
        )}
      </button>
    </form>
  );
}

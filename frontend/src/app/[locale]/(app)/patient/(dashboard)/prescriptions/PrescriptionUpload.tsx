"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useRouter } from "@/i18n/navigation";

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pharmacyId) {
      setError(t("upload.errorNoPharmacy"));
      return;
    }
    if (!file) {
      setError(t("upload.errorNoFile"));
      return;
    }

    setPending(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target?.result as string;
      try {
        await api("/patient/prescriptions", {
          method: "POST",
          body: {
            pharmacyId,
            note,
            fileUrl: base64String,
          },
        });
        setNote("");
        setFile(null);
        router.refresh();
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Failed to upload prescription");
      } finally {
        setPending(false);
      }
    };
    reader.onerror = () => {
      setError("Failed to read file.");
      setPending(false);
    };
    reader.readAsDataURL(file);
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
    <form onSubmit={handleSubmit} className="rounded-xl border border-hairline bg-white p-5 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between border-b border-hairline pb-2 gap-2">
        <h3 className="font-bold text-pine-900 text-xl">{t("upload.title")}</h3>
        <button
          type="button"
          onClick={() => router.push("/patient/profile#network")}
          className="text-xs font-bold text-pine-600 hover:underline flex items-center gap-1"
        >
          <span aria-hidden className="msym text-[15px]">map</span>
          Apotheke auf 25–30 km Karte wählen
        </button>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1">
          {t("upload.selectPharmacy")}
        </label>
        <select
          value={pharmacyId}
          onChange={(e) => setPharmacyId(e.target.value)}
          className="h-11 w-full rounded-lg border border-hairline bg-[#f6f8fc] px-4 text-ink-strong outline-none focus:border-pine-600 focus:bg-white transition-colors"
          required
        >
          <option value="" disabled>
            {t("upload.choosePlaceholder")}
          </option>
          {availablePharmacies.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {"distanceKm" in p ? `(${p.distanceKm} km)` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1">
          {t("upload.selectFile")}
        </label>
        <div className="relative flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-hairline bg-[#f6f8fc] hover:bg-gray-50 transition-colors">
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="absolute inset-0 z-10 w-full opacity-0 cursor-pointer"
            required
          />
          <span aria-hidden className="msym text-pine-600 text-3xl mb-2">upload_file</span>
          <p className="text-sm font-medium text-ink-strong">
            {file ? file.name : t("upload.filePlaceholder")}
          </p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1">
          {t("upload.noteLabel")}
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-hairline bg-[#f6f8fc] p-3 text-ink-strong outline-none focus:border-pine-600"
          placeholder={t("upload.notePlaceholder")}
        />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-lg bg-pine-600 font-bold text-white transition-colors hover:bg-pine-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {pending ? (
          <>
            <span aria-hidden className="msym animate-spin text-[20px]">progress_activity</span>
            {t("upload.submitting")}
          </>
        ) : (
          <>
            <span aria-hidden className="msym text-[20px]">send</span>
            {t("upload.submit")}
          </>
        )}
      </button>
    </form>
  );
}

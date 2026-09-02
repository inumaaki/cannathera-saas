"use client";

import { useState } from "react";
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
              fileUrl: base64String, // Send base64 data string
            },
          });
          setNote("");
          setPharmacyId("");
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

  if (!favoritePharmacies || favoritePharmacies.length === 0) {
    return (
      <div className="rounded-xl border border-hairline bg-[#f6f8fc] p-6 text-center">
        <h3 className="font-bold text-ink-strong">{t("upload.noFavoritesTitle")}</h3>
        <p className="mt-2 text-sm text-muted">
          {t("upload.noFavoritesText")}
        </p>
        <button
          onClick={() => router.push("/patient/profile#network")}
          className="mt-4 h-10 rounded-lg bg-pine-600 px-5 font-bold text-white"
        >
          {t("upload.manageNetwork")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-hairline bg-white p-5 space-y-4 shadow-sm">
      <h3 className="font-bold text-pine-900 text-xl border-b border-hairline pb-2">{t("upload.title")}</h3>
      
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
          {favoritePharmacies.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
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

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
      setError("Please select a pharmacy from your favorites.");
      return;
    }
    if (!file) {
      setError("Please select a prescription file to upload.");
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
        <h3 className="font-bold text-ink-strong">No Favorite Pharmacies</h3>
        <p className="mt-2 text-sm text-muted">
          You must add at least one pharmacy to your favorites before you can upload a prescription.
        </p>
        <button
          onClick={() => router.push("/patient/profile#network")}
          className="mt-4 h-10 rounded-lg bg-pine-600 px-5 font-bold text-white"
        >
          Manage Network
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-hairline bg-white p-5 space-y-4 shadow-sm">
      <h3 className="font-bold text-pine-900 text-xl border-b border-hairline pb-2">Upload New Prescription</h3>
      
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1">
          Select Pharmacy
        </label>
        <select
          value={pharmacyId}
          onChange={(e) => setPharmacyId(e.target.value)}
          className="h-11 w-full rounded-lg border border-hairline bg-[#f6f8fc] px-4 text-ink-strong outline-none focus:border-pine-600 focus:bg-white transition-colors"
          required
        >
          <option value="" disabled>
            -- Choose from your favorites --
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
          Prescription File (PDF, JPG, PNG)
        </label>
        <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-pine-200 bg-[#f6f8fc] text-muted hover:bg-pine-50 hover:border-pine-400 transition-colors">
          <span aria-hidden className="msym text-[32px] mb-2 text-pine-600">upload_file</span>
          <span className="text-sm font-medium text-pine-900">
            {file ? file.name : "Click to select a file"}
          </span>
          <input 
            type="file" 
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden" 
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1">
          Optional Note for Pharmacist
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="h-20 w-full resize-none rounded-lg border border-hairline bg-[#f6f8fc] p-3 text-ink-strong outline-none focus:border-pine-600"
          placeholder="E.g. Please split into multiple smaller jars."
        />
      </div>

      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={pending || !pharmacyId}
          className="h-11 rounded-lg bg-pine-600 px-6 font-bold text-white disabled:opacity-50"
        >
          {pending ? "Uploading..." : "Submit Prescription"}
        </button>
      </div>
    </form>
  );
}

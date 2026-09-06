"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useRouter } from "@/i18n/navigation";

export function PrescriptionStatusEditor({
  id,
  currentStatus,
}: Readonly<{
  id: string;
  currentStatus: string;
}>) {
  const t = useTranslations("pharmacy.prescriptions");
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [isEditing, setIsEditing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statuses = ["RECEIVED", "PREPARING", "READY", "COMPLETED", "CANCELLED"];

  const statusColors: Record<string, string> = {
    RECEIVED: "bg-blue-100 text-blue-800",
    PREPARING: "bg-amber-100 text-amber-800",
    READY: "bg-emerald-100 text-emerald-800",
    COMPLETED: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  const getStatusLabel = (s: string) => {
    try {
      return t(`status_${s}` as any);
    } catch {
      return s;
    }
  };

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (status === "CANCELLED" && !rejectionReason) {
      setError(t("reasonRequired"));
      return;
    }

    setPending(true);
    setError(null);
    try {
      await api(`/pharmacy/prescriptions/${id}/status`, {
        method: "PATCH",
        body: { status, rejectionReason: status === "CANCELLED" ? rejectionReason : undefined },
      });
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      const errObj = err as Error;
      setError(errObj.message || "Fehler beim Aktualisieren des Rezeptstatus");
      setPending(false);
    }
  }

  if (!isEditing) {
    return (
      <div className="flex items-center gap-3">
        <span className={`px-3 py-1.5 rounded-md text-xs font-bold ${statusColors[currentStatus] || "bg-gray-100 text-gray-800"}`}>
          {getStatusLabel(currentStatus)}
        </span>
        <button
          onClick={() => setIsEditing(true)}
          className="text-sm font-semibold text-pine-600 hover:text-pine-800 transition-colors"
        >
          {t("change")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="bg-[#f6f8fc] p-4 rounded-xl border border-hairline relative text-left">
      <div className="flex gap-2 mb-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-lg border border-hairline bg-white px-3 text-sm font-medium outline-none focus:border-pine-600 flex-1"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {getStatusLabel(s)}
            </option>
          ))}
        </select>
      </div>

      {status === "CANCELLED" && (
        <div className="mb-3">
          <label className="block text-xs font-bold text-red-700 mb-1">
            {t("reasonLabel")}
          </label>
          <input
            type="text"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder={t("reasonPlaceholder")}
            className="h-10 w-full rounded-lg border border-red-200 bg-white px-3 text-sm outline-none focus:border-red-500"
            required
          />
        </div>
      )}

      {error && <p className="mb-3 text-xs font-bold text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setIsEditing(false);
            setStatus(currentStatus);
            setRejectionReason("");
            setError(null);
          }}
          className="h-8 px-3 rounded-lg text-xs font-bold text-ink-strong hover:bg-black/5"
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          disabled={pending || (status === "CANCELLED" && !rejectionReason)}
          className="h-8 px-4 rounded-lg bg-pine-600 text-xs font-bold text-white disabled:opacity-50"
        >
          {pending ? t("saving") : t("saveStatus")}
        </button>
      </div>
    </form>
  );
}

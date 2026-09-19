"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";

type PatientOption = {
  id: string;
  name: string;
  email: string;
};

export function AssignPatientButton({ prescriptionId }: Readonly<{ prescriptionId: string }>) {
  const t = useTranslations("pharmacy.prescriptions");
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleOpen() {
    setIsOpen(true);
    setLoading(true);
    try {
      const list = await api<PatientOption[]>("/pharmacy/patients");
      setPatients(list || []);
      if (list && list.length > 0) {
        setSelectedPatientId(list[0].id);
      }
    } catch {
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPatientId) return;

    setSaving(true);
    try {
      await api(`/pharmacy/prescriptions/${prescriptionId}/assign-patient`, {
        method: "PATCH",
        body: { patientId: selectedPatientId },
      });
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      const e = err as Error;
      alert(e.message || "Fehler beim Zuweisen des Patienten");
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        type="button"
        className="text-xs font-bold bg-white text-red-600 border border-red-200 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors shadow-xs"
      >
        {t("assignPatient")}
      </button>
    );
  }

  return (
    <form onSubmit={handleAssign} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-red-200 shadow-sm">
      {loading ? (
        <span className="text-xs text-muted">Laden...</span>
      ) : patients.length === 0 ? (
        <span className="text-xs text-muted">Keine Patienten gefunden</span>
      ) : (
        <select
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
          className="h-8 rounded border border-hairline bg-surface px-2 text-xs font-medium outline-none focus:border-pine-600 max-w-[160px]"
        >
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}

      <button
        type="submit"
        disabled={saving || !selectedPatientId}
        className="h-8 px-3 rounded bg-pine-600 text-xs font-bold text-white hover:bg-pine-700 disabled:opacity-50"
      >
        {saving ? "..." : "Zuweisen"}
      </button>

      <button
        type="button"
        onClick={() => setIsOpen(false)}
        className="h-8 px-2 text-xs text-muted hover:text-ink-strong"
      >
        ✕
      </button>
    </form>
  );
}

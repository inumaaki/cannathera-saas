"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";

export function RescheduleButton({
  sessionId,
}: Readonly<{ sessionId: string | null }>) {
  const t = useTranslations("doctor.briefing");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  if (!sessionId) return null;

  async function handleSave() {
    if (!value) return;
    setPending(true);
    try {
      await api(`/doctor/appointments/${sessionId}`, {
        method: "PATCH",
        body: { scheduledAt: new Date(value).toISOString() },
      });
      setDone(true);
      setOpen(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-12 rounded-xl border border-hairline px-5 font-bold text-ink-strong hover:bg-surface"
      >
        {done ? t("rescheduled") : t("reschedule")}
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <label htmlFor="reschedule-at" className="text-sm font-semibold text-muted">
        {t("pickTime")}
      </label>
      <input
        id="reschedule-at"
        type="datetime-local"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-12 rounded-lg border border-hairline px-3 text-sm text-ink-strong outline-none focus:border-pine-600"
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={pending || !value}
        className="h-12 rounded-xl bg-pine-600 px-4 font-bold text-white disabled:opacity-50"
      >
        {t("rescheduleSave")}
      </button>
    </span>
  );
}

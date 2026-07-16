"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";

/* Join + reschedule for the patient's own appointment. */
export function AppointmentActions({
  sessionId,
  joinUrl,
}: Readonly<{ sessionId: string; joinUrl: string | null }>) {
  const t = useTranslations("patient.appointments");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSave() {
    if (!value) return;
    setPending(true);
    try {
      await api(`/patient/appointments/${sessionId}`, {
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

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap gap-3">
        {joinUrl ? (
          <a
            href={joinUrl}
            target="_blank"
            rel="noreferrer"
            className="flex h-12 items-center gap-2 rounded-xl bg-[#0c3527] px-5 font-bold text-white"
          >
            <span aria-hidden className="msym text-[18px]">
              videocam
            </span>
            {t("joinCall")}
          </a>
        ) : (
          <span
            title={t("noLink")}
            className="flex h-12 cursor-not-allowed items-center gap-2 rounded-xl bg-[#0c3527]/40 px-5 font-bold text-white"
          >
            <span aria-hidden className="msym text-[18px]">
              videocam
            </span>
            {t("joinCall")}
          </span>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="h-12 rounded-xl border border-hairline px-5 font-bold text-ink-strong hover:bg-surface"
        >
          {done ? t("rescheduled") : t("reschedule")}
        </button>
      </div>
      {!joinUrl ? <p className="text-xs text-muted">{t("noLink")}</p> : null}
      {open ? (
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={`resch-${sessionId}`} className="text-sm font-semibold text-muted">
            {t("pickTime")}
          </label>
          <input
            id={`resch-${sessionId}`}
            type="datetime-local"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-11 rounded-lg border border-hairline px-3 text-sm text-ink-strong outline-none focus:border-pine-600"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={pending || !value}
            className="h-11 rounded-lg bg-pine-600 px-4 font-bold text-white disabled:opacity-50"
          >
            {t("save")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

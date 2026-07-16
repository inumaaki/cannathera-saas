"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";

export function AddNoteForm({ patientId }: Readonly<{ patientId: string }>) {
  const t = useTranslations("doctor.patient");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSave() {
    if (text.trim().length < 2) return;
    setPending(true);
    try {
      await api(`/doctor/patients/${patientId}/notes`, {
        method: "POST",
        body: { text: text.trim() },
      });
      setText("");
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
        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand font-bold text-white hover:bg-pine"
      >
        <span aria-hidden className="msym text-[20px]">
          edit_note
        </span>
        {t("addNote")}
      </button>
    );
  }

  return (
    <div className="mt-6 text-start">
      <textarea
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("notePlaceholder")}
        autoFocus
        className="w-full rounded-lg border border-hairline bg-white px-4 py-3 text-sm text-ink-strong outline-none focus:border-pine-600 focus:ring-2 focus:ring-pine-600/20"
      />
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={pending || text.trim().length < 2}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-brand font-bold text-white hover:bg-pine disabled:opacity-50"
        >
          <span aria-hidden className="msym text-[18px]">
            save
          </span>
          {t("noteSave")}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-11 rounded-lg px-4 font-bold text-ink-strong hover:bg-surface"
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}

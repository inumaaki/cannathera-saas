"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";

export function SafeguardModal() {
  const t = useTranslations("patient.safeguardModal");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(true);

  async function handleConfirm() {
    setBusy(true);
    try {
      await api("/patient/profile", {
        method: "PATCH",
        body: { safeguardAcknowledged: true },
      });
      setOpen(false);
      router.refresh();
    } catch (e) {
      console.error("Failed to acknowledge safeguard", e);
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 cursor-default bg-pine/60 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="safeguard-title"
        className="relative z-10 w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-hairline pb-4">
          <span aria-hidden className="msym text-[28px] text-accent">
            warning
          </span>
          <h3 id="safeguard-title" className="font-display text-xl font-bold text-pine">
            {t("title")}
          </h3>
        </div>
        <div className="py-6">
          <p className="text-base leading-relaxed text-ink-strong">
            {t("description")}
          </p>
        </div>
        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={busy}
            onClick={handleConfirm}
            className="rounded-xl bg-pine-600 px-6 py-3 font-bold uppercase tracking-wide text-white hover:bg-pine focus:ring-4 focus:ring-pine/20 disabled:opacity-60"
          >
            {busy ? "..." : t("confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

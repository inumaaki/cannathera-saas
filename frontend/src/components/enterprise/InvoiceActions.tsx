"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api, ApiError } from "@/lib/api";

/* Closes the previous month into an invoice (Figma 8.2). */
export function GenerateInvoiceButton() {
  const t = useTranslations("enterprise.billing");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      await api("/enterprise/billing/invoices", { method: "POST" });
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.code : "ERROR");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-end">
      <button
        type="button"
        onClick={generate}
        disabled={busy}
        className="flex items-center gap-2 rounded-lg border border-pine-600 px-4 py-2.5 text-sm font-bold text-pine-600 hover:bg-mint/20 disabled:opacity-60"
      >
        <span aria-hidden className="msym text-[18px]">
          receipt_long
        </span>
        {t("generate")}
      </button>
      {error ? (
        <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>
      ) : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api, ApiError } from "@/lib/api";

/* "Jetzt nachbestellen" on the stock-shortage banner (Figma 6.6).
   Orders the suggested quantity in one click — the table's dialog is the
   route for choosing a different amount. */
export function ReorderButton({
  itemId,
  pendingOrder,
  suggestedQty,
}: Readonly<{ itemId: string; pendingOrder: boolean; suggestedQty: number }>) {
  const t = useTranslations("pharmacy.inventory");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reorder() {
    setBusy(true);
    setError(null);
    try {
      await api(`/pharmacy/inventory/${itemId}/reorder`, {
        method: "POST",
        body: { qty: suggestedQty },
      });
      router.refresh();
    } catch (e) {
      const code = e instanceof ApiError ? e.code : "ERROR";
      const key = `errors.${code}`;
      const text = t(key);
      setError(text === key ? t("errors.ERROR") : text);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-end">
      <button
        type="button"
        onClick={reorder}
        disabled={busy || pendingOrder}
        className="rounded-lg bg-mint-bright px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-pine hover:bg-mint disabled:bg-white/15 disabled:text-white/70"
      >
        {pendingOrder ? t("ordered") : t("resolve")}
      </button>
      {error ? (
        <p className="mt-1 max-w-48 text-xs font-semibold text-mint-bright">{error}</p>
      ) : null}
    </div>
  );
}

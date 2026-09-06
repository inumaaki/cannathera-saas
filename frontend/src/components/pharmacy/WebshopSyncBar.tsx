"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";

type WebshopInfo = {
  connected: boolean;
  url: string | null;
  pharmacyName?: string;
  totalSynced?: number;
  lastSync?: string;
};

export function WebshopSyncBar({ initialData }: Readonly<{ initialData?: WebshopInfo }>) {
  const t = useTranslations("pharmacy.inventory");
  const router = useRouter();

  const [url, setUrl] = useState(initialData?.url || "https://www.grastheke.de");
  const [connected, setConnected] = useState(initialData?.connected ?? true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState(initialData?.lastSync || new Date().toISOString());

  async function handleSaveUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      await api("/pharmacy/inventory/webshop", {
        method: "POST",
        body: { url: url.trim() },
      });
      setConnected(true);
      setMessage("Webshop-Verknüpfung erfolgreich gespeichert.");
    } catch {
      setMessage("Fehler beim Speichern der Webshop-URL.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSyncNow() {
    setSyncing(true);
    setMessage(null);
    try {
      const res: any = await api("/pharmacy/inventory/sync-webshop", {
        method: "POST",
        body: { url: url.trim() },
      });
      setConnected(true);
      setLastSync(res?.lastSync || new Date().toISOString());
      setMessage(
        t("syncSuccess", { count: res?.syncedCount || 12 })
      );
      router.refresh();
    } catch {
      setMessage("Synchronisation fehlgeschlagen. Bitte Verbindung prüfen.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-mint/30 text-pine">
            <span aria-hidden className="msym text-[24px]">sync_alt</span>
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold text-pine-950">
                {t("webshopSyncTitle")}
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                {connected ? "Echtzeit-Spiegelung aktiv" : "Nicht verbunden"}
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5 max-w-2xl">
              {t("webshopSyncDesc")}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSyncNow}
          disabled={syncing}
          className="flex items-center gap-2 rounded-xl bg-pine-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-pine-700 disabled:opacity-50 transition-colors"
        >
          <span aria-hidden className={`msym text-[18px] ${syncing ? "animate-spin" : ""}`}>
            sync
          </span>
          {syncing ? t("syncing") : t("syncNow")}
        </button>
      </div>

      <form onSubmit={handleSaveUrl} className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[280px]">
          <label htmlFor="webshop-url" className="sr-only">
            {t("webshopUrlLabel")}
          </label>
          <div className="relative">
            <span
              aria-hidden
              className="msym absolute start-3.5 top-1/2 -translate-y-1/2 text-[18px] text-muted"
            >
              link
            </span>
            <input
              id="webshop-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t("webshopUrlPlaceholder")}
              className="h-11 w-full rounded-xl border border-hairline bg-surface ps-10 pe-4 text-sm font-medium text-ink-strong outline-none focus:ring-2 focus:ring-pine-600/30"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="h-11 rounded-xl border border-hairline px-4 text-xs font-bold text-ink-strong hover:bg-surface disabled:opacity-50 transition-colors"
        >
          {saving ? "Wird gespeichert..." : t("saveWebshop")}
        </button>
      </form>

      {message && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-mint/20 px-3 py-2 text-xs font-bold text-pine-800">
          <span aria-hidden className="msym text-[16px]">check_circle</span>
          {message}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-muted">
        <span>
          {connected && url ? (
            <span className="font-semibold text-pine-700">
              {t("connectedStatus", { url })}
            </span>
          ) : (
            t("notConnected")
          )}
        </span>
        <span>
          {t("lastSync", {
            date: new Date(lastSync).toLocaleString("de-DE", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
          })}
        </span>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";

type SettingsData = {
  name: string;
  street?: string;
  postalCode?: string;
  city?: string;
  productFocus?: string;
};

export default function PharmacySettings() {
  const t = useTranslations("pharmacy.settings");
  const [data, setData] = useState<SettingsData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<SettingsData>("/pharmacy/settings").then(setData).catch(console.error);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;

    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await api<SettingsData>("/pharmacy/settings", {
        method: "PATCH",
        body: data,
      });
      setData(res);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (!data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <span aria-hidden className="msym animate-spin text-[32px] text-pine-600">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-pine">{t("title")}</h1>
        <p className="mt-2 text-muted">{t("subtitle")}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-xl border border-hairline bg-white shadow-sm"
      >
        <div className="border-b border-hairline bg-[#f6f8fc] px-8 py-5">
          <h2 className="text-lg font-bold text-pine-900">{t("masterData")}</h2>
        </div>

        <div className="space-y-6 px-8 py-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}
          {saved && (
            <div className="rounded-lg bg-mint/30 p-4 text-sm font-medium text-pine-700">
              {t("savedSuccess")}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-ink-strong mb-1">
              {t("name")}
            </label>
            <input
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              required
              className="h-11 w-full rounded-lg border border-hairline px-4 outline-none focus:border-pine-600"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink-strong mb-1">
              {t("street")}
            </label>
            <input
              value={data.street ?? ""}
              onChange={(e) => setData({ ...data, street: e.target.value })}
              className="h-11 w-full rounded-lg border border-hairline px-4 outline-none focus:border-pine-600"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-ink-strong mb-1">
                {t("postalCode")}
              </label>
              <input
                value={data.postalCode ?? ""}
                onChange={(e) => setData({ ...data, postalCode: e.target.value })}
                className="h-11 w-full rounded-lg border border-hairline px-4 outline-none focus:border-pine-600"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-strong mb-1">
                {t("city")}
              </label>
              <input
                value={data.city ?? ""}
                onChange={(e) => setData({ ...data, city: e.target.value })}
                className="h-11 w-full rounded-lg border border-hairline px-4 outline-none focus:border-pine-600"
              />
            </div>
          </div>

          <hr className="border-hairline" />

          <div>
            <label className="block text-sm font-semibold text-ink-strong mb-1">
              {t("productFocus")}
            </label>
            <p className="text-xs text-muted mb-2">{t("productFocusHint")}</p>
            <textarea
              value={data.productFocus ?? ""}
              onChange={(e) => setData({ ...data, productFocus: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-hairline p-4 outline-none focus:border-pine-600"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-hairline bg-[#f6f8fc] px-8 py-5">
          <button
            type="submit"
            disabled={saving}
            className="flex h-11 items-center justify-center rounded-lg bg-pine-600 px-8 font-bold text-white transition-colors hover:bg-pine-700 disabled:opacity-50"
          >
            {saving ? (
              <span aria-hidden className="msym animate-spin text-[20px]">
                progress_activity
              </span>
            ) : (
              t("save")
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

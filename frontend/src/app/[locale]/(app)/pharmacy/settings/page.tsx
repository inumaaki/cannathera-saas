"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";

type OperatingHour = {
  day: string;
  open: string;
  close: string;
  closed: boolean;
};

type SettingsData = {
  name: string;
  street?: string;
  postalCode?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  productFocus?: string;
  operatingHours?: any;
};

const DAYS_OF_WEEK = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
];

const miniInput =
  "h-9 rounded-lg border border-hairline bg-white px-2.5 text-xs text-ink-strong outline-none focus:border-pine-600 focus:ring-2 focus:ring-pine-600/20 disabled:bg-surface disabled:text-muted";

function parseInitialHours(raw: any): OperatingHour[] {
  if (Array.isArray(raw) && raw.length > 0) {
    return DAYS_OF_WEEK.map((dayName) => {
      const match = raw.find((r: any) => {
        if (!r?.day) return false;
        const d = String(r.day).toLowerCase();
        const target = dayName.toLowerCase();
        return (
          d === target ||
          (d === "mo" && target === "montag") ||
          (d === "di" && target === "dienstag") ||
          (d === "mi" && target === "mittwoch") ||
          (d === "do" && target === "donnerstag") ||
          (d === "fr" && target === "freitag") ||
          (d === "sa" && target === "samstag") ||
          (d === "so" && target === "sonntag")
        );
      });

      if (match) {
        const isClosed =
          match.closed === true ||
          match.open === "Geschlossen" ||
          !match.open;
        return {
          day: dayName,
          open: isClosed ? "08:00" : String(match.open || "08:00"),
          close: isClosed ? "18:30" : String(match.close || "18:30"),
          closed: isClosed,
        };
      }

      const isSunday = dayName === "Sonntag";
      return {
        day: dayName,
        open: dayName === "Samstag" ? "09:00" : "08:00",
        close: dayName === "Samstag" ? "13:00" : "18:30",
        closed: isSunday,
      };
    });
  }

  // Standard pharmacy schedule in Germany
  return [
    { day: "Montag", open: "08:00", close: "18:30", closed: false },
    { day: "Dienstag", open: "08:00", close: "18:30", closed: false },
    { day: "Mittwoch", open: "08:00", close: "18:30", closed: false },
    { day: "Donnerstag", open: "08:00", close: "18:30", closed: false },
    { day: "Freitag", open: "08:00", close: "18:30", closed: false },
    { day: "Samstag", open: "09:00", close: "13:00", closed: false },
    { day: "Sonntag", open: "Geschlossen", close: "", closed: true },
  ];
}

export default function PharmacySettings() {
  const t = useTranslations("pharmacy.settings");
  const [data, setData] = useState<SettingsData | null>(null);
  const [hours, setHours] = useState<OperatingHour[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<SettingsData>("/pharmacy/settings")
      .then((res) => {
        setData(res);
        setHours(parseInitialHours(res.operatingHours));
      })
      .catch((err) => {
        console.error(err);
        setError("Fehler beim Laden der Einstellungen.");
      });
  }, []);

  const updateHour = (
    index: number,
    field: keyof OperatingHour,
    value: string | boolean
  ) => {
    setHours((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const applyPreset = (preset: "standard" | "continuous") => {
    if (preset === "standard") {
      setHours([
        { day: "Montag", open: "08:00", close: "18:30", closed: false },
        { day: "Dienstag", open: "08:00", close: "18:30", closed: false },
        { day: "Mittwoch", open: "08:00", close: "18:30", closed: false },
        { day: "Donnerstag", open: "08:00", close: "18:30", closed: false },
        { day: "Freitag", open: "08:00", close: "18:30", closed: false },
        { day: "Samstag", open: "09:00", close: "13:00", closed: false },
        { day: "Sonntag", open: "Geschlossen", close: "", closed: true },
      ]);
    } else {
      setHours([
        { day: "Montag", open: "08:00", close: "20:00", closed: false },
        { day: "Dienstag", open: "08:00", close: "20:00", closed: false },
        { day: "Mittwoch", open: "08:00", close: "20:00", closed: false },
        { day: "Donnerstag", open: "08:00", close: "20:00", closed: false },
        { day: "Freitag", open: "08:00", close: "20:00", closed: false },
        { day: "Samstag", open: "08:00", close: "20:00", closed: false },
        { day: "Sonntag", open: "Geschlossen", close: "", closed: true },
      ]);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;

    // Validate mandatory opening hours: at least one day open
    const hasOpenDay = hours.some((h) => !h.closed && h.open.trim() !== "");
    if (!hasOpenDay) {
      setError(t("openingHoursRequired"));
      return;
    }

    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const payloadHours = hours.map((h) => ({
        day: h.day,
        open: h.closed ? "Geschlossen" : h.open,
        close: h.closed ? "" : h.close,
        closed: h.closed,
      }));

      const res = await api<SettingsData>("/pharmacy/settings", {
        method: "PATCH",
        body: {
          ...data,
          operatingHours: payloadHours,
        },
      });

      setData(res);
      setHours(parseInitialHours(res.operatingHours));
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err: unknown) {
      setError((err as Error).message || "Fehler beim Speichern der Einstellungen.");
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
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink-strong">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
            <span className="msym text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 rounded-xl border border-pine/20 bg-pine-50 p-4 text-sm font-semibold text-pine-700">
            <span className="msym text-[18px]">check_circle</span>
            <span>{t("savedSuccess")}</span>
          </div>
        )}

        {/* Master & Contact Data */}
        <div className="overflow-hidden rounded-xl border border-hairline bg-white shadow-sm">
          <div className="border-b border-hairline bg-[#f6f8fc] px-6 py-4">
            <h2 className="flex items-center gap-2 text-base font-bold text-pine-900">
              <span className="msym text-[20px] text-pine">store</span>
              {t("masterData")}
            </h2>
          </div>

          <div className="space-y-5 p-6">
            <div>
              <label className="block text-sm font-semibold text-ink-strong mb-1">
                {t("name")} *
              </label>
              <input
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                required
                className="h-11 w-full rounded-lg border border-hairline bg-white px-4 text-sm text-ink-strong outline-none focus:border-pine-600 focus:ring-2 focus:ring-pine-600/20"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-strong mb-1">
                {t("street")} *
              </label>
              <input
                value={data.street ?? ""}
                onChange={(e) => setData({ ...data, street: e.target.value })}
                required
                className="h-11 w-full rounded-lg border border-hairline bg-white px-4 text-sm text-ink-strong outline-none focus:border-pine-600 focus:ring-2 focus:ring-pine-600/20"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-ink-strong mb-1">
                  {t("postalCode")} *
                </label>
                <input
                  value={data.postalCode ?? ""}
                  onChange={(e) =>
                    setData({ ...data, postalCode: e.target.value })
                  }
                  required
                  className="h-11 w-full rounded-lg border border-hairline bg-white px-4 text-sm text-ink-strong outline-none focus:border-pine-600 focus:ring-2 focus:ring-pine-600/20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-strong mb-1">
                  {t("city")} *
                </label>
                <input
                  value={data.city ?? ""}
                  onChange={(e) => setData({ ...data, city: e.target.value })}
                  required
                  className="h-11 w-full rounded-lg border border-hairline bg-white px-4 text-sm text-ink-strong outline-none focus:border-pine-600 focus:ring-2 focus:ring-pine-600/20"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-semibold text-ink-strong mb-1">
                  {t("phone")}
                </label>
                <input
                  type="tel"
                  value={data.phone ?? ""}
                  onChange={(e) => setData({ ...data, phone: e.target.value })}
                  placeholder="+49 ..."
                  className="h-11 w-full rounded-lg border border-hairline bg-white px-4 text-sm text-ink-strong outline-none focus:border-pine-600 focus:ring-2 focus:ring-pine-600/20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-strong mb-1">
                  {t("email")}
                </label>
                <input
                  type="email"
                  value={data.email ?? ""}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  placeholder="kontakt@apotheke.de"
                  className="h-11 w-full rounded-lg border border-hairline bg-white px-4 text-sm text-ink-strong outline-none focus:border-pine-600 focus:ring-2 focus:ring-pine-600/20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-strong mb-1">
                  {t("website")}
                </label>
                <input
                  type="text"
                  value={data.website ?? ""}
                  onChange={(e) =>
                    setData({ ...data, website: e.target.value })
                  }
                  placeholder="https://..."
                  className="h-11 w-full rounded-lg border border-hairline bg-white px-4 text-sm text-ink-strong outline-none focus:border-pine-600 focus:ring-2 focus:ring-pine-600/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mandatory Opening Hours (Item 9 Requirement) */}
        <div className="overflow-hidden rounded-xl border border-hairline bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-hairline bg-[#f6f8fc] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-pine-900">
                <span className="msym text-[20px] text-pine">schedule</span>
                {t("openingHoursTitle")} *
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                {t("openingHoursSub")}
              </p>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => applyPreset("standard")}
                className="rounded-lg border border-hairline bg-white px-3 py-1.5 text-xs font-semibold text-ink-strong hover:bg-surface"
              >
                {t("presetStandard")}
              </button>
              <button
                type="button"
                onClick={() => applyPreset("continuous")}
                className="rounded-lg border border-hairline bg-white px-3 py-1.5 text-xs font-semibold text-ink-strong hover:bg-surface"
              >
                {t("presetContinuous")}
              </button>
            </div>
          </div>

          <div className="divide-y divide-hairline">
            {hours.map((row, idx) => (
              <div
                key={row.day}
                className={`flex flex-wrap items-center justify-between gap-3 px-6 py-3 text-sm transition-colors ${
                  row.closed ? "bg-surface/30" : "bg-white"
                }`}
              >
                <div className="w-32 font-semibold text-ink-strong">
                  {row.day}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted">{t("open")}</span>
                    <input
                      type="text"
                      disabled={row.closed}
                      value={row.open}
                      onChange={(e) => updateHour(idx, "open", e.target.value)}
                      placeholder="08:00"
                      className={`${miniInput} w-20 text-center font-mono`}
                    />
                  </div>

                  <span className="text-muted">–</span>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted">{t("close")}</span>
                    <input
                      type="text"
                      disabled={row.closed}
                      value={row.close}
                      onChange={(e) => updateHour(idx, "close", e.target.value)}
                      placeholder="18:30"
                      className={`${miniInput} w-20 text-center font-mono`}
                    />
                  </div>

                  <label className="ml-3 flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted hover:text-ink">
                    <input
                      type="checkbox"
                      checked={row.closed}
                      onChange={(e) =>
                        updateHour(idx, "closed", e.target.checked)
                      }
                      className="size-4 rounded border-hairline text-pine focus:ring-pine"
                    />
                    <span>{t("closed")}</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Product Focus */}
        <div className="overflow-hidden rounded-xl border border-hairline bg-white shadow-sm">
          <div className="border-b border-hairline bg-[#f6f8fc] px-6 py-4">
            <h2 className="flex items-center gap-2 text-base font-bold text-pine-900">
              <span className="msym text-[20px] text-pine">category</span>
              {t("productFocus")}
            </h2>
          </div>
          <div className="p-6">
            <p className="mb-2 text-xs text-muted">{t("productFocusHint")}</p>
            <textarea
              value={data.productFocus ?? ""}
              onChange={(e) =>
                setData({ ...data, productFocus: e.target.value })
              }
              rows={3}
              placeholder="z. B. Blüten, Vollspektrum-Extrakte, Same-Day-Botendienst..."
              className="w-full rounded-lg border border-hairline bg-white p-4 text-sm text-ink-strong outline-none focus:border-pine-600 focus:ring-2 focus:ring-pine-600/20"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 rounded-xl border border-hairline bg-[#f6f8fc] px-6 py-4">
          <button
            type="submit"
            disabled={saving}
            className="flex h-11 items-center justify-center gap-2 rounded-lg bg-pine-600 px-8 font-bold text-white transition-colors hover:bg-pine-700 disabled:opacity-50"
          >
            {saving ? (
              <>
                <span
                  aria-hidden
                  className="msym animate-spin text-[20px]"
                >
                  progress_activity
                </span>
                <span>{t("saving")}</span>
              </>
            ) : (
              <>
                <span aria-hidden className="msym text-[18px]">
                  save
                </span>
                <span>{t("save")}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

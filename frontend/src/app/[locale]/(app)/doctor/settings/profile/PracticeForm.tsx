"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";

type Org = {
  id: string;
  name: string;
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  operatingHours?: any;
  branding: Record<string, any> | null;
};

type DaySchedule = {
  day: string;
  open: string;
  close: string;
  closed: boolean;
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

const SPECIALTY_PRESETS = [
  "Allgemeinmedizin",
  "Spezielle Schmerztherapie",
  "Neurologie",
  "Innere Medizin",
  "Psychiatrie & Psychotherapie",
  "Orthopädie & Unfallchirurgie",
  "Anästhesiologie",
  "Palliativmedizin",
];

const label = "block text-sm font-semibold text-ink-strong";
const input =
  "mt-1.5 h-11 w-full rounded-lg border border-hairline bg-white px-4 text-sm text-ink-strong outline-none focus:border-pine-600 focus:ring-2 focus:ring-pine-600/20";
const miniInput =
  "h-9 rounded-lg border border-hairline bg-white px-2.5 text-xs text-ink-strong outline-none focus:border-pine-600 focus:ring-2 focus:ring-pine-600/20 disabled:bg-surface disabled:text-muted";

function parseInitialHours(raw: any): DaySchedule[] {
  if (Array.isArray(raw) && raw.length > 0) {
    return DAYS_OF_WEEK.map((dayName) => {
      const match = raw.find((r: any) => {
        if (!r?.day) return false;
        const d = String(r.day).toLowerCase();
        const target = dayName.toLowerCase();
        return d === target || (d === "mo" && target === "montag") ||
          (d === "di" && target === "dienstag") ||
          (d === "mi" && target === "mittwoch") ||
          (d === "do" && target === "donnerstag") ||
          (d === "fr" && target === "freitag") ||
          (d === "sa" && target === "samstag") ||
          (d === "so" && target === "sonntag");
      });

      if (match) {
        const isClosed = match.closed === true || match.open === "Geschlossen" || !match.open;
        return {
          day: dayName,
          open: isClosed ? "08:00" : String(match.open || "08:00"),
          close: isClosed ? "18:00" : String(match.close || "18:00"),
          closed: isClosed,
        };
      }

      // Check if it's Sunday or Saturday default closed
      const isWeekend = dayName === "Samstag" || dayName === "Sonntag";
      return {
        day: dayName,
        open: "08:00",
        close: "18:00",
        closed: isWeekend,
      };
    });
  }

  // Standard medical practice default in Germany
  return [
    { day: "Montag", open: "08:00", close: "18:00", closed: false },
    { day: "Dienstag", open: "08:00", close: "18:00", closed: false },
    { day: "Mittwoch", open: "08:00", close: "13:00", closed: false },
    { day: "Donnerstag", open: "08:00", close: "18:00", closed: false },
    { day: "Freitag", open: "08:00", close: "13:00", closed: false },
    { day: "Samstag", open: "09:00", close: "13:00", closed: true },
    { day: "Sonntag", open: "Geschlossen", close: "", closed: true },
  ];
}

export function PracticeForm({ org }: Readonly<{ org: Org }>) {
  const t = useTranslations("doctor.settings");
  const b = org.branding ?? {};

  const initialSpecialty = (b.specialty as string) ||
    (b.practiceType === "pain"
      ? "Spezielle Schmerztherapie"
      : b.practiceType === "general"
        ? "Allgemeinmedizin"
        : b.practiceType === "clinic"
          ? "Klinik / MVZ"
          : "Allgemeinmedizin");

  const [form, setForm] = useState({
    name: org.name ?? "",
    practiceType: b.practiceType ?? "pain",
    specialty: initialSpecialty,
    email: org.email ?? b.email ?? "",
    phone: org.phone ?? b.phone ?? "",
    website: org.website ?? b.website ?? "",
    street: org.street ?? b.street ?? "",
    postal: org.postalCode ?? b.postal ?? "",
    city: org.city ?? b.city ?? "",
    country: b.country ?? "Deutschland",
  });

  const [hours, setHours] = useState<DaySchedule[]>(() =>
    parseInitialHours(org.operatingHours)
  );

  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const updateHour = (
    index: number,
    field: keyof DaySchedule,
    value: string | boolean,
  ) => {
    setHours((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const applyPreset = (preset: "standard" | "compact" | "weekdays") => {
    if (preset === "standard") {
      setHours([
        { day: "Montag", open: "08:00", close: "18:00", closed: false },
        { day: "Dienstag", open: "08:00", close: "18:00", closed: false },
        { day: "Mittwoch", open: "08:00", close: "13:00", closed: false },
        { day: "Donnerstag", open: "08:00", close: "18:00", closed: false },
        { day: "Freitag", open: "08:00", close: "13:00", closed: false },
        { day: "Samstag", open: "09:00", close: "13:00", closed: true },
        { day: "Sonntag", open: "Geschlossen", close: "", closed: true },
      ]);
    } else if (preset === "weekdays") {
      setHours([
        { day: "Montag", open: "08:00", close: "18:00", closed: false },
        { day: "Dienstag", open: "08:00", close: "18:00", closed: false },
        { day: "Mittwoch", open: "08:00", close: "18:00", closed: false },
        { day: "Donnerstag", open: "08:00", close: "18:00", closed: false },
        { day: "Freitag", open: "08:00", close: "18:00", closed: false },
        { day: "Samstag", open: "09:00", close: "13:00", closed: true },
        { day: "Sonntag", open: "Geschlossen", close: "", closed: true },
      ]);
    } else if (preset === "compact") {
      setHours([
        { day: "Montag", open: "09:00", close: "17:00", closed: false },
        { day: "Dienstag", open: "09:00", close: "17:00", closed: false },
        { day: "Mittwoch", open: "09:00", close: "14:00", closed: false },
        { day: "Donnerstag", open: "09:00", close: "17:00", closed: false },
        { day: "Freitag", open: "09:00", close: "14:00", closed: false },
        { day: "Samstag", open: "10:00", close: "13:00", closed: true },
        { day: "Sonntag", open: "Geschlossen", close: "", closed: true },
      ]);
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setSaved(false);

    try {
      const payloadHours = hours.map((h) => ({
        day: h.day,
        open: h.closed ? "Geschlossen" : h.open,
        close: h.closed ? "" : h.close,
        closed: h.closed,
      }));

      const payload = {
        name: form.name,
        street: form.street,
        postalCode: form.postal,
        city: form.city,
        phone: form.phone,
        email: form.email,
        website: form.website,
        operatingHours: payloadHours,
        branding: {
          ...(org.branding || {}),
          practiceType: form.practiceType,
          specialty: form.specialty,
          country: form.country,
          street: form.street,
          postal: form.postal,
          city: form.city,
          phone: form.phone,
          email: form.email,
          website: form.website,
        },
      };

      await api("/doctor/practice", {
        method: "PATCH",
        body: payload,
      });

      setSaved(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Practice & Specialty */}
      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="pname" className={label}>
              {t("practiceName")}
            </label>
            <input
              id="pname"
              className={input}
              value={form.name}
              onChange={set("name")}
              required
            />
          </div>
          <div>
            <label htmlFor="ptype" className={label}>
              {t("practiceType")}
            </label>
            <select
              id="ptype"
              className={input}
              value={form.practiceType}
              onChange={set("practiceType")}
            >
              {(["pain", "general", "clinic"] as const).map((v) => (
                <option key={v} value={v}>
                  {t(`practiceTypes.${v}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Specialty (Item 7 Requirement) */}
        <div className="rounded-xl border border-hairline bg-surface/30 p-4 sm:p-5">
          <div className="flex items-center gap-2 font-bold text-pine">
            <span aria-hidden className="msym text-[20px]">
              stethoscope
            </span>
            <span>{t("specialty")}</span>
          </div>
          <p className="mt-1 text-xs text-muted">{t("specialtyHelp")}</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pspecialty-select" className={label}>
                Fachrichtung vorauswählen
              </label>
              <select
                id="pspecialty-select"
                className={input}
                value={
                  SPECIALTY_PRESETS.includes(form.specialty)
                    ? form.specialty
                    : "custom"
                }
                onChange={(e) => {
                  if (e.target.value !== "custom") {
                    setForm((f) => ({ ...f, specialty: e.target.value }));
                  }
                }}
              >
                {SPECIALTY_PRESETS.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
                <option value="custom">Sonstiges / Freitext eingeben</option>
              </select>
            </div>

            <div>
              <label htmlFor="pspecialty-text" className={label}>
                Exakte Bezeichnung / Schwerpunkt
              </label>
              <input
                id="pspecialty-text"
                className={input}
                value={form.specialty}
                onChange={set("specialty")}
                placeholder={t("specialtyPlaceholder")}
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* Opening Hours / Sprechzeiten (Item 7 Requirement) */}
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 font-bold text-pine">
              <span aria-hidden className="msym text-[20px]">
                schedule
              </span>
              {t("openingHoursTitle")}
            </p>
            <p className="text-xs text-muted">{t("openingHoursSub")}</p>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-muted">Vorlagen:</span>
            <button
              type="button"
              onClick={() => applyPreset("standard")}
              className="rounded-lg border border-hairline bg-white px-2.5 py-1 text-xs font-semibold text-ink hover:bg-surface"
            >
              Mo-Fr (Halbtags Mi/Fr)
            </button>
            <button
              type="button"
              onClick={() => applyPreset("weekdays")}
              className="rounded-lg border border-hairline bg-white px-2.5 py-1 text-xs font-semibold text-ink hover:bg-surface"
            >
              Mo-Fr 08-18 Uhr
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-hairline bg-white">
          <div className="divide-y divide-hairline">
            {hours.map((row, idx) => (
              <div
                key={row.day}
                className={`flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors ${
                  row.closed ? "bg-surface/30" : "bg-white"
                }`}
              >
                <div className="w-28 font-semibold text-ink-strong">
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
                      placeholder="18:00"
                      className={`${miniInput} w-20 text-center font-mono`}
                    />
                  </div>

                  <label className="ml-2 flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted hover:text-ink">
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
      </div>

      {/* Address & Location */}
      <div>
        <p className="flex items-center gap-2 font-bold text-pine">
          <span aria-hidden className="msym text-[18px]">
            location_on
          </span>
          {t("address")}
        </p>
        <div className="mt-3 space-y-5">
          <div>
            <label htmlFor="pstreet" className={label}>
              {t("street")}
            </label>
            <input
              id="pstreet"
              className={input}
              value={form.street}
              onChange={set("street")}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-[10rem_1fr]">
            <div>
              <label htmlFor="ppostal" className={label}>
                {t("postal")}
              </label>
              <input
                id="ppostal"
                className={input}
                value={form.postal}
                onChange={set("postal")}
              />
            </div>
            <div>
              <label htmlFor="pcity" className={label}>
                {t("city")}
              </label>
              <input
                id="pcity"
                className={input}
                value={form.city}
                onChange={set("city")}
              />
            </div>
          </div>
          <div>
            <label htmlFor="pcountry" className={label}>
              {t("country")}
            </label>
            <input
              id="pcountry"
              className={input}
              value={form.country}
              onChange={set("country")}
            />
          </div>
        </div>
      </div>

      {/* Contact Details */}
      <div>
        <p className="flex items-center gap-2 font-bold text-pine">
          <span aria-hidden className="msym text-[18px]">
            contact_mail
          </span>
          {t("contact")}
        </p>
        <div className="mt-3 grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="pemail" className={label}>
              {t("contactEmail")}
            </label>
            <input
              id="pemail"
              type="email"
              className={input}
              value={form.email}
              onChange={set("email")}
            />
          </div>
          <div>
            <label htmlFor="pphone" className={label}>
              {t("phone")}
            </label>
            <input
              id="pphone"
              type="tel"
              className={input}
              value={form.phone}
              onChange={set("phone")}
            />
          </div>
          <div>
            <label htmlFor="pwebsite" className={label}>
              {t("website")}
            </label>
            <input
              id="pwebsite"
              type="text"
              className={input}
              placeholder="https://..."
              value={form.website}
              onChange={set("website")}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-hairline pt-5">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="h-11 rounded-lg px-5 font-bold text-ink-strong hover:bg-surface"
        >
          {t("discard")}
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex h-11 items-center gap-2 rounded-lg bg-brand px-6 font-bold text-white hover:bg-pine disabled:opacity-60"
        >
          <span aria-hidden className="msym text-[18px]">
            save
          </span>
          {saved ? t("saved") : pending ? t("saving") || "Speichern..." : t("save")}
        </button>
      </div>
    </form>
  );
}

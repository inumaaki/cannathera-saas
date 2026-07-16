"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";

type Org = { id: string; name: string; branding: Record<string, string> | null };

const label = "block text-sm font-semibold text-ink-strong";
const input =
  "mt-1.5 h-11 w-full rounded-lg border border-hairline bg-white px-4 text-sm text-ink-strong outline-none focus:border-pine-600 focus:ring-2 focus:ring-pine-600/20";

export function PracticeForm({ org }: Readonly<{ org: Org }>) {
  const t = useTranslations("doctor.settings");
  const b = org.branding ?? {};
  const [form, setForm] = useState({
    name: org.name,
    practiceType: b.practiceType ?? "pain",
    email: b.email ?? "",
    phone: b.phone ?? "",
    street: b.street ?? "",
    postal: b.postal ?? "",
    city: b.city ?? "",
    country: b.country ?? "Deutschland",
  });
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setSaved(false);
    try {
      const { name, ...branding } = form;
      await api("/doctor/practice", { method: "PATCH", body: { name, branding } });
      setSaved(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="pname" className={label}>
            {t("practiceName")}
          </label>
          <input id="pname" className={input} value={form.name} onChange={set("name")} required />
        </div>
        <div>
          <label htmlFor="ptype" className={label}>
            {t("practiceType")}
          </label>
          <select id="ptype" className={input} value={form.practiceType} onChange={set("practiceType")}>
            {(["pain", "general", "clinic"] as const).map((v) => (
              <option key={v} value={v}>
                {t(`practiceTypes.${v}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="flex items-center gap-2 font-bold text-pine">
          <span aria-hidden className="msym text-[18px]">
            contact_mail
          </span>
          {t("contact")}
        </p>
        <div className="mt-3 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="pemail" className={label}>
              {t("contactEmail")}
            </label>
            <input id="pemail" type="email" className={input} value={form.email} onChange={set("email")} />
          </div>
          <div>
            <label htmlFor="pphone" className={label}>
              {t("phone")}
            </label>
            <input id="pphone" type="tel" className={input} value={form.phone} onChange={set("phone")} />
          </div>
        </div>
      </div>

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
            <input id="pstreet" className={input} value={form.street} onChange={set("street")} />
          </div>
          <div className="grid gap-5 sm:grid-cols-[10rem_1fr]">
            <div>
              <label htmlFor="ppostal" className={label}>
                {t("postal")}
              </label>
              <input id="ppostal" className={input} value={form.postal} onChange={set("postal")} />
            </div>
            <div>
              <label htmlFor="pcity" className={label}>
                {t("city")}
              </label>
              <input id="pcity" className={input} value={form.city} onChange={set("city")} />
            </div>
          </div>
          <div>
            <label htmlFor="pcountry" className={label}>
              {t("country")}
            </label>
            <input id="pcountry" className={input} value={form.country} onChange={set("country")} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-hairline pt-5">
        <button
          type="button"
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
          {saved ? t("saved") : t("save")}
        </button>
      </div>
    </form>
  );
}

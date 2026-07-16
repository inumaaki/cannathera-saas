"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";

type Profile = {
  fullName: string;
  patientRef: string;
  email: string;
  pharmacyOrgId: string | null;
  pharmacies: Array<{ id: string; name: string }>;
};

const label = "block text-sm font-semibold uppercase tracking-wide text-muted";
const box =
  "mt-2 h-12 w-full rounded-lg border border-hairline bg-[#f6f8fc] px-4 text-base text-ink-strong";

export function ProfileForm({ profile }: Readonly<{ profile: Profile }>) {
  const t = useTranslations("patient.profile");
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.fullName);
  const [pharmacy, setPharmacy] = useState(profile.pharmacyOrgId ?? "");
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const [firstName, ...rest] = fullName.trim().split(/\s+/);
    setPending(true);
    setSaved(false);
    try {
      await api("/patient/profile", {
        method: "PATCH",
        body: {
          firstName,
          lastName: rest.join(" "),
          pharmacyOrgId: pharmacy || null,
        },
      });
      setSaved(true);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="fullName" className={label}>
          {t("fullName")}
        </label>
        <input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={`${box} outline-none focus:border-pine-600`}
          required
        />
      </div>

      <div>
        <label htmlFor="patientRef" className={label}>
          {t("patientId")}
        </label>
        <div className="relative">
          <input
            id="patientRef"
            value={profile.patientRef}
            readOnly
            className={`${box} bg-[#eef2fe] pe-11 font-mono`}
          />
          <span
            aria-hidden
            className="msym absolute end-4 top-1/2 -translate-y-1/2 text-[18px] text-muted"
          >
            lock
          </span>
        </div>
      </div>

      <div>
        <label htmlFor="email" className={label}>
          {t("email")}
        </label>
        <input id="email" value={profile.email} readOnly className={box} />
      </div>

      <div>
        <label htmlFor="pharmacy" className={label}>
          {t("pharmacy")}
        </label>
        <select
          id="pharmacy"
          value={pharmacy}
          onChange={(e) => setPharmacy(e.target.value)}
          className={`${box} outline-none focus:border-pine-600`}
        >
          <option value="">{t("noPharmacy")}</option>
          {profile.pharmacies.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="h-12 rounded-xl bg-pine-600 px-6 font-bold text-white disabled:opacity-60"
        >
          {saved ? t("saved") : t("save")}
        </button>
      </div>
    </form>
  );
}

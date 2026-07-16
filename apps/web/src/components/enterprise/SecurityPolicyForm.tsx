"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api, ApiError } from "@/lib/api";

/* Figma 8.8 — Security policy (2FA + session timeout). */
export function SecurityPolicyForm({
  initial,
}: Readonly<{ initial: { mandatory2fa: boolean; sessionTimeoutMin: number } }>) {
  const t = useTranslations("enterprise.settings");
  const router = useRouter();
  const [twoFa, setTwoFa] = useState(initial.mandatory2fa);
  const [timeout_, setTimeout_] = useState(initial.sessionTimeoutMin);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty =
    twoFa !== initial.mandatory2fa || timeout_ !== initial.sessionTimeoutMin;

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await api("/enterprise/settings", {
        method: "PATCH",
        body: { mandatory2fa: twoFa, sessionTimeoutMin: timeout_ },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.code : "ERROR");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="cw-watermark rounded-xl border border-hairline bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-pine">
          <span aria-hidden className="msym text-[22px] text-pine-600">
            shield
          </span>
          {t("securityPolicy")}
        </h2>
        <span className="rounded-md bg-[#eef2fe] px-2.5 py-1 text-[10px] font-bold uppercase text-info">
          {t("enforced")}
        </span>
      </div>

      <div className="mt-6 flex items-start justify-between gap-4 border-b border-hairline pb-6">
        <div>
          <p className="font-bold text-ink-strong">{t("mandatory2fa")}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {t("mandatory2faNote")}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={twoFa}
          aria-label={t("mandatory2fa")}
          onClick={() => setTwoFa((v) => !v)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            twoFa ? "bg-pine-600" : "bg-[#e3e9f2]"
          }`}
        >
          <span
            className={`absolute top-1 size-5 rounded-full bg-white transition-all ${
              twoFa ? "start-6" : "start-1"
            }`}
          />
        </button>
      </div>

      <div className="mt-6">
        <p className="font-bold text-ink-strong">{t("sessionTimeout")}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          {t("sessionTimeoutNote")}
        </p>
        <select
          value={timeout_}
          onChange={(e) => setTimeout_(Number(e.target.value))}
          className="mt-3 h-11 w-full rounded-lg border border-hairline bg-surface px-3 text-sm font-semibold text-ink-strong outline-none focus:ring-2 focus:ring-pine-600/30"
        >
          <option value={30}>{t("min30")}</option>
          <option value={60}>{t("min60")}</option>
          <option value={120}>{t("min120")}</option>
        </select>
      </div>

      <p className="mt-6 flex items-start gap-2 rounded-lg border border-hairline bg-surface p-3 text-xs leading-relaxed text-sage-900">
        <span aria-hidden className="msym text-[16px] text-gold">
          info
        </span>
        {t("complianceNote")}
      </p>

      {error ? (
        <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>
      ) : null}
      {saved ? (
        <p className="mt-4 text-sm font-semibold text-pine-600">{t("saved")}</p>
      ) : null}

      <button
        type="button"
        onClick={save}
        disabled={busy || !dirty}
        className="mt-5 w-full rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-pine disabled:opacity-50"
      >
        {t("save")}
      </button>
    </section>
  );
}

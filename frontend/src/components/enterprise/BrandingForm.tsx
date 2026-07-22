"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api, API_URL, ApiError } from "@/lib/api";
import { ProgressRing } from "@/components/patient/charts";

type Branding = {
  logoUrl?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
  fontFamily?: string | null;
};

const SWATCHES = ["#0B4D34", "#2563eb", "#dc2626", "#7c3aed", "#ca8a04"];
const FONTS = [
  { value: "fraunces", nameKey: "fontDefault", noteKey: "fontDefaultNote" },
  { value: "inter", nameKey: "fontAlt", noteKey: "fontAltNote" },
] as const;

/* Figma 8.6 — Branding with a live preview of the patient app. */
export function BrandingForm({ initial }: Readonly<{ initial: Branding }>) {
  const t = useTranslations("enterprise.branding");
  const router = useRouter();
  const [accent, setAccent] = useState(initial.accentColor ?? "#F97316");
  const [primary, setPrimary] = useState(initial.primaryColor ?? "#0B4D34");
  const [font, setFont] = useState(initial.fontFamily ?? "fraunces");
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function save(next?: {
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
  }) {
    setBusy(true);
    setError(null);
    try {
      await api("/enterprise/branding", {
        method: "PATCH",
        body: next ?? {
          primaryColor: primary,
          accentColor: accent,
          fontFamily: font,
        },
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

  /* The file input needs a multipart POST — `api()` sends JSON, so this goes
     direct with the session cookie. */
  async function uploadLogo(file: File) {
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`${API_URL}/enterprise/branding/logo`, {
        method: "POST",
        credentials: "include",
        body,
      });
      if (!res.ok) throw new ApiError(res.status, "UPLOAD_FAILED");
      const data = (await res.json()) as { logoUrl: string };
      setLogoUrl(data.logoUrl);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.code : "ERROR");
    } finally {
      setUploading(false);
    }
  }

  /** Reset must persist too — otherwise it only looks reset until you reload. */
  function reset() {
    setPrimary("#0B4D34");
    setAccent("#F97316");
    setFont("fraunces");
    void save({
      primaryColor: "#0B4D34",
      accentColor: "#F97316",
      fontFamily: "fraunces",
    });
  }

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[6fr_5fr]">
      <section className="cw-watermark rounded-xl border border-hairline bg-white p-6">
        <h2 className="font-display text-2xl font-bold text-pine">{t("identity")}</h2>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>

        <p className="mt-6 text-[10px] font-bold uppercase tracking-wide text-sage-900">
          {t("logo")}
        </p>
        <label className="mt-2 flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-hairline p-5 hover:border-pine-600">
          {logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={`${API_URL}${logoUrl}`}
              alt=""
              className="size-12 shrink-0 rounded-xl object-contain"
            />
          ) : (
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface text-[24px] text-muted">
              <span aria-hidden className="msym">add_photo_alternate</span>
            </span>
          )}
          <span>
            <span className="block font-bold text-ink-strong">
              {uploading ? "…" : t("upload")}
            </span>
            <span className="block text-xs text-muted">{t("logoHint")}</span>
          </span>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadLogo(file);
            }}
            className="hidden"
          />
        </label>

        <p className="mt-6 text-[10px] font-bold uppercase tracking-wide text-sage-900">
          {t("primaryColor")}
        </p>
        <div className="mt-2 flex items-center gap-3">
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              onClick={() => setPrimary(c)}
              style={{ backgroundColor: c }}
              className={`size-9 rounded-full ring-offset-2 ${
                primary === c ? "ring-2 ring-pine" : ""
              }`}
            />
          ))}
          <label className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-hairline">
            <span aria-hidden className="msym text-[18px] text-muted">
              colorize
            </span>
            <input
              type="color"
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
              className="sr-only"
            />
          </label>
        </div>

        <p className="mt-6 text-[10px] font-bold uppercase tracking-wide text-sage-900">
          {t("accentColor")}
        </p>
        <div className="mt-2 flex items-center gap-3">
          {["#F97316", "#2563eb", "#dc2626", "#7c3aed", "#ca8a04"].map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              onClick={() => setAccent(c)}
              style={{ backgroundColor: c }}
              className={`size-9 rounded-full ring-offset-2 ${
                accent === c ? "ring-2 ring-pine" : ""
              }`}
            />
          ))}
          <label className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-hairline">
            <span aria-hidden className="msym text-[18px] text-muted">
              colorize
            </span>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="sr-only"
            />
          </label>
        </div>

        <p className="mt-6 text-[10px] font-bold uppercase tracking-wide text-sage-900">
          {t("typography")}
        </p>
        <div className="mt-2 space-y-3">
          {FONTS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFont(f.value)}
              className={`block w-full rounded-xl border p-4 text-start ${
                font === f.value
                  ? "border-pine-600 bg-mint/10"
                  : "border-hairline hover:bg-surface"
              }`}
            >
              <span className="block font-display text-lg font-bold text-ink-strong">
                {t(f.nameKey)}
              </span>
              <span className="block text-xs text-muted">{t(f.noteKey)}</span>
            </button>
          ))}
        </div>

        {error ? (
          <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>
        ) : null}
        {saved ? (
          <p className="mt-4 text-sm font-semibold text-pine-600">{t("saved")}</p>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={reset}
            className="text-sm font-bold text-muted hover:text-ink-strong"
          >
            {t("reset")}
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={busy}
            className="rounded-lg bg-pine-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-pine disabled:opacity-60"
          >
            {t("apply")}
          </button>
        </div>
      </section>

      {/* Live preview of the patient app with the chosen brand. */}
      <section className="self-start">
        <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-sage-900">
          <span aria-hidden className="size-2 rounded-full bg-pine-600" />
          {t("preview")}
        </p>

        <div className="mx-auto mt-3 w-full max-w-[300px] rounded-[2rem] border-8 border-ink-strong bg-white p-4 shadow-xl">
          <div className="flex items-center gap-2 pb-3">
            {logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={`${API_URL}${logoUrl}`}
                alt=""
                className="size-8 rounded-lg object-contain"
              />
            ) : (
              <span className="flex size-8 items-center justify-center rounded-lg text-[18px] text-white" style={{ backgroundColor: primary }}>
                <span aria-hidden className="msym">eco</span>
              </span>
            )}
            <span
              className={`text-lg font-bold text-ink-strong ${
                font === "fraunces" ? "font-display" : ""
              }`}
            >
              PureLife Wellness
            </span>
          </div>

          <div className="rounded-2xl border border-hairline p-4 text-center">
            <div className="flex justify-center">
              <ProgressRing pct={72} size={120} stroke={10} color={primary}>
                <p className="font-display text-2xl font-bold" style={{ color: primary }}>
                  72%
                </p>
                <p className="text-[9px] font-bold uppercase text-muted">
                  {t("previewProgress")}
                </p>
              </ProgressRing>
            </div>
            <p
              className={`mt-3 text-base font-bold text-ink-strong ${
                font === "fraunces" ? "font-display" : ""
              }`}
            >
              {t("previewPlan")}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-hairline p-3">
              <p className="text-[9px] font-bold uppercase text-muted">
                {t("previewDosage")}
              </p>
              <p className="font-mono text-sm font-bold text-ink-strong">15 ml</p>
            </div>
            <div className="rounded-xl border border-hairline p-3">
              <p className="text-[9px] font-bold uppercase text-muted">
                {t("previewNextVisit")}
              </p>
              <p className="font-mono text-sm font-bold text-ink-strong">12. Nov</p>
            </div>
          </div>

          {/* Co-branding rule: this mark is never removable. */}
          <p
            className="mt-3 rounded-full px-3 py-1.5 text-center text-[9px] font-bold uppercase tracking-wide text-white"
            style={{ backgroundColor: primary }}
          >
            {t("poweredBy")}
          </p>
        </div>

        <p className="mt-4 flex items-start gap-2 rounded-lg border border-hairline bg-mint/10 p-3 text-xs leading-relaxed text-sage-900">
          <span aria-hidden className="msym text-[16px] text-pine-600">
            lock
          </span>
          {t("poweredNote")}
        </p>
      </section>
    </div>
  );
}

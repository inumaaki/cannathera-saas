"use client";

import { useTranslations } from "next-intl";

export function LandingTrust() {
  const t = useTranslations("landing.trust");

  return (
    <section id="trust" className="min-h-screen flex flex-col justify-center py-16 bg-white border-t border-hairline">
      <div className="mx-auto max-w-7xl px-6 grid gap-12 lg:grid-cols-2 lg:items-center w-full">
        {/* Left Side Content */}
        <div className="space-y-6">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-pine-600">
            {t("tag")}
          </span>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-pine sm:text-4xl">
            {t("title")}
          </h2>
          <p className="text-muted leading-relaxed">
            {t("subtitle")}
          </p>

          <div className="space-y-4 pt-2">
            <div className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-mint/30 text-pine-600">
                <span aria-hidden className="msym text-[20px]">
                  verified_user
                </span>
              </span>
              <div>
                <h4 className="font-bold text-ink-strong">{t("gdprTitle")}</h4>
                <p className="mt-1 text-sm text-muted">
                  {t("gdprDesc")}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-mint/30 text-pine-600">
                <span aria-hidden className="msym text-[20px]">
                  lock
                </span>
              </span>
              <div>
                <h4 className="font-bold text-ink-strong">{t("aesTitle")}</h4>
                <p className="mt-1 text-sm text-muted">
                  {t("aesDesc")}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-mint/30 text-pine-600">
                <span aria-hidden className="msym text-[20px]">
                  shield
                </span>
              </span>
              <div>
                <h4 className="font-bold text-ink-strong">{t("auditTitle")}</h4>
                <p className="mt-1 text-sm text-muted">
                  {t("auditDesc")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side — Minimalist Security & Compliance Seal Box */}
        <div className="relative rounded-3xl border border-emerald-900/10 bg-gradient-to-b from-[#f8faf9] to-[#edf3f0] p-8 sm:p-10 shadow-sm">
          <div className="flex flex-col items-center text-center">
            {/* Minimalist Professional Security Seal Graphic */}
            <div className="relative flex size-44 items-center justify-center">
              {/* Outer decorative dashed ring */}
              <div className="absolute inset-0 rounded-full border border-dashed border-emerald-800/25 animate-[spin_60s_linear_infinite]" />

              {/* Inner clean ring */}
              <div className="absolute inset-3 rounded-full border border-emerald-900/15 bg-white/90 shadow-sm flex items-center justify-center" />

              {/* Center Seal Emblem */}
              <div className="relative z-10 flex flex-col items-center justify-center p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/logo-transparent.png"
                  alt="Cannathera Seal"
                  className="size-16 object-contain grayscale opacity-85 brightness-75 contrast-125"
                />
                <span className="mt-1.5 text-[9px] font-bold tracking-[0.25em] text-emerald-950/80 uppercase">
                  VERIFIED
                </span>
              </div>
            </div>

            {/* Seal Title & Verification Info */}
            <div className="mt-6 space-y-1.5">
              <h3 className="font-display text-lg font-bold text-emerald-950 tracking-tight">
                Certified Security & Compliance
              </h3>
              <p className="text-xs text-slate-600 font-medium max-w-xs">
                EU GDPR Art. 9 Architecture • Encrypted Data Processing
              </p>
            </div>

            {/* Subtle Active Protection Pill */}
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-800/15 bg-emerald-800/5 px-4 py-1.5 text-xs font-bold text-emerald-900">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-600 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-600" />
              </span>
              Active System Protection
            </div>
          </div>

          {/* Hard facts specifications */}
          <div className="mt-8 border-t border-emerald-900/10 pt-6 grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t("standard")}</p>
              <p className="mt-1 font-mono text-sm font-bold text-emerald-950">TLS 1.3 / AES-256</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t("hashing")}</p>
              <p className="mt-1 font-mono text-sm font-bold text-emerald-950">Argon2id</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function LandingHero() {
  const t = useTranslations("auth.signup.hero");

  return (
    <section className="relative overflow-hidden bg-brand-gradient py-20 text-white lg:py-28">
      {/* Background soft pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent)] pointer-events-none" />

      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:items-center">
        {/* Left Side Content */}
        <div className="space-y-6 max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-mint-bright">
            <span aria-hidden className="msym text-[14px]">
              verified_user
            </span>
            Certified Clinical Software
          </span>

          <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl xl:text-6xl">
            Your Therapy.
            <br />
            <span className="text-mint-bright">Meticulously Structured.</span>
          </h1>

          <p className="text-lg leading-relaxed text-white/80">
            {t("subtitle")} Complete daily assessments, view physiological timelines, and stay connected with your clinical team.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/signup"
              className="flex h-12 items-center justify-center rounded-xl bg-mint px-6 font-bold text-pine transition-all hover:bg-mint-bright hover:shadow-lg hover:shadow-mint/20"
            >
              Start Free 90-Day Plan
            </Link>
            <Link
              href="/login"
              className="flex h-12 items-center justify-center rounded-xl border-2 border-white/20 px-6 font-bold text-white transition-colors hover:bg-white/10"
            >
              Access Portal
            </Link>
          </div>

          {/* Quick value badges */}
          <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-semibold uppercase tracking-wider text-white/60">
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="msym text-[16px] text-mint">
                lock
              </span>
              GDPR Compliant
            </span>
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="msym text-[16px] text-mint">
                enhanced_encryption
              </span>
              AES-256 Encrypted
            </span>
          </div>
        </div>

        {/* Right Side Mockup Widget */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
            {/* Mock Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-white/10">
                  <span aria-hidden className="msym text-[20px] text-mint">
                    psychiatry
                  </span>
                </span>
                <div>
                  <p className="text-sm font-bold leading-none">Therapy Dashboard</p>
                  <p className="mt-1 text-xs text-white/60">Active Accompaniment</p>
                </div>
              </div>
              <span className="rounded-md bg-mint/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-mint-bright">
                Day 12 / 90
              </span>
            </div>

            {/* Mock Roster Grid */}
            <div className="mt-6 space-y-4">
              {/* Progress assessment card */}
              <div className="rounded-xl bg-white/10 p-4 border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-mint-bright">
                    Daily Assessment
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-mint-bright">
                    <span aria-hidden className="msym text-[12px]">
                      check_circle
                    </span>
                    Completed
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold">Dosage: 1.5g — Pedanios 22/1</p>
                <div className="mt-3 flex gap-3 text-xs text-white/70">
                  <span>Pain: 2/10</span>
                  <span>·</span>
                  <span>Sleep: 8.5h</span>
                  <span>·</span>
                  <span>Activity: Active</span>
                </div>
              </div>

              {/* Chart Card */}
              <div className="rounded-xl bg-white/10 p-4 border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/75">
                    Symptom Window Performance
                  </span>
                  <span className="text-[10px] font-mono text-white/50">Last 7 days</span>
                </div>
                {/* Simulated Sparkline / Bar Chart */}
                <div className="mt-4 flex items-end gap-2.5 h-16 justify-between px-2">
                  {[60, 45, 55, 30, 40, 20, 15].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <div
                        className="w-full rounded-t bg-mint/50 transition-all hover:bg-mint"
                        style={{ height: `${h}px` }}
                      />
                      <span className="text-[8px] text-white/40 font-mono">D{i+6}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alert Indicator */}
              <div className="flex items-center justify-between rounded-xl bg-orange-500/10 border border-orange-500/30 p-3 text-xs">
                <p className="flex items-center gap-2 font-semibold text-orange-400">
                  <span aria-hidden className="msym text-[16px]">
                    warning
                  </span>
                  Compliance: No warnings detected
                </p>
                <span className="font-bold text-orange-300">92% Trust Score</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

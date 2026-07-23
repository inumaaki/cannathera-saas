"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function LandingHero() {
  const t = useTranslations("landing.hero");

  return (
    <section className="relative overflow-hidden bg-brand-gradient min-h-[calc(100vh-4rem)] flex flex-col justify-center text-white py-12">
      {/* Background soft pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent)] pointer-events-none" />

      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:items-center w-full">
        {/* Left Side Content */}
        <div className="space-y-6 max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-mint-bright">
            <span aria-hidden className="msym text-[14px]">
              verified_user
            </span>
            {t("certified")}
          </span>

          <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl xl:text-6xl whitespace-pre-line">
            {t("title")}
          </h1>

          <p className="text-lg leading-relaxed text-white/80">
            {t("subtitle")}
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/signup/patient"
              className="group flex h-12 items-center justify-center rounded-xl bg-white px-6 font-bold text-pine shadow-md hover:bg-[#eaf1ec] hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 transition-all duration-200 cursor-pointer"
            >
              {t("ctaStart")}
              <span aria-hidden className="msym text-[18px] ml-1.5 transition-transform group-hover:translate-x-0.5">
                arrow_forward
              </span>
            </Link>
            <Link
              href="/login"
              className="group flex h-12 items-center justify-center rounded-xl border-2 border-white bg-transparent px-6 font-bold text-white hover:bg-white/10 hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 transition-all duration-200 cursor-pointer"
            >
              {t("ctaPortal")}
              <span aria-hidden className="msym text-[18px] ml-1.5 transition-transform group-hover:translate-x-0.5">
                login
              </span>
            </Link>
          </div>

          {/* Quick value badges */}
          <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-semibold uppercase tracking-wider text-white/60">
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="msym text-[16px] text-mint">
                lock
              </span>
              {t("gdpr")}
            </span>
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="msym text-[16px] text-mint">
                enhanced_encryption
              </span>
              {t("encrypted")}
            </span>
          </div>
        </div>

        {/* Right Side Mockup Widget */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative rounded-2xl border border-white/10 bg-pine/80 p-6 shadow-2xl backdrop-blur-lg">
            {/* Mock Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-white/5">
                  <span aria-hidden className="msym text-[20px] text-white">
                    psychiatry
                  </span>
                </span>
                <div>
                  <p className="text-sm font-bold leading-none">{t("dashboard")}</p>
                  <p className="mt-1 text-xs text-[#8cbda3]">{t("active")}</p>
                </div>
              </div>
              <span className="rounded-md bg-mint/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-mint-bright">
                {t("day", { day: 12 })}
              </span>
            </div>

            {/* Mock Roster Grid */}
            <div className="mt-6 space-y-4">
              {/* Progress assessment card */}
              <div className="rounded-xl bg-[#002819]/55 p-4 border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-mint-bright">
                    {t("daily")}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-mint-bright">
                    <span aria-hidden className="msym text-[12px]">
                      check_circle
                    </span>
                    {t("completed")}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold">{t("dosage", { dosage: "1.5g", strain: "Pedanios 22/1" })}</p>
                <div className="mt-3 flex gap-3 text-xs text-[#8cbda3]">
                  <span>{t("pain", { pain: "2/10" })}</span>
                  <span>·</span>
                  <span>{t("sleep", { sleep: "8.5h" })}</span>
                  <span>·</span>
                  <span>{t("activity", { activity: "Active" })}</span>
                </div>
              </div>

              {/* Chart Card */}
              <div className="rounded-xl bg-[#002819]/55 p-4 border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#a5cbb7]">
                    {t("symptom")}
                  </span>
                  <span className="text-[10px] font-mono text-[#8cbda3]/60">{t("last7")}</span>
                </div>
                {/* Simulated Sparkline / Bar Chart */}
                <div className="mt-4 flex items-end gap-2.5 h-16 justify-between px-2">
                  {[60, 45, 55, 30, 40, 20, 15].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <div
                        className={`w-full rounded-t transition-all hover:bg-white ${
                          i === 0 ? "bg-white" : "bg-white/60"
                        }`}
                        style={{ height: `${h}px` }}
                      />
                      <span className="text-[8px] text-[#8cbda3]/50 font-mono">D{i+6}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alert Indicator */}
              <div className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-3 text-xs">
                <p className="flex items-center gap-2 font-semibold text-white">
                  <span aria-hidden className="msym text-[16px] text-white">
                    check_circle
                  </span>
                  {t("compliance")}
                </p>
                <span className="font-bold text-white">92% {t("trust")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

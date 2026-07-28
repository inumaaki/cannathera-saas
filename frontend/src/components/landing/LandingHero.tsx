"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function LandingHero() {
  const t = useTranslations("landing.hero");

  return (
    <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-pine py-16 text-white flex flex-col justify-center">
      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-12 lg:items-center w-full">
        {/* Left Side Content (7 cols) */}
        <div className="space-y-8 lg:col-span-7 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-mint-bright">
            <span className="size-2 rounded-full bg-mint" />
            {t("certified")}
          </div>

          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl xl:text-6xl text-white leading-[1.1] whitespace-pre-line">
            {t("title")}
          </h1>

          <p className="text-lg leading-relaxed text-white/80">
            {t("subtitle")}
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/signup/patient"
              className="group flex h-12 items-center justify-center rounded-xl bg-[#F97316] px-6 font-bold text-white shadow-md hover:bg-[#e66a12] hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 transition-all duration-200 cursor-pointer"
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

        {/* Right Side — Brand Image */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none lg:col-span-5 flex items-center justify-center">
          <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/image00001.jpeg"
              alt="Cannathera Logo"
              className="w-full h-auto rounded-2xl object-contain bg-white"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

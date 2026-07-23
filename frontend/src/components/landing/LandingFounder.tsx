"use client";

import { useTranslations } from "next-intl";

export function LandingFounder() {
  const t = useTranslations("landing.founder");

  return (
    <section id="founder" className="min-h-screen flex flex-col justify-center py-16 bg-white border-t border-hairline">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
        {/* Left: Premium Clinical Card Representation */}
        <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#003521] to-[#00140c] p-4 shadow-2xl sm:p-8">
            {/* Background design elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(150,212,178,0.1),transparent)] pointer-events-none" />

            {/* Visual Badge/Mockup of Doctor-Patient Cooperation */}
            <div className="relative z-10 flex items-center gap-3 sm:gap-5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-mint/10 border border-mint/20 text-mint-bright shadow-inner sm:size-14">
                <span aria-hidden className="msym text-[28px]">
                  stethoscope
                </span>
              </span>
              <div className="min-w-0">
                <p className="font-display text-lg font-bold tracking-tight text-white sm:text-xl">Dominique Larkin</p>
                <p className="text-xs text-mint-bright font-semibold uppercase tracking-wider mt-0.5">{t("role")}</p>
              </div>
            </div>

            {/* Blockquote */}
            <div className="relative z-10 mt-6 rounded-e-2xl border-s-4 border-mint bg-white/5 p-4 backdrop-blur-sm sm:mt-8 sm:p-5">
              <span className="absolute -top-4 -left-2 font-serif text-8xl text-mint-bright/10 leading-none pointer-events-none">“</span>
              <p className="text-sm md:text-base italic leading-relaxed text-[#eaf7f1] relative z-10 font-medium">
                {t("quote")}
              </p>
            </div>

            {/* Clinical Value comparison */}
            <div className="mt-8 border-t border-white/10 pt-6 relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8cbda3]/60 mb-4 text-center">
                {t("orchestration")}
              </p>
              <div className="flex flex-col items-stretch gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                {/* Doctor */}
                <div className="flex w-full min-w-0 flex-1 flex-col items-center gap-1.5 rounded-xl border border-white/5 bg-white/5 p-3 text-center shadow-sm">
                  <span aria-hidden className="msym text-[20px] text-mint-bright">
                    medical_services
                  </span>
                  <span className="block text-xs font-bold text-white">{t("doctor")}</span>
                  <span className="text-[10px] text-[#8cbda3] font-medium">{t("doctorAction")}</span>
                </div>

                {/* Arrow */}
                <span aria-hidden className="msym rotate-90 self-center text-[16px] text-mint/40 select-none sm:rotate-0">
                  arrow_forward
                </span>

                {/* Cannathera */}
                <div className="relative flex w-full min-w-0 flex-1 flex-col items-center gap-1.5 rounded-xl border border-mint/20 bg-mint/10 p-3 text-center shadow-md">
                  {/* Glowing live indicator */}
                  <span className="absolute -top-1.5 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mint opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-mint-bright"></span>
                  </span>
                  <span aria-hidden className="msym text-[20px] text-mint-bright">
                    hub
                  </span>
                  <span className="block text-xs font-extrabold text-white">{t("platform")}</span>
                  <span className="text-[10px] text-mint-bright font-bold uppercase tracking-wider">{t("platformAction")}</span>
                </div>

                {/* Arrow */}
                <span aria-hidden className="msym rotate-90 self-center text-[16px] text-mint/40 select-none sm:rotate-0">
                  arrow_forward
                </span>

                {/* Pharmacy */}
                <div className="flex w-full min-w-0 flex-1 flex-col items-center gap-1.5 rounded-xl border border-white/5 bg-white/5 p-3 text-center shadow-sm">
                  <span aria-hidden className="msym text-[20px] text-mint-bright">
                    medication
                  </span>
                  <span className="block text-xs font-bold text-white">{t("pharmacy")}</span>
                  <span className="text-[10px] text-[#8cbda3] font-medium">{t("pharmacyAction")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Copy details */}
        <div className="space-y-6">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-pine-600">
            {t("tag")}
          </span>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-pine sm:text-4xl">
            {t("title")}
          </h2>
          <p className="text-muted leading-relaxed text-sm">
            {t("subtitle")}
          </p>

          <div className="space-y-6 pt-2">
            <div>
              <h4 className="font-bold text-ink-strong text-base">{t("philosophy")}</h4>
              <p className="text-sm leading-relaxed text-muted mt-2">
                {t("philosophyDesc")}
              </p>
            </div>

            {/* Unfair Advantage / Clinical Edge Section */}
            <div className="pt-4 border-t border-hairline">
              <h4 className="font-bold text-ink-strong text-base">{t("unfairTitle")}</h4>
              <p className="text-xs text-muted leading-relaxed mt-1">
                {t("unfairSubtitle")}
              </p>
              
              <div className="grid gap-4 mt-4 sm:grid-cols-3">
                {/* Advantage 0 */}
                <div className="rounded-2xl border border-hairline p-4 bg-surface flex flex-col gap-2.5 shadow-sm hover:shadow transition-shadow">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-pine/10 text-pine-600">
                    <span aria-hidden className="msym text-[18px]">
                      forum
                    </span>
                  </span>
                  <div>
                    <h5 className="font-bold text-ink-strong text-xs">{t("unfair0Title")}</h5>
                    <p className="mt-1 text-[11px] text-muted leading-relaxed">
                      {t("unfair0Desc")}
                    </p>
                  </div>
                </div>

                {/* Advantage 1 */}
                <div className="rounded-2xl border border-hairline p-4 bg-surface flex flex-col gap-2.5 shadow-sm hover:shadow transition-shadow">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-pine/10 text-pine-600">
                    <span aria-hidden className="msym text-[18px]">
                      rule
                    </span>
                  </span>
                  <div>
                    <h5 className="font-bold text-ink-strong text-xs">{t("unfair1Title")}</h5>
                    <p className="mt-1 text-[11px] text-muted leading-relaxed">
                      {t("unfair1Desc")}
                    </p>
                  </div>
                </div>

                {/* Advantage 2 */}
                <div className="rounded-2xl border border-hairline p-4 bg-surface flex flex-col gap-2.5 shadow-sm hover:shadow transition-shadow">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-pine/10 text-pine-600">
                    <span aria-hidden className="msym text-[18px]">
                      verified
                    </span>
                  </span>
                  <div>
                    <h5 className="font-bold text-ink-strong text-xs">{t("unfair2Title")}</h5>
                    <p className="mt-1 text-[11px] text-muted leading-relaxed">
                      {t("unfair2Desc")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

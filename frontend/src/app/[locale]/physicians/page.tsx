import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function PhysiciansPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PhysiciansContent />;
}

function PhysiciansContent() {
  const t = useTranslations("physicians");

  return (
    <div className="flex min-h-screen max-w-full flex-col overflow-x-clip bg-white">
      <LandingHeader />
      
      {/* 1. HERO SECTION */}
      <section className="relative bg-pine text-white min-h-[calc(100vh-4rem)] flex flex-col px-6 lg:px-8 border-b-4 border-mint overflow-hidden">
        <div className="absolute inset-0 bg-[url('/brand/grid-pattern.svg')] opacity-[0.03] pointer-events-none" style={{ backgroundSize: '40px 40px' }} />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(150,212,178,0.08),transparent_60%)] pointer-events-none translate-x-1/3 -translate-y-1/3" />
        
        <div className="mx-auto max-w-7xl w-full relative z-10 my-auto py-8 lg:py-10">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Copy */}
            <div className="max-w-2xl flex flex-col justify-center">
              <div className="mb-4 inline-flex self-start items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-mint-bright bg-mint-bright/10 rounded-full border border-mint-bright/20">
                <span className="msym text-base">medical_services</span>
                {t("title")}
              </div>
              <h1 className="text-3xl font-display font-extrabold tracking-tight sm:text-4xl lg:text-[2.5rem] leading-[1.1]">
                {t("hero_title")}
              </h1>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-white/90 font-medium">
                {t("hero_intro")}
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signup/doctor"
                  className="group relative flex h-14 items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-8 font-bold text-[#002819] transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                  <span>{t("cta")}</span>
                  <span className="msym text-xl transition-transform group-hover:translate-x-1">arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* Monthly Review Graphic */}
            <div className="relative w-full rounded-2xl border border-white/10 bg-[#00120a] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col mt-8 lg:mt-0">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

              {/* Browser chrome */}
              <div className="h-12 border-b border-white/5 bg-white/[0.02] flex items-center px-4 gap-4 shrink-0">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]"/>
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"/>
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]"/>
                </div>
                <div className="h-5 w-56 bg-white/5 rounded flex items-center px-2">
                  <span className="text-[10px] text-white/30 font-mono tracking-widest">cannathera · Monthly Review</span>
                </div>
              </div>

              <div className="p-4 sm:p-5 flex flex-col gap-4">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Monthly Review</div>
                    <div className="text-base font-bold text-white mt-0.5">August 2026</div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-mint/15 border border-mint/25 text-mint text-[10px] font-bold uppercase tracking-wide">
                    <span className="msym text-[12px]">check_circle</span> Report Ready
                  </span>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-white/5 rounded-xl border border-white/5 p-3 flex flex-col gap-1">
                    <span className="text-white/40 text-[9px] font-bold uppercase tracking-wider">Avg. Pain Score</span>
                    <span className="text-xl font-bold text-white">3.2 <span className="text-xs text-mint font-semibold">↓ 1.4</span></span>
                  </div>
                  <div className="bg-white/5 rounded-xl border border-white/5 p-3 flex flex-col gap-1">
                    <span className="text-white/40 text-[9px] font-bold uppercase tracking-wider">Sleep Quality</span>
                    <span className="text-xl font-bold text-mint-bright">Good</span>
                  </div>
                  <div className="bg-white/5 rounded-xl border border-white/5 p-3 flex flex-col gap-1">
                    <span className="text-white/40 text-[9px] font-bold uppercase tracking-wider">Tolerance</span>
                    <span className="text-xl font-bold text-white">Stable</span>
                  </div>
                </div>

                {/* Calendar heatmap */}
                <div className="bg-white/5 rounded-xl border border-white/5 p-3">
                  <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-2.5">Daily Activity — August</div>
                  <div className="grid grid-cols-7 gap-1">
                    {["M","T","W","T","F","S","S"].map((d, i) => (
                      <div key={i} className="text-[8px] text-white/30 text-center font-bold">{d}</div>
                    ))}
                    {[
                      "bg-white/5","bg-mint/20","bg-mint/35","bg-mint/50","bg-mint/35","bg-white/5","bg-white/5",
                      "bg-mint/25","bg-mint/40","bg-mint/55","bg-mint/70","bg-mint/55","bg-white/5","bg-white/5",
                      "bg-mint/20","bg-mint/45","bg-red-500/30","bg-mint/30","bg-mint/50","bg-white/5","bg-white/5",
                      "bg-mint/30","bg-mint/45","bg-mint/60","bg-mint/40","bg-white/5","bg-white/5","bg-white/10",
                    ].map((cls, i) => (
                      <div key={i} className={`h-4 rounded-sm ${cls}`} />
                    ))}
                  </div>
                </div>

                {/* Triage alert */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <span className="msym text-red-400 text-base mt-0.5 shrink-0">warning</span>
                  <div>
                    <div className="text-[10px] font-bold text-red-300 uppercase tracking-wide">Triage Alert · Aug 17</div>
                    <div className="text-[10px] text-white/50 mt-0.5">Pain spike NRS 7 — Dizziness reported. Review recommended.</div>
                  </div>
                  <span className="ml-auto shrink-0 text-[9px] font-bold text-red-400 border border-red-400/30 rounded px-1.5 py-0.5">Review</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. CORE FEATURES (4 Cards) */}
      <section className="py-16 lg:py-24 bg-[#fbfcfc] text-black px-6 lg:px-8">
        <div className="mx-auto max-w-7xl w-full">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Card 1 */}
            <div className="bg-white rounded-3xl border border-hairline p-8 shadow-sm flex flex-col hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-pine/5 text-pine mb-6 border border-pine/10">
                <span className="msym text-2xl">monitoring</span>
              </div>
              <h3 className="text-xl font-display font-extrabold mb-4 text-black">{t("f1_title")}</h3>
              <p className="text-base text-black/70 leading-relaxed">
                {t("f1_text")}
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-3xl border border-hairline p-8 shadow-sm flex flex-col hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-pine/5 text-pine mb-6 border border-pine/10">
                <span className="msym text-2xl">rule</span>
              </div>
              <h3 className="text-xl font-display font-extrabold mb-4 text-black">{t("f2_title")}</h3>
              <p className="text-base text-black/70 leading-relaxed">
                {t("f2_text")}
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-3xl border border-hairline p-8 shadow-sm flex flex-col hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-pine/5 text-pine mb-6 border border-pine/10">
                <span className="msym text-2xl">shield</span>
              </div>
              <h3 className="text-xl font-display font-extrabold mb-4 text-black">{t("f3_title")}</h3>
              <p className="text-base text-black/70 leading-relaxed">
                {t("f3_text")}
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-3xl border border-hairline p-8 shadow-sm flex flex-col hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-pine/5 text-pine mb-6 border border-pine/10">
                <span className="msym text-2xl">focus</span>
              </div>
              <h3 className="text-xl font-display font-extrabold mb-4 text-black">{t("f4_title")}</h3>
              <p className="text-base text-black/70 leading-relaxed">
                {t("f4_text")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

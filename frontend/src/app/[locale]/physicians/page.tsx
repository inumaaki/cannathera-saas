import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";

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
    <div className="bg-white min-h-dvh relative selection:bg-mint selection:text-white">
      
      {/* 1. HERO SECTION (Dark Pine) */}
      <section className="relative bg-[#001c10] text-white min-h-screen flex flex-col px-6 lg:px-8 border-b-4 border-mint overflow-hidden">
        <div className="absolute inset-0 bg-[url('/brand/grid-pattern.svg')] opacity-[0.03] pointer-events-none" style={{ backgroundSize: '40px 40px' }} />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(150,212,178,0.08),transparent_60%)] pointer-events-none translate-x-1/3 -translate-y-1/3" />
        
        <div className="mx-auto max-w-7xl w-full relative z-10 my-auto py-12 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-center">
            {/* Copy */}
            <div className="max-w-2xl flex flex-col justify-center">
              <div className="mb-4 inline-flex self-start items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-mint-bright bg-mint-bright/10 rounded-full border border-mint-bright/20">
                <span className="msym text-base">medical_services</span>
                {t("title")}
              </div>
              <h1 className="text-4xl font-display font-extrabold tracking-tight sm:text-5xl lg:text-[2.75rem] leading-[1.1]">
                {t("hero_title")}
              </h1>
              <p className="mt-3 text-base sm:text-lg leading-relaxed text-white/90 font-medium">
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

            {/* Graphic */}
            <div className="relative w-full rounded-2xl border border-white/10 bg-[#00120a] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col mt-8 lg:mt-0">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              
              <div className="h-12 border-b border-white/5 bg-white/[0.02] flex items-center px-4 gap-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]"/>
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"/>
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]"/>
                </div>
                <div className="h-5 w-48 bg-white/5 rounded flex items-center px-2">
                  <span className="text-[10px] text-white/30 font-mono tracking-widest">cannathera-portal</span>
                </div>
              </div>

              <div className="p-4 sm:p-6 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl border border-white/5 p-4 flex flex-col justify-center">
                    <span className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Active Patients</span>
                    <span className="text-2xl font-bold text-white">124</span>
                  </div>
                  <div className="bg-red-500/10 rounded-xl border border-red-500/20 p-4 flex flex-col justify-center relative overflow-hidden">
                    <span className="text-red-300/70 text-xs font-bold uppercase tracking-wider mb-1">Triage Alerts</span>
                    <span className="text-2xl font-bold text-red-400">3</span>
                    <span className="absolute top-4 right-4 msym text-red-400/50">warning</span>
                  </div>
                </div>
                
                <div className="bg-white/5 rounded-xl border border-white/5 p-4 flex flex-col gap-3">
                  <div className="text-sm font-bold text-white/80 mb-2">Recent Monitoring</div>
                  
                  {/* Row 1 */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-mint/20 text-mint flex items-center justify-center"><span className="msym text-sm">person</span></div>
                      <div>
                        <div className="text-xs font-bold text-white">ID: #9842-AX</div>
                        <div className="text-[10px] text-white/40">Stable progress</div>
                      </div>
                    </div>
                    <div className="w-16 h-4 bg-gradient-to-r from-mint to-transparent rounded opacity-50" />
                  </div>

                  {/* Row 2 */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center"><span className="msym text-sm">monitor_heart</span></div>
                      <div>
                        <div className="text-xs font-bold text-white">ID: #7712-BY</div>
                        <div className="text-[10px] text-red-300">Dizziness reported</div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-red-400">Review</div>
                  </div>

                  {/* Row 3 */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 text-white/50 flex items-center justify-center"><span className="msym text-sm">person</span></div>
                      <div>
                        <div className="text-xs font-bold text-white">ID: #4431-CX</div>
                        <div className="text-[10px] text-white/40">Titration phase</div>
                      </div>
                    </div>
                    <div className="w-16 h-4 bg-gradient-to-r from-white/20 to-transparent rounded opacity-50" />
                  </div>

                  {/* Removed Row 4 to save space */}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. CORE FEATURES (3 Equal Cards) */}
      <section className="py-16 lg:py-24 bg-[#fbfcfc] text-black px-6 lg:px-8">
        <div className="mx-auto max-w-7xl w-full">
          <div className="grid lg:grid-cols-3 gap-8">
            
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

          </div>
        </div>
      </section>

    </div>
  );
}

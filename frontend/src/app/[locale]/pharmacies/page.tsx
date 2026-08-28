import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function PharmaciesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PharmaciesContent />;
}

function PharmaciesContent() {
  const t = useTranslations("pharmacies");

  return (
    <div className="flex min-h-screen max-w-full flex-col overflow-x-clip bg-white selection:bg-mint selection:text-white">
      <LandingHeader />
      
      {/* 1. HERO SECTION */}
      <section className="relative bg-pine text-white min-h-[calc(100vh-4rem)] flex flex-col px-6 lg:px-8 border-b-4 border-mint overflow-hidden">
        <div className="absolute inset-0 bg-[url('/brand/grid-pattern.svg')] opacity-[0.03] pointer-events-none" style={{ backgroundSize: '40px 40px' }} />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(150,212,178,0.08),transparent_60%)] pointer-events-none translate-x-1/3 -translate-y-1/3" />
        
        <div className="mx-auto max-w-7xl w-full relative z-10 my-auto py-12 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-center">
            {/* Copy */}
            <div className="max-w-2xl flex flex-col justify-center">
              <div className="mb-4 inline-flex self-start items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-mint-bright bg-mint-bright/10 rounded-full border border-mint-bright/20">
                <span className="msym text-base">local_pharmacy</span>
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
                  href="/signup/pharmacy"
                  className="group relative flex h-14 items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-8 font-bold text-[#002819] transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                  <span>{t("cta")}</span>
                  <span className="msym text-xl transition-transform group-hover:translate-x-1">arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* Closed-Loop Local Network Graphic - Dynamic Visualization */}
            <div className="relative w-full rounded-2xl border border-mint/20 bg-gradient-to-br from-[#002819] to-[#00120a] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col mt-8 lg:mt-0 p-6 lg:p-8">
              {/* Background Map/Grid Hint */}
              <div className="absolute inset-0 bg-[url('/brand/grid-pattern.svg')] opacity-[0.05] pointer-events-none" style={{ backgroundSize: '20px 20px' }} />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(150,212,178,0.1),transparent_70%)] pointer-events-none" />

              <div className="relative z-10 flex flex-col h-full gap-8 items-center">
                
                {/* Top: Regional Clinic */}
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/20 backdrop-blur-sm">
                    <div className="w-2 h-2 rounded-full bg-mint animate-pulse" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Regional Physician</span>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                    <span className="msym text-pine text-3xl">local_hospital</span>
                  </div>
                </div>

                {/* Middle: The Loop & Patient */}
                <div className="flex w-full items-center justify-between relative px-4">
                  
                  {/* Left Arrow (E-Prescription to Pharmacy) */}
                  <div className="absolute left-[15%] top-1/2 -translate-y-1/2 w-[35%] h-[120px] border-l-2 border-b-2 border-dashed border-mint/40 rounded-bl-[40px] flex flex-col justify-end pb-2 pl-3">
                    <span className="msym text-mint/80 text-xl absolute -bottom-[10px] right-0 translate-x-1/2">arrow_right</span>
                    <span className="text-[9px] font-bold text-mint/80 uppercase tracking-widest bg-[#00120a] px-1 absolute -left-[14px] top-1/2 -translate-y-1/2 -rotate-90">E-Prescription</span>
                  </div>

                  {/* Right Arrow (Feedback to Physician) */}
                  <div className="absolute right-[15%] top-1/2 -translate-y-1/2 w-[35%] h-[120px] border-r-2 border-t-2 border-dashed border-mint/40 rounded-tr-[40px] flex flex-col justify-start pt-2 pr-3">
                    <span className="msym text-mint/80 text-xl absolute -top-[10px] left-0 -translate-x-1/2 rotate-180">arrow_right</span>
                    <span className="text-[9px] font-bold text-mint/80 uppercase tracking-widest bg-[#00120a] px-1 absolute -right-[10px] top-1/2 -translate-y-1/2 rotate-90">Therapy Feedback</span>
                  </div>

                  {/* Center Patient Node */}
                  <div className="w-full flex justify-center z-10">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 rounded-full bg-pine-600 border-2 border-mint flex items-center justify-center relative shadow-[0_0_20px_rgba(150,212,178,0.4)]">
                        <span className="msym text-white text-2xl">person</span>
                        <div className="absolute -bottom-2 bg-mint text-pine text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Patient</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom: Local Pharmacy */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-2xl bg-mint-bright flex items-center justify-center shadow-[0_0_40px_rgba(150,212,178,0.3)] rotate-3 hover:rotate-0 transition-transform">
                    <span className="msym text-pine text-4xl">local_pharmacy</span>
                  </div>
                  <div className="flex items-center gap-2 bg-mint/20 px-4 py-2 rounded-full border border-mint/40 backdrop-blur-sm">
                    <span className="msym text-mint text-[14px]">verified</span>
                    <span className="text-xs font-bold text-mint uppercase tracking-wider">Your Pharmacy</span>
                  </div>
                </div>

                {/* Exclusivity Tag */}
                <div className="absolute bottom-6 right-6 bg-white/10 px-3 py-1.5 rounded border border-white/10 flex items-center gap-2 backdrop-blur-md">
                  <span className="msym text-white/50 text-sm">location_on</span>
                  <span className="text-[10px] text-white/70 font-bold uppercase tracking-wider">30km Closed Loop Radius</span>
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
                <span className="msym text-2xl">local_shipping</span>
              </div>
              <h3 className="text-xl font-display font-extrabold mb-4 text-black">{t("f1_title")}</h3>
              <p className="text-base text-black/70 leading-relaxed">
                {t("f1_text")}
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-3xl border border-hairline p-8 shadow-sm flex flex-col hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-pine/5 text-pine mb-6 border border-pine/10">
                <span className="msym text-2xl">verified</span>
              </div>
              <h3 className="text-xl font-display font-extrabold mb-4 text-black">{t("f2_title")}</h3>
              <p className="text-base text-black/70 leading-relaxed">
                {t("f2_text")}
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-3xl border border-hairline p-8 shadow-sm flex flex-col hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-pine/5 text-pine mb-6 border border-pine/10">
                <span className="msym text-2xl">school</span>
              </div>
              <h3 className="text-xl font-display font-extrabold mb-4 text-black">{t("f3_title")}</h3>
              <p className="text-base text-black/70 leading-relaxed">
                {t("f3_text")}
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-3xl border border-hairline p-8 shadow-sm flex flex-col hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-pine/5 text-pine mb-6 border border-pine/10">
                <span className="msym text-2xl">handshake</span>
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

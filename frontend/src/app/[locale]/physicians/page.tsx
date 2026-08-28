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

            {/* Monthly Review Graphic - PDF Report Style */}
            <div className="relative w-full rounded-2xl border border-white/10 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col mt-8 lg:mt-0 transform lg:rotate-2 hover:rotate-0 transition-transform duration-500 origin-bottom-right">
              {/* Report Header */}
              <div className="border-b-2 border-pine/20 bg-[#f8fdfa] p-5 sm:p-6 flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="msym text-pine text-xl">description</span>
                    <span className="text-xs font-bold text-pine uppercase tracking-widest">Clinical Progress Report</span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-[#002819] mt-2">Monthly Review</h3>
                  <p className="text-sm font-semibold text-pine/70">Period: August 2026</p>
                </div>
                <div className="bg-pine/5 rounded-lg border border-pine/10 p-2 flex flex-col items-center justify-center min-w-[80px]">
                  <span className="text-[10px] font-bold text-pine/50 uppercase tracking-wider mb-1">Status</span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-mint-bright bg-pine px-2 py-1 rounded">
                    <span className="msym text-[14px]">verified</span> Ready
                  </span>
                </div>
              </div>

              {/* Report Body */}
              <div className="p-5 sm:p-6 flex flex-col gap-5 bg-white">
                
                {/* Patient Info Row */}
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-hairline">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Patient ID</span>
                    <span className="text-sm font-bold text-gray-800 font-mono">PT-9942-DE</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Current Protocol</span>
                    <span className="text-sm font-bold text-gray-800">Cannabis Flos 20/1</span>
                  </div>
                </div>

                {/* Clinical Outcomes (Structured Data) */}
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-bold text-pine uppercase tracking-widest">Aggregated Outcomes (30 Days)</span>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Avg Pain (NRS)</span>
                      <div className="flex items-end gap-1">
                        <span className="text-2xl font-extrabold text-gray-900">3.2</span>
                        <span className="text-xs font-bold text-green-600 mb-1">↓ 1.4</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Sleep Quality</span>
                      <span className="text-xl font-bold text-gray-900 mt-1">Improved</span>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Adherence</span>
                      <span className="text-xl font-bold text-gray-900 mt-1">96%</span>
                    </div>
                  </div>
                </div>

                {/* Triage Alert Section */}
                <div className="bg-red-50/50 rounded-xl border border-red-100 p-4 flex gap-3 items-start mt-2">
                  <span className="msym text-red-500 text-xl shrink-0 mt-0.5">notification_important</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-red-700 uppercase tracking-wider">Clinical Alert Flagged</span>
                    <span className="text-sm text-red-900/80 mt-1">Patient reported temporary dizziness on Aug 17 following dosage titration. No subsequent events recorded. Review advised during consultation.</span>
                  </div>
                </div>

                {/* Report Footer / Signature Line */}
                <div className="mt-4 pt-4 border-t border-hairline flex justify-between items-end">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-400 font-mono">Generated: Aug 31, 2026</span>
                    <span className="text-[10px] text-gray-400 font-mono">Validated via Cannathera AI</span>
                  </div>
                  <div className="w-32 h-px bg-gray-300 relative">
                    <span className="absolute -bottom-4 right-0 text-[9px] text-gray-400 uppercase font-bold tracking-wider">Physician Signature</span>
                  </div>
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

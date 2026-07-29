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

            {/* Graphic - Full Dashboard Mockup to balance the large text */}
            <div className="relative w-full rounded-2xl border border-white/10 bg-[#00120a] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col mt-8 lg:mt-0">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              
              <div className="h-12 border-b border-white/5 bg-white/[0.02] flex items-center px-4 gap-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]"/>
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"/>
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]"/>
                </div>
                <div className="h-5 w-48 bg-white/5 rounded flex items-center px-2">
                  <span className="text-[10px] text-white/30 font-mono tracking-widest">cannathera-rx</span>
                </div>
              </div>

              <div className="p-4 sm:p-6 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl border border-white/5 p-4 flex flex-col justify-center">
                    <span className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Pending Rx</span>
                    <span className="text-2xl font-bold text-white">42</span>
                  </div>
                  <div className="bg-mint/10 rounded-xl border border-mint/20 p-4 flex flex-col justify-center relative overflow-hidden">
                    <span className="text-mint/70 text-xs font-bold uppercase tracking-wider mb-1">Dispatched Today</span>
                    <span className="text-2xl font-bold text-mint-bright">18</span>
                    <span className="absolute top-4 right-4 msym text-mint/50">local_shipping</span>
                  </div>
                </div>
                
                <div className="bg-white/5 rounded-xl border border-white/5 p-4 flex flex-col gap-3">
                  <div className="text-sm font-bold text-white/80 mb-2">Live Fulfillment Queue</div>
                  
                  {/* Row 1 */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-mint/10 border border-mint/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-mint/20 text-mint flex items-center justify-center"><span className="msym text-sm">receipt_long</span></div>
                      <div>
                        <div className="text-xs font-bold text-white">Rx: #4812-XX</div>
                        <div className="text-[10px] text-mint">Approved - Ready for dispense</div>
                      </div>
                    </div>
                    <div className="text-[10px] px-2 py-1 bg-mint-bright text-[#001c10] font-bold rounded">New</div>
                  </div>

                  {/* Row 2 */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 text-white/50 flex items-center justify-center"><span className="msym text-sm">pending_actions</span></div>
                      <div>
                        <div className="text-xs font-bold text-white/70">Rx: #4811-XY</div>
                        <div className="text-[10px] text-white/40">Verifying Physician...</div>
                      </div>
                    </div>
                    <div className="w-16 h-2 bg-white/10 rounded overflow-hidden">
                       <div className="w-1/2 h-full bg-white/30 animate-pulse" />
                    </div>
                  </div>

                  {/* Row 3 */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 opacity-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 text-white/50 flex items-center justify-center"><span className="msym text-sm">local_shipping</span></div>
                      <div>
                        <div className="text-xs font-bold text-white/70">Rx: #4809-AA</div>
                        <div className="text-[10px] text-white/40">Dispatched</div>
                      </div>
                    </div>
                    <div className="msym text-white/30 text-sm">check_circle</div>
                  </div>

                  {/* Removed Row 4 to save space */}
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

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

            {/* Closed-Loop Local Network Graphic */}
            <div className="relative w-full rounded-2xl border border-white/10 bg-[#00120a] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col mt-8 lg:mt-0">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

              {/* Browser chrome */}
              <div className="h-12 border-b border-white/5 bg-white/[0.02] flex items-center px-4 gap-4 shrink-0">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]"/>
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"/>
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]"/>
                </div>
                <div className="h-5 w-52 bg-white/5 rounded flex items-center px-2">
                  <span className="text-[10px] text-white/30 font-mono tracking-widest">cannathera · Local Network</span>
                </div>
              </div>

              <div className="p-4 sm:p-5 flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Closed-Loop System</div>
                    <div className="text-base font-bold text-white mt-0.5">Local Care Network</div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-mint/15 border border-mint/25 text-mint text-[10px] font-bold uppercase tracking-wide">
                    <span className="msym text-[12px]">location_on</span> 30 km Radius
                  </span>
                </div>

                {/* Node diagram */}
                <div className="relative bg-white/[0.03] rounded-xl border border-white/5 p-4 flex flex-col items-center gap-3">
                  {/* Top row: Physician ← → Patient */}
                  <div className="flex items-center justify-between w-full gap-2">
                    {/* Physician node */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-12 h-12 rounded-2xl bg-[#0d3d27] border border-mint/20 flex items-center justify-center">
                        <span className="msym text-mint text-xl">stethoscope</span>
                      </div>
                      <span className="text-[9px] font-bold text-white/60 uppercase tracking-wide">Physician</span>
                    </div>

                    {/* Arrow row */}
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1 w-full">
                        <div className="flex-1 h-px bg-gradient-to-r from-mint/40 to-mint/20" />
                        <span className="text-[8px] text-mint/60 font-bold whitespace-nowrap px-1">E-Prescription</span>
                        <div className="flex-1 h-px bg-gradient-to-l from-mint/40 to-mint/20" />
                      </div>
                    </div>

                    {/* Patient node */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-12 h-12 rounded-2xl bg-[#1a1a2e] border border-white/10 flex items-center justify-center">
                        <span className="msym text-white/70 text-xl">person</span>
                      </div>
                      <span className="text-[9px] font-bold text-white/60 uppercase tracking-wide">Patient</span>
                    </div>
                  </div>

                  {/* Vertical connectors */}
                  <div className="flex items-center justify-between w-full px-6">
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-px h-5 bg-gradient-to-b from-mint/30 to-transparent" />
                      <span className="msym text-mint/40 text-xs">arrow_downward</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-[8px] text-white/20 italic">Cannathera routes &amp; structures</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-px h-5 bg-gradient-to-b from-white/20 to-transparent" />
                      <span className="msym text-white/30 text-xs">arrow_downward</span>
                    </div>
                  </div>

                  {/* Centre: Cannathera hub */}
                  <div className="flex items-center justify-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-16 h-16 rounded-2xl bg-pine border border-mint/30 flex items-center justify-center shadow-[0_0_20px_rgba(150,212,178,0.15)]">
                        <span className="msym text-mint-bright text-2xl">hub</span>
                      </div>
                      <span className="text-[9px] font-bold text-mint uppercase tracking-wider">Cannathera Hub</span>
                    </div>
                  </div>

                  {/* Bottom connector to pharmacy */}
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="msym text-mint/40 text-xs">arrow_downward</span>
                    <div className="w-px h-3 bg-gradient-to-b from-transparent to-mint/30" />
                  </div>

                  {/* Bottom: Pharmacy node */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#0d3d27] border border-mint/30 flex items-center justify-center">
                      <span className="msym text-mint text-xl">local_pharmacy</span>
                    </div>
                    <span className="text-[9px] font-bold text-white/60 uppercase tracking-wide">Your Pharmacy</span>
                  </div>

                  {/* Outcome feedback tag */}
                  <div className="w-full flex items-center justify-center">
                    <span className="inline-flex items-center gap-1 text-[9px] text-white/30 font-semibold">
                      <span className="msym text-[11px] text-mint/40">sync</span>
                      Outcome data loops back to prescriber
                    </span>
                  </div>
                </div>

                {/* Stats strip */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/5 rounded-lg border border-white/5 p-2.5 text-center">
                    <div className="text-[9px] text-white/40 font-bold uppercase">Pending Rx</div>
                    <div className="text-lg font-bold text-white mt-0.5">42</div>
                  </div>
                  <div className="bg-mint/10 rounded-lg border border-mint/20 p-2.5 text-center">
                    <div className="text-[9px] text-mint/70 font-bold uppercase">Dispatched</div>
                    <div className="text-lg font-bold text-mint-bright mt-0.5">18</div>
                  </div>
                  <div className="bg-white/5 rounded-lg border border-white/5 p-2.5 text-center">
                    <div className="text-[9px] text-white/40 font-bold uppercase">Partners</div>
                    <div className="text-lg font-bold text-white mt-0.5">3</div>
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

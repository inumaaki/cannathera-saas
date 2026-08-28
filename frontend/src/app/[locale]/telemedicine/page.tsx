import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function TelemedicinePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <TelemedicineContent />;
}

function TelemedicineContent() {
  const t = useTranslations("telemedicine");

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
                <span className="msym text-base">api</span>
                {t("title")}
              </div>
              <h1 className="text-3xl font-display font-extrabold tracking-tight sm:text-4xl lg:text-[2.5rem] leading-[1.1]">
                {t("v2_hero_title")}
              </h1>
              <p className="mt-4 text-base sm:text-lg leading-relaxed text-white/90 font-medium">
                {t("v2_hero_intro")}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signup/telemedicine"
                  className="group relative flex h-14 items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-8 font-bold text-[#002819] transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                  <span>{t("cta")}</span>
                  <span className="msym text-xl transition-transform group-hover:translate-x-1">arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* Enterprise API Architecture Graphic */}
            <div className="relative w-full rounded-2xl border border-pine/20 bg-gradient-to-br from-[#0d2a1c] to-[#04110a] shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col mt-8 lg:mt-0 p-5 lg:p-7 group">
              
              {/* Background Elements */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(150,212,178,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(150,212,178,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
              
              <div className="relative z-10 flex flex-col h-full gap-5">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-mint/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-mint/10 border border-mint/30 flex items-center justify-center">
                      <span className="msym text-mint text-lg">api</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-wide">Cannathera Enterprise API</h4>
                      <p className="text-[10px] text-mint/60 font-mono mt-0.5">v2.4.0-stable · EU-Central Node</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1a1a2e] border border-white/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
                    <span className="text-[9px] font-bold text-mint uppercase tracking-widest">99.99% SLA Uptime</span>
                  </div>
                </div>

                {/* API Request Flow */}
                <div className="flex flex-col gap-4 py-2">
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Live Telemetry Stream</span>
                  
                  {/* Code Block Snippet */}
                  <div className="bg-[#050b08] rounded-xl border border-white/5 p-4 font-mono text-[10px] sm:text-xs leading-loose relative overflow-hidden group-hover:border-mint/20 transition-colors">
                    <div className="absolute top-0 right-0 p-2 opacity-30">
                      <span className="msym text-mint">code</span>
                    </div>
                    <div className="text-mint/40">POST <span className="text-white">/v2/telemedicine/triage/eval</span></div>
                    <div className="text-white/30 pl-4">{"{"}</div>
                    <div className="text-white/60 pl-8"><span className="text-mint-bright/80">"patient_id"</span>: <span className="text-amber-200/80">"PT-904X-E"</span>,</div>
                    <div className="text-white/60 pl-8"><span className="text-mint-bright/80">"nrs_pain_score"</span>: <span className="text-blue-300">4</span>,</div>
                    <div className="text-white/60 pl-8"><span className="text-mint-bright/80">"dizziness_flag"</span>: <span className="text-blue-300">false</span></div>
                    <div className="text-white/30 pl-4">{"}"}</div>
                  </div>
                </div>

                {/* Integration Nodes */}
                <div className="mt-auto grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.03] rounded-xl border border-white/10 p-3 flex items-start gap-3">
                    <span className="msym text-mint/60 text-xl shrink-0">webhook</span>
                    <div>
                      <div className="text-[11px] font-bold text-white">Event Webhooks</div>
                      <div className="text-[9px] text-white/40 mt-1 leading-relaxed">Bidirectional sync with proprietary EMR systems.</div>
                    </div>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl border border-white/10 p-3 flex items-start gap-3">
                    <span className="msym text-mint/60 text-xl shrink-0">verified_user</span>
                    <div>
                      <div className="text-[11px] font-bold text-white">White-Label Auth</div>
                      <div className="text-[9px] text-white/40 mt-1 leading-relaxed">SSO integration for seamless patient onboarding.</div>
                    </div>
                  </div>
                </div>

                {/* Footer Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-mint/10">
                  <div className="flex items-center gap-2">
                    <span className="msym text-[14px] text-mint">security</span>
                    <span className="text-[9px] text-white/60 font-bold uppercase tracking-wider">AES-256 Encrypted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="msym text-[14px] text-mint">speed</span>
                    <span className="text-[9px] text-white/60 font-bold uppercase tracking-wider">Avg Latency: 11ms</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THREE KEY ADDED VALUES */}
      <section className="py-16 lg:py-24 bg-[#fbfcfc] text-black px-6 lg:px-8">
        <div className="mx-auto max-w-7xl w-full">
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Card 1 */}
            <div className="bg-white rounded-3xl border border-hairline p-8 shadow-sm flex flex-col hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-pine/5 text-pine mb-6 border border-pine/10">
                <span className="msym text-2xl">shield</span>
              </div>
              <h3 className="text-xl font-display font-extrabold mb-4 text-black">{t("v2_f1_title")}</h3>
              <p className="text-base text-black/70 leading-relaxed">
                {t("v2_f1_text")}
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-3xl border border-hairline p-8 shadow-sm flex flex-col hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-pine/5 text-pine mb-6 border border-pine/10">
                <span className="msym text-2xl">favorite</span>
              </div>
              <h3 className="text-xl font-display font-extrabold mb-4 text-black">{t("v2_f2_title")}</h3>
              <p className="text-base text-black/70 leading-relaxed">
                {t("v2_f2_text")}
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-3xl border border-hairline p-8 shadow-sm flex flex-col hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-pine/5 text-pine mb-6 border border-pine/10">
                <span className="msym text-2xl">filter_alt</span>
              </div>
              <h3 className="text-xl font-display font-extrabold mb-4 text-black">{t("v2_f3_title")}</h3>
              <p className="text-base text-black/70 leading-relaxed">
                {t("v2_f3_text")}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 3. FURTHER KEY FEATURES (4 items) */}
      <section className="py-16 lg:py-24 bg-white text-black px-6 lg:px-8 border-t border-hairline">
        <div className="mx-auto max-w-7xl w-full">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-display font-extrabold tracking-tight text-pine">
              {t("subtitle")}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col">
              <div className="w-10 h-10 rounded-full bg-pine text-white flex items-center justify-center mb-4">
                <span className="msym text-xl">devices</span>
              </div>
              <h4 className="font-bold text-lg mb-2 text-ink-strong">{t("v2_feat1_title")}</h4>
              <p className="text-sm text-black/70 leading-relaxed">{t("v2_feat1_text")}</p>
            </div>
            <div className="flex flex-col">
              <div className="w-10 h-10 rounded-full bg-pine text-white flex items-center justify-center mb-4">
                <span className="msym text-xl">api</span>
              </div>
              <h4 className="font-bold text-lg mb-2 text-ink-strong">{t("v2_feat2_title")}</h4>
              <p className="text-sm text-black/70 leading-relaxed">{t("v2_feat2_text")}</p>
            </div>
            <div className="flex flex-col">
              <div className="w-10 h-10 rounded-full bg-pine text-white flex items-center justify-center mb-4">
                <span className="msym text-xl">gavel</span>
              </div>
              <h4 className="font-bold text-lg mb-2 text-ink-strong">{t("v2_feat3_title")}</h4>
              <p className="text-sm text-black/70 leading-relaxed">{t("v2_feat3_text")}</p>
            </div>
            <div className="flex flex-col">
              <div className="w-10 h-10 rounded-full bg-pine text-white flex items-center justify-center mb-4">
                <span className="msym text-xl">brush</span>
              </div>
              <h4 className="font-bold text-lg mb-2 text-ink-strong">{t("v2_feat4_title")}</h4>
              <p className="text-sm text-black/70 leading-relaxed">{t("v2_feat4_text")}</p>
            </div>
          </div>
          <div className="mt-16 text-center">
            <Link
              href="/signup/telemedicine"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-pine px-8 font-bold text-white transition-all hover:bg-pine-600 hover:scale-105 shadow-md"
            >
              <span>{t("cta")}</span>
              <span className="msym text-xl">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

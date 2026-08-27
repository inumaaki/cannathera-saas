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

            {/* Enterprise Dashboard Graphic */}
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
                  <span className="text-[10px] text-white/30 font-mono tracking-widest">cannathera · Enterprise Admin</span>
                </div>
              </div>

              <div className="p-4 sm:p-5 flex flex-col gap-3.5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Enterprise Overview</div>
                    <div className="text-base font-bold text-white mt-0.5">Telemedicine Platform</div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-mint/10 border border-mint/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
                    <span className="text-[9px] font-bold text-mint uppercase tracking-wide">SLA 99.99%</span>
                  </div>
                </div>

                {/* Top KPI strip */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/5 rounded-xl border border-white/5 p-3 flex flex-col gap-0.5">
                    <span className="text-white/40 text-[9px] font-bold uppercase tracking-wider">Active Clinics</span>
                    <span className="text-xl font-bold text-white">14</span>
                  </div>
                  <div className="bg-mint/10 rounded-xl border border-mint/20 p-3 flex flex-col gap-0.5">
                    <span className="text-mint/70 text-[9px] font-bold uppercase tracking-wider">Patients / Mo</span>
                    <span className="text-xl font-bold text-mint-bright">8,240</span>
                  </div>
                  <div className="bg-white/5 rounded-xl border border-white/5 p-3 flex flex-col gap-0.5">
                    <span className="text-white/40 text-[9px] font-bold uppercase tracking-wider">Avg. Latency</span>
                    <span className="text-xl font-bold text-white">11ms</span>
                  </div>
                </div>

                {/* Physician workload triage */}
                <div className="bg-white/5 rounded-xl border border-white/5 p-3 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/60 font-bold uppercase tracking-wide">Physician Workload — Triage Distribution</span>
                    <span className="text-[9px] text-white/30">This month</span>
                  </div>
                  {[
                    { label: "Stable / Routine", pct: 68, color: "bg-mint/60" },
                    { label: "Watchlist Review", pct: 23, color: "bg-amber-400/60" },
                    { label: "Immediate Alert", pct: 9, color: "bg-red-400/70" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center gap-2">
                      <span className="text-[9px] text-white/40 w-28 shrink-0">{row.label}</span>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${row.color}`} style={{ width: `${row.pct}%` }} />
                      </div>
                      <span className="text-[9px] font-bold text-white/50 w-6 text-right">{row.pct}%</span>
                    </div>
                  ))}
                </div>

                {/* Session pipeline */}
                <div className="bg-white/5 rounded-xl border border-white/5 p-3 flex flex-col gap-2">
                  <span className="text-[10px] text-white/60 font-bold uppercase tracking-wide">Live Session Pipeline</span>
                  {[
                    { id: "sess_9A2", clinic: "Clinic Berlin", status: "Active", statusColor: "text-mint bg-mint/10 border-mint/20" },
                    { id: "sess_7C1", clinic: "Clinic Hamburg", status: "Scheduled", statusColor: "text-white/50 bg-white/5 border-white/10" },
                    { id: "sess_3F8", clinic: "Clinic München", status: "Completed", statusColor: "text-white/30 bg-white/5 border-white/5" },
                  ].map((s) => (
                    <div key={s.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.03] border border-white/5">
                      <span className="msym text-white/30 text-sm shrink-0">videocam</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-white/70 font-mono">{s.id}</div>
                        <div className="text-[9px] text-white/30 truncate">{s.clinic}</div>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${s.statusColor}`}>{s.status}</span>
                    </div>
                  ))}
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

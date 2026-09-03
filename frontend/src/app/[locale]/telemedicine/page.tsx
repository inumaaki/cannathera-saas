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
            <div className="relative w-full rounded-2xl border border-pine/20 shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col mt-8 lg:mt-0 group bg-[#04110a]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={t("hero_image") || "/brand/telemedicine_flow_graphic.jpg"}
                alt={t("hero_image_alt") || "Enterprise API Architecture"}
                className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
              />
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

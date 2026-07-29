import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { BackButton } from "@/components/ui/BackButton";

import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <TermsContent />;
}

function TermsContent() {
  const t = useTranslations("terms");

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <LandingHeader />
      
      <main className="flex-1 bg-gradient-to-br from-surface to-sage-50/30 px-6 py-12 md:py-20 relative overflow-hidden">
        {/* Subtle Background Elements */}
        <div className="absolute top-0 right-0 -mr-32 -mt-32 h-96 w-96 rounded-full bg-pine-100/40 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 h-96 w-96 rounded-full bg-sage-100/40 blur-3xl" />

        <div className="mx-auto max-w-4xl relative z-10">
          <div className="mb-8">
            <BackButton />
          </div>

          <div className="overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl shadow-pine-900/5 ring-1 ring-black/5">
            {/* Header Section */}
            <div className="border-b border-hairline bg-gradient-to-r from-pine-50/50 to-transparent px-8 md:px-12 py-10 md:py-14">
              <div className="inline-flex items-center justify-center rounded-xl bg-white p-3 shadow-sm ring-1 ring-hairline mb-6">
                <span aria-hidden className="msym text-2xl text-pine-600">
                  gavel
                </span>
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-ink-strong">
                {t("title")}
              </h1>
              <p className="mt-4 text-base font-medium text-pine-600/80">
                {t("lastUpdated")}
              </p>
            </div>

            {/* Content Section */}
            <div className="px-8 md:px-12 py-10 md:py-14">
              <div className="space-y-12">
                {(["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"] as const).map((s) => (
                  <section 
                    key={s} 
                    className="relative"
                  >
                    <h2 className="font-display text-xl font-semibold text-ink-strong tracking-tight">
                      {t(`${s}Title` as Parameters<typeof t>[0])}
                    </h2>
                    <div className="mt-4 prose prose-sage prose-sm md:prose-base max-w-none text-muted leading-relaxed">
                      {t(`${s}Text` as Parameters<typeof t>[0]).split('\n').map((paragraph, pIdx) => (
                        <p key={pIdx} className="mb-4 last:mb-0">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}


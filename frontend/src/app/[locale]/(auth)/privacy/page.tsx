import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { BrandMark } from "@/components/auth/BrandMark";
import { BackButton } from "@/components/ui/BackButton";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";

/* Datenschutzerklärung (DSGVO). Pre-final draft — legal review before launch. */
export default function PrivacyPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const t = useTranslations("legal.privacy");
  const s = useTranslations("legal.privacy.sections");

  const sections: Array<[string, string]> = [
    [s("controllerHeading"), s("controller")],
    [s("dataHeading"), s("data")],
    [s("purposeHeading"), s("purpose")],
    [s("sharingHeading"), s("sharing")],
    [s("storageHeading"), s("storage")],
    [s("rightsHeading"), s("rights")],
    [s("retentionHeading"), s("retention")],
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <LandingHeader />
      
      <main className="flex-1 bg-gradient-to-br from-surface to-sage-50/30 px-6 py-12 md:py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-32 -mt-32 h-96 w-96 rounded-full bg-pine-100/40 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 h-96 w-96 rounded-full bg-sage-100/40 blur-3xl" />

        <div className="mx-auto max-w-4xl relative z-10">
          <div className="mb-8">
            <BackButton />
          </div>

          <div className="overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl shadow-pine-900/5 ring-1 ring-black/5">
            <div className="border-b border-hairline bg-gradient-to-r from-pine-50/50 to-transparent px-8 md:px-12 py-10 md:py-14">
              <div className="inline-flex items-center justify-center rounded-xl bg-white p-3 shadow-sm ring-1 ring-hairline mb-6">
                <span aria-hidden className="msym text-2xl text-pine-600">
                  shield_person
                </span>
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-ink-strong">
                {t("title")}
              </h1>
              <p className="mt-4 text-base font-medium text-pine-600/80">
                {t("intro")}
              </p>
            </div>

            <div className="px-8 md:px-12 py-10 md:py-14">
              <div className="space-y-12">
                {sections.map(([heading, body]) => (
                  <section key={heading} className="relative">
                    <h2 className="font-display text-xl font-semibold text-ink-strong tracking-tight">
                      {heading}
                    </h2>
                    <div className="mt-4 prose prose-sage prose-sm md:prose-base max-w-none text-muted leading-relaxed">
                      {body.split('\n').map((paragraph, pIdx) => (
                        <p key={pIdx} className="mb-4 last:mb-0">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
              
              <div className="mt-12 rounded-2xl bg-pine-50/50 px-6 py-5 border border-pine-100/50">
                <p className="text-sm text-pine-900/80 leading-relaxed mb-2">
                  {t("notice")}
                </p>
                <p className="text-xs text-pine-900/60">
                  {t("updated")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

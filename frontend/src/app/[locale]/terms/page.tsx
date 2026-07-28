import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

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
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-display font-bold text-ink-strong">{t("title")}</h1>
      <p className="mt-2 text-sm text-muted">{t("lastUpdated")}</p>

      <div className="mt-10 space-y-8">
        {(["s1", "s2", "s3", "s4", "s5", "s6"] as const).map((s) => (
          <section key={s}>
            <h2 className="text-xl font-bold text-ink-strong">
              {t(`${s}Title` as Parameters<typeof t>[0])}
            </h2>
            <p className="mt-3 leading-relaxed text-ink">
              {t(`${s}Text` as Parameters<typeof t>[0])}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}

import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Link } from "@/i18n/navigation";
import { LOCALES, LOCALE_LABELS } from "@cannathera/shared";

// TEMPORARY foundation-verification page (M0). Real UI comes from Figma (M2+).
// Verifies: locale routing + fallback, RTL, brand tokens, watermark, icon font.
export default function HomePage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const t = useTranslations();

  return (
    <main className="flex-1 p-6">
      <header className="bg-brand-gradient text-white rounded-lg p-6">
        <h1 className="text-2xl font-semibold">{t("home.title")}</h1>
        <p className="opacity-90">{t("home.subtitle")}</p>
      </header>

      <section className="cw-watermark bg-white border border-hairline rounded-lg p-6 mt-6">
        <p className="mb-4">
          <span className="msym text-accent align-middle me-2">medication</span>
          {t("app.tagline")}
        </p>
        <Link
          href="/login"
          className="inline-block bg-accent hover:bg-brand text-white font-bold rounded-lg px-5 py-2.5 transition-colors shadow-sm text-sm"
        >
          {t("common.login")}
        </Link>
      </section>

      <nav className="mt-6 flex gap-4">
        {LOCALES.map((l) => (
          <Link key={l} href="/" locale={l} className="text-brand-600 underline">
            {LOCALE_LABELS[l]}
          </Link>
        ))}
      </nav>

      <footer className="mt-8 text-sm opacity-70">{t("common.poweredBy")}</footer>
    </main>
  );
}

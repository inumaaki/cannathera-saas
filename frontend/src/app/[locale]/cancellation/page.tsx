import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { BackButton } from "@/components/ui/BackButton";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function CancellationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CancellationContent />;
}

function CancellationContent() {
  const t = useTranslations("cancellation");

  return (
    <div className="min-h-dvh bg-surface px-6 py-10">
      <div className="cw-watermark mx-auto max-w-3xl rounded-xl border border-hairline bg-white px-8 py-10">
        <div className="mb-6">
          <BackButton />
        </div>

        <h1 className="font-display text-3xl font-bold text-ink-strong">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("lastUpdated")}</p>

        <div className="mt-8 space-y-8">
          <section>
            <p className="mt-2 leading-relaxed text-muted">
              {t("text")}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

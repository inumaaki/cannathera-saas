import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Link } from "@/i18n/navigation";
import { BrandMark } from "@/components/auth/BrandMark";

/* Impressum (§ 5 TMG/DDG). Placeholders in brackets get final data before launch. */
export default function ImprintPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const t = useTranslations("legal.imprint");
  const tc = useTranslations("common");

  const sections: Array<[string, string]> = [
    [t("providerHeading"), t("provider")],
    [t("contactHeading"), t("contact")],
    [t("responsibleHeading"), t("responsible")],
    [t("disputeHeading"), t("dispute")],
  ];

  return (
    <div className="min-h-dvh bg-surface px-6 py-10">
      <div className="cw-watermark mx-auto max-w-3xl rounded-xl border border-hairline bg-white px-8 py-10">
        <BrandMark />
        <h1 className="mt-8 font-display text-3xl font-bold text-ink-strong">
          {t("title")}
        </h1>

        {sections.map(([heading, body]) => (
          <section key={heading} className="mt-8">
            <h2 className="font-bold text-ink-strong">{heading}</h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-muted">{body}</p>
          </section>
        ))}

        <p className="mt-10 rounded-lg bg-surface px-4 py-3 text-sm text-sage-900">
          {t("notice")}
        </p>

        <p className="mt-8">
          <Link href="/login" className="font-bold text-pine-600 hover:underline">
            ← {tc("login")}
          </Link>
        </p>
      </div>
    </div>
  );
}

import { getTranslations, setRequestLocale } from "next-intl/server";
import { apiServer } from "@/lib/api-server";
import { BrandingForm } from "@/components/enterprise/BrandingForm";

type Overview = {
  branding: {
    logoUrl?: string | null;
    primaryColor?: string | null;
    accentColor?: string | null;
    fontFamily?: string | null;
  } | null;
};

/* Figma 8.6 — Branding. */
export default async function EnterpriseBranding({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, d] = await Promise.all([
    getTranslations("enterprise.branding"),
    apiServer<Overview>("/enterprise/overview"),
  ]);

  return (
    <>
      <div>
        <h1 className="font-display text-4xl font-bold text-pine">{t("title")}</h1>
        <p className="mt-1 max-w-2xl text-muted">{t("subtitle")}</p>
      </div>
      <BrandingForm initial={d?.branding ?? {}} />
    </>
  );
}

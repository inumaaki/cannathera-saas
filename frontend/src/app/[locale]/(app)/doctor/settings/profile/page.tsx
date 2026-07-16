import { getTranslations, setRequestLocale } from "next-intl/server";
import { apiServer } from "@/lib/api-server";
import { LogoUpload } from "./LogoUpload";
import { PracticeForm } from "./PracticeForm";
import { requirePermission } from "@/lib/permissions";

type Org = {
  id: string;
  name: string;
  branding: Record<string, string> | null;
};

/* Figma 5.7 Profile — Clinic Identity (persists to Organization). */
export default async function SettingsProfile({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);


  const denied = await requirePermission("settings:practice");

  if (denied) return denied;

  const [t, org] = await Promise.all([
    getTranslations("doctor.settings"),
    apiServer<Org>("/doctor/practice"),
  ]);

  return (
    <section className="cw-watermark overflow-hidden rounded-xl border border-hairline bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-[#f6f8fc] px-6 py-4">
        <div>
          <h2 className="font-bold text-ink-strong">{t("clinicIdentity")}</h2>
          <p className="text-sm text-muted">{t("clinicIdentitySub")}</p>
        </div>
      </div>
      <div className="p-6">
        {/* Logo upload */}
        <p className="font-semibold text-ink-strong">{t("practiceLogo")}</p>
        <div className="mt-3 flex flex-wrap gap-6">
          <LogoUpload currentLogoUrl={(org?.branding?.logoUrl as string) ?? null} />
          <div className="max-w-sm">
            <p className="font-bold text-ink-strong">{t("brandingGuidelines")}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{t("brandingText")}</p>
            <p className="mt-2 font-mono text-xs text-muted">SVG, PNG, JPG (max 5 MB)</p>
          </div>
        </div>

        <hr className="my-6 border-hairline" />
        {org ? <PracticeForm org={org} /> : null}
      </div>
    </section>
  );
}

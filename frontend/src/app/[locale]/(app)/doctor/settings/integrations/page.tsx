import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PlannedNotice } from "./PlannedNotice";
import { requirePermission } from "@/lib/permissions";

/* Figma 5.7 Integrations & APIs — honest statuses: Zoom lands with M9,
   webhooks with the Enterprise module M8. */
export default async function SettingsIntegrations({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);


  const denied = await requirePermission("settings:practice");

  if (denied) return denied;
  const t = await getTranslations("doctor.settings");

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-pine">
            {t("integrationsTitle")}
          </h2>
          <p className="mt-1 text-muted">{t("integrationsSub")}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/doctor/help"
            className="flex h-11 items-center rounded-lg border border-hairline bg-white px-5 text-sm font-bold text-ink-strong hover:bg-surface"
          >
            {t("docs")}
          </Link>
          <PlannedNotice
            module="M8/M9"
            notice={t("integrationNotice", { module: "M8/M9" })}
            label={t("newConnection")}
            icon="add"
            primary
          />
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-hairline bg-white p-5">
          <div className="flex items-start justify-between">
            <span className="flex size-12 items-center justify-center rounded-xl bg-[#eef2fe] text-[24px] text-info">
              <span aria-hidden className="msym">videocam</span>
            </span>
            <span className="rounded-full bg-[#fdf3d7] px-3 py-1 text-[10px] font-bold uppercase text-gold">
              {t("planned")}
            </span>
          </div>
          <h3 className="mt-4 text-lg font-bold text-ink-strong">{t("zoomTitle")}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">{t("zoomText")}</p>
        </div>

        <div className="rounded-xl border border-hairline bg-white p-5">
          <div className="flex items-start justify-between">
            <span className="flex size-12 items-center justify-center rounded-xl bg-mint/30 text-[24px] text-pine-600">
              <span aria-hidden className="msym">webhook</span>
            </span>
            <span className="rounded-full bg-[#fdf3d7] px-3 py-1 text-[10px] font-bold uppercase text-gold">
              {t("planned")}
            </span>
          </div>
          <h3 className="mt-4 text-lg font-bold text-ink-strong">{t("webhooks")}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">{t("webhooksText")}</p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-info/40 bg-[#eef2fe]/50 p-8 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-white text-[26px] text-ink-strong">
            <span aria-hidden className="msym">apps</span>
          </span>
          <h3 className="mt-4 text-lg font-bold text-ink-strong">{t("marketplace")}</h3>
          <p className="mt-1 text-sm text-muted">{t("marketplaceText")}</p>
        </div>
      </div>
    </>
  );
}

import { getTranslations, setRequestLocale } from "next-intl/server";
import { apiServer } from "@/lib/api-server";
import { NotificationToggles } from "./NotificationToggles";
import { requirePermission } from "@/lib/permissions";

type Org = { branding: Record<string, unknown> | null };

/* Figma 5.7 Notification Settings — persisted to Organization settings. */
export default async function SettingsNotifications({
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

  const saved = (org?.branding?.notifications ?? {}) as Record<string, boolean>;

  return (
    <>
      <h2 className="font-display text-2xl font-bold text-pine">{t("notifTitle")}</h2>
      <p className="mt-1 text-muted">{t("notifSub")}</p>
      <div className="mt-5">
        <NotificationToggles
          initial={saved}
          labels={{
            clinicalAlerts: t("clinicalAlerts"),
            realtime: t("realtime"),
            background: t("background"),
            systemNotifs: t("systemNotifs"),
            save: t("save"),
            saved: t("saved"),
            items: {
              redFlags: { title: t("redFlagAlerts"), text: t("redFlagText") },
              newLogs: { title: t("newLogs"), text: t("newLogsText") },
              apptReminders: { title: t("apptReminders"), text: t("apptRemindersText") },
              dailySummaries: { title: t("dailySummaries"), text: t("dailySummariesText") },
              securityAlerts: { title: t("securityAlerts"), text: t("securityAlertsText") },
            },
          }}
        />
      </div>
    </>
  );
}

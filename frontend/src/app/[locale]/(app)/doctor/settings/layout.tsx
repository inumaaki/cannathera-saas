import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSessionUser } from "@/lib/session";
import { SettingsNav } from "./SettingsNav";

/* Settings shell (Figma 5.7.x): section sub-sidebar + content.
   Sections are filtered by the member's permissions. */
export default async function SettingsLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, user] = await Promise.all([
    getTranslations("doctor.settings"),
    getSessionUser(),
  ]);
  const perms = user?.permissions ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
      <aside className="self-start rounded-xl border border-hairline bg-white p-4">
        <p className="px-2 pb-2 text-sm font-bold text-ink-strong">{t("sections")}</p>
        <SettingsNav
          permissions={perms}
          labels={{
            profile: t("profile"),
            team: t("team"),
            notifications: t("notifications"),
            compliance: t("compliance"),
            integrations: t("integrations"),
          }}
        />
      </aside>
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-bold text-pine">{t("title")}</h1>
        <p className="mt-1 text-muted">{t("subtitle")}</p>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

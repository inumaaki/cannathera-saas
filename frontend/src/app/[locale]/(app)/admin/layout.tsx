import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/session";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    redirect({ href: "/login", locale });
  }

  const name =
    [user!.firstName, user!.lastName].filter(Boolean).join(" ") || user!.email;

  return (
    <AdminShell
      userName={name}
      labels={{
        systemControl: t("systemControl"),
        systemAdmin: t("systemAdmin"),
        controlCenter: t("controlCenter"),
        exit: t("exit"),
        menu: t("openMenu"),
        close: t("close"),
        adminSections: t("adminSections"),
        sections: {
          partners: t("partners"),
          users: t("usersRegistry"),
          plans: t("pricingPlans"),
          logs: t("auditEventLogs"),
        },
      }}
    >
      {children}
    </AdminShell>
  );
}

import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { apiServer } from "@/lib/api-server";
import { getSessionUser } from "@/lib/session";
import { PatientShell, type Notification } from "@/components/patient/PatientShell";

type Summary = {
  todayLogged: boolean;
  nextAppointment: { scheduledAt: string } | null;
};
type Plan = { phases: Array<{ key: string; status: string }> };
type Branding = {
  partner: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  fontFamily: string | null;
  poweredBy: string;
};

/* Patient segment: mobile app frame, PATIENT-role protected. */
export default async function PatientLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (!user || user.role !== "PATIENT") {
    redirect({ href: "/login", locale });
  }
  if (user!.mustChangePassword) {
    redirect({ href: "/set-password", locale });
  }

  const [t, tp, format, summary, plan, branding] = await Promise.all([
    getTranslations("patient.header"),
    getTranslations("patient.plan.phases"),
    getFormatter(),
    apiServer<Summary>("/patient/summary"),
    apiServer<Plan>("/patient/plan"),
    apiServer<Branding>("/patient/branding"),
  ]);

  // Derived notifications (no dedicated table yet — computed from live state).
  const notifications: Notification[] = [];
  if (summary && !summary.todayLogged) {
    notifications.push({
      id: "log-due",
      icon: "timer",
      title: t("logDueTitle"),
      text: t("logDueText"),
      href: "/patient",
    });
  }
  if (summary?.nextAppointment) {
    const at = new Date(summary.nextAppointment.scheduledAt);
    notifications.push({
      id: "appointment",
      icon: "videocam",
      title: t("appointmentTitle"),
      text: t("appointmentText", {
        date: format.dateTime(at, { day: "numeric", month: "long" }),
        time: format.dateTime(at, { hour: "2-digit", minute: "2-digit" }),
      }),
      href: "/patient/appointments",
    });
  }
  const nextPhase = plan?.phases.find((p) => p.status === "pending");
  if (nextPhase) {
    notifications.push({
      id: "milestone",
      icon: "flag",
      title: t("milestoneTitle"),
      text: tp(`${nextPhase.key}.title`),
      href: "/patient/plan",
    });
  }

  const name = [user!.firstName, user!.lastName].filter(Boolean).join(" ") || user!.email;

  return (
    <PatientShell
      userName={name}
      notifications={notifications}
      branding={branding ?? null}
    >
      {children}
    </PatientShell>
  );
}

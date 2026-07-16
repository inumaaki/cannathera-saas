import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { apiServer } from "@/lib/api-server";
import { getSessionUser } from "@/lib/session";
import { DoctorShell } from "@/components/doctor/DoctorShell";

type Org = { branding: { logoUrl?: string } | null };

/* Doctor segment: Clinical Portal frame, DOCTOR-role protected. */
export default async function DoctorLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (!user || (user.role !== "DOCTOR" && user.role !== "ADMIN")) {
    redirect({ href: "/login", locale });
  }
  if (user!.mustChangePassword) {
    redirect({ href: "/set-password", locale });
  }

  const org = await apiServer<Org>("/doctor/practice");
  const name =
    ["Dr.", user!.firstName, user!.lastName].filter(Boolean).join(" ") || user!.email;

  return (
    <DoctorShell
      userName={name}
      logoUrl={org?.branding?.logoUrl ?? null}
      permissions={user!.permissions}
    >
      {children}
    </DoctorShell>
  );
}

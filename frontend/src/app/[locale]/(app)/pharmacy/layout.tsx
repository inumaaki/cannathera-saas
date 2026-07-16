import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { apiServer } from "@/lib/api-server";
import { getSessionUser } from "@/lib/session";
import { PharmacyShell, type Notice } from "@/components/pharmacy/PharmacyShell";

type Overview = {
  pharmacyName: string;
  reviewsDueSoon: Array<{
    id: string;
    name: string;
    diffDays: number;
    status: "overdue" | "dueSoon" | "onTrack";
  }>;
  stockAlert: { id: string; name: string; stockLevel: number; unit: string } | null;
};

/* Pharmacy segment: Portal frame, PHARMACY-role protected. */
export default async function PharmacyLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (!user || user.role !== "PHARMACY") {
    redirect({ href: "/login", locale });
  }
  if (user!.mustChangePassword) {
    redirect({ href: "/set-password", locale });
  }

  const [t, overview] = await Promise.all([
    getTranslations("pharmacy.shell"),
    apiServer<Overview>("/pharmacy/overview"),
  ]);
  const name =
    [user!.firstName, user!.lastName].filter(Boolean).join(" ") || user!.email;

  // Bell feed: overdue reviews first, then a stock shortage.
  const notices: Notice[] = [
    ...(overview?.reviewsDueSoon ?? [])
      .filter((r) => r.status === "overdue")
      .map((r) => ({
        id: r.id,
        icon: "assignment_late",
        tone: "critical" as const,
        text: t("noticeOverdue", { name: r.name, days: Math.abs(r.diffDays) }),
        href: `/pharmacy/reviews/${r.id}`,
      })),
    ...(overview?.stockAlert
      ? [
          {
            id: overview.stockAlert.id,
            icon: "inventory_2",
            tone: "warning" as const,
            text: t("noticeStock", {
              name: overview.stockAlert.name,
              level: overview.stockAlert.stockLevel,
              unit: overview.stockAlert.unit,
            }),
            href: "/pharmacy/inventory",
          },
        ]
      : []),
  ];

  return (
    <PharmacyShell
      userName={name}
      pharmacyName={overview?.pharmacyName ?? ""}
      notices={notices}
    >
      {children}
    </PharmacyShell>
  );
}

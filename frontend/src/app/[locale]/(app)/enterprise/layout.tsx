import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { apiServer } from "@/lib/api-server";
import { getSessionUser } from "@/lib/session";
import { EnterpriseShell, type Notice } from "@/components/enterprise/EnterpriseShell";

type Overview = {
  enterpriseName: string;
  overdueReviews: number;
  criticalFlags: number;
};
type Invoices = {
  rows: Array<{ id: string; number: string; amount: number; status: string }>;
};

/* Enterprise segment: portal frame, ENTERPRISE-role protected. */
export default async function EnterpriseLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (!user || user.role !== "ENTERPRISE") {
    redirect({ href: "/login", locale });
  }
  if (user!.mustChangePassword) {
    redirect({ href: "/set-password", locale });
  }

  const [t, format, overview, invoices] = await Promise.all([
    getTranslations("enterprise.shell"),
    getFormatter(),
    apiServer<Overview>("/enterprise/overview"),
    apiServer<Invoices>("/enterprise/billing/invoices?status=pending"),
  ]);

  const name =
    [user!.firstName, user!.lastName].filter(Boolean).join(" ") || user!.email;

  const openInvoice = invoices?.rows[0];
  const notices: Notice[] = [
    ...((overview?.overdueReviews ?? 0) > 0
      ? [
          {
            id: "overdue",
            icon: "assignment_late",
            text: t("noticeOverdue", { count: overview!.overdueReviews }),
            href: "/enterprise/partners",
          },
        ]
      : []),
    ...((overview?.criticalFlags ?? 0) > 0
      ? [
          {
            id: "flags",
            icon: "warning",
            text: t("noticeFlags", { count: overview!.criticalFlags }),
            href: "/enterprise/reports",
          },
        ]
      : []),
    ...(openInvoice
      ? [
          {
            id: openInvoice.id,
            icon: "receipt_long",
            text: t("noticeInvoice", {
              number: openInvoice.number,
              amount: format.number(openInvoice.amount, {
                style: "currency",
                currency: "EUR",
              }),
            }),
            href: "/enterprise/billing",
          },
        ]
      : []),
  ];

  return (
    <EnterpriseShell
      userName={name}
      networkName={overview?.enterpriseName ?? ""}
      notices={notices}
    >
      {children}
    </EnterpriseShell>
  );
}

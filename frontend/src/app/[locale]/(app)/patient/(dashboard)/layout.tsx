import { redirect } from "@/i18n/navigation";
import { apiServer } from "@/lib/api-server";
import { PaywallModal } from "@/components/paywall/PaywallModal";

export default async function DashboardLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  
  const summary = await apiServer<{ onboardingCompleted?: boolean; hasActiveSubscription: boolean }>("/patient/summary").catch(() => null);

  if (!summary) {
    // If summary fails to load (network error or unauthenticated), redirect to login
    redirect({ href: "/login", locale });
    return null;
  }

  if (summary.onboardingCompleted === false) {
    redirect({ href: "/patient/onboarding", locale });
  }

  // Block unpaid patients from viewing any dashboard page
  if (!summary.hasActiveSubscription) {
    return (
      <>
        <PaywallModal isOpen={true} type="patient" mandatory={true} />
        {children}
      </>
    );
  }

  return <>{children}</>;
}

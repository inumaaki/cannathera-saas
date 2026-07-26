import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingTrust } from "@/components/landing/LandingTrust";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function SecurityPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen max-w-full flex-col overflow-x-clip bg-white">
      <LandingHeader />
      <LandingTrust />
      <LandingFooter />
    </div>
  );
}

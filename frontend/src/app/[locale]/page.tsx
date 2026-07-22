import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingTrust } from "@/components/landing/LandingTrust";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingFounder } from "@/components/landing/LandingFounder";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function HomePage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <LandingHeader />
      <LandingHero />
      <LandingFeatures />
      <LandingTrust />
      <LandingPricing />
      <LandingFounder />
      <LandingFooter />
    </div>
  );
}

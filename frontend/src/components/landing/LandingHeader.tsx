"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/auth/LocaleSwitcher";

export function LandingHeader() {
  const t = useTranslations("common");
  const tl = useTranslations("landing.header");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-hairline bg-white/75 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group transition-transform duration-300 active:scale-[0.97]">
          <Image
            src="/brand/logo.png"
            alt="Cannathera Logo"
            width={34}
            height={34}
            className="rounded-full transition-transform duration-500 group-hover:rotate-[15deg] group-hover:scale-105"
          />
          <span className="font-display text-xl font-extrabold tracking-tight text-pine group-hover:text-pine-600 transition-colors">
            Cannathera
          </span>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-2 text-sm font-semibold text-muted bg-[#f5f8f6]/50 p-1 rounded-full border border-hairline/45">
          <Link href="/" className="px-4 py-1.5 rounded-full text-[#4a5e54] hover:text-pine hover:bg-white transition-all duration-200 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
            {tl("home")}
          </Link>
          <a href="#features" className="px-4 py-1.5 rounded-full hover:text-pine hover:bg-white transition-all duration-200 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
            {tl("features")}
          </a>
          <a href="#trust" className="px-4 py-1.5 rounded-full hover:text-pine hover:bg-white transition-all duration-200 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
            {tl("security")}
          </a>
          <a href="#pricing" className="px-4 py-1.5 rounded-full hover:text-pine hover:bg-white transition-all duration-200 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
            {tl("pricing")}
          </a>
          <a href="#founder" className="px-4 py-1.5 rounded-full hover:text-pine hover:bg-white transition-all duration-200 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
            {tl("founder")}
          </a>
        </nav>

        {/* Right CTAs */}
        <div className="flex items-center gap-3">
          <LocaleSwitcher direction="down" />
          <Link
            href="/login"
            className="text-sm font-bold text-muted hover:text-pine hover:bg-pine/5 px-3.5 py-1.5 rounded-full transition-all duration-200"
          >
            {t("login")}
          </Link>
          <Link
            href="/signup"
            className="flex h-9 items-center justify-center rounded-full bg-pine px-5 text-sm font-bold text-white transition-all duration-200 hover:bg-pine-600 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-md hover:shadow-lg shadow-pine/10"
          >
            {t("signup")}
          </Link>
        </div>
      </div>
    </header>
  );
}

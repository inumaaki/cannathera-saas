"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/auth/LocaleSwitcher";

export function LandingHeader() {
  const t = useTranslations("common");
  const tl = useTranslations("landing.header");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-hairline bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/brand/logo.png"
            alt="Cannathera Logo"
            width={34}
            height={34}
            className="rounded-full"
          />
          <span className="font-display text-xl font-bold tracking-tight text-pine">
            Cannathera
          </span>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted">
          <Link href="/" className="transition-colors hover:text-pine-600">
            {tl("home")}
          </Link>
          <a href="#features" className="transition-colors hover:text-pine-600">
            {tl("features")}
          </a>
          <a href="#trust" className="transition-colors hover:text-pine-600">
            {tl("security")}
          </a>
          <a href="#pricing" className="transition-colors hover:text-pine-600">
            {tl("pricing")}
          </a>
          <a href="#founder" className="transition-colors hover:text-pine-600">
            {tl("founder")}
          </a>
        </nav>

        {/* Right CTAs */}
        <div className="flex items-center gap-4">
          <LocaleSwitcher direction="down" />
          <Link
            href="/login"
            className="text-sm font-bold text-muted hover:text-ink-strong transition-colors"
          >
            {t("login")}
          </Link>
          <Link
            href="/signup"
            className="flex h-9 items-center justify-center rounded-lg bg-pine-600 px-4 text-sm font-bold text-white transition-colors hover:bg-pine shadow-sm"
          >
            {t("signup")}
          </Link>
        </div>
      </div>
    </header>
  );
}
